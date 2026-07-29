'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  Bike,
  Power,
  Search,
  MapPin,
  Radio,
  Play,
  Square,
  CheckCircle2,
  PackageCheck,
  LogOut,
  AlertCircle,
  Clock,
  User,
  Phone,
} from 'lucide-react';
import { io, Socket } from 'socket.io-client';
import { StatusBadge } from '@/components/StatusBadge';

interface RiderInfo {
  id: string;
  name: string;
  phone: string;
  currentLat: number;
  currentLng: number;
  isAvailable: boolean;
}

interface OrderInfo {
  _id?: string;
  id?: string;
  customerId: string;
  pickupAddress: string;
  pickupLat: number;
  pickupLng: number;
  dropAddress: string;
  dropLat: number;
  dropLng: number;
  status: string;
  riderId?: string | null;
}

export default function RiderDashboardPage() {
  const router = useRouter();

  const [riderId, setRiderId] = useState<string | null>(null);
  const [rider, setRider] = useState<RiderInfo | null>(null);
  const [loadingRider, setLoadingRider] = useState(true);
  const [riderError, setRiderError] = useState<string | null>(null);

  // Order Lookup State
  const [lookupOrderId, setLookupOrderId] = useState('');
  const [activeOrder, setActiveOrder] = useState<OrderInfo | null>(null);
  const [loadingOrder, setLoadingOrder] = useState(false);
  const [orderError, setOrderError] = useState<string | null>(null);

  // GPS Streaming State
  const [isStreaming, setIsStreaming] = useState(false);
  const [currentCoords, setCurrentCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [lastStreamTime, setLastStreamTime] = useState<string | null>(null);

  // Socket & Interval Refs
  const socketRef = useRef<Socket | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const currentCoordsRef = useRef<{ lat: number; lng: number }>({ lat: 30.7333, lng: 76.7790 });

  const riderServiceUrl =
    process.env.NEXT_PUBLIC_RIDER_SERVICE_URL || 'http://localhost:3001';
  const orderServiceUrl =
    process.env.NEXT_PUBLIC_ORDER_SERVICE_URL || 'http://localhost:3000';
  const trackingServiceUrl =
    process.env.NEXT_PUBLIC_TRACKING_SERVICE_URL || 'http://localhost:3002';

  // Helper to fetch order details and persist activeOrderId and lastOrderId
  const fetchOrderDetails = useCallback(async (idToFetch: string) => {
    setLoadingOrder(true);
    setOrderError(null);

    try {
      console.log(`[RiderDashboard] Fetching order details for ID: ${idToFetch}`);
      const response = await fetch(`${orderServiceUrl}/orders/${idToFetch}`);

      if (!response.ok) {
        throw new Error(`Order not found or backend unavailable (HTTP ${response.status})`);
      }

      const orderData: OrderInfo = await response.json();
      setActiveOrder(orderData);
      const validId = orderData._id || orderData.id || idToFetch;
      localStorage.setItem('activeOrderId', validId);
      localStorage.setItem('lastOrderId', validId);
    } catch (err: any) {
      console.error('[RiderDashboard] Lookup error:', err);
      setOrderError(err.message || 'Failed to fetch order details');
      setActiveOrder(null);
    } finally {
      setLoadingOrder(false);
    }
  }, [orderServiceUrl]);

  // 4. Start sending live GPS location
  const handleStartStreaming = (explicitOrderId?: string | React.MouseEvent) => {
    const orderIdToStream =
      (typeof explicitOrderId === 'string' ? explicitOrderId : null) ||
      activeOrder?._id ||
      activeOrder?.id ||
      lookupOrderId ||
      localStorage.getItem('activeOrderId') ||
      localStorage.getItem('lastOrderId');

    if (!orderIdToStream) {
      alert('Please enter an order ID to stream location updates for.');
      return;
    }

    // CRITICAL FIX: Ensure only one interval runs at a time
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    if (!socketRef.current) {
      console.log(`[RiderDashboard] Connecting Socket.io to ${trackingServiceUrl}`);
      socketRef.current = io(trackingServiceUrl, {
        transports: ['websocket', 'polling'],
      });

      socketRef.current.on('connect', () => {
        console.log(`[RiderDashboard] Socket.io connected. ID: ${socketRef.current?.id}`);
      });
    }

    setIsStreaming(true);
    localStorage.setItem('isSendingLocation', 'true');

    // Run interval every 3 seconds
    intervalRef.current = setInterval(() => {
      if ('geolocation' in navigator) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            const lat = position.coords.latitude;
            const lng = position.coords.longitude;
            emitLocation(lat, lng, orderIdToStream);
          },
          (error) => {
            console.warn('[Geolocation] Browser GPS unavailable or denied. Using simulated delta step.', error.message);
            simulateNextDelta(orderIdToStream);
          },
          { enableHighAccuracy: true, timeout: 2500 },
        );
      } else {
        simulateNextDelta(orderIdToStream);
      }
    }, 3000);
  };

  // Helper to simulate tiny position delta for demo/indoor environments
  const simulateNextDelta = (targetOrderId: string) => {
    const prev = currentCoordsRef.current;
    // Tiny delta (~0.0004 deg ≈ 40 meters)
    const nextLat = prev.lat + (Math.random() - 0.5) * 0.0008;
    const nextLng = prev.lng + (Math.random() - 0.5) * 0.0008;
    emitLocation(nextLat, nextLng, targetOrderId);
  };

  // Emit location payload to Tracking Service WebSocket
  const emitLocation = (lat: number, lng: number, targetOrderId: string) => {
    if (!riderId) return;

    currentCoordsRef.current = { lat, lng };
    setCurrentCoords({ lat, lng });
    const timestamp = new Date().toLocaleTimeString();
    setLastStreamTime(timestamp);

    const payload = {
      riderId,
      orderId: targetOrderId,
      lat: Number(lat.toFixed(6)),
      lng: Number(lng.toFixed(6)),
    };

    console.log('[RiderDashboard] Emitting location:update', payload);
    if (socketRef.current) {
      socketRef.current.emit('location:update', payload);
    }
  };

  // 5. Stop sending location
  const handleStopStreaming = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setIsStreaming(false);
    localStorage.setItem('isSendingLocation', 'false');
  };

  // Sync rider details and stored active order from localStorage on mount & popstate
  const syncRiderAndOrderState = useCallback(async () => {
    const storedRiderId = localStorage.getItem('riderId');
    if (!storedRiderId) {
      console.warn('[RiderDashboard] No riderId in localStorage. Redirecting to /rider.');
      router.push('/rider');
      return;
    }

    setRiderId(storedRiderId);

    // Re-check localStorage for active order
    const storedActiveOrderId = localStorage.getItem('activeOrderId') || localStorage.getItem('lastOrderId');
    if (storedActiveOrderId) {
      setLookupOrderId(storedActiveOrderId);
      fetchOrderDetails(storedActiveOrderId);
    }

    // Re-check stored isSendingLocation state and auto-resume if active
    const isSendingLocation = localStorage.getItem('isSendingLocation') === 'true';
    if (isSendingLocation && storedActiveOrderId && !intervalRef.current) {
      console.log(`[RiderDashboard] Auto-resuming GPS streaming for order ${storedActiveOrderId}...`);
      handleStartStreaming(storedActiveOrderId);
    }

    // Fetch rider profile details
    try {
      setLoadingRider(true);
      console.log(`[RiderDashboard] Fetching rider details for ID: ${storedRiderId}`);
      const response = await fetch(`${riderServiceUrl}/riders/${storedRiderId}`);

      if (!response.ok) {
        // Fallback to list lookup if direct GET fails
        const listRes = await fetch(`${riderServiceUrl}/riders`);
        if (listRes.ok) {
          const list: RiderInfo[] = await listRes.json();
          const found = list.find((r) => r.id === storedRiderId || (r as any)._id === storedRiderId);
          if (found) {
            setRider(found);
            currentCoordsRef.current = { lat: found.currentLat, lng: found.currentLng };
            setCurrentCoords({ lat: found.currentLat, lng: found.currentLng });
            setRiderError(null);
            return;
          }
        }
        throw new Error(`Rider not found on Rider Service (HTTP ${response.status})`);
      }

      const data: RiderInfo = await response.json();
      setRider(data);
      currentCoordsRef.current = { lat: data.currentLat, lng: data.currentLng };
      setCurrentCoords({ lat: data.currentLat, lng: data.currentLng });
      setRiderError(null);
    } catch (err: any) {
      console.error('[RiderDashboard] Error fetching rider:', err);
      setRiderError(err.message || 'Failed to load rider details.');
    } finally {
      setLoadingRider(false);
    }
  }, [router, riderServiceUrl, fetchOrderDetails]);

  // 1. Initial load & browser back/forward navigation (popstate) listener
  useEffect(() => {
    syncRiderAndOrderState();

    const handleNavEvent = () => {
      console.log('[RiderDashboard] Navigation event (popstate/focus) detected. Resyncing state...');
      syncRiderAndOrderState();
    };

    window.addEventListener('popstate', handleNavEvent);
    window.addEventListener('focus', handleNavEvent);

    return () => {
      window.removeEventListener('popstate', handleNavEvent);
      window.removeEventListener('focus', handleNavEvent);
    };
  }, [syncRiderAndOrderState]);

  // Clean up socket & interval on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (socketRef.current) socketRef.current.disconnect();
    };
  }, []);

  // 2. Toggle Availability
  const handleToggleAvailability = async () => {
    if (!rider || !riderId) return;

    const updatedAvailability = !rider.isAvailable;
    try {
      const response = await fetch(`${riderServiceUrl}/riders/${riderId}/availability`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isAvailable: updatedAvailability }),
      });

      if (!response.ok) throw new Error('Failed to update availability');

      const updatedRider = await response.json();
      setRider((prev) => (prev ? { ...prev, isAvailable: updatedRider.isAvailable } : null));
      localStorage.setItem('riderAvailability', String(updatedRider.isAvailable));
    } catch (err: any) {
      alert(`Error updating availability: ${err.message}`);
    }
  };

  // 3. Look up assigned order by orderId
  const handleLookupOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!lookupOrderId.trim()) return;
    await fetchOrderDetails(lookupOrderId.trim());
  };

  // 6. Update order status (picked_up / delivered)
  const handleUpdateOrderStatus = async (newStatus: 'picked_up' | 'delivered') => {
    const targetOrderId = activeOrder?._id || activeOrder?.id || lookupOrderId;
    if (!targetOrderId || !riderId) return;

    try {
      console.log(`[RiderDashboard] Updating order status to ${newStatus} for order ${targetOrderId}`);
      const response = await fetch(`${orderServiceUrl}/orders/${targetOrderId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: newStatus,
          riderId,
        }),
      });

      if (!response.ok) throw new Error(`Status update failed (HTTP ${response.status})`);

      const updatedOrder = await response.json();
      setActiveOrder(updatedOrder);

      // Connect socket if not already connected and emit status:update event
      if (!socketRef.current) {
        console.log(`[RiderDashboard] Connecting Socket.io to ${trackingServiceUrl} for status update`);
        socketRef.current = io(trackingServiceUrl, {
          transports: ['websocket', 'polling'],
        });
      }

      console.log(`[RiderDashboard] Emitting status:update -> orderId: ${targetOrderId}, status: ${newStatus}`);
      socketRef.current.emit('status:update', {
        orderId: targetOrderId,
        status: newStatus,
      });

      if (newStatus === 'delivered') {
        localStorage.removeItem('activeOrderId');
        localStorage.removeItem('isSendingLocation');
        handleStopStreaming();
      }
    } catch (err: any) {
      alert(`Could not update order status: ${err.message}`);
    }
  };

  // 7. Logout / Reset Rider Identity
  const handleLogout = () => {
    handleStopStreaming();
    if (socketRef.current) socketRef.current.disconnect();
    localStorage.removeItem('riderId');
    localStorage.removeItem('activeOrderId');
    localStorage.removeItem('isSendingLocation');
    localStorage.removeItem('riderAvailability');
    router.push('/rider');
  };

  if (loadingRider) {
    return (
      <div className="max-w-4xl mx-auto py-12 text-center">
        <div className="w-10 h-10 border-4 border-sky-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-slate-600 text-sm font-medium">Loading Rider Profile...</p>
      </div>
    );
  }

  if (riderError || !rider) {
    return (
      <div className="max-w-md mx-auto py-12 text-center">
        <div className="p-6 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800">
          <AlertCircle className="w-10 h-10 text-rose-500 mx-auto mb-3" />
          <h2 className="text-lg font-bold">Rider Account Issue</h2>
          <p className="text-xs text-rose-700 mt-1 mb-4">{riderError}</p>
          <button
            onClick={handleLogout}
            className="inline-flex items-center gap-2 text-xs font-semibold px-4 py-2 bg-rose-600 text-white rounded-lg hover:bg-rose-700 transition-colors"
          >
            <LogOut className="w-4 h-4" /> Register New Rider
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto py-6 space-y-6">
      {/* Top Header Card */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-sky-100 text-sky-600 flex items-center justify-center font-bold text-lg shrink-0">
            <Bike className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-slate-900">{rider.name}</h1>
              <span
                className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${
                  rider.isAvailable
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                    : 'bg-slate-100 text-slate-600 border-slate-200'
                }`}
              >
                <span
                  className={`w-2 h-2 rounded-full ${
                    rider.isAvailable ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'
                  }`}
                />
                {rider.isAvailable ? 'ONLINE & AVAILABLE' : 'OFFLINE'}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-3">
              <span>Phone: {rider.phone}</span>
              <span>ID: <code className="font-mono text-slate-700 bg-slate-100 px-1 py-0.5 rounded">{rider.id}</code></span>
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-3">
          <button
            onClick={handleToggleAvailability}
            className={`px-4 py-2 rounded-xl font-semibold text-xs transition-all flex items-center gap-2 border ${
              rider.isAvailable
                ? 'bg-emerald-600 hover:bg-emerald-700 text-white border-emerald-600'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-300'
            }`}
          >
            <Power className="w-4 h-4" />
            <span>{rider.isAvailable ? 'Set Unavailable' : 'Set Available'}</span>
          </button>

          <button
            onClick={handleLogout}
            title="Clear stored rider identity"
            className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors border border-slate-200"
          >
            <LogOut className="w-4.5 h-4.5" />
          </button>
        </div>
      </div>

      {/* Main Grid: Order Lookup & Location Broadcast */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Card 1: Order Lookup */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center gap-2 text-slate-900 font-bold text-sm">
            <Search className="w-4 h-4 text-sky-600" />
            <span>Assigned Order Lookup</span>
          </div>
          <p className="text-xs text-slate-500">
            Enter an Order ID to fetch details and accept dispatch tasks.
          </p>

          <form onSubmit={handleLookupOrder} className="flex gap-2">
            <input
              type="text"
              required
              value={lookupOrderId}
              onChange={(e) => setLookupOrderId(e.target.value)}
              placeholder="Paste MongoDB Order ID"
              className="flex-1 px-3.5 py-2 rounded-xl border border-slate-300 text-xs font-mono focus:ring-2 focus:ring-sky-500 focus:outline-none"
            />
            <button
              type="submit"
              disabled={loadingOrder}
              className="px-4 py-2 bg-sky-600 hover:bg-sky-500 text-white font-semibold text-xs rounded-xl transition-colors disabled:opacity-60 shrink-0"
            >
              {loadingOrder ? 'Loading...' : 'Fetch'}
            </button>
          </form>

          {orderError && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{orderError}</span>
            </div>
          )}

          {activeOrder && (
            <div className="mt-4 p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-800">
                  Order Details
                </span>
                <StatusBadge status={activeOrder.status} />
              </div>

              <div className="space-y-2 text-xs">
                <div className="flex items-start gap-2">
                  <div className="w-4 h-4 rounded-full bg-emerald-100 text-emerald-700 font-bold flex items-center justify-center text-[10px] shrink-0 mt-0.5">
                    A
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">PICKUP</span>
                    <span className="font-semibold text-slate-800">{activeOrder.pickupAddress}</span>
                  </div>
                </div>

                <div className="flex items-start gap-2">
                  <div className="w-4 h-4 rounded-full bg-rose-100 text-rose-700 font-bold flex items-center justify-center text-[10px] shrink-0 mt-0.5">
                    B
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">DROP</span>
                    <span className="font-semibold text-slate-800">{activeOrder.dropAddress}</span>
                  </div>
                </div>
              </div>

              {/* Order Action Buttons */}
              <div className="pt-2 grid grid-cols-2 gap-2">
                <button
                  onClick={() => handleUpdateOrderStatus('picked_up')}
                  className="py-2 px-3 rounded-lg bg-amber-500 hover:bg-amber-600 text-white font-semibold text-xs flex items-center justify-center gap-1.5 transition-colors"
                >
                  <PackageCheck className="w-3.5 h-3.5" />
                  <span>Mark Picked Up</span>
                </button>

                <button
                  onClick={() => handleUpdateOrderStatus('delivered')}
                  className="py-2 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs flex items-center justify-center gap-1.5 transition-colors"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Mark Delivered</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Card 2: Live Location Broadcast Controller */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-slate-900 font-bold text-sm">
              <Radio className="w-4 h-4 text-sky-600" />
              <span>Live GPS Broadcast</span>
            </div>
            {isStreaming && (
              <span className="px-2.5 py-1 rounded-full bg-sky-50 text-sky-700 border border-sky-200 text-[10px] font-bold flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-sky-500 animate-ping" />
                STREAMING EVERY 3S
              </span>
            )}
          </div>

          <p className="text-xs text-slate-500">
            Stream real-time location coordinates to Redis & WebSockets for live customer map tracking.
          </p>

          <div className="p-4 rounded-xl bg-slate-900 text-white space-y-2">
            <div className="flex items-center justify-between text-xs text-slate-400 font-mono">
              <span>ACTIVE TARGET ORDER:</span>
              <span className="text-sky-400 font-bold">
                {(activeOrder?._id || activeOrder?.id || lookupOrderId || 'None').substring(0, 14)}
              </span>
            </div>

            <div className="flex items-center justify-between text-xs font-mono border-t border-slate-800 pt-2">
              <span>CURRENT GPS COORDS:</span>
              <span className="text-emerald-400">
                {currentCoords
                  ? `${currentCoords.lat.toFixed(5)}, ${currentCoords.lng.toFixed(5)}`
                  : 'Waiting...'}
              </span>
            </div>

            {lastStreamTime && (
              <div className="text-[10px] text-slate-400 font-mono text-right">
                Last emitted: {lastStreamTime}
              </div>
            )}
          </div>

          {/* Controls */}
          {!isStreaming ? (
            <button
              onClick={handleStartStreaming}
              className="w-full py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm shadow-md shadow-emerald-500/20 flex items-center justify-center gap-2 transition-all"
            >
              <Play className="w-4 h-4 fill-current" />
              <span>Start Sending Location</span>
            </button>
          ) : (
            <button
              onClick={handleStopStreaming}
              className="w-full py-3 px-4 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-semibold text-sm shadow-md shadow-rose-500/20 flex items-center justify-center gap-2 transition-all"
            >
              <Square className="w-4 h-4 fill-current" />
              <span>Stop Sending Location</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
