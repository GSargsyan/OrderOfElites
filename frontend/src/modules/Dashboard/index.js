// import axios from 'axios'
import React, { createContext, useState, useEffect, memo, useRef } from 'react'

import ChatContainer from 'modules/Chat/chatContainer.js'
import MissionsTab from 'modules/Missions/missionsTab.js'
import SkillsTab from 'modules/Skills/skillsTab.js'
import BlackMarketTab from 'modules/BlackMarket/blackMarketTab.js'
import ItemsTab from 'modules/Items/itemsTab.js'
import NetworkingTab from 'modules/Networking/networkingTab.js'
import UserProfileModal from 'modules/Dashboard/userProfile.js'
import { request, formatMoney } from 'modules/Base'
import Footer from 'modules/Home/footer'
import 'styles/dashboard.css'


export const UserPreviewCtx = createContext()

function Dashboard() {
    const [activeTab, setActiveTab] = useState('dashboard')
    const [userPreviewData, setUserPreviewData] = useState(null)
    const [userProfileData, setUserProfileData] = useState(null)
    const [showUserProfileModal, setShowUserProfileModal] = useState(false)

    // chat states
    const [messageUser, setMessageUser] = useState(null)
    const [focusChatInput, setFocusChatInput] = useState(false)

    const updateUserPreviewData = () => {
        request({
            'url': 'users/get_preview',
            'method': 'POST',
        })
            .then(response => {
                console.log(response.data)
                setUserPreviewData(response.data)
            })
    }

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

    return (
        <div className="dashboard-wrapper">
            {/* ── Header Bar ─────────────────────────── */}
            <div className="header-bar">
                <h1 className="game-title">
                    Order <span className="accent">of</span> Elites
                </h1>

                <UserPreview userPreviewData={userPreviewData} />

                <ServerClock />
            </div>

            {/* ── Center Layout ──────────────────────── */}
            <UserPreviewCtx.Provider value={{ userPreviewData, updateUserPreviewData }}>
                <div className="center-layout">
                    <ChatContainer messageUser={messageUser} />

                    <GameDash
                        tabComponents={tabComponents}
                        activeTab={activeTab}
                        setUserProfileData={setUserProfileData}
                    />

                    <MenuItems
                        tabComponents={tabComponents}
                        activeTab={activeTab}
                        setActiveTab={setActiveTab}
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

function MenuItems({ tabComponents, activeTab, setActiveTab }) {
    console.log('MenuItems rendered')

    return (
        <div className="menu-panel glass-panel">
            {Object.keys(tabComponents).map(tabKey => (
                <button
                    className={`menu-btn ${activeTab === tabKey ? 'active' : ''}`}
                    key={tabKey}
                    onClick={(e) => setActiveTab(tabKey)}
                >{tabComponents[tabKey].label}
                </button>
            ))}
        </div>
    )
}

function GameDash({
    tabComponents,
    activeTab,
    setUserProfileData,
    setShowUserProfileModal
}) {
    console.log('GameDash rendered')

    return (
        <div
            key={activeTab}
            className='central-panel glass-panel'
        >
            {React.createElement(tabComponents[activeTab].component,
                tabComponents[activeTab].props)}
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

const UserPreview = memo(({ userPreviewData }) => {
    console.log('UserPreview rendered')

    return (
        <div className="user-preview-bar glass-panel">
            {userPreviewData ? (
                <>
                    <div className="user-preview-top">
                        <span className="user-preview-username">{userPreviewData.username}</span>
                        <span className="user-preview-city">{userPreviewData.city.toUpperCase()}</span>
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

function ServerClock() {
    const [time, setTime] = useState('')
    const [tzLabel, setTzLabel] = useState('UTC')

    useEffect(() => {
        const tick = () => {
            const now = new Date()
            const h = String(now.getHours()).padStart(2, '0')
            const m = String(now.getMinutes()).padStart(2, '0')
            const s = String(now.getSeconds()).padStart(2, '0')
            setTime(`${h}:${m}:${s}`)

            const offsetMinutes = -now.getTimezoneOffset()
            const offsetHours = offsetMinutes / 60
            const sign = offsetHours >= 0 ? '+' : '-'
            const absOffsetHours = Math.abs(offsetHours)
            const integerHours = Math.floor(absOffsetHours)
            const fractionMinutes = (absOffsetHours - integerHours) * 60
            let offsetString = `UTC${sign}${integerHours}`
            if (fractionMinutes > 0) {
                offsetString += `:${String(fractionMinutes).padStart(2, '0')}`
            }
            setTzLabel(offsetString)
        }
        tick()
        const interval = setInterval(tick, 1000)
        return () => clearInterval(interval)
    }, [])

    return (
        <div className="server-clock">
            <span className="clock-time">{time}</span>
            <span className="clock-label">{tzLabel}</span>
        </div>
    )
}

function DashboardTab() {
    console.log('DashboardTab rendered')

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
