import React, { useState, useEffect, useRef, useContext, useCallback } from 'react'
import { request, formatMoney } from 'modules/Base'
import { UserPreviewCtx } from 'modules/Dashboard'


/**
 * Smooth counter component using requestAnimationFrame.
 * Anchors to server values on each poll, interpolates between polls
 * using the provided rate. Uses exponential lerp (~300ms) to smoothly
 * converge to the server value, preventing visible jumps on re-sync.
 * Auto-pauses when tab is hidden (rAF behavior).
 */
function SmoothCounter({ value, ratePerSecond, isMoney = false, decimals = 2 }) {
    const displayRef = useRef(value)
    const anchorRef = useRef({ value, time: performance.now() })
    const rateRef = useRef(ratePerSecond)
    const lastFrameRef = useRef(null)
    const rafRef = useRef(null)
    const [rendered, setRendered] = useState(value)

    // ~300ms to cover 95% of the gap between display and target
    const LERP_SPEED = 10

    // When new server value arrives, update the anchor point
    useEffect(() => {
        anchorRef.current = { value, time: performance.now() }
    }, [value])

    // Update rate without resetting the animation loop
    useEffect(() => {
        rateRef.current = ratePerSecond
    }, [ratePerSecond])

    // requestAnimationFrame interpolation loop
    useEffect(() => {
        const tick = (timestamp) => {
            if (lastFrameRef.current !== null) {
                const dtSec = (timestamp - lastFrameRef.current) / 1000

                // If tab was hidden (large dt gap), skip this frame
                // and let the visibility handler fetch fresh data
                if (dtSec > 1) {
                    lastFrameRef.current = timestamp
                    rafRef.current = requestAnimationFrame(tick)
                    return
                }

                // Target = anchor value + rate × elapsed since anchor
                const anchor = anchorRef.current
                const elapsedSec = (timestamp - anchor.time) / 1000
                const target = anchor.value + rateRef.current * elapsedSec

                // Exponential lerp toward target (~300ms convergence)
                const diff = target - displayRef.current
                const lerpFactor = 1 - Math.exp(-LERP_SPEED * dtSec)
                displayRef.current += diff * lerpFactor

                // Quantities can't go negative
                if (displayRef.current < 0) displayRef.current = 0

                setRendered(displayRef.current)
            }
            lastFrameRef.current = timestamp
            rafRef.current = requestAnimationFrame(tick)
        }

        rafRef.current = requestAnimationFrame(tick)
        return () => cancelAnimationFrame(rafRef.current)
    }, []) // eslint-disable-line react-hooks/exhaustive-deps

    const formatted = isMoney
        ? formatMoney(Math.floor(rendered))
        : rendered.toFixed(decimals)

    return <span>{formatted}</span>
}


