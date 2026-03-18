
import React from 'react';
import { Plus, X } from 'lucide-react';
import { Product } from '../lib/mockDb';

interface Props {
  product: Product;
  onAddToCart: (product: Product) => void;
  onViewProduct?: (product: Product) => void;
}

export const ProductCard: React.FC<Props> = ({ product, onAddToCart, onViewProduct }) => {
  const isOutOfStock = product.stock <= 0;
  const categoryName = typeof product.category === 'object' ? product.category?.name : product.category;

  return (
    <div className={`group relative bg-white dark:bg-gray-900 rounded-xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 border border-gray-200 dark:border-gray-800 ${isOutOfStock ? 'opacity-70' : ''}`}>
      {/* Image Container */}
      <div 
        className="aspect-[3/4] overflow-hidden bg-gray-100 dark:bg-gray-800 relative cursor-pointer"
        onClick={() => onViewProduct && onViewProduct(product)}
      >
        <img 
          src={product.image} 
          alt={product.name} 
          className={`h-full w-full object-cover object-center transition-transform duration-500 ${!isOutOfStock && 'group-hover:scale-105'}`}
        />
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 dark:group-hover:bg-black/20 transition-colors duration-300" />
        
        {/* Out of Stock Overlay */}
        {isOutOfStock && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                <span className="text-white font-bold border-2 border-white px-4 py-2 uppercase tracking-widest -rotate-12">Sold Out</span>
            </div>
        )}

        {/* Quick Add Button */}
        <button 
          onClick={(e) => {
             e.stopPropagation();
             !isOutOfStock && onAddToCart(product);
          }}
          disabled={isOutOfStock}
          className={`absolute bottom-4 right-4 p-3 rounded-full shadow-lg translate-y-12 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300 ${isOutOfStock ? 'bg-gray-200 dark:bg-gray-700 text-gray-400 cursor-not-allowed hidden' : 'bg-white dark:bg-white text-black hover:bg-blue-600 hover:text-white'}`}
        >
          <Plus size={20} strokeWidth={2.5} />
        </button>
      </div>

      {/* Content */}
      <div 
        className="p-4 cursor-pointer" 
        onClick={() => onViewProduct && onViewProduct(product)}
      >
        <div className="flex justify-between items-start mb-1">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white leading-tight group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">{product.name}</h3>
        </div>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">{categoryName || 'Collection'}</p>
        <div className="flex items-center justify-between">
          <span className="text-xl font-bold text-gray-900 dark:text-white">KES {product.price.toLocaleString()}</span>
          {!isOutOfStock && product.stock < 10 && (
            <span className="text-xs font-medium text-orange-500 dark:text-orange-400 bg-orange-100 dark:bg-orange-400/10 px-2 py-1 rounded">
              Only {product.stock} left
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
