import React, { useState } from 'react'
import Houses from './houses'
import Cars from './cars'
import Guns from './guns'
import Airplanes from './airplanes'

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
                    className={`items-sub-tab ${activeTab === 'guns' ? 'active' : ''}`}
                    onClick={() => handleTabChange('guns')}
                >
                    Guns
                </button>
                <button
                    className={`items-sub-tab ${activeTab === 'airplanes' ? 'active' : ''}`}
                    onClick={() => handleTabChange('airplanes')}
                >
                    Airplanes
                </button>
            </div>

            {activeTab === 'houses' && <Houses />}
            {activeTab === 'cars' && <Cars />}
            {activeTab === 'guns' && <Guns />}
            {activeTab === 'airplanes' && <Airplanes />}
        </>
    )
}

export default ItemsTab