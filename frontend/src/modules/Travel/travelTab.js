import React, { useState, useEffect, useContext, useCallback } from 'react'
import { request, formatMoney } from 'modules/Base'
import { UserPreviewCtx } from 'modules/Dashboard'

// Airplane images (same as Items tab)
import airplaneCorvus from 'assets/pictures/airplanes/airplane_corvus.png'
import airplaneMachIv from 'assets/pictures/airplanes/airplane_mach_iv.png'
import airplaneSentinelle from 'assets/pictures/airplanes/airplane_sentinelle.png'

const AIRPLANE_IMAGES = {
    corvus: airplaneCorvus,
    mach_iv: airplaneMachIv,
    sentinelle: airplaneSentinelle,
}

// Simple stopwatch formatter: returns "Xh Ym" or "Ym"
function formatMinutes(totalMinutes) {
    const h = Math.floor(totalMinutes / 60)
    const m = Math.round(totalMinutes % 60)
    if (h > 0) return `${h}h ${m}m`
    return `${m}m`
}

// Remaining time formatter for live countdown (no seconds)
function formatCountdown(secondsRemaining) {
    const totalMins = Math.floor(secondsRemaining / 60)
    const h = Math.floor(totalMins / 60)
    const m = totalMins % 60
    if (h > 0) return `${h}h ${m}m`
    if (m > 0) return `${m}m`
    return 'Arriving...'
}

const TRAVEL_TIME_REDUCER = 2.32

