import { useState } from "react";
import api from "../lib/api";

export default function ReportLostItem() {
  const [form, setForm] = useState({
    itemName: "",
    description: "",
    locationLost: "",
    contactNumber: "",
    dateLost: "",
  });

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post("/lostitems/report", form);
      alert("Lost item reported successfully!");
      setForm({
        itemName: "",
        description: "",
        locationLost: "",
        contactNumber: "",
        dateLost: "",
      });
    } catch (error) {
      alert("Error reporting item!");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <form onSubmit={handleSubmit} className="bg-white p-6 rounded-2xl shadow-lg w-96">
        <h2 className="text-2xl font-bold mb-4 text-center">Report Lost Item</h2>

        <input
          type="text"
          name="itemName"
          value={form.itemName}
          onChange={handleChange}
          placeholder="Item Name"
          className="w-full mb-3 p-2 border rounded"
          required
        />
        <textarea
          name="description"
          value={form.description}
          onChange={handleChange}
          placeholder="Description"
          className="w-full mb-3 p-2 border rounded"
          required
        ></textarea>
        <input
          type="text"
          name="locationLost"
          value={form.locationLost}
          onChange={handleChange}
          placeholder="Location Lost"
          className="w-full mb-3 p-2 border rounded"
          required
        />
        <input
          type="text"
          name="contactNumber"
          value={form.contactNumber}
          onChange={handleChange}
          placeholder="Contact Number"
          className="w-full mb-3 p-2 border rounded"
          required
        />
        <input
          type="date"
          name="dateLost"
          value={form.dateLost}
          onChange={handleChange}
          className="w-full mb-3 p-2 border rounded"
        />

        <button
          type="submit"
          className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 transition"
        >
          Submit
        </button>
      </form>
    </div>
  );
}
