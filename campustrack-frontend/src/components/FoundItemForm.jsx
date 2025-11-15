import { useState } from "react";
import axios from "axios";

export default function FoundItemForm({ user, onSuccess }) {
  const [formData, setFormData] = useState({
    itemName: "",
    brand: "",
    modelNo: "",
    size: "",
    location: "",
    about: "",
    foundDateTime: "",
    image: null,
    reporterEmail: "",
  });

  const [showAdvanced, setShowAdvanced] = useState(false);
  const [message, setMessage] = useState("");

  const handleChange = (e) => {
    const { name, value, files } = e.target;
    if (name === "image") {
      setFormData((s) => ({ ...s, image: files[0] }));
    } else {
      setFormData((s) => ({ ...s, [name]: value }));
    }
  };

  const handleReset = () => {
    setFormData({
      itemName: "",
      brand: "",
      modelNo: "",
      size: "",
      location: "",
      about: "",
      foundDateTime: "",
      image: null,
      reporterEmail: "",
    });
    setMessage("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const data = new FormData();
    Object.keys(formData).forEach((key) => {
      const val = formData[key];
      if (val === null || val === undefined) return;
      if (typeof val === 'string' && val.trim() === '') return;
      data.append(key, val);
    });

    // validate optional reporter email domain
    if (formData.reporterEmail && !formData.reporterEmail.trim().toLowerCase().endsWith('@university.edu')) {
      alert('Reporter email must be an @university.edu address');
      return;
    }

    try {
      const res = await axios.post("http://localhost:8080/api/founditems/report", data, {
        withCredentials: true,
      });

      alert(res.data.message || "✅ Found item reported successfully!");
      handleReset();
      if (onSuccess && res.data.itemId) onSuccess(res.data.itemId);
    } catch (err) {
      alert(err.response?.data?.message || "❌ Failed to submit found item");
    }
  };

  return (
    <div className="w-full max-w-lg mx-auto" style={{ color: "var(--card-text-color)" }}>
      <h2 className="text-2xl font-semibold mb-4 text-center text-green-600">🟢 Report Found Item</h2>

      {message && (
        <div className="text-center mb-3 text-sm text-red-500">{message}</div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="form-field">
          <input id="fi_itemName" name="itemName" value={formData.itemName} onChange={handleChange} placeholder=" " required />
          <label htmlFor="fi_itemName">Item Name</label>
        </div>

        <div className="form-field">
          <input id="fi_brand" name="brand" value={formData.brand} onChange={handleChange} placeholder=" " required />
          <label htmlFor="fi_brand">Brand</label>
        </div>

        {(
          <>
            <div className="form-field">
              <input id="fi_modelNo" name="modelNo" value={formData.modelNo} onChange={handleChange} placeholder=" " />
              <label htmlFor="fi_modelNo">Model No</label>
            </div>

            <div className="form-field">
              <input id="fi_size" name="size" value={formData.size} onChange={handleChange} placeholder=" " />
              <label htmlFor="fi_size">Size</label>
            </div>
          </>
        )}

        <div className="form-field">
          <input id="fi_location" name="location" value={formData.location} onChange={handleChange} placeholder=" " />
          <label htmlFor="fi_location">Found Location</label>
        </div>

        <div className="form-field">
          <textarea id="fi_about" name="about" value={formData.about} onChange={handleChange} placeholder=" " rows={4} />
          <label htmlFor="fi_about">About item</label>
          <div className="small-muted">{formData.about.length}/500</div>
        </div>

        <div className="form-field">
          <input id="fi_foundDateTime" name="foundDateTime" type="datetime-local" value={formData.foundDateTime} onChange={handleChange} placeholder=" " required />
          <label htmlFor="fi_foundDateTime">Found Date & Time</label>
        </div>

        <div className="form-field">
          <input id="fi_reporterEmail" name="reporterEmail" type="email" value={formData.reporterEmail} onChange={handleChange} placeholder=" " />
          <label htmlFor="fi_reporterEmail">Your email (optional)</label>
        </div>

        <div className="form-field">
          <input id="fi_image" name="image" type="file" accept="image/*" onChange={handleChange} className="text-sm" />
        </div>

        <div className="form-actions">
          <button type="submit" className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded transition">Submit</button>
          <button type="button" onClick={handleReset} className="bg-gray-400 hover:bg-gray-500 text-white px-4 py-2 rounded transition">Reset</button>
        </div>
      </form>
    </div>
  );
}
