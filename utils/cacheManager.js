/**
 * Cache Manager Utility
 * Ensures localStorage and browser cache stay in sync
 */

/**
 * Clear all authentication-related cache
 */
export function clearAuthCache() {
  if (typeof window === 'undefined') return;

  // Clear localStorage
  const authKeys = ['accessToken', 'refreshToken', 'auth-storage'];
  authKeys.forEach(key => localStorage.removeItem(key));

  // Clear sessionStorage
  sessionStorage.clear();

  // Force cache busting by adding timestamp to requests
  if ('caches' in window) {
    caches.keys().then(names => {
      names.forEach(name => {
        if (name.includes('auth') || name.includes('user')) {
          caches.delete(name);
        }
      });
    });
  }
}

/**
 * Verify localStorage and state are in sync
 */
export function verifyAuthSync() {
  if (typeof window === 'undefined') return true;

  const accessToken = localStorage.getItem('accessToken');
  const refreshToken = localStorage.getItem('refreshToken');
  const authStorage = localStorage.getItem('auth-storage');

  let authState = null;
  try {
    authState = authStorage ? JSON.parse(authStorage) : null;
  } catch (e) {
    console.error('Failed to parse auth storage:', e);
    return false;
  }

  // Check if tokens match state
  if (authState?.state) {
    const stateToken = authState.state.accessToken;
    const stateRefresh = authState.state.refreshToken;

    if (stateToken !== accessToken || stateRefresh !== refreshToken) {
      console.warn('Auth state mismatch detected');
      return false;
    }
  }

  return true;
}

/**
 * Force sync localStorage with current auth state
 */
export function forceSyncAuth(authState) {
  if (typeof window === 'undefined') return;

  if (authState.accessToken && authState.refreshToken) {
    localStorage.setItem('accessToken', authState.accessToken);
    localStorage.setItem('refreshToken', authState.refreshToken);
  } else {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
  }

  // Trigger storage event for other tabs
  window.dispatchEvent(new Event('storage'));
}

/**
 * Get auth tokens from localStorage (cache-safe)
 */
export function getAuthTokens() {
  if (typeof window === 'undefined') return null;

  const accessToken = localStorage.getItem('accessToken');
  const refreshToken = localStorage.getItem('refreshToken');

  if (!accessToken || !refreshToken) return null;

  return { accessToken, refreshToken };
}

/**
 * Clear all app cache (nuclear option)
 */
export function clearAllCache() {
  if (typeof window === 'undefined') return;

  // Clear localStorage
  localStorage.clear();

  // Clear sessionStorage
  sessionStorage.clear();

  // Clear service worker cache
  if ('caches' in window) {
    caches.keys().then(names => {
      names.forEach(name => caches.delete(name));
    });
  }

  // Dispatch clear event
  window.dispatchEvent(new Event('cache-cleared'));
}

/**
 * Refresh page cache (for auth state changes)
 */
export function refreshPageCache() {
  if (typeof window === 'undefined') return;

  // Force reload from server (bypass cache)
  if (window.location.reload) {
    window.location.reload(true);
  } else {
    window.location.href = window.location.href;
  }
}

/**
 * Set cache headers for fetch requests
 */
export function getCacheHeaders() {
  return {
    'Cache-Control': 'no-cache, no-store, must-revalidate',
    'Pragma': 'no-cache',
    'Expires': '0'
  };
}

/**
 * Monitor localStorage changes across tabs
 */
export function setupCrossTabSync(callback) {
  if (typeof window === 'undefined') return () => {};

  const handleStorageChange = (e) => {
    if (e.key === 'accessToken' || e.key === 'refreshToken' || e.key === 'auth-storage') {
      callback(e);
    }
  };

  window.addEventListener('storage', handleStorageChange);

  return () => {
    window.removeEventListener('storage', handleStorageChange);
  };
}

/**
 * Validate token expiration
 */
export function isTokenExpired(token) {
  if (!token) return true;

  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    const exp = payload.exp * 1000; // Convert to milliseconds
    return Date.now() >= exp;
  } catch (e) {
    return true;
  }
}

/**
 * Get token expiration time
 */
export function getTokenExpiration(token) {
  if (!token) return null;

  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return new Date(payload.exp * 1000);
  } catch (e) {
    return null;
  }
}

