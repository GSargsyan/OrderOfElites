// import axios from 'axios'
import React, { useState, useEffect } from 'react'

import ChatContainer from 'modules/Chat/chatContainer.js'
import MissionsTab from 'modules/Missions/missionsTab.js'
import { request } from 'modules/Base'

const tabComponents = {
    'dashboard': {
        'component': <DashboardTab />,
        'label': 'Dashboard',
    },
    'missions': {
        'component': <MissionsTab />,
        'label': 'Missions',
    },
    'skills': {
        'component': <DashboardTab />,
        'label': 'Skills',
    },
    'garage': {
        'component': <DashboardTab />,
        'label': 'Garage',
    },
    'travel': {
        'component': <DashboardTab />,
        'label': 'Travel',
    },
    'guns': {
        'component': <DashboardTab />,
        'label': 'Guns',
    },
    'bank': {
        'component': <DashboardTab />,
        'label': 'Bank',
    },
    'kill': {
        'component': <DashboardTab />,
        'label': 'Kill',
    },
    'pavilion': {
        'component': <DashboardTab />,
        'label': 'Pavilion',
    },
    'grand_council': {
        'component': <DashboardTab />,
        'label': 'Grand Council',
    },
}


function Dashboard() {
    return (
        <>
            <div style={styles.upperDashCont}>
                <UserPreview />
            </div>
            <div style={styles.centerDashCont}>
                <ChatContainer />
                <MainDashContainer />
            </div>
        </>
    )
}

function MainDashContainer() {
    console.log('MainDashContainer rendered')
    const [activeTab, setActiveTab] = useState('dashboard')

    return (
        <>
            <CentralPanel activeTab={activeTab} />
            <MenuItems onTabChange={setActiveTab} />
        </>
    )
}

function MenuItems({ onTabChange }) {
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
                                onClick={(e) => onTabChange(tabKey)}
                             >{tabComponents[tabKey].label}
                            </button>
                    ))}
                </div>
            </div>
        </>
    )
}

function CentralPanel({ activeTab }) {
    console.log('CentralPanel rendered')
    return (
        <>
            <div key={activeTab} style={styles.centralPanelCont}>
                 {tabComponents[activeTab].component}
            </div>
        </>
    )
}

function UserPreview() {
    console.log('UserPreview rendered')
    const [data, setData] = useState(null)

    useEffect(() => {
        request({
            'url': 'users/get_preview',
            'method': 'POST',
        })
        .then(response => {
            console.log(response.data)
            setData(response.data)
        })
    }, [])

    return (
        <>
            <div className="previewCont" style={styles.previewCont}>
                {data ? (
                    <>
                    <p>Username: {data.username}</p>
                    <p>City: {data.city}</p>
                    <p>Money: {data.money_cash}</p>
                    <p>Rank: {data.rank}</p>
                    <p>Progress: {data.rank_progress}%</p>
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