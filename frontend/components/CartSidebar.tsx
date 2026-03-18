
import React from 'react';
import { X, Trash2, ArrowRight } from 'lucide-react';
import { CartItem } from '../lib/mockDb';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  items: CartItem[];
  onRemove: (id: string, size?: string, color?: string) => void;
  onCheckout: () => void;
}

export const CartSidebar: React.FC<Props> = ({ isOpen, onClose, items, onRemove, onCheckout }) => {
  const total = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 transition-opacity" 
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <div className={`fixed inset-y-0 right-0 z-50 w-full max-w-md bg-white dark:bg-gray-900 border-l border-gray-200 dark:border-gray-800 shadow-2xl transform transition-transform duration-300 ease-in-out ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}>
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-800">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Your Cart ({items.length})</h2>
            <button onClick={onClose} className="p-2 text-gray-500 dark:text-gray-400 hover:text-black dark:hover:text-white rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
              <X size={24} />
            </button>
          </div>

          {/* Items */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {items.length === 0 ? (
              <div className="text-center py-20">
                <p className="text-gray-500 dark:text-gray-400 mb-4">Your cart is empty.</p>
                <button onClick={onClose} className="text-blue-600 dark:text-blue-400 hover:text-blue-500 dark:hover:text-blue-300 font-medium">Continue Shopping</button>
              </div>
            ) : (
              items.map((item, idx) => (
                <div key={`${item.id}-${item.selectedSize}-${item.selectedColor}-${idx}`} className="flex gap-4">
                  <div className="h-24 w-24 flex-shrink-0 overflow-hidden rounded-md border border-gray-200 dark:border-gray-800">
                    <img
                      src={item.image}
                      alt={item.name}
                      className="h-full w-full object-cover object-center"
                    />
                  </div>

                  <div className="flex flex-1 flex-col">
                    <div>
                      <div className="flex justify-between text-base font-medium text-gray-900 dark:text-white">
                        <h3 className="line-clamp-1">{item.name}</h3>
                        <p className="ml-4">KES {item.price.toLocaleString()}</p>
                      </div>
                      <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{typeof item.category === 'object' ? item.category.name : item.category}</p>
                      {/* Size/Color Display */}
                      {(item.selectedSize || item.selectedColor) && (
                          <div className="mt-1 flex gap-2 text-xs text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-800 w-fit px-2 py-0.5 rounded border border-gray-200 dark:border-gray-700">
                             {item.selectedSize && <span>Size: <span className="font-bold text-gray-900 dark:text-white">{item.selectedSize}</span></span>}
                             {item.selectedSize && item.selectedColor && <span>|</span>}
                             {item.selectedColor && <span>Color: <span className="font-bold text-gray-900 dark:text-white">{item.selectedColor}</span></span>}
                          </div>
                      )}
                    </div>
                    <div className="flex flex-1 items-end justify-between text-sm">
                      <p className="text-gray-500 dark:text-gray-400">Qty {item.quantity}</p>

                      <button
                        type="button"
                        onClick={() => onRemove(item.id, item.selectedSize, item.selectedColor)}
                        className="font-medium text-red-500 dark:text-red-400 hover:text-red-400 dark:hover:text-red-300 flex items-center gap-1"
                      >
                        <Trash2 size={14} /> Remove
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer */}
          {items.length > 0 && (
            <div className="border-t border-gray-200 dark:border-gray-800 px-6 py-6 bg-gray-50 dark:bg-gray-900">
              <div className="flex justify-between text-base font-medium text-gray-900 dark:text-white mb-4">
                <p>Subtotal</p>
                <p>KES {total.toLocaleString()}</p>
              </div>
              <p className="mt-0.5 text-sm text-gray-500 dark:text-gray-500 mb-6">Shipping and taxes calculated at checkout.</p>
              <button
                onClick={onCheckout}
                className="flex items-center justify-center w-full rounded-md border border-transparent bg-blue-600 px-6 py-3 text-base font-medium text-white shadow-sm hover:bg-blue-700 transition-colors"
              >
                Checkout <ArrowRight className="ml-2" size={18} />
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  );
};
