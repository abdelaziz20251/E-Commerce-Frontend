/**
 * Local Image Upload Service
 * Uploads images as FormData to Django backend for local storage
 */

/**
 * Upload a product image to Django backend
 * @param {File} file - The image file to upload
 * @param {string} productId - The product ID (optional, for organization)
 * @returns {Promise<Object>} - Upload result with URL
 */
export async function uploadProductImage(file, productId = null) {
  try {
    // Validate file
    if (!file) {
      throw new Error('No file provided');
    }

    // Check file type
    const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (!validTypes.includes(file.type)) {
      throw new Error('Invalid file type. Please upload an image (JPEG, PNG, WebP, or GIF)');
    }

    // Check file size (max 5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      throw new Error('File too large. Maximum size is 5MB');
    }

    // Convert to FormData for Django upload
    const formData = new FormData();
    formData.append('image', file);
    if (productId) {
      formData.append('product_id', productId);
    }

    // Get API URL
    const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
    
    // Get auth token from localStorage
    const token = localStorage.getItem('accessToken');

    // Upload to Django backend
    const response = await fetch(`${API_URL}/api/products/upload_image/`, {
      method: 'POST',
      headers: {
        'Authorization': token ? `Bearer ${token}` : '',
      },
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Upload failed' }));
      throw new Error(errorData.error || 'Upload failed');
    }

    const data = await response.json();
    return {
      success: true,
      url: data.url,
      path: data.path,
      fileName: file.name,
      fileSize: file.size,
      mimeType: file.type
    };

  } catch (error) {
    console.error('Error uploading image:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Upload multiple product images
 * @param {FileList|Array} files - Array of files to upload
 * @param {string} productId - The product ID
 * @returns {Promise<Array>} - Array of upload results
 */
export async function uploadMultipleProductImages(files, productId) {
  const filesArray = Array.from(files);
  const uploadPromises = filesArray.map(file => uploadProductImage(file, productId));
  return Promise.all(uploadPromises);
}

/**
 * Convert image to base64 for preview/storage
 * @param {File} file - The file to convert
 * @returns {Promise<string>} - Base64 data URL
 */
export function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

/**
 * Upload product image with automatic thumbnail creation
 * Creates both full-size and thumbnail versions
 * @param {File} file - The original image file
 * @param {string} productId - The product ID
 * @returns {Promise<Object>} - Upload result with both URLs
 */
export async function uploadProductImageWithThumbnail(file, productId) {
  try {
    // Upload original image
    const originalUpload = await uploadProductImage(file, productId);
    
    if (!originalUpload.success) {
      throw new Error(originalUpload.error);
    }

    // For now, return the same URL for both image and thumbnail
    // In a production environment, you might want to implement server-side thumbnail generation
    return {
      success: true,
      imageUrl: originalUpload.url,
      thumbnailUrl: originalUpload.url, // Same URL for now
      imagePath: originalUpload.path,
      thumbnailPath: originalUpload.path,
    };

  } catch (error) {
    console.error('Error uploading image with thumbnail:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

