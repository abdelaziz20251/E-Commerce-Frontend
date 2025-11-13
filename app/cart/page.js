'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import useCartStore from '@/store/useCartStore';
import { showToast } from '@/components/Toast';
import { calculateCartTotals, getCartHealth } from '@/utils/cartValidation';

export default function CartPage() {
  const { items, totalItems, totalPrice, updateQuantity, removeItem, clearCart } = useCartStore();
  const [cartTotals, setCartTotals] = useState(null);
  
  // Calculate comprehensive totals on mount and when items change
  useEffect(() => {
    if (items.length > 0) {
      const totals = calculateCartTotals(items);
      setCartTotals(totals);
      
      // Log any validation errors
      if (!totals.validation.isValid) {
        console.error('Cart validation errors:', totals.validation.errors);
        showToast.warning('Some items in your cart may have issues', 'Cart Warning');
      }
    } else {
      setCartTotals(null);
    }
  }, [items]);

  const handleUpdateQuantity = (itemId, newQuantity, maxStock) => {
    if (newQuantity > 0 && newQuantity <= maxStock) {
      updateQuantity(itemId, newQuantity);
      showToast.success('Cart updated', 'Quantity changed');
    } else if (newQuantity > maxStock) {
      showToast.warning(`Only ${maxStock} items available in stock`, 'Stock Limit');
    }
  };

  const handleRemoveItem = (itemId, itemName) => {
    removeItem(itemId);
    showToast.info(`${itemName} removed from cart`, 'Item Removed');
  };

  const handleClearCart = () => {
    // Show confirmation toast with action
    const confirmed = window.confirm('Are you sure you want to clear your entire cart?');
    if (confirmed) {
      clearCart();
      showToast.success('Your cart has been cleared', 'Cart Cleared');
    }
  };

  if (items.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center">
          <svg
            className="mx-auto h-24 w-24 text-gray-400"
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
          <h2 className="mt-6 text-3xl font-bold text-gray-900">Your cart is empty</h2>
          <p className="mt-2 text-gray-600">Start shopping to add items to your cart</p>
          <Link
            href="/products"
            className="mt-8 inline-block bg-primary-600 text-white px-8 py-3 rounded-lg hover:bg-primary-700 transition font-semibold"
          >
            Continue Shopping
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 min-h-screen py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Shopping Cart</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Cart Items */}
        <div className="lg:col-span-2 space-y-4">
          {/* Header */}
          <div className="flex justify-between items-center pb-4 border-b border-gray-200">
            <h2 className="text-xl font-semibold">
              Cart ({totalItems} {totalItems === 1 ? 'item' : 'items'})
            </h2>
            <button
              onClick={handleClearCart}
              className="text-sm text-red-600 hover:text-red-700 font-medium"
            >
              Clear Cart
            </button>
          </div>

          {/* Cart Items List */}
          {items.map((item) => (
            <div
              key={item.id}
              className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition"
            >
              <div className="flex gap-4">
                {/* Product Image */}
                <Link href={`/products/${item.slug}`} className="flex-shrink-0">
                  <div className="relative w-32 h-32 bg-gray-100 rounded-lg overflow-hidden">
                    {(item.image_url || item.thumbnail_url || item.image) ? (
                      <Image
                        src={item.thumbnail_url || item.image_url || item.image}
                        alt={item.name}
                        fill
                        className="object-cover"
                        loading="eager"
                        priority
                        unoptimized
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <span className="text-gray-400 text-xs">No Image</span>
                      </div>
                    )}
                  </div>
                </Link>

                {/* Product Details */}
                <div className="flex-1 min-w-0">
                  <Link
                    href={`/products/${item.slug}`}
                    className="text-lg font-semibold text-gray-900 hover:text-primary-600 line-clamp-2"
                  >
                    {item.name}
                  </Link>

                  <div className="mt-2 flex items-center gap-2">
                    {item.stock > 0 ? (
                      <span className="text-sm text-green-600 font-medium">In Stock</span>
                    ) : (
                      <span className="text-sm text-red-600 font-medium">Out of Stock</span>
                    )}
                  </div>

                  <div className="mt-4 flex items-center gap-4">
                    {/* Quantity Selector */}
                    <div className="flex items-center border border-gray-300 rounded-lg">
                      <button
                        onClick={() => handleUpdateQuantity(item.id, item.quantity - 1, item.stock)}
                        className="px-3 py-1 hover:bg-gray-100 transition disabled:opacity-30 disabled:cursor-not-allowed"
                        disabled={item.quantity <= 1}
                      >
                        -
                      </button>
                      <span className="px-4 py-1 border-x border-gray-300 min-w-[3rem] text-center font-medium">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => handleUpdateQuantity(item.id, item.quantity + 1, item.stock)}
                        className="px-3 py-1 hover:bg-gray-100 transition disabled:opacity-30 disabled:cursor-not-allowed"
                        disabled={item.quantity >= item.stock}
                        title={item.quantity >= item.stock ? `Maximum stock: ${item.stock}` : ''}
                      >
                        +
                      </button>
                    </div>

                    {/* Remove Button */}
                    <button
                      onClick={() => handleRemoveItem(item.id, item.name)}
                      className="text-sm text-red-600 hover:text-red-700 font-medium transition"
                    >
                      Remove
                    </button>
                  </div>
                </div>

                {/* Price */}
                <div className="flex flex-col items-end justify-between">
                  <p className="text-2xl font-bold text-gray-900">
                    ${(parseFloat(item.price) * item.quantity).toFixed(2)}
                  </p>
                  <p className="text-sm text-gray-500">
                    ${parseFloat(item.price).toFixed(2)} each
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Order Summary */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg border border-gray-200 p-6 sticky top-4">
            <h2 className="text-xl font-semibold mb-4">Order Summary</h2>

            <div className="space-y-3 mb-6">
              <div className="flex justify-between text-gray-600">
                <span>Subtotal ({totalItems} items)</span>
                <span>${cartTotals ? cartTotals.subtotal.toFixed(2) : totalPrice.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>Shipping</span>
                <span className="text-green-600 font-medium">FREE</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>Tax (10%)</span>
                <span>${cartTotals ? cartTotals.tax.toFixed(2) : (totalPrice * 0.1).toFixed(2)}</span>
              </div>
              <div className="border-t border-gray-200 pt-3 flex justify-between text-lg font-bold">
                <span>Total</span>
                <span className="text-primary-600">
                  ${cartTotals ? cartTotals.total.toFixed(2) : (totalPrice * 1.1).toFixed(2)}
                </span>
              </div>
              {cartTotals && !cartTotals.validation.isValid && (
                <div className="pt-2 text-xs text-amber-600">
                  ⚠️ Cart validation: {cartTotals.validation.warnings.length} warning(s)
                </div>
              )}
            </div>

            <Link
              href="/checkout"
              className="block w-full bg-yellow-400 hover:bg-yellow-500 text-gray-900 font-semibold py-3 px-6 rounded-lg transition text-center"
            >
              Proceed to Checkout
            </Link>

            <Link
              href="/products"
              className="block w-full mt-3 text-center text-primary-600 hover:text-primary-700 font-medium py-2"
            >
              Continue Shopping
            </Link>

            {/* Savings Badge */}
            <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center gap-2 text-green-700">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
                <span className="font-semibold">
                  You're saving ${cartTotals ? (cartTotals.subtotal * 0.25).toFixed(2) : (totalPrice * 0.25).toFixed(2)}
                </span>
              </div>
              <p className="text-sm text-green-600 mt-1">25% off list prices + FREE shipping</p>
            </div>
          </div>
        </div>
      </div>
      </div>
    </div>
  );
}
