import React, { useState, useEffect, useContext } from 'react'
import { request, formatMoney } from 'modules/Base'
import { UserPreviewCtx } from 'modules/Dashboard'

function Houses() {
    console.log('Houses rendered')

    const [houses, setHouses] = useState(null)

    const { userPreviewData, updateUserPreviewData } = useContext(UserPreviewCtx)

    useEffect(() => {
        getHousesData()
    }, [])

    const getHousesData = () => {
        request({
            'url': 'items/get_user_houses',
            'method': 'POST',
        })
        .then(response => {
            console.log(response.data)
            setHouses(response.data)
        })
        .catch(error => {
            console.error("Error getting items tab data: ", error)
        })
    }

    const buyHouse = (houseKey) => {
        request({
            'url': 'items/buy_house',
            'method': 'POST',
            'data': {
                'house_name': houseKey
            }
        })
        .then(response => {
            console.log(response.data)
            alert('House purchased successfully')
            updateUserPreviewData()
            getHousesData()
        })
        .catch(error => {
            alert(error.response.data.message)
        })
    }

    const sellHouse = (houseKey) => {
        request({
            'url': 'items/sell_house',
            'method': 'POST',
            'data': {
                'house_name': houseKey
            }
        })
        .then(response => {
            console.log(response.data)
            alert('House sold successfully')
            updateUserPreviewData()
            getHousesData()
        })
        .catch(error => {
            alert(error.response.data.message)
        })
    }

    if (houses === null) {
        return <div className="loading-text">LOADING...</div>
    }

    return (
        <div>
            {Object.keys(houses).map(houseKey => (
                <div className="item-card" key={houseKey}>
                    <img
                        className="item-image"
                        src={`/images/${houseKey}.png`}
                        alt={houses[houseKey].name}
                    />
                    <div className="item-info">
                        <h2>{houses[houseKey].name}</h2>
                        <div className="item-owned-cities">
                            <span>Owned in cities: </span>
                            {houses[houseKey].owns_in_cities.length === 0 ? (
                                <span>None</span>
                            ) : (
                                <span>{houses[houseKey].owns_in_cities.join(', ')}</span>
                            )}
                        </div>
                        <p>Price: <strong>{formatMoney(houses[houseKey].price)}</strong></p>
                        <p>Defense: {houses[houseKey].defense_multiplier}x</p>
                        <p>Maintenance Cost: {formatMoney(houses[houseKey].maintenance_cost)}</p>

                        {houses[houseKey].owns_in_current_city ? (
                            <button
                                className="btn-sell"
                                onClick={() => sellHouse(houseKey)}>Sell</button>
                        ) : (
                            <button
                                className="btn-buy"
                                onClick={() => buyHouse(houseKey)}>Buy</button>
                        )}
                    </div>
                </div>
            ))}
        </div>
    )
}

export default Houses