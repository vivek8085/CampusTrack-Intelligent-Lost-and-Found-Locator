import React, { useEffect, useState } from 'react';
import AdminDashboard from '../components/AdminDashboard';
import { useNavigate } from 'react-router-dom';

export default function AdminPage() {
  const [authorized, setAuthorized] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    // check authorization by calling admin dashboard endpoint
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`${location.protocol}//${location.hostname}:8080/api/admin/dashboard`, { credentials: 'include' });
        if (cancelled) return;
        if (res.status === 200) {
          setAuthorized(true);
        } else {
          setAuthorized(false);
        }
      } catch (e) {
        if (!cancelled) setAuthorized(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  if (authorized === null) return <div className="min-h-screen flex items-center justify-center">Checking access...</div>;
  if (authorized === false) return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
      <div className="bg-white p-6 rounded shadow text-center">
        <h2 className="text-xl font-semibold mb-2">Access denied</h2>
        <p className="mb-4">You do not have permission to view the admin dashboard.</p>
        <div className="flex gap-2 justify-center">
          <button onClick={() => navigate('/')} className="px-4 py-2 bg-blue-600 text-white rounded">Go home</button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        <AdminDashboard />
      </div>
    </div>
  );
}
