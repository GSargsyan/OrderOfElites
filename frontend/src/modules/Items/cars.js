import React, { useState, useEffect, useContext } from 'react'
import { request, formatMoney } from 'modules/Base'
import { UserPreviewCtx } from 'modules/Dashboard'

function Cars() {
    console.log('Cars rendered')

    const [cars, setCars] = useState(null)

    const { userPreviewData, updateUserPreviewData } = useContext(UserPreviewCtx)

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
            console.error("Error getting items tab data: ", error)
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
                        className="item-image"
                        src={`/images/${carKey}.png`}
                        alt={cars[carKey].name}
                    />
                    <div className="item-info">
                        <h2>{cars[carKey].name}</h2>
                        <div className="item-owned-cities">
                            <span>Owned in cities: </span>
                            {cars[carKey].owns_in_cities.length === 0 ? (
                                <span>None</span>
                            ) : (
                                <span>{cars[carKey].owns_in_cities.join(', ')}</span>
                            )}
                        </div>
                        <p>Price: <strong>{formatMoney(cars[carKey].price)}</strong></p>
                        <p>Defense: {cars[carKey].defense_multiplier}x</p>
                        <p>Maintenance Cost: {formatMoney(cars[carKey].maintenance_cost)}</p>

                        {cars[carKey].owns_in_current_city ? (
                            <button
                                className="btn-sell"
                                onClick={() => sellCar(carKey)}>Sell</button>
                        ) : (
                            <button
                                className="btn-buy"
                                onClick={() => buyCar(carKey)}>Buy</button>
                        )}
                    </div>
                </div>
            ))}
        </div>
    )
}

export default Cars