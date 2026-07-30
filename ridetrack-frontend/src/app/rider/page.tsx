'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Bike, Phone, MapPin, User, ArrowRight, AlertCircle } from 'lucide-react';

export default function RiderRegisterPage() {
  const router = useRouter();

  const [name, setName] = useState('Alex Rider');
  const [phone, setPhone] = useState('+1-555-0199');
  const [currentLat, setCurrentLat] = useState<number>(30.7333);
  const [currentLng, setCurrentLng] = useState<number>(76.7790);

  const [isCheckingSession, setIsCheckingSession] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const riderServiceUrl =
    process.env.NEXT_PUBLIC_RIDER_SERVICE_URL || 'http://localhost:3001';

  // Check if riderId already exists in localStorage on page load and verify it against backend
  useEffect(() => {
    const verifyExistingSession = async () => {
      const existingRiderId = localStorage.getItem('riderId');
      if (!existingRiderId) {
        setIsCheckingSession(false);
        return;
      }

      console.log(`[RiderAuth] Existing riderId found in localStorage: ${existingRiderId}. Verifying with backend...`);
      try {
        const response = await fetch(`${riderServiceUrl}/riders/${existingRiderId}`);
        if (response.ok) {
          console.log(`[RiderAuth] Rider ID ${existingRiderId} is valid. Redirecting to dashboard.`);
          router.push('/rider/dashboard');
          return;
        }

        // Fallback to list lookup if direct GET returns non-OK
        const listRes = await fetch(`${riderServiceUrl}/riders`);
        if (listRes.ok) {
          const list = await listRes.json();
          const found = list.find((r: any) => r.id === existingRiderId || r._id === existingRiderId);
          if (found) {
            console.log(`[RiderAuth] Rider ID ${existingRiderId} verified in riders list. Redirecting to dashboard.`);
            router.push('/rider/dashboard');
            return;
          }
        }

        // If rider is not found on backend, remove stale riderId from localStorage
        console.warn(`[RiderAuth] Rider ID ${existingRiderId} is invalid on backend. Clearing stale session.`);
        localStorage.removeItem('riderId');
        setIsCheckingSession(false);
      } catch (err) {
        console.warn('[RiderAuth] Could not verify existing rider session:', err);
        setIsCheckingSession(false);
      }
    };

    verifyExistingSession();
  }, [router, riderServiceUrl]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMessage(null);

    const payload = {
      name,
      phone,
      currentLat: Number(currentLat),
      currentLng: Number(currentLng),
    };

    try {
      console.log(`[RiderAuth] Registering rider at ${riderServiceUrl}/riders`, payload);
      const response = await fetch(`${riderServiceUrl}/riders`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.message || `Rider registration failed with status ${response.status}`,
        );
      }

      const registeredRider = await response.json();
      const riderId = registeredRider.id || registeredRider._id;

      if (!riderId) {
        throw new Error('Registration succeeded but no rider ID was returned');
      }

      console.log(`[RiderAuth] Registered rider successfully! ID: ${riderId}`);
      // Persist in localStorage
      localStorage.setItem('riderId', riderId);

      // Navigate to Rider Dashboard
      router.push('/rider/dashboard');
    } catch (err: any) {
      console.error('[RiderAuth] Registration error:', err);
      setErrorMessage(
        err.message || 'Could not connect to Rider Service. Make sure backend is running.',
      );
      setIsSubmitting(false);
    }
  };

  if (isCheckingSession) {
    return (
      <div className="max-w-md mx-auto py-16 text-center space-y-3">
        <div className="w-10 h-10 border-4 border-sky-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-slate-700 text-sm font-semibold">Connecting to services...</p>
        <p className="text-slate-500 text-xs">Verifying rider session...</p>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto py-8">
      <div className="text-center mb-6">
        <div className="w-12 h-12 rounded-2xl bg-sky-100 text-sky-600 flex items-center justify-center mx-auto mb-3 shadow-md shadow-sky-500/10">
          <Bike className="w-6 h-6" />
        </div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Rider Registration</h1>
        <p className="text-xs text-slate-500 mt-1">
          Register to go online, accept deliveries, and stream real-time GPS locations.
        </p>
      </div>

      <div className="bg-white rounded-2xl shadow-xl border border-slate-200/80 p-6">
        {errorMessage && (
          <div className="mb-5 p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <div>
              <strong className="font-semibold">Registration Failed</strong>
              <p className="mt-0.5 text-rose-700">{errorMessage}</p>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1 flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-sky-600" /> Full Name
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-slate-900 text-sm focus:ring-2 focus:ring-sky-500 focus:outline-none"
              placeholder="e.g. Alex Rider"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1 flex items-center gap-1.5">
              <Phone className="w-3.5 h-3.5 text-sky-600" /> Phone Number
            </label>
            <input
              type="text"
              required
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-slate-900 text-sm focus:ring-2 focus:ring-sky-500 focus:outline-none"
              placeholder="e.g. +1-555-0199"
            />
          </div>

          <div className="grid grid-cols-2 gap-3 pt-2">
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1 flex items-center gap-1">
                <MapPin className="w-3 h-3 text-emerald-600" /> Initial Lat
              </label>
              <input
                type="number"
                step="any"
                required
                value={currentLat}
                onChange={(e) => setCurrentLat(parseFloat(e.target.value))}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 text-slate-900 text-xs font-mono focus:ring-2 focus:ring-sky-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1 flex items-center gap-1">
                <MapPin className="w-3 h-3 text-emerald-600" /> Initial Lng
              </label>
              <input
                type="number"
                step="any"
                required
                value={currentLng}
                onChange={(e) => setCurrentLng(parseFloat(e.target.value))}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 text-slate-900 text-xs font-mono focus:ring-2 focus:ring-sky-500 focus:outline-none"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full mt-4 py-3 px-4 rounded-xl bg-gradient-to-r from-sky-600 to-blue-600 hover:from-sky-500 hover:to-blue-500 text-white font-semibold text-sm shadow-md shadow-sky-500/20 flex items-center justify-center gap-2 transition-all disabled:opacity-60"
          >
            {isSubmitting ? (
              <>
                <span className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                <span>Connecting to Rider Service... Registering...</span>
              </>
            ) : (
              <>
                <span>Register & Enter Dashboard</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
