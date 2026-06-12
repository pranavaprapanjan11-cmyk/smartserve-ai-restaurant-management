import React from 'react'
import { Routes, Route } from 'react-router-dom'
import Login from './pages/auth/Login'
import Register from './pages/auth/Register'

const App: React.FC = () => {
  return (
    <Routes>
      <Route path="/auth/login" element={<Login />} />
      <Route path="/auth/register" element={<Register />} />
      <Route path="/" element={<div className="p-6">Welcome to SmartServe AI</div>} />
    </Routes>
  )
}

export default App
