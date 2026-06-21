import React, { useState } from 'react'
import { request } from 'modules/Base'

function NetworkingTab({ setUserProfileData, setShowUserProfileModal }) {
    console.log('NetworkingTab rendered')

    const [searchedUsername, setSearchedUsername] = useState('')

    const findUser = (event) => {
        event.preventDefault();
        request({
            url: 'users/find_by_username',
            method: 'POST',
            data: { username: searchedUsername }
        })
        .then(response => {
            console.log(response.data)
            setUserProfileData(response.data)
            setShowUserProfileModal(true)
        })
        .catch(error => {
            console.log(error)
            if (error.response.status === 404) {
                alert('User not found')
            } else {
                console.error('Error finding user:', error)
            }
        })
    };

    return (
        <form className="search-form" onSubmit={findUser}>
            <h3>Search an Elite</h3>
            <label htmlFor="userSearchInput">Username:</label>
            <input
                id="userSearchInput"
                className="search-input"
                placeholder="Type the username"
                value={searchedUsername}
                onChange={(e) => setSearchedUsername(e.target.value)}
            />
            <button
                type="submit"
                className="btn-search"
            >Search</button>
        </form>
    )
}

export default NetworkingTab