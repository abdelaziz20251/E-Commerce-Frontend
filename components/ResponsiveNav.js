'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import useAuthStore from '@/store/useAuthStore';
import useCartStore from '@/store/useCartStore';

export default function ResponsiveNav() {
  const pathname = usePathname();
  const { user, logout } = useAuthStore();
  const { totalItems } = useCartStore();
  const [scrolled, setScrolled] = useState(false);
  const [showFinancesDropdown, setShowFinancesDropdown] = useState(false);
  const [showAccountDropdown, setShowAccountDropdown] = useState(false);

  // Handle scroll effect
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <nav
      className={`sticky top-0 z-30 bg-white transition-all duration-300 ${
        scrolled ? 'shadow-md' : 'shadow-sm'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <div className="bg-gradient-to-r from-primary-600 to-primary-700 text-white p-2 rounded-lg">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
              </svg>
            </div>
            <span className="text-xl font-bold text-gray-900 hidden sm:block">Commerca</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center gap-6">
            <Link
              href="/products"
              className={`text-sm font-medium transition-colors ${
                pathname === '/products'
                  ? 'text-primary-600'
                  : 'text-gray-700 hover:text-primary-600'
              }`}
            >
              Products
            </Link>

            {user && (
              <>
                {user.role === 'seller' ? (
                  <>
                    <Link
                      href="/seller/dashboard"
                      className={`text-sm font-medium transition-colors ${
                        pathname.startsWith('/seller/dashboard')
                          ? 'text-primary-600'
                          : 'text-gray-700 hover:text-primary-600'
                      }`}
                    >
                      Dashboard
                    </Link>
                    <Link
                      href="/seller/products"
                      className={`text-sm font-medium transition-colors ${
                        pathname.startsWith('/seller/products')
                          ? 'text-primary-600'
                          : 'text-gray-700 hover:text-primary-600'
                      }`}
                    >
                      My Products
                    </Link>
                    <Link
                      href="/seller/orders"
                      className={`text-sm font-medium transition-colors ${
                        pathname.startsWith('/seller/orders')
                          ? 'text-primary-600'
                          : 'text-gray-700 hover:text-primary-600'
                      }`}
                    >
                      Orders
                    </Link>
                    
                    {/* Finances Dropdown for Sellers */}
                    <div 
                      className="relative"
                      onMouseEnter={() => setShowFinancesDropdown(true)}
                      onMouseLeave={() => setShowFinancesDropdown(false)}
                    >
                      <button
                        className={`text-sm font-medium transition-colors flex items-center gap-1 ${
                          pathname.includes('/finances') || pathname.includes('/invoices') || pathname.includes('/transactions') || pathname.includes('/refunds')
                            ? 'text-primary-600'
                            : 'text-gray-700 hover:text-primary-600'
                        }`}
                      >
                        Finances
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </button>
                      
                      {showFinancesDropdown && (
                        <div className="absolute top-full left-0 mt-2 w-56 bg-white rounded-lg shadow-xl border border-gray-200 py-2 z-50">
                          <Link href="/finances" className="block px-4 py-2 text-sm text-gray-700 hover:bg-primary-50 hover:text-primary-700">
                            Financial Dashboard
                          </Link>
                          <Link href="/invoices" className="block px-4 py-2 text-sm text-gray-700 hover:bg-primary-50 hover:text-primary-700">
                            Invoices
                          </Link>
                          <Link href="/transactions" className="block px-4 py-2 text-sm text-gray-700 hover:bg-primary-50 hover:text-primary-700">
                            Transactions
                          </Link>
                          <Link href="/refunds" className="block px-4 py-2 text-sm text-gray-700 hover:bg-primary-50 hover:text-primary-700">
                            Refunds
                          </Link>
                        </div>
                      )}
                    </div>
                  </>
                ) : (
                  <>
                    <Link
                      href="/orders"
                      className={`text-sm font-medium transition-colors ${
                        pathname === '/orders'
                          ? 'text-primary-600'
                          : 'text-gray-700 hover:text-primary-600'
                      }`}
                    >
                      Orders
                    </Link>
                    
                    {/* Finances Dropdown */}
                    <div 
                      className="relative"
                      onMouseEnter={() => setShowFinancesDropdown(true)}
                      onMouseLeave={() => setShowFinancesDropdown(false)}
                    >
                      <button
                        className={`text-sm font-medium transition-colors flex items-center gap-1 ${
                          pathname.includes('/finances') || pathname.includes('/invoices') || pathname.includes('/transactions') || pathname.includes('/refunds')
                            ? 'text-primary-600'
                            : 'text-gray-700 hover:text-primary-600'
                        }`}
                      >
                        Finances
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </button>
                      
                      {showFinancesDropdown && (
                        <div className="absolute top-full left-0 mt-2 w-56 bg-white rounded-lg shadow-xl border border-gray-200 py-2 z-50">
                          <Link href="/finances" className="block px-4 py-2 text-sm text-gray-700 hover:bg-primary-50 hover:text-primary-700">
                            Financial Dashboard
                          </Link>
                          <Link href="/invoices" className="block px-4 py-2 text-sm text-gray-700 hover:bg-primary-50 hover:text-primary-700">
                            Invoices
                          </Link>
                          <Link href="/transactions" className="block px-4 py-2 text-sm text-gray-700 hover:bg-primary-50 hover:text-primary-700">
                            Transactions
                          </Link>
                          <Link href="/refunds" className="block px-4 py-2 text-sm text-gray-700 hover:bg-primary-50 hover:text-primary-700">
                            Refunds
                          </Link>
                        </div>
                      )}
                    </div>
                  </>
                )}
              </>
            )}
          </div>

          {/* Right side icons */}
          <div className="flex items-center gap-4">
            {/* Cart Icon (buyers only) */}
            {user?.role === 'buyer' && (
              <Link
                href="/cart"
                className="relative p-2 hover:bg-gray-100 rounded-lg transition hidden lg:block"
              >
                <svg className="w-6 h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                {totalItems > 0 && (
                  <span className="absolute -top-1 -right-1 bg-primary-600 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                    {totalItems}
                  </span>
                )}
              </Link>
            )}

            {/* Desktop Auth */}
            <div className="hidden lg:flex items-center gap-2">
              {user ? (
                <>
                  {/* Account Dropdown */}
                  <div 
                    className="relative"
                    onMouseEnter={() => setShowAccountDropdown(true)}
                    onMouseLeave={() => setShowAccountDropdown(false)}
                  >
                    <button
                      className={`text-sm font-medium transition-colors px-4 py-2 rounded-lg hover:bg-gray-50 flex items-center gap-1 ${
                        pathname.includes('/account') || pathname.includes('/payment-methods')
                          ? 'text-primary-600'
                          : 'text-gray-700 hover:text-primary-600'
                      }`}
                    >
                      {user.username || user.first_name || 'Account'}
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                    
                    {showAccountDropdown && (
                      <div className="absolute top-full right-0 mt-2 w-48 bg-white rounded-lg shadow-xl border border-gray-200 py-2 z-50">
                        <Link href="/account" className="block px-4 py-2 text-sm text-gray-700 hover:bg-primary-50 hover:text-primary-700">
                          Account Settings
                        </Link>
                        {user.role === 'buyer' && (
                          <Link href="/payment-methods" className="block px-4 py-2 text-sm text-gray-700 hover:bg-primary-50 hover:text-primary-700">
                            Payment Methods
                          </Link>
                        )}
                        <div className="border-t border-gray-200 my-1"></div>
                        <button
                          onClick={logout}
                          className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 hover:text-red-700"
                        >
                          Logout
                        </button>
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <>
                  <Link
                    href="/login"
                    className="text-sm font-medium text-gray-700 hover:text-primary-600 transition px-4 py-2 rounded-lg hover:bg-gray-50"
                  >
                    Login
                  </Link>
                  <Link
                    href="/register"
                    className="text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 transition px-4 py-2 rounded-lg"
                  >
                    Sign Up
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Bottom Navigation Bar */}
      {user && (
        <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-30 safe-area-bottom">
          <div className="grid grid-cols-5 gap-1 px-2 py-2">
            <Link
              href={user.role === 'seller' ? '/seller/dashboard' : '/'}
              className={`flex flex-col items-center gap-1 px-3 py-2 rounded-lg transition-all ${
                pathname === (user.role === 'seller' ? '/seller/dashboard' : '/')
                  ? 'text-primary-600 bg-primary-50'
                  : 'text-gray-600'
              }`}
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
              <span className="text-xs font-medium">Home</span>
            </Link>

            <Link
              href={user.role === 'seller' ? '/seller/products' : '/products'}
              className={`flex flex-col items-center gap-1 px-3 py-2 rounded-lg transition-all ${
                pathname.includes('/products')
                  ? 'text-primary-600 bg-primary-50'
                  : 'text-gray-600'
              }`}
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
              <span className="text-xs font-medium">Products</span>
            </Link>

            {user.role === 'buyer' && (
              <Link
                href="/cart"
                className={`flex flex-col items-center gap-1 px-3 py-2 rounded-lg transition-all relative ${
                  pathname === '/cart'
                    ? 'text-primary-600 bg-primary-50'
                    : 'text-gray-600'
                }`}
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                {totalItems > 0 && (
                  <span className="absolute top-0 right-1 bg-red-500 text-white text-xs font-bold rounded-full w-4 h-4 flex items-center justify-center">
                    {totalItems > 9 ? '9+' : totalItems}
                  </span>
                )}
                <span className="text-xs font-medium">Cart</span>
              </Link>
            )}

            <Link
              href={user.role === 'seller' ? '/seller/orders' : '/orders'}
              className={`flex flex-col items-center gap-1 px-3 py-2 rounded-lg transition-all ${
                pathname.includes('/orders')
                  ? 'text-primary-600 bg-primary-50'
                  : 'text-gray-600'
              }`}
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              <span className="text-xs font-medium">Orders</span>
            </Link>

            <Link
              href="/account"
              className={`flex flex-col items-center gap-1 px-3 py-2 rounded-lg transition-all ${
                pathname === '/account'
                  ? 'text-primary-600 bg-primary-50'
                  : 'text-gray-600'
              }`}
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              <span className="text-xs font-medium">Account</span>
            </Link>
          </div>
        </div>
      )}
    </nav>
  );
}

