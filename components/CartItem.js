'use client';

import Image from 'next/image';
import useCartStore from '@/store/useCartStore';

export default function CartItem({ item }) {
  const { updateItem, removeItem, isLoading } = useCartStore();

  const handleQuantityChange = async (newQuantity) => {
    if (newQuantity < 1) return;
    await updateItem(item.id, newQuantity);
  };

  const handleRemove = async () => {
    await removeItem(item.id);
  };

  return (
    <div className="flex items-center gap-4 p-4 bg-white rounded-lg shadow">
      <div className="relative h-24 w-24 flex-shrink-0">
        {item.product.image_url || item.product.thumbnail_url ? (
          <Image
            src={item.product.thumbnail_url || item.product.image_url}
            alt={item.product.name}
            fill
            className="object-cover rounded"
          />
        ) : (
          <div className="w-full h-full bg-gray-200 flex items-center justify-center rounded">
            <span className="text-gray-400 text-xs">No Image</span>
          </div>
        )}
      </div>

      <div className="flex-grow">
        <h3 className="font-semibold text-gray-900">{item.product.name}</h3>
        <p className="text-sm text-gray-500">${parseFloat(item.product.price).toFixed(2)} each</p>
        <p className="text-sm font-semibold text-primary-600 mt-1">
          Subtotal: ${parseFloat(item.subtotal).toFixed(2)}
        </p>
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={() => handleQuantityChange(item.quantity - 1)}
          disabled={isLoading || item.quantity <= 1}
          className="px-2 py-1 bg-gray-200 rounded hover:bg-gray-300 disabled:opacity-50"
        >
          -
        </button>
        <span className="px-4 py-1 bg-gray-100 rounded">{item.quantity}</span>
        <button
          onClick={() => handleQuantityChange(item.quantity + 1)}
          disabled={isLoading}
          className="px-2 py-1 bg-gray-200 rounded hover:bg-gray-300 disabled:opacity-50"
        >
          +
        </button>
      </div>

      <button
        onClick={handleRemove}
        disabled={isLoading}
        className="text-red-600 hover:text-red-800 disabled:opacity-50"
      >
        <svg
          className="w-6 h-6"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
          />
        </svg>
      </button>
    </div>
  );
}

