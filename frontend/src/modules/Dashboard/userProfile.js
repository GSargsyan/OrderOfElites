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
        <div className="profile-backdrop" onClick={handleBackdropClick}>
            <div className="profile-modal" onClick={handleModalClick}>
                <h3>Operative Dossier</h3>
                <div>
                    <p><strong>Username:</strong> {userProfileData.username}</p>
                    <p><strong>Rank:</strong> {userProfileData.rank}</p>
                    <p><strong>Commendations:</strong> {userProfileData.commendations}</p>
                </div>

                <div className="profile-modal-actions">
                    <button
                        className="btn-profile ghost"
                        onClick={onClose}
                    >Close</button>
                    <button
                        className="btn-profile primary"
                        onClick={() => { onMessageClick(userProfileData.username) }}
                    >Message</button>
                </div>
            </div>
        </div>
    )
}

export default UserProfileModal