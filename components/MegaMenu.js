'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import useAuthStore from '@/store/useAuthStore';
import useCartStore from '@/store/useCartStore';
import { getSellerNavigation, getBuyerNavigation, isActivePath } from '@/lib/navigation';
import SearchComponent from './SearchComponent';

export default function MegaMenu() {
  const pathname = usePathname();
  const { user, logout } = useAuthStore();
  const { totalItems, totalPrice } = useCartStore();
  const [scrolled, setScrolled] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState(null);
  
  const closeTimeoutRef = useRef(null);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleMouseEnter = (dropdown) => {
    if (closeTimeoutRef.current) {
      clearTimeout(closeTimeoutRef.current);
      closeTimeoutRef.current = null;
    }
    setActiveDropdown(dropdown);
  };

  const handleMouseLeave = () => {
    closeTimeoutRef.current = setTimeout(() => {
      setActiveDropdown(null);
    }, 300); // Increased timeout to 300ms
  };

  return (
    <nav
      className={`sticky top-0 z-50 bg-navy-500 border-b border-navy-600 transition-all duration-300 ${
        scrolled ? 'shadow-xl' : 'shadow-md'
      }`}
    >
      {/* Mobile Navbar - Visible on small screens */}
      <div className="lg:hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-2">
              <div className="bg-gradient-to-br from-navy-500 via-navy-600 to-navy-700 text-white p-2 rounded-lg shadow-md">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                </svg>
              </div>
              <span className="text-lg font-bold text-white">Commerca</span>
            </Link>
            
            {/* Right side icons - Search, Cart and Menu */}
            <div className="flex items-center gap-3">
              {/* Mobile Search Icon */}
              <div className="relative">
                <SearchComponent isMobile={true} />
              </div>
              
              {/* Mobile Cart Icon */}
              {user?.role === 'buyer' && (
                <Link href="/cart" className="relative p-2 hover:bg-navy-600 rounded-lg transition-colors">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                  {totalItems > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 bg-primary-500 text-navy-500 text-xs font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1 shadow-md">
                      {totalItems}
                    </span>
                  )}
                </Link>
              )}
              
              {/* Spacer for hamburger menu (rendered by MobileNav component) */}
              <div className="w-10"></div>
            </div>
          </div>
        </div>
      </div>

      {/* Desktop Navbar - Hidden on small screens */}
      <div className="hidden lg:block max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-18 py-1.5">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-3 group">
            <div className="bg-gradient-to-br from-navy-500 via-navy-600 to-navy-700 text-white p-2.5 rounded-xl shadow-lg group-hover:shadow-xl transition-all transform group-hover:scale-105">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
              </svg>
            </div>
            <div className="hidden sm:block">
              <span className="text-xl font-bold text-white">
                Commerca
              </span>
              <p className="text-xs text-white/70">Shop with confidence</p>
            </div>
          </Link>

          {/* Desktop Search */}
          <div className="hidden lg:flex items-center flex-1 justify-center max-w-md mx-8">
            <SearchComponent isMobile={false} />
          </div>

          {/* Desktop Navigation - Center Links */}
          <div className="hidden lg:flex items-center gap-2">
            {(user?.role === 'seller' ? getSellerNavigation() : user?.role === 'buyer' ? getBuyerNavigation() : [
              { 
                title: 'Home', 
                path: '/',
                icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6'
              },
              { 
                title: 'All Products', 
                path: '/products',
                icon: 'M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4'
              }
            ]).map((item) => {
              if (item.children) {
                // Dropdown menu item
                return (
                  <div
                    key={item.title}
                    className="relative group"
                    onMouseEnter={() => handleMouseEnter(item.title.toLowerCase())}
                    onMouseLeave={handleMouseLeave}
                  >
                    <button
                      className={`px-5 py-3 rounded-button font-bold transition-all flex items-center gap-2 ${
                        item.children.some(child => isActivePath(pathname, child.path)) || activeDropdown === item.title.toLowerCase()
                          ? 'text-navy-500 bg-primary-500 shadow-button'
                          : 'text-white hover:bg-navy-600'
                      }`}
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={item.icon} />
                      </svg>
                      {item.title}
                      <svg className={`w-4 h-4 transition-transform duration-200 ${activeDropdown === item.title.toLowerCase() ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>

                    {activeDropdown === item.title.toLowerCase() && (
                      <div 
                        className="absolute top-full left-0 mt-1 w-80 bg-white rounded-card shadow-card-hover border border-lightgray overflow-hidden z-50 animate-fadeIn"
                        onMouseEnter={() => handleMouseEnter(item.title.toLowerCase())}
                        onMouseLeave={handleMouseLeave}
                      >
                        <div className="px-5 py-3 bg-navy-500">
                          <p className="text-xs font-bold text-primary-500 uppercase tracking-wider flex items-center gap-2">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={item.icon} />
                            </svg>
                            {item.title}
                          </p>
                        </div>
                        <div className="p-2">
                          {item.children.map((child) => (
                            <Link 
                              key={child.path} 
                              href={child.path} 
                              className="flex items-center gap-3 px-4 py-3 rounded-button hover:bg-bg transition-all group"
                              onClick={() => setActiveDropdown(null)}
                            >
                              <div className="bg-primary-500 p-2.5 rounded-button shadow-md group-hover:shadow-lg transition">
                                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={child.icon} />
                                </svg>
                              </div>
                              <div className="flex-1">
                                <p className="font-semibold text-black">{child.title}</p>
                                <p className="text-xs text-black/60">
                                  {child.title === 'Dashboard' && 'Charts & analytics'}
                                  {child.title === 'Invoices' && 'Download & manage'}
                                  {child.title === 'Transactions' && 'Payment history'}
                                  {child.title === 'Refunds' && 'Return requests'}
                                  {child.title === 'Orders' && 'Order tracking & management'}
                                  {child.title === 'My Products' && 'Manage your inventory'}
                                  {child.title === 'Add New Product' && 'Create new listing'}
                                  {child.title === 'All Products' && 'Browse all available products'}
                                  {child.title === 'Categories' && 'Shop by category'}
                                  {child.title === 'Search' && 'Find specific products'}
                                  {child.title === 'My Orders' && 'View your orders'}
                                  {child.title === 'Order History' && 'Past order details'}
                                  {child.title === 'Track Order' && 'Track shipment status'}
                                  {child.title === 'Profile' && 'Personal information'}
                                  {child.title === 'Activity Log' && 'View your history'}
                                  {child.title === 'Security Settings' && 'Account security'}
                                </p>
                              </div>
                              <svg className="w-4 h-4 text-primary-500 opacity-0 group-hover:opacity-100 transform group-hover:translate-x-1 transition-all" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                              </svg>
                            </Link>
                          ))}
                          
                          {/* Add Logout button for Account dropdown */}
                          {item.title === 'Account' && (
                            <>
                              <div className="border-t border-gray-200 my-2"></div>
                              <button
                                onClick={() => {
                                  logout();
                                  setActiveDropdown(null);
                                }}
                                className="flex items-center gap-3 px-4 py-3 rounded-button hover:bg-red-50 transition-all group w-full"
                              >
                                <div className="bg-red-500 p-2.5 rounded-button shadow-md group-hover:shadow-lg transition">
                                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                                  </svg>
                                </div>
                                <div className="flex-1">
                                  <p className="font-semibold text-red-600">Logout</p>
                                  <p className="text-xs text-red-500">Sign out of your account</p>
                                </div>
                                <svg className="w-4 h-4 text-red-500 opacity-0 group-hover:opacity-100 transform group-hover:translate-x-1 transition-all" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                </svg>
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                );
              } else {
                // Regular link item
                return (
                  <Link
                    key={item.path}
                    href={item.path}
                    className={`px-5 py-3 rounded-button font-bold transition-all flex items-center gap-2 ${
                      isActivePath(pathname, item.path)
                        ? 'text-navy-500 bg-primary-500 shadow-button'
                        : 'text-white hover:bg-navy-600'
                    }`}
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={item.icon} />
                    </svg>
                    {item.title}
                  </Link>
                );
              }
            })}
          </div>

          {/* Right Side - Login/Signup and Cart */}
          <div className="hidden lg:flex items-center gap-2">
            {/* Login/Signup for non-logged in users */}
            {!user && (
              <div className="flex items-center gap-2">
                <Link
                  href="/login"
                  className="px-4 py-2 text-white hover:text-primary-500 font-medium rounded-button hover:bg-navy-600 transition-all"
                >
                  Login
                </Link>
                <Link
                  href="/register"
                  className="px-6 py-2 bg-primary-500 text-navy-500 font-bold rounded-button hover:bg-primary-600 hover:shadow-button transition-all active:scale-95"
                >
                  Sign Up
                </Link>
              </div>
            )}

            {/* Cart with Enhanced Display - Always Last */}
            {(user?.role === 'buyer' || !user) && (
              <Link
                href="/cart"
                className={`relative flex items-center gap-3 px-4 py-2.5 rounded-button transition-all group ${
                  pathname === '/cart'
                    ? 'bg-primary-500 text-navy-500 shadow-button'
                    : 'bg-navy-600 text-white hover:bg-navy-700'
                }`}
              >
                <div className="relative">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                  {totalItems > 0 && (
                    <span className="absolute -top-1 -right-1 bg-white text-navy-500 text-xs font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1 shadow-lg">
                      {totalItems}
                    </span>
                  )}
                </div>
                <div className="hidden xl:block">
                  <p className="font-bold text-sm">${totalPrice.toFixed(2)}</p>
                  <p className="text-xs opacity-70">{totalItems} {totalItems === 1 ? 'item' : 'items'}</p>
                </div>
              </Link>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}

