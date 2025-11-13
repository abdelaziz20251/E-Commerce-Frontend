'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import useAuthStore from '@/store/useAuthStore';
import { reviewsAPI } from '@/services/api';
import { showToast } from './Toast';

export default function ReviewSection({ product, reviews = [], onReviewSubmit }) {
  const { user, accessToken } = useAuthStore();
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [canReview, setCanReview] = useState(false);
  const [checkingReviewEligibility, setCheckingReviewEligibility] = useState(false);
  const [formData, setFormData] = useState({
    rating: 5,
    title: '',
    comment: '',
    review_image: null
  });
  const [imagePreview, setImagePreview] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [editingReview, setEditingReview] = useState(null);
  const [editFormData, setEditFormData] = useState({
    rating: 5,
    title: '',
    comment: '',
    review_image: null
  });
  const [editImagePreview, setEditImagePreview] = useState(null);

  // Compute authentication status
  const isAuthenticated = !!(user && accessToken);

  const hasReviewed = reviews.some(review => review.user === user?.id);

  // Check if user can review this product
  useEffect(() => {
    if (isAuthenticated && user?.role === 'buyer' && product?.id) {
      checkReviewEligibility();
    }
  }, [isAuthenticated, user, product]);

  const checkReviewEligibility = async () => {
    setCheckingReviewEligibility(true);
    try {
      const response = await reviewsAPI.canReview(product.id);
      setCanReview(response.data.can_review);
    } catch (error) {
      console.error('Error checking review eligibility:', error);
      setCanReview(false);
    } finally {
      setCheckingReviewEligibility(false);
    }
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        showToast.error('Please select a valid image file', 'Invalid File');
        return;
      }
      
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        showToast.error('Image size must be less than 5MB', 'File Too Large');
        return;
      }

      setFormData({ ...formData, review_image: file });
      
      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    setFormData({ ...formData, review_image: null });
    setImagePreview(null);
  };

  const removeEditImage = () => {
    setEditFormData({ ...editFormData, review_image: null });
    setEditImagePreview(null);
  };

  const handleEditImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        showToast.error('Please select a valid image file', 'Invalid File');
        return;
      }
      
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        showToast.error('Image size must be less than 5MB', 'File Too Large');
        return;
      }

      setEditFormData({ ...editFormData, review_image: file });
      
      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setEditImagePreview(e.target.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const startEditReview = (review) => {
    setEditingReview(review);
    setEditFormData({
      rating: review.rating,
      title: review.title || '',
      comment: review.comment,
      review_image: null
    });
    setEditImagePreview(review.review_image || null);
  };

  const cancelEditReview = () => {
    setEditingReview(null);
    setEditFormData({ rating: 5, title: '', comment: '', review_image: null });
    setEditImagePreview(null);
  };

  const handleDeleteReview = async (reviewId) => {
    if (!window.confirm('Are you sure you want to delete this review? This action cannot be undone.')) {
      return;
    }

    try {
      await reviewsAPI.delete(reviewId);
      showToast.success('Review deleted successfully!', 'Success');
      // Refresh product to get updated reviews
      window.location.reload();
    } catch (error) {
      showToast.error(error.response?.data?.message || 'Failed to delete review', 'Error');
    }
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    
    if (!editingReview) return;

    setSubmitting(true);
    try {
      // Create FormData for file upload
      const formDataToSend = new FormData();
      formDataToSend.append('rating', editFormData.rating);
      formDataToSend.append('title', editFormData.title);
      formDataToSend.append('comment', editFormData.comment);
      
      if (editFormData.review_image) {
        formDataToSend.append('review_image', editFormData.review_image);
      }

      await reviewsAPI.update(editingReview.id, formDataToSend);
      showToast.success('Review updated successfully!', 'Success');
      cancelEditReview();
      // Refresh product to get updated reviews
      window.location.reload();
    } catch (error) {
      showToast.error(error.response?.data?.message || 'Failed to update review', 'Error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!isAuthenticated) {
      showToast.error('Please login to leave a review', 'Authentication Required');
      return;
    }

    if (user?.role !== 'buyer') {
      showToast.error('Only buyers can leave reviews', 'Review Not Allowed');
      return;
    }

    if (!canReview) {
      showToast.error('You can only review products you have purchased', 'Review Not Allowed');
      return;
    }

    setSubmitting(true);
    try {
      // Create FormData for file upload
      const formDataToSend = new FormData();
      formDataToSend.append('product', product.id);
      formDataToSend.append('rating', formData.rating);
      formDataToSend.append('title', formData.title);
      formDataToSend.append('comment', formData.comment);
      
      if (formData.review_image) {
        formDataToSend.append('review_image', formData.review_image);
      }

      await onReviewSubmit(formDataToSend);
      showToast.success('Review submitted successfully!', 'Success');
      setFormData({ rating: 5, title: '', comment: '', review_image: null });
      setImagePreview(null);
      setShowReviewForm(false);
      setCanReview(false); // User can't review again
    } catch (error) {
      showToast.error(error.message || 'Failed to submit review', 'Error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mt-12 border-t pt-8">
      <h2 className="text-2xl font-bold mb-6">Customer Reviews</h2>


      {/* Overall Rating */}
      {reviews.length > 0 && (
        <div className="bg-gray-50 rounded-lg p-6 mb-6">
          <div className="flex items-center gap-6">
            <div className="text-center">
              <div className="text-5xl font-bold text-gray-900">{parseFloat(product.average_rating).toFixed(1)}</div>
              <div className="flex text-yellow-400 justify-center mt-2">
                {[...Array(5)].map((_, i) => (
                  <svg 
                    key={i} 
                    className={`w-5 h-5 ${i < Math.floor(parseFloat(product.average_rating)) ? 'fill-current' : 'fill-gray-300'}`} 
                    viewBox="0 0 20 20"
                  >
                    <path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z" />
                  </svg>
                ))}
              </div>
              <div className="text-sm text-gray-600 mt-1">{product.review_count} reviews</div>
            </div>
          </div>
        </div>
      )}

      {/* Write Review Button */}
      {isAuthenticated && !hasReviewed && user?.role === 'buyer' && (
        <div className="mb-6">
          <button
            onClick={() => setShowReviewForm(!showReviewForm)}
            className="px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 font-medium"
          >
            {showReviewForm ? 'Cancel' : 'Write a Review'}
          </button>
          
          {/* Purchase Verification Notice */}
          {checkingReviewEligibility ? (
            <div className="mt-2 flex items-center gap-2 text-gray-600">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary-600"></div>
              <span>Checking review eligibility...</span>
            </div>
          ) : !canReview ? (
            <div className="mt-2 text-gray-600 bg-yellow-50 rounded-lg p-3">
              <div className="flex items-center gap-2">
                <svg className="w-4 h-4 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
                <span className="text-sm">You can only review products you have purchased. Purchase this product to leave a verified review.</span>
              </div>
            </div>
          ) : (
            <div className="mt-2 text-gray-600 bg-green-50 rounded-lg p-3">
              <div className="flex items-center gap-2">
                <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span className="text-sm">Verified purchase - Your review will be marked as verified.</span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Login Prompt for Non-Authenticated Users */}
      {!isAuthenticated && (
        <div className="mb-6">
          <div className="bg-gray-50 rounded-lg p-4 text-center">
            <p className="text-gray-600 mb-3">Want to share your thoughts about this product?</p>
            <Link
              href="/login"
              className="inline-flex items-center px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 font-medium"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
              </svg>
              Login to Write a Review
            </Link>
          </div>
        </div>
      )}

      {/* Review Form */}
      {showReviewForm && (
        <form onSubmit={handleSubmit} className="bg-gray-50 rounded-lg p-6 mb-6">
          <h3 className="font-semibold text-lg mb-4">Write Your Review</h3>
          
          {/* Rating */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Rating <span className="text-red-500">*</span>
            </label>
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setFormData({ ...formData, rating: star })}
                  className="focus:outline-none"
                >
                  <svg 
                    className={`w-8 h-8 ${star <= formData.rating ? 'fill-yellow-400' : 'fill-gray-300'}`}
                    viewBox="0 0 20 20"
                  >
                    <path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z" />
                  </svg>
                </button>
              ))}
              <span className="ml-2 text-gray-600">{formData.rating} star{formData.rating !== 1 ? 's' : ''}</span>
            </div>
          </div>

          {/* Title */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Review Title
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="Summarize your experience"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            />
          </div>

          {/* Comment */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Your Review <span className="text-red-500">*</span>
            </label>
            <textarea
              value={formData.comment}
              onChange={(e) => setFormData({ ...formData, comment: e.target.value })}
              required
              rows={4}
              placeholder="Tell others about your experience with this product"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            />
          </div>

          {/* Image Upload */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Product Photo (Optional)
            </label>
            <div className="space-y-3">
              <input
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100"
              />
              <p className="text-xs text-gray-500">
                Upload a photo of the product (max 5MB, JPG/PNG/GIF)
              </p>
              
              {/* Image Preview */}
              {imagePreview && (
                <div className="relative inline-block">
                  <Image
                    src={imagePreview}
                    alt="Review image preview"
                    width={200}
                    height={200}
                    className="rounded-lg border border-gray-300 object-cover"
                  />
                  <button
                    type="button"
                    onClick={removeImage}
                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              )}
            </div>
          </div>

          <div className="flex gap-3">
            <button
              type="submit"
              disabled={submitting}
              className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {submitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Submitting...
                </>
              ) : (
                'Submit Review'
              )}
            </button>
            <button
              type="button"
              onClick={() => setShowReviewForm(false)}
              className="px-6 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 font-medium"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {/* Edit Review Form */}
      {editingReview && (
        <form onSubmit={handleEditSubmit} className="bg-blue-50 rounded-lg p-6 mb-6 border-2 border-blue-200">
          <h3 className="font-semibold text-lg mb-4 text-blue-800">Edit Your Review</h3>
          
          {/* Rating */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Rating <span className="text-red-500">*</span>
            </label>
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setEditFormData({ ...editFormData, rating: star })}
                  className="focus:outline-none"
                >
                  <svg 
                    className={`w-8 h-8 ${star <= editFormData.rating ? 'fill-yellow-400' : 'fill-gray-300'}`}
                    viewBox="0 0 20 20"
                  >
                    <path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z" />
                  </svg>
                </button>
              ))}
              <span className="ml-2 text-gray-600">{editFormData.rating} star{editFormData.rating !== 1 ? 's' : ''}</span>
            </div>
          </div>

          {/* Title */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Review Title
            </label>
            <input
              type="text"
              value={editFormData.title}
              onChange={(e) => setEditFormData({ ...editFormData, title: e.target.value })}
              placeholder="Summarize your experience"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            />
          </div>

          {/* Comment */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Your Review <span className="text-red-500">*</span>
            </label>
            <textarea
              value={editFormData.comment}
              onChange={(e) => setEditFormData({ ...editFormData, comment: e.target.value })}
              required
              rows={4}
              placeholder="Tell others about your experience with this product"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            />
          </div>

          {/* Image Upload */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Product Photo (Optional)
            </label>
            <div className="space-y-3">
              <input
                type="file"
                accept="image/*"
                onChange={handleEditImageUpload}
                className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100"
              />
              <p className="text-xs text-gray-500">
                Upload a photo of the product (max 5MB, JPG/PNG/GIF)
              </p>
              
              {/* Image Preview */}
              {editImagePreview && (
                <div className="relative inline-block">
                  <Image
                    src={editImagePreview}
                    alt="Review image preview"
                    width={200}
                    height={200}
                    className="rounded-lg border border-gray-300 object-cover"
                  />
                  <button
                    type="button"
                    onClick={removeEditImage}
                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              )}
            </div>
          </div>

          <div className="flex gap-3">
            <button
              type="submit"
              disabled={submitting}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {submitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Updating...
                </>
              ) : (
                'Update Review'
              )}
            </button>
            <button
              type="button"
              onClick={cancelEditReview}
              className="px-6 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 font-medium"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {/* Reviews List */}
      <div className="space-y-6">
        {reviews.length === 0 ? (
          <p className="text-gray-500 text-center py-8">No reviews yet. Be the first to review!</p>
        ) : (
          reviews.map((review) => (
            <div key={review.id} className="border-b border-gray-200 pb-6">
              {/* Review Header */}
              <div className="flex items-start justify-between mb-2">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold">{review.user_name}</span>
                    {review.is_verified_purchase && (
                      <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                        Verified Purchase
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <div className="flex text-yellow-400">
                      {[...Array(5)].map((_, i) => (
                        <svg 
                          key={i} 
                          className={`w-4 h-4 ${i < review.rating ? 'fill-current' : 'fill-gray-300'}`}
                          viewBox="0 0 20 20"
                        >
                          <path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z" />
                        </svg>
                      ))}
                    </div>
                    <span className="text-sm text-gray-500">
                      {new Date(review.created_at).toLocaleDateString()}
                    </span>
                  </div>
                </div>
                
                {/* Edit/Delete Buttons - Only show for the current user's review */}
                {isAuthenticated && user?.id === review.user && (
                  <div className="flex gap-2">
                    <button
                      onClick={() => startEditReview(review)}
                      className="text-blue-600 hover:text-blue-800 text-sm font-medium flex items-center gap-1"
                      title="Edit review"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                      Edit
                    </button>
                    <button
                      onClick={() => handleDeleteReview(review.id)}
                      className="text-red-600 hover:text-red-800 text-sm font-medium flex items-center gap-1"
                      title="Delete review"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                      Delete
                    </button>
                  </div>
                )}
              </div>

              {/* Review Content */}
              {review.title && (
                <h4 className="font-semibold text-gray-900 mb-2">{review.title}</h4>
              )}
              <p className="text-gray-700 mb-3">{review.comment}</p>
              
              {/* Review Image */}
              {review.review_image && (
                <div className="mt-3">
                  <Image
                    src={review.review_image}
                    alt="Product review image"
                    width={300}
                    height={300}
                    className="rounded-lg border border-gray-200 object-cover"
                  />
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}

