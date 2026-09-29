import React, { useState, useEffect, useRef } from 'react';
import { 
  MapPin, 
  Search, 
  X, 
  ExternalLink, 
  Loader2, 
  Coffee, 
  Building2, 
  Check,
  Compass,
  Layers,
  Crosshair,
  Map as MapIcon
} from 'lucide-react';

/**
 * Utility to dynamically load Leaflet CSS & JS synchronously
 */
const ensureLeafletLoaded = () => {
  return new Promise((resolve, reject) => {
    if (window.L) {
      resolve(window.L);
      return;
    }

    // Inject Leaflet CSS
    if (!document.getElementById('leaflet-css')) {
      const link = document.createElement('link');
      link.id = 'leaflet-css';
      link.rel = 'stylesheet';
      link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
      document.head.appendChild(link);
    }

    // Inject Leaflet JS
    if (!document.getElementById('leaflet-js')) {
      const script = document.createElement('script');
      script.id = 'leaflet-js';
      script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
      script.onload = () => {
        // Wait a tiny bit for L to populate
        setTimeout(() => resolve(window.L), 50);
      };
      script.onerror = (err) => reject(err);
      document.head.appendChild(script);
    } else {
      const interval = setInterval(() => {
        if (window.L) {
          clearInterval(interval);
          resolve(window.L);
        }
      }, 50);
    }
  });
};

