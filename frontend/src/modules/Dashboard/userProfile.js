// import axios from 'axios'
import React, { useState, useEffect } from 'react'
import { formatMoney } from 'modules/Base'


function UserProfileModal({ userProfileData, onClose, onMessageClick }) {
    console.log('UserProfileModal rendered')
    console.log(userProfileData)

    const handleBackdropClick = () => {
        onClose()
    }

    const handleModalClick = (e) => {
        e.stopPropagation()
    }

    return (
        <>
            <div style={styles.backdrop} onClick={handleBackdropClick}>
                <div style={styles.modal} onClick={handleModalClick}>
                    <div>
                        <p>Username: {userProfileData.username}</p>
                        <p>Rank: {userProfileData.rank}</p>
                        <p>Commendations: {userProfileData.commendations}</p>
                    </div>

                    <button onClick={onClose}>Close</button>
                    <button onClick={() => { onMessageClick(userProfileData.username) }}>Message</button>
                </div>
            </div>
        </>
    )
}


const styles = {
    backdrop: {
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modal: {
        backgroundColor: 'white',
        padding: '20px',
        borderRadius: '10px',
        boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)',
        // Add more styling as needed
    },
}

export default UserProfileModal