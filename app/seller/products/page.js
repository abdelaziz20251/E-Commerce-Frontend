'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import useAuthStore from '@/store/useAuthStore';
import { productsAPI } from '@/services/api';
import { showToast } from '@/components/Toast';

export default function SellerProductsPage() {
  const router = useRouter();
  const { user, isHydrated } = useAuthStore();
  
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // all, published, unpublished

  useEffect(() => {
    if (isHydrated && (!user || user.role !== 'seller')) {
      router.push('/');
    } else if (isHydrated) {
      fetchProducts();
    }
  }, [user, isHydrated, router]);

  const fetchProducts = async () => {
    try {
      const response = await productsAPI.getAll({ seller: user.id });
      // Ensure we always have an array
      const productsData = Array.isArray(response.data) 
        ? response.data 
        : (response.data?.results || []);
      setProducts(productsData);
    } catch (error) {
      console.error('Failed to fetch products:', error);
      showToast.error('Failed to load products', 'Error');
      setProducts([]); // Set empty array on error
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (slug) => {
    if (!confirm('Are you sure you want to delete this product? This action requires admin approval and the product will be hidden immediately.')) {
      return;
    }

    try {
      await productsAPI.delete(slug);
      showToast.success('Product deletion requested. It will be hidden and pending admin approval.', 'Deletion Requested');
      fetchProducts();
    } catch (error) {
      console.error('Failed to delete product:', error);
      showToast.error('Failed to request product deletion', 'Error');
    }
  };

  const handleTogglePublish = async (slug, currentStatus) => {
    const action = currentStatus ? 'unpublish' : 'publish';
    
    try {
      await productsAPI.update(slug, { is_active: !currentStatus });
      showToast.success(
        `Product ${action}ed successfully`,
        'Success'
      );
      fetchProducts();
    } catch (error) {
      console.error(`Failed to ${action} product:`, error);
      showToast.error(`Failed to ${action} product`, 'Error');
    }
  };

  // Ensure products is always an array before filtering
  const productsArray = Array.isArray(products) ? products : [];
  
  const filteredProducts = productsArray.filter(product => {
    if (filter === 'published') return product.is_active;
    if (filter === 'unpublished') return !product.is_active;
    return true;
  });

  if (!isHydrated || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">My Products</h1>
            <p className="text-gray-600 mt-2">Manage your product listings</p>
          </div>
          <Link
            href="/seller/products/add"
            className="bg-primary-600 text-white px-6 py-3 rounded-lg hover:bg-primary-700 font-semibold flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add New Product
          </Link>
        </div>

        {/* Filter Tabs */}
        <div className="flex gap-4 mb-6 border-b border-gray-200">
          <button
            onClick={() => setFilter('all')}
            className={`pb-3 px-4 font-medium ${
              filter === 'all'
                ? 'text-primary-600 border-b-2 border-primary-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            All ({productsArray.length})
          </button>
          <button
            onClick={() => setFilter('published')}
            className={`pb-3 px-4 font-medium ${
              filter === 'published'
                ? 'text-primary-600 border-b-2 border-primary-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Published ({productsArray.filter(p => p.is_active).length})
          </button>
          <button
            onClick={() => setFilter('unpublished')}
            className={`pb-3 px-4 font-medium ${
              filter === 'unpublished'
                ? 'text-primary-600 border-b-2 border-primary-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Unpublished ({productsArray.filter(p => !p.is_active).length})
          </button>
        </div>

        {/* Products Grid */}
        {filteredProducts.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <div className="text-6xl mb-4">📦</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No Products Yet</h3>
            <p className="text-gray-600 mb-6">Start selling by adding your first product</p>
            <Link
              href="/seller/products/add"
              className="inline-block bg-primary-600 text-white px-6 py-3 rounded-lg hover:bg-primary-700 font-semibold"
            >
              Add Your First Product
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProducts.map((product) => (
              <div key={product.id} className="bg-white rounded-lg shadow overflow-hidden">
                {/* Product Image */}
                <div className="relative h-48 bg-gray-100">
                  {product.thumbnail_url || product.image_url ? (
                    <Image
                      src={product.thumbnail_url || product.image_url}
                      alt={product.name}
                      fill
                      className="object-cover"
                      loading="eager"
                      priority
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400">
                      No Image
                    </div>
                  )}
                  {product.is_featured && (
                    <span className="absolute top-2 right-2 bg-yellow-400 text-yellow-900 px-2 py-1 rounded text-xs font-semibold">
                      Featured
                    </span>
                  )}
                  {!product.is_active && (
                    <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                      <span className="bg-red-500 text-white px-3 py-1 rounded font-semibold">
                        {product.deletion_requested ? 'Pending Deletion' : 'Unpublished'}
                      </span>
                    </div>
                  )}
                </div>

                {/* Product Info */}
                <div className="p-4">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-2">
                    {product.name}
                  </h3>
                  
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <span className="text-2xl font-bold text-primary-600">
                        ${parseFloat(product.price).toFixed(2)}
                      </span>
                      {product.discount_percentage > 0 && (
                        <span className="ml-2 text-sm text-red-600">
                          -{product.discount_percentage}%
                        </span>
                      )}
                    </div>
                    <div className="text-sm">
                      {product.in_stock ? (
                        <span className="text-green-600">
                          {product.stock} in stock
                        </span>
                      ) : (
                        <span className="text-red-600">Out of stock</span>
                      )}
                    </div>
                  </div>

                  <div className="text-sm text-gray-500 mb-4">
                    <p>SKU: {product.sku}</p>
                  </div>

                  {/* Actions */}
                  <div className="space-y-2">
                    <div className="flex gap-2">
                      <Link
                        href={`/products/${product.slug}`}
                        className="flex-1 text-center px-3 py-2 bg-gray-100 text-gray-700 rounded hover:bg-gray-200 font-medium text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        View
                      </Link>
                      <Link
                        href={`/seller/products/edit/${product.slug}`}
                        className="flex-1 text-center px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 font-medium text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Edit
                      </Link>
                    </div>
                    {product.deletion_requested ? (
                      <div className="text-center px-3 py-2 bg-gray-300 text-gray-600 rounded font-medium text-sm cursor-not-allowed">
                        Deletion Pending Admin Approval
                      </div>
                    ) : (
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleTogglePublish(product.slug, product.is_active)}
                          className={`flex-1 px-3 py-2 rounded hover:opacity-90 font-medium text-sm ${
                            product.is_active
                              ? 'bg-orange-500 text-white hover:bg-orange-600'
                              : 'bg-green-600 text-white hover:bg-green-700'
                          }`}
                        >
                          {product.is_active ? 'Unpublish' : 'Publish'}
                        </button>
                        <button
                          onClick={() => handleDelete(product.slug)}
                          className="px-3 py-2 bg-red-600 text-white rounded hover:bg-red-700 font-medium text-sm"
                        >
                          Delete
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
