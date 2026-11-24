import './App.css'
import { Routes, Route, Navigate } from 'react-router-dom'
import Landing from './pages/Landing.jsx'
import Board from './pages/Board.jsx'
import CreateOrganization from './pages/CreateOrganization.jsx'
import Login from './pages/login.jsx'
import PendingInvite from './pages/PendingInvite.jsx'
import Signup from './pages/signup.jsx'

function App() {
  return (
    <Routes>
      <Route path="/" element={<Board />} />
      <Route path="/board" element={<Board />} />
      <Route path="/landing" element={<Landing />} />
      <Route path="/create-organization" element={<CreateOrganization />} />
      <Route path="/login" element={<Login />} />
      <Route path="/pending-invite" element={<PendingInvite />} />
      <Route path="/signup" element={<Signup />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default App
