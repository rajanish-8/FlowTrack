import './App.css'
import { Routes, Route, Navigate } from 'react-router-dom'
import Board from './pages/Board.jsx'
import Login from './pages/login.jsx'
import Signup from './pages/signup.jsx'

function App() {
  return (
    <Routes>
      <Route path="/" element={<Board />} />
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default App
