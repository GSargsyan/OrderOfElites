import React, { useState } from 'react'

import Header from './header'
import Footer from './footer'
import { request } from 'modules/Base'
import 'styles/dashboard.css'


function Homepage() {
    const [isSignup, setIsSignup] = useState(false)

    return (
        <div className="homepage-wrapper">
            <Header />

            {isSignup ?
                <SignupForm toggleForm={() => setIsSignup(!isSignup)} /> :
                <LoginForm toggleForm={() => setIsSignup(!isSignup)} />}

            <Footer />
        </div>
    )
}

function SignupForm({ toggleForm }) {
    const [username, setUsername] = useState('')
    const [password, setPassword] = useState('')
    const [signupError, setErrorMsg] = useState('')
    const [signupSuccess, setSuccessMsg] = useState('')

    const handleSubmit = async (e) => {
        e.preventDefault()

        request({
            'url': 'users/signup',
            'method': 'POST',
            'data': {
                username: username,
                password: password
            }
        }).then(response => {
            setSuccessMsg('Signup successful! Signing in...')

            request({
                'url': 'users/login',
                'method': 'POST',
                'data': {
                    username: username,
                    password: password
                }
            }).then(response => {
                localStorage.setItem('token', response.data.token)
                window.location.href = '/dashboard'
            }).catch(error => {
                if (error?.response?.data?.error) {
                    setErrorMsg(error.response.data.error)
                } else {
                    setErrorMsg('Something went wrong')
                }
            })
        }).catch(error => {
            if (error?.response?.data?.error) {
                setErrorMsg(error.response.data.error)
            } else {
                setErrorMsg('Something went wrong')
            }
        })
    }

    return (
        <div className="auth-container">
            <div className="auth-card">
                <h2>Create Account</h2>
                <form className="auth-form" onSubmit={handleSubmit}>
                    <div className="auth-form-group">
                        <label htmlFor="username">Username</label>
                        <input
                            type="text"
                            id="username"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            required
                        />
                    </div>
                    <div className="auth-form-group">
                        <label htmlFor="password">Password</label>
                        <input
                            type="password"
                            id="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                    </div>
                    <button className="btn-auth-submit" type="submit">Signup</button>
                    <button className="btn-auth-toggle" type="button" onClick={toggleForm}>
                        Already have an account?
                    </button>
                </form>
                {signupError && <p className="auth-error">{signupError}</p>}
                {signupSuccess && <p className="auth-success">{signupSuccess}</p>}
            </div>
        </div>
    )
}

function LoginForm({ toggleForm }) {
    const [username, setUsername] = useState('')
    const [password, setPassword] = useState('')
    const [loginError, setErrorMsg] = useState('')

    const handleSubmit = (event) => {
        event.preventDefault()

        request({
            'url': 'users/login',
            'method': 'POST',
            'data': {
                username: username,
                password: password
            }
        }).then(response => {
            localStorage.setItem('token', response.data.token)
            window.location.href = '/dashboard'
        }).catch(error => {
            if (error?.response?.data?.error) {
                setErrorMsg(error.response.data.error)
            } else {
                setErrorMsg('Something went wrong')
            }
        })
    }

    return (
        <div className="auth-container">
            <div className="auth-card">
                <h2>Login</h2>
                <form className="auth-form" onSubmit={handleSubmit}>
                    <div className="auth-form-group">
                        <label htmlFor="username">Username</label>
                        <input
                            type="text"
                            id="username"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            required
                        />
                    </div>
                    <div className="auth-form-group">
                        <label htmlFor="password">Password</label>
                        <input
                            type="password"
                            id="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                    </div>
                    <button className="btn-auth-submit" type="submit">Login</button>
                    <button className="btn-auth-toggle" type="button" onClick={toggleForm}>
                        Don't have an account?
                    </button>
                </form>
                {loginError && <p className="auth-error">{loginError}</p>}
            </div>
        </div>
    )
}

export default Homepage
