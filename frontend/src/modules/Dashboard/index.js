// import axios from 'axios'
import React, { useState, useEffect } from 'react'

import ChatContainer from 'modules/Chat/chatContainer.js'
import MissionsTab from 'modules/Missions/missionsTab.js'
import SkillsTab from 'modules/Skills/skillsTab.js'
import { request, formatMoney } from 'modules/Base'

const tabComponents = {
    'dashboard': {
        'component': DashboardTab,
        'label': 'Dashboard',
    },
    'missions': {
        'component': MissionsTab,
        'label': 'Missions',
    },
    'skills': {
        'component': SkillsTab,
        'label': 'Skills',
    },
    'garage': {
        'component': DashboardTab,
        'label': 'Garage',
    },
    'travel': {
        'component': DashboardTab,
        'label': 'Travel',
    },
    'guns': {
        'component': DashboardTab,
        'label': 'Guns',
    },
    'bank': {
        'component': DashboardTab,
        'label': 'Bank',
    },
    'kill': {
        'component': DashboardTab,
        'label': 'Kill',
    },
    'pavilion': {
        'component': DashboardTab,
        'label': 'Pavilion',
    },
    'grand_council': {
        'component': DashboardTab,
        'label': 'Grand Council',
    },
}

function Dashboard() {
    console.log('Dashboard rendered')
    const [activeTab, setActiveTab] = useState('dashboard')
    const [userData, setUserData] = useState(null)

    const updateUserData = () => {
        request({
            'url': 'users/get_preview',
            'method': 'POST',
        })
        .then(response => {
            console.log(response.data)
            setUserData(response.data)
        })
    }

    useEffect(() => {
        updateUserData()
    }, [])

    return (
        <>
            <div style={styles.upperDashCont}>
                <UserPreview userData={userData} />
            </div>
            <div style={styles.centerDashCont}>
                <ChatContainer />
                <GameDash activeTab={activeTab} updateUserData={updateUserData} />
                <MenuItems setActiveTab={setActiveTab} />
            </div>
        </>
    )
}

function MenuItems({ setActiveTab }) {
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

function GameDash({ activeTab, updateUserData }) {
    console.log('GameDash rendered')

    return (
        <>
            <div key={activeTab} style={styles.centralPanelCont}>
                 {React.createElement(tabComponents[activeTab].component, {updateUserData: updateUserData})}
            </div>
        </>
    )
}

function UserPreview({ userData, setUserData}) {
    console.log('UserPreview rendered')

    return (
        <>
            <div className="previewCont" style={styles.previewCont}>
                {userData ? (
                    <>
                    <span style={styles.previewElem}>Username: {userData.username}</span>

                    <span style={styles.previewElem}>City: {userData.city}</span>
                    <span style={styles.previewElem}>Money: {formatMoney(userData.money_cash)}</span>
                    <span style={styles.previewElem}>Rank: {userData.rank}</span>
                    <span style={styles.previewElem}>Progress: {Math.floor(userData.rank_progress)}%</span>
                    <span style={styles.previewElem}>Attack: {userData.attack_points}</span>
                    <span style={styles.previewElem}>Defense: {userData.defense_points}</span>
                    <span style={styles.previewElem}>Driving: {userData.driving_points}</span>
                    <span style={styles.previewElem}>Commendations: {userData.commendations}</span>
                    </>
                ) : (
                    <p>Loading...</p>
                )}
            </div>
        </>
    )
}

function DashboardTab() {
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