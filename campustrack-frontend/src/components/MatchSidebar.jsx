import React, { useEffect, useState } from "react";

export default function MatchSidebar({ foundId, lostId, highlightLostId }) {
  const [suggestions, setSuggestions] = useState([]);
  const [lostItemsMap, setLostItemsMap] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    const fetchLosts = async () => {
      try {
        const res = await fetch("http://localhost:8080/api/lostitems/all");
        const data = await res.json();
        if (!cancelled) {
          const map = {};
          data.forEach((it) => (map[it.id] = it));
          setLostItemsMap(map);
        }
      } catch (e) {
        console.error(e);
        if (!cancelled) setError("Failed to load lost items");
      }
    };

    fetchLosts();

    // subscribe to SSE for foundId or lostId updates (prefer lostId if present)
    let es;
    const streamToUse = lostId ? `lost/${lostId}` : foundId ? `found/${foundId}` : null;
    if (streamToUse) {
      setLoading(true);
      setError("");
      es = new EventSource(`http://localhost:8080/api/stream/matches/${streamToUse}`);
      es.onmessage = (ev) => {
        try {
          const parsed = JSON.parse(ev.data);
          setSuggestions(parsed);
          setLoading(false);
        } catch (err) {
          console.error('SSE parse', err);
        }
      };
      es.addEventListener('matches', (ev) => {
        try {
          const parsed = JSON.parse(ev.data);
          setSuggestions(parsed);
          setLoading(false);
        } catch (err) {
          console.error('SSE matches parse', err);
        }
      });

      es.onerror = (err) => {
        console.error('SSE error', err);
        setError('Connection lost.');
        setLoading(false);
        try { es.close(); } catch(e){}
      };
    }

    return () => {
      cancelled = true;
      if (es) es.close();
    };
  }, [foundId]);

  return (
  <aside className="w-full md:w-80 bg-white p-4 rounded-lg shadow md:ml-6 mt-4 md:mt-0">
  <h3 className="text-lg font-semibold mb-3">Suggested Matches</h3>
  {!foundId && null}

      {loading && foundId && <div className="text-sm text-gray-600">Analyzing... please wait.</div>}

      {error && <div className="text-sm text-red-500">{error}</div>}

      {suggestions.length > 0 && (
        <div className="space-y-3 max-h-[60vh] overflow-auto">
          {suggestions.map((s) => {
            const lost = lostItemsMap[s.lostItemId] || {};
            const isMatch = highlightLostId && highlightLostId === s.lostItemId;
            const imageSrc = lost.imageUrl
              ? lost.imageUrl.startsWith("/uploads/")
                ? `http://localhost:8080${lost.imageUrl}`
                : lost.imageUrl
              : null;

            return (
              <div key={s.id} className={`p-2 rounded ${isMatch ? 'ring-2 ring-green-300' : 'border'} `}>
                <div className="flex gap-3">
                  <div className="w-20 h-20 bg-gray-100 rounded overflow-hidden flex-shrink-0">
                    {imageSrc ? (
                      <img src={imageSrc} alt={lost.itemName} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs">No Image</div>
                    )}
                  </div>

                  <div className="flex-1">
                    <div className="font-semibold text-sm">{lost.itemName || 'Unknown'}</div>
                    <div className="text-xs text-gray-600">{lost.brand || ''} {lost.modelNo ? `· ${lost.modelNo}` : ''}</div>
                    <div className="text-xs text-gray-500 mt-1">{lost.location || ''}</div>
                    <div className="text-xs text-blue-700 mt-1">Score: {(s.score * 100).toFixed(1)}%</div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </aside>
  );
}
