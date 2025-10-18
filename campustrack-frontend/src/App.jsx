import { useState } from "react";
import LoginSignup from "./components/LoginSignup";
import LostItemForm from "./components/LostItemForm";

export default function App() {
  const [user, setUser] = useState(null);
  return (
    <div className="min-h-screen">
      {!user ? (
        <LoginSignup onLogin={setUser} />
      ) : (
        <LostItemForm user={user} onLogout={() => setUser(null)} />
      )}
    </div>
  );
}
