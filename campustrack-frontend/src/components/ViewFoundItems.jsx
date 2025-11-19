import React, { useEffect, useState } from "react";

const ViewFoundItems = () => {
  const [foundItems, setFoundItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("http://localhost:8080/api/founditems/all", {
      credentials: "include",
    })
      .then((res) => res.json())
      .then((data) => {
        setFoundItems(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error("❌ Error fetching found items:", err);
        setLoading(false);
      });
  }, []);

  if (loading)
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-gray-600 text-lg animate-pulse">Loading Found Items...</p>
      </div>
    );

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-100 py-10 px-6">
      <h1 className="text-4xl font-bold text-center text-blue-700 mb-8">
        🧾 View All Found Items
      </h1>

      {foundItems.length === 0 ? (
        <p className="text-center text-gray-600 text-lg">No found items reported yet.</p>
      ) : (
        <div className="grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {foundItems.map((item) => (
            <div
              key={item.id}
              className="bg-white shadow-lg rounded-2xl p-4 hover:shadow-2xl transition-all duration-300 item-card"
            >
              {item.imageUrl ? (
                (() => {
                  // Use server URL when imageUrl is served from backend (/uploads/...)
                  const src = item.imageUrl.startsWith('/uploads/')
                    ? `http://localhost:8080${item.imageUrl}`
                    : item.imageUrl;
                  return (
                    <img
                      src={src}
                      alt={item.itemName}
                      className="rounded-lg w-full h-48 object-cover mb-4"
                    />
                  );
                })()
              ) : (
                <div className="bg-gray-200 w-full h-48 flex items-center justify-center text-gray-500 rounded-lg">
                  No Image
                </div>
              )}

              <h2 className="text-xl font-semibold text-blue-700 mb-2">
                {item.itemName}
              </h2>

              <p className="text-gray-700"><strong>Brand:</strong> {item.brand}</p>
              {item.modelNo && item.modelNo.toString().trim() !== '' ? (
                <p className="text-gray-700"><strong>Model No:</strong> {item.modelNo}</p>
              ) : null}
              {item.size && item.size.toString().trim() !== '' ? (
                <p className="text-gray-700"><strong>Size:</strong> {item.size}</p>
              ) : null}
              <p className="text-gray-700"><strong>Location:</strong> {item.location}</p>
              <p className="text-gray-700"><strong>About:</strong> {item.about}</p>

              <p className="text-gray-500 mt-2 text-sm">
                Found on: {new Date(item.foundDateTime).toLocaleString()}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ViewFoundItems;
