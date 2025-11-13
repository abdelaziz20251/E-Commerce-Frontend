'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import Image from 'next/image';
import ReactDOM from 'react-dom';
import useAuthStore from '@/store/useAuthStore';
import { productsAPI, categoriesAPI } from '@/services/api';
import { uploadProductImageWithThumbnail } from '@/utils/localStorage';
import { showToast } from '@/components/Toast';

// Polyfill for findDOMNode (removed in React 19)
if (typeof window !== 'undefined' && !ReactDOM.findDOMNode) {
  ReactDOM.findDOMNode = (node) => {
    if (node == null) return null;
    if (node.nodeType === 1) return node;
    return node?.current || null;
  };
}

// Dynamic import for Quill (client-side only)
const ReactQuill = dynamic(() => import('react-quill'), { ssr: false });
import 'react-quill/dist/quill.snow.css';

export default function AddProductPage() {
  const router = useRouter();
  const { user, isHydrated } = useAuthStore();
  
  // Form state
  const [formData, setFormData] = useState({
    name: '',
    category: '',
    description: '',
    price: '',
    discount_percentage: 0,
    shipping_fee: 0,
    stock: '',
    brand: '',
    weight: '',
    refund_policy: '30-day money-back guarantee',
    tags: [],
    technical_specs: {},
    is_active: true,
    is_featured: false
  });

  // UI state
  const [categories, setCategories] = useState([]);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);

  // Tag input
  const [tagInput, setTagInput] = useState('');

  // Technical specs
  const [specKey, setSpecKey] = useState('');
  const [specValue, setSpecValue] = useState('');

  // Quill modules
  const quillModules = {
    toolbar: [
      [{ header: [1, 2, 3, false] }],
      ['bold', 'italic', 'underline', 'strike'],
      [{ list: 'ordered' }, { list: 'bullet' }],
      [{ color: [] }, { background: [] }],
      ['link'],
      ['clean']
    ]
  };

  useEffect(() => {
    if (isHydrated && (!user || user.role !== 'seller')) {
      router.push('/');
    } else if (isHydrated) {
      fetchCategories();
    }
  }, [user, isHydrated, router]);

  const fetchCategories = async () => {
    try {
      const response = await categoriesAPI.getAll();
      // Ensure we always set an array
      const categoriesData = Array.isArray(response.data) 
        ? response.data 
        : (response.data?.results || []);
      setCategories(categoriesData);
    } catch (error) {
      console.error('Failed to fetch categories:', error);
      showToast.error('Failed to load categories', 'Error');
      setCategories([]); // Ensure categories is always an array even on error
    }
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        showToast.error('Please select an image file', 'Invalid File');
        return;
      }

      // Validate file size (5MB max)
      if (file.size > 5 * 1024 * 1024) {
        showToast.error('Image must be less than 5MB', 'File Too Large');
        return;
      }

      setImageFile(file);
      
      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAddTag = () => {
    if (tagInput.trim() && !formData.tags.includes(tagInput.trim())) {
      setFormData({
        ...formData,
        tags: [...formData.tags, tagInput.trim()]
      });
      setTagInput('');
    }
  };

  const handleRemoveTag = (tagToRemove) => {
    setFormData({
      ...formData,
      tags: formData.tags.filter(tag => tag !== tagToRemove)
    });
  };

  const handleAddSpec = () => {
    if (specKey.trim() && specValue.trim()) {
      setFormData({
        ...formData,
        technical_specs: {
          ...formData.technical_specs,
          [specKey.trim()]: specValue.trim()
        }
      });
      setSpecKey('');
      setSpecValue('');
    }
  };

  const handleRemoveSpec = (keyToRemove) => {
    const newSpecs = { ...formData.technical_specs };
    delete newSpecs[keyToRemove];
    setFormData({
      ...formData,
      technical_specs: newSpecs
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Validate required fields
      if (!formData.name || !formData.category || !formData.description || !formData.price || !formData.stock) {
        showToast.error('Please fill in all required fields', 'Validation Error');
        setLoading(false);
        return;
      }

      let imageUrl = '';
      let thumbnailUrl = '';

      // Upload image if provided
      if (imageFile) {
        setUploadingImage(true);
        const uploadResult = await uploadProductImageWithThumbnail(imageFile, 'temp');
        
        if (!uploadResult.success) {
          throw new Error(uploadResult.error || 'Failed to upload image');
        }

        imageUrl = uploadResult.imageUrl;
        thumbnailUrl = uploadResult.thumbnailUrl;
        setUploadingImage(false);
      }

      // Prepare product data
      const productData = {
        ...formData,
        price: parseFloat(formData.price),
        discount_percentage: parseFloat(formData.discount_percentage) || 0,
        shipping_fee: parseFloat(formData.shipping_fee) || 0,
        stock: parseInt(formData.stock),
        weight: formData.weight ? parseFloat(formData.weight) : null,
        image_url: imageUrl,
        thumbnail_url: thumbnailUrl,
        tags: formData.tags,
        technical_specs: formData.technical_specs
      };

      // Create product
      const response = await productsAPI.create(productData);

      showToast.success('Product created successfully!', 'Success');
      
      // Redirect to seller products page
      setTimeout(() => {
        router.push('/seller/products');
      }, 1500);

    } catch (error) {
      console.error('Error creating product:', error);
      showToast.error(
        error.response?.data?.detail || error.message || 'Failed to create product',
        'Error'
      );
    } finally {
      setLoading(false);
      setUploadingImage(false);
    }
  };

  if (!isHydrated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Add New Product</h1>
          <p className="text-gray-600 mt-2">Create a new product listing for your store</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Basic Information */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Basic Information</h2>
            
            <div className="space-y-6">
              {/* Product Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Product Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="Enter product name"
                />
                <p className="text-sm text-gray-500 mt-1">
                  URL will be auto-generated from product name
                </p>
              </div>

              {/* Category */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Category <span className="text-red-500">*</span>
                </label>
                <select
                  required
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  <option value="">Select a category</option>
                  {Array.isArray(categories) && categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Brand */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Brand
                </label>
                <input
                  type="text"
                  value={formData.brand}
                  onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="Enter brand name"
                />
              </div>
            </div>
          </div>

          {/* Pricing & Inventory */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Pricing & Inventory</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Price */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Price ($) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  required
                  min="0"
                  step="0.01"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="0.00"
                />
              </div>

              {/* Discount */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Discount (%)
                </label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  step="0.01"
                  value={formData.discount_percentage}
                  onChange={(e) => setFormData({ ...formData, discount_percentage: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="0"
                />
              </div>

              {/* Shipping Fee */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Shipping Fee ($)
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.shipping_fee}
                  onChange={(e) => setFormData({ ...formData, shipping_fee: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="0.00"
                />
                <p className="text-sm text-gray-500 mt-1">Set to 0 for free shipping</p>
              </div>

              {/* Stock */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Stock Quantity <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  required
                  min="0"
                  value={formData.stock}
                  onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="0"
                />
              </div>

              {/* Weight */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Weight (kg)
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.weight}
                  onChange={(e) => setFormData({ ...formData, weight: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="0.00"
                />
              </div>
            </div>

            {/* Price Summary */}
            {formData.price > 0 && (
              <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <h3 className="font-medium text-blue-900 mb-2">Price Summary</h3>
                <div className="space-y-1 text-sm text-blue-800">
                  <div className="flex justify-between">
                    <span>Original Price:</span>
                    <span>${parseFloat(formData.price || 0).toFixed(2)}</span>
                  </div>
                  {formData.discount_percentage > 0 && (
                    <>
                      <div className="flex justify-between text-red-600">
                        <span>Discount ({formData.discount_percentage}%):</span>
                        <span>-${(parseFloat(formData.price || 0) * parseFloat(formData.discount_percentage || 0) / 100).toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between font-semibold">
                        <span>Discounted Price:</span>
                        <span>${(parseFloat(formData.price || 0) - (parseFloat(formData.price || 0) * parseFloat(formData.discount_percentage || 0) / 100)).toFixed(2)}</span>
                      </div>
                    </>
                  )}
                  {parseFloat(formData.shipping_fee || 0) > 0 && (
                    <div className="flex justify-between">
                      <span>Shipping Fee:</span>
                      <span>+${parseFloat(formData.shipping_fee || 0).toFixed(2)}</span>
                    </div>
                  )}
                  <div className="border-t border-blue-300 pt-1 mt-1 flex justify-between font-bold text-base">
                    <span>Final Price:</span>
                    <span>${(
                      (parseFloat(formData.price || 0) - (parseFloat(formData.price || 0) * parseFloat(formData.discount_percentage || 0) / 100)) +
                      parseFloat(formData.shipping_fee || 0)
                    ).toFixed(2)}</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Product Image */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Product Image</h2>
            
            <div className="space-y-4">
              <div className="flex items-center justify-center w-full">
                <label className="flex flex-col items-center justify-center w-full h-64 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100">
                  {imagePreview ? (
                    <div className="relative w-full h-full">
                      <Image
                        src={imagePreview}
                        alt="Preview"
                        fill
                        className="object-contain p-4"
                        loading="eager"
                        priority
                        unoptimized
                      />
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                      <svg className="w-12 h-12 mb-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                      </svg>
                      <p className="mb-2 text-sm text-gray-500">
                        <span className="font-semibold">Click to upload</span> or drag and drop
                      </p>
                      <p className="text-xs text-gray-500">PNG, JPG, WebP up to 5MB</p>
                    </div>
                  )}
                  <input
                    type="file"
                    className="hidden"
                    accept="image/*"
                    onChange={handleImageChange}
                  />
                </label>
              </div>
              
              {imageFile && (
                <div className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg">
                  <span className="text-sm text-green-800">✓ {imageFile.name}</span>
                  <button
                    type="button"
                    onClick={() => {
                      setImageFile(null);
                      setImagePreview(null);
                    }}
                    className="text-red-600 hover:text-red-700 text-sm"
                  >
                    Remove
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Description (WYSIWYG) */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">
              About This Item <span className="text-red-500">*</span>
            </h2>
            <ReactQuill
              theme="snow"
              value={formData.description}
              onChange={(value) => setFormData({ ...formData, description: value })}
              modules={quillModules}
              className="bg-white"
              placeholder="Write a detailed description of your product..."
            />
          </div>

          {/* Technical Specifications */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Technical Specifications (Optional)</h2>
            
            {/* Add Spec Form */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <input
                type="text"
                value={specKey}
                onChange={(e) => setSpecKey(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="Specification name"
              />
              <input
                type="text"
                value={specValue}
                onChange={(e) => setSpecValue(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="Specification value"
              />
              <button
                type="button"
                onClick={handleAddSpec}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
              >
                Add Specification
              </button>
            </div>

            {/* Specs List */}
            {Object.keys(formData.technical_specs).length > 0 && (
              <div className="space-y-2">
                {Object.entries(formData.technical_specs).map(([key, value]) => (
                  <div key={key} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <span className="font-medium text-gray-700">{key}:</span>
                      <span className="ml-2 text-gray-600">{value}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveSpec(key)}
                      className="text-red-600 hover:text-red-700"
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Tags */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Tags (Optional)</h2>
            
            {/* Add Tag Form */}
            <div className="flex gap-4 mb-4">
              <input
                type="text"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTag())}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="Enter a tag and press Add"
              />
              <button
                type="button"
                onClick={handleAddTag}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
              >
                Add Tag
              </button>
            </div>

            {/* Tags List */}
            {formData.tags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {formData.tags.map((tag, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center gap-2 px-3 py-1 bg-primary-100 text-primary-800 rounded-full text-sm font-medium"
                  >
                    {tag}
                    <button
                      type="button"
                      onClick={() => handleRemoveTag(tag)}
                      className="hover:text-primary-900"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Refund Policy */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Refund Policy</h2>
            <textarea
              value={formData.refund_policy}
              onChange={(e) => setFormData({ ...formData, refund_policy: e.target.value })}
              rows="4"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              placeholder="Enter your refund/return policy..."
            ></textarea>
          </div>

          {/* Status Toggles */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Product Status</h2>
            
            <div className="space-y-4">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData.is_active}
                  onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                  className="w-5 h-5 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                />
                <span className="ml-3">
                  <span className="font-medium text-gray-900">Active Product</span>
                  <p className="text-sm text-gray-500">Product will be visible to customers</p>
                </span>
              </label>

              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData.is_featured}
                  onChange={(e) => setFormData({ ...formData, is_featured: e.target.checked })}
                  className="w-5 h-5 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                />
                <span className="ml-3">
                  <span className="font-medium text-gray-900">Featured Product</span>
                  <p className="text-sm text-gray-500">Product will be highlighted on the homepage</p>
                </span>
              </label>
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex justify-end gap-4">
            <button
              type="button"
              onClick={() => router.push('/seller/products')}
              className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || uploadingImage}
              className="px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 font-semibold disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {uploadingImage ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  Uploading Image...
                </>
              ) : loading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  Creating Product...
                </>
              ) : (
                'Create Product'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

