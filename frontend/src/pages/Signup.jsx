import { useState } from "react";
import axios from "axios";

export default function Signup() {
	const [form, setForm] = useState({ username: "", password: "", email: "" });

	const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

	const handleSubmit = async (e) => {
		e.preventDefault();
		try {
			await axios.post("http://localhost:8080/api/auth/signup", form);
			alert("Signup successful. Please login.");
			setForm({ username: "", password: "", email: "" });
		} catch (err) {
			alert("Signup failed.");
		}
	};

	return (
		<div className="min-h-screen flex items-center justify-center bg-gray-100">
			<form onSubmit={handleSubmit} className="bg-white p-6 rounded-2xl shadow-lg w-96">
				<h2 className="text-2xl font-bold mb-4 text-center">Signup</h2>
				<input name="username" value={form.username} onChange={handleChange} placeholder="Username" className="w-full mb-3 p-2 border rounded" required />
				<input name="email" value={form.email} onChange={handleChange} placeholder="Email" className="w-full mb-3 p-2 border rounded" required />
				<input type="password" name="password" value={form.password} onChange={handleChange} placeholder="Password" className="w-full mb-3 p-2 border rounded" required />
				<button type="submit" className="w-full bg-green-600 text-white py-2 rounded">Signup</button>
			</form>
		</div>
	);
}
