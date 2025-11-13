'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import useAuthStore from '@/store/useAuthStore';
import useCartStore from '@/store/useCartStore';

export default function Navbar() {
  const { user, logout, isHydrated } = useAuthStore();
  // Get cart state directly from Zustand store - use both selector and direct access
  const totalItems = useCartStore((state) => state.totalItems);
  const items = useCartStore((state) => state.items);
  const [mounted, setMounted] = useState(false);
  const [forceUpdate, setForceUpdate] = useState(0);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Debug: log cart updates
  useEffect(() => {
    if (mounted && typeof window !== 'undefined') {
      console.log('🛒 Navbar cart state:', { totalItems, itemsCount: items.length, items });
    }
  }, [totalItems, items, mounted]);

  // Force re-render when cart updates
  useEffect(() => {
    setForceUpdate(prev => prev + 1);
  }, [totalItems]);

  // Prevent hydration mismatch and listen for updates
  useEffect(() => {
    setMounted(true);

    // Listen for auth updates
    const handleAuthUpdate = () => {
      setForceUpdate(prev => prev + 1);
    };

    // Listen for logout events (including from other tabs)
    const handleLogout = () => {
      setForceUpdate(prev => prev + 1);
      // Force reload to clear any cached state
      setTimeout(() => {
        if (window.location.pathname !== '/') {
          window.location.href = '/';
        }
      }, 100);
    };

    // Listen for cart updates
    const handleCartUpdate = () => {
      setForceUpdate(prev => prev + 1);
    };

    window.addEventListener('auth-update', handleAuthUpdate);
    window.addEventListener('auth-logout', handleLogout);
    window.addEventListener('storage', handleAuthUpdate); // Listen for localStorage changes from other tabs
    window.addEventListener('cart-update', handleCartUpdate); // Listen for cart updates

    return () => {
      window.removeEventListener('auth-update', handleAuthUpdate);
      window.removeEventListener('auth-logout', handleLogout);
      window.removeEventListener('storage', handleAuthUpdate);
      window.removeEventListener('cart-update', handleCartUpdate);
    };
  }, []);

  const handleLogout = async () => {
    await logout();
    window.location.href = '/';
  };

  // Show loading state until hydrated and mounted
  if (!mounted || !isHydrated) {
    return (
      <nav className="bg-white/95 backdrop-blur-lg shadow-md border-b border-gray-100 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center space-x-6">
              <Link href="/" className="flex items-center space-x-2">
                <svg className="w-8 h-8 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                <span className="text-2xl font-bold bg-gradient-to-r from-primary-600 to-blue-600 bg-clip-text text-transparent">COMMERCE</span>
              </Link>
              <Link
                href="/products"
                className="text-gray-700 hover:text-primary-600 px-3 py-2 rounded-md font-medium"
              >
                Shop
              </Link>
            </div>
            <div className="flex items-center">
              <div className="animate-pulse h-8 w-32 bg-gray-200 rounded"></div>
            </div>
          </div>
        </div>
      </nav>
    );
  }

  const getInitials = () => {
    if (user) {
      if (user.first_name && user.last_name) {
        return `${user.first_name[0]}${user.last_name[0]}`.toUpperCase();
      }
      if (user.username) {
        return user.username[0].toUpperCase();
      }
      return user.email[0].toUpperCase();
    }
    return '';
  };

  const getAvatarColor = () => {
    if (!user) return 'bg-gray-500';
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
      <nav className="bg-white/95 backdrop-blur-lg shadow-md border-b border-gray-100 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            {/* Left side - Logo & Shop */}
            <div className="flex items-center space-x-6">
              <Link href="/" className="flex items-center space-x-2">
                <svg className="w-8 h-8 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                <span className="text-2xl font-bold bg-gradient-to-r from-primary-600 to-blue-600 bg-clip-text text-transparent">Dokkan</span>
              </Link>
              <Link
                href="/products"
                className="hidden md:flex items-center gap-2 text-gray-700 hover:text-primary-600 px-4 py-2 rounded-lg font-medium transition-all hover:bg-gray-50"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                </svg>
                Shop
              </Link>
            </div>

            {/* Right side - Navigation Items */}
            <div className="hidden lg:flex items-center space-x-2">
              {/* Cart */}
              <Link
                href="/cart"
                className="relative text-gray-700 hover:text-primary-600 p-2 rounded-lg hover:bg-gray-50 transition-colors group"
              >
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"
                  />
                </svg>
                <span className="absolute -top-1 -right-1 bg-gradient-to-r from-orange-500 to-red-500 text-white text-xs font-bold rounded-full min-w-[22px] h-5 flex items-center justify-center px-1 shadow-lg">
                  {totalItems || 0}
                </span>
              </Link>

              {user ? (
                <>
                  {/* Buyer-only links */}
                  <Link
                    href="/orders"
                    className="flex items-center gap-2 text-gray-700 hover:text-primary-600 px-4 py-2 rounded-lg transition-colors hover:bg-gray-50"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                    Orders
                  </Link>
                  <Link
                    href="/account"
                    className="flex items-center gap-2 text-gray-700 hover:text-primary-600 px-4 py-2 rounded-lg transition-colors hover:bg-gray-50"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    Account
                  </Link>
                  <div className="flex items-center gap-3 pl-4 border-l border-gray-200">
                    <div className={`${getAvatarColor()} text-white rounded-full h-10 w-10 flex items-center justify-center font-semibold text-sm shadow-md`}>
                      {getInitials()}
                    </div>
                    <div className="flex flex-col">
                      <span className="text-sm font-medium text-gray-900">
                        {user.username || user.email.split('@')[0]}
                      </span>
                      <span className="text-xs text-gray-500">{user.email}</span>
                    </div>
                    <button
                      onClick={handleLogout}
                      className="ml-2 text-gray-700 hover:text-red-600 px-3 py-2 rounded-lg hover:bg-red-50 transition-colors font-medium"
                    >
                      Logout
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <Link
                    href="/login"
                    className="px-4 py-2 text-gray-700 hover:text-primary-600 font-medium rounded-lg transition-colors hover:bg-gray-50"
                  >
                    Login
                  </Link>
                  <Link
                    href="/register"
                    className="px-6 py-2 bg-gradient-to-r from-primary-600 to-blue-600 text-white rounded-lg hover:from-primary-700 hover:to-blue-700 font-semibold transition-all shadow-md hover:shadow-lg"
                  >
                    Sign Up
                  </Link>
                </>
              )}
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

          {/* Mobile menu dropdown */}
          {mobileMenuOpen && (
            <div className="lg:hidden border-t border-gray-100 bg-white/95 backdrop-blur-lg">
              <div className="px-2 pt-2 pb-3 space-y-1">
                <Link
                  href="/products"
                  className="flex items-center gap-3 text-gray-700 hover:bg-gray-100 px-4 py-3 rounded-lg font-medium transition-colors"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                  </svg>
                  Shop
                </Link>
                <Link
                  href="/cart"
                  className="block text-gray-700 hover:bg-gray-100 px-4 py-2 rounded-md font-medium"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <div className="flex items-center justify-between">
                    <span>Cart</span>
                    <span className="bg-orange-500 text-white text-xs font-bold rounded-full min-w-[20px] h-5 flex items-center justify-center px-1.5 shadow-sm">
                      {totalItems || 0}
                    </span>
                  </div>
                </Link>
                {user ? (
                  <>
                    <Link
                      href="/orders"
                      className="block text-gray-700 hover:bg-gray-100 px-4 py-2 rounded-md font-medium"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      Orders
                    </Link>
                    <Link
                      href="/account"
                      className="block text-gray-700 hover:bg-gray-100 px-4 py-2 rounded-md font-medium"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      Account
                    </Link>
                    <button
                      onClick={handleLogout}
                      className="block w-full text-left text-red-600 hover:bg-gray-100 px-4 py-2 rounded-md font-medium"
                    >
                      Logout
                    </button>
                  </>
                ) : (
                  <>
                    <Link
                      href="/login"
                      className="block text-gray-700 hover:bg-gray-100 px-4 py-2 rounded-md font-medium"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      Login
                    </Link>
                    <Link
                      href="/register"
                      className="block text-gray-700 hover:bg-gray-100 px-4 py-2 rounded-md font-medium"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      Sign Up
                    </Link>
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      </nav>

      {/* Mobile Bottom Navigation (for logged-in buyers) */}
      {user && (
        <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-lg border-t-2 border-gray-100 shadow-2xl z-50">
          <div className="flex justify-around items-center h-16">
            <Link href="/products" className="flex flex-col items-center justify-center flex-1 text-gray-600 hover:text-primary-600 transition-all group">
              <svg className="w-6 h-6 mb-1 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
              </svg>
              <span className="text-xs font-medium">Shop</span>
            </Link>

            <Link href="/cart" className="flex flex-col items-center justify-center flex-1 text-gray-600 hover:text-primary-600 transition-all group relative">
              <div className="relative">
                <svg className="w-6 h-6 mb-1 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                <span className="absolute -top-1 -right-1 bg-gradient-to-r from-orange-500 to-red-500 text-white text-xs font-bold rounded-full min-w-[20px] h-5 flex items-center justify-center px-1.5 shadow-lg">
                  {totalItems || 0}
                </span>
              </div>
              <span className="text-xs font-medium">Cart</span>
            </Link>

            <Link href="/orders" className="flex flex-col items-center justify-center flex-1 text-gray-600 hover:text-primary-600 transition-all group">
              <svg className="w-6 h-6 mb-1 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              <span className="text-xs font-medium">Orders</span>
            </Link>

            <Link href="/account" className="flex flex-col items-center justify-center flex-1 text-gray-600 hover:text-primary-600 transition-all group">
              <div className={`${getAvatarColor()} text-white rounded-full h-9 w-9 flex items-center justify-center font-semibold text-sm mb-1 shadow-md group-hover:scale-110 transition-transform`}>
                {getInitials()}
              </div>
              <span className="text-xs font-medium">Account</span>
            </Link>
          </div>
        </nav>
      )}

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

