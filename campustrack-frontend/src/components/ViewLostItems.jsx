import React, { useEffect, useState } from "react";

const ViewLostItems = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchItems = async () => {
      try {
        const res = await fetch("http://localhost:8080/api/lostitems/all");
        if (!res.ok) throw new Error("Failed to fetch items");
        const data = await res.json();
        setItems(data);
      } catch (err) {
        setError("⚠️ Unable to load lost items. Please try again later.");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchItems();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen text-xl text-gray-600">
        ⏳ Loading reported items...
      </div>
    );
  }

  if (error) {
    return <div className="text-center text-red-500 mt-10">{error}</div>;
  }

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <h1 className="text-3xl font-bold text-center mb-6 text-blue-700">
        🧭 All Reported Lost Items
      </h1>

      {items.length === 0 ? (
        <p className="text-center text-gray-500">No items reported yet.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          {items.map((item) => (
            <div
              key={item.id}
              className="bg-white rounded-2xl shadow-lg p-4 hover:shadow-2xl transition duration-200"
            >
              {item.imageUrl ? (
                <img
                  src={`http://localhost:8080${item.imageUrl}`}
                  alt={item.itemName}
                  className="rounded-xl w-full h-48 object-cover mb-3"
                />
              ) : (
                <div className="w-full h-48 bg-gray-200 flex items-center justify-center rounded-xl text-gray-500">
                  No Image
                </div>
              )}

              <h2 className="text-xl font-semibold text-gray-800 mb-1">
                {item.itemName}
              </h2>
              <p className="text-sm text-gray-600">
                <strong>Brand:</strong> {item.brand}
              </p>
              <p className="text-sm text-gray-600">
                <strong>Model No:</strong> {item.modelNo}
              </p>
              <p className="text-sm text-gray-600">
                <strong>Size:</strong> {item.size}
              </p>
              <p className="text-sm text-gray-600">
                <strong>Location:</strong> {item.location}
              </p>
              <p className="text-sm text-gray-600">
                <strong>Lost On:</strong>{" "}
                {item.lostDateTime
                  ? new Date(item.lostDateTime).toLocaleString()
                  : "Unknown"}
              </p>
              <p className="text-sm text-gray-600 mt-2">
                <strong>About:</strong> {item.about}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ViewLostItems;
