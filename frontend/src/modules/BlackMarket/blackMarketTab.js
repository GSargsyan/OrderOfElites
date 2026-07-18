import React, { useState, useEffect, useRef, useContext, useCallback } from 'react'
import { request, formatMoney } from 'modules/Base'
import { UserPreviewCtx } from 'modules/Dashboard'

import alcoholGrains from 'assets/pictures/black_market/alcohol_grains.png'
import alcoholBrewer from 'assets/pictures/black_market/alcohol_brewer.png'
import alcoholDistributor from 'assets/pictures/black_market/alcohol_distributor.png'
import cannabisSeed from 'assets/pictures/black_market/cannabis_seed.png'
import cannabisBotanist from 'assets/pictures/black_market/cannabis_botanist.png'
import cannabisTrimmer from 'assets/pictures/black_market/cannabis_trimmer.png'
import cannabisDealer from 'assets/pictures/black_market/cannabis_dealer.png'
import methPrecursors from 'assets/pictures/black_market/methamphetamine_meth_precursor.png'
import methChemist from 'assets/pictures/black_market/methamphetamine_chemist.png'
import methCook from 'assets/pictures/black_market/methamphetamine_cook.png'
import methCrystalizer from 'assets/pictures/black_market/methamphetamine_crystalizer.png'
import methDealer from 'assets/pictures/black_market/methamphetamine_dealer.png'
import cocaLeaves from 'assets/pictures/black_market/cocaine_coca_leaves.png'
import cokePicker from 'assets/pictures/black_market/cocaine_raw_crop.png'
import cokePasteMaker from 'assets/pictures/black_market/cocaine_paste_maker.png'
import cokeRefiner from 'assets/pictures/black_market/cocaine_refiner.png'
import cokeDealer from 'assets/pictures/black_market/cocaine_dealer.png'

const PRECURSOR_IMAGES = {
    alcohol: alcoholGrains,
    cannabis: cannabisSeed,
    methamphetamine: methPrecursors,
    cocaine: cocaLeaves,
}

const ROLE_IMAGES = {
    brewer: alcoholBrewer,
    distributor: alcoholDistributor,
    botanist: cannabisBotanist,
    trimmer: cannabisTrimmer,
    dealer: cannabisDealer,
    chemist: methChemist,
    cook: methCook,
    crystalizer: methCrystalizer,
    meth_dealer: methDealer,
    picker: cokePicker,
    paste_maker: cokePasteMaker,
    refiner: cokeRefiner,
    coke_dealer: cokeDealer,
}


/**
 * Tracks Shift/Ctrl modifier state so buy buttons can offer bulk purchases.
 * Resets on window blur since keyup won't fire if focus is lost while held.
 */
function useBuyMultiplier() {
    const [multiplier, setMultiplier] = useState(1)

    useEffect(() => {
        const updateFromEvent = (e) => {
            if (e.ctrlKey) setMultiplier(100)
            else if (e.shiftKey) setMultiplier(5)
            else setMultiplier(1)
        }
        const reset = () => setMultiplier(1)

        window.addEventListener('keydown', updateFromEvent)
        window.addEventListener('keyup', updateFromEvent)
        window.addEventListener('blur', reset)
        return () => {
            window.removeEventListener('keydown', updateFromEvent)
            window.removeEventListener('keyup', updateFromEvent)
            window.removeEventListener('blur', reset)
        }
    }, [])

    return multiplier
}


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


/**
 * Dotted connector between two production nodes. When `active`, small
 * glowing lights travel left-to-right along the dotted line to signal
 * that material is actively flowing through this stage of the chain.
 */
function Connector({ active }) {
    return (
        <div className={`bm-connector${active ? ' active' : ''}`}>
            <div className="bm-connector-track">
                <span className="bm-connector-light" />
                <span className="bm-connector-light" />
                <span className="bm-connector-light" />
            </div>
        </div>
    )
}


