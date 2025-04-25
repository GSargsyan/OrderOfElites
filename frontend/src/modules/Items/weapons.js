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
        return <div>Loading...</div>
    }

    return (
        <>
            <div>
                {Object.keys(weapons).map(weaponKey => (
                    <React.Fragment key={weaponKey}>
                    <h2>{weapons[weaponKey].name}</h2>
                    <div
                        key={weaponKey}
                        className="weaponCont"
                        style={styles.weaponCont}
                    >
                        <img
                            className="weaponImage"
                            style={styles.weaponImage}
                            src={`/images/${weaponKey}.png`}
                            alt={`${weaponKey}`} />
                        <div
                            className="weaponInfoCont"
                            style={styles.weaponInfoCont}
                        >
                            <div
                                className="weaponCountries"
                                style={styles.weaponCountries}
                            >
                                <span>Owned in cities: </span>
                                {weapons[weaponKey].owns_in_cities.length === 0 ? (
                                    <span>None</span>
                                    ) : (
                                    <span>{weapons[weaponKey].owns_in_cities.join(', ')}</span>
                                    )
                                }
                            </div>
                            <p>Price: {formatMoney(weapons[weaponKey].price)}</p>
                            <p>Defense: {weapons[weaponKey].defense_multiplier}x</p>
                            <p>Maintenance Cost: {formatMoney(weapons[weaponKey].maintenance_cost)}</p>

                            {weapons[weaponKey].owns_in_current_city ? (
                                <button onClick={() => sellWeapon(weaponKey)}>Sell</button>
                            ) : (
                                <button onClick={() => buyWeapon(weaponKey)}>Buy</button>
                            )}
                        </div>
                    </div>
                    </React.Fragment>
                ))}
            </div>
        </>
    )
}

const styles = {
    weaponCont: {
        display: 'flex',
    },
    weaponInfoCont: {
        margin: '0px 40px',
    },
    weaponImage: {
        width: '200px',
        height: '200px',
    }
}

export default Weapons