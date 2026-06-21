import React, { useState, useEffect, useContext } from 'react'
import { request, formatMoney } from 'modules/Base'
import { UserPreviewCtx } from 'modules/Dashboard'

function Weapons() {
    console.log('Weapons rendered')

    const [weapons, setWeapons] = useState(null)

    const { userPreviewData, updateUserPreviewData } = useContext(UserPreviewCtx)

    useEffect(() => {
        getWeaponsData()
    }, [])

    const getWeaponsData = () => {
        request({
            'url': 'items/get_user_weapons',
            'method': 'POST',
        })
        .then(response => {
            console.log(response.data)
            setWeapons(response.data)
        })
        .catch(error => {
            console.error("Error getting items tab data: ", error)
        })
    }

    const buyWeapon = (weaponKey) => {
        request({
            'url': 'items/buy_weapon',
            'method': 'POST',
            'data': {
                'weapon_name': weaponKey
            }
        })
        .then(response => {
            console.log(response.data)
            alert('Weapon purchased successfully')
            updateUserPreviewData()
            getWeaponsData()
        })
        .catch(error => {
            alert(error.response.data.message)
        })
    }

    const sellWeapon = (weaponKey) => {
        request({
            'url': 'items/sell_weapon',
            'method': 'POST',
            'data': {
                'weapon_name': weaponKey
            }
        })
        .then(response => {
            console.log(response.data)
            alert('Weapon sold successfully')
            updateUserPreviewData()
            getWeaponsData()
        })
        .catch(error => {
            alert(error.response.data.message)
        })
    }

    if (weapons === null) {
        return <div className="loading-text">LOADING...</div>
    }

    return (
        <div>
            {Object.keys(weapons).map(weaponKey => (
                <div className="item-card" key={weaponKey}>
                    <img
                        className="item-image"
                        src={`/images/${weaponKey}.png`}
                        alt={weapons[weaponKey].name}
                    />
                    <div className="item-info">
                        <h2>{weapons[weaponKey].name}</h2>
                        <div className="item-owned-cities">
                            <span>Owned in cities: </span>
                            {weapons[weaponKey].owns_in_cities.length === 0 ? (
                                <span>None</span>
                            ) : (
                                <span>{weapons[weaponKey].owns_in_cities.join(', ')}</span>
                            )}
                        </div>
                        <p>Price: <strong>{formatMoney(weapons[weaponKey].price)}</strong></p>
                        <p>Defense: {weapons[weaponKey].defense_multiplier}x</p>
                        <p>Maintenance Cost: {formatMoney(weapons[weaponKey].maintenance_cost)}</p>

                        {weapons[weaponKey].owns_in_current_city ? (
                            <button
                                className="btn-sell"
                                onClick={() => sellWeapon(weaponKey)}>Sell</button>
                        ) : (
                            <button
                                className="btn-buy"
                                onClick={() => buyWeapon(weaponKey)}>Buy</button>
                        )}
                    </div>
                </div>
            ))}
        </div>
    )
}

export default Weapons