import React, { useEffect, useState } from 'react';
import { API_BASE } from '../utils/api';

export default function ConversationList({ onSelect }) {
  const [convs, setConvs] = useState([]);
  const [loading, setLoading] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/chat/conversations`, { credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        setConvs(data);
      }
    } catch (e) {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    const t = setInterval(load, 15_000); // refresh every 15s
    return () => clearInterval(t);
  }, []);

  // Listen to immediate read notifications so the list can clear the dot without waiting for the poll
  useEffect(() => {
    function onRead(e) {
      const partner = e?.detail?.partner;
      if (!partner) return;
      setConvs((prev) => prev.map(c => c.partnerEmail === partner ? { ...c, unreadCount: 0, lastOutgoingUndelivered: false } : c));
    }
    window.addEventListener('campustrack:conversationRead', onRead);
    return () => window.removeEventListener('campustrack:conversationRead', onRead);
  }, []);

  return (
    <div className="bg-white border rounded p-2 h-72 overflow-auto">
      <div className="text-sm font-semibold mb-2">Conversations</div>
      {loading && <div className="text-xs text-gray-500">Loading...</div>}
      {convs.length === 0 && !loading && <div className="text-sm text-gray-500">No conversations yet.</div>}
      <ul>
        {convs.map((c) => (
          <li key={c.partnerEmail} className="flex items-center gap-2 p-2 hover:bg-gray-50 rounded cursor-pointer" onClick={() => onSelect(c)}>
            <div className="relative">
              <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center text-sm font-semibold">{(c.partnerEmail||'?').split('@')[0].split(/[._-]/).map(s=>s[0]).slice(0,2).join('').toUpperCase()}</div>
              {(c.unreadCount > 0 || c.lastOutgoingUndelivered) && <span className="absolute -top-0 -right-0 w-3 h-3 bg-red-600 rounded-full" aria-hidden="true" />}
            </div>
            <div className="flex-1">
              <div className="text-sm font-medium">{c.partnerEmail}</div>
              <div className="text-xs text-gray-500 truncate">{c.lastText || ''}</div>
            </div>
            {c.unreadCount > 0 && <div className="bg-red-500 text-white text-xs px-2 py-1 rounded">{c.unreadCount}</div>}
          </li>
        ))}
      </ul>
    </div>
  );
}
