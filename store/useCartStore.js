import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { calculateCartTotals, validateCartItem, cleanCart } from '@/utils/cartValidation';

// Helper to calculate totals with validation
const calculateTotals = (items) => {
  const validated = cleanCart(items);
  const { subtotal, totalItems } = calculateCartTotals(validated);
  
  return {
    totalItems,
    totalPrice: subtotal // Using subtotal as totalPrice (before tax)
  };
};

const useCartStore = create(
  persist(
    (set, get) => ({
      items: [],
      totalItems: 0,
      totalPrice: 0,

      // Add item to cart
      addItem: (product, quantity = 1) => {
        const { items } = get();
        const existingItem = items.find(item => item.id === product.id);

        // Ensure price is a number
        const normalizedProduct = {
          ...product,
          price: typeof product.price === 'number' ? product.price : parseFloat(product.price)
        };

        let newItems;
        if (existingItem) {
          // Update quantity if item exists
          newItems = items.map(item =>
            item.id === product.id
              ? { ...item, quantity: item.quantity + quantity }
              : item
          );
        } else {
          // Add new item
          newItems = [...items, { ...normalizedProduct, quantity }];
        }

        const { totalItems, totalPrice } = calculateTotals(newItems);
        set({ items: newItems, totalItems, totalPrice });
        
        // Dispatch event to notify navbar of cart update
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new Event('cart-update'));
        }
      },

      // Update item quantity
      updateQuantity: (productId, quantity) => {
        const { items } = get();
        const newItems = items.map(item =>
          item.id === productId ? { ...item, quantity } : item
        );

        const { totalItems, totalPrice } = calculateTotals(newItems);
        set({ items: newItems, totalItems, totalPrice });
        
        // Dispatch event
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new Event('cart-update'));
        }
      },

      // Remove item from cart
      removeItem: (productId) => {
        const { items } = get();
        const newItems = items.filter(item => item.id !== productId);

        const { totalItems, totalPrice } = calculateTotals(newItems);
        set({ items: newItems, totalItems, totalPrice });
        
        // Dispatch event
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new Event('cart-update'));
        }
      },

      // Clear cart
      clearCart: () => {
        set({ items: [], totalItems: 0, totalPrice: 0 });
        
        // Dispatch event
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new Event('cart-update'));
        }
      },

      // Get item by ID
      getItem: (productId) => {
        const { items } = get();
        return items.find(item => item.id === productId);
      },
    }),
    {
      name: 'cart-storage', // localStorage key
      getStorage: () => (typeof window !== 'undefined' ? localStorage : undefined),
      onRehydrateStorage: () => (state) => {
        // Called when hydration is complete
        // Trigger cart update event to update all components
        if (state && typeof window !== 'undefined') {
          // Recalculate totals after hydration
          const { items } = state;
          const { totalItems, totalPrice } = calculateTotals(items);
          state.totalItems = totalItems;
          state.totalPrice = totalPrice;
          
          // Dispatch event to notify components
          setTimeout(() => {
            window.dispatchEvent(new Event('cart-update'));
          }, 100);
        }
      },
    }
  )
);

export default useCartStore;

