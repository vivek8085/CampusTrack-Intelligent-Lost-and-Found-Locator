import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Login from './pages/Login';
import Signup from './pages/Signup';
import ReportLostItem from './pages/ReportLostItem';
import Nav from './components/Nav';
import { setAuthToken } from './lib/api';
import './App.css'

function App() {
  const token = localStorage.getItem('token');
  if (token) setAuthToken(token);

  return (
    <BrowserRouter>
      <Nav />
      <div className="p-6">
        <Routes>
          <Route path="/" element={<div className="text-center">Welcome to CampusTrack — use the menu to login or report an item.</div>} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/report" element={<ReportLostItem />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}

export default App
