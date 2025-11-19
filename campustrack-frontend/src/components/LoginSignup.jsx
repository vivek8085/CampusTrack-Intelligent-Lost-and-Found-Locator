import { useState, useEffect } from "react";
import axios from "axios";
import './AdminDashboard.css';

export default function LoginSignup({ onLogin }) {
  const [isLogin, setIsLogin] = useState(true);
  const [form, setForm] = useState({ name: "", email: "", password: "", confirmPassword: "" });
  const [msg, setMsg] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isAdminMode, setIsAdminMode] = useState(false);
  const [adminId, setAdminId] = useState('');
  const [showBlockedModal, setShowBlockedModal] = useState(false);
  const [blockedReason, setBlockedReason] = useState('');

  // Password strength helper
  const passwordStrength = (pw) => {
    if (!pw || pw.length === 0) return { score: 0, label: 'Too short' };
    let score = 0;
    if (pw.length >= 8) score++;
    if (/[A-Z]/.test(pw)) score++;
    if (/[0-9]/.test(pw)) score++;
    if (/[^A-Za-z0-9]/.test(pw)) score++;
    const labels = ['Very weak', 'Weak', 'Okay', 'Good', 'Strong'];
    return { score: Math.min(score, 4), label: labels[Math.min(score, 4)] };
  };

  // ✅ Auto-login from localStorage if already logged in
  useEffect(() => {
    const storedUser = localStorage.getItem("campustrack_user");
    if (storedUser) {
      onLogin(JSON.parse(storedUser));
    }
  }, [onLogin]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMsg("");

    if (!isLogin && form.password !== form.confirmPassword) {
      setMsg("❌ Passwords do not match");
      return;
    }

    // Restrict to university email domain
    const email = (form.email || '').trim().toLowerCase();
    if (!email.endsWith('@university.edu')) {
      setMsg('❌ Only @university.edu email addresses are allowed.');
      return;
    }

    try {
        const url = `http://localhost:8080/api/auth/${isLogin ? "login" : "signup"}`;
        const payload = isLogin
          ? { email: form.email, password: form.password }
          : { name: form.name, email: form.email, password: form.password, role: isAdminMode ? 'admin' : 'user', adminId: isAdminMode ? adminId : undefined };

  const res = await axios.post(url, payload, { withCredentials: true });

      setMsg(res.data.message);

      if (isLogin && (res.data.blocked === true || res.data.blocked === 'true' || (res.data.message && res.data.message.toLowerCase().includes('blocked')))) {
        // blocked: show modal with reason
        setBlockedReason(res.data.reason || res.data.message || 'Your account has been blocked by an administrator.');
        setShowBlockedModal(true);
        return;
      }

      // Success handling: show alert for login/signup when server reports success
      if (res.data && res.data.message && res.data.message.toLowerCase().includes("successful")) {
        if (isLogin) {
          const user = { email: form.email, name: form.name, role: res.data.role || 'user' };
          localStorage.setItem("campustrack_user", JSON.stringify(user)); // ✅ Save session
          onLogin(user);
          // Friendly browser alert on successful login
          try { alert(`Login successful. Welcome ${user.name || user.email.split('@')[0]}!`); } catch (e) { /* ignore in non-browser env */ }
        } else {
          // Signup success: inform user to login
          try { alert(`Sign up successful. You can now log in with ${form.email}.`); } catch (e) { /* ignore */ }
          // Optionally switch to login view so user can sign in
          setIsLogin(true);
        }
      }
    } catch (err) {
      // Show a clearer alert on error when possible
      const serverMsg = err?.response?.data?.message || err?.message;
      try { alert(`Authentication error: ${serverMsg || 'Something went wrong. Try again.'}`); } catch (e) {}
      setMsg("❌ Something went wrong. Try again!");
    }
  };

  const closeBlockedModal = () => {
    setShowBlockedModal(false);
    setBlockedReason('');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-50 auth-bg">
      <div className="w-full max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-6 items-center px-6">
    {/* Welcome panel (shown on md+) */}
  <div className="hidden md:flex welcome-panel welcome-bg flex-col justify-center items-start p-8 rounded-lg bg-white/60 backdrop-blur-sm shadow-md">
          <h1 className="text-4xl font-extrabold text-blue-700 mb-2">Welcome to CampusTrack</h1>
          <p className="text-gray-700 mb-4">Find matched reports quickly and stay connected with people who found your items.</p>
          <ul className="text-sm text-gray-600 list-disc pl-5 space-y-1">
            <li>Report lost or found items in seconds</li>
            <li>Receive confirmed match notifications</li>
            <li>Archive and track recovered items</li>
            <li>Ai Driven Match Suggestions</li>
          </ul>
        </div>

        {/* Auth form */}
        <form
          onSubmit={handleSubmit}
          className={`bg-white shadow-lg p-6 rounded-lg w-full border border-gray-200 ${isLogin ? 'form-bg' : ''}`}
        >
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-center text-2xl font-bold mb-0 text-blue-600">
              {isLogin ? "Login" : (isAdminMode ? "Admin Sign Up" : "Create your account")}
            </h2>
            {/* Show toggle only on signup so admin signup can be selected; hide on login */}
            {!isLogin && (
              <div className="flex items-center gap-3">
                <span className="text-sm text-gray-600">User</span>
                <div className="relative">
                  <input
                    id="roleToggle"
                    type="checkbox"
                    checked={isAdminMode}
                    onChange={() => setIsAdminMode((s) => !s)}
                    className="sr-only"
                  />
                  <label htmlFor="roleToggle" className={`w-14 h-8 flex items-center p-1 rounded-full cursor-pointer transition-colors ${isAdminMode ? 'bg-gray-800' : 'bg-gray-300'}`}>
                    <span className={`bg-white w-6 h-6 rounded-full shadow transform transition-transform ${isAdminMode ? 'translate-x-6' : 'translate-x-0'}`} />
                  </label>
                </div>
                <span className="text-sm text-gray-600">Admin</span>
              </div>
            )}
          </div>

          {!isLogin && (
            <input
              type="text"
              placeholder="Full Name"
              className="border p-2 w-full mb-3 rounded"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              required
            />
          )}

          <input
            type="email"
            placeholder="Email"
            className="border p-2 w-full mb-3 rounded"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            required
          />

          {/* Password with toggle */}
          <div className="relative mb-1">
            <input
              type={showPassword ? "text" : "password"}
              placeholder="Password"
              className={`border p-2 w-full rounded pr-12 ${showPassword && form.password ? 'opacity-90' : ''}`}
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              required
            />
            {/* check icon when password visible and non-empty */}
            {showPassword && form.password && (
              <span className="absolute right-10 top-1/2 -translate-y-1/2 text-green-600" title="Visible">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 00-1.414 0L8 12.586 4.707 9.293a1 1 0 00-1.414 1.414l4 4a1 1 0 001.414 0l8-8a1 1 0 000-1.414z" clipRule="evenodd" />
                </svg>
              </span>
            )}
            <button
              type="button"
              aria-label={showPassword ? "Hide password" : "Show password"}
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-600 hover:text-gray-800"
            >
              {showPassword ? (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M2.94 6.94a10.02 10.02 0 0114.12 0 10.02 10.02 0 010 6.12 10.02 10.02 0 01-14.12 0 10.02 10.02 0 010-6.12zM10 13a3 3 0 100-6 3 3 0 000 6z" />
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 3l18 18" />
                  <path d="M10.58 10.58a2 2 0 112.83 2.83" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              )}
            </button>
          </div>

          {/* password strength indicator (signup only) */}
          {!isLogin && form.password && (
            (() => {
              const s = passwordStrength(form.password);
              const colors = ['bg-red-300', 'bg-red-400', 'bg-yellow-300', 'bg-green-300', 'bg-green-500'];
              return (
                <div className="mb-3 text-sm">
                  <div className="w-full h-2 bg-gray-200 rounded overflow-hidden">
                    <div className={`h-2 rounded ${colors[s.score]}`} style={{ width: `${(s.score/4)*100}%` }}></div>
                  </div>
                  <div className="mt-1 text-xs text-gray-600">Strength: {s.label}</div>
                </div>
              );
            })()
          )}

          {!isLogin && (
            <div className="relative mb-3">
              <input
                type={showConfirmPassword ? "text" : "password"}
                placeholder="Confirm Password"
                className="border p-2 w-full rounded pr-10"
                value={form.confirmPassword}
                onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
                required
              />
              <button
                type="button"
                aria-label={showConfirmPassword ? "Hide confirm password" : "Show confirm password"}
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-600 hover:text-gray-800"
              >
                {showConfirmPassword ? (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M2.94 6.94a10.02 10.02 0 0114.12 0 10.02 10.02 0 010 6.12 10.02 10.02 0 01-14.12 0 10.02 10.02 0 010-6.12zM10 13a3 3 0 100-6 3 3 0 000 6z" />
                  </svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 3l18 18" />
                    <path d="M10.58 10.58a2 2 0 112.83 2.83" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                )}
              </button>
            </div>
          )}

            {isAdminMode && !isLogin && (
              <div className="mb-3">
                <input type="text" placeholder="Admin ID (e.g. 2UI123)" className="border p-2 w-full mb-3 rounded" value={adminId} onChange={(e) => setAdminId(e.target.value)} required />
              </div>
            )}

          <button
            type="submit"
            className="bg-blue-600 w-full py-2 text-white rounded hover:bg-blue-700 transition"
          >
            {isLogin ? "Login" : "Sign Up"}
          </button>

          <p
            className="text-sm mt-3 text-center text-blue-600 cursor-pointer"
            onClick={() => setIsLogin(!isLogin)}
          >
            {isLogin ? "New user? Sign up" : "Already have an account? Login"}
          </p>

          {msg && <p className="text-center mt-3">{msg}</p>}
                </form>
              </div>
      {/* Blocked modal */}
      {showBlockedModal && (
        <div className="modal-center" role="dialog" aria-modal="true">
          <div className="modal-backdrop" onClick={closeBlockedModal}></div>
          <div className="modal-card">
            <h4 className="text-lg font-semibold mb-2">Account Blocked</h4>
            <div className="modal-body text-sm text-gray-700 mb-4">Your account has been blocked by an administrator.</div>
            <div className="modal-body text-sm text-gray-800 mb-4"><strong>Reason:</strong> {blockedReason || '-'}</div>
            <div className="modal-actions">
              <button onClick={closeBlockedModal} className="px-3 py-1 rounded bg-blue-600 text-white">Close</button>
            </div>
          </div>
        </div>
      )}
            </div>
          );
        }
