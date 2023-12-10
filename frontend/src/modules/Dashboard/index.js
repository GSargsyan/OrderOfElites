// import axios from 'axios'
import React, { createContext, useState, useEffect, memo } from 'react'

import ChatContainer from 'modules/Chat/chatContainer.js'
import MissionsTab from 'modules/Missions/missionsTab.js'
import SkillsTab from 'modules/Skills/skillsTab.js'
import ItemsTab from 'modules/Items/itemsTab.js'
import NetworkingTab from 'modules/Networking/networkingTab.js'
import UserProfileModal from 'modules/Dashboard/userProfile.js'
import { request, formatMoney } from 'modules/Base'


export const UserPreviewCtx = createContext()

function Dashboard() {
    console.log('Dashboard rendered')
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
        <>
            <div style={styles.upperDashCont}>
                <UserPreview userPreviewData={userPreviewData} />
            </div>

            <UserPreviewCtx.Provider value={{ userPreviewData, updateUserPreviewData }}>
                <div style={styles.centerDashCont}>
                    <ChatContainer messageUser={messageUser} />
                    <GameDash
                        tabComponents={tabComponents}
                        activeTab={activeTab}
                        setUserProfileData={setUserProfileData}
                        />
                    <MenuItems tabComponents={tabComponents} setActiveTab={setActiveTab} />
                </div>

                {showUserProfileModal && (
                    <div style={styles.userProfileCont}>
                        <UserProfileModal
                            userProfileData={userProfileData}
                            onClose={() => setShowUserProfileModal(false)}
                            onMessageClick={(messageUsername) => {
                                setMessageUser(messageUsername)
                                setShowUserProfileModal(false)
                            }}
                        />
                    </div>
                )}
            </UserPreviewCtx.Provider>
        </>
    )
}

function MenuItems({ tabComponents, setActiveTab }) {
    console.log('MenuItems rendered')

    return (
        <>
            <div style={styles.menuItemsCont}>
                <div className="tab-container">
                    {Object.keys(tabComponents).map(tabKey => (
                        <button
                            className="tabButton"
                            style={styles.tabButton}
                            key={tabKey}
                            onClick={(e) => setActiveTab(tabKey)}
                         >{tabComponents[tabKey].label}
                        </button>
                    ))}
                </div>
            </div>
        </>
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
        <>
            <div key={activeTab} style={styles.centralPanelCont}>
                 {React.createElement(tabComponents[activeTab].component,
                    tabComponents[activeTab].props)}
            </div>
        </>
    )
}

const UserPreview = memo(({ userPreviewData }) => {
    console.log('UserPreview rendered')

    return (
        <>
            <div className="previewCont" style={styles.previewCont}>
                {userPreviewData ? (
                    <>
                    <span style={styles.previewElem}>Username: {userPreviewData.username}</span>

                    <span style={styles.previewElem}>City: {userPreviewData.city}</span>
                    <span style={styles.previewElem}>Money: {formatMoney(userPreviewData.money_cash)}</span>
                    <span style={styles.previewElem}>Rank: {userPreviewData.rank}</span>
                    <span style={styles.previewElem}>Progress: {Math.floor(userPreviewData.rank_progress)}%</span>
                    <span style={styles.previewElem}>Attack: {userPreviewData.attack_points}</span>
                    <span style={styles.previewElem}>Defense: {userPreviewData.defense_points}</span>
                    <span style={styles.previewElem}>Driving: {userPreviewData.driving_points}</span>
                    <span style={styles.previewElem}>Commendations: {userPreviewData.commendations}</span>
                    </>
                ) : (
                    <p>Loading...</p>
                )}
            </div>
        </>
    )
})

function DashboardTab() {
    console.log('DashboardTab rendered')

    return (
        <>
            <p>Dashboard tab...</p>
        </>
    )
}

const styles = {
    upperDashCont: {
        display: 'flex',
        justifyContent: 'center',
    },
    centerDashCont: {
        display: 'flex',
        justifyContent: 'space-between',
        marginTop: '50px',
        minHeight: '500px',
    },
    previewCont: {
        display: 'flex',
        flexWrap: 'wrap',
        gap: '10px', // Note: 'gap' might not be supported in some older browsers for flexbox

        padding: '15px',
        width: '300px',
        border: '1px solid black',
    },
    previewElem: {
        flex: '1 1 calc(100% / 3)',
        padding: '5px',
        border: '1px solid #ccc',
        borderRadius: '5px',
        boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
    },
    menuItemsCont: {
        border: '1px solid black',
        float: 'right',
        padding: '30px',
    },
    centralPanelCont: {
        border: '1px solid black',
        top: '40px',
        padding: '30px',
        width: '50%',
    },
    tabButton: {
        padding: '10px',
        margin: '10px 0px',
        display: 'block',
    }
}

export default Dashboard