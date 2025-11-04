import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  // showPanel controls whether the full admin cards/panels are visible
  // default: visible on desktop, collapsed on small screens
  const [showPanel, setShowPanel] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const [adminView, setAdminView] = useState('dashboard');
  const [lostItems, setLostItems] = useState([]);
  const [foundItems, setFoundItems] = useState([]);
  const [matchedItems, setMatchedItems] = useState([]);
  const [recoveredItems, setRecoveredItems] = useState([]);
  const [reportedUsers, setReportedUsers] = useState([]);

  const loadStats = async () => {
    try {
      const res = await fetch(`${location.protocol}//${location.hostname}:8080/api/admin/dashboard`, { credentials: 'include' });
      if (res.ok) setStats(await res.json());
    } catch (e) {}
  };

  const loadUsers = async () => {
    try {
      const res = await fetch(`${location.protocol}//${location.hostname}:8080/api/admin/users`, { credentials: 'include' });
      if (res.ok) setUsers(await res.json());
    } catch (e) {}
  };

  useEffect(() => { loadStats(); loadUsers(); }, []);

  // set mobile flag on mount and on resize
  useEffect(() => {
    function update() {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      // collapse by default on mobile
      setShowPanel(!mobile);
    }
    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, []);

  const deleteUser = async (id) => {
    if (!window.confirm('Delete user permanently?')) return;
    try {
      await fetch(`${location.protocol}//${location.hostname}:8080/api/admin/user/${id}/delete`, { method: 'POST', credentials: 'include' });
      await loadUsers();
      await loadStats();
    } catch (e) {}
  };

  // Load lost/found/matched/recovered when adminView changes
  useEffect(() => {
    async function loadForView() {
      try {
        if (adminView === 'lost-items') {
          const r = await fetch(`${location.protocol}//${location.hostname}:8080/api/lostitems/all`, { credentials: 'include' });
          if (r.ok) setLostItems(await r.json());
        } else if (adminView === 'found-items') {
          const r = await fetch(`${location.protocol}//${location.hostname}:8080/api/founditems/all`, { credentials: 'include' });
          if (r.ok) setFoundItems(await r.json());
        } else if (adminView === 'matched-items') {
          const r = await fetch(`${location.protocol}//${location.hostname}:8080/api/notifications/confirmed`, { credentials: 'include' });
          if (r.ok) setMatchedItems(await r.json());
        } else if (adminView === 'recovered-items') {
          // try a few likely endpoints for backups -- backend may not expose this, handle gracefully
          const candidates = ['/api/backups/all', '/api/backup/all', '/api/admin/backups', '/api/notifications/backups'];
          let ok = false;
          for (const c of candidates) {
            try {
              const r = await fetch(`${location.protocol}//${location.hostname}:8080${c}`, { credentials: 'include' });
              if (r.ok) { setRecoveredItems(await r.json()); ok = true; break; }
            } catch (e) { /* ignore */ }
          }
          if (!ok) setRecoveredItems([]);
        } else if (adminView === 'reported-users') {
          // build reported users from lost/found reporters
          const [lr, fr] = await Promise.all([
            fetch(`${location.protocol}//${location.hostname}:8080/api/lostitems/all`, { credentials: 'include' }).then(r=>r.ok? r.json():[]).catch(()=>[]),
            fetch(`${location.protocol}//${location.hostname}:8080/api/founditems/all`, { credentials: 'include' }).then(r=>r.ok? r.json():[]).catch(()=>[])
          ]);
          const emails = new Set();
          lr.forEach(l=>{ if (l.reporterEmail) emails.add(l.reporterEmail); });
          fr.forEach(f=>{ if (f.reporterEmail) emails.add(f.reporterEmail); });
          // map to user records when available
          const reported = [];
          users.forEach(u => { if (emails.has(u.email)) reported.push(u); });
          // include emails not in users list
          for (const e of emails) if (!reported.find(r=>r.email===e)) reported.push({ name: e.split('@')[0], email: e });
          setReportedUsers(reported);
        }
      } catch (e) { /* ignore errors */ }
    }
    loadForView();
  }, [adminView]);

  return (
    <div>
      {/* top navbar inside admin dashboard */}
      <nav className="glass-nav nav-dark text-white px-6 py-3 flex justify-between items-center">
        <h1 className="text-2xl font-semibold tracking-tight">CampusTrack</h1>
        <div className="flex gap-3 items-center">
          {/* Admin-specific sections */}
          <button onClick={() => setAdminView('manage-users')} className={`nav-btn transition px-3 py-1 rounded-md text-sm ${adminView==='manage-users' ? 'nav-active' : 'nav-inactive'}`}>Manage Users</button>
          <button onClick={() => setAdminView('lost-items')} className={`nav-btn transition px-3 py-1 rounded-md text-sm ${adminView==='lost-items' ? 'nav-active' : 'nav-inactive'}`}>View Lost Items</button>
          <button onClick={() => setAdminView('found-items')} className={`nav-btn transition px-3 py-1 rounded-md text-sm ${adminView==='found-items' ? 'nav-active' : 'nav-inactive'}`}>View Found Items</button>
          <button onClick={() => setAdminView('reported-users')} className={`nav-btn transition px-3 py-1 rounded-md text-sm ${adminView==='reported-users' ? 'nav-active' : 'nav-inactive'}`}>Reported Users</button>
          <button onClick={() => setAdminView('matched-items')} className={`nav-btn transition px-3 py-1 rounded-md text-sm ${adminView==='matched-items' ? 'nav-active' : 'nav-inactive'}`}>Matched Items</button>
          <button onClick={() => setAdminView('recovered-items')} className={`nav-btn transition px-3 py-1 rounded-md text-sm ${adminView==='recovered-items' ? 'nav-active' : 'nav-inactive'}`}>Recovered Items</button>
          <button onClick={async () => {
            // call backend logout if present, then clear local session and redirect to login
            try {
              await fetch(`${location.protocol}//${location.hostname}:8080/api/auth/logout`, { method: 'POST', credentials: 'include' });
            } catch (e) { /* ignore */ }
            try { localStorage.removeItem('campustrack_user'); } catch (e) {}
            navigate('/');
            // ensure full reload so app resets
            window.location.reload();
          }} className="px-3 py-1 bg-red-600 text-white rounded">Logout</button>
        </div>
      </nav>

      <div className="p-4 bg-white rounded shadow mt-6">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-xl font-semibold">Admin Dashboard</h2>
          {/* collapse toggle - visible on mobile and desktop */}
          <div className="flex items-center gap-2">
            <button onClick={() => setShowPanel(s => !s)} className="px-3 py-1 bg-gray-100 text-sm rounded md:hidden">{showPanel ? 'Hide' : 'Show'} Panel</button>
            <button onClick={() => setShowPanel(s => !s)} className="px-3 py-1 bg-gray-100 text-sm rounded hidden md:inline">{showPanel ? 'Collapse' : 'Expand'}</button>
          </div>
        </div>

      {stats ? (
        // If collapsed on mobile show a compact summary bar, otherwise full grid
        isMobile && !showPanel ? (
          <div className="flex gap-3 overflow-x-auto mb-4">
            <div className="p-2 bg-gray-50 rounded min-w-[140px] text-center">Users<br/><span className="text-lg font-bold">{stats.totalUsers}</span></div>
            <div className="p-2 bg-gray-50 rounded min-w-[140px] text-center">Lost<br/><span className="text-lg font-bold">{stats.lostCount ?? 0}</span></div>
            <div className="p-2 bg-gray-50 rounded min-w-[140px] text-center">Found<br/><span className="text-lg font-bold">{stats.foundCount ?? 0}</span></div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
            <div className="p-3 bg-gray-50 rounded">Users<br/><span className="text-2xl font-bold">{stats.totalUsers}</span></div>
            <div className="p-3 bg-gray-50 rounded">Chats<br/><span className="text-2xl font-bold">{stats.totalChats}</span></div>
            <div className="p-3 bg-gray-50 rounded">Blocks<br/><span className="text-2xl font-bold">{stats.totalBlocks}</span></div>
          </div>
        )
      ) : (
        <div>Loading stats...</div>
      )}

      {/* Real-time dashboard panel with cards */}
      {showPanel && (
        <div className="mb-4 grid grid-cols-5 gap-3">
          <div className="p-3 bg-white border rounded text-center">
            <div className="text-sm text-gray-600">Reported Lost</div>
            <div className="text-2xl font-bold">{stats?.lostCount ?? 0}</div>
          </div>
          <div className="p-3 bg-white border rounded text-center">
            <div className="text-sm text-gray-600">Found Items</div>
            <div className="text-2xl font-bold">{stats?.foundCount ?? 0}</div>
          </div>
          <div className="p-3 bg-white border rounded text-center">
            <div className="text-sm text-gray-600">Users</div>
            <div className="text-2xl font-bold">{stats?.totalUsers ?? 0}</div>
          </div>
          <div className="p-3 bg-white border rounded text-center">
            <div className="text-sm text-gray-600">Matched</div>
            <div className="text-2xl font-bold">{stats?.matchedCount ?? 0}</div>
          </div>
          <div className="p-3 bg-white border rounded text-center">
            <div className="text-sm text-gray-600">Recovered</div>
            <div className="text-2xl font-bold">{stats?.recoveredCount ?? 0}</div>
          </div>
        </div>
      )}

      {/* Admin content area - switch by adminView */}
      <div className="mt-4">
        {adminView === 'dashboard' && (
          <div>
            <h3 className="text-lg font-medium mb-2">Manage Users</h3>
            <div className="overflow-auto max-h-64 mb-6">
              <table className="w-full text-sm">
                <thead><tr><th className="text-left">Name</th><th>Email</th><th>Role</th><th>AdminId</th><th></th></tr></thead>
                <tbody>
                  {users.map(u => (
                    <tr key={u.id} className="border-t">
                      <td>{u.name}</td>
                      <td>{u.email}</td>
                      <td>{u.role || 'user'}</td>
                      <td>{u.adminId || '-'}</td>
                      <td className="text-right"><button onClick={() => deleteUser(u.id)} className="text-red-600">Delete</button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {adminView === 'manage-users' && (
          <div>
            <h3 className="text-lg font-medium mb-2">Manage Users</h3>
            <div className="overflow-auto max-h-80">
              <table className="w-full text-sm">
                <thead><tr><th className="text-left">Name</th><th>Email</th><th>Role</th><th>AdminId</th><th></th></tr></thead>
                <tbody>
                  {users.map(u => (
                    <tr key={u.id} className="border-t">
                      <td>{u.name}</td>
                      <td>{u.email}</td>
                      <td>{u.role || 'user'}</td>
                      <td>{u.adminId || '-'}</td>
                      <td className="text-right"><button onClick={() => deleteUser(u.id)} className="text-red-600">Delete</button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {adminView === 'lost-items' && (
          <div>
            <h3 className="text-lg font-medium mb-2">All Lost Items</h3>
            <div className="overflow-auto max-h-80">
              <table className="w-full text-sm">
                <thead><tr><th>Title</th><th>Reporter</th><th>Location</th><th>Date</th></tr></thead>
                <tbody>
                  {lostItems.map(l => (
                    <tr key={l.id} className="border-t">
                      <td>{l.title || l.name || l.itemName}</td>
                      <td>{l.reporterEmail || l.reporter || '-'}</td>
                      <td>{l.lostLocation || l.location || '-'}</td>
                      <td>{l.lostAt || l.createdAt || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {adminView === 'found-items' && (
          <div>
            <h3 className="text-lg font-medium mb-2">All Found Items</h3>
            <div className="overflow-auto max-h-80">
              <table className="w-full text-sm">
                <thead><tr><th>Title</th><th>Reporter</th><th>Location</th><th>Date</th></tr></thead>
                <tbody>
                  {foundItems.map(f => (
                    <tr key={f.id} className="border-t">
                      <td>{f.title || f.name || f.itemName}</td>
                      <td>{f.reporterEmail || f.reporter || '-'}</td>
                      <td>{f.foundLocation || f.location || '-'}</td>
                      <td>{f.foundAt || f.createdAt || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {adminView === 'reported-users' && (
          <div>
            <h3 className="text-lg font-medium mb-2">Reported Users</h3>
            <div className="overflow-auto max-h-80">
              <table className="w-full text-sm">
                <thead><tr><th>Name/Email</th><th></th></tr></thead>
                <tbody>
                  {reportedUsers.map(u => (
                    <tr key={u.email || u.id} className="border-t">
                      <td>{u.name || '-'} ({u.email})</td>
                      <td className="text-right"><button onClick={() => { if (u.id) deleteUser(u.id); }} className="text-red-600">Delete (if exists)</button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {adminView === 'matched-items' && (
          <div>
            <h3 className="text-lg font-medium mb-2">Matched / Confirmed Items</h3>
            <div className="overflow-auto max-h-80">
              <table className="w-full text-sm">
                <thead><tr><th>Lost Item</th><th>Found Item</th><th>Confirmed At</th></tr></thead>
                <tbody>
                  {matchedItems.map(m => (
                    <tr key={m.id || `${m.lostItemId}-${m.foundItemId}`} className="border-t">
                      <td>{m.lostItemId || m.lostTitle || '-'}</td>
                      <td>{m.foundItemId || m.foundTitle || '-'}</td>
                      <td>{m.createdAt || m.confirmedAt || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {adminView === 'recovered-items' && (
          <div>
            <h3 className="text-lg font-medium mb-2">Recovered (Backup) Items</h3>
            <div className="overflow-auto max-h-80">
              {recoveredItems.length === 0 ? (
                <div className="text-sm text-gray-600">No recovered items endpoint found or no records. If you want backend listing, add a /api/admin/backups endpoint that returns backup records.</div>
              ) : (
                <table className="w-full text-sm">
                  <thead><tr><th>Lost Snapshot</th><th>Found Snapshot</th><th>Archived At</th></tr></thead>
                  <tbody>
                    {recoveredItems.map(r => (
                      <tr key={r.id} className="border-t">
                        <td><pre className="text-xs max-h-28 overflow-auto">{r.lostItemSnapshot}</pre></td>
                        <td><pre className="text-xs max-h-28 overflow-auto">{r.foundItemSnapshot}</pre></td>
                        <td>{r.createdAt || r.archivedAt || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
    </div>
  );
}