function TravelTab() {
    const [travelData, setTravelData] = useState(null)
    const [selectedCity, setSelectedCity] = useState(null)
    const [selectedAirplane, setSelectedAirplane] = useState(null)
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [error, setError] = useState(null)
    const [arrivalCountdown, setArrivalCountdown] = useState(0)
    const [cooldownCountdown, setCooldownCountdown] = useState(0)

    const { updateUserPreviewData } = useContext(UserPreviewCtx)

    const loadTravelData = useCallback(() => {
        request({ url: 'travel/get_travel_tab_data', method: 'POST' })
            .then(res => {
                setTravelData(res.data)

                // Set live countdowns
                const now = Math.floor(Date.now() / 1000)
                if (res.data.active_flight) {
                    setArrivalCountdown(Math.max(0, Math.floor(res.data.active_flight.arrival_time - now)))
                }
                if (res.data.cooldown_until > 0) {
                    setCooldownCountdown(Math.max(0, Math.floor(res.data.cooldown_until - now)))
                }
            })
            .catch(err => console.error('TravelTab load error:', err))
    }, [])

    useEffect(() => {
        loadTravelData()
    }, [loadTravelData])

    // Countdown timers
    useEffect(() => {
        if (arrivalCountdown <= 0 && cooldownCountdown <= 0) return

        const interval = setInterval(() => {
            setArrivalCountdown(v => {
                const next = Math.max(0, v - 1)
                if (next === 0 && v > 0) {
                    // Flight just completed — refresh data
                    setTimeout(() => {
                        loadTravelData()
                        updateUserPreviewData()
                    }, 1500)
                }
                return next
            })
            setCooldownCountdown(v => Math.max(0, v - 1))
        }, 1000)

        return () => clearInterval(interval)
    }, [arrivalCountdown, cooldownCountdown, loadTravelData, updateUserPreviewData])

    const handleTravel = () => {
        if (!selectedCity || !selectedAirplane || isSubmitting) return
        setError(null)
        setIsSubmitting(true)

        request({
            url: 'travel/initiate_travel',
            method: 'POST',
            data: {
                destination_city: selectedCity,
                airplane_key: selectedAirplane,
            }
        })
            .then(res => {
                updateUserPreviewData()
                loadTravelData()
                setSelectedCity(null)
                setSelectedAirplane(null)
            })
            .catch(err => {
                setError(err.response?.data?.message || 'Travel failed.')
            })
            .finally(() => setIsSubmitting(false))
    }

    if (!travelData) {
        return <div className="loading-text">LOADING TRAVEL DATA...</div>
    }

    const {
        current_city,
        destination_cities,
        routes,
        available_airplanes,
        active_flight,
        cooldown_until,
    } = travelData

    const isInFlight = !!active_flight
    const isOnCooldown = cooldownCountdown > 0

    // Calculate preview for selected city + airplane
    let flightPreview = null
    if (selectedCity && selectedAirplane && routes[selectedCity]) {
        const route = routes[selectedCity]
        const airplane = available_airplanes.find(a => a.key === selectedAirplane)
        if (airplane) {
            const ticketCost = Math.round(route.cost * airplane.price_multiplier)
            const actualMinutes = route.time_minutes / (TRAVEL_TIME_REDUCER * airplane.speed_multiplier)
            flightPreview = {
                cost: ticketCost,
                flightTime: formatMinutes(actualMinutes),
                cooldown: airplane.cooldown,
                arrivalTs: Math.floor(Date.now() / 1000) + Math.ceil(actualMinutes * 60),
            }
        }
    }

    return (
        <div className="travel-tab">
            {/* Notice */}
            <div className="travel-notice">
                ✈ During the duration of a flight, Missions, Skills and Black Market will be unavailable.
            </div>

            {/* Active flight display */}
            {isInFlight ? (
                <div className="travel-active-flight">
                    <div className="travel-active-header">
                        <span className="travel-active-icon">✈</span>
                        <span className="travel-active-title">EN ROUTE</span>
                    </div>
                    <div className="travel-active-route">
                        <span className="travel-active-city">{active_flight.origin_city}</span>
                        <span className="travel-active-arrow">→</span>
                        <span className="travel-active-city travel-active-city--dest">
                            {active_flight.destination_city}
                        </span>
                    </div>
                    <div className="travel-active-eta">
                        {arrivalCountdown > 0
                            ? `Arriving in ${formatCountdown(arrivalCountdown)}`
                            : 'Landing soon...'}
                    </div>
                    <div className="travel-active-airplane">
                        ✈ {active_flight.airplane.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}
                    </div>
                </div>
            ) : isOnCooldown ? (
                <div className="travel-cooldown-notice">
                    <div className="travel-cooldown-icon">⏱</div>
                    <div className="travel-cooldown-title">AIRPLANE ON COOLDOWN</div>
                    <div className="travel-cooldown-remaining">
                        Ready in {formatCountdown(cooldownCountdown)}
                    </div>
                </div>
            ) : (
                <>
                    {/* Destination selection */}
                    <div className="travel-section">
                        <div className="travel-section-title">SELECT DESTINATION</div>
                        <div className="travel-cities-grid">
                            {destination_cities.map(city => {
                                const route = routes[city]
                                return (
                                    <div
                                        key={city}
                                        className={`travel-city-card ${selectedCity === city ? 'selected' : ''}`}
                                        onClick={() => setSelectedCity(city)}
                                    >
                                        <div className="travel-city-name">{city}</div>
                                        <div className="travel-city-meta">
                                            <span className="travel-city-cost">
                                                from {formatMoney(route.cost)}
                                            </span>
                                            <span className="travel-city-time">
                                                ≈ {formatMinutes(route.time_minutes / TRAVEL_TIME_REDUCER)}
                                            </span>
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    </div>

                    {/* Airplane selection */}
                    <div className="travel-section">
                        <div className="travel-section-title">SELECT AIRPLANE</div>
                        <div className="travel-airplanes-grid">
                            {available_airplanes.map(airplane => (
                                <div
                                    key={airplane.key}
                                    className={`travel-airplane-card ${selectedAirplane === airplane.key ? 'selected' : ''}`}
                                    onClick={() => setSelectedAirplane(airplane.key)}
                                >
                                    {AIRPLANE_IMAGES[airplane.key] && (
                                        <img
                                            className="travel-airplane-img"
                                            src={AIRPLANE_IMAGES[airplane.key]}
                                            alt={airplane.name}
                                        />
                                    )}
                                    {airplane.key === 'commercial_flight' && (
                                        <div className="travel-airplane-img travel-airplane-img--commercial">✈</div>
                                    )}
                                    <div className="travel-airplane-info">
                                        <div className="travel-airplane-name">{airplane.name}</div>
                                        <div className="travel-airplane-stats">
                                            <span>{airplane.speed_multiplier}x speed</span>
                                            <span>Cooldown: {airplane.cooldown}</span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Flight Summary */}
                    {flightPreview && (
                        <div className="travel-summary-box">
                            <div className="travel-summary-title">FLIGHT SUMMARY</div>
                            <div className="travel-summary-grid">
                                <div className="travel-summary-item">
                                    <span className="travel-summary-label">ROUTE</span>
                                    <span className="travel-summary-value">
                                        {current_city} → {selectedCity}
                                    </span>
                                </div>
                                <div className="travel-summary-item">
                                    <span className="travel-summary-label">TICKET PRICE</span>
                                    <span className="travel-summary-value travel-summary-cost">
                                        {formatMoney(flightPreview.cost)}
                                    </span>
                                </div>
                                <div className="travel-summary-item">
                                    <span className="travel-summary-label">FLIGHT TIME</span>
                                    <span className="travel-summary-value">{flightPreview.flightTime}</span>
                                </div>
                                <div className="travel-summary-item">
                                    <span className="travel-summary-label">POST-FLIGHT COOLDOWN</span>
                                    <span className="travel-summary-value">{flightPreview.cooldown}</span>
                                </div>
                            </div>
                        </div>
                    )}

                    {error && <div className="travel-error">{error}</div>}

                    <button
                        className="btn-travel"
                        disabled={!selectedCity || !selectedAirplane || isSubmitting}
                        onClick={handleTravel}
                    >
                        {isSubmitting ? 'INITIATING...' : '✈ DEPART'}
                    </button>
                </>
            )}
        </div>
    )
}

export default TravelTab
