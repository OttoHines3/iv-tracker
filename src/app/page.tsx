// src/app/page.tsx
'use client';

import { useState, useEffect } from 'react';

interface AtmIvResponse {
  timestamp: string;
  expiration: string;
  underlying: number;
  strike: number;
  optionSymbol: string;
  impliedVol: number | null;
}

export default function Home() {
  const [data, setData] = useState<AtmIvResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let timer: NodeJS.Timer;

    async function fetchIv() {
      try {
        const res = await fetch('/api/atm-iv');
        if (!res.ok) throw new Error(await res.text());
        const json: AtmIvResponse = await res.json();
        setData(json);
        setError(null);
      } catch (e: any) {
        setError(e.message);
      }
    }

    fetchIv();
    // Poll every 60 seconds:
    timer = setInterval(fetchIv, 60_000);
    return () => clearInterval(timer);
  }, []);

  return (
    <main className="flex flex-col items-center justify-center min-h-screen p-4">
      <h1 className="text-2xl font-bold mb-4">SPX ATM Implied Volatility</h1>

      {error && (
        <p className="text-red-500 mb-4">Error: {error}</p>
      )}

      {!data && !error && (
        <p className="text-gray-500">Loading…</p>
      )}

      {data && (
        <div className="bg-white shadow rounded-lg p-6 w-full max-w-md text-black">
          <p>
            <strong>As of:</strong> {new Date(data.timestamp).toLocaleTimeString()}
          </p>
          <p>
            <strong>Expiration:</strong> {data.expiration}
          </p>
          <p>
            <strong>Underlying (SPX):</strong> {data.underlying.toFixed(2)}
          </p>
          <p>
            <strong>Strike:</strong> {data.strike}
          </p>
          <p>
            <strong>Option:</strong> {data.optionSymbol}
          </p>
          <p className="mt-4 text-xl">
            <span className="font-semibold">IV:</span>{' '}
            {data.impliedVol !== null
              ? `${(data.impliedVol * 100).toFixed(2)}%`
              : 'N/A'}
          </p>
        </div>
      )}
    </main>
  );
}