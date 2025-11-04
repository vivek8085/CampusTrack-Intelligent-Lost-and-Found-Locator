import React, { useEffect, useRef, useState } from 'react';

function initialsFromEmail(email) {
  if (!email) return '?';
  const name = email.split('@')[0];
  const parts = name.split(/[._-]/).filter(Boolean);
  if (parts.length === 0) return email[0].toUpperCase();
  if (parts.length === 1) return parts[0][0].toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
}

export default function ChatWindow({ initialTo = '', initialName = '', onClose }) {
  const [to, setTo] = useState(initialTo || '');
  const [name, setName] = useState(initialName || '');
  const [connected, setConnected] = useState(false);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const [typing, setTyping] = useState(false);
  const [showBlockModal, setShowBlockModal] = useState(false);
  const [blockReason, setBlockReason] = useState('');
  const wsRef = useRef(null);
  const listRef = useRef(null);
  const lastTypingSent = useRef(0);

  // load history and connect websocket when `to` changes
  useEffect(() => {
    let cancelled = false;

    const loadHistory = async (email) => {
      if (!email) return;
      try {
        const res = await fetch(`${location.protocol}//${location.hostname}:8080/api/chat/history?with=${encodeURIComponent(email)}`, { credentials: 'include' });
        if (res.ok) {
          const data = await res.json();
          if (!cancelled) {
            const mapped = data.map(d => ({ id: d.id, from: d.fromEmail, text: d.text, createdAt: d.createdAt, delivered: d.delivered }));
            setMessages(mapped);
          }
        }
      } catch (e) {
        // ignore
      }
    };

    // Clean up previous socket
    try { if (wsRef.current) { wsRef.current.close(); wsRef.current = null; } } catch (e) {}

    if (to) {
      loadHistory(to);

      try {
        const wsProto = location.protocol === 'https:' ? 'wss' : 'ws';
        const wsUrl = `${wsProto}://${location.hostname}:8080/ws/chat`;
        const ws = new WebSocket(wsUrl);
        wsRef.current = ws;
        ws.onopen = () => setConnected(true);
        ws.onmessage = (ev) => {
          try {
            const parsed = JSON.parse(ev.data);
            const meEmail = (JSON.parse(localStorage.getItem('campustrack_user') || '{}')).email;

            if (parsed.type === 'typing') {
              // only show typing when it's from the other participant
              if (parsed.from && parsed.from !== meEmail) {
                setTyping(true);
                // clear after 2s
                setTimeout(() => setTyping(false), 2000);
              }
              return;
            }

            if (parsed.type === 'read') {
              // mark specific message as delivered/read
              const mid = parsed.id;
              if (mid != null) {
                setMessages((m) => m.map(x => x.id === mid ? { ...x, delivered: true } : x));
              }
              return;
            }

            // normal message: reconcile sender's optimistic message
            const serverFrom = parsed.from || '';
            const isFromMe = meEmail && serverFrom && serverFrom.toLowerCase() === meEmail.toLowerCase();
            const serverMsg = { id: parsed.id, from: isFromMe ? 'me' : parsed.from, text: parsed.text || '', createdAt: parsed.createdAt || new Date().toISOString(), delivered: !!parsed.delivered };

            if (isFromMe) {
              // if we have an optimistic message (id === null) with same text, replace it instead of appending
              setMessages((m) => {
                const idx = m.map(x => x && x.id).lastIndexOf(null);
                if (idx !== -1 && m[idx].text === serverMsg.text) {
                  const copy = [...m];
                  copy[idx] = serverMsg;
                  return copy;
                }
                // otherwise append but mark as 'me'
                return [...m, serverMsg];
              });
            } else {
              // incoming from other user
              setMessages((m) => [...m, serverMsg]);
            }
          } catch (e) {
            setMessages((m) => [...m, { from: 'them', text: ev.data, createdAt: new Date().toISOString() }]);
          }
        };
        ws.onclose = () => setConnected(false);
        ws.onerror = () => setConnected(false);
      } catch (e) {
        setConnected(false);
      }
    } else {
      setMessages([]);
      setConnected(false);
    }

    return () => { cancelled = true; try { if (wsRef.current) wsRef.current.close(); } catch (e) {} };
  }, [to]);

  // Auto-scroll when messages change
  useEffect(() => {
    if (listRef.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight;
    }
    // when new messages from other user arrive, send read receipts
    const unreadFromThem = messages.filter(m => m.from !== 'me' && !m.delivered && m.id).map(m => m.id);
    if (unreadFromThem.length > 0 && wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      // send read receipts for each id
      unreadFromThem.forEach(id => {
        const payload = JSON.stringify({ type: 'read', to, id });
        try { wsRef.current.send(payload); } catch (e) {}
        // optimistically mark delivered locally
        setMessages((ms) => ms.map(x => x.id === id ? { ...x, delivered: true } : x));
      });
    }
  }, [messages, to]);

  const sendTyping = () => {
    const now = Date.now();
    if (now - lastTypingSent.current < 1000) return; // throttle to 1s
    lastTypingSent.current = now;
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN && to) {
      try { wsRef.current.send(JSON.stringify({ type: 'typing', to })); } catch (e) {}
    }
  };

  const sendMessage = () => {
    if (!text) return;
    if (connected && wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      const payload = JSON.stringify({ type: 'message', to, text });
      try { wsRef.current.send(payload); } catch (e) {}
      // optimistic UI: push temporary message (id will be replaced by server echo)
      setMessages((m) => [...m, { id: null, from: 'me', text, createdAt: new Date().toISOString(), delivered: false }]);
      setText('');
      return;
    }

    // Fallback: open mailto with message content
    const subject = encodeURIComponent(`CampusTrack message regarding your found item${name ? ` (${name})` : ''}`);
    const body = encodeURIComponent(text + '\n\n--\nSent from CampusTrack app');
    const mailto = `mailto:${encodeURIComponent(to)}?subject=${subject}&body=${body}`;
    window.location.href = mailto;
  };

  return (
    <div className="w-full bg-white shadow rounded p-3">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-blue-500 text-white flex items-center justify-center font-semibold">{initialsFromEmail(to || name)}</div>
          <div>
            <h3 className="text-lg font-semibold">{name || to ? `Chat — ${name || to}` : 'Start a chat'}</h3>
            <div className="text-sm text-gray-600">{to ? <a className="underline" href={`mailto:${to}`}>{to}</a> : 'Enter recipient email below'}</div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="text-sm text-gray-500">{connected ? <span className="text-green-600">Live</span> : <span>Offline</span>}</div>
          {onClose && (
            <>
              <button onClick={() => setShowBlockModal(true)} className="text-sm text-red-600 hover:text-red-800 mr-2">Report / Block</button>
              <button onClick={onClose} className="text-sm text-gray-600 hover:text-gray-900">Close</button>
            </>
          )}
        </div>

            {/* Block Reason Modal */}
            {showBlockModal && (
              <div className="fixed inset-0 z-50 flex items-center justify-center">
                <div className="absolute inset-0 bg-black opacity-40" onClick={() => setShowBlockModal(false)} />
                <div className="relative bg-white rounded shadow-lg max-w-md w-full p-4 z-60">
                  <h4 className="text-lg font-semibold mb-2">Report & Block {to}</h4>
                  <div className="text-sm text-gray-700 mb-2">Optionally add a reason for reporting. This will be saved for admins.</div>
                  <textarea className="w-full border rounded p-2 mb-3" rows={4} value={blockReason} onChange={(e) => setBlockReason(e.target.value)} placeholder="Reason (optional)" />
                  <div className="flex justify-end gap-2">
                    <button onClick={() => setShowBlockModal(false)} className="px-3 py-1 rounded border">Cancel</button>
                    <button onClick={async () => {
                      if (!to) return;
                      // call block endpoint with reason
                      try {
                        const params = new URLSearchParams();
                        params.set('with', to);
                        if (blockReason) params.set('reason', blockReason);
                        await fetch(`${location.protocol}//${location.hostname}:8080/api/chat/block?` + params.toString(), { method: 'POST', credentials: 'include' });
                      } catch (e) {
                        // ignore network errors
                      }
                      setShowBlockModal(false);
                      setBlockReason('');
                      if (onClose) onClose();
                    }} className="px-3 py-1 rounded bg-red-600 text-white">Report & Block</button>
                  </div>
                </div>
              </div>
            )}
      </div>

      <div className="mb-2">
        <input value={to} onChange={(e) => setTo(e.target.value)} placeholder="Recipient email (e.g. user@university.edu)" className="w-full border rounded p-2 text-sm" />
      </div>

      <div ref={listRef} className="border rounded p-3 mb-3 h-60 overflow-auto bg-gray-50">
        {messages.length === 0 ? (
          <div className="text-sm text-gray-500">No messages yet.</div>
        ) : (
          messages.map((m, i) => {
            const mine = m.from === 'me';
            return (
              <div key={i} className={`mb-3 flex ${mine ? 'justify-end' : 'justify-start'}`}>
                {!mine && (
                  <div className="mr-2 w-8 h-8 rounded-full bg-gray-300 text-gray-700 flex items-center justify-center text-sm font-semibold">{initialsFromEmail(m.from)}</div>
                )}
                <div className={`max-w-[75%] p-2 rounded-lg ${mine ? 'bg-blue-600 text-white rounded-br-none' : 'bg-gray-200 text-gray-800 rounded-bl-none'}`}>
                  <div className="whitespace-pre-wrap">{m.text}</div>
                  <div className="text-xs text-gray-300 mt-1 flex items-center justify-end gap-2">
                    <span className="text-gray-200">{m.createdAt ? new Date(m.createdAt).toLocaleTimeString() : ''}</span>
                    {mine && (
                      <span className="text-xs text-gray-100">{m.delivered ? '✓✓' : '✓'}</span>
                    )}
                  </div>
                </div>
                {mine && (
                  <div className="ml-2 w-8 h-8 rounded-full bg-transparent" />
                )}
              </div>
            );
          })
        )}
        {typing && (
          <div className="text-sm text-gray-500">Typing...</div>
        )}
      </div>

      <div className="flex gap-2">
        <textarea value={text} onChange={(e) => { setText(e.target.value); sendTyping(); }} placeholder={connected ? 'Type a message...' : 'Type a message (will open your email client if not connected)'} className="flex-1 border rounded p-2 text-sm" rows={3} />
        <div className="flex flex-col">
          <button onClick={sendMessage} className="mb-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded">Send</button>
          <a className="text-center text-sm text-gray-600 underline" href={`mailto:${to || ''}`}>Email instead</a>
        </div>
      </div>
    </div>
  );
}
