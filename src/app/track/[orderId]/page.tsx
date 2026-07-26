'use client';

import React, { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import {
  MapPin,
  Clock,
  ArrowLeft,
  Bike,
  CheckCircle2,
  AlertCircle,
  Radio,
  Navigation,
} from 'lucide-react';
import { StatusBadge } from '@/components/StatusBadge';
import { calculateHaversineDistance } from '@/utils/distance';

// Dynamically import Leaflet Map component with SSR disabled
const LiveTrackingMap = dynamic(
  () => import('@/components/LiveTrackingMap'),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-[450px] rounded-2xl bg-slate-100 animate-pulse flex items-center justify-center text-slate-400 text-sm">
        Loading Interactive Live Map...
      </div>
    ),
  },
);

interface OrderDetails {
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
  createdAt?: string;
}

interface RiderLocationState {
  lat: number;
  lng: number;
  riderId?: string;
  timestamp?: string;
}

export default function TrackingPage() {
  const params = useParams();
  const orderId = params?.orderId as string;

  const [order, setOrder] = useState<OrderDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  const [riderLocation, setRiderLocation] = useState<RiderLocationState | null>(null);

  // Fetch Order details on component mount
  useEffect(() => {
    if (!orderId) return;

    const orderServiceUrl =
      process.env.NEXT_PUBLIC_ORDER_SERVICE_URL || 'http://localhost:3000';

    const fetchOrder = async () => {
      try {
        setLoading(true);
        console.log(`[TrackingPage] Fetching order details for ID: ${orderId}`);
        const response = await fetch(`${orderServiceUrl}/orders/${orderId}`);

        if (!response.ok) {
          throw new Error(`Order not found or backend unavailable (HTTP ${response.status})`);
        }

        const data = await response.json();
        setOrder(data);
        setFetchError(null);
      } catch (err: any) {
        console.error('[TrackingPage] Fetch error:', err);
        setFetchError(err.message || 'Failed to load order details');
      } finally {
        setLoading(false);
      }
    };

    fetchOrder();
  }, [orderId]);

  // Compute live distance from rider to drop location
  const distanceToDrop =
    riderLocation && order
      ? calculateHaversineDistance(
          riderLocation.lat,
          riderLocation.lng,
          order.dropLat,
          order.dropLng,
        )
      : null;

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto py-12 text-center">
        <div className="w-10 h-10 border-4 border-sky-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-slate-600 text-sm font-medium">Fetching order status & tracking room...</p>
      </div>
    );
  }

  if (fetchError || !order) {
    return (
      <div className="max-w-xl mx-auto py-12 text-center">
        <div className="p-6 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800">
          <AlertCircle className="w-10 h-10 text-rose-500 mx-auto mb-3" />
          <h2 className="text-lg font-bold">Order Tracking Unavailable</h2>
          <p className="text-xs text-rose-700 mt-1 mb-4">{fetchError}</p>
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-xs font-semibold px-4 py-2 bg-rose-600 text-white rounded-lg hover:bg-rose-700 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" /> Return to Order Form
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto py-6 space-y-6">
      {/* Top Header Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-slate-800 mb-2 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Back to Place Order
          </Link>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-3">
            <span>Order #{orderId.substring(0, 8)}...</span>
            <StatusBadge status={order.status} />
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Customer ID: <code className="font-mono bg-slate-100 px-1.5 py-0.5 rounded">{order.customerId}</code>
            {order.createdAt && (
              <span className="ml-3">
                Placed on: {new Date(order.createdAt).toLocaleTimeString()}
              </span>
            )}
          </p>
        </div>

        {/* Live Status Pill / Distance Line */}
        <div className="bg-white px-4 py-3 rounded-xl border border-slate-200 shadow-sm flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-sky-50 text-sky-600 flex items-center justify-center shrink-0">
            <Radio className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <div className="text-xs text-slate-500 font-medium">Live Distance</div>
            <div className="text-sm font-bold text-slate-900">
              {distanceToDrop !== null ? (
                <span className="text-sky-600">Rider is {distanceToDrop} km away</span>
              ) : riderLocation ? (
                <span>GPS Signal Active</span>
              ) : (
                <span className="text-slate-400 font-normal italic">Waiting for rider signal...</span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Interactive Map */}
      <div className="bg-white rounded-2xl p-4 sm:p-6 border border-slate-200 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <Bike className="w-4 h-4 text-sky-600" /> Live GPS Tracking Map
          </h2>
          <span className="text-[11px] text-slate-400">
            {riderLocation?.timestamp
              ? `Last update: ${new Date(riderLocation.timestamp).toLocaleTimeString()}`
              : 'Socket room connected'}
          </span>
        </div>

        <LiveTrackingMap
          orderId={orderId}
          pickup={{
            lat: order.pickupLat,
            lng: order.pickupLng,
            address: order.pickupAddress,
          }}
          drop={{
            lat: order.dropLat,
            lng: order.dropLng,
            address: order.dropAddress,
          }}
          onRiderLocationUpdate={(loc) => setRiderLocation(loc)}
        />
      </div>

      {/* Address Details Card */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Pickup Card */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-start gap-4">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold shrink-0">
            A
          </div>
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-emerald-600 block">
              Pickup Address
            </span>
            <h3 className="text-sm font-semibold text-slate-900 mt-0.5">
              {order.pickupAddress}
            </h3>
            <p className="text-xs font-mono text-slate-400 mt-1">
              Coordinates: {order.pickupLat}, {order.pickupLng}
            </p>
          </div>
        </div>

        {/* Drop Card */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-start gap-4">
          <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center font-bold shrink-0">
            B
          </div>
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-rose-600 block">
              Drop Destination
            </span>
            <h3 className="text-sm font-semibold text-slate-900 mt-0.5">
              {order.dropAddress}
            </h3>
            <p className="text-xs font-mono text-slate-400 mt-1">
              Coordinates: {order.dropLat}, {order.dropLng}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
