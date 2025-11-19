import { useState, useEffect, useRef } from "react";
import { useNavigate } from 'react-router-dom';
import LoginSignup from "./components/LoginSignup";
import LostItemForm from "./components/LostItemForm";
import FoundItemForm from "./components/FoundItemForm";
import ViewLostItems from "./components/ViewLostItems";
import AttributeMatcher from "./components/AttributeMatcher";
import Notifications from "./components/Notifications";
import ChatWindow from "./components/ChatWindow";
import ConversationList from "./components/ConversationList";
import './index.css';
export default function App() {
  const [user, setUser] = useState(null);
  const [page, setPage] = useState("report-lost"); // default page after login
  const [notifCount, setNotifCount] = useState(0);
  const [chatOpen, setChatOpen] = useState(false);
  const [chatInitialTo, setChatInitialTo] = useState("");
  const [chatInitialName, setChatInitialName] = useState("");
  const [chatUnreadCount, setChatUnreadCount] = useState(0);
  const wsRef = useRef(null);
  

  // Load session from localStorage on refresh
  useEffect(() => {
    const savedUser = localStorage.getItem("campustrack_user");
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
  }, []);

  // Listen for notification count events (dispatched by Notifications component)
  useEffect(() => {
    function onNotif(e) {
      const c = e?.detail?.count ?? 0;
      setNotifCount(Number(c) || 0);
    }

    // initialize from localStorage if available
    try {
      const initial = Number(localStorage.getItem('campustrack_notif_count') || 0);
      if (!Number.isNaN(initial)) setNotifCount(initial);
    } catch (e) {}

    window.addEventListener('campustrack:notifications', onNotif);
    // listen for page change events from other components (admin navbar)
    function onSetPage(ev) {
      try {
        const p = ev?.detail?.page;
        if (p) setPage(p);
      } catch (e) {}
    }
    window.addEventListener('campustrack:setPage', onSetPage);
    return () => {
      window.removeEventListener('campustrack:notifications', onNotif);
      window.removeEventListener('campustrack:setPage', onSetPage);
    };
  }, []);

  // Logout handler
  const handleLogout = () => {
    localStorage.removeItem("campustrack_user");
    setUser(null);
  };

  const navigate = useNavigate();

  // Global WebSocket for incoming messages -> show unread dot and dispatch events
  useEffect(() => {
    if (!user) return;
    // create ws
    try {
      const wsProto = location.protocol === 'https:' ? 'wss' : 'ws';
      const wsUrl = `${wsProto}://${location.hostname}:8080/ws/chat`;
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;
      ws.onopen = () => console.debug('global ws open');
      ws.onmessage = (ev) => {
        try {
          const parsed = JSON.parse(ev.data);
          // dispatch for components to update UI (ConversationList/ChatWindow)
          window.dispatchEvent(new CustomEvent('campustrack:incomingChat', { detail: parsed }));

          // update unread count when a new message arrives FROM someone else
          const myEmail = user?.email?.toLowerCase();
          if (parsed.type === 'message' && parsed.from && myEmail && parsed.from.toLowerCase() !== myEmail) {
            setChatUnreadCount((c) => c + 1);
          }
        } catch (e) { /* ignore */ }
      };
      ws.onclose = () => { wsRef.current = null; };
      ws.onerror = () => { /* ignore */ };
    } catch (e) { /* ignore */ }

    return () => { try { if (wsRef.current) { wsRef.current.close(); wsRef.current = null; } } catch (e) {} };
  }, [user]);

  if (!user) {
    return <LoginSignup onLogin={(u) => setUser(u)} />;
  }

  return (
    <div className="app-root relative min-h-screen overflow-hidden">
      {/* animated gradient background + decorative blobs */}
      <div className="absolute inset-0 animated-gradient -z-20" aria-hidden="true" />
      <div className="absolute -left-28 -top-24 blob bg-purple-400 opacity-40 -z-10" aria-hidden="true" />
      <div className="absolute right-12 top-1/4 blob bg-yellow-300 opacity-30 -z-10" aria-hidden="true" />

      {/* 🔹 Navbar */}
      <nav className="glass-nav nav-dark text-white px-6 py-3 flex justify-between items-center">
        <div className="flex items-center">
          <h1 className="text-2xl font-semibold tracking-tight brand-animated">CampusTrack</h1>
          {/* Greeting shown to all logged-in users */}
          <div className="ml-4">
            <span className="greeting" aria-live="polite">
              Hi, {user?.firstName || user?.name || (user?.email ? user.email.split('@')[0] : 'there')} <span className="wave" aria-hidden="true">👋</span>
            </span>
          </div>
        </div>
  <div className="flex gap-3 items-center flex-wrap">
          {user?.role === 'admin' && (
            <button
              onClick={() => window.open(`${location.origin}/admin`, '_blank', 'noopener')}
              className={`nav-btn transition transform duration-200 px-3 py-1 rounded-md text-sm shadow-sm nav-inactive`}
              title="Admin Dashboard (opens in new tab)"
            >
              <span className="nav-text">Manage</span>
            </button>
          )}

          <button
            onClick={() => setPage("report-lost")}
            className={`nav-btn transition transform duration-200 px-3 py-1 rounded-md text-sm shadow-sm ${
              page === "report-lost" ? "nav-active" : "nav-inactive"
            }`}
          >
            <span className="nav-text">Report Lost</span>
          </button>

          <button
            onClick={() => setPage("report-found")}
            className={`nav-btn transition transform duration-200 px-3 py-1 rounded-md text-sm shadow-sm ${
              page === "report-found" ? "nav-active" : "nav-inactive"
            }`}
          >
            <span className="nav-text">Report Found</span>
          </button>

          <button
            onClick={() => setPage("view")}
            className={`nav-btn transition transform duration-200 px-3 py-1 rounded-md text-sm shadow-sm ${
              page === "view" ? "nav-active" : "nav-inactive"
            }`}
          >
            <span className="nav-text">View Items</span>
          </button>

          <button
            onClick={() => setPage("matches")}
            className={`nav-btn transition transform duration-200 px-3 py-1 rounded-md text-sm shadow-sm ${
              page === "matches" ? "nav-active" : "nav-inactive"
            }`}
          >
            <span className="nav-text">Matches</span>
          </button>

          <button
            onClick={() => setPage("notifications")}
            className={`nav-btn transition transform duration-200 px-3 py-1 rounded-md text-sm shadow-sm ${
              page === "notifications" ? "nav-active" : "nav-inactive"
            }`}
          >
            <span className="nav-text">Notifications</span>
            {notifCount > 0 && <span className="notif-dot" aria-hidden="true" />}
          </button>

          <button
            type="button"
            onClick={() => { setChatOpen((s) => !s); setChatUnreadCount(0); }}
            className="nav-btn transition transform duration-200 px-3 py-1 rounded-md text-sm shadow-sm nav-inactive"
            title="Open chat"
          >
            <span className="nav-text">Chat</span>
            {chatUnreadCount > 0 && (
              <span className="ml-2 inline-flex items-center justify-center bg-red-600 text-white text-xs font-semibold px-2 py-0.5 rounded-full" aria-hidden="true">{chatUnreadCount}</span>
            )}
          </button>

          <button
            onClick={handleLogout}
            className="nav-btn logout transition px-3 py-1 rounded text-sm nav-inactive"
          >
            <span className="nav-text">Logout</span>
          </button>
        </div>
      </nav>

      {/* 🔹 Main Content (glass card) */}
      <div className="p-6 max-w-6xl mx-auto mt-8 glass-card">
        {page === "view" && <ViewLostItems />}
        {page === "matches" && (
          <div className="p-2">
            <AttributeMatcher />
          </div>
        )}
        {page === "notifications" && (
          <div className="p-2">
            <Notifications />
          </div>
        )}

        {(page === "report-lost" || page === "report-found") && (
          <div>
            {page === "report-lost" && (
              <LostItemForm />
            )}

            {page === "report-found" && (
              <FoundItemForm />
            )}
          </div>
        )}
      </div>

      {/* Inline chat drawer with conversation list */}
      {chatOpen && (
        <div className="fixed right-4 bottom-4 w-full max-w-3xl z-50">
          <div className="bg-transparent p-2 shadow-lg rounded flex gap-3">
              <div className="w-80">
                <ConversationList onSelect={async (conv) => {
                  // mark conversation as read on the server so unread counts clear
                  try {
                    const partner = conv?.partnerEmail;
                    if (partner) {
                      await fetch(`${location.protocol}//${location.hostname}:8080/api/chat/markRead?with=${encodeURIComponent(partner)}`, {
                        method: 'POST',
                        credentials: 'include'
                      });
                      // decrement global unread counter by the conversation's unreadCount
                      const u = Number(conv.unreadCount || 0);
                      if (u > 0) setChatUnreadCount((c) => Math.max(0, c - u));
                      // notify other components (ConversationList) to update immediately
                      window.dispatchEvent(new CustomEvent('campustrack:conversationRead', { detail: { partner } }));
                    }
                  } catch (e) {
                    // ignore network errors
                  } finally {
                    setChatInitialTo(conv?.partnerEmail || '');
                    setChatOpen(true);
                  }
                }} />
              </div>
            <div className="flex-1">
              <ChatWindow
                key={chatInitialTo}
                initialTo={chatInitialTo}
                initialName={chatInitialName}
                onClose={() => { setChatOpen(false); setChatInitialTo(''); }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
