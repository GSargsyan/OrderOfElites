import React, { useState } from 'react'

import Header from './header'
import Footer from './footer'
import { request } from 'modules/Base'


function Homepage() {
    const [isSignup, setIsSignup] = useState(false)

    return (
        <div>
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
		<div style={styles.authContainer}>
			<h2>Signup</h2>
			<form onSubmit={handleSubmit}>
				<div className="form-group" style={styles.formGroup}>
					<label htmlFor="username">Username:</label>
					<input
						type="text"
						id="username"
						value={username}
						onChange={(e) => setUsername(e.target.value)}
						required
					/>
				</div>
				<div className="form-group">
					<label htmlFor="password">Password:</label>
					<input
						type="password"
						id="password"
						value={password}
						onChange={(e) => setPassword(e.target.value)}
						required
					/>
				</div>
				<button type="submit">Signup</button>
				<button onClick={toggleForm}>Already have an account</button>
			</form>
            <p>{signupError}</p>
            <p>{signupSuccess}</p>
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
		<div style={styles.authContainer}>
			<h2>Login</h2>
			<form onSubmit={handleSubmit}>
				<div className="form-group" style={styles.formGroup}>
					<label htmlFor="username">Username:</label>
					<input
						type="text"
						id="username"
						value={username}
						onChange={(e) => setUsername(e.target.value)}
						required
					/>
				</div>
				<div className="form-group">
					<label htmlFor="password">Password:</label>
					<input
						type="password"
						id="password"
						value={password}
						onChange={(e) => setPassword(e.target.value)}
						required
					/>
				</div>
				<button type="submit">Login</button>
                <button onClick={toggleForm}>Don't have an account?</button>
			</form>
            <p>{loginError}</p>
		</div>
	)
}

const styles = {
    authContainer: {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100vh'
    },
    formGroup: {
        marginBottom: '15px'
    }
}

export default Homepage
