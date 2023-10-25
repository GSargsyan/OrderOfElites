import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom"

import Homepage from './modules/Home/homepage'
import Dashboard from './modules/Dashboard'
import { isLoggedIn } from './modules/Base'


function App() {
	return (
		<BrowserRouter>
			<Routes>
                <Route path="/" element={isLoggedIn() ? <Navigate to="/dashboard" /> : <Homepage />} exact />
                <Route path="/dashboard" element={isLoggedIn() ? <Dashboard /> : <Navigate to="/" />} />

                <Route path="*" element={<Homepage />} />
			 </Routes>
		</BrowserRouter>
  )
}

export default App
