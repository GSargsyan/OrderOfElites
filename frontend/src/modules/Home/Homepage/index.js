import React, { useState } from 'react';
import axios from 'axios';

import Header from '../Header';
import Footer from '../Footer';

function Homepage() {
    const [isSignup, setIsSignup] = useState(false);

    return (
        <div>
            <Header />

            {isSignup ?
                <SignupForm toggleForm={() => setIsSignup(!isSignup)} /> :
                <LoginForm toggleForm={() => setIsSignup(!isSignup)} />}

            <Footer />
        </div>
    );
}

function SignupForm({ toggleForm }) {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        
		axios.post('http://0.0.0.0:8000/signup/', {
			username: username,
			password: password,
		}).then((response) => {
			console.log(response);
		}).catch(error => {
            console.log('asdfaaaaaaaaaaaaaaaaaaaaa')
		})
    };

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
		</div>
    );
}

function LoginForm({ toggleForm }) {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [isSignup, setIsSignup] = useState(false);

    const handleSubmit = (event) => {
        event.preventDefault();
        console.log("Username:", username, "Password:", password);
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
		</div>
	);
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

export default Homepage;
