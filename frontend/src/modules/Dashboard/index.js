// import axios from 'axios'
import React, { useState, useEffect } from 'react'

import ChatContainer from 'modules/Chat/chatContainer.js'
import MissionsTab from 'modules/Missions/missionsTab.js'
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
        'component': DashboardTab,
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
                    <p>Username: {userData.username}</p>
                    <p>City: {userData.city}</p>
                    <p>Money: {formatMoney(userData.money_cash)}</p>
                    <p>Rank: {userData.rank}</p>
                    <p>Progress: {Math.floor(userData.rank_progress)}%</p>
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
        padding: '15px',
        width: '200px',
        border: '1px solid black',
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