function DrugRow({ drugType, drugData, buyMultiplier, onRefresh }) {
    const { updateUserPreviewData } = useContext(UserPreviewCtx)

    const buyPrecursor = () => {
        request({
            url: 'black_market/buy_precursor',
            method: 'POST',
            data: { drug_type: drugType, quantity: buyMultiplier },
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

    const sell = () => {
        request({
            url: 'black_market/sell',
            method: 'POST',
            data: { drug_type: drugType },
        })
        .then(() => {
            onRefresh()
            updateUserPreviewData()
        })
        .catch(err => console.error('Sell error:', err))
    }

    const isLocked = !drugData.unlocked
    const lastStep = drugData.steps.length > 0 ? drugData.steps[drugData.steps.length - 1] : null

    // Whether material is actively flowing across each connector segment,
    // derived from the consumption/production rates already in drugData.
    const connectorActive = drugData.steps.map(step => step.consume_rate_per_second > 0)
    connectorActive.push(lastStep ? lastStep.rate_per_second > 0 : false)

    const buyLabel = buyMultiplier === 1 ? 'Buy 1 Unit' : `Buy ${buyMultiplier} Units`

    return (
        <div className={`bm-drug-card${isLocked ? ' locked' : ''}`}>
            <h3 className="bm-drug-title">{drugType}</h3>

            <div className="bm-chain-container">
                <div className="bm-chain-wrapper">
                    <div className="bm-chain">
                        {/* Precursor node */}
                        <div className="bm-node bm-node-precursor">
                            <img className="bm-node-image" src={PRECURSOR_IMAGES[drugType]} alt={drugData.precursor_name} />
                            <div className="bm-node-label">{drugData.precursor_name}</div>
                            <div className="bm-node-qty">
                                <SmoothCounter
                                    value={drugData.precursor_qty}
                                    ratePerSecond={drugData.precursor_rate_per_second}
                                />{' '}units
                            </div>
                            <div className="bm-node-sub">${drugData.precursor_price}/unit</div>
                            <button className="btn-buy bm-buy-btn" onClick={buyPrecursor}>{buyLabel}</button>
                        </div>

                        <Connector active={connectorActive[0]} />

                        {/* Production steps */}
                        {drugData.steps.map((step, idx) => (
                            <React.Fragment key={step.role}>
                                <div className="bm-node bm-node-step">
                                    <img className="bm-node-image" src={ROLE_IMAGES[step.role]} alt={step.label} />
                                    <div className="bm-node-label">{step.label}</div>
                                    <div className="bm-step-controls">
                                        <button className="bm-step-btn" onClick={() => removeProfessional(step.role)}>−</button>
                                        <span className="bm-step-count">{step.count}</span>
                                        <button className="bm-step-btn" onClick={() => assignProfessional(step.role)}>+</button>
                                    </div>
                                    {step.training_count > 0 && (
                                        <div className="bm-training-badge">{step.training_count} training</div>
                                    )}
                                    <div className="bm-node-qty">
                                        <SmoothCounter
                                            value={step.output_qty}
                                            ratePerSecond={step.net_output_rate}
                                        />{' '}units
                                    </div>
                                </div>

                                <Connector active={connectorActive[idx + 1]} />
                            </React.Fragment>
                        ))}

                        {/* Revenue / sell node */}
                        <div className="bm-node bm-node-revenue">
                            <div className="bm-revenue-icon">$</div>
                            <div className="bm-node-label">Stash Value</div>
                            <div className="bm-node-qty bm-revenue-value">
                                <SmoothCounter
                                    value={drugData.stash_qty * drugData.current_price}
                                    ratePerSecond={lastStep ? lastStep.net_output_rate * drugData.current_price : 0}
                                    isMoney={true}
                                />
                            </div>
                            <div className="bm-node-sub">${drugData.current_price?.toFixed(2)}/unit</div>
                            <button className="bm-sell-btn" onClick={sell}>Sell</button>
                        </div>
                    </div>
                </div>

                {isLocked && (
                    <div className="bm-lock-overlay">
                        <span className="bm-lock-icon" aria-hidden="true">🔒</span>
                        <span className="bm-lock-text">Unlocks at Rank {drugData.rank_required}</span>
                    </div>
                )}
            </div>
        </div>
    )
}


function BlackMarketTab() {
    const [tabData, setTabData] = useState(null)
    const buyMultiplier = useBuyMultiplier()

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

    const profPercent = tabData.max_professionals > 0
        ? Math.min(100, (tabData.total_professionals / tabData.max_professionals) * 100)
        : 0

    return (
        <div className="bm-container">
            <div className="bm-professionals-bar">
                <div className="bm-professionals-top">
                    <span className="bm-professionals-label">Professionals</span>
                    <span className="bm-professionals-value">
                        {tabData.total_professionals} / {tabData.max_professionals}
                    </span>
                </div>
                <div className="progress-bar-track">
                    <div className="progress-bar-fill" style={{ width: `${profPercent}%` }} />
                </div>
            </div>

            {buyMultiplier > 1 && (
                <div className="bm-multiplier-hint">
                    {buyMultiplier === 100 ? 'CTRL held — bulk purchase ×100' : 'SHIFT held — bulk purchase ×5'}
                </div>
            )}

            {Object.entries(tabData.drug_rows).map(([drugType, drugData]) => (
                <DrugRow
                    key={drugType}
                    drugType={drugType}
                    drugData={drugData}
                    buyMultiplier={buyMultiplier}
                    onRefresh={fetchData}
                />
            ))}
        </div>
    )
}


export default BlackMarketTab
