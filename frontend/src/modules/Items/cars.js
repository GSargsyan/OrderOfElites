
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
        return <div>Loading...</div>
    }

    return (
        <>
            <div>
                {Object.keys(cars).map(carKey => (
                    <React.Fragment key={carKey}>
                    <h2>{cars[carKey].name}</h2>
                    <div
                        key={carKey}
                        className="carCont"
                        style={styles.carCont}
                    >
                        <img
                            className="carImage"
                            style={styles.carImage}
                            src={`/images/${carKey}.png`}
                            alt={`${carKey}`} />
                        <div
                            className="carInfoCont"
                            style={styles.carInfoCont}
                        >
                            <div
                                className="carCountries"
                                style={styles.carCountries}
                            >
                                <span>Owned in cities: </span>
                                {cars[carKey].owns_in_cities.length === 0 ? (
                                    <span>None</span>
                                    ) : (
                                    <span>{cars[carKey].owns_in_cities.join(', ')}</span>
                                    )
                                }
                            </div>
                            <p>Price: {formatMoney(cars[carKey].price)}</p>
                            <p>Defense: {cars[carKey].defense_multiplier}x</p>
                            <p>Maintenance Cost: {formatMoney(cars[carKey].maintenance_cost)}</p>

                            {cars[carKey].owns_in_current_city ? (
                                <button onClick={() => sellCar(carKey)}>Sell</button>
                            ) : (
                                <button onClick={() => buyCar(carKey)}>Buy</button>
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
    carCont: {
        display: 'flex',
    },
    carInfoCont: {
        margin: '0px 40px',
    },
    carImage: {
        width: '200px',
        height: '200px',
    }
}

export default Cars