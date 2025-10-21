import { useState, useEffect } from "react";
import axios from "axios";

export default function LoginSignup({ onLogin }) {
  const [isLogin, setIsLogin] = useState(true);
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [msg, setMsg] = useState("");

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

    try {
      const url = `http://localhost:8080/api/auth/${
        isLogin ? "login" : "signup"
      }`;
      const payload = isLogin
        ? { email: form.email, password: form.password }
        : { name: form.name, email: form.email, password: form.password };

      const res = await axios.post(url, payload);
      setMsg(res.data.message);

      if (isLogin && res.data.message.includes("successful")) {
        const user = { email: form.email, name: form.name };
        localStorage.setItem("campustrack_user", JSON.stringify(user)); // ✅ Save session
        onLogin(user);
      }
    } catch (err) {
      setMsg("❌ Something went wrong. Try again!");
    }
  };

  return (
    <div className="flex items-center justify-center h-screen bg-blue-50">
      <form
        onSubmit={handleSubmit}
        className="bg-white shadow-lg p-8 rounded-lg w-96 border border-gray-200"
      >
        <h2 className="text-center text-2xl font-bold mb-4 text-blue-600">
          {isLogin ? "Login" : "Sign Up"}
        </h2>

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

        <input
          type="password"
          placeholder="Password"
          className="border p-2 w-full mb-3 rounded"
          value={form.password}
          onChange={(e) => setForm({ ...form, password: e.target.value })}
          required
        />

        {!isLogin && (
          <input
            type="password"
            placeholder="Confirm Password"
            className="border p-2 w-full mb-3 rounded"
            value={form.confirmPassword}
            onChange={(e) =>
              setForm({ ...form, confirmPassword: e.target.value })
            }
            required
          />
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
  );
}