export const LocationSearchInput = ({ 
  value = '', 
  onChange, 
  placeholder = 'Ketik nama tempat/kafe/alamat (contoh: Cafe Koa, Jl. Sudirman)...',
  required = false,
  id = 'location_search_input',
  className = ''
}) => {
  const [inputValue, setInputValue] = useState(value);
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);

  // Map Modal States
  const [showMapModal, setShowMapModal] = useState(false);
  const [mapLoading, setMapLoading] = useState(false);
  const [mapSearchQuery, setMapSearchQuery] = useState('');
  const [mapSearchLoading, setMapSearchLoading] = useState(false);
  const [mapLayerType, setMapLayerType] = useState('roadmap'); // 'roadmap' | 'satellite'
  const [pinAddress, setPinAddress] = useState('');
  const [pinCoords, setPinCoords] = useState({ lat: -6.2088, lng: 106.8456 }); // Default: Jakarta

  const containerRef = useRef(null);
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const tileLayerRef = useRef(null);
  const markerRef = useRef(null);
  const debounceTimer = useRef(null);

  // Sync external value
  useEffect(() => {
    setInputValue(value || '');
  }, [value]);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Search places via Nominatim API
  const searchPlacesAPI = async (queryText) => {
    if (!queryText || queryText.trim().length < 2) return [];
    try {
      const query = encodeURIComponent(queryText.trim());
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${query}&countrycodes=id&addressdetails=1&limit=6`,
        {
          headers: {
            'Accept-Language': 'id,en',
            'User-Agent': 'NotarisTrackerApp/1.0'
          }
        }
      );
      if (res.ok) {
        return await res.json();
      }
    } catch (err) {
      console.warn('Search Places API Error:', err);
    }
    return [];
  };

  // Reverse Geocoding: Lat/Lng -> Address Name
  const reverseGeocodeAPI = async (lat, lng) => {
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&addressdetails=1`,
        {
          headers: {
            'Accept-Language': 'id,en',
            'User-Agent': 'NotarisTrackerApp/1.0'
          }
        }
      );
      if (res.ok) {
        const data = await res.json();
        return data?.display_name || '';
      }
    } catch (err) {
      console.warn('Reverse Geocode API Error:', err);
    }
    return '';
  };

  // Main input typing handler
  const handleInputChange = (e) => {
    const text = e.target.value;
    setInputValue(text);
    if (onChange) onChange(text);

    if (debounceTimer.current) clearTimeout(debounceTimer.current);

    if (!text || text.trim().length < 2) {
      setSuggestions([]);
      setShowDropdown(false);
      setLoading(false);
      return;
    }

    setLoading(true);
    setShowDropdown(true);

    debounceTimer.current = setTimeout(async () => {
      const results = await searchPlacesAPI(text);
      setSuggestions(results);
      setLoading(false);
    }, 300);
  };

  const handleSelectSuggestion = (item) => {
    const displayName = item.display_name || '';
    setInputValue(displayName);
    if (onChange) onChange(displayName);

    if (item.lat && item.lon) {
      setPinCoords({ lat: parseFloat(item.lat), lng: parseFloat(item.lon) });
    }

    setShowDropdown(false);
  };

  // Initialize Google Maps style tile layer in Leaflet
  const updateMapTileLayer = (L, map, type) => {
    if (tileLayerRef.current) {
      map.removeLayer(tileLayerRef.current);
    }

    // Google Maps Tile Endpoints (mt0..mt3.google.com)
    // lyrs=m: Standard Google Roadmap
    // lyrs=s,h: Google Hybrid Satellite
    const googleTileUrl = type === 'satellite'
      ? 'https://{s}.google.com/vt/lyrs=s,h&x={x}&y={y}&z={z}'
      : 'https://{s}.google.com/vt/lyrs=m&x={x}&y={y}&z={z}';

    tileLayerRef.current = L.tileLayer(googleTileUrl, {
      maxZoom: 20,
      subdomains: ['mt0', 'mt1', 'mt2', 'mt3'],
      attribution: '&copy; Google Maps'
    }).addTo(map);
  };

  // Open & Render Google Maps Interactive Picker Modal
  const openGoogleMapPicker = async () => {
    setShowMapModal(true);
    setMapLoading(true);

    try {
      const L = await ensureLeafletLoaded();
      setMapLoading(false);

      let targetLat = pinCoords.lat;
      let targetLng = pinCoords.lng;

      // Geocode current input value if no coordinates stored yet
      if (inputValue && inputValue.trim().length > 2) {
        const searchRes = await searchPlacesAPI(inputValue);
        if (searchRes && searchRes[0]) {
          targetLat = parseFloat(searchRes[0].lat);
          targetLng = parseFloat(searchRes[0].lon);
          setPinCoords({ lat: targetLat, lng: targetLng });
        }
      }

      setPinAddress(inputValue || 'Geser peta/pin merah ke titik lokasi yang presisi');

      setTimeout(() => {
        if (!mapContainerRef.current) return;

        if (mapInstanceRef.current) {
          mapInstanceRef.current.remove();
          mapInstanceRef.current = null;
        }

        // 1. Create Leaflet Map Instance
        const map = L.map(mapContainerRef.current, {
          center: [targetLat, targetLng],
          zoom: 16,
          zoomControl: false // custom position
        });
        mapInstanceRef.current = map;

        // Add Zoom Control to Bottom Right
        L.control.zoom({ position: 'bottomright' }).addTo(map);

        // 2. Set Google Maps Tile Layer
        updateMapTileLayer(L, map, mapLayerType);

        // 3. Create Google Maps Style Red Marker Pin
        const googlePinIcon = L.divIcon({
          className: 'google-maps-pin-marker',
          html: `
            <div style="position: relative; width: 38px; height: 38px; display: flex; items-center: center; justify-content: center; filter: drop-shadow(0 6px 12px rgba(0,0,0,0.4)); transform: translate(-50%, -100%); left: 50%; top: 100%;">
              <svg width="38" height="38" viewBox="0 0 38 38" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M19 0C10.7157 0 4 6.71573 4 15C4 25.5 19 38 19 38C19 38 34 25.5 34 15C34 6.71573 27.2843 0 19 0Z" fill="#EA4335"/>
                <circle cx="19" cy="14" r="6" fill="#B31412"/>
                <circle cx="19" cy="14" r="5" fill="#FFFFFF"/>
              </svg>
            </div>
          `,
          iconSize: [38, 38],
          iconAnchor: [19, 38]
        });

        const marker = L.marker([targetLat, targetLng], {
          draggable: true,
          icon: googlePinIcon
        }).addTo(map);

        markerRef.current = marker;

        // On Marker Drag End
        marker.on('dragend', async () => {
          const pos = marker.getLatLng();
          setPinCoords({ lat: pos.lat, lng: pos.lng });
          const addr = await reverseGeocodeAPI(pos.lat, pos.lng);
          if (addr) setPinAddress(addr);
        });

        // On Map Click
        map.on('click', async (e) => {
          const { lat, lng } = e.latlng;
          marker.setLatLng([lat, lng]);
          setPinCoords({ lat, lng });
          const addr = await reverseGeocodeAPI(lat, lng);
          if (addr) setPinAddress(addr);
        });

        // Trigger resize calculation
        map.invalidateSize();

        if (!inputValue) {
          reverseGeocodeAPI(targetLat, targetLng).then((addr) => {
            if (addr) setPinAddress(addr);
          });
        }

      }, 150);

    } catch (err) {
      console.error('Error initializing map:', err);
      setMapLoading(false);
    }
  };

  // Handle map layer toggle (Roadmap <-> Satellite)
  const toggleMapLayer = () => {
    const nextType = mapLayerType === 'roadmap' ? 'satellite' : 'roadmap';
    setMapLayerType(nextType);
    if (window.L && mapInstanceRef.current) {
      updateMapTileLayer(window.L, mapInstanceRef.current, nextType);
    }
  };

  // Fly to location when searching inside Map Modal
  const handleMapSearchSubmit = async (e) => {
    e.preventDefault();
    if (!mapSearchQuery || !mapSearchQuery.trim()) return;

    setMapSearchLoading(true);
    const results = await searchPlacesAPI(mapSearchQuery);
    setMapSearchLoading(false);

    if (results && results[0]) {
      const match = results[0];
      const newLat = parseFloat(match.lat);
      const newLng = parseFloat(match.lon);

      setPinCoords({ lat: newLat, lng: newLng });
      setPinAddress(match.display_name || mapSearchQuery);

      if (mapInstanceRef.current && markerRef.current) {
        mapInstanceRef.current.flyTo([newLat, newLng], 17, { duration: 1.2 });
        markerRef.current.setLatLng([newLat, newLng]);
      }
    }
  };

  // Get User's Current GPS Location
  const handleUseCurrentGPS = () => {
    if (!navigator.geolocation) return;
    setMapSearchLoading(true);

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;

        setPinCoords({ lat, lng });
        setMapSearchLoading(false);

        if (mapInstanceRef.current && markerRef.current) {
          mapInstanceRef.current.flyTo([lat, lng], 17, { duration: 1.2 });
          markerRef.current.setLatLng([lat, lng]);
        }

        const addr = await reverseGeocodeAPI(lat, lng);
        if (addr) setPinAddress(addr);
      },
      (err) => {
        console.warn('GPS error:', err);
        setMapSearchLoading(false);
      },
      { enableHighAccuracy: true }
    );
  };

  const handleConfirmPinLocation = () => {
    const finalAddr = pinAddress || inputValue;
    setInputValue(finalAddr);
    if (onChange) onChange(finalAddr);
    setShowMapModal(false);
  };

  const getPlaceIcon = (type = '', cat = '') => {
    const t = (type + ' ' + cat).toLowerCase();
    if (t.includes('cafe') || t.includes('coffee') || t.includes('restaurant')) {
      return <Coffee className="w-4 h-4 text-amber-500" />;
    }
    if (t.includes('building') || t.includes('office') || t.includes('company')) {
      return <Building2 className="w-4 h-4 text-[#6366F1]" />;
    }
    return <MapPin className="w-4 h-4 text-emerald-500" />;
  };

  return (
    <div ref={containerRef} className="relative w-full text-left">
      <div className="relative flex items-center">
        <span className="absolute left-3.5 text-slate-400 pointer-events-none flex items-center">
          <MapPin className="w-4 h-4 text-[#EA4335]" />
        </span>

        <input
          id={id}
          type="text"
          required={required}
          value={inputValue}
          onChange={handleInputChange}
          onFocus={() => inputValue.length >= 2 && suggestions.length > 0 && setShowDropdown(true)}
          placeholder={placeholder}
          className={`w-full pl-10 pr-28 py-2.5 bg-white border border-slate-200 rounded-2xl text-[13px] text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#6366F1] focus:ring-4 focus:ring-[#6366F1]/10 font-medium transition-all shadow-xs ${className}`}
        />

        {/* Right Action Controls */}
        <div className="absolute right-2 flex items-center gap-1">
          {loading && (
            <Loader2 className="w-4 h-4 text-[#6366F1] animate-spin mr-1" />
          )}

          {inputValue && !loading && (
            <button
              type="button"
              onClick={() => {
                setInputValue('');
                if (onChange) onChange('');
                setSuggestions([]);
                setShowDropdown(false);
              }}
              className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
              title="Hapus lokasi"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}

          {/* Buka Google Maps UI CTA Button */}
          <button
            type="button"
            onClick={openGoogleMapPicker}
            className="flex items-center gap-1.5 px-2.5 py-1.5 bg-gradient-to-r from-[#EA4335] to-[#4285F4] text-white rounded-xl text-[11px] font-bold shadow-xs hover:shadow-md active:scale-95 transition-all cursor-pointer"
            title="Buka Peta Google Maps & Geser Pin"
          >
            <Compass className="w-3.5 h-3.5" />
            <span>Peta Maps</span>
          </button>
        </div>
      </div>

      {/* Autocomplete Dropdown List */}
      {showDropdown && (
        <div className="absolute left-0 right-0 top-full mt-1.5 bg-white border border-slate-200/90 rounded-2xl shadow-xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-1 duration-150 text-left">
          <div className="p-2 bg-slate-50/80 border-b border-slate-100 flex items-center justify-between text-[10.5px] font-extrabold text-slate-400 uppercase tracking-wider">
            <span>Rekomendasi Tempat & Kafe (Google Maps Engine)</span>
            {loading && <span>Mencari...</span>}
          </div>

          <div className="max-h-64 overflow-y-auto custom-scrollbar divide-y divide-slate-100">
            {suggestions.length > 0 ? (
              suggestions.map((item, idx) => {
                const parts = (item.display_name || '').split(',');
                const title = parts[0] || item.display_name;
                const subtitle = parts.slice(1).join(',').trim();

                return (
                  <div
                    key={idx}
                    onClick={() => handleSelectSuggestion(item)}
                    className="p-3 hover:bg-[#F8FAFC] cursor-pointer transition-colors flex items-start gap-3 group"
                  >
                    <div className="w-8 h-8 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center shrink-0 mt-0.5 group-hover:bg-rose-50 group-hover:border-rose-100 transition-colors">
                      {getPlaceIcon(item.type, item.class)}
                    </div>

                    <div className="min-w-0 flex-1">
                      <p className="text-[13px] font-bold text-slate-800 group-hover:text-[#EA4335] transition-colors truncate">
                        {title}
                      </p>
                      <p className="text-[11px] text-slate-400 font-medium line-clamp-2 mt-0.5 leading-snug">
                        {subtitle}
                      </p>
                    </div>
                  </div>
                );
              })
            ) : !loading ? (
              <div className="p-4 text-center text-slate-400 text-[12px] font-medium">
                Tidak ada rekomendasi tempat ditemukan. Klik <b>"Peta Maps"</b> untuk memilih lokasi langsung di peta Google Maps.
              </div>
            ) : null}
          </div>
        </div>
      )}

      {/* Google Maps Style Interactive Draggable Map Modal */}
      {showMapModal && (
        <div className="fixed inset-0 bg-slate-900/75 backdrop-blur-xs z-50 flex items-center justify-center p-3 sm:p-5 select-none">
          <div className="bg-white border border-slate-200 rounded-[28px] w-full max-w-4xl overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-200 text-left flex flex-col h-[85vh]">
            
            {/* Top Google Maps Header Bar */}
            <div className="px-5 py-3.5 border-b border-slate-100 flex items-center justify-between bg-white shrink-0 gap-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-2xl bg-[#EA4335] text-white flex items-center justify-center shadow-md">
                  <MapPin className="w-5 h-5 stroke-[2.2]" />
                </div>
                <div>
                  <h4 className="font-extrabold text-slate-800 text-[15.5px] leading-tight">Google Maps Pinpoint</h4>
                  <p className="text-[11px] text-slate-400 font-medium">Geser pin merah atau cari tempat di bawah untuk menentukan titik lokasi akurat.</p>
                </div>
              </div>

              {/* Close Button */}
              <button
                type="button"
                onClick={() => setShowMapModal(false)}
                className="w-9 h-9 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-600 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Main Map Box */}
            <div className="relative flex-1 bg-slate-100 overflow-hidden">
              
              {/* In-Map Google Maps Search Floating Bar (Top Left) */}
              <div className="absolute top-4 left-4 z-20 w-full max-w-sm">
                <form onSubmit={handleMapSearchSubmit} className="relative flex items-center shadow-lg rounded-2xl overflow-hidden bg-white border border-slate-200/90">
                  <input
                    type="text"
                    value={mapSearchQuery}
                    onChange={(e) => setMapSearchQuery(e.target.value)}
                    placeholder="Cari tempat di Google Maps (contoh: Kafe, Bank)..."
                    className="w-full pl-10 pr-10 py-2.5 text-[12.5px] text-slate-800 font-semibold placeholder-slate-400 focus:outline-none"
                  />
                  <Search className="w-4 h-4 text-slate-400 absolute left-3.5 pointer-events-none" />
                  
                  {mapSearchLoading ? (
                    <Loader2 className="w-4 h-4 text-[#EA4335] animate-spin absolute right-3" />
                  ) : (
                    <button
                      type="submit"
                      className="absolute right-2 px-2.5 py-1 bg-[#EA4335] text-white text-[11px] font-bold rounded-xl hover:bg-[#D93025] transition-colors"
                    >
                      Cari
                    </button>
                  )}
                </form>
              </div>

              {/* Map Floating Tools (Top Right): Satellite Toggle & GPS Location */}
              <div className="absolute top-4 right-4 z-20 flex flex-col gap-2">
                {/* Satellite / Roadmap Toggle */}
                <button
                  type="button"
                  onClick={toggleMapLayer}
                  className="flex items-center gap-1.5 px-3 py-2 bg-white/95 backdrop-blur-md border border-slate-200 text-slate-700 rounded-2xl text-[11.5px] font-bold shadow-md hover:bg-slate-50 active:scale-95 transition-all"
                  title="Ganti Tampilan Satelit / Peta"
                >
                  <Layers className="w-4 h-4 text-[#4285F4]" />
                  <span>{mapLayerType === 'roadmap' ? 'Satelit' : 'Peta Jalan'}</span>
                </button>

                {/* GPS Location Button */}
                <button
                  type="button"
                  onClick={handleUseCurrentGPS}
                  className="flex items-center gap-1.5 px-3 py-2 bg-white/95 backdrop-blur-md border border-slate-200 text-slate-700 rounded-2xl text-[11.5px] font-bold shadow-md hover:bg-slate-50 active:scale-95 transition-all"
                  title="Deteksi Lokasi Saya Saat Ini"
                >
                  <Crosshair className="w-4 h-4 text-[#34A853]" />
                  <span>Lokasi Saya</span>
                </button>
              </div>

              {/* Map Loading State */}
              {mapLoading && (
                <div className="absolute inset-0 bg-white/90 z-30 flex flex-col items-center justify-center text-slate-500">
                  <Loader2 className="w-9 h-9 text-[#EA4335] animate-spin mb-2" />
                  <p className="text-[13.5px] font-bold text-slate-700">Menyiapkan Peta Google Maps...</p>
                </div>
              )}

              {/* Leaflet DOM container */}
              <div ref={mapContainerRef} className="w-full h-full z-10" />
            </div>

            {/* Bottom Bar: Address Output & Confirmation */}
            <div className="p-5 border-t border-slate-100 bg-white flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 shrink-0">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5 text-[10.5px] font-extrabold text-slate-400 uppercase tracking-wider mb-0.5">
                  <MapPin className="w-3.5 h-3.5 text-[#EA4335]" />
                  <span>Alamat Terpilih dari Pin Maps:</span>
                </div>
                <p className="text-[13px] font-bold text-slate-800 line-clamp-2 leading-snug">
                  {pinAddress || 'Geser pin merah pada peta untuk memilih titik lokasi...'}
                </p>
              </div>

              <div className="flex items-center gap-2.5 shrink-0">
                <button
                  type="button"
                  onClick={() => setShowMapModal(false)}
                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-2xl text-[12.5px] font-bold text-slate-600 transition-colors"
                >
                  Batal
                </button>

                <button
                  type="button"
                  onClick={handleConfirmPinLocation}
                  className="px-5 py-2.5 bg-gradient-to-r from-[#EA4335] to-[#4285F4] text-white rounded-2xl text-[12.5px] font-extrabold shadow-md hover:shadow-lg active:scale-95 transition-all flex items-center gap-2 cursor-pointer"
                >
                  <Check className="w-4 h-4 stroke-[3]" />
                  <span>Gunakan Lokasi Ini</span>
                </button>
              </div>
            </div>

          </div>
        </div>
      )}
    </div>
  );
};

export default LocationSearchInput;
