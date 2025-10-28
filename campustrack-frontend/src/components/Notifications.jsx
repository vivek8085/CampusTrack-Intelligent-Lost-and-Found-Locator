import React, { useEffect, useState } from 'react';

export default function Notifications() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let mounted = true;
    const fetchNotifications = async () => {
      setLoading(true);
      setError('');

      // Build backend URL; try explicit localhost fallback for dev servers
      const primary = `${location.protocol}//${location.hostname}:8080`;
      const fallback = `http://localhost:8080`;
      const urlsToTry = [primary, fallback];

      try {
        let lastErr = null;
        for (const base of urlsToTry) {
          try {
            // diagnostic logging to console to help debug 'Failed to fetch'
            // (will not leak to users)
            // eslint-disable-next-line no-console
            console.debug('[Notifications] trying backend:', base + '/api/notifications/my');
            const res = await fetch(`${base}/api/notifications/my`, { credentials: 'include', headers: { Accept: 'application/json' } });
            if (res.status === 401) {
              if (mounted) setError('Please log in to view your confirmed matches.');
              return;
            }
            if (!res.ok) {
              lastErr = new Error(`Request failed with status ${res.status}`);
              continue;
            }
            const data = await res.json();
            if (!mounted) return;
            setNotifications(data || []);
            lastErr = null;
            break;
          } catch (e) {
            lastErr = e;
            // try next URL
            // eslint-disable-next-line no-console
            console.warn('[Notifications] fetch attempt failed for', base, e.message || e);
          }
        }

        if (lastErr) {
          throw lastErr;
        }
        // If we got no notifications and we have a stored user email, try public fallback by email
        const stored = localStorage.getItem('campustrack_user');
        if ((!notifications || notifications.length === 0) && stored) {
          try {
            const email = JSON.parse(stored).email;
            if (email) {
              const fb = `${fallback}/api/notifications/for-email/${encodeURIComponent(email)}`;
              // eslint-disable-next-line no-console
              console.debug('[Notifications] trying fallback by email:', fb);
              const fres = await fetch(fb, { headers: { Accept: 'application/json' } });
              if (fres.ok) {
                const fdata = await fres.json();
                if (mounted) setNotifications(fdata || []);
              }
            }
          } catch (e) {
            // eslint-disable-next-line no-console
            console.warn('[Notifications] fallback by email failed', e.message || e);
          }
        }
      } catch (err) {
        // eslint-disable-next-line no-console
        console.error('[Notifications] failed to load notifications:', err);
        if (mounted) setError(`Failed to load notifications: ${err.message || err}`);
      } finally {
        if (mounted) setLoading(false);
      }
    };
    fetchNotifications();
    return () => { mounted = false; };
  }, []);

  return (
    <div className="bg-white p-4 rounded shadow max-w-3xl mx-auto">
      <h2 className="text-xl font-semibold mb-3">Confirmed Matches</h2>

      {loading && <div className="text-sm text-gray-600">Loading notifications…</div>}
      {error && <div className="text-sm text-red-500">{error}</div>}

      {!loading && notifications.length === 0 && !error && (
        <div className="text-sm text-gray-500">No confirmed matches yet.</div>
      )}

      {notifications.length > 0 && (
        <div className="space-y-3 mt-3">
          {notifications.map(n => (
            <div key={n.id} className="p-3 border rounded">
              <div className="flex justify-between items-start">
                <div>
                  <div className="text-sm text-gray-700">{n.message}</div>
                  {/* Friendly rendering: message already contains "Your lost item 'X' was found by Name." */}
                  { (n.foundReporterName || n.foundReporterEmail) && (
                    <div className="text-sm text-blue-600 mt-2">
                      Found by: {n.foundReporterName ? n.foundReporterName : n.foundReporterEmail}
                      {n.foundReporterEmail && (
                        <span className="ml-2">(Contact: <a className="underline" href={`mailto:${n.foundReporterEmail}`}>{n.foundReporterEmail}</a>)</span>
                      )}
                    </div>
                  )}
                </div>
                <div className="text-xs text-gray-500">{new Date(n.createdAt).toLocaleString()}</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
