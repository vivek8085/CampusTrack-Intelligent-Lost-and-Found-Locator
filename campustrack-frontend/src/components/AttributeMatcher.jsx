import React, { useEffect, useState } from 'react';
import { API_BASE } from '../utils/api';

// Simple attribute-based matcher
// - Fetches all lost and found items from backend endpoints
// - Computes a heuristic similarity score (0..1) based on attributes
// - Allows selecting a lost item and shows top matching found items

function tokenize(s) {
  if (!s) return [];
  return s
    .toString()
    .toLowerCase()
    // normalize non-word chars to spaces
    .replace(/[^\w]+/g, ' ')
    .split(/\s+/)
    .filter(Boolean);
}

function textOverlapScore(a, b) {
  const ta = new Set(tokenize(a));
  const tb = new Set(tokenize(b));
  if (ta.size === 0 || tb.size === 0) return 0;
  let inter = 0;
  for (const t of ta) {
    if (tb.has(t)) inter++;
  }
  return inter / Math.max(ta.size, tb.size);
}

function attributeScore(lost, found) {
  // Heuristic weights (sum to 1.0)
  const weights = {
    brand: 0.28,
    modelNo: 0.28,
    location: 0.18,
    about: 0.18,
    size: 0.08,
  };

  let score = 0;

  // exact or strong match for brand
  if (lost.brand && found.brand && lost.brand.toLowerCase() === found.brand.toLowerCase()) {
    score += weights.brand;
  } else {
    // partial text overlap
    score += weights.brand * textOverlapScore(lost.brand, found.brand) * 0.7;
  }

  // model number tends to be strong when equal
  if (lost.modelNo && found.modelNo && lost.modelNo.toLowerCase() === found.modelNo.toLowerCase()) {
    score += weights.modelNo;
  } else {
    score += weights.modelNo * textOverlapScore(lost.modelNo, found.modelNo) * 0.7;
  }

  // location fuzzy match by token overlap
  score += weights.location * textOverlapScore(lost.location, found.location);

  // description/about overlap
  score += weights.about * textOverlapScore(lost.about, found.about);

  // size: exact or numeric closeness
  if (lost.size && found.size && lost.size === found.size) {
    score += weights.size;
  } else {
    // small partial credit if both mention small/medium/large words
    const sizeScore = textOverlapScore(lost.size, found.size);
    score += weights.size * sizeScore * 0.8;
  }

  // clamp
  return Math.max(0, Math.min(1, score));
}

export default function AttributeMatcher() {
  const [lostItems, setLostItems] = useState([]);
  const [foundItems, setFoundItems] = useState([]);
  const [selectedLostId, setSelectedLostId] = useState(null);
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        const [rl, rf] = await Promise.all([
          fetch(`${API_BASE}/api/lostitems/all`, { credentials: 'include' }).then((r) => r.json()),
          fetch(`${API_BASE}/api/founditems/all`, { credentials: 'include' }).then((r) => r.json()),
        ]);
        if (!mounted) return;
        setLostItems(rl || []);
        setFoundItems(rf || []);
      } catch (err) {
        console.error(err);
        if (mounted) setError('Failed to load items from server');
      }
    };
    load();
    return () => { mounted = false; };
  }, []);

  useEffect(() => {
    if (!selectedLostId) {
      setMatches([]);
      return;
    }

    const lost = lostItems.find((l) => l.id === selectedLostId);
    if (!lost) return;

    setLoading(true);
    setTimeout(() => {
      const scored = foundItems.map((f) => ({
        found: f,
        score: attributeScore(lost, f),
      }));
      scored.sort((a, b) => b.score - a.score);
      setMatches(scored.slice(0, 10));
      setLoading(false);
    }, 120); // small debounce/async so UI updates show
  }, [selectedLostId, lostItems, foundItems]);

  return (
    <div className="bg-white p-4 rounded shadow">
      <h2 className="text-lg font-semibold mb-3">Attribute-based Matches</h2>

      {error && <div className="text-red-500 text-sm mb-2">{error}</div>}

      <div className="mb-3">
        <label htmlFor="select-lost" className="block text-sm text-gray-600 mb-1">Select a lost item</label>
        <select
          id="select-lost"
          className="w-full p-2 border rounded"
          value={selectedLostId || ''}
          onChange={(e) => setSelectedLostId(e.target.value ? Number(e.target.value) : null)}
        >
          <option value="">-- choose lost item --</option>
          {lostItems.map((l) => (
            <option key={l.id} value={l.id}>{l.itemName || `#${l.id}`} {l.brand ? `· ${l.brand}` : ''}</option>
          ))}
        </select>
      </div>

      {loading && <div className="text-sm text-gray-600">Computing matches…</div>}

      {!loading && matches.length === 0 && selectedLostId && (
        <div className="text-sm text-gray-500">No matches found.</div>
      )}

      {matches.length > 0 && (
        <div className="space-y-3">
          {matches.map((m, idx) => {
            let image = null;
            if (m.found.imageUrl) {
              image = m.found.imageUrl.startsWith('/uploads/') ? `${API_BASE}${m.found.imageUrl}` : m.found.imageUrl;
            }
            const openDetails = () => {
              const id = m.found.id;
              const lostId = selectedLostId;
              const url = `${window.location.origin}/found.html?id=${id}${lostId ? `&lostId=${lostId}` : ''}`;
              window.open(url, '_blank');
            };

            return (
              <div
                key={m.found.id || idx}
                role="button"
                tabIndex={0}
                onClick={openDetails}
                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { openDetails(); } }}
                className={`flex gap-3 items-center p-2 border rounded cursor-pointer hover:bg-gray-50`}
              >
                <div className="w-20 h-20 bg-gray-100 rounded overflow-hidden flex-shrink-0">
                  {image ? <img src={image} alt={m.found.itemName} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs">No Image</div>}
                </div>
                <div className="flex-1">
                  <div className="font-semibold text-sm">{m.found.itemName || 'Unknown'}</div>
                  <div className="text-xs text-gray-600">{m.found.brand || ''} {m.found.modelNo ? `· ${m.found.modelNo}` : ''}</div>
                  <div className="text-xs text-gray-500 mt-1">{m.found.location || ''}</div>
                </div>
                <div className="text-sm text-blue-700 font-medium">{(m.score * 100).toFixed(1)}%</div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
