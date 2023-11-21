import axios from 'axios'
import React, { useState, useEffect } from 'react'

import ChatContainer from 'modules/Chat/chatContainer.js'
import { request } from 'modules/Base'


function Dashboard() {
    return (
        <div>
            <ChatContainer />
            <UserPreview />
            <MenuItems />
        </div>
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
            <div style={styles.previewCont}>
                {data ? (
                    <>
                    <p>Username: {data.username}</p>
                    <p>City: {data.city}</p>
                    <p>Money: {data.money_cash}</p>
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

const styles = {
    previewCont: {
        position: 'absolute',
        left: '50%',
        transform: 'translateX(-50%)',
        width: '20%',
        minHeight: '150px',
        border: '1px solid black'
    },
    menuItemsCont: {
        border: '1px solid black',
        float: 'right',
        top: '40px',
        marginTop: '250px',
        padding: '30px',
    }
}

export default Dashboard
