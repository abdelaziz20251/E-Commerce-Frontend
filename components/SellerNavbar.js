'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import useAuthStore from '@/store/useAuthStore';
import { sellersAPI } from '@/services/api';

export default function SellerNavbar() {
  const { user, logout, accessToken } = useAuthStore();
  const [pendingOrdersCount, setPendingOrdersCount] = useState(0);
  const [mounted, setMounted] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Fetch pending orders count
  useEffect(() => {
    // Only fetch if user exists, is a seller, and we have an access token
    if (user && user.role === 'seller' && accessToken) {
      fetchPendingOrders();
    }
  }, [user, accessToken]);

  const fetchPendingOrders = async () => {
    try {
      const response = await sellersAPI.getOrders({ status: 'pending' });
      if (response.data && response.data.results) {
        setPendingOrdersCount(response.data.results.length);
      }
    } catch (error) {
      // Silently handle auth errors - user might be logging in
      if (error.response?.status !== 401) {
        console.error('Failed to fetch pending orders:', error);
      }
    }
  };

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleLogout = async () => {
    await logout();
    window.location.href = '/';
  };

  if (!mounted || !user) {
    return null;
  }

  // Get user initials for avatar
  const getInitials = () => {
    if (user.first_name && user.last_name) {
      return `${user.first_name[0]}${user.last_name[0]}`.toUpperCase();
    }
    if (user.username) {
      return user.username[0].toUpperCase();
    }
    return user.email[0].toUpperCase();
  };

  const getAvatarColor = () => {
    // Generate a consistent color based on username
    const colors = [
      'bg-blue-500',
      'bg-green-500',
      'bg-yellow-500',
      'bg-purple-500',
      'bg-pink-500',
      'bg-indigo-500',
    ];
    const hash = user.username ? user.username.charCodeAt(0) % colors.length : 0;
    return colors[hash];
  };

  return (
    <>
      {/* Desktop Navbar */}
      <nav className="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Left side - Logo & Shop */}
            <div className="flex items-center space-x-8">
              <Link href="/" className="flex items-center space-x-2">
                <svg className="w-8 h-8 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                <span className="text-2xl font-bold text-primary-600">COMMERCE</span>
              </Link>
              <Link
                href="/products"
                className="hidden md:block text-gray-700 hover:text-primary-600 px-3 py-2 rounded-md font-medium transition"
              >
                Shop
              </Link>
            </div>

            {/* Right side - Navigation Items */}
            <div className="hidden lg:flex items-center space-x-6">
              {/* Dashboard */}
              <Link
                href="/seller/dashboard"
                className="text-gray-700 hover:text-primary-600 px-3 py-2 rounded-md font-medium transition"
              >
                Dashboard
              </Link>

              {/* My Products */}
              <Link
                href="/seller/products"
                className="text-gray-700 hover:text-primary-600 px-3 py-2 rounded-md font-medium transition"
              >
                My Products
              </Link>

              {/* Orders with badge */}
              <Link
                href="/seller/orders"
                className="relative text-gray-700 hover:text-primary-600 px-3 py-2 rounded-md font-medium transition"
              >
                Orders
                {pendingOrdersCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-bold">
                    {pendingOrdersCount}
                  </span>
                )}
              </Link>

              {/* My Account with avatar */}
              <div className="flex items-center space-x-3 pl-6 border-l border-gray-200">
                <Link
                  href="/seller/account"
                  className="flex items-center space-x-2 text-gray-700 hover:text-primary-600 transition"
                >
                  <div className={`${getAvatarColor()} text-white rounded-full h-8 w-8 flex items-center justify-center font-semibold text-sm`}>
                    {getInitials()}
                  </div>
                  <span className="font-medium">{user.username || user.email}</span>
                </Link>
                <button
                  onClick={handleLogout}
                  className="text-gray-700 hover:text-red-600 px-3 py-2 rounded-md font-medium transition"
                >
                  Logout
                </button>
              </div>
            </div>

            {/* Mobile menu button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden text-gray-700 hover:text-primary-600 p-2"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {mobileMenuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {mobileMenuOpen && (
          <div className="lg:hidden border-t border-gray-200 bg-white">
            <div className="px-2 pt-2 pb-3 space-y-1">
              <Link
                href="/products"
                className="block text-gray-700 hover:bg-gray-100 px-4 py-2 rounded-md font-medium"
                onClick={() => setMobileMenuOpen(false)}
              >
                Shop
              </Link>
              <Link
                href="/seller/dashboard"
                className="block text-gray-700 hover:bg-gray-100 px-4 py-2 rounded-md font-medium"
                onClick={() => setMobileMenuOpen(false)}
              >
                Dashboard
              </Link>
              <Link
                href="/seller/products"
                className="block text-gray-700 hover:bg-gray-100 px-4 py-2 rounded-md font-medium"
                onClick={() => setMobileMenuOpen(false)}
              >
                My Products
              </Link>
              <Link
                href="/seller/orders"
                className="block text-gray-700 hover:bg-gray-100 px-4 py-2 rounded-md font-medium"
                onClick={() => setMobileMenuOpen(false)}
              >
                <div className="flex items-center justify-between">
                  <span>Orders</span>
                  {pendingOrdersCount > 0 && (
                    <span className="bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-bold">
                      {pendingOrdersCount}
                    </span>
                  )}
                </div>
              </Link>
              <Link
                href="/seller/account"
                className="block text-gray-700 hover:bg-gray-100 px-4 py-2 rounded-md font-medium"
                onClick={() => setMobileMenuOpen(false)}
              >
                <div className="flex items-center space-x-2">
                  <div className={`${getAvatarColor()} text-white rounded-full h-8 w-8 flex items-center justify-center font-semibold text-sm`}>
                    {getInitials()}
                  </div>
                  <span>My Account</span>
                </div>
              </Link>
              <button
                onClick={handleLogout}
                className="block w-full text-left text-red-600 hover:bg-gray-100 px-4 py-2 rounded-md font-medium"
              >
                Logout
              </button>
            </div>
          </div>
        )}
      </nav>

      {/* Mobile Bottom Navigation (Amazon-style) */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50">
        <div className="flex justify-around items-center h-16">
          <Link href="/seller/dashboard" className="flex flex-col items-center justify-center flex-1 text-gray-600 hover:text-primary-600 transition">
            <svg className="w-6 h-6 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
            <span className="text-xs">Dashboard</span>
          </Link>

          <Link href="/seller/products" className="flex flex-col items-center justify-center flex-1 text-gray-600 hover:text-primary-600 transition">
            <svg className="w-6 h-6 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
            <span className="text-xs">Products</span>
          </Link>

          <Link href="/seller/orders" className="flex flex-col items-center justify-center flex-1 text-gray-600 hover:text-primary-600 transition relative">
            <svg className="w-6 h-6 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            <span className="text-xs">Orders</span>
            {pendingOrdersCount > 0 && (
              <span className="absolute top-0 right-4 bg-red-500 text-white text-xs rounded-full h-4 w-4 flex items-center justify-center font-bold">
                {pendingOrdersCount}
              </span>
            )}
          </Link>

          <Link href="/seller/account" className="flex flex-col items-center justify-center flex-1 text-gray-600 hover:text-primary-600 transition">
            <div className={`${getAvatarColor()} text-white rounded-full h-8 w-8 flex items-center justify-center font-semibold text-xs mb-1`}>
              {getInitials()}
            </div>
            <span className="text-xs">Account</span>
          </Link>
        </div>
      </nav>

      {/* Add padding to content when mobile bottom nav is present */}
      <style jsx>{`
        @media (max-width: 1024px) {
          main {
            padding-bottom: 4rem;
          }
        }
      `}</style>
    </>
  );
}

