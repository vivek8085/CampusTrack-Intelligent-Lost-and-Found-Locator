import React, { useState } from "react";
import axios from "axios";

export default function LostItemForm() {
  const [formData, setFormData] = useState({
    itemName: "",
    brand: "",
    modelNo: "",
    size: "",
    location: "",
    about: "",
    lostDateTime: "",
    image: null,
  });

  // ✅ Handle input changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  // ✅ Handle file upload
  const handleFileChange = (e) => {
    setFormData({ ...formData, image: e.target.files[0] });
  };

  // ✅ Reset form
  const handleReset = () => {
    setFormData({
      itemName: "",
      brand: "",
      modelNo: "",
      size: "",
      location: "",
      about: "",
      lostDateTime: "",
      image: null,
    });
  };

  // ✅ Submit form
  const handleSubmit = async (e) => {
    e.preventDefault();
    const data = new FormData();

    data.append("itemName", formData.itemName);
    data.append("brand", formData.brand);
    data.append("modelNo", formData.modelNo);
    data.append("size", formData.size);
    data.append("location", formData.location);
    data.append("about", formData.about);
    data.append("lostDateTime", formData.lostDateTime);
    if (formData.image) data.append("image", formData.image);

    try {
      const res = await axios.post("http://localhost:8080/api/lostitems/report", data, {
        headers: { "Content-Type": "multipart/form-data" },
        withCredentials: true,
      });
      alert(res.data.message);
      handleReset();
    } catch (err) {
      alert(err.response?.data?.message || "❌ Failed to submit lost item");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <form
        onSubmit={handleSubmit}
        className="bg-white p-8 rounded-2xl shadow-lg w-full max-w-lg space-y-4"
      >
        <h2 className="text-2xl font-bold text-center text-blue-600">
          Report Lost Item
        </h2>

        <input
          type="text"
          name="itemName"
          value={formData.itemName}
          onChange={handleChange}
          placeholder="Item Name"
          className="w-full p-2 border rounded"
          required
        />

        <input
          type="text"
          name="brand"
          value={formData.brand}
          onChange={handleChange}
          placeholder="Brand"
          className="w-full p-2 border rounded"
          required
        />

        <input
          type="text"
          name="modelNo"
          value={formData.modelNo}
          onChange={handleChange}
          placeholder="Model No"
          className="w-full p-2 border rounded"
        />

        <input
          type="text"
          name="size"
          value={formData.size}
          onChange={handleChange}
          placeholder="Size / Dimensions"
          className="w-full p-2 border rounded"
        />

        <input
          type="text"
          name="location"
          value={formData.location}
          onChange={handleChange}
          placeholder="Lost Location"
          className="w-full p-2 border rounded"
          required
        />

        <textarea
          name="about"
          value={formData.about}
          onChange={handleChange}
          placeholder="About item..."
          className="w-full p-2 border rounded"
        />

        <input
          type="datetime-local"
          name="lostDateTime"
          value={formData.lostDateTime}
          onChange={handleChange}
          className="w-full p-2 border rounded"
          required
        />

        <div className="flex items-center justify-between">
          <input
            type="file"
            name="image"
            accept="image/*"
            onChange={handleFileChange}
            className="text-sm"
          />
        </div>

        <div className="flex justify-between mt-4">
          <button
            type="reset"
            onClick={handleReset}
            className="bg-gray-300 text-black px-4 py-2 rounded hover:bg-gray-400"
          >
            Reset
          </button>

          <button
            type="submit"
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            Submit
          </button>
        </div>
      </form>
    </div>
  );
}
