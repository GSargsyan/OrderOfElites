// import axios from 'axios'
import React, { createContext, useState, useEffect, memo, useRef, useCallback } from 'react'

import ChatContainer from 'modules/Chat/chatContainer.js'
import MissionsTab from 'modules/Missions/missionsTab.js'
import SkillsTab from 'modules/Skills/skillsTab.js'
import BlackMarketTab from 'modules/BlackMarket/blackMarketTab.js'
import ItemsTab from 'modules/Items/itemsTab.js'
import NetworkingTab from 'modules/Networking/networkingTab.js'
import TravelTab from 'modules/Travel/travelTab.js'
import FlightOverlay from 'modules/Travel/flightOverlay.js'
import UserProfileModal from 'modules/Dashboard/userProfile.js'
import { request, formatMoney } from 'modules/Base'
import Footer from 'modules/Home/footer'
import 'styles/dashboard.css'


export const UserPreviewCtx = createContext()

// Tabs that are blocked while the user is in-flight
const FLIGHT_BLOCKED_TABS = ['missions', 'skills', 'black_market', 'items']

function Dashboard() {
    const [activeTab, setActiveTab] = useState('dashboard')
    const [userPreviewData, setUserPreviewData] = useState(null)
    const [userProfileData, setUserProfileData] = useState(null)
    const [showUserProfileModal, setShowUserProfileModal] = useState(false)

    // chat states
    const [messageUser, setMessageUser] = useState(null)
    const [focusChatInput, setFocusChatInput] = useState(false)

    const updateUserPreviewData = useCallback(() => {
        request({
            'url': 'users/get_preview',
            'method': 'POST',
        })
            .then(response => {
                setUserPreviewData(response.data)
            })
    }, [])

    const tabComponents = {
        'dashboard': {
            'component': DashboardTab,
            'label': 'Dashboard',
            'props': {}
        },
        'missions': {
            'component': MissionsTab,
            'label': 'Missions',
            'props': {}
        },
        'skills': {
            'component': SkillsTab,
            'label': 'Skills',
            'props': {}
        },
        'black_market': {
            'component': BlackMarketTab,
            'label': 'Black Market',
            'props': {}
        },
        'items': {
            'component': ItemsTab,
            'label': 'Items',
            'props': {}
        },
        'travel': {
            'component': TravelTab,
            'label': 'Travel',
            'props': {}
        },
        'networking': {
            'component': NetworkingTab,
            'label': 'Networking',
            'props': {
                'setUserProfileData': setUserProfileData,
                'setShowUserProfileModal': setShowUserProfileModal,
            }
        },
    }

    useEffect(() => {
        updateUserPreviewData()
    }, [])

    const isInFlight = userPreviewData?.in_flight || false
    const flightData = userPreviewData?.flight_data || null

    return (
        <div className="dashboard-wrapper" data-city={userPreviewData?.city}>
            {/* ── Header Bar ─────────────────────────── */}
            <div className="header-bar">
                <h1 className="game-title">
                    Order <span className="accent">of</span> Elites
                </h1>

                <UserPreview
                    userPreviewData={userPreviewData}
                    isInFlight={isInFlight}
                    flightData={flightData}
                />
            </div>

            {/* ── Center Layout ──────────────────────── */}
            <UserPreviewCtx.Provider value={{ userPreviewData, updateUserPreviewData }}>
                <div className="center-layout">
                    <ChatContainer messageUser={messageUser} />

                    <GameDash
                        tabComponents={tabComponents}
                        activeTab={activeTab}
                        isInFlight={isInFlight}
                        flightData={flightData}
                        setUserProfileData={setUserProfileData}
                    />

                    <MenuItems
                        tabComponents={tabComponents}
                        activeTab={activeTab}
                        setActiveTab={setActiveTab}
                        isInFlight={isInFlight}
                    />
                </div>

                {showUserProfileModal && (
                    <UserProfileModal
                        userProfileData={userProfileData}
                        onClose={() => setShowUserProfileModal(false)}
                        onMessageClick={(messageUsername) => {
                            setMessageUser(messageUsername)
                            setShowUserProfileModal(false)
                        }}
                    />
                )}
            </UserPreviewCtx.Provider>
            <Footer />
        </div>
    )
}

function MenuItems({ tabComponents, activeTab, setActiveTab, isInFlight }) {
    return (
        <div className="menu-panel glass-panel">
            {Object.keys(tabComponents).map(tabKey => {
                return (
                    <button
                        className={`menu-btn ${activeTab === tabKey ? 'active' : ''}`}
                        key={tabKey}
                        onClick={() => setActiveTab(tabKey)}
                    >
                        {tabComponents[tabKey].label}
                    </button>
                )
            })}
        </div>
    )
}

function GameDash({
    tabComponents,
    activeTab,
    isInFlight,
    flightData,
    setUserProfileData,
    setShowUserProfileModal
}) {
    const isBlockedByFlight = isInFlight && FLIGHT_BLOCKED_TABS.includes(activeTab)

    return (
        <div
            key={isBlockedByFlight ? 'flight-overlay' : activeTab}
            className='central-panel glass-panel'
            style={{ position: 'relative' }}
        >
            {isBlockedByFlight ? (
                <FlightOverlay />
            ) : (
                React.createElement(tabComponents[activeTab].component,
                    tabComponents[activeTab].props)
            )}
        </div>
    )
}

