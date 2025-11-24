import React, { useEffect, useState } from 'react';
import './UserDashboard.css';

export default function UserDashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [changed, setChanged] = useState({});
  const [notices, setNotices] = useState([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [noticeTitle, setNoticeTitle] = useState('');
  const [noticeContent, setNoticeContent] = useState('');

  const fetchStats = async () => {
    try {
      const res = await fetch(`${location.protocol}//${location.hostname}:8080/api/dashboard`, { credentials: 'include' });
      if (res.ok) return await res.json();
    } catch (e) {}
    try {
      const res2 = await fetch(`${location.protocol}//${location.hostname}:8080/api/admin/dashboard`, { credentials: 'include' });
      if (res2.ok) return await res2.json();
    } catch (e) {}
    return null;
  };

  // Try to obtain overall counts for matched and recovered items using admin endpoints
  const fetchOverallCounts = async () => {
    const host = `${location.protocol}//${location.hostname}:8080`;
    const out = {};
    try {
      const r = await fetch(`${host}/api/notifications/confirmed`, { credentials: 'include' });
      if (r.ok) {
        const arr = await r.json();
        out.overallMatchedCount = Array.isArray(arr) ? arr.length : (arr?.total || null);
      }
    } catch (e) { /* ignore */ }

    // recovered / backups endpoints - try a few candidates
    const candidates = ['/api/backups/all', '/api/backup/all', '/api/admin/backups', '/api/notifications/backups'];
    for (const c of candidates) {
      try {
        const r2 = await fetch(`${host}${c}`, { credentials: 'include' });
        if (r2.ok) {
          const arr2 = await r2.json();
          out.overallRecoveredCount = Array.isArray(arr2) ? arr2.length : (arr2?.total || null);
          break;
        }
      } catch (e) { /* ignore and try next */ }
    }

    return out;
  };

  // load once and set up polling + event listeners for near real-time updates
  useEffect(() => {
    let mounted = true;
    let interval = null;

    const doLoad = async () => {
      if (!mounted) return;
      setLoading(true);
      const data = await fetchStats();
      if (!mounted) return;
      if (data) {
        // detect changes for a simple flash animation
        const diffs = {};
        const keys = ['lostCount','foundCount','matchedCount','recoveredCount','matches','recovered','overallMatchedCount','overallRecoveredCount'];
        for (const k of keys) {
          const newVal = data[k] ?? data[k.replace(/Count$/,'Count')] ?? null;
          const oldVal = stats?.[k] ?? stats?.[k.replace(/Count$/,'Count')] ?? null;
          if (oldVal !== null && newVal !== null && oldVal !== newVal) diffs[k] = true;
        }
        // attempt to also fetch overall counts and merge them in
        let overall = {};
        try { overall = await fetchOverallCounts(); } catch (e) { overall = {}; }
        if (mounted) {
          setStats(prev => ({ ...(prev||{}), ...data, ...overall }));
          // detect admin (admin dashboard contains totalUsers)
          setIsAdmin(Boolean(data && data.totalUsers !== undefined));
          if (Object.keys(diffs).length) {
            setChanged(diffs);
            // clear highlight after short time
            setTimeout(() => { if (mounted) setChanged({}); }, 900);
          }
        }
      } else {
        if (mounted && !stats) setStats({ lostCount:0, foundCount:0, matchedCount:0, recoveredCount:0 });
      }
      // fetch notices regardless of admin or user
      try { if (mounted) await fetchNotices(); } catch (e) { /* ignore */ }
      if (mounted) setLoading(false);
    };

    // initial load
    doLoad();

    // poll every 10 seconds
    interval = setInterval(doLoad, 10000);

    // listen for manual triggers from other parts of the app
    const onTrigger = () => { doLoad(); };
    window.addEventListener('campustrack:refreshStats', onTrigger);
    window.addEventListener('campustrack:itemChanged', onTrigger);
    window.addEventListener('campustrack:matchConfirmed', onTrigger);

    return () => {
      mounted = false;
      if (interval) clearInterval(interval);
      window.removeEventListener('campustrack:refreshStats', onTrigger);
      window.removeEventListener('campustrack:itemChanged', onTrigger);
      window.removeEventListener('campustrack:matchConfirmed', onTrigger);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchNotices = async () => {
    try {
      const host = `${location.protocol}//${location.hostname}:8080`;
      const res = await fetch(`${host}/api/notices`, { credentials: 'include' });
      if (!res.ok) return setNotices([]);
      const arr = await res.json();
      setNotices(arr || []);
    } catch (e) {
      setNotices([]);
    }
  };

  const createNotice = async () => {
    try {
      const host = `${location.protocol}//${location.hostname}:8080`;
      const res = await fetch(`${host}/api/admin/notices`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: noticeTitle, content: noticeContent })
      });
      if (!res.ok) throw new Error('Failed');
      setNoticeTitle(''); setNoticeContent('');
      await fetchNotices();
    } catch (e) {
      alert('Failed to create notice');
    }
  };

  const deleteNotice = async (id) => {
    if (!confirm('Delete this notice?')) return;
    try {
      const host = `${location.protocol}//${location.hostname}:8080`;
      const res = await fetch(`${host}/api/admin/notices/${id}`, { method: 'DELETE', credentials: 'include' });
      if (!res.ok) throw new Error('Failed');
      await fetchNotices();
    } catch (e) {
      alert('Failed to delete notice');
    }
  };

  const refresh = async () => {
    setLoading(true);
    const data = await fetchStats();
    const overall = await fetchOverallCounts();
    if (data) setStats({ ...(data||{}), ...(overall||{}) });
    setLoading(false);
  };

  return (
    <div className="user-dashboard">
      <div className="dashboard-header flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold">My Dashboard</h2>
        <div>
          <button onClick={refresh} className="btn-refresh">Refresh</button>
        </div>
      </div>

      <div className="cards-grid">
        <div className={`card ${changed.lostCount ? 'flash' : ''}`}>
          <div className="card-title">Lost Items</div>
          <div className="card-value">{loading ? '…' : (stats?.lostCount ?? 0)}</div>
          <div className="card-sub">Items you reported lost</div>
        </div>

        <div className={`card ${changed.foundCount ? 'flash' : ''}`}>
          <div className="card-title">Found Items</div>
          <div className="card-value">{loading ? '…' : (stats?.foundCount ?? 0)}</div>
          <div className="card-sub">Items reported found on campus</div>
        </div>

        <div className={`card ${(changed.overallMatchedCount || changed.matchedCount || changed.matches) ? 'flash' : ''}`}>
          <div className="card-title">Matched</div>
          <div className="card-value">{loading ? '…' : (stats?.overallMatchedCount ?? stats?.matchedCount ?? stats?.matches ?? 0)}</div>
          <div className="card-sub">{stats?.overallMatchedCount !== undefined ? 'Overall matched items' : 'Potential matches for your items'}</div>
        </div>

        <div className={`card ${(changed.overallRecoveredCount || changed.recoveredCount || changed.recovered) ? 'flash' : ''}`}>
          <div className="card-title">Recovered</div>
          <div className="card-value">{loading ? '…' : (stats?.overallRecoveredCount ?? stats?.recoveredCount ?? stats?.recovered ?? 0)}</div>
          <div className="card-sub">{stats?.overallRecoveredCount !== undefined ? 'Overall recovered items' : 'Items successfully returned'}</div>
        </div>
      </div>

      <div className="mt-4 text-sm text-gray-600">
        {stats ? (
          <div>Last updated: {new Date().toLocaleString()}</div>
        ) : (
          <div>Stats unavailable. Try refreshing.</div>
        )}
      </div>

      <div className="mt-6 notices">
        <h3 className="text-lg font-semibold mb-2">Announcements</h3>
        {isAdmin && (
          <div className="mb-4 p-3 border rounded bg-white">
            <input value={noticeTitle} onChange={e => setNoticeTitle(e.target.value)} placeholder="Title" className="w-full p-2 border rounded mb-2" />
            <textarea value={noticeContent} onChange={e => setNoticeContent(e.target.value)} placeholder="Message" className="w-full p-2 border rounded mb-2" rows={3} />
            <div>
              <button onClick={createNotice} className="btn-primary">Publish</button>
            </div>
          </div>
        )}

        {notices.length === 0 ? (
          <div className="text-gray-600">No announcements</div>
        ) : (
          <div className="space-y-3">
            {notices.map(n => (
              <div key={n.id} className="p-3 bg-white border rounded notice-card">
                <div className="notice-badge" aria-hidden>
                  <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                    <path d="M12 22s1.5-1 4-1 4-1 4-4-1.5-4-1.5-6.5S18.5 6 12 6 5.5 8.5 5.5 10.5 4 14 4 16s1.5 3 4 3 4 1 4 1z" fill="currentColor" />
                    <circle cx="18" cy="6" r="3" fill="#fff" opacity="0.08" />
                  </svg>
                  <span className="sr-only">Announcement</span>
                </div>
                <div className="flex justify-between items-start">
                  <div>
                    <div className="font-semibold">{n.title || 'Notice'}</div>
                    <div className="text-sm text-gray-600">{n.content}</div>
                  </div>
                  <div className="text-sm text-gray-500">
                    {/* <div>{n.authorEmail}</div> */}
                    <div>{n.createdAt ? new Date(n.createdAt).toLocaleString() : ''}</div>
                    {isAdmin && <button onClick={() => deleteNotice(n.id)} className="ml-2 text-red-600">Delete</button>}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
