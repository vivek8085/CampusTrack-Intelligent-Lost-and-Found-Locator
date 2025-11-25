import React, { useState } from "react";
import axios from "axios";
import { API_BASE } from '../utils/api';

export default function LostItemForm({ onSuccess }) {
  const [formData, setFormData] = useState({
    itemName: "",
    brand: "",
    modelNo: "",
    size: "",
    location: "",
    about: "",
    lostDateTime: "",
    reporterEmail: "",
    image: null,
  });

  const [showAdvanced, setShowAdvanced] = useState(false);

  // Handle input changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((s) => ({ ...s, [name]: value }));
  };

  // Handle file upload
  const handleFileChange = (e) => {
    setFormData((s) => ({ ...s, image: e.target.files[0] }));
  };

  // Reset form
  const handleReset = () => {
    setFormData({
      itemName: "",
      brand: "",
      modelNo: "",
      size: "",
      location: "",
      about: "",
      lostDateTime: "",
      reporterEmail: "",
      image: null,
    });
  };

  // Submit form
  const handleSubmit = async (e) => {
    e.preventDefault();
    const data = new FormData();

    // Ensure multipart parts exist for optional fields so backend multipart parsers
    // that expect the part won't fail. Append empty string when not provided.
    data.append('modelNo', formData.modelNo || '');
    data.append('size', formData.size || '');

    Object.keys(formData).forEach((k) => {
      // skip modelNo/size because we've already appended them explicitly
      if (k === 'modelNo' || k === 'size') return;
      const v = formData[k];
      if (v === null || v === undefined) return;
      if (typeof v === "string" && v.trim() === "") return;
      data.append(k, v);
    });

    // validate optional reporter email domain
    if (formData.reporterEmail && !formData.reporterEmail.trim().toLowerCase().endsWith('@university.edu')) {
      alert('Reporter email must be an @university.edu address');
      return;
    }

    try {
      const res = await axios.post(`${API_BASE}/api/lostitems/report`, data, {
        withCredentials: true,
      });
      alert(res.data.message || "✅ Lost item reported");
      handleReset();
      if (onSuccess && res.data.itemId) onSuccess(res.data.itemId);
    } catch (err) {
      alert(err.response?.data?.message || "❌ Failed to submit lost item");
    }
  };

  return (
    <div className="w-full max-w-lg mx-auto" style={{ color: "var(--card-text-color)" }}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <h2 className="text-2xl font-bold text-center text-blue-600">Report Lost Item</h2>

        <div className="form-field">
          <input
            id="itemName"
            name="itemName"
            value={formData.itemName}
            onChange={handleChange}
            placeholder=" "
            className=""
            required
          />
          <label htmlFor="itemName">Item Name</label>
        </div>

        <div className="form-field">
          <input
            id="brand"
            name="brand"
            value={formData.brand}
            onChange={handleChange}
            placeholder=" "
            required
          />
          <label htmlFor="brand">Brand</label>
        </div>


        {(
          <>
            <div className="form-field">
              <input id="modelNo" name="modelNo" value={formData.modelNo} onChange={handleChange} placeholder=" " />
              <label htmlFor="modelNo">Model No</label>
              <div className="small-muted">Optional</div>
            </div>

            <div className="form-field">
              <input id="size" name="size" value={formData.size} onChange={handleChange} placeholder=" " />
              <label htmlFor="size">Size / Dimensions</label>
              <div className="small-muted">Optional</div>
            </div>
          </>
        )}

        <div className="form-field">
          <input id="location" name="location" value={formData.location} onChange={handleChange} placeholder=" " required />
          <label htmlFor="location">Lost Location</label>
        </div>

        <div className="form-field">
          <textarea id="about" name="about" value={formData.about} onChange={handleChange} placeholder=" " rows={4} />
          <label htmlFor="about">About item</label>
          <div className="small-muted">{formData.about.length}/500</div>
        </div>

        <div className="form-field">
          <input id="lostDateTime" name="lostDateTime" type="datetime-local" value={formData.lostDateTime} onChange={handleChange} placeholder=" " required />
          <label htmlFor="lostDateTime">Lost Date & Time</label>
        </div>

        <div className="form-field">
          <input id="reporterEmail" name="reporterEmail" type="email" value={formData.reporterEmail} onChange={handleChange} placeholder=" " />
          <label htmlFor="reporterEmail">Your university mail</label>
        </div>

        <div className="form-field">
          <input id="image" name="image" type="file" accept="image/*" onChange={handleFileChange} className="text-sm" />
        </div>

        <div className="form-actions">
          <button type="button" onClick={handleReset} className="bg-gray-300 text-black px-4 py-2 rounded hover:bg-gray-400 transition">Reset</button>
          <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition">Submit</button>
        </div>
      </form>
    </div>
  );
}
