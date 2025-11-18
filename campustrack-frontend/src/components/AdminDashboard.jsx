import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AnimatedBackground from './AnimatedBackground';
import './AdminDashboard.css';
import adminBg from '../assets/admin-bg.gif';

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [showPanel, setShowPanel] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const [adminView, setAdminView] = useState('dashboard');
  const [lostItems, setLostItems] = useState([]);
  const [foundItems, setFoundItems] = useState([]);
  const [matchedItems, setMatchedItems] = useState([]);
  const [recoveredItems, setRecoveredItems] = useState([]);
  const [reportedUsers, setReportedUsers] = useState([]);
  // modal / selection state for viewing items
  const [selectedItem, setSelectedItem] = useState(null);
  const [selectedItemType, setSelectedItemType] = useState(null); // 'user'|'lost'|'found'|'match'|'backup'|'block'
  const [showItemModal, setShowItemModal] = useState(false);
  const [showBlockModal, setShowBlockModal] = useState(false);
  const [selectedBlock, setSelectedBlock] = useState(null);
  const [blockReason, setBlockReason] = useState('');

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

  const viewUser = (user) => {
    setSelectedItem(user);
    setSelectedItemType('user');
    setShowItemModal(true);
  };

  const viewLostItem = (item) => {
    setSelectedItem(item);
    setSelectedItemType('lost');
    setShowItemModal(true);
  };

  const viewFoundItem = (item) => {
    setSelectedItem(item);
    setSelectedItemType('found');
    setShowItemModal(true);
  };

  const viewMatch = (match) => {
    setSelectedItem(match);
    setSelectedItemType('match');
    setShowItemModal(true);
  };

  const closeItemModal = () => {
    setShowItemModal(false);
    setSelectedItem(null);
    setSelectedItemType(null);
  };

  // Try multiple likely endpoints to delete an item safely
  async function tryDeleteCandidates(candidates) {
    for (const c of candidates) {
      try {
        const res = await fetch(c.url, { method: c.method || 'POST', credentials: 'include' });
        if (res.ok) return true;
      } catch (e) {
        // ignore and try next
      }
    }
    return false;
  }

  const deleteLostItem = async (item) => {
    if (!item || !window.confirm('Delete this lost item? This may be irreversible.')) return;
    const id = item.id;
    const host = `${location.protocol}//${location.hostname}:8080`;
    const candidates = [
      { url: `${host}/api/lostitems/${id}/delete`, method: 'POST' },
      { url: `${host}/api/lostitems/${id}`, method: 'DELETE' },
      { url: `${host}/api/admin/lost/${id}/delete`, method: 'POST' },
    ];
    const ok = await tryDeleteCandidates(candidates);
    if (ok) {
      // refresh list
      setLostItems(prev => prev.filter(p => p.id !== id));
      await loadStats();
      alert('Deleted');
    } else {
      alert('Failed to delete - backend endpoint not available');
    }
  };

  const deleteFoundItem = async (item) => {
    if (!item || !window.confirm('Delete this found item? This may be irreversible.')) return;
    const id = item.id;
    const host = `${location.protocol}//${location.hostname}:8080`;
    const candidates = [
      { url: `${host}/api/founditems/${id}/delete`, method: 'POST' },
      { url: `${host}/api/founditems/${id}`, method: 'DELETE' },
      { url: `${host}/api/admin/found/${id}/delete`, method: 'POST' },
    ];
    const ok = await tryDeleteCandidates(candidates);
    if (ok) {
      setFoundItems(prev => prev.filter(p => p.id !== id));
      await loadStats();
      alert('Deleted');
    } else {
      alert('Failed to delete - backend endpoint not available');
    }
  };

  // For confirmed matches, the backend exposes an archive/receive endpoint
  const removeMatch = async (m) => {
    if (!m || !window.confirm('Remove/confirm received for this match? This will archive and may delete related items.')) return;
    const host = `${location.protocol}//${location.hostname}:8080`;
    try {
      const r = await fetch(`${host}/api/notifications/${m.id}/received`, { method: 'POST', credentials: 'include' });
      if (r.ok) {
        setMatchedItems(prev => prev.filter(x => (x.id || `${x.lostItemId}-${x.foundItemId}`) !== (m.id || `${m.lostItemId}-${m.foundItemId}`)));
        await loadStats();
        alert('Match removed / archived');
      } else {
        alert('Failed to remove match');
      }
    } catch (e) { alert('Error removing match'); }
  };

  const restoreBackup = async (b) => {
    if (!b || !window.confirm('Restore this backup record?')) return;
    const id = b.id;
    const host = `${location.protocol}//${location.hostname}:8080`;
    try {
      const r = await fetch(`${host}/api/admin/backups/${id}/restore`, { method: 'POST', credentials: 'include' });
      if (r.ok) {
        alert('Backup restored successfully');
        await loadStats();
      } else {
        alert('Failed to restore backup');
      }
    } catch (e) {
      alert('Error restoring backup');
    }
  };

  const deleteBackup = async (b) => {
    if (!b || !window.confirm('Delete this backup record?')) return;
    const id = b.id;
    const host = `${location.protocol}//${location.hostname}:8080`;
    const candidates = [
      { url: `${host}/api/backups/${id}/delete`, method: 'POST' },
      { url: `${host}/api/admin/backups/${id}/delete`, method: 'POST' },
      { url: `${host}/api/backups/${id}`, method: 'DELETE' },
    ];
    const ok = await tryDeleteCandidates(candidates);
    if (ok) {
      setRecoveredItems(prev => prev.filter(p => p.id !== id));
      await loadStats();
      alert('Deleted backup');
    } else {
      alert('Failed to delete backup');
    }
  };

  const unblock = async (id) => {
    if (!window.confirm('Remove this report/block record?')) return;
    try {
      await fetch(`${location.protocol}//${location.hostname}:8080/api/admin/block/${id}/delete`, { method: 'POST', credentials: 'include' });
      setReportedUsers(prev => prev.filter(p => p.id !== id));
      await loadStats();
    } catch (e) {}
  };

  const fetchBlocks = async () => {
    try {
      const r = await fetch(`${location.protocol}//${location.hostname}:8080/api/admin/blocks`, { credentials: 'include' });
      if (r.ok) setReportedUsers(await r.json());
      else setReportedUsers([]);
    } catch (e) { setReportedUsers([]); }
  };

  const openBlockModal = (row) => {
    setSelectedBlock(row);
    setBlockReason(row?.reason || '');
    setShowBlockModal(true);
  };

  const closeBlockModal = () => {
    setShowBlockModal(false);
    setSelectedBlock(null);
    setBlockReason('');
  };

  const submitBlock = async () => {
    if (!selectedBlock) return;
    if (!window.confirm(`Block user ${selectedBlock.blockedEmail || selectedBlock.blocked || ''}?`)) return;
    try {
      const params = new URLSearchParams();
      params.set('email', (selectedBlock.blockedEmail || selectedBlock.blocked).toLowerCase());
      if (blockReason) params.set('reason', blockReason);
      const r = await fetch(`${location.protocol}//${location.hostname}:8080/api/admin/blockUser?` + params.toString(), { method: 'POST', credentials: 'include' });
      if (r.ok) {
        // refresh blocks list
        await fetchBlocks();
        await loadStats();
        closeBlockModal();
      } else {
        // show error (simple alert for now)
        const txt = await r.text().catch(()=>'Error');
        alert('Failed to block user: ' + txt);
      }
    } catch (e) { alert('Error blocking user'); }
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
          // fetch stored user blocks (reports) from the backend
          try {
            const r = await fetch(`${location.protocol}//${location.hostname}:8080/api/admin/blocks`, { credentials: 'include' });
            if (r.ok) {
              const arr = await r.json();
              // expected shape: { id, blockerEmail, blockedEmail, reason, createdAt }
              setReportedUsers(arr || []);
            } else {
              setReportedUsers([]);
            }
          } catch (e) { setReportedUsers([]); }
        }
      } catch (e) { /* ignore errors */ }
    }
    loadForView();
  }, [adminView]);

  return (
    <div className={`relative min-h-screen admin-container admin-gif ${adminView === 'dashboard' ? 'admin-transparent' : ''}`}>
      {/* Admin GIF background (imported from src/assets) */}
      <img src={adminBg} alt="" className="admin-gif-bg" aria-hidden />
      {adminView === 'dashboard' && <AnimatedBackground />}
      <div className="relative z-10">
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
          }} className="px-3 py-1 bg-red-600 text-white rounded btn-hover">Logout</button>
        </div>
      </nav>

      <div className="p-4 bg-white rounded shadow mt-6">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-xl font-semibold">Dashboard</h2>
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
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4 anim-grid">
            <div className="p-3 bg-gray-50 rounded anim-card">Users<br/><span className="text-2xl font-bold">{stats.totalUsers}</span></div>
            <div className="p-3 bg-gray-50 rounded anim-card">Chats<br/><span className="text-2xl font-bold">{stats.totalChats}</span></div>
            <div className="p-3 bg-gray-50 rounded anim-card">Blocks<br/><span className="text-2xl font-bold">{stats.totalBlocks}</span></div>
          </div>
        )
      ) : (
        <div>Loading stats...</div>
      )}

      {/* Real-time dashboard panel with cards */}
      {showPanel && (
        <div className="mb-4 grid grid-cols-5 gap-3">
          <div className="p-3 bg-white text-center anim-card">
            <div className="text-sm text-gray-600">Reported Lost</div>
            <div className="text-2xl font-bold">{stats?.lostCount ?? 0}</div>
          </div>
          <div className="p-3 bg-white text-center anim-card">
            <div className="text-sm text-gray-600">Found Items</div>
            <div className="text-2xl font-bold">{stats?.foundCount ?? 0}</div>
          </div>
          <div className="p-3 bg-white text-center anim-card">
            <div className="text-sm text-gray-600">Users</div>
            <div className="text-2xl font-bold">{stats?.totalUsers ?? 0}</div>
          </div>
          <div className="p-3 bg-white text-center anim-card">
            <div className="text-sm text-gray-600">Matched</div>
            <div className="text-2xl font-bold">{stats?.matchedCount ?? 0}</div>
          </div>
          <div className="p-3 bg-white text-center anim-card">
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
              <table className="admin-table w-full text-sm">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Role</th>
                    <th>AdminId</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map(u => (
                    <tr key={u.id} className="border-t">
                      <td>{u.name}</td>
                      <td>{u.email}</td>
                      <td>{u.role || 'user'}</td>
                      <td>{u.adminId || '-'}</td>
                      <td>
                        <div className="table-actions">
                          <button className="table-btn view" onClick={() => viewUser(u)}>View</button>
                          <button className="table-btn danger" onClick={() => deleteUser(u.id)}>Delete</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Generic item modal for viewing details */}
        {showItemModal && selectedItem && (
          <div className="modal-center" role="dialog" aria-modal="true">
            <div className="modal-backdrop" onClick={closeItemModal}></div>
            <div className="modal-card max-w-2xl">
              <div className="flex justify-between items-start">
                <h4 className="text-lg font-semibold mb-2">{selectedItemType === 'user' ? 'User' : selectedItemType === 'lost' ? 'Lost Item' : selectedItemType === 'found' ? 'Found Item' : selectedItemType === 'match' ? 'Match' : selectedItemType === 'backup' ? 'Backup' : 'Details'}</h4>
                <button onClick={closeItemModal} className="text-sm px-2 py-1">Close</button>
              </div>
              <div className="modal-body text-sm text-gray-700 mb-3">
                {selectedItemType === 'user' && (
                  <div>
                    <div><strong>Name:</strong> {selectedItem.name}</div>
                    <div><strong>Email:</strong> {selectedItem.email}</div>
                    <div><strong>Role:</strong> {selectedItem.role}</div>
                    <div className="mt-2"><pre className="text-xs overflow-auto">{JSON.stringify(selectedItem, null, 2)}</pre></div>
                  </div>
                )}
                {selectedItemType === 'lost' && (
                  <div>
                    {selectedItem.imageUrl && <img src={`${location.protocol}//${location.hostname}:8080${selectedItem.imageUrl}`} alt="item" className="w-full max-h-64 object-cover rounded mb-2" />}
                    <div><strong>Title:</strong> {selectedItem.title || selectedItem.itemName}</div>
                    <div><strong>Reporter:</strong> {selectedItem.reporterEmail || selectedItem.reporter}</div>
                    <div><strong>Location:</strong> {selectedItem.lostLocation || selectedItem.location}</div>
                    <div className="mt-2"><pre className="text-xs overflow-auto">{JSON.stringify(selectedItem, null, 2)}</pre></div>
                  </div>
                )}
                {selectedItemType === 'found' && (
                  <div>
                    {selectedItem.imageUrl && <img src={`${selectedItem.imageUrl.startsWith('/uploads/') ? `${location.protocol}//${location.hostname}:8080${selectedItem.imageUrl}` : selectedItem.imageUrl}`} alt="item" className="w-full max-h-64 object-cover rounded mb-2" />}
                    <div><strong>Title:</strong> {selectedItem.title || selectedItem.itemName}</div>
                    <div><strong>Reporter:</strong> {selectedItem.reporterEmail || selectedItem.reporter}</div>
                    <div><strong>Location:</strong> {selectedItem.foundLocation || selectedItem.location}</div>
                    <div className="mt-2"><pre className="text-xs overflow-auto">{JSON.stringify(selectedItem, null, 2)}</pre></div>
                  </div>
                )}
                {selectedItemType === 'match' && (
                  <div>
                    <div><strong>Lost:</strong> {selectedItem.lostTitle || selectedItem.lostItemId}</div>
                    <div><strong>Found:</strong> {selectedItem.foundTitle || selectedItem.foundItemId}</div>
                    <div><strong>Confirmed At:</strong> {selectedItem.createdAt || selectedItem.confirmedAt}</div>
                    <div className="mt-2"><pre className="text-xs overflow-auto">{JSON.stringify(selectedItem, null, 2)}</pre></div>
                  </div>
                )}
                {selectedItemType === 'backup' && (
                  <div>
                    <div><strong>Archived At:</strong> {selectedItem.createdAt || selectedItem.archivedAt}</div>
                    <div className="grid grid-cols-2 gap-2">
                      <div><strong>Lost Snapshot</strong><pre className="text-xs max-h-56 overflow-auto">{selectedItem.lostItemSnapshot}</pre></div>
                      <div><strong>Found Snapshot</strong><pre className="text-xs max-h-56 overflow-auto">{selectedItem.foundItemSnapshot}</pre></div>
                    </div>
                  </div>
                )}
              </div>
              <div className="modal-actions flex gap-2">
                {selectedItemType === 'lost' && <button onClick={() => { deleteLostItem(selectedItem); closeItemModal(); }} className="px-3 py-1 rounded bg-red-600 text-white">Delete Lost</button>}
                {selectedItemType === 'found' && <button onClick={() => { deleteFoundItem(selectedItem); closeItemModal(); }} className="px-3 py-1 rounded bg-red-600 text-white">Delete Found</button>}
                {selectedItemType === 'match' && <button onClick={() => { removeMatch(selectedItem); closeItemModal(); }} className="px-3 py-1 rounded bg-red-600 text-white">Remove Match</button>}
                {selectedItemType === 'backup' && <><button onClick={() => { restoreBackup(selectedItem); closeItemModal(); }} className="px-3 py-1 rounded bg-green-600 text-white">Restore</button>
                <button onClick={() => { deleteBackup(selectedItem); closeItemModal(); }} className="px-3 py-1 rounded bg-red-600 text-white">Delete Backup</button></>}
                <button onClick={closeItemModal} className="px-3 py-1 rounded border">Close</button>
              </div>
            </div>
          </div>
        )}

        {adminView === 'manage-users' && (
          <div>
            <h3 className="text-lg font-medium mb-2">Manage Users</h3>
            <div className="overflow-auto max-h-80">
              <table className="admin-table w-full text-sm">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Role</th>
                    <th>AdminId</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map(u => (
                    <tr key={u.id} className="border-t">
                      <td>{u.name}</td>
                      <td>{u.email}</td>
                      <td>{u.role || 'user'}</td>
                      <td>{u.adminId || '-'}</td>
                      <td>
                        <div className="table-actions">
                          <button className="table-btn view" onClick={() => viewUser(u)}>View</button>
                          <button className="table-btn danger" onClick={() => deleteUser(u.id)}>Delete</button>
                        </div>
                      </td>
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
              <table className="admin-table w-full text-sm">
                <thead>
                  <tr>
                    <th>Title</th>
                    <th>Reporter</th>
                    <th>Location</th>
                    <th>Date</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {lostItems.map(l => (
                    <tr key={l.id} className="border-t">
                      <td>{l.title || l.name || l.itemName}</td>
                      <td>{l.reporterEmail || l.reporter || '-'}</td>
                      <td>{l.lostLocation || l.location || '-'}</td>
                      <td>{l.lostAt || l.createdAt || '-'}</td>
                      <td>
                        <div className="table-actions">
                          <button className="table-btn view" onClick={() => viewLostItem(l)}>View</button>
                          <button className="table-btn danger" onClick={() => deleteLostItem(l)}>Delete</button>
                        </div>
                      </td>
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
              <table className="admin-table w-full text-sm">
                <thead>
                  <tr>
                    <th>Title</th>
                    <th>Reporter</th>
                    <th>Location</th>
                    <th>Date</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {foundItems.map(f => (
                    <tr key={f.id} className="border-t">
                      <td>{f.title || f.name || f.itemName}</td>
                      <td>{f.reporterEmail || f.reporter || '-'}</td>
                      <td>{f.foundLocation || f.location || '-'}</td>
                      <td>{f.foundAt || f.createdAt || '-'}</td>
                      <td>
                        <div className="table-actions">
                          <button className="table-btn view" onClick={() => viewFoundItem(f)}>View</button>
                          <button className="table-btn danger" onClick={() => deleteFoundItem(f)}>Delete</button>
                        </div>
                      </td>
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
              <table className="admin-table w-full text-sm">
                <thead>
                  <tr>
                    <th>Reporter</th>
                    <th>Reported</th>
                    <th>Reason</th>
                    <th>Date</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {reportedUsers.map(r => (
                    <tr key={r.id || `${r.blockerEmail}-${r.blockedEmail}-${r.createdAt}`} className="border-t">
                      <td className="whitespace-nowrap">{r.blockerEmail || r.blocker || '-'}</td>
                      <td className="whitespace-nowrap">{r.blockedEmail || r.blocked || '-'}</td>
                      <td className="max-w-xs text-sm text-gray-700"><div className="truncate">{r.reason || '-'}</div></td>
                      <td className="whitespace-nowrap">{r.createdAt || r.createdAtString || '-'}</td>
                      <td>
                        <div className="table-actions">
                          <button className="table-btn view" onClick={() => openBlockModal(r)}>View</button>
                          <button className="table-btn danger" onClick={() => unblock(r.id)}>Unblock</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Block modal */}
        {showBlockModal && selectedBlock && (
          <div className="modal-center" role="dialog" aria-modal="true">
            <div className="modal-backdrop" onClick={closeBlockModal}></div>
            <div className="modal-card">
              <h4 className="text-lg font-semibold mb-2">Block User: {selectedBlock.blockedEmail || selectedBlock.blocked}</h4>
              <div className="modal-body text-sm text-gray-700 mb-2">Reporter: {selectedBlock.blockerEmail || selectedBlock.blocker || '-'}</div>
              <div className="modal-body text-sm text-gray-700 mb-2">Original reason (if any): {selectedBlock.reason || '-'}</div>
              <div className="mb-2">
                <label className="text-sm font-medium">Add / edit admin reason</label>
                <textarea className="w-full border rounded p-2 mt-1" rows={4} value={blockReason} onChange={(e) => setBlockReason(e.target.value)} placeholder="Reason (optional)" />
              </div>
              <div className="modal-actions">
                <button onClick={closeBlockModal} className="px-3 py-1 rounded border">Cancel</button>
                <button onClick={submitBlock} className="px-3 py-1 rounded bg-red-600 text-white">Block User</button>
              </div>
            </div>
          </div>
        )}

        {adminView === 'matched-items' && (
          <div>
            <h3 className="text-lg font-medium mb-2">Matched / Confirmed Items</h3>
            <div className="overflow-auto max-h-80">
              <table className="admin-table w-full text-sm">
                <thead>
                  <tr>
                    <th>Lost Item</th>
                    <th>Found Item</th>
                    <th>Confirmed At</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {matchedItems.map(m => (
                    <tr key={m.id || `${m.lostItemId}-${m.foundItemId}`} className="border-t">
                      <td>{m.lostItemId || m.lostTitle || '-'}</td>
                      <td>{m.foundItemId || m.foundTitle || '-'}</td>
                      <td>{m.createdAt || m.confirmedAt || '-'}</td>
                      <td>
                        <div className="table-actions">
                          <button className="table-btn view" onClick={() => viewMatch(m)}>View</button>
                          <button className="table-btn danger" onClick={() => removeMatch(m)}>Remove</button>
                        </div>
                      </td>
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
                <table className="admin-table w-full text-sm">
                  <thead>
                    <tr>
                      <th>Lost Snapshot</th>
                      <th>Found Snapshot</th>
                      <th>Archived At</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recoveredItems.map(r => (
                      <tr key={r.id} className="border-t">
                        <td><pre className="text-xs max-h-28 overflow-auto">{r.lostItemSnapshot}</pre></td>
                        <td><pre className="text-xs max-h-28 overflow-auto">{r.foundItemSnapshot}</pre></td>
                        <td>{r.createdAt || r.archivedAt || '-'}</td>
                        <td>
                          <div className="table-actions">
                            <button className="table-btn ghost" onClick={() => restoreBackup(r)}>Restore</button>
                            <button className="table-btn danger" onClick={() => deleteBackup(r)}>Delete</button>
                          </div>
                        </td>
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
  </div>
  );
}
