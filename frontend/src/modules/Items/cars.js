import React, { useState, useEffect, useContext } from 'react'
import { request, formatMoney } from 'modules/Base'
import { UserPreviewCtx } from 'modules/Dashboard'

import apexTypeC200 from 'assets/pictures/cars/apex_type_c200.png'
import overlander from 'assets/pictures/cars/overlander.png'
import falkenGts from 'assets/pictures/cars/falken_gts.png'
import vanguard from 'assets/pictures/cars/vanguard.png'
import banshee from 'assets/pictures/cars/banshee.png'
import imperiumRArmored from 'assets/pictures/cars/imperium_r_armored.png'
import bordeauxV16 from 'assets/pictures/cars/bordeaux_v16.png'

const CAR_IMAGES = {
    apex_type_c200: apexTypeC200,
    overlander: overlander,
    falken_gts: falkenGts,
    vanguard: vanguard,
    banshee: banshee,
    imperium_r_armored: imperiumRArmored,
    bordeaux_v16: bordeauxV16,
}

function Cars() {
    console.log('Cars rendered')

    const [cars, setCars] = useState(null)

    const { updateUserPreviewData } = useContext(UserPreviewCtx)

    useEffect(() => {
        getCarsData()
    }, [])

    const getCarsData = () => {
        request({
            'url': 'items/get_user_cars',
            'method': 'POST',
        })
        .then(response => {
            console.log(response.data)
            setCars(response.data)
        })
        .catch(error => {
            console.error("Error getting cars data: ", error)
        })
    }

    const buyCar = (carKey) => {
        request({
            'url': 'items/buy_car',
            'method': 'POST',
            'data': {
                'car_name': carKey
            }
        })
        .then(response => {
            console.log(response.data)
            alert('Car purchased successfully')
            updateUserPreviewData()
            getCarsData()
        })
        .catch(error => {
            alert(error.response.data.message)
        })
    }

    const sellCar = (carKey) => {
        request({
            'url': 'items/sell_car',
            'method': 'POST',
            'data': {
                'car_name': carKey
            }
        })
        .then(response => {
            console.log(response.data)
            alert('Car sold successfully')
            updateUserPreviewData()
            getCarsData()
        })
        .catch(error => {
            alert(error.response.data.message)
        })
    }

    if (cars === null) {
        return <div className="loading-text">LOADING...</div>
    }

    return (
        <div>
            {Object.keys(cars).map(carKey => (
                <div className="item-card" key={carKey}>
                    <img
                        className="car-image"
                        src={CAR_IMAGES[carKey]}
                        alt={cars[carKey].name}
                    />
                    <div className="item-info">
                        <h2>{cars[carKey].name}</h2>
                        <div className="item-owned-cities">
                            <span>Owned in current city: </span>
                            <span style={{ color: cars[carKey].count_in_current_city > 0 ? '#66bb6a' : undefined, fontWeight: 'bold' }}>
                                {cars[carKey].count_in_current_city}
                            </span>
                        </div>
                        <p>Price: <strong>{formatMoney(cars[carKey].price)}</strong></p>
                        <p>Drive: {cars[carKey].driving_multiplier}x</p>
                        <p>Defense: {cars[carKey].defense_multiplier}x</p>
                        <p>Attack: {cars[carKey].attack_multiplier}x</p>

                        <div style={{ display: 'flex', gap: '8px' }}>
                            <button
                                className="btn-buy"
                                onClick={() => buyCar(carKey)}>Buy</button>
                            {cars[carKey].count_in_current_city > 0 && (
                                <button
                                    className="btn-sell"
                                    onClick={() => sellCar(carKey)}>Sell</button>
                            )}
                        </div>
                    </div>
                </div>
            ))}
        </div>
    )
}

export default Cars