const AnimatedMoney = ({ value }) => {
    const [displayValue, setDisplayValue] = useState(value)
    const [diffs, setDiffs] = useState([])
    const prevValueRef = useRef(value)

    useEffect(() => {
        if (value !== prevValueRef.current) {
            const diff = value - prevValueRef.current
            
            if (diff !== 0) {
                const newDiff = {
                    id: Date.now() + Math.random(),
                    amount: diff,
                }
                setDiffs(prev => [...prev, newDiff])
                
                setTimeout(() => {
                    setDiffs(prev => prev.filter(d => d.id !== newDiff.id))
                }, 2000)
            }

            const startValue = prevValueRef.current
            const endValue = value
            const duration = 300
            const startTime = performance.now()

            const animate = (currentTime) => {
                const elapsedTime = currentTime - startTime
                const progress = Math.min(elapsedTime / duration, 1)
                
                const currentVal = Math.round(startValue + (endValue - startValue) * progress)
                setDisplayValue(currentVal)

                if (progress < 1) {
                    requestAnimationFrame(animate)
                } else {
                    setDisplayValue(endValue)
                }
            }

            requestAnimationFrame(animate)
            prevValueRef.current = value
        }
    }, [value])

    return (
        <span className="animated-money-container">
            <span className="money-diffs-container">
                {diffs.map(d => (
                    <span 
                        key={d.id} 
                        className={`money-diff ${d.amount >= 0 ? 'diff-positive' : 'diff-negative'}`}
                    >
                        {d.amount >= 0 ? '+' : '-'} {formatMoney(Math.abs(d.amount))}
                    </span>
                ))}
            </span>
            <span>{formatMoney(displayValue)}</span>
        </span>
    )
}


/**
 * FlightRouteIndicator
 * Shows: OriginCity ...●...●...● DestinationCity
 * with a progress-based animated dots line and an ETA label on top (hours/minutes, no seconds).
 */
function FlightRouteIndicator({ flightData }) {
    const [etaLabel, setEtaLabel] = useState('')
    const [progress, setProgress] = useState(0)

    useEffect(() => {
        const tick = () => {
            const now = Math.floor(Date.now() / 1000)
            const total = flightData.arrival_time - flightData.departed_at
            const elapsed = now - flightData.departed_at
            const remaining = Math.max(0, flightData.arrival_time - now)

            // Progress 0→1
            const pct = total > 0 ? Math.min(1, elapsed / total) : 0
            setProgress(pct)

            // ETA label (no seconds)
            const totalMins = Math.floor(remaining / 60)
            const h = Math.floor(totalMins / 60)
            const m = totalMins % 60
            if (remaining <= 0) {
                setEtaLabel('Arriving...')
            } else if (h > 0) {
                setEtaLabel(`${h}h ${m}m`)
            } else {
                setEtaLabel(`${m}m`)
            }
        }

        tick()
        const interval = setInterval(tick, 10000) // update every 10s (no seconds shown)
        return () => clearInterval(interval)
    }, [flightData])

    // 7 dots total — light up based on progress
    const DOT_COUNT = 7
    const litDots = Math.round(progress * DOT_COUNT)

    return (
        <div className="flight-route-indicator">
            <div className="flight-route-eta">{etaLabel}</div>
            <div className="flight-route-track">
                <span className="flight-route-city flight-route-city--origin">
                    {flightData.origin_city}
                </span>
                <div className="flight-route-dots">
                    {Array.from({ length: DOT_COUNT }).map((_, i) => (
                        <span
                            key={i}
                            className={`flight-route-dot ${i < litDots ? 'flight-route-dot--lit' : ''}`}
                        />
                    ))}
                </div>
                <span className="flight-route-city flight-route-city--dest">
                    {flightData.destination_city}
                </span>
            </div>
        </div>
    )
}


const UserPreview = memo(({ userPreviewData, isInFlight, flightData }) => {
    return (
        <div className="user-preview-bar glass-panel">
            {userPreviewData ? (
                <>
                    <div className="user-preview-top">
                        <span className="user-preview-username">{userPreviewData.username}</span>

                        {isInFlight && flightData ? (
                            <FlightRouteIndicator flightData={flightData} />
                        ) : (
                            <span className="user-preview-city">{userPreviewData.city.toUpperCase()}</span>
                        )}

                        <span className="user-preview-money"><AnimatedMoney value={userPreviewData.money_cash} /></span>
                    </div>

                    <div className="progress-bar-track">
                        <div
                            className="progress-bar-fill"
                            style={{ width: `${Math.floor(userPreviewData.rank_progress)}%` }}
                        />
                    </div>

                    <div className="user-preview-stats" style={{ marginTop: '6px' }}>
                        <span className="stat-item">
                            <span className="stat-label">RANK</span>
                            <span className="stat-value">{userPreviewData.rank}</span>
                            <span className="stat-progress">({Math.floor(userPreviewData.rank_progress)}%)</span>
                        </span>
                        <span className="stat-sep">|</span>
                        <span className="stat-item">
                            <span className="stat-label">ATTACK</span>
                            <span className="stat-value">{userPreviewData.attack_points}</span>
                        </span>
                        <span className="stat-sep">|</span>
                        <span className="stat-item">
                            <span className="stat-label">DEFENSE</span>
                            <span className="stat-value">{userPreviewData.defense_points}</span>
                        </span>
                        <span className="stat-sep">|</span>
                        <span className="stat-item">
                            <span className="stat-label">DRIVING</span>
                            <span className="stat-value">{userPreviewData.driving_points}</span>
                        </span>
                    </div>
                </>
            ) : (
                <p className="loading-text">LOADING...</p>
            )}
        </div>
    )
})



function DashboardTab() {
    return (
        <div className="dashboard-welcome">
            <h2>WELCOME, OPERATIVE</h2>
            <p>
                The Citadel awaits your next move.
                Select a section from the menu to begin operations.
            </p>
        </div>
    )
}

export default Dashboard
