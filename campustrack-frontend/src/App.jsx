import { useState, useEffect } from "react";
import LoginSignup from "./components/LoginSignup";
import LostItemForm from "./components/LostItemForm";
import FoundItemForm from "./components/FoundItemForm";
import ViewLostItems from "./components/ViewLostItems";
import MatchSidebar from "./components/MatchSidebar";
import AttributeMatcher from "./components/AttributeMatcher";

export default function App() {
  const [user, setUser] = useState(null);
  const [page, setPage] = useState("report-lost"); // default page after login
  const [lastSubmittedFoundId, setLastSubmittedFoundId] = useState(null);
  const [lastSubmittedLostId, setLastSubmittedLostId] = useState(null);

  // ✅ Load session from localStorage on refresh
  useEffect(() => {
    const savedUser = localStorage.getItem("campustrack_user");
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
  }, []);

  // ✅ Logout handler
  const handleLogout = () => {
    localStorage.removeItem("campustrack_user");
    setUser(null);
  };

  if (!user) {
    return <LoginSignup onLogin={(u) => setUser(u)} />;
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* 🔹 Navbar */}
      <nav className="bg-blue-600 text-white px-6 py-3 flex justify-between items-center">
        <h1 className="text-xl font-semibold">CampusTrack</h1>
        <div className="flex gap-4">
          <button
            onClick={() => setPage("report-lost")}
            className={`hover:underline ${
              page === "report-lost" ? "font-bold" : ""
            }`}
          >
            Report Lost Item
          </button>

          <button
            onClick={() => setPage("report-found")}
            className={`hover:underline ${
              page === "report-found" ? "font-bold" : ""
            }`}
          >
            Report Found Item
          </button>

          <button
            onClick={() => setPage("view")}
            className={`hover:underline ${
              page === "view" ? "font-bold" : ""
            }`}
          >
            View All Items
          </button>
          <button
            onClick={() => setPage("matches")}
            className={`hover:underline ${
              page === "matches" ? "font-bold" : ""
            }`}
          >
            View Matches
          </button>
          <button
            onClick={handleLogout}
            className="bg-red-500 hover:bg-red-600 px-3 py-1 rounded text-sm"
          >
            Logout
          </button>
        </div>
      </nav>

      {/* 🔹 Main Content */}
      <div className="p-6">
        {page === "view" && <ViewLostItems />}
        {page === "matches" && (
          <div className="p-2">
            <AttributeMatcher />
          </div>
        )}

        {(page === "report-lost" || page === "report-found") && (
          <div className="flex items-start">
            <div className="flex-1">
              {page === "report-lost" && (
                <LostItemForm onSuccess={(id) => setLastSubmittedLostId(id)} />
              )}

              {page === "report-found" && (
                <FoundItemForm onSuccess={(id) => setLastSubmittedFoundId(id)} />
              )}
            </div>

            <div className="w-80 ml-6">
              {/* Show sidebar when a found or lost item was just submitted */}
              <MatchSidebar foundId={lastSubmittedFoundId} lostId={lastSubmittedLostId} highlightLostId={lastSubmittedLostId} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
