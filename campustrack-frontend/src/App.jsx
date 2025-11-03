import { useState, useEffect } from "react";
import LoginSignup from "./components/LoginSignup";
import LostItemForm from "./components/LostItemForm";
import FoundItemForm from "./components/FoundItemForm";
import ViewLostItems from "./components/ViewLostItems";
import AttributeMatcher from "./components/AttributeMatcher";
import Notifications from "./components/Notifications";

export default function App() {
  const [user, setUser] = useState(null);
  const [page, setPage] = useState("report-lost"); // default page after login
  const [notifCount, setNotifCount] = useState(0);
  

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
    return () => window.removeEventListener('campustrack:notifications', onNotif);
  }, []);

  // Logout handler
  const handleLogout = () => {
    localStorage.removeItem("campustrack_user");
    setUser(null);
  };

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
        <h1 className="text-2xl font-semibold tracking-tight brand-animated">CampusTrack</h1>
        <div className="flex gap-3 items-center">
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
    </div>
  );
}
