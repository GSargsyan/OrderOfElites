import React, { useState, useEffect, useRef, useContext, useCallback } from 'react'
import { request, formatMoney } from 'modules/Base'
import { UserPreviewCtx } from 'modules/Dashboard'


/**
 * Smooth counter component.
 * Takes a server-synced value and a rate_per_second,
 * interpolates at ~50ms intervals so the number appears
 * to change continuously regardless of backend tick interval.
 */
function SmoothCounter({ value, ratePerSecond, isMoney = false, decimals = 2 }) {
    const [displayValue, setDisplayValue] = useState(value)
    const rateRef = useRef(ratePerSecond)
    const intervalRef = useRef(null)

    // Resync when server value arrives
    useEffect(() => {
        setDisplayValue(value)
    }, [value])

    // Update rate ref without resetting interval
    useEffect(() => {
        rateRef.current = ratePerSecond
    }, [ratePerSecond])

    // Smooth interpolation loop: 50ms ticks (~20 FPS)
    useEffect(() => {
        intervalRef.current = setInterval(() => {
            if (rateRef.current > 0) {
                setDisplayValue(prev => prev + rateRef.current * 0.05)
            }
        }, 50)

        return () => clearInterval(intervalRef.current)
    }, [])

    const formatted = isMoney
        ? formatMoney(Math.floor(displayValue))
        : displayValue.toFixed(decimals)

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
                    <div>{drugData.precursor_qty.toFixed(2)} kg</div>
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
                                        ratePerSecond={step.rate_per_second}
                                        isMoney={true}
                                    />
                                ) : (
                                    <SmoothCounter
                                        value={step.output_qty}
                                        ratePerSecond={step.rate_per_second}
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
                                    ? drugData.steps[drugData.steps.length - 1].rate_per_second
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

    useEffect(() => {
        fetchData()
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
