import axios from 'axios'
import React, { useState, useEffect } from 'react'

import ChatContainer from 'modules/Chat/chatContainer.js'
import { request } from 'modules/Base'


function Dashboard() {
    return (
        <>
            <div style={styles.upperDashCont}>
                <UserPreview />
            </div>
            <div style={styles.centerDashCont}>
                <ChatContainer />
                <CentralPanel />
                <MenuItems />
            </div>
        </>
    )
}

function UserPreview() {
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

function MenuItems() {
    return (
        <>
            <div style={styles.menuItemsCont}>
                <p>Dashboard</p>
                <p>Missions</p>
                <p>Skills</p>
                <p>Garage</p>
                <p>Travel</p>
                <p>Guns</p>
                <p>Bank</p>
                <p>Kill</p>
                <p>Pavilion</p>
                <p>Grand Council</p>
            </div>
        </>
    )
}

function CentralPanel() {
    return (
        <>
            <div style={styles.centralPanelCont}>
            </div>
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
    }
}

export default Dashboard
