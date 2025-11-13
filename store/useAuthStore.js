import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { authAPI } from "@/services/api";

const useAuthStore = create(
  persist(
    (set, get) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      isLoading: false,
      error: null,
      isInitialized: false,
      isHydrated: false,

      // Set hydrated flag
      setHydrated: () => {
        set({ isHydrated: true });
      },

      // Initialize from localStorage
      initialize: async () => {
        if (typeof window === "undefined" || get().isInitialized) return;

        const accessToken = localStorage.getItem("accessToken");
        const refreshToken = localStorage.getItem("refreshToken");

        if (accessToken && refreshToken) {
          set({ accessToken, refreshToken });

          try {
            // Fetch user data from Django
            const response = await authAPI.getCurrentUser();
            set({ user: response.data, isInitialized: true });
          } catch (error) {
            console.log("Failed to fetch user data:", error.message);
            localStorage.removeItem("accessToken");
            localStorage.removeItem("refreshToken");
            set({
              accessToken: null,
              refreshToken: null,
              user: null,
              isInitialized: true,
            });
          }
        } else {
          set({ isInitialized: true });
        }
      },

      // Login
      login: async (email, password) => {
        set({ isLoading: true, error: null });
        try {
          const response = await authAPI.login(email, password);
          const { access, refresh, user } = response.data;

          // Store tokens immediately
          localStorage.setItem("accessToken", access);
          localStorage.setItem("refreshToken", refresh);

          // Update state synchronously
          set({
            user,
            accessToken: access,
            refreshToken: refresh,
            isLoading: false,
            isHydrated: true,
          });

          // Force re-render by triggering storage event
          window.dispatchEvent(new Event("auth-update"));

          return { success: true, user };
        } catch (error) {
          const errorMessage = error.response?.data?.detail || "Login failed";
          set({ error: errorMessage, isLoading: false });
          return { success: false, error: errorMessage };
        }
      },

      // Register
      register: async (userData) => {
        set({ isLoading: true, error: null });
        try {
          // Step 1: Register with Django (primary auth)
          const response = await authAPI.register(userData);
          const { access, refresh, user } = response.data;

          // Step 2: Store tokens immediately
          localStorage.setItem("accessToken", access);
          localStorage.setItem("refreshToken", refresh);

          // Step 3: Update state synchronously
          set({
            user,
            accessToken: access,
            refreshToken: refresh,
            isLoading: false,
            isHydrated: true,
          });

          // Force re-render by triggering storage event
          window.dispatchEvent(new Event("auth-update"));

          return { success: true, user };
        } catch (error) {
          // Better error handling for registration
          let errorMessage = "Registration failed. Please try again.";

          if (error.response?.data) {
            const data = error.response.data;
            // Handle field-specific errors
            if (data.email)
              errorMessage = `Email: ${Array.isArray(data.email) ? data.email[0] : data.email}`;
            else if (data.username)
              errorMessage = `Username: ${Array.isArray(data.username) ? data.username[0] : data.username}`;
            else if (data.password)
              errorMessage = `Password: ${Array.isArray(data.password) ? data.password[0] : data.password}`;
            else if (data.detail) errorMessage = data.detail;
            else if (typeof data === "string") errorMessage = data;
          }

          set({ error: errorMessage, isLoading: false });
          return { success: false, error: errorMessage };
        }
      },

      // Logout
      logout: async () => {
        // Clear localStorage IMMEDIATELY to prevent race conditions
        localStorage.removeItem("accessToken");
        localStorage.removeItem("refreshToken");

        // Clear ALL auth-related cache
        if (typeof window !== "undefined") {
          // Clear sessionStorage too
          sessionStorage.clear();

          // Dispatch logout event for other tabs
          window.dispatchEvent(new Event("auth-logout"));
        }

        // Clear state
        set({
          user: null,
          accessToken: null,
          refreshToken: null,
          error: null,
          isHydrated: true,
        });

        // Background cleanup
        try {
          authAPI.logout();
        } catch (error) {
          console.log("Cleanup failed:", error);
        }
      },

      // Clear error
      clearError: () => set({ error: null }),
    }),
    {
      name: "auth-storage",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        user: state.user,
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
      }),
      onRehydrateStorage: () => (state) => {
        // Called when hydration is complete
        if (state) {
          state.setHydrated();
        }
      },
    }
  )
);

export default useAuthStore;
