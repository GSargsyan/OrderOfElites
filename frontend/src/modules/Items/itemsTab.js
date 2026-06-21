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
            <div className="items-sub-tabs">
                <button
                    className={`items-sub-tab ${activeTab === 'houses' ? 'active' : ''}`}
                    onClick={() => handleTabChange('houses')}
                >
                    Houses
                </button>
                <button
                    className={`items-sub-tab ${activeTab === 'cars' ? 'active' : ''}`}
                    onClick={() => handleTabChange('cars')}
                >
                    Cars
                </button>
                <button
                    className={`items-sub-tab ${activeTab === 'weapons' ? 'active' : ''}`}
                    onClick={() => handleTabChange('weapons')}
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

export default ItemsTab