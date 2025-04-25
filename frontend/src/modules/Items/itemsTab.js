import React, { useState, useEffect } from 'react'
import Houses from './houses'
import Cars from './cars'
import Weapons from './weapons'

function ItemsTab() {
    console.log('ItemsTab rendered')

    const [activeTab, setActiveTab] = useState('houses')

    const handleTabChange = (tab) => {
        setActiveTab(tab)
    }

    return (
        <>
            <div style={styles.itemTabsCont}>
                <button
                    className={`itemTab ${activeTab === 'houses' ? 'activeItemsTab' : ''}`}
                    onClick={() => handleTabChange('houses')}
                    style={{ ...styles.itemTab, ...(activeTab === 'houses' ? styles.activeItemsTab : {}) }}
                >
                    Houses
                </button>
                <button
                    className={`itemTab ${activeTab === 'cars' ? 'activeItemsTab' : ''}`}
                    onClick={() => handleTabChange('cars')}
                    style={{ ...styles.itemTab, ...(activeTab === 'cars' ? styles.activeItemsTab : {}) }}
                >
                    Cars
                </button>
                <button
                    className={`itemTab ${activeTab === 'weapons' ? 'activeItemsTab' : ''}`}
                    onClick={() => handleTabChange('weapons')}
                    style={{ ...styles.itemTab, ...(activeTab === 'weapons' ? styles.activeItemsTab : {}) }}
                >
                    Weapons
                </button>
            </div>

            {activeTab === 'houses' && <Houses />}
            {activeTab === 'cars' && <Cars />}
            {activeTab === 'weapons' && <Weapons />}
        </>
    )
}

const styles = {
    itemTabsCont: {
        display: 'flex',
        justifyContent: 'flex-start',
    },
    itemTab: {
        padding: '10px 20px',
        margin: '0 10px',
        border: 'none',
        borderRadius: '5px',
        backgroundColor: '#e0e0e0',
        color: '#333',
        cursor: 'pointer',
    },
    activeItemsTab: {
        backgroundColor: '#333',
        color: '#fff',
    },
}

export default ItemsTab