/**
 * Cart Data Validation Utility
 * Ensures localStorage cart data aligns with database schema and business logic
 */

// Tax rate (10%)
export const TAX_RATE = 0.10;

// Shipping cost (FREE for now)
export const SHIPPING_COST = 0.00;

/**
 * Validate cart item structure matches database schema
 * @param {Object} item - Cart item from localStorage
 * @returns {Object} - { isValid: boolean, errors: string[] }
 */
export function validateCartItem(item) {
  const errors = [];

  // Required fields (matching CartItem model)
  // Support both numeric IDs and UUID strings
  if (!item.id || (typeof item.id !== 'number' && typeof item.id !== 'string')) {
    errors.push(`Invalid product ID: ${item.id}`);
  }

  if (!item.name || typeof item.name !== 'string') {
    errors.push('Product name is required');
  }

  // Price can be a number or a string that can be converted to a number
  const price = typeof item.price === 'number' ? item.price : parseFloat(item.price);
  if (isNaN(price) || price < 0) {
    errors.push(`Invalid price: ${item.price}`);
  }

  if (!Number.isInteger(item.quantity) || item.quantity <= 0) {
    errors.push(`Invalid quantity: ${item.quantity}`);
  }

  if (item.stock !== undefined && (!Number.isInteger(item.stock) || item.stock < 0)) {
    errors.push(`Invalid stock: ${item.stock}`);
  }

  // Business logic validation
  if (item.stock !== undefined && item.quantity > item.stock) {
    errors.push(`Quantity (${item.quantity}) exceeds available stock (${item.stock})`);
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Validate entire cart structure
 * @param {Array} items - Cart items from localStorage
 * @returns {Object} - { isValid: boolean, errors: string[], warnings: string[] }
 */
export function validateCart(items) {
  const errors = [];
  const warnings = [];

  if (!Array.isArray(items)) {
    return {
      isValid: false,
      errors: ['Cart items must be an array'],
      warnings: []
    };
  }

  // Validate each item
  items.forEach((item, index) => {
    const validation = validateCartItem(item);
    if (!validation.isValid) {
      errors.push(`Item ${index + 1} (${item.name || 'Unknown'}): ${validation.errors.join(', ')}`);
    }
  });

  // Check for duplicates (should be handled by cart store)
  const ids = items.map(item => item.id);
  const duplicates = ids.filter((id, index) => ids.indexOf(id) !== index);
  if (duplicates.length > 0) {
    warnings.push(`Duplicate items found: ${duplicates.join(', ')}`);
  }

  // Check if cart is too large
  if (items.length > 100) {
    warnings.push('Cart has too many items (>100)');
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
}

/**
 * Calculate and validate cart totals (matching Order model calculations)
 * @param {Array} items - Cart items
 * @returns {Object} - Calculated totals with validation
 */
export function calculateCartTotals(items) {
  // Validate items first
  const validation = validateCart(items);
  
  if (!validation.isValid) {
    console.error('Cart validation failed:', validation.errors);
  }

  // Calculate subtotal (sum of all item prices * quantities)
  const subtotal = items.reduce((sum, item) => {
    const itemPrice = parseFloat(item.price) || 0;
    const itemQuantity = parseInt(item.quantity) || 0;
    return sum + (itemPrice * itemQuantity);
  }, 0);

  // Calculate tax (10% of subtotal)
  const tax = subtotal * TAX_RATE;

  // Calculate shipping (FREE)
  const shipping = SHIPPING_COST;

  // Calculate total (subtotal + tax + shipping)
  const total = subtotal + tax + shipping;

  // Total items count
  const totalItems = items.reduce((sum, item) => sum + (parseInt(item.quantity) || 0), 0);

  // Round to 2 decimal places
  return {
    subtotal: Math.round(subtotal * 100) / 100,
    tax: Math.round(tax * 100) / 100,
    shipping: Math.round(shipping * 100) / 100,
    total: Math.round(total * 100) / 100,
    totalItems,
    validation
  };
}

/**
 * Verify cart calculations match expected values
 * @param {Object} currentTotals - Current calculated totals
 * @param {Object} expectedTotals - Expected totals
 * @returns {Object} - { isValid: boolean, differences: Object }
 */
export function verifyCalculations(currentTotals, expectedTotals) {
  const differences = {};
  let isValid = true;

  const fields = ['subtotal', 'tax', 'shipping', 'total', 'totalItems'];

  fields.forEach(field => {
    const current = parseFloat(currentTotals[field]) || 0;
    const expected = parseFloat(expectedTotals[field]) || 0;
    const diff = Math.abs(current - expected);

    // Allow 1 cent difference due to rounding
    if (diff > 0.01) {
      differences[field] = {
        current,
        expected,
        difference: diff
      };
      isValid = false;
    }
  });

  return {
    isValid,
    differences
  };
}

/**
 * Sync cart with backend (for authenticated users)
 * @param {Array} localItems - Items from localStorage
 * @param {Function} cartAPI - Cart API methods
 * @returns {Promise<Object>} - Sync result
 */
export async function syncCartWithBackend(localItems, cartAPI) {
  try {
    // Get cart from backend
    const backendCart = await cartAPI.get();
    const backendItems = backendCart.data.items || [];

    // Compare and merge
    const syncedItems = [...localItems];
    let changes = 0;

    backendItems.forEach(backendItem => {
      const localIndex = syncedItems.findIndex(item => item.id === backendItem.product.id);
      
      if (localIndex >= 0) {
        // Item exists in both - use higher quantity
        if (backendItem.quantity > syncedItems[localIndex].quantity) {
          syncedItems[localIndex].quantity = backendItem.quantity;
          changes++;
        }
      } else {
        // Item only in backend - add to local
        syncedItems.push({
          id: backendItem.product.id,
          name: backendItem.product.name,
          price: parseFloat(backendItem.product.price),
          image: backendItem.product.thumbnail_url || backendItem.product.image_url,
          slug: backendItem.product.slug,
          stock: backendItem.product.stock,
          quantity: backendItem.quantity
        });
        changes++;
      }
    });

    return {
      success: true,
      syncedItems,
      changes,
      message: changes > 0 ? `Synced ${changes} items with server` : 'Cart is up to date'
    };

  } catch (error) {
    console.error('Failed to sync cart with backend:', error);
    return {
      success: false,
      syncedItems: localItems,
      changes: 0,
      message: 'Failed to sync with server, using local cart',
      error: error.message
    };
  }
}

/**
 * Clean invalid items from cart
 * @param {Array} items - Cart items
 * @returns {Array} - Cleaned items
 */
export function cleanCart(items) {
  return items.filter(item => {
    const validation = validateCartItem(item);
    if (!validation.isValid) {
      console.warn(`Removing invalid cart item:`, item, validation.errors);
      return false;
    }
    return true;
  });
}

/**
 * Get cart health status
 * @param {Array} items - Cart items
 * @returns {Object} - Health status
 */
export function getCartHealth(items) {
  const validation = validateCart(items);
  const totals = calculateCartTotals(items);

  return {
    isHealthy: validation.isValid && totals.validation.isValid,
    itemCount: items.length,
    totalItems: totals.totalItems,
    totalValue: totals.total,
    errors: [...validation.errors, ...(totals.validation.errors || [])],
    warnings: [...validation.warnings, ...(totals.validation.warnings || [])],
    lastChecked: new Date().toISOString()
  };
}