function DrugRow({ drugType, drugData, onRefresh }) {
    const { updateUserPreviewData } = useContext(UserPreviewCtx)

    const buyPrecursor = () => {
        request({
            url: 'black_market/buy_precursor',
            method: 'POST',
            data: { drug_type: drugType },
        })
        .then(() => {
            onRefresh()
            updateUserPreviewData()
        })
        .catch(err => console.error('Buy precursor error:', err))
    }

    const assignProfessional = (role) => {
        request({
            url: 'black_market/assign_professional',
            method: 'POST',
            data: { drug_type: drugType, role },
        })
        .then(() => onRefresh())
        .catch(err => console.error('Assign error:', err))
    }

    const removeProfessional = (role) => {
        request({
            url: 'black_market/remove_professional',
            method: 'POST',
            data: { drug_type: drugType, role },
        })
        .then(() => onRefresh())
        .catch(err => console.error('Remove error:', err))
    }

    const withdraw = () => {
        request({
            url: 'black_market/withdraw',
            method: 'POST',
            data: { drug_type: drugType },
        })
        .then(() => {
            onRefresh()
            updateUserPreviewData()
        })
        .catch(err => console.error('Withdraw error:', err))
    }

    const isLocked = !drugData.unlocked

    return (
        <div style={{
            opacity: isLocked ? 0.4 : 1,
            pointerEvents: isLocked ? 'none' : 'auto',
            marginBottom: '24px',
            padding: '12px',
            border: '1px solid #555',
        }}>
            <h3 style={{ textTransform: 'capitalize', marginBottom: '8px' }}>
                {drugType}
                {isLocked && <span> (Requires Rank {drugData.rank_required})</span>}
            </h3>

            <div style={{ display: 'flex', alignItems: 'center', gap: '20px', flexWrap: 'wrap' }}>
                {/* Precursor */}
                <div style={{ textAlign: 'center', minWidth: '100px' }}>
                    <div><strong>{drugData.precursor_name}</strong></div>
                    <div>
                        <SmoothCounter
                            value={drugData.precursor_qty}
                            ratePerSecond={drugData.precursor_rate_per_second}
                        />{' '}kg
                    </div>
                    <div style={{ fontSize: '0.85em', color: '#aaa' }}>
                        ${drugData.precursor_price}/kg
                    </div>
                    <button onClick={buyPrecursor}>Buy 1 kg</button>
                </div>

                <span>→</span>

                {/* Production steps */}
                {drugData.steps.map((step, idx) => (
                    <React.Fragment key={step.role}>
                        <div style={{ textAlign: 'center', minWidth: '120px' }}>
                            <div><strong>{step.label}</strong></div>
                            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '6px' }}>
                                <button onClick={() => removeProfessional(step.role)}>▼</button>
                                <span>{step.count}</span>
                                <button onClick={() => assignProfessional(step.role)}>▲</button>
                            </div>
                            {step.training_count > 0 && (
                                <div style={{ fontSize: '0.8em', color: '#f0c040' }}>
                                    ({step.training_count} training)
                                </div>
                            )}
                            <div>
                                {step.is_money_step ? (
                                    <SmoothCounter
                                        value={step.output_qty}
                                        ratePerSecond={step.net_output_rate}
                                        isMoney={true}
                                    />
                                ) : (
                                    <SmoothCounter
                                        value={step.output_qty}
                                        ratePerSecond={step.net_output_rate}
                                    />
                                )}
                                {step.is_money_step
                                    ? <span style={{ fontSize: '0.8em', color: '#aaa' }}>
                                        {' '}(@ ${step.current_price?.toFixed(2)}/unit)
                                      </span>
                                    : <span style={{ fontSize: '0.85em' }}> units</span>
                                }
                            </div>
                        </div>

                        {idx < drugData.steps.length - 1 && <span>→</span>}
                    </React.Fragment>
                ))}

                <span>→</span>

                {/* Withdraw */}
                <div style={{ textAlign: 'center', minWidth: '100px' }}>
                    <div><strong>Revenue</strong></div>
                    <div>
                        <SmoothCounter
                            value={drugData.pending_money}
                            ratePerSecond={
                                drugData.steps.length > 0
                                    ? drugData.steps[drugData.steps.length - 1].net_output_rate
                                    : 0
                            }
                            isMoney={true}
                        />
                    </div>
                    <button onClick={withdraw}>Withdraw</button>
                </div>
            </div>
        </div>
    )
}


function BlackMarketTab() {
    const [tabData, setTabData] = useState(null)

    const fetchData = useCallback(() => {
        request({
            url: 'black_market/get_tab_data',
            method: 'POST',
        })
        .then(response => {
            setTabData(response.data)
        })
        .catch(err => console.error('Black Market tab data error:', err))
    }, [])

    // Fetch on mount
    useEffect(() => {
        fetchData()
    }, [fetchData])

    // Poll every 10s to re-sync with server truth
    useEffect(() => {
        const interval = setInterval(fetchData, 10000)
        return () => clearInterval(interval)
    }, [fetchData])

    // Re-fetch immediately when tab becomes visible (after being hidden)
    useEffect(() => {
        const handleVisibility = () => {
            if (document.visibilityState === 'visible') {
                fetchData()
            }
        }
        document.addEventListener('visibilitychange', handleVisibility)
        return () => document.removeEventListener('visibilitychange', handleVisibility)
    }, [fetchData])

    if (tabData === null) {
        return <div className="loading-text">LOADING BLACK MARKET...</div>
    }

    return (
        <div>
            <div style={{ marginBottom: '16px' }}>
                <strong>Professionals: </strong>
                {tabData.total_professionals} / {tabData.max_professionals}
            </div>

            {Object.entries(tabData.drug_rows).map(([drugType, drugData]) => (
                <DrugRow
                    key={drugType}
                    drugType={drugType}
                    drugData={drugData}
                    onRefresh={fetchData}
                />
            ))}
        </div>
    )
}


export default BlackMarketTab
