'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { productsAPI, reviewsAPI } from '@/services/api';
import useCartStore from '@/store/useCartStore';
import { showToast } from '@/components/Toast';
import ReviewSection from '@/components/ReviewSection';

export default function ProductDetailPage() {
  const params = useParams();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [selectedImage, setSelectedImage] = useState(0);
  const [addedToCart, setAddedToCart] = useState(false);
  const { addItem } = useCartStore();

  useEffect(() => {
    if (params.slug) {
      fetchProduct();
    }
  }, [params.slug]);

  const fetchProduct = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await productsAPI.getBySlug(params.slug);
      setProduct(response.data);
    } catch (err) {
      console.error('Failed to fetch product:', err);
      setError('Product not found');
    } finally {
      setLoading(false);
    }
  };

  const handleAddToCart = () => {
    if (product && product.stock > 0) {
      // Add to cart
      addItem({
        id: product.id,
        name: product.name,
        price: parseFloat(product.price),
        image: product.thumbnail_url || product.image_url,
        slug: product.slug,
        stock: product.stock,
      }, quantity);
      
      // Show success toast
      showToast.success(
        `${quantity} ${product.name} ${quantity > 1 ? 'have' : 'has'} been added to your cart!`,
        'Added to Cart'
      );
      
      // Change button state temporarily
      setAddedToCart(true);
      setTimeout(() => {
        setAddedToCart(false);
      }, 2000);
    }
  };

  const handleBuyNow = () => {
    handleAddToCart();
    window.location.href = '/cart';
  };

  const handleReviewSubmit = async (reviewData) => {
    try {
      await reviewsAPI.create({
        product: product.id,
        ...reviewData
      });
      // Refresh product to get updated reviews
      fetchProduct();
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to submit review');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Product Not Found</h1>
          <Link href="/products" className="text-primary-600 hover:text-primary-700">
            ← Back to Products
          </Link>
        </div>
      </div>
    );
  }

  const images = product.images || [
    { image_url: product.image_url || product.thumbnail_url }
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Breadcrumb */}
      <nav className="mb-6 text-sm">
        <ol className="flex items-center space-x-2">
          <li><Link href="/" className="text-gray-500 hover:text-primary-600">Home</Link></li>
          <li className="text-gray-400">/</li>
          <li><Link href="/products" className="text-gray-500 hover:text-primary-600">Products</Link></li>
          <li className="text-gray-400">/</li>
          <li className="text-gray-900 font-medium">{product.name}</li>
        </ol>
      </nav>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left Column - Images */}
        <div className="space-y-4">
          {/* Main Image */}
          <div className="relative bg-white rounded-lg overflow-hidden border border-gray-200 aspect-square">
            <Image
              src={images[selectedImage]?.image_url || product.image_url || '/placeholder.png'}
              alt={product.name}
              fill
              className="object-cover"
              loading="eager"
              priority
              unoptimized
            />
            {product.is_featured && (
              <span className="absolute top-4 right-4 bg-yellow-400 text-yellow-900 px-3 py-1 rounded-full text-sm font-semibold">
                Featured
              </span>
            )}
          </div>

          {/* Thumbnail Gallery */}
          {images.length > 1 && (
            <div className="grid grid-cols-6 gap-2">
              {images.map((img, idx) => (
                <button
                  key={idx}
                  onClick={() => setSelectedImage(idx)}
                  className={`relative aspect-square rounded-lg overflow-hidden border-2 ${
                    selectedImage === idx ? 'border-primary-600' : 'border-gray-200'
                  }`}
                >
                  <Image
                    src={img.image_url}
                    alt={`${product.name} ${idx + 1}`}
                    fill
                    className="object-cover"
                    loading="eager"
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Right Column - Product Info */}
        <div className="space-y-6">
          {/* Title and Rating */}
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">{product.name}</h1>
            {product.average_rating > 0 && product.review_count > 0 && (
              <div className="flex items-center gap-4">
                <div className="flex items-center">
                  <div className="flex text-yellow-400">
                    {[...Array(5)].map((_, i) => (
                      <svg 
                        key={i} 
                        className={`w-5 h-5 ${i < Math.floor(product.average_rating) ? 'fill-current' : 'fill-gray-300'}`} 
                        viewBox="0 0 20 20"
                      >
                        <path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z" />
                      </svg>
                    ))}
                  </div>
                  <span className="ml-2 text-sm text-gray-600">{product.average_rating.toFixed(1)}</span>
                </div>
                <span className="text-sm text-gray-500">{product.review_count} rating{product.review_count !== 1 ? 's' : ''}</span>
              </div>
            )}
          </div>

          {/* Price */}
          <div className="border-t border-b border-gray-200 py-4">
            <div className="flex items-baseline gap-3">
              <span className="text-sm text-gray-500">List Price:</span>
              <span className="text-sm text-gray-500 line-through">
                ${(parseFloat(product.price) * 1.33).toFixed(2)}
              </span>
            </div>
            <div className="flex items-baseline gap-3 mt-2">
              <span className="text-red-600 text-2xl font-bold">
                -25%
              </span>
              <span className="text-4xl font-bold text-gray-900">
                ${parseFloat(product.price).toFixed(2)}
              </span>
            </div>
          </div>

          {/* Stock Status */}
          <div>
            {product.stock > 0 ? (
              <p className="text-green-600 font-semibold text-lg">In Stock</p>
            ) : (
              <p className="text-red-600 font-semibold text-lg">Out of Stock</p>
            )}
          </div>

          {/* Product Details */}
          <div className="space-y-3">
            <div className="flex">
              <span className="w-40 text-gray-600">Brand</span>
              <span className="font-medium">{product.brand || 'Generic'}</span>
            </div>
            <div className="flex">
              <span className="w-40 text-gray-600">Capacity</span>
              <span className="font-medium">4 Liters</span>
            </div>
            <div className="flex">
              <span className="w-40 text-gray-600">Configuration</span>
              <span className="font-medium">Counter Top, Freezerless</span>
            </div>
          </div>

          {/* Description */}
          <div>
            <h3 className="font-semibold text-lg mb-2">About this item</h3>
            <div 
              className="text-gray-700 space-y-2 prose prose-sm max-w-none"
              dangerouslySetInnerHTML={{ __html: product.description }}
            />
          </div>

          {/* Quantity and Actions */}
          <div className="border-t border-gray-200 pt-6 space-y-4">
            <div className="flex items-center gap-4">
              <label className="font-medium">Quantity:</label>
              <select
                value={quantity}
                onChange={(e) => setQuantity(parseInt(e.target.value))}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                disabled={product.stock === 0}
              >
                {[...Array(Math.min(10, product.stock))].map((_, i) => (
                  <option key={i + 1} value={i + 1}>
                    {i + 1}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-3">
              <button
                onClick={handleAddToCart}
                disabled={product.stock === 0 || addedToCart}
                className={`w-full font-semibold py-3 px-6 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 ${
                  addedToCart
                    ? 'bg-green-500 hover:bg-green-600 text-white'
                    : 'bg-yellow-400 hover:bg-yellow-500 text-gray-900'
                }`}
              >
                {addedToCart ? (
                  <>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Added!
                  </>
                ) : (
                  'Add to Cart'
                )}
              </button>
              <button
                onClick={handleBuyNow}
                disabled={product.stock === 0}
                className="w-full bg-orange-500 hover:bg-orange-600 text-white font-semibold py-3 px-6 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Buy Now
              </button>
            </div>
          </div>

          {/* Additional Info */}
          <div className="border-t border-gray-200 pt-4 space-y-2 text-sm">
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span>Secure transaction</span>
            </div>
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
              </svg>
              <span>Payment: Secure transaction</span>
            </div>
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
              </svg>
              <span>Ships from: Amazon.com</span>
            </div>
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>30-day refund/replacement</span>
            </div>
          </div>
        </div>
      </div>

      {/* Reviews Section */}
      <div className="mt-12">
        <ReviewSection 
          product={product}
          reviews={product.reviews || []}
          onReviewSubmit={handleReviewSubmit}
        />
      </div>
    </div>
  );
}

