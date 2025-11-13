'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useEffect, useState } from 'react';
import useAuthStore from '@/store/useAuthStore';
import { productsAPI, categoriesAPI } from '@/services/api';

export default function Home() {
  const { user, isHydrated } = useAuthStore();
  const [mounted, setMounted] = useState(false);
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [popularProducts, setPopularProducts] = useState([]);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setMounted(true);
    fetchHomeData();
    
    // Auto-rotate slider every 5 seconds
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % Math.min(featuredProducts.length, 2));
    }, 5000);
    
    return () => clearInterval(interval);
  }, [featuredProducts.length]);

  const fetchHomeData = async () => {
    try {
      // Fetch featured products
      const featuredResponse = await productsAPI.getAll({ featured: 'true' });
      const featured = featuredResponse.data.results || featuredResponse.data;
      const featuredArray = Array.isArray(featured) ? featured : [];
      setFeaturedProducts(featuredArray.slice(0, 2)); // Only take top 2 for slider

      // Fetch categories
      const categoriesResponse = await categoriesAPI.getAll();
      const cats = categoriesResponse.data.results || categoriesResponse.data;
      setCategories(Array.isArray(cats) ? cats : []);

      // Fetch popular products (top 8)
      const popularResponse = await productsAPI.getAll();
      const popular = popularResponse.data.results || popularResponse.data;
      const popularArray = Array.isArray(popular) ? popular : [];
      setPopularProducts(popularArray.slice(0, 8)); // Only take top 8
    } catch (error) {
      console.error('Failed to fetch home data:', error);
      setFeaturedProducts([]);
      setCategories([]);
      setPopularProducts([]);
    } finally {
      setLoading(false);
    }
  };

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % Math.min(featuredProducts.length, 2));
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + Math.min(featuredProducts.length, 2)) % Math.min(featuredProducts.length, 2));
  };

  return (
    <>
      {/* Dynamic Hero Slider Section */}
      {featuredProducts.length > 0 ? (
        <section className="relative h-[500px] md:h-[600px] overflow-hidden bg-gradient-to-br from-primary-600 via-primary-700 to-blue-800">
          <div className="absolute inset-0">
            {featuredProducts.slice(0, 2).map((product, index) => (
              <div
                key={product.id}
                className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${
                  index === currentSlide ? 'opacity-100 z-10' : 'opacity-0 z-0'
                }`}
              >
                {/* Background Image */}
                <div className="absolute inset-0 bg-gradient-to-r from-black/60 to-transparent z-20" />
                {product.image_url && (
                  <Image
                    src={product.image_url}
                    alt={product.name}
                    fill
                    className="object-cover"
                    priority={index === 0}
                  />
                )}
              </div>
            ))}

            {/* Content Overlay */}
            <div className="relative z-30 h-full flex items-center">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
                <div className="max-w-2xl">
                  {featuredProducts.slice(0, 2).map((product, index) => (
                    <div
                      key={product.id}
                      className={`transition-all duration-1000 ease-in-out ${
                        index === currentSlide ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10 absolute'
                      }`}
                    >
                      <div className="inline-block bg-yellow-400 text-yellow-900 px-4 py-2 rounded-full font-bold mb-4 text-sm">
                        ⭐ Featured Product
                      </div>
                      <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-white mb-4 leading-tight">
                        {product.name}
                      </h1>
                      <p className="text-xl md:text-2xl text-gray-100 mb-6 line-clamp-2">
                        {product.description?.substring(0, 120)}...
                      </p>
                      <div className="flex items-center gap-4 mb-8">
                        <span className="text-3xl md:text-4xl font-bold text-white">
                          ${product.discounted_price || product.price}
                        </span>
                        {product.discount_percentage > 0 && (
                          <>
                            <span className="text-xl line-through text-gray-300">
                              ${product.price}
                            </span>
                            <span className="bg-red-500 text-white px-3 py-1 rounded-full font-bold">
                              -{product.discount_percentage}%
                            </span>
                          </>
                        )}
                      </div>
                      <div className="flex gap-4 flex-wrap">
                        <Link
                          href={`/products/${product.slug}`}
                          className="px-8 py-4 bg-white text-primary-600 rounded-lg hover:bg-gray-100 transition font-semibold text-lg shadow-xl hover:shadow-2xl transform hover:-translate-y-1"
                        >
                          Shop Now
                        </Link>
                        <Link
                          href="/products"
                          className="px-8 py-4 border-2 border-white text-white rounded-lg hover:bg-white hover:text-primary-600 transition font-semibold text-lg"
                        >
                          Explore All
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Slider Controls */}
            {featuredProducts.length > 1 && (
              <>
                <button
                  onClick={prevSlide}
                  className="absolute left-4 top-1/2 -translate-y-1/2 z-40 bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white p-3 rounded-full transition-all hover:scale-110"
                  aria-label="Previous slide"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                <button
                  onClick={nextSlide}
                  className="absolute right-4 top-1/2 -translate-y-1/2 z-40 bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white p-3 rounded-full transition-all hover:scale-110"
                  aria-label="Next slide"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>

                {/* Slide Indicators */}
                <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-40 flex gap-2">
                  {featuredProducts.slice(0, 2).map((_, index) => (
                    <button
                      key={index}
                      onClick={() => setCurrentSlide(index)}
                      className={`transition-all ${
                        index === currentSlide
                          ? 'w-8 h-2 bg-white rounded-full'
                          : 'w-2 h-2 bg-white/50 rounded-full hover:bg-white/75'
                      }`}
                      aria-label={`Go to slide ${index + 1}`}
                    />
                  ))}
                </div>
              </>
            )}
          </div>
        </section>
      ) : (
        /* Fallback Hero */
        <section className="bg-gradient-to-r from-primary-600 to-primary-800 text-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
            <div className="text-center">
              <h1 className="text-5xl md:text-6xl font-extrabold mb-6">
                Welcome to COMMERCE
              </h1>
              <p className="text-xl md:text-2xl mb-8 text-primary-100">
                Discover amazing products at unbeatable prices
              </p>
              <div className="flex gap-4 justify-center flex-wrap">
                {mounted && isHydrated ? (
                  <>
                    {user && user.role === 'seller' ? (
                      <Link
                        href="/seller/products/add"
                        className="px-8 py-4 bg-white text-primary-600 rounded-lg hover:bg-gray-100 transition font-semibold text-lg shadow-lg"
                      >
                        Start Selling
                      </Link>
                    ) : (
                      <Link
                        href="/products"
                        className="px-8 py-4 bg-white text-primary-600 rounded-lg hover:bg-gray-100 transition font-semibold text-lg shadow-lg"
                      >
                        Start Shopping
                      </Link>
                    )}
                    {!user && (
                      <Link
                        href="/register"
                        className="px-8 py-4 border-2 border-white text-white rounded-lg hover:bg-white hover:text-primary-600 transition font-semibold text-lg"
                      >
                        Create Account
                      </Link>
                    )}
                  </>
                ) : (
                  <div className="px-8 py-4 bg-white/20 text-white rounded-lg text-lg shadow-lg animate-pulse">
                    Loading...
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Categories Showcase */}
      {categories.length > 0 && (
        <section className="py-12 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-3xl font-bold text-gray-900">Shop by Category</h2>
              <Link href="/products" className="text-primary-600 hover:text-primary-700 font-semibold">
                View All →
              </Link>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {categories.slice(0, 6).map((category) => (
                <Link
                  key={category.id}
                  href={`/products?category=${category.slug}`}
                  className="group bg-gradient-to-br from-gray-50 to-gray-100 hover:from-primary-50 hover:to-primary-100 rounded-xl p-6 transition-all hover:shadow-lg transform hover:-translate-y-1 border border-gray-200 hover:border-primary-300"
                >
                  <div className="aspect-square w-full mb-4 bg-white rounded-lg flex items-center justify-center overflow-hidden">
                    {category.image_url ? (
                      <Image
                        src={category.image_url}
                        alt={category.name}
                        width={120}
                        height={120}
                        className="object-cover group-hover:scale-110 transition-transform"
                      />
                    ) : (
                      <div className="text-4xl">📦</div>
                    )}
                  </div>
                  <h3 className="text-center font-semibold text-gray-900 group-hover:text-primary-600 transition-colors">
                    {category.name}
                  </h3>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Popular Products Section */}
      {popularProducts.length > 0 && (
        <section className="py-16 bg-gray-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between mb-12">
              <div>
                <h2 className="text-3xl font-bold text-gray-900">Popular Products</h2>
                <p className="text-gray-600 mt-2">Discover our best-selling items</p>
              </div>
              <Link
                href="/products"
                className="hidden md:block px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition font-semibold"
              >
                View All
              </Link>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {popularProducts.slice(0, 4).map((product) => (
                <div
                  key={product.id}
                  className="bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-xl transition-all group border border-gray-100"
                >
                  <Link href={`/products/${product.slug}`}>
                    <div className="relative h-64 w-full overflow-hidden bg-gray-100">
                      {product.image_url || product.thumbnail_url ? (
                        <Image
                          src={product.thumbnail_url || product.image_url}
                          alt={product.name}
                          fill
                          className="object-cover group-hover:scale-110 transition-transform duration-300"
                          loading="lazy"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <span className="text-gray-400">No Image</span>
                        </div>
                      )}
                      {product.is_featured && (
                        <span className="absolute top-3 right-3 bg-yellow-400 text-yellow-900 px-2 py-1 rounded-full text-xs font-bold">
                          ⭐ Featured
                        </span>
                      )}
                      {product.discount_percentage > 0 && (
                        <span className="absolute top-3 left-3 bg-red-500 text-white px-2 py-1 rounded-full text-xs font-bold">
                          -{product.discount_percentage}%
                        </span>
                      )}
                    </div>
                    <div className="p-5">
                      <h3 className="font-bold text-lg mb-2 line-clamp-2 group-hover:text-primary-600 transition-colors">
                        {product.name}
                      </h3>
                      <div className="flex items-center gap-2 mb-3">
                        <span className="text-2xl font-bold text-gray-900">
                          ${product.discounted_price || product.price}
                        </span>
                        {product.discount_percentage > 0 && (
                          <span className="text-sm line-through text-gray-400">
                            ${product.price}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="flex text-yellow-400">
                          {'⭐'.repeat(5)}
                        </div>
                        <span className="text-sm text-gray-600">({product.review_count || 0})</span>
                      </div>
                    </div>
                  </Link>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Features Section */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-center mb-12">Why Shop With Us?</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center p-6">
              <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-2">Quality Products</h3>
              <p className="text-gray-600">Curated selection of high-quality items from trusted sellers</p>
            </div>

            <div className="text-center p-6">
              <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-2">Best Prices</h3>
              <p className="text-gray-600">Competitive pricing and regular deals on all products</p>
            </div>

            <div className="text-center p-6">
              <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-2">Fast Delivery</h3>
              <p className="text-gray-600">Quick and reliable shipping to your doorstep</p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div>
              <h3 className="text-lg font-semibold mb-4">COMMERCE</h3>
              <p className="text-gray-400">
                Built with Next.js 15 and Django 5
              </p>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-4">Quick Links</h3>
              <ul className="space-y-2">
                <li><Link href="/products" className="text-gray-400 hover:text-white">Products</Link></li>
                <li><Link href="/cart" className="text-gray-400 hover:text-white">Cart</Link></li>
                <li><Link href="/orders" className="text-gray-400 hover:text-white">Orders</Link></li>
              </ul>
            </div>
            {mounted && isHydrated && !user && (
              <div>
                <h3 className="text-lg font-semibold mb-4">Account</h3>
                <ul className="space-y-2">
                  <li><Link href="/login" className="text-gray-400 hover:text-white">Login</Link></li>
                  <li><Link href="/register" className="text-gray-400 hover:text-white">Register</Link></li>
                </ul>
              </div>
            )}
            {mounted && isHydrated && user && (
              <div>
                <h3 className="text-lg font-semibold mb-4">Account</h3>
                <ul className="space-y-2">
                  {user.role === 'seller' ? (
                    <>
                      <li><Link href="/seller/dashboard" className="text-gray-400 hover:text-white">Dashboard</Link></li>
                      <li><Link href="/seller/products" className="text-gray-400 hover:text-white">My Products</Link></li>
                    </>
                  ) : (
                    <>
                      <li><Link href="/orders" className="text-gray-400 hover:text-white">My Orders</Link></li>
                      <li><Link href="/account" className="text-gray-400 hover:text-white">My Account</Link></li>
                    </>
                  )}
                </ul>
              </div>
            )}
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
            <p>&copy; 2025 COMMERCE. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </>
  );
}
