import React, { useState, useEffect, useContext } from 'react'
import { request, formatMoney } from 'modules/Base'
import { UserPreviewCtx } from 'modules/Dashboard'

import airplaneCorvus from 'assets/pictures/airplanes/airplane_corvus.png'
import airplaneMachIv from 'assets/pictures/airplanes/airplane_mach_iv.png'
import airplaneSentinelle from 'assets/pictures/airplanes/airplane_sentinelle.png'

const AIRPLANE_IMAGES = {
    corvus: airplaneCorvus,
    mach_iv: airplaneMachIv,
    sentinelle: airplaneSentinelle,
}

function Airplanes() {
    console.log('Airplanes rendered')

    const [airplanes, setAirplanes] = useState(null)

    const { updateUserPreviewData } = useContext(UserPreviewCtx)

    useEffect(() => {
        getAirplanesData()
    }, [])

    const getAirplanesData = () => {
        request({
            'url': 'items/get_user_airplanes',
            'method': 'POST',
        })
        .then(response => {
            console.log(response.data)
            setAirplanes(response.data)
        })
        .catch(error => {
            console.error("Error getting airplanes data: ", error)
        })
    }

    const buyAirplane = (airplaneKey) => {
        request({
            'url': 'items/buy_airplane',
            'method': 'POST',
            'data': {
                'airplane_name': airplaneKey
            }
        })
        .then(response => {
            console.log(response.data)
            alert('Airplane purchased successfully')
            updateUserPreviewData()
            getAirplanesData()
        })
        .catch(error => {
            alert(error.response.data.message)
        })
    }

    const sellAirplane = (airplaneKey) => {
        request({
            'url': 'items/sell_airplane',
            'method': 'POST',
            'data': {
                'airplane_name': airplaneKey
            }
        })
        .then(response => {
            console.log(response.data)
            alert('Airplane sold successfully')
            updateUserPreviewData()
            getAirplanesData()
        })
        .catch(error => {
            alert(error.response.data.message)
        })
    }

    if (airplanes === null) {
        return <div className="loading-text">LOADING...</div>
    }

    // Filter out commercial flight since it is a default travel mode and not a purchasable plane
    const purchasableAirplanes = Object.keys(airplanes).filter(key => key !== 'commercial_flight')

    return (
        <div>
            {purchasableAirplanes.map(airplaneKey => (
                <div className="item-card" key={airplaneKey}>
                    <img
                        className="item-image"
                        src={AIRPLANE_IMAGES[airplaneKey]}
                        alt={airplanes[airplaneKey].name}
                    />
                    <div className="item-info">
                        <h2>{airplanes[airplaneKey].name}</h2>
                        <div className="item-owned-cities">
                            <span>Ownership: </span>
                            {airplanes[airplaneKey].owned ? (
                                <span style={{ color: '#66bb6a', fontWeight: 'bold' }}>Owned</span>
                            ) : (
                                <span>Not Owned</span>
                            )}
                        </div>
                        <p>Price: <strong>{formatMoney(airplanes[airplaneKey].price)}</strong></p>
                        <p>Speed: {airplanes[airplaneKey].speed_multiplier}x</p>
                        <p>Price Multiplier: {airplanes[airplaneKey].price_multiplier}x</p>
                        <p>Travel Cooldown: {airplanes[airplaneKey].cooldown}</p>

                        {airplanes[airplaneKey].owned ? (
                            <button
                                className="btn-sell"
                                onClick={() => sellAirplane(airplaneKey)}>Sell</button>
                        ) : (
                            <button
                                className="btn-buy"
                                onClick={() => buyAirplane(airplaneKey)}>Buy</button>
                        )}
                    </div>
                </div>
            ))}
        </div>
    )
}

export default Airplanes
