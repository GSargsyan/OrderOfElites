import axios from 'axios'
import { API_URL } from 'modules/Base/constants'

const AUTH_TOKEN = localStorage.getItem('token')

const client = axios.create({
  baseURL: API_URL,
  method: 'POST',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer: ${AUTH_TOKEN}`
  },
})

export const request = function(options) {
  /*
  const onSuccess = function(response) { }
  const onError = function(error) { return Promise.reject(error.response || error.message) }
  */

  return client(options)
}

export const formatMoney = (amount) => {
    return '$' + amount.toLocaleString('en-US', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    })
}

export const formatSeconds = (seconds) => {
    // format seconds to MM:SS
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60

    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`
}

export const secondsRemaining = (futureTimestamp) => {
    const currentTime = Math.floor(Date.now() / 1000); // Current time in seconds
    let remaining = futureTimestamp - currentTime; // Remaining time in seconds

    if (remaining < 0) {
        remaining = 0;
    }

    return remaining;
}

export const isLoggedIn = () => Boolean(AUTH_TOKEN)