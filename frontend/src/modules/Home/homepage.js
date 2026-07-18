import React, { useState, useEffect } from 'react'
import Header from './header'
import Footer from './footer'
import { request } from 'modules/Base'
import homepageBg from 'assets/pictures/homepage_bg.png'
import 'styles/dashboard.css'

function Homepage() {
    const [isSignup, setIsSignup] = useState(false)
    const [stats, setStats] = useState({ total_registrations: 0, online_now: 0, online_24h: 0 })
    const [topElites, setTopElites] = useState([])

    useEffect(() => {
        request({ url: 'users/homepage-stats', method: 'GET' })
            .then(res => setStats(res.data))
            .catch(err => console.error(err))

        request({ url: 'users/top-elites', method: 'GET' })
            .then(res => setTopElites(res.data.top_elites))
            .catch(err => console.error(err))
    }, [])

    return (
        <div className="homepage-wrapper" style={{ backgroundImage: `url(${homepageBg})` }}>
            <Header />

            <div className="homepage-content">
                <div className="homepage-intro">
                    <h1 className="homepage-tagline">Join the underworld in a text based assassins game.</h1>
                </div>
                
                <div className="homepage-grid">
                    {/* Left Column: Stats and Top Elites */}
                    <div className="homepage-left-col">
                        <div className="homepage-stats-card panel-card">
                            <h3>Game Statistics</h3>
                            <div className="stat-item">
                                <span>Total Assassins:</span>
                                <strong>{stats.total_registrations}</strong>
                            </div>
                            <div className="stat-item">
                                <span>Online Now:</span>
                                <strong className="highlight-text">{stats.online_now}</strong>
                            </div>
                            <div className="stat-item">
                                <span>Online (24h):</span>
                                <strong>{stats.online_24h}</strong>
                            </div>
                        </div>

                        <div className="homepage-elites-card panel-card">
                            <h3>Top 10 Elites</h3>
                            <table className="elites-table">
                                <thead>
                                    <tr>
                                        <th>Rank</th>
                                        <th>Username</th>
                                        <th>Level</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {topElites.map((user, idx) => (
                                        <tr key={idx}>
                                            <td>#{idx + 1}</td>
                                            <td>{user.username}</td>
                                            <td>{user.rank}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Right Column: Auth */}
                    <div className="homepage-right-col">
                        {isSignup ?
                            <SignupForm toggleForm={() => setIsSignup(!isSignup)} /> :
                            <LoginForm toggleForm={() => setIsSignup(!isSignup)} />}
                    </div>
                </div>
            </div>

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
