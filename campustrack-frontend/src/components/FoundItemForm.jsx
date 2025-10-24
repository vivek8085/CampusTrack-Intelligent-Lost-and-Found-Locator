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
  });

  const [message, setMessage] = useState("");

  const handleChange = (e) => {
    const { name, value, files } = e.target;
    if (name === "image") {
      setFormData({ ...formData, image: files[0] });
    } else {
      setFormData({ ...formData, [name]: value });
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
    });
    setMessage("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const data = new FormData();
    Object.keys(formData).forEach((key) => {
      if (formData[key]) data.append(key, formData[key]);
    });

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
    <div className="max-w-lg mx-auto bg-white shadow-md rounded-lg p-6">
      <h2 className="text-2xl font-semibold mb-4 text-center text-green-600">
        🟢 Report Found Item
      </h2>

      {message && (
        <div className="text-center mb-3 text-sm text-red-500">{message}</div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {["itemName", "brand", "modelNo", "size", "location", "about"].map(
          (field) => (
            <input
              key={field}
              type="text"
              name={field}
              value={formData[field]}
              onChange={handleChange}
              placeholder={field.replace(/([A-Z])/g, " $1")}
              className="w-full border rounded p-2"
              required
            />
          )
        )}

        <input
          type="datetime-local"
          name="foundDateTime"
          value={formData.foundDateTime}
          onChange={handleChange}
          className="w-full border rounded p-2"
          required
        />

        <input
          type="file"
          name="image"
          accept="image/*"
          onChange={handleChange}
          className="w-full border rounded p-2"
        />

        <div className="flex justify-between">
          <button
            type="submit"
            className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded"
          >
            Submit
          </button>
          <button
            type="button"
            onClick={handleReset}
            className="bg-gray-400 hover:bg-gray-500 text-white px-4 py-2 rounded"
          >
            Reset
          </button>
        </div>
      </form>
    </div>
  );
}
