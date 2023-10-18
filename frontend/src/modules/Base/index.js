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

export const isLoggedIn = () => Boolean(AUTH_TOKEN)