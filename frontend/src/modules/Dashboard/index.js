import axios from 'axios'
import React, { useState, useEffect } from 'react'

import ChatContainer from 'modules/Chat/chatContainer.js'
import { request } from 'modules/Base'


function Dashboard() {
    return (
        <div>
            <ChatContainer />
            <UserPreview />
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

const styles = {
    previewCont: {
        position: 'absolute',
        left: '50%',
        transform: 'translateX(-50%)',
        width: '20%',
        minHeight: '150px',
        border: '1px solid black'
    }
}

export default Dashboard
