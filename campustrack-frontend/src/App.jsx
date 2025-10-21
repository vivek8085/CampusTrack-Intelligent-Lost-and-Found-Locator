import { useState, useEffect } from "react";
import LoginSignup from "./components/LoginSignup";
import LostItemForm from "./components/LostItemForm";
import ViewLostItems from "./components/ViewLostItems";

export default function App() {
  const [user, setUser] = useState(null);
  const [page, setPage] = useState("report"); // default page after login

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
            onClick={() => setPage("report")}
            className={`hover:underline ${
              page === "report" ? "font-bold" : ""
            }`}
          >
            Report Lost Item
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
            onClick={handleLogout}
            className="bg-red-500 hover:bg-red-600 px-3 py-1 rounded text-sm"
          >
            Logout
          </button>
        </div>
      </nav>

      {/* 🔹 Main Content */}
      <div className="p-6">
        {page === "report" ? (
          <LostItemForm user={user} />
        ) : (
          <ViewLostItems />
        )}
      </div>
    </div>
  );
}
