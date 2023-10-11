import axios from 'axios'
import React, { useState, useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom"

import Homepage from './modules/Home/homepage'
import Dashboard from './modules/Dashboard'
import { API_URL } from './modules/Base'


function App() {
    const [isLoggedIn, setIsLoggedIn] = useState(null)

    useEffect(() => {
        // Check if user is authenticated
		axios.get(`${API_URL}/is_logged_in/`, {
			withCredentials: true
		})
		.then(response => {
			setIsLoggedIn(response.data.is_logged_in);
		})
    }, [])

	return (
		<BrowserRouter>
			<Routes>
                <Route path="/" element={isLoggedIn ? <Navigate to="/dashboard" /> : <Homepage />} exact />
                <Route path="/dashboard" element={isLoggedIn ? <Dashboard /> : <Navigate to="/" />} />
                {/* Fallback route */}
                <Route path="*" element={<Homepage />} />
			 </Routes>
		</BrowserRouter>
  )
}

export default App
