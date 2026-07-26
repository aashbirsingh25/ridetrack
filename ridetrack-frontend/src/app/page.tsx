'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { MapPin, User, Navigation, Send, AlertCircle, Sparkles } from 'lucide-react';

export default function HomePage() {
  const router = useRouter();

  // Form State initialized with realistic defaults
  const [customerId, setCustomerId] = useState('');
  const [pickupAddress, setPickupAddress] = useState('Central Park South, New York, NY');
  const [pickupLat, setPickupLat] = useState<number>(40.7648);
  const [pickupLng, setPickupLng] = useState<number>(-73.9747);

  const [dropAddress, setDropAddress] = useState('Times Square, New York, NY');
  const [dropLat, setDropLat] = useState<number>(40.7580);
  const [dropLng, setDropLng] = useState<number>(-73.9855);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Generate random customerId on client mount
  useEffect(() => {
    const randomCustId = `cust_${Math.random().toString(36).substring(2, 9)}`;
    setCustomerId(randomCustId);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMessage(null);

    const orderServiceUrl =
      process.env.NEXT_PUBLIC_ORDER_SERVICE_URL || 'http://localhost:3000';

    const payload = {
      customerId,
      pickupAddress,
      pickupLat: Number(pickupLat),
      pickupLng: Number(pickupLng),
      dropAddress,
      dropLat: Number(dropLat),
      dropLng: Number(dropLng),
    };

    try {
      console.log(`[OrderPlacement] Posting to ${orderServiceUrl}/orders`, payload);
      const response = await fetch(`${orderServiceUrl}/orders`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.message || `Order creation failed with status ${response.status}`,
        );
      }

      const createdOrder = await response.json();
      const orderId = createdOrder._id || createdOrder.id;

      if (!orderId) {
        throw new Error('Order was created but no order ID was returned');
      }

      console.log(`[OrderPlacement] Order created successfully! ID: ${orderId}`);
      router.push(`/track/${orderId}`);
    } catch (err: any) {
      console.error('[OrderPlacement] Error:', err);
      setErrorMessage(
        err.message || 'Could not connect to Order Service. Make sure backend is running.',
      );
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto py-6">
      {/* Hero Heading */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-sky-100 text-sky-800 text-xs font-semibold mb-3">
          <Sparkles className="w-3.5 h-3.5" /> Instant Delivery Dispatch
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
          Place a Delivery Order
        </h1>
        <p className="mt-2 text-slate-600 text-sm max-w-lg mx-auto">
          Enter pickup & drop coordinates to initiate an order and track the assigned rider in real time.
        </p>
      </div>

      {/* Main Order Form Card */}
      <div className="bg-white rounded-2xl shadow-xl border border-slate-200/80 p-6 sm:p-8">
        {errorMessage && (
          <div className="mb-6 p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-sm flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
            <div>
              <strong className="font-semibold">Submission Failed</strong>
              <p className="mt-0.5 text-xs text-rose-700">{errorMessage}</p>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Customer ID Field */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <User className="w-4 h-4 text-sky-600" /> Customer ID
            </label>
            <input
              type="text"
              required
              value={customerId}
              onChange={(e) => setCustomerId(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500 text-sm transition-all"
              placeholder="e.g. cust_98234"
            />
          </div>

          <hr className="border-slate-100" />

          {/* Pickup Address & Coordinates Section */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-emerald-700 font-semibold text-sm">
              <div className="w-6 h-6 rounded-full bg-emerald-100 flex items-center justify-center text-xs">
                A
              </div>
              <span>Pickup Details</span>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">
                Pickup Address
              </label>
              <input
                type="text"
                required
                value={pickupAddress}
                onChange={(e) => setPickupAddress(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
                placeholder="Street address or location name"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">
                  Pickup Latitude
                </label>
                <input
                  type="number"
                  step="any"
                  required
                  value={pickupLat}
                  onChange={(e) => setPickupLat(parseFloat(e.target.value))}
                  className="w-full px-3.5 py-2 rounded-lg border border-slate-300 text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-xs font-mono"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">
                  Pickup Longitude
                </label>
                <input
                  type="number"
                  step="any"
                  required
                  value={pickupLng}
                  onChange={(e) => setPickupLng(parseFloat(e.target.value))}
                  className="w-full px-3.5 py-2 rounded-lg border border-slate-300 text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-xs font-mono"
                />
              </div>
            </div>
          </div>

          <hr className="border-slate-100" />

          {/* Drop Address & Coordinates Section */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-rose-700 font-semibold text-sm">
              <div className="w-6 h-6 rounded-full bg-rose-100 flex items-center justify-center text-xs">
                B
              </div>
              <span>Drop-Off Destination</span>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">
                Drop Address
              </label>
              <input
                type="text"
                required
                value={dropAddress}
                onChange={(e) => setDropAddress(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-slate-900 focus:outline-none focus:ring-2 focus:ring-rose-500 text-sm"
                placeholder="Destination address"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">
                  Drop Latitude
                </label>
                <input
                  type="number"
                  step="any"
                  required
                  value={dropLat}
                  onChange={(e) => setDropLat(parseFloat(e.target.value))}
                  className="w-full px-3.5 py-2 rounded-lg border border-slate-300 text-slate-900 focus:outline-none focus:ring-2 focus:ring-rose-500 text-xs font-mono"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">
                  Drop Longitude
                </label>
                <input
                  type="number"
                  step="any"
                  required
                  value={dropLng}
                  onChange={(e) => setDropLng(parseFloat(e.target.value))}
                  className="w-full px-3.5 py-2 rounded-lg border border-slate-300 text-slate-900 focus:outline-none focus:ring-2 focus:ring-rose-500 text-xs font-mono"
                />
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3.5 px-6 rounded-xl bg-gradient-to-r from-sky-600 to-blue-600 hover:from-sky-500 hover:to-blue-500 text-white font-semibold text-sm shadow-lg shadow-sky-500/25 transition-all flex items-center justify-center gap-2 disabled:opacity-60"
          >
            {isSubmitting ? (
              <>
                <span className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                <span>Creating Order...</span>
              </>
            ) : (
              <>
                <Send className="w-4 h-4" />
                <span>Place Order & Track Live</span>
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
