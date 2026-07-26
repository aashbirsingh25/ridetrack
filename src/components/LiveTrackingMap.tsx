'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
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
}

// Component to dynamically fit map bounds around markers
const FitMapBounds: React.FC<{
  pickup: LatLng;
  drop: LatLng;
  rider: RiderLocation | null;
}> = ({ pickup, drop, rider }) => {
  const map = useMap();

  useEffect(() => {
    const points: [number, number][] = [
      [pickup.lat, pickup.lng],
      [drop.lat, drop.lng],
    ];

    if (rider) {
      points.push([rider.lat, rider.lng]);
    }

    const bounds = L.latLngBounds(points);
    map.fitBounds(bounds, { padding: [50, 50], maxZoom: 15 });
  }, [map, pickup, drop, rider]);

  return null;
};

export const LiveTrackingMap: React.FC<LiveTrackingMapProps> = ({
  orderId,
  pickup,
  drop,
  onRiderLocationUpdate,
}) => {
  const [riderLocation, setRiderLocation] = useState<RiderLocation | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<
    'connecting' | 'connected' | 'disconnected'
  >('connecting');

  // Custom Leaflet Pin Markers using SVG & HTML DivIcons for maximum styling & compatibility
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

    return () => {
      console.log('[Socket.io] Cleaning up socket connection...');
      socket.disconnect();
    };
  }, [orderId, onRiderLocationUpdate]);

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

        {/* Rider Location Marker (starts hidden until location update arrives) */}
        {riderLocation && (
          <Marker
            position={[riderLocation.lat, riderLocation.lng]}
            icon={riderPin}
          >
            <Popup>
              <div className="text-xs p-1">
                <strong className="text-sky-700 block font-semibold mb-0.5">
                  Rider Location 🛵
                </strong>
                <p className="text-slate-600 m-0">
                  Rider ID: {riderLocation.riderId || 'Active Rider'}
                </p>
                <p className="text-[10px] text-slate-400 mt-1 m-0">
                  Updated: {new Date(riderLocation.timestamp || Date.now()).toLocaleTimeString()}
                </p>
              </div>
            </Popup>
          </Marker>
        )}
      </MapContainer>
    </div>
  );
};

export default LiveTrackingMap;
