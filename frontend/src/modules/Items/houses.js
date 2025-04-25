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
        return <div>Loading...</div>
    }

    return (
        
        <>
            <div>
                {Object.keys(houses).map(houseKey => (
                    <React.Fragment key={houseKey}>
                    <h2>{houses[houseKey].name}</h2>
                    <div
                        key={houseKey}
                        className="houseCont"
                        style={styles.houseCont}
                    >
                        <img
                            className="houseImage"
                            style={styles.houseImage}
                            src={`/images/${houseKey}.png`}
                            alt={`${houseKey}`} />
                        <div
                            className="houseInfoCont"
                            style={styles.houseInfoCont}
                        >
                            <div
                                className="houseCountries"
                                style={styles.houseCountries}
                            >
                                <span>Owned in cities: </span>
                                {houses[houseKey].owns_in_cities.length === 0 ? (
                                    <span>None</span>
                                    ) : (
                                    <span>{houses[houseKey].owns_in_cities.join(', ')}</span>
                                    )
                                }
                            </div>
                            <p>Price: {formatMoney(houses[houseKey].price)}</p>
                            <p>Defense: {houses[houseKey].defense_multiplier}x</p>
                            <p>Maintenance Cost: {formatMoney(houses[houseKey].maintenance_cost)}</p>

                            {houses[houseKey].owns_in_current_city ? (
                                <button
                                    style={styles.sellButton}
                                    onClick={() => sellHouse(houseKey)}>Sell</button>
                            ) : (
                                <button
                                    style={styles.buyButton}
                                    onClick={() => buyHouse(houseKey)}>Buy</button>
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
    houseCont: {
        display: 'flex',
    },
    houseInfoCont: {
        margin: '0px 40px',
    },
    houseImage: {
        width: '200px',
        height: '200px',
    },
    sellButton: {
        backgroundColor: '#CF4C4C',
        color: '#FFFFFF',
        padding: '10px 20px',
        borderRadius: '5px',
        border: 'none',
        cursor: 'pointer',
    },
    buyButton: {
        backgroundColor: '#4D8E4D',
        color: '#FFFFFF',
        padding: '10px 20px',
        borderRadius: '5px',
        border: 'none',
        cursor: 'pointer',
    }
}

export default Houses