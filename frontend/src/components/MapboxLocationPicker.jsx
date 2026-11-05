import React, { useEffect, useRef, useState, useCallback } from 'react';
import mapboxgl from 'mapbox-gl';
import {
  MapPin, Search, Navigation, AlertCircle,
  Route, Car, RefreshCw, X, Info,
  GraduationCap, Store, Building2, Hospital
} from 'lucide-react';
import { formatCurrency, calculateTravelFee } from '../utils/format';

// Tọa độ Studio MNM (204 Trần Duy Hưng, Q. Cầu Giấy, Hà Nội)
const STUDIO_COORDS = {
  lng: 105.7951,
  lat: 21.0076,
  name: 'Studio DungDorys',
  address: '204 Trần Duy Hưng, Q. Cầu Giấy, Hà Nội',
};

// Token Mapbox
// Thay vì gán chuỗi token trực tiếp vào đây, hãy đổi thành:
const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN;
mapboxgl.accessToken = DEFAULT_MAPBOX_TOKEN;

// Tính khoảng cách Haversine (đường chim bay) * 1.25 hệ số giao thông nội đô
const calculateHaversineKm = (lat1, lon1, lat2, lon2) => {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
    Math.cos((lat2 * Math.PI) / 180) *
    Math.sin(dLon / 2) *
    Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const directDistance = R * c;
  return Number((directDistance * 1.25).toFixed(1));
};


