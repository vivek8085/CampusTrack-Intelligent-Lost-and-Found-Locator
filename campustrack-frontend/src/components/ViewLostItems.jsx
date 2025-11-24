import React, { useEffect, useState } from "react";

const ViewLostItems = () => {
  const [items, setItems] = useState([]);
  const [filteredItems, setFilteredItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [locationFilter, setLocationFilter] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [categories, setCategories] = useState([]);

  useEffect(() => {
    const fetchItems = async () => {
      try {
        const res = await fetch("http://localhost:8080/api/lostitems/all");
        if (!res.ok) throw new Error("Failed to fetch items");
        const data = await res.json();
        setItems(data);
        setFilteredItems(data);
        // derive categories from brand (fallback to 'Other')
        const cats = new Set();
        data.forEach(it => {
          const b = it.brand && String(it.brand).trim() !== '' ? it.brand : 'Other';
          cats.add(b);
        });
        setCategories(['All', ...Array.from(cats).sort()]);
      } catch (err) {
        setError("⚠️ Unable to load lost items. Please try again later.");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchItems();
  }, []);

  useEffect(() => {
    // apply filters to items
    let out = items;
    // date filtering (lostDateTime expected in ISO string)
    if (startDate) {
      const s = new Date(startDate);
      out = out.filter(it => it.lostDateTime ? new Date(it.lostDateTime) >= s : false);
    }
    if (endDate) {
      // include entire day
      const e = new Date(endDate);
      e.setHours(23,59,59,999);
      out = out.filter(it => it.lostDateTime ? new Date(it.lostDateTime) <= e : false);
    }
    // location filter (contains, case-insensitive)
    if (locationFilter && locationFilter.trim() !== '') {
      const lf = locationFilter.trim().toLowerCase();
      out = out.filter(it => (it.location || '').toLowerCase().includes(lf));
    }
    // category filter (brand-based in this implementation)
    if (categoryFilter && categoryFilter !== 'All') {
      out = out.filter(it => {
        const b = it.brand && String(it.brand).trim() !== '' ? it.brand : 'Other';
        return b === categoryFilter;
      });
    }
    setFilteredItems(out);
  }, [items, startDate, endDate, locationFilter, categoryFilter]);

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

      <div className="mb-6">
        <h3 className="text-lg font-medium mb-2">Filters</h3>
        <div className="flex flex-wrap gap-3 items-end">
          <div>
            <label className="block text-sm text-gray-600">From</label>
            <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="mt-1 p-2 border rounded" />
          </div>
          <div>
            <label className="block text-sm text-gray-600">To</label>
            <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="mt-1 p-2 border rounded" />
          </div>
          <div>
            <label className="block text-sm text-gray-600">Location</label>
            <input type="text" placeholder="e.g. Library" value={locationFilter} onChange={e => setLocationFilter(e.target.value)} className="mt-1 p-2 border rounded" />
          </div>
          <div>
            <label className="block text-sm text-gray-600">Category (Brand)</label>
            <select value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)} className="mt-1 p-2 border rounded">
              {categories.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <button onClick={() => { setStartDate(''); setEndDate(''); setLocationFilter(''); setCategoryFilter('All'); }} className="mt-1 p-2 bg-gray-200 rounded">Clear</button>
          </div>
        </div>
      </div>

      {filteredItems.length === 0 ? (
        <p className="text-center text-gray-500">No items reported yet.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          {filteredItems.map((item) => (
            <div
              key={item.id}
              className="bg-white rounded-2xl shadow-lg p-4 hover:shadow-2xl transition duration-200 item-card"
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
              {item.modelNo && item.modelNo.toString().trim() !== '' ? (
                <p className="text-sm text-gray-600">
                  <strong>Model No:</strong> {item.modelNo}
                </p>
              ) : null}
              {item.size && item.size.toString().trim() !== '' ? (
                <p className="text-sm text-gray-600">
                  <strong>Size:</strong> {item.size}
                </p>
              ) : null}
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
