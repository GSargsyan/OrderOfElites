import React, { useState, useEffect, useContext } from 'react'
import { request, formatMoney } from 'modules/Base'
import { UserPreviewCtx } from 'modules/Dashboard'

function Guns() {
    console.log('Guns rendered')

    const [guns, setGuns] = useState(null)

    const { userPreviewData, updateUserPreviewData } = useContext(UserPreviewCtx)

    useEffect(() => {
        getGunsData()
    }, [])

    const getGunsData = () => {
        request({
            'url': 'items/get_user_guns',
            'method': 'POST',
        })
        .then(response => {
            console.log(response.data)
            setGuns(response.data)
        })
        .catch(error => {
            console.error("Error getting items tab data: ", error)
        })
    }

    const buyGun = (gunKey) => {
        request({
            'url': 'items/buy_gun',
            'method': 'POST',
            'data': {
                'gun_name': gunKey
            }
        })
        .then(response => {
            console.log(response.data)
            alert('Gun purchased successfully')
            updateUserPreviewData()
            getGunsData()
        })
        .catch(error => {
            alert(error.response.data.message)
        })
    }

    const sellGun = (gunKey) => {
        request({
            'url': 'items/sell_gun',
            'method': 'POST',
            'data': {
                'gun_name': gunKey
            }
        })
        .then(response => {
            console.log(response.data)
            alert('Gun sold successfully')
            updateUserPreviewData()
            getGunsData()
        })
        .catch(error => {
            alert(error.response.data.message)
        })
    }

    if (guns === null) {
        return <div className="loading-text">LOADING...</div>
    }

    return (
        <div>
            {Object.keys(guns).map(gunKey => (
                <div className="item-card" key={gunKey}>
                    <img
                        className="item-image"
                        src={`/images/${gunKey}.png`}
                        alt={guns[gunKey].name}
                    />
                    <div className="item-info">
                        <h2>{guns[gunKey].name}</h2>
                        <div className="item-owned-cities">
                            <span>Owned in cities: </span>
                            {guns[gunKey].owns_in_cities.length === 0 ? (
                                <span>None</span>
                            ) : (
                                <span>{guns[gunKey].owns_in_cities.join(', ')}</span>
                            )}
                        </div>
                        <p>Price: <strong>{formatMoney(guns[gunKey].price)}</strong></p>
                        <p>Defense: {guns[gunKey].defense_multiplier}x</p>
                        <p>Maintenance Cost: {formatMoney(guns[gunKey].maintenance_cost)}</p>

                        {guns[gunKey].owns_in_current_city ? (
                            <button
                                className="btn-sell"
                                onClick={() => sellGun(gunKey)}>Sell</button>
                        ) : (
                            <button
                                className="btn-buy"
                                onClick={() => buyGun(gunKey)}>Buy</button>
                        )}
                    </div>
                </div>
            ))}
        </div>
    )
}

export default Guns