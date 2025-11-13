'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function APIStatusPage() {
  const [status, setStatus] = useState({
    backend: 'checking',
    products: 'checking',
    categories: 'checking',
  });

  useEffect(() => {
    checkStatus();
  }, []);

  const checkStatus = async () => {
    // Check backend
    try {
      const response = await fetch('http://localhost:8000/api/products/');
      if (response.ok) {
        const data = await response.json();
        setStatus(prev => ({
          ...prev,
          backend: 'online',
          products: `${data.count || data.length} products available`,
        }));
      } else {
        setStatus(prev => ({ ...prev, backend: 'error', products: 'error' }));
      }
    } catch (error) {
      setStatus(prev => ({ ...prev, backend: 'offline', products: 'offline' }));
    }

    // Check categories
    try {
      const response = await fetch('http://localhost:8000/api/categories/');
      if (response.ok) {
        const data = await response.json();
        setStatus(prev => ({
          ...prev,
          categories: `${data.count || data.length} categories available`,
        }));
      } else {
        setStatus(prev => ({ ...prev, categories: 'error' }));
      }
    } catch (error) {
      setStatus(prev => ({ ...prev, categories: 'offline' }));
    }
  };

  const getStatusColor = (status) => {
    if (status === 'online' || status.includes('available')) return 'text-green-600';
    if (status === 'checking') return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full bg-white rounded-lg shadow-lg p-8">
        <h1 className="text-3xl font-bold mb-6 text-center">API Status Check</h1>
        
        <div className="space-y-4 mb-8">
          <div className="flex justify-between items-center p-4 bg-gray-50 rounded">
            <span className="font-semibold">Backend API:</span>
            <span className={`font-mono ${getStatusColor(status.backend)}`}>
              {status.backend}
            </span>
          </div>

          <div className="flex justify-between items-center p-4 bg-gray-50 rounded">
            <span className="font-semibold">Products Endpoint:</span>
            <span className={`font-mono ${getStatusColor(status.products)}`}>
              {status.products}
            </span>
          </div>

          <div className="flex justify-between items-center p-4 bg-gray-50 rounded">
            <span className="font-semibold">Categories Endpoint:</span>
            <span className={`font-mono ${getStatusColor(status.categories)}`}>
              {status.categories}
            </span>
          </div>
        </div>

        <div className="space-y-4">
          <button
            onClick={checkStatus}
            className="w-full px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition"
          >
            Refresh Status
          </button>

          <Link
            href="/"
            className="block w-full px-6 py-3 text-center border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
          >
            Back to Home
          </Link>
        </div>

        <div className="mt-8 p-4 bg-blue-50 rounded">
          <h3 className="font-semibold mb-2">Troubleshooting:</h3>
          <ul className="text-sm text-gray-700 space-y-1">
            <li>• Make sure Django server is running on port 8000</li>
            <li>• Check that CORS is configured correctly</li>
            <li>• Verify .env.local has NEXT_PUBLIC_API_URL=http://localhost:8000</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

