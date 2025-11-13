'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import useCartStore from '@/store/useCartStore';
import useAuthStore from '@/store/useAuthStore';
import { cartAPI } from '@/services/api';
import { showToast } from '@/components/Toast';

export default function ProductCard({ product }) {
  const router = useRouter();
  const addItem = useCartStore((state) => state.addItem);
  const { user } = useAuthStore();
  const [isAdding, setIsAdding] = useState(false);
  const [isWishlisting, setIsWishlisting] = useState(false);

  const handleAddToCart = async (e) => {
    e.preventDefault();
    e.stopPropagation();

    if (!user) {
      showToast.error('Please login to add items to cart', 'Login Required');
      router.push('/login');
      return;
    }

    setIsAdding(true);
    try {
      console.log('🛍️ Adding product to cart:', product);
      // Add to backend cart via API
      await cartAPI.addItem(product.id, 1);
      
      console.log('✅ Backend cart updated, now adding to local store...');
      // Add to local cart store with normalized product data
      const productForCart = {
        ...product,
        image_url: product.image_url,
        thumbnail_url: product.thumbnail_url,
        slug: product.slug,
      };
      addItem(productForCart, 1);
      
      console.log('✅ Local cart updated');
      showToast.success('Added to cart!', 'Success');
      
      // Check store state after adding
      setTimeout(() => {
        const state = useCartStore.getState();
        console.log('🛒 Cart store after add:', { 
          totalItems: state.totalItems, 
          items: state.items,
          itemCount: state.items.length 
        });
      }, 100);
    } catch (error) {
      console.error('❌ Failed to add to cart:', error);
      showToast.error('Failed to add to cart', 'Error');
    } finally {
      setIsAdding(false);
    }
  };

  const handleAddToWishlist = async (e) => {
    e.preventDefault();
    e.stopPropagation();

    if (!user) {
      showToast.error('Please login to add to wishlist', 'Login Required');
      router.push('/login');
      return;
    }

    setIsWishlisting(true);
    // TODO: Implement wishlist functionality when backend is ready
    setTimeout(() => {
      showToast.info('Wishlist coming soon!', 'Info');
      setIsWishlisting(false);
    }, 500);
  };

  return (
    <Link 
      href={`/products/${product.slug}`}
      className="group bg-white rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden border border-gray-100 flex flex-col h-full cursor-pointer"
    >
      {/* Product Image */}
      <div className="relative h-64 w-full overflow-hidden bg-gray-100">
        {product.image_url || product.thumbnail_url ? (
          <Image
            src={product.thumbnail_url || product.image_url}
            alt={product.name}
            fill
            style={{ objectFit: 'cover', width: '100%', height: '100%' }}
            className="group-hover:scale-105 transition-transform duration-300"
            loading="lazy"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
        ) : (
          <div className="w-full h-64 flex items-center justify-center bg-gray-100">
            <span className="text-gray-400">No Image</span>
          </div>
        )}
        
        {/* Badges */}
        {product.is_featured && (
          <span className="absolute top-3 right-3 bg-gradient-to-r from-yellow-400 to-yellow-500 text-yellow-900 px-3 py-1 rounded-full text-xs font-bold shadow-md z-20">
            ⭐ Featured
          </span>
        )}
        {product.discount_percentage > 0 && (
          <span className="absolute top-3 left-3 bg-red-500 text-white px-3 py-1 rounded-full text-xs font-bold shadow-md z-20">
            -{product.discount_percentage}%
          </span>
        )}
        {!product.in_stock && (
          <span className="absolute top-3 left-3 bg-red-500 text-white px-3 py-1 rounded-full text-xs font-bold shadow-md z-20">
            Out of Stock
          </span>
        )}

        {/* Quick action buttons on hover */}
        <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-5 transition-all duration-300 flex items-center justify-center opacity-0 group-hover:opacity-100 z-10 pointer-events-none">
          <div className="flex gap-2 pointer-events-auto">
            <button
              onClick={handleAddToCart}
              disabled={!product.in_stock || isAdding}
              className="bg-primary-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-primary-700 transition-transform hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {isAdding ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Adding...
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                  Add to Cart
                </>
              )}
            </button>
            <button
              onClick={handleAddToWishlist}
              disabled={isWishlisting}
              className="bg-white text-primary-600 px-4 py-2 rounded-lg font-semibold hover:bg-gray-50 transition-transform hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isWishlisting ? (
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary-600"></div>
              ) : (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Product Info - flex grow to make cards equal height */}
      <div className="p-5 flex flex-col flex-grow">
        {/* Category */}
        {product.category_name && (
          <p className="text-xs text-primary-600 font-medium mb-2 uppercase tracking-wide">
            {product.category_name}
          </p>
        )}
        
        {/* Product Name */}
        <h3 className="text-base font-bold text-gray-900 mb-2 line-clamp-2 group-hover:text-primary-600 transition-colors min-h-[2.5rem]">
          {product.name}
        </h3>

        {/* Rating */}
        {product.average_rating > 0 && (
          <div className="flex items-center mb-3">
            <div className="flex text-yellow-400">
              {'★'.repeat(Math.floor(product.average_rating))}
            </div>
            <span className="text-xs text-gray-500 ml-2">
              ({product.total_reviews} reviews)
            </span>
          </div>
        )}

        {/* Price and Stock */}
        <div className="mt-auto">
          <div className="flex items-baseline gap-2 mb-3">
            <span className="text-2xl font-bold text-primary-600">
              ${parseFloat(product.price).toFixed(2)}
            </span>
            {product.discount_percentage > 0 && product.original_price && (
              <span className="text-sm text-gray-400 line-through">
                ${parseFloat(product.original_price).toFixed(2)}
              </span>
            )}
          </div>
          
          {/* Stock Status */}
          <div className="flex items-center justify-between mb-3">
            {product.in_stock ? (
              <span className="text-sm font-semibold text-green-600">
                ✓ {product.stock} in stock
              </span>
            ) : (
              <span className="text-sm font-semibold text-red-600">
                ✗ Out of stock
              </span>
            )}
            
            {product.seller_name && (
              <span className="text-xs text-gray-400">
                by {product.seller_name}
              </span>
            )}
          </div>

          {/* Action Buttons - Always visible on mobile, overlay on desktop */}
          <div className="flex gap-2 md:hidden">
            <button
              onClick={handleAddToCart}
              disabled={!product.in_stock || isAdding}
              className="flex-1 bg-primary-600 text-white px-4 py-2.5 rounded-lg font-semibold hover:bg-primary-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isAdding ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Adding...
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                  Add to Cart
                </>
              )}
            </button>
            <button
              onClick={handleAddToWishlist}
              disabled={isWishlisting}
              className="bg-white border-2 border-gray-200 text-primary-600 px-4 py-2.5 rounded-lg font-semibold hover:border-primary-300 hover:bg-gray-50 transition disabled:opacity-50"
            >
              {isWishlisting ? (
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary-600"></div>
              ) : (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
              )}
            </button>
          </div>
        </div>
      </div>
    </Link>
  );
}

