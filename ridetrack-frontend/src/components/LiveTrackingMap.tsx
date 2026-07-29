'use client';

import React, { useEffect, useState, useMemo, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import { io, Socket } from 'socket.io-client';

interface LatLng {
  lat: number;
  lng: number;
  address?: string;
}

interface RiderLocation {
  lat: number;
  lng: number;
  riderId?: string;
  timestamp?: string;
}

interface LiveTrackingMapProps {
  orderId: string;
  pickup: LatLng;
  drop: LatLng;
  onRiderLocationUpdate?: (loc: RiderLocation) => void;
  onOrderStatusUpdate?: (status: string) => void;
}

// Component to dynamically fit map bounds around markers without refitting on every GPS tick
const FitMapBounds: React.FC<{
  pickup: LatLng;
  drop: LatLng;
  rider: RiderLocation | null;
}> = ({ pickup, drop, rider }) => {
  const map = useMap();
  const hasFittedRiderRef = useRef(false);

  // Fit bounds for pickup/drop on initial mount or coordinate changes
  useEffect(() => {
    const points: [number, number][] = [
      [pickup.lat, pickup.lng],
      [drop.lat, drop.lng],
    ];
    const bounds = L.latLngBounds(points);
    map.fitBounds(bounds, { padding: [50, 50], maxZoom: 15 });
  }, [map, pickup.lat, pickup.lng, drop.lat, drop.lng]);

  // Fit bounds once when rider location is first received
  useEffect(() => {
    if (rider && !hasFittedRiderRef.current) {
      const points: [number, number][] = [
        [pickup.lat, pickup.lng],
        [drop.lat, drop.lng],
        [rider.lat, rider.lng],
      ];
      const bounds = L.latLngBounds(points);
      map.fitBounds(bounds, { padding: [50, 50], maxZoom: 15 });
      hasFittedRiderRef.current = true;
    }
  }, [map, pickup.lat, pickup.lng, drop.lat, drop.lng, rider]);

  return null;
};

// Dedicated memoized Rider Marker component to smoothly update position without unmounting or DOM recreation
const SmoothRiderMarker: React.FC<{
  location: RiderLocation;
  icon: L.DivIcon;
}> = React.memo(({ location, icon }) => {
  const markerRef = useRef<L.Marker | null>(null);

  // Smooth position update directly on Leaflet Marker instance
  useEffect(() => {
    if (markerRef.current) {
      markerRef.current.setLatLng([location.lat, location.lng]);
    }
  }, [location.lat, location.lng]);

  return (
    <Marker
      ref={markerRef}
      key="rider-live-marker"
      position={[location.lat, location.lng]}
      icon={icon}
    >
      <Popup>
        <div className="text-xs p-1">
          <strong className="text-sky-700 block font-semibold mb-0.5">
            Rider Location 🛵
          </strong>
          <p className="text-slate-600 m-0">
            Rider ID: {location.riderId || 'Active Rider'}
          </p>
          <p className="text-[10px] text-slate-400 mt-1 m-0 font-mono">
            {location.lat.toFixed(5)}, {location.lng.toFixed(5)}
          </p>
        </div>
      </Popup>
    </Marker>
  );
});

SmoothRiderMarker.displayName = 'SmoothRiderMarker';

export const LiveTrackingMap: React.FC<LiveTrackingMapProps> = React.memo(({
  orderId,
  pickup,
  drop,
  onRiderLocationUpdate,
  onOrderStatusUpdate,
}) => {
  const [riderLocation, setRiderLocation] = useState<RiderLocation | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<
    'connecting' | 'connected' | 'disconnected'
  >('connecting');

  // OSRM Road Route State
  const [routePositions, setRoutePositions] = useState<[number, number][]>([
    [pickup.lat, pickup.lng],
    [drop.lat, drop.lng],
  ]);
  const [isFetchingRoute, setIsFetchingRoute] = useState(false);

  // Custom Leaflet Pin Markers using SVG & HTML DivIcons
  const pickupPin = useMemo(
    () =>
      L.divIcon({
        className: 'pickup-marker-icon',
        html: `
          <div class="flex items-center justify-center w-8 h-8 rounded-full bg-emerald-600 text-white font-bold text-xs shadow-lg border-2 border-white transform hover:scale-110 transition-transform">
            A
          </div>
        `,
        iconSize: [32, 32],
        iconAnchor: [16, 16],
      }),
    [],
  );

  const dropPin = useMemo(
    () =>
      L.divIcon({
        className: 'drop-marker-icon',
        html: `
          <div class="flex items-center justify-center w-8 h-8 rounded-full bg-rose-600 text-white font-bold text-xs shadow-lg border-2 border-white transform hover:scale-110 transition-transform">
            B
          </div>
        `,
        iconSize: [32, 32],
        iconAnchor: [16, 16],
      }),
    [],
  );

  const riderPin = useMemo(
    () =>
      L.divIcon({
        className: 'rider-marker-icon',
        html: `
          <div class="relative flex items-center justify-center w-10 h-10 rounded-full bg-sky-600 text-white shadow-xl border-2 border-white rider-marker-ping">
            <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path>
            </svg>
          </div>
        `,
        iconSize: [40, 40],
        iconAnchor: [20, 20],
      }),
    [],
  );

  // Fetch actual road geometry from OSRM Public Routing API
  useEffect(() => {
    let isMounted = true;

    const fetchOSRMRoute = async () => {
      try {
        setIsFetchingRoute(true);
        const url = `https://router.project-osrm.org/route/v1/driving/${pickup.lng},${pickup.lat};${drop.lng},${drop.lat}?overview=full&geometries=geojson`;
        console.log(`[OSRM] Fetching road route: ${url}`);

        let response = await fetch(url).catch(() => null);
        if (!response || !response.ok) {
          const httpUrl = `http://router.project-osrm.org/route/v1/driving/${pickup.lng},${pickup.lat};${drop.lng},${drop.lat}?overview=full&geometries=geojson`;
          response = await fetch(httpUrl);
        }

        if (response && response.ok) {
          const data = await response.json();
          if (data.routes && data.routes[0]?.geometry?.coordinates) {
            // OSRM returns GeoJSON coordinates in [lng, lat] format -> flip to Leaflet [lat, lng]
            const coords: [number, number][] = data.routes[0].geometry.coordinates.map(
              (pt: [number, number]) => [pt[1], pt[0]],
            );
            if (isMounted && coords.length > 0) {
              console.log(`[OSRM] Successfully parsed ${coords.length} road coordinates`);
              setRoutePositions(coords);
              return;
            }
          }
        }
        throw new Error('Invalid geometry payload received from OSRM');
      } catch (err) {
        console.warn('[OSRM] Route request failed. Falling back to straight polyline:', err);
        if (isMounted) {
          setRoutePositions([
            [pickup.lat, pickup.lng],
            [drop.lat, drop.lng],
          ]);
        }
      } finally {
        if (isMounted) setIsFetchingRoute(false);
      }
    };

    fetchOSRMRoute();
    return () => {
      isMounted = false;
    };
  }, [pickup.lat, pickup.lng, drop.lat, drop.lng]);

  // Setup Socket.io connection to Tracking Service
  useEffect(() => {
    const trackingUrl =
      process.env.NEXT_PUBLIC_TRACKING_SERVICE_URL || 'http://localhost:3002';

    console.log(`[Socket.io] Connecting to tracking service at ${trackingUrl}...`);
    const socket: Socket = io(trackingUrl, {
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 5,
    });

    socket.on('connect', () => {
      console.log(`[Socket.io] Connected successfully. Socket ID: ${socket.id}`);
      setConnectionStatus('connected');

      // Join order room
      socket.emit('track:join', { orderId });
    });

    socket.on('disconnect', () => {
      console.log('[Socket.io] Disconnected from tracking service');
      setConnectionStatus('disconnected');
    });

    // Handle initial location on join
    socket.on('location:current', (data: any) => {
      console.log('[Socket.io] Received location:current', data);
      if (data && typeof data.lat === 'number' && typeof data.lng === 'number') {
        const loc: RiderLocation = {
          lat: data.lat,
          lng: data.lng,
          riderId: data.riderId,
          timestamp: data.timestamp,
        };
        setRiderLocation(loc);
        if (onRiderLocationUpdate) onRiderLocationUpdate(loc);
      }
    });

    // Handle live real-time location updates
    socket.on('location:update', (data: any) => {
      console.log('[Socket.io] Received live location:update', data);
      if (data && typeof data.lat === 'number' && typeof data.lng === 'number') {
        const loc: RiderLocation = {
          lat: data.lat,
          lng: data.lng,
          riderId: data.riderId,
          timestamp: data.timestamp,
        };
        setRiderLocation(loc);
        if (onRiderLocationUpdate) onRiderLocationUpdate(loc);
      }
    });

    // Handle live real-time order status updates
    socket.on('status:update', (data: any) => {
      console.log('[Socket.io] Received live status:update', data);
      if (data && data.status && onOrderStatusUpdate) {
        onOrderStatusUpdate(data.status);
      }
    });

    return () => {
      console.log('[Socket.io] Cleaning up socket connection...');
      socket.disconnect();
    };
  }, [orderId, onRiderLocationUpdate, onOrderStatusUpdate]);

  const midpoint: [number, number] = [
    (pickup.lat + drop.lat) / 2,
    (pickup.lng + drop.lng) / 2,
  ];

  return (
    <div className="relative w-full h-[450px] rounded-2xl overflow-hidden border border-slate-200 shadow-inner bg-slate-100">
      {/* Connection status overlay badge */}
      <div className="absolute top-4 right-4 z-20 bg-white/90 backdrop-blur-md px-3 py-1.5 rounded-full border border-slate-200/80 shadow-md text-xs flex items-center gap-2">
        <span
          className={`w-2.5 h-2.5 rounded-full ${
            connectionStatus === 'connected'
              ? 'bg-emerald-500 animate-pulse'
              : connectionStatus === 'connecting'
              ? 'bg-amber-500 animate-ping'
              : 'bg-rose-500'
          }`}
        />
        <span className="font-semibold text-slate-700 capitalize">
          {connectionStatus === 'connected' ? 'Live GPS Stream' : connectionStatus}
        </span>
      </div>

      {/* OSRM Route Loading Indicator Overlay */}
      {isFetchingRoute && (
        <div className="absolute bottom-4 left-4 z-20 bg-white/95 backdrop-blur-md px-3 py-1.5 rounded-full border border-slate-200 shadow-md text-xs flex items-center gap-2 text-sky-700 font-medium animate-pulse">
          <span className="w-3.5 h-3.5 rounded-full border-2 border-sky-600 border-t-transparent animate-spin" />
          <span>Fetching road route from OSRM...</span>
        </div>
      )}

      <MapContainer
        center={midpoint}
        zoom={13}
        scrollWheelZoom={true}
        className="w-full h-full"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {/* Auto fit map bounds */}
        <FitMapBounds pickup={pickup} drop={drop} rider={riderLocation} />

        {/* OSRM Road Route Line (Pickup A to Drop B) */}
        <Polyline
          positions={routePositions}
          pathOptions={{
            color: '#38bdf8', // sky-400
            weight: 4,
            opacity: 0.8,
            dashArray: '8, 8',
          }}
        />

        {/* Pickup Location Marker */}
        <Marker position={[pickup.lat, pickup.lng]} icon={pickupPin}>
          <Popup>
            <div className="text-xs p-1">
              <strong className="text-emerald-700 block font-semibold mb-0.5">
                Pickup Location (A)
              </strong>
              <p className="text-slate-600 m-0">{pickup.address}</p>
            </div>
          </Popup>
        </Marker>

        {/* Drop Location Marker */}
        <Marker position={[drop.lat, drop.lng]} icon={dropPin}>
          <Popup>
            <div className="text-xs p-1">
              <strong className="text-rose-700 block font-semibold mb-0.5">
                Drop Destination (B)
              </strong>
              <p className="text-slate-600 m-0">{drop.address}</p>
            </div>
          </Popup>
        </Marker>

        {/* Smooth Rider Location Marker */}
        {riderLocation && (
          <SmoothRiderMarker location={riderLocation} icon={riderPin} />
        )}
      </MapContainer>
    </div>
  );
});

LiveTrackingMap.displayName = 'LiveTrackingMap';

export default LiveTrackingMap;
