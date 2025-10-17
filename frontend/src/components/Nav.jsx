import { Link, useNavigate } from 'react-router-dom';
import { setAuthToken } from '../lib/api';

export default function Nav() {
  const navigate = useNavigate();

  const token = localStorage.getItem('token');

  const handleLogout = () => {
    localStorage.removeItem('token');
    setAuthToken(null);
    navigate('/login');
  };

  return (
    <nav className="bg-white p-4 shadow flex justify-between">
      <div className="flex gap-4">
        <Link to="/" className="font-bold">CampusTrack</Link>
        <Link to="/report" className="text-sm">Report Lost Item</Link>
      </div>
      <div className="flex gap-4">
        {token ? (
          <button onClick={handleLogout} className="text-sm text-red-600">Logout</button>
        ) : (
          <>
            <Link to="/login" className="text-sm">Login</Link>
            <Link to="/signup" className="text-sm">Signup</Link>
          </>
        )}
      </div>
    </nav>
  );
}