const MapboxLocationPicker = ({
  initialAddress = '',
  initialDistanceKm = 5,
  onLocationChange,
}) => {
  const mapContainerRef = useRef(null);
  const mapRef = useRef(null);
  const studioMarkerRef = useRef(null);
  const customerMarkerRef = useRef(null);
  const customerPopupRef = useRef(null);

  const onLocationChangeRef = useRef(onLocationChange);
  const initialAddressRef = useRef(initialAddress);

  useEffect(() => {
    onLocationChangeRef.current = onLocationChange;
  }, [onLocationChange]);

  const [searchQuery, setSearchQuery] = useState(initialAddress);
  const [suggestions, setSuggestions] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [distanceKm, setDistanceKm] = useState(initialDistanceKm);
  const [durationMins, setDurationMins] = useState(null);
  const [calculatingRoute, setCalculatingRoute] = useState(false);
  const [mapError] = useState(null);
  const [isLocating, setIsLocating] = useState(false);

  const token = DEFAULT_MAPBOX_TOKEN;

  // Reverse Geocoding: Tọa độ -> Tên địa chỉ
  const reverseGeocode = useCallback(async (lng, lat) => {
    try {
      const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${lng},${lat}.json?types=address,poi,neighborhood,locality&language=vi&access_token=${token}`;
      const res = await fetch(url);
      const data = await res.json();
      if (data.features && data.features.length > 0) {
        const placeName = data.features[0].place_name_vi || data.features[0].place_name;
        setSearchQuery(placeName);
        return placeName;
      }
    } catch (err) {
      console.warn('Lỗi Reverse Geocoding:', err);
    }
    return '';
  }, [token]);

  // Tính khoảng cách dự phòng (Haversine)
  const fallbackCalculateDistance = useCallback((custLng, custLat, currentAddr) => {
    const distKm = calculateHaversineKm(
      STUDIO_COORDS.lat,
      STUDIO_COORDS.lng,
      custLat,
      custLng
    );
    const estDuration = Math.round(distKm * 3.5);
    setDistanceKm(distKm);
    setDurationMins(estDuration);

    const fee = calculateTravelFee(distKm);
    if (onLocationChangeRef.current) {
      onLocationChangeRef.current({
        address: currentAddr,
        distanceKm: distKm,
        coordinates: [custLng, custLat],
        travelFee: fee,
        durationMins: estDuration,
      });
    }

    // Cập nhật popup
    if (customerPopupRef.current) {
      const feeHtml = distKm > 200
        ? '<p class="text-rose-600 font-bold mt-1">⚠️ Vượt quá 200km (Không nhận đơn)</p>'
        : `<p class="text-rose-600 font-bold mt-1">Cách Studio: ${distKm} km</p>
           <p class="text-slate-500 text-[10px]">Phụ phí di chuyển: ${fee === 0 ? 'Miễn phí (0 đ)' : formatCurrency(fee)}</p>`;

      customerPopupRef.current.setHTML(`
        <div class="p-2 text-xs font-sans">
          <p class="font-bold text-slate-900">${currentAddr || 'Điểm đã chọn'}</p>
          ${feeHtml}
        </div>
      `);
    }
  }, []);

  // Lấy chỉ đường từ Directions API & vẽ tuyến đường từ Studio tới Khách hàng
  const fetchRouteAndDistance = useCallback(async (custLng, custLat, currentAddr) => {
    setCalculatingRoute(true);
    try {
      const url = `https://api.mapbox.com/directions/v5/mapbox/driving/${STUDIO_COORDS.lng},${STUDIO_COORDS.lat};${custLng},${custLat}?geometries=geojson&overview=full&access_token=${token}`;
      const res = await fetch(url);
      const data = await res.json();

      if (data.routes && data.routes.length > 0) {
        const route = data.routes[0];
        const distKm = Number((route.distance / 1000).toFixed(1));
        const durMins = Math.round(route.duration / 60);

        setDistanceKm(distKm);
        setDurationMins(durMins);

        if (mapRef.current) {
          const map = mapRef.current;
          const routeGeoJSON = {
            type: 'Feature',
            properties: {},
            geometry: route.geometry,
          };

          if (map.getSource('route')) {
            map.getSource('route').setData(routeGeoJSON);
          } else {
            map.addSource('route', {
              type: 'geojson',
              data: routeGeoJSON,
            });

            // Viền phát sáng
            map.addLayer({
              id: 'route-glow',
              type: 'line',
              source: 'route',
              layout: {
                'line-join': 'round',
                'line-cap': 'round',
              },
              paint: {
                'line-color': '#fda4af',
                'line-width': 8,
                'line-opacity': 0.7,
              },
            });

            // Tuyến đường chính
            map.addLayer({
              id: 'route-line',
              type: 'line',
              source: 'route',
              layout: {
                'line-join': 'round',
                'line-cap': 'round',
              },
              paint: {
                'line-color': '#e11d48',
                'line-width': 4,
              },
            });
          }

          // Căn chỉnh khung nhìn hiển thị cả Studio và Khách hàng
          const bounds = new mapboxgl.LngLatBounds();
          bounds.extend([STUDIO_COORDS.lng, STUDIO_COORDS.lat]);
          bounds.extend([custLng, custLat]);
          map.fitBounds(bounds, { padding: 60, maxZoom: 15, duration: 800 });
        }

        const fee = calculateTravelFee(distKm);

        // Cập nhật popup
        if (customerPopupRef.current) {
          const feeHtml = distKm > 200
            ? '<p class="text-rose-600 font-bold mt-1">⚠️ Vượt quá 200km (Không nhận đơn)</p>'
            : `<p class="text-rose-600 font-bold mt-1">Cách Studio: ${distKm} km (~${durMins} phút)</p>
               <p class="text-slate-500 text-[10px]">Phụ phí di chuyển: ${fee === 0 ? 'Miễn phí (0 đ)' : formatCurrency(fee)}</p>`;

          customerPopupRef.current.setHTML(`
            <div class="p-2 text-xs font-sans">
              <p class="font-bold text-slate-900">${currentAddr || 'Điểm đã chọn'}</p>
              ${feeHtml}
            </div>
          `);
        }

        if (onLocationChangeRef.current) {
          onLocationChangeRef.current({
            address: currentAddr,
            distanceKm: distKm,
            coordinates: [custLng, custLat],
            travelFee: fee,
            durationMins: durMins,
          });
        }
      } else {
        fallbackCalculateDistance(custLng, custLat, currentAddr);
      }
    } catch (err) {
      console.warn('Lỗi gọi Mapbox Directions API, sử dụng tính toán dự phòng:', err);
      fallbackCalculateDistance(custLng, custLat, currentAddr);
    } finally {
      setCalculatingRoute(false);
    }
  }, [token, fallbackCalculateDistance]);

  // Cập nhật hoặc di chuyển ghim đánh dấu vị trí khách hàng
  const setCustomerLocation = useCallback(async (lng, lat, explicitAddress = null) => {
    // 1. Tính toán ước tính tức thì để UI phản hồi ngay lập tức
    const instantDistKm = calculateHaversineKm(
      STUDIO_COORDS.lat,
      STUDIO_COORDS.lng,
      lat,
      lng
    );
    setDistanceKm(instantDistKm);
    setDurationMins(Math.round(instantDistKm * 3.5));

    // 2. Tạo hoặc di chuyển Marker khách hàng đến điểm vừa nhấp
    if (mapRef.current) {
      const map = mapRef.current;

      if (!customerMarkerRef.current) {
        const el = document.createElement('div');
        el.className = 'customer-map-pin flex flex-col items-center cursor-grab active:cursor-grabbing transition-transform hover:scale-110';
        el.innerHTML = `
          <div class="relative flex flex-col items-center select-none" style="filter: drop-shadow(0 4px 6px rgba(0,0,0,0.35));">
            <svg width="34" height="46" viewBox="0 0 34 46" fill="none" xmlns="http://www.w3.org/2000/svg">
              <!-- Thân ghim hình tròn màu đỏ phía trên, vuốt nhọn cắm thẳng xuống vị trí -->
              <path d="M17 0C7.61 0 0 7.61 0 17C0 28.5 17 46 17 46C17 46 34 28.5 34 17C34 7.61 26.39 0 17 0Z" fill="#B91C1C"/>
              <path d="M17 1.5C8.44 1.5 1.5 8.44 1.5 17C1.5 27.2 17 43.8 17 43.8C17 43.8 32.5 27.2 32.5 17C32.5 8.44 25.56 1.5 17 1.5Z" fill="#EF4444"/>
              <!-- Vòng tròn màu trắng ở giữa đầu tròn -->
              <circle cx="17" cy="17" r="6.5" fill="#FFFFFF"/>
              <!-- Nhân đỏ ở tâm vòng tròn -->
              <circle cx="17" cy="17" r="3" fill="#DC2626"/>
            </svg>
            <!-- Điểm bóng mờ tiếp xúc mặt đất ngay đầu mũi nhọn -->
            <div style="width: 8px; height: 3px; background: rgba(0,0,0,0.3); border-radius: 9999px; margin-top: -2px;"></div>
          </div>
        `;

        const popup = new mapboxgl.Popup({ offset: [0, -46], closeButton: false })
          .setHTML(`
            <div class="p-2 text-xs font-sans">
              <p class="font-bold text-slate-900">${explicitAddress || 'Điểm đã chọn'}</p>
              <p class="text-rose-600 font-bold mt-1">Đang tính tuyến đường...</p>
            </div>
          `);

        customerPopupRef.current = popup;

        const marker = new mapboxgl.Marker({
          element: el,
          draggable: true,
          anchor: 'bottom', // Đáy mũi nhọn cắm chuẩn xác tuyệt đối vào tọa độ nhấp chuột
        })
          .setLngLat([lng, lat])
          .setPopup(popup)
          .addTo(map);

        marker.on('dragend', async () => {
          const newLngLat = marker.getLngLat();
          const reversed = await reverseGeocode(newLngLat.lng, newLngLat.lat);
          fetchRouteAndDistance(newLngLat.lng, newLngLat.lat, reversed);
        });

        customerMarkerRef.current = marker;
      } else {
        customerMarkerRef.current.setLngLat([lng, lat]);
      }
    }

    // 3. Lấy tên địa chỉ chi tiết bằng Reverse Geocode
    let currentAddr = explicitAddress;
    if (!currentAddr) {
      currentAddr = await reverseGeocode(lng, lat);
    }

    // 4. Lấy tuyến đường thực tế & tính khoảng cách từ Studio
    fetchRouteAndDistance(lng, lat, currentAddr);
  }, [reverseGeocode, fetchRouteAndDistance]);

  // Dùng ref để tránh việc map re-render khi function tham chiếu thay đổi
  const setCustomerLocationRef = useRef(setCustomerLocation);
  useEffect(() => {
    setCustomerLocationRef.current = setCustomerLocation;
  }, [setCustomerLocation]);

  // Khởi tạo bản đồ Mapbox (Chạy 1 lần duy nhất khi Mount)
  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    let isMounted = true;
    try {
      const map = new mapboxgl.Map({
        container: mapContainerRef.current,
        style: 'mapbox://styles/mapbox/streets-v12',
        center: [STUDIO_COORDS.lng, STUDIO_COORDS.lat],
        zoom: 13,
      });

      // Điều khiển phóng to/thu nhỏ
      map.addControl(new mapboxgl.NavigationControl({ showCompass: true }), 'bottom-right');

      map.on('load', () => {
        if (!isMounted) return;
        mapRef.current = map;

        // Đổi con trỏ chuột sang hình pointer (bàn tay) trên toàn bản đồ
        map.getCanvas().style.cursor = 'pointer';

        // 1. Marker Studio cố định tại 204 Trần Duy Hưng
        const studioEl = document.createElement('div');
        studioEl.className = 'studio-marker flex flex-col items-center';
        studioEl.innerHTML = `
          <div class="px-2.5 py-1 bg-slate-900 text-amber-300 text-[11px] font-bold rounded-full shadow-lg border border-amber-400/50 whitespace-nowrap mb-1">
            ✨ Studio MNM
          </div>
          <div class="w-8 h-8 rounded-full bg-slate-900 border-2 border-amber-400 shadow-xl flex items-center justify-center text-amber-300 text-sm">
            🏢
          </div>
        `;

        studioMarkerRef.current = new mapboxgl.Marker({ element: studioEl, anchor: 'bottom' })
          .setLngLat([STUDIO_COORDS.lng, STUDIO_COORDS.lat])
          .setPopup(
            new mapboxgl.Popup({ offset: [0, -36] }).setHTML(`
              <div class="p-2 text-xs">
                <p class="font-bold text-slate-900">${STUDIO_COORDS.name}</p>
                <p class="text-slate-600 mt-1">${STUDIO_COORDS.address}</p>
                <span class="inline-block mt-1 px-2 py-0.5 rounded bg-emerald-100 text-emerald-700 text-[10px] font-bold">
                  Điểm xuất phát tính phí di chuyển
                </span>
              </div>
            `)
          )
          .addTo(map);

        // 2. Điểm mặc định ban đầu lân cận (Khu Keangnam / Cầu Giấy)
        const defaultCustLng = 105.783;
        const defaultCustLat = 21.017;
        if (setCustomerLocationRef.current) {
          setCustomerLocationRef.current(
            defaultCustLng,
            defaultCustLat,
            initialAddressRef.current || 'Khu vực Cầu Giấy, Hà Nội'
          );
        }
      });

      // 3. Sự kiện CLICK trên bản đồ: Đánh dấu vị trí đó ngay lập tức & tính khoảng cách về Studio
      map.on('click', (e) => {
        const { lng, lat } = e.lngLat;
        if (setCustomerLocationRef.current) {
          setCustomerLocationRef.current(lng, lat);
        }
      });

      map.on('mouseenter', () => {
        map.getCanvas().style.cursor = 'pointer';
      });

    } catch (err) {
      console.error('Lỗi khởi tạo Mapbox:', err);
    }

    return () => {
      isMounted = false;
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);

  // Autocomplete Geocoding search kết hợp POI (Trường học, Siêu thị, TTTM, Bệnh viện, v.v...) và Mapbox
  useEffect(() => {
    if (!searchQuery || searchQuery.trim().length < 2 || !showDropdown) {
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearching(true);
      const cleanQ = searchQuery.trim();
      try {
        const [photonRes, mapboxRes] = await Promise.allSettled([
          fetch(
            `https://photon.komoot.io/api/?q=${encodeURIComponent(cleanQ)}&lat=${STUDIO_COORDS.lat}&lon=${STUDIO_COORDS.lng}&limit=8`
          ).then((r) => r.json()),
          fetch(
            `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(cleanQ)}.json?country=vn&proximity=${STUDIO_COORDS.lng},${STUDIO_COORDS.lat}&language=vi&access_token=${token}`
          ).then((r) => r.json()),
        ]);

        const combined = [];
        const seen = new Set();

        // 1. Ưu tiên các điểm POI thực tế (Trường đại học, trường học, siêu thị, bệnh viện, tòa nhà...) từ OpenStreetMap POI Engine
        if (photonRes.status === 'fulfilled' && photonRes.value?.features) {
          photonRes.value.features.forEach((f) => {
            const p = f.properties;
            const title = p.name || p.street;
            if (!title) return;
            const subParts = [p.housenumber, p.street, p.district, p.city, p.country].filter(Boolean);
            const sub = subParts.join(', ');
            const key = (title + '|' + (p.city || '')).toLowerCase();
            if (!seen.has(key)) {
              seen.add(key);
              combined.push({
                id: 'osm-' + f.properties.osm_id + '-' + Math.random(),
                title,
                subtitle: sub || 'Hà Nội, Việt Nam',
                fullAddress: title + (sub ? ', ' + sub : ''),
                center: f.geometry.coordinates,
                category: p.osm_key || p.type || 'poi',
              });
            }
          });
        }

        // 2. Bổ sung các tuyến đường, địa chỉ hành chính từ Mapbox
        if (mapboxRes.status === 'fulfilled' && mapboxRes.value?.features) {
          mapboxRes.value.features.forEach((f) => {
            const title = f.text_vi || f.text;
            const sub = f.place_name_vi || f.place_name;
            const key = title.toLowerCase();
            if (!seen.has(key)) {
              seen.add(key);
              combined.push({
                id: 'mbx-' + f.id,
                title,
                subtitle: sub,
                fullAddress: sub,
                center: f.center,
                category: f.place_type?.[0] || 'place',
              });
            }
          });
        }

        setSuggestions(combined);
      } catch (err) {
        console.error('Lỗi tìm kiếm gợi ý địa điểm:', err);
      } finally {
        setIsSearching(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [searchQuery, showDropdown, token]);

  const handleSelectSuggestion = (place) => {
    const [lng, lat] = place.center;
    const fullAddress = place.fullAddress || place.title;

    setSearchQuery(place.title);
    setShowDropdown(false);

    if (mapRef.current) {
      mapRef.current.flyTo({
        center: [lng, lat],
        zoom: 15.5,
        essential: true,
      });
    }

    setCustomerLocation(lng, lat, fullAddress);
  };

  const handleGetCurrentLocation = () => {
    if (!navigator.geolocation) {
      alert('Trình duyệt của bạn không hỗ trợ định vị vị trí hiện tại');
      return;
    }

    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { longitude, latitude } = pos.coords;
        if (mapRef.current) {
          mapRef.current.flyTo({
            center: [longitude, latitude],
            zoom: 15,
            essential: true,
          });
        }
        const reversedAddr = await reverseGeocode(longitude, latitude);
        setCustomerLocation(longitude, latitude, reversedAddr);
        setIsLocating(false);
      },
      (err) => {
        console.warn('Lỗi lấy GPS:', err);
        alert('Không thể truy cập vị trí hiện tại. Vui lòng cho phép quyền truy cập vị trí trên trình duyệt.');
        setIsLocating(false);
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  };

  const travelFee = calculateTravelFee(distanceKm);

  return (
    <div className="space-y-4">
      {/* Search Input Box with Autocomplete */}
      <div className="relative">
        <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center justify-between">
          <span className="flex items-center gap-1.5">
            <MapPin className="w-4 h-4 text-rose-600" />
            Tìm kiếm hoặc nhấp trực tiếp vào bản đồ để đánh dấu vị trí *
          </span>
          <span className="text-[11px] font-normal text-rose-600 bg-rose-50 px-2 py-0.5 rounded-full border border-rose-100 hidden sm:inline">
            💡 Nhấp vào bản đồ để chọn vị trí
          </span>
        </label>

        <div className="relative flex items-center">
          <div className="absolute left-3.5 text-slate-400 pointer-events-none">
            {isSearching ? (
              <RefreshCw className="w-4 h-4 animate-spin text-rose-500" />
            ) : (
              <Search className="w-4 h-4" />
            )}
          </div>

          <input
            type="text"
            id="input-mapbox-search"
            value={searchQuery}
            onChange={(e) => {
              const val = e.target.value;
              setSearchQuery(val);
              if (val.trim().length >= 2) {
                setShowDropdown(true);
              } else {
                setSuggestions([]);
              }
            }}
            onFocus={() => {
              if (searchQuery.trim().length >= 2) {
                setShowDropdown(true);
              }
            }}
            placeholder="Gõ tìm kiếm địa chỉ (ví dụ: Keangnam, Times City, Cầu Giấy...) hoặc nhấp vào bản đồ"
            className="w-full pl-10 pr-28 py-3 rounded-2xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500 bg-white shadow-xs"
          />

          {searchQuery && (
            <button
              type="button"
              onClick={() => {
                setSearchQuery('');
                setShowDropdown(false);
                setSuggestions([]);
              }}
              className="absolute right-24 text-slate-400 hover:text-slate-600 p-1"
            >
              <X className="w-4 h-4" />
            </button>
          )}

          {/* Nút GPS vị trí hiện tại */}
          <button
            type="button"
            onClick={handleGetCurrentLocation}
            disabled={isLocating}
            title="Định vị vị trí hiện tại của tôi"
            className="absolute right-2 px-3 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-600 text-xs font-bold transition-all flex items-center gap-1.5 border border-rose-200 active:scale-95 disabled:opacity-50"
          >
            <Navigation className={`w-3.5 h-3.5 ${isLocating ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">{isLocating ? 'Đang dò...' : 'Vị trí tôi'}</span>
          </button>
        </div>

        {/* Dropdown Gợi ý tìm kiếm */}
        {showDropdown && suggestions.length > 0 && (
          <div className="absolute z-30 left-0 right-0 mt-1.5 bg-white rounded-2xl shadow-xl border border-slate-200 max-h-64 overflow-y-auto divide-y divide-slate-100 animate-in fade-in zoom-in-95 duration-150">
            {suggestions.map((item) => {
              const t = (item.title || '').toLowerCase();
              const isSchool = t.includes('trường') || t.includes('đại học') || t.includes('học viện') || t.includes('tiểu học') || t.includes('thcs') || t.includes('thpt') || t.includes('cao đẳng') || t.includes('mầm non');
              const isShop = t.includes('siêu thị') || t.includes('vincom') || t.includes('big c') || t.includes('mall') || t.includes('mart') || t.includes('chợ') || t.includes('store');
              const isHospital = t.includes('bệnh viện') || t.includes('phòng khám') || t.includes('viện');
              const isBuilding = t.includes('tòa') || t.includes('building') || t.includes('tower') || t.includes('chung cư') || t.includes('khách sạn') || t.includes('hotel');

              return (
                <div
                  key={item.id}
                  onClick={() => handleSelectSuggestion(item)}
                  className="px-4 py-3 hover:bg-rose-50/60 cursor-pointer transition-colors flex items-start gap-3 group"
                >
                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 mt-0.5 transition-colors ${isSchool ? 'bg-emerald-100 text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white' :
                      isShop ? 'bg-purple-100 text-purple-600 group-hover:bg-purple-600 group-hover:text-white' :
                        isHospital ? 'bg-red-100 text-red-600 group-hover:bg-red-600 group-hover:text-white' :
                          isBuilding ? 'bg-blue-100 text-blue-600 group-hover:bg-blue-600 group-hover:text-white' :
                            'bg-rose-100 text-rose-600 group-hover:bg-rose-600 group-hover:text-white'
                    }`}>
                    {isSchool ? <GraduationCap className="w-4 h-4" /> :
                      isShop ? <Store className="w-4 h-4" /> :
                        isHospital ? <Hospital className="w-4 h-4" /> :
                          isBuilding ? <Building2 className="w-4 h-4" /> :
                            <MapPin className="w-4 h-4" />}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="text-xs font-bold text-slate-800 group-hover:text-rose-600 truncate">
                        {item.title}
                      </p>
                      {isSchool && <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 shrink-0">Trường học</span>}
                      {isShop && <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-purple-50 text-purple-700 border border-purple-200 shrink-0">Siêu thị</span>}
                      {isHospital && <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-red-50 text-red-700 border border-red-200 shrink-0">Bệnh viện</span>}
                      {isBuilding && <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200 shrink-0">Tòa nhà</span>}
                    </div>
                    <p className="text-[11px] text-slate-500 truncate mt-0.5">
                      {item.subtitle}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Mapbox Container with Floating Status */}
      <div className="relative rounded-3xl overflow-hidden border border-slate-200 shadow-sm bg-slate-100 cursor-pointer">
        {mapError ? (
          <div className="h-80 flex flex-col items-center justify-center p-6 text-center bg-rose-50/50">
            <AlertCircle className="w-10 h-10 text-rose-500 mb-2" />
            <p className="text-sm font-bold text-slate-800">{mapError}</p>
            <p className="text-xs text-slate-500 mt-1 max-w-md">
              Bạn vẫn có thể tiếp tục bằng cách nhập địa chỉ chi tiết.
            </p>
          </div>
        ) : (
          <div
            ref={mapContainerRef}
            className="w-full h-80 sm:h-96"
            style={{ width: '100%' }}
          />
        )}

        {/* Floating Route Status */}
        <div className="absolute top-3 left-3 flex flex-col gap-2 pointer-events-none">
          <div className="pointer-events-auto bg-white/90 backdrop-blur-md px-3.5 py-2 rounded-2xl shadow-md border border-white/60 flex items-center gap-2.5 text-xs">
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping"></div>
            <span className="font-bold text-slate-800">
              {calculatingRoute ? 'Đang tính toán tuyến đường...' : 'Tuyến đường di chuyển từ Studio'}
            </span>
            <span className="text-[10px] text-rose-600 font-semibold hidden sm:inline">
              | Nhấp chuột vào điểm bất kỳ để đổi vị trí
            </span>
          </div>
        </div>

        {/* Bottom Legend */}
        <div className="absolute bottom-3 left-3 pointer-events-none hidden sm:flex items-center gap-2 bg-slate-900/85 backdrop-blur-md text-white px-3.5 py-1.5 rounded-xl text-[11px] shadow-lg">
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400"></span> Studio (204 Trần Duy Hưng)
          </span>
          <span className="text-slate-400">→</span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span> Điểm đánh dấu của bạn
          </span>
        </div>
      </div>

      {/* Cảnh báo nếu khoảng cách vượt quá 200km */}
      {distanceKm > 200 && (
        <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-start gap-3 animate-in fade-in">
          <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="font-bold text-sm text-amber-950">
              Khoảng cách {distanceKm} km vượt quá bán kính phục vụ (tối đa 200km)
            </p>
            <p className="text-amber-800 leading-relaxed">
              Studio chỉ nhận đơn phục vụ trang điểm tận nơi trong phạm vi tối đa <strong>200 km</strong> tính từ cơ sở 204 Trần Duy Hưng. Quý khách vui lòng chọn địa điểm gần hơn hoặc chuyển sang hình thức <strong>"Tại Studio MNM"</strong> (miễn phí di chuyển).
            </p>
          </div>
        </div>
      )}

      {/* Real-time Calculation Result Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {/* Khoảng cách */}
        <div className="p-3.5 rounded-2xl bg-white border border-slate-200 shadow-2xs flex items-center gap-3">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${distanceKm > 200 ? 'bg-amber-100 text-amber-700' : 'bg-blue-50 text-blue-600'}`}>
            <Route className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] font-semibold text-slate-500">Khoảng Cách Về Studio</p>
            <p className={`text-base font-extrabold ${distanceKm > 200 ? 'text-amber-700' : 'text-slate-900'}`}>
              {distanceKm} <span className="text-xs font-normal text-slate-500">km</span>
            </p>
          </div>
        </div>

        {/* Thời gian di chuyển */}
        <div className="p-3.5 rounded-2xl bg-white border border-slate-200 shadow-2xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
            <Car className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] font-semibold text-slate-500">Thời Gian Đi Lại Dự Kiến</p>
            <p className="text-base font-extrabold text-slate-900">
              ~{durationMins || Math.round(distanceKm * 3.5)} <span className="text-xs font-normal text-slate-500">phút</span>
            </p>
          </div>
        </div>

        {/* Phụ phí di chuyển tự động */}
        {distanceKm > 200 ? (
          <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 shadow-sm flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center shrink-0">
              <AlertCircle className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[11px] font-bold text-rose-600">Trạng Thái Đơn</p>
              <p className="text-sm font-extrabold text-rose-700">
                Không nhận trên 200km
              </p>
            </div>
          </div>
        ) : (
          <div className={`p-3.5 rounded-2xl text-white shadow-md flex items-center gap-3 ${travelFee === 0
              ? 'bg-gradient-to-br from-emerald-500 to-teal-600 shadow-emerald-500/20'
              : 'bg-gradient-to-br from-rose-500 to-pink-600 shadow-rose-500/20'
            }`}>
            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
              <Car className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-[11px] font-medium text-white/80">Phụ Phí Di Chuyển</p>
              <p className="text-base font-extrabold font-sans">
                {travelFee === 0 ? 'Miễn Phí (0 đ)' : formatCurrency(travelFee)}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Ghi chú chính sách */}
      <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-slate-700 flex items-center gap-2.5">
        <Info className="w-4 h-4 text-rose-600 shrink-0" />
        <p className="leading-relaxed">
          <span className="font-semibold text-emerald-700">Miễn phí dưới 10km</span> và <span className="font-semibold text-rose-600">không nhận đơn trang điểm tận nơi vượt quá 200km</span>.
        </p>
      </div>
    </div>
  );
};

export default MapboxLocationPicker;
