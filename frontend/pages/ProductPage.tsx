
import React, { useState, useEffect } from 'react';
import { Product, db, CartItem } from '../lib/mockDb';
import { api } from '../lib/apiClient';
import { ArrowLeft, Star, ShoppingBag, Truck, ShieldCheck, Share2, CreditCard, AlertCircle, CheckCircle, PenTool } from 'lucide-react';
import { ProductCard } from '../components/ProductCard';

interface Props {
  productId: string;
  onNavigate: (page: string) => void;
  onAddToCart: (product: Product, size?: string, color?: string) => void;
  onBuyNow: (product: Product, size?: string, color?: string) => void;
  onViewProduct: (product: Product) => void;
}

export const ProductPage: React.FC<Props> = ({ productId, onNavigate, onAddToCart, onBuyNow, onViewProduct }) => {
  const [product, setProduct] = useState<Product | null>(null);
  const [activeImage, setActiveImage] = useState('');
  const [similarProducts, setSimilarProducts] = useState<Product[]>([]);
  
  // Variant State
  const [selectedSize, setSelectedSize] = useState<string>('');
  const [selectedColor, setSelectedColor] = useState<string>('');

  // Review State
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [canReview, setCanReview] = useState(false);
  const [isReviewing, setIsReviewing] = useState(false);
  const [reviewForm, setReviewForm] = useState({ rating: 5, comment: '' });
  const [reviewSubmitting, setReviewSubmitting] = useState(false);

  useEffect(() => {
    // 1. Fetch Product
    const foundProduct = db.products.find(p => p.id === productId);
    if (foundProduct) {
      setProduct({...foundProduct}); // Clone to trigger re-renders on update
      
      // Handle legacy vs new image structure for initial display
      let initialImage = foundProduct.image;
      if (foundProduct.images && foundProduct.images.length > 0) {
          // If using new structure, prioritize explicit Main image
          const mainImg = foundProduct.images.find(img => img.isMain);
          initialImage = mainImg ? mainImg.url : foundProduct.images[0].url;
      }
      setActiveImage(initialImage);
      
      setSelectedSize('');
      setSelectedColor('');
      
      const similar = db.products.filter(p => p.category === foundProduct.category && p.id !== foundProduct.id);
      setSimilarProducts(similar);
      
      window.scrollTo(0, 0);
    }
  }, [productId]);

  // 2. Check Review Eligibility
  useEffect(() => {
      const checkUser = async () => {
          const savedUserStr = localStorage.getItem('nexus_user_session');
          if (savedUserStr) {
              const user = JSON.parse(savedUserStr);
              setCurrentUser(user);

              // Check if user bought this product and hasn't reviewed it
              const ordersRes = await api.orders.myOrders(user.token);
              if (ordersRes.success && ordersRes.data && product) {
                  // Find orders that are delivered/completed and contain this product
                  const eligibleOrders = ordersRes.data.filter(o => 
                      (o.status === 'delivered' || o.status === 'completed') && 
                      o.items.some((i: CartItem) => i.id === product.id)
                  );

                  // Check if ANY eligible order has NOT been reviewed
                  const hasUnreviewedOrder = eligibleOrders.some(order => {
                      const alreadyReviewed = product.reviews.some(r => r.userId === user.id && r.orderId === order.id);
                      return !alreadyReviewed;
                  });

                  setCanReview(hasUnreviewedOrder);
              }
          }
      };
      checkUser();
  }, [product]);

  if (!product) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-black flex items-center justify-center text-gray-900 dark:text-white">
        Loading...
      </div>
    );
  }

  // Derived Data for Variants
  const hasVariants = product.variants && product.variants.length > 0;
  
  // Explicitly cast to string[] to avoid 'unknown' inference in map callbacks
  const availableSizes = hasVariants 
    ? Array.from(new Set(product.variants!.map(v => v.size))) as string[]
    : [];

  const availableColors = hasVariants
    ? Array.from(new Set(product.variants!.map(v => v.color))) as string[]
    : [];

  // Logic: Check if specific combination is available
  const isVariantAvailable = (size: string, color: string) => {
    if (!hasVariants) return product.stock > 0;
    const v = product.variants!.find(v => v.size === size && v.color === color);
    return v && v.stock > 0;
  };

  // Logic: When size selected, check which colors are valid
  const isColorValidForSize = (color: string) => {
    if (!selectedSize) return true; // If no size selected, all colors technically visible
    return isVariantAvailable(selectedSize, color);
  };

  // Logic: When color selected, check which sizes are valid
  const isSizeValidForColor = (size: string) => {
    if (!selectedColor) return true;
    return isVariantAvailable(size, selectedColor);
  };

  const handleAddToCart = () => {
    if (hasVariants && (!selectedSize || !selectedColor)) {
      alert("Please select both size and color.");
      return;
    }
    onAddToCart(product, selectedSize, selectedColor);
  };

  const handleBuyNow = () => {
    if (hasVariants && (!selectedSize || !selectedColor)) {
      alert("Please select both size and color.");
      return;
    }
    onBuyNow(product, selectedSize, selectedColor);
  };

  const handleSubmitReview = async (e: React.FormEvent) => {
      e.preventDefault();
      setReviewSubmitting(true);
      if (currentUser) {
          const res = await api.products.addReview(product.id, reviewForm, currentUser.token);
          if (res.success) {
              // Update local state to reflect new review immediately
              setProduct(prev => {
                  if(!prev) return null;
                  const newReviews = [res.data, ...prev.reviews];
                  const newRating = newReviews.reduce((acc, r) => acc + r.rating, 0) / newReviews.length;
                  return {
                      ...prev,
                      reviews: newReviews,
                      rating: parseFloat(newRating.toFixed(1))
                  };
              });
              setIsReviewing(false);
              setCanReview(false); // Disable future reviews for this order (simplified)
          } else {
              alert(res.error);
          }
      }
      setReviewSubmitting(false);
  };

  const isOutOfStock = product.stock <= 0;
  // Specific Variant Stock Logic
  let currentStock = product.stock;
  if (hasVariants && selectedSize && selectedColor) {
      const v = product.variants!.find(v => v.size === selectedSize && v.color === selectedColor);
      currentStock = v ? v.stock : 0;
  }

  // Gallery Logic: Map ProductImage objects to simple URLs for display
  const displayImages = product.images && product.images.length > 0 
    ? product.images.map(img => img.url)
    : [product.image];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-black pt-10 pb-20 transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Back Button */}
        <button 
          onClick={() => onNavigate('home')}
          className="flex items-center gap-2 text-gray-500 dark:text-gray-400 hover:text-black dark:hover:text-white mb-8 transition-colors"
        >
          <ArrowLeft size={20} /> Back to Browse
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20">
          
          {/* Left: Gallery */}
          <div className="space-y-4">
            <div className="aspect-square bg-white dark:bg-gray-900 rounded-2xl overflow-hidden border border-gray-200 dark:border-gray-800 shadow-sm relative">
               <img 
                 src={activeImage} 
                 alt={product.name} 
                 className={`w-full h-full object-cover object-center transition-opacity ${currentStock === 0 ? 'opacity-50 grayscale' : ''}`}
               />
               {currentStock === 0 && (
                   <div className="absolute inset-0 flex items-center justify-center">
                       <span className="bg-black/70 text-white px-6 py-2 rounded-full font-bold uppercase tracking-widest backdrop-blur-sm">Sold Out</span>
                   </div>
               )}
            </div>
            <div className="grid grid-cols-4 gap-4">
               {displayImages.map((img, idx) => (
                 <div 
                   key={idx} 
                   onClick={() => setActiveImage(img)}
                   className={`aspect-square rounded-lg overflow-hidden cursor-pointer border-2 transition-all ${activeImage === img ? 'border-blue-500 opacity-100' : 'border-transparent opacity-60 hover:opacity-100'}`}
                 >
                   <img src={img} alt="" className="w-full h-full object-cover" />
                 </div>
               ))}
            </div>
          </div>

          {/* Right: Info */}
          <div className="flex flex-col">
            <div className="mb-2 flex items-center gap-2">
               <span className="text-blue-600 dark:text-blue-400 font-bold uppercase tracking-wider text-xs bg-blue-100 dark:bg-blue-500/10 px-2 py-1 rounded">
                 {product.category?.name || 'Collection'}
               </span>
               {currentStock <= 5 && currentStock > 0 && (
                 <span className="text-orange-600 dark:text-orange-400 font-bold uppercase tracking-wider text-xs bg-orange-100 dark:bg-orange-500/10 px-2 py-1 rounded">
                   Low Stock
                 </span>
               )}
            </div>
            
            <h1 className="text-4xl md:text-5xl font-black text-gray-900 dark:text-white leading-tight mb-4">{product.name}</h1>
            
            {/* Ratings */}
            <div className="flex items-center gap-4 mb-6">
               <div className="flex text-yellow-500">
                  {[1,2,3,4,5].map(star => (
                    <Star key={star} size={18} fill={star <= product.rating ? "currentColor" : "none"} strokeWidth={2} />
                  ))}
               </div>
               <span className="text-gray-500 dark:text-gray-400 text-sm">{product.reviews.length} reviews</span>
            </div>

            <p className="text-gray-700 dark:text-gray-300 text-lg leading-relaxed mb-8">
              {product.description}
            </p>

            <div className="text-3xl font-bold text-gray-900 dark:text-white mb-8">
              KES {product.price.toLocaleString()}
            </div>

            {/* VARIANT SELECTORS */}
            {hasVariants && (
              <div className="space-y-6 mb-8">
                {/* Size Selector */}
                <div>
                   <div className="flex justify-between mb-2">
                      <span className="font-bold text-gray-900 dark:text-white text-sm">Select Size</span>
                      <span className="text-gray-500 text-xs">Size Guide</span>
                   </div>
                   <div className="flex flex-wrap gap-3">
                      {availableSizes.map(size => {
                        const isValid = isSizeValidForColor(size);
                        return (
                          <button
                            key={size}
                            onClick={() => isValid && setSelectedSize(size)}
                            disabled={!isValid}
                            className={`min-w-[48px] h-12 px-4 rounded-lg font-bold border-2 transition-all 
                              ${!isValid 
                                ? 'opacity-30 cursor-not-allowed border-gray-200 dark:border-gray-800 line-through decoration-red-500' 
                                : selectedSize === size 
                                  ? 'border-blue-600 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400' 
                                  : 'border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:border-gray-400'
                              }
                            `}
                          >
                            {size}
                          </button>
                        );
                      })}
                   </div>
                </div>

                {/* Color Selector */}
                <div>
                   <span className="font-bold text-gray-900 dark:text-white text-sm mb-2 block">Select Color</span>
                   <div className="flex flex-wrap gap-3">
                      {availableColors.map(color => {
                        const isValid = isColorValidForSize(color);
                        return (
                          <button
                            key={color}
                            onClick={() => isValid && setSelectedColor(color)}
                            disabled={!isValid}
                            className={`px-4 h-10 rounded-full font-medium border-2 transition-all flex items-center gap-2
                              ${!isValid 
                                ? 'opacity-30 cursor-not-allowed border-gray-200 dark:border-gray-800 line-through decoration-gray-500' 
                                : selectedColor === color 
                                  ? 'border-blue-600 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400' 
                                  : 'border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:border-gray-400'
                              }
                            `}
                          >
                            <span 
                              className="w-3 h-3 rounded-full border border-gray-300"
                              style={{ backgroundColor: color.toLowerCase() }} 
                            />
                            {color}
                          </button>
                        );
                      })}
                   </div>
                </div>
              </div>
            )}
            
            {hasVariants && !currentStock && selectedSize && selectedColor && (
                 <div className="mb-6 flex items-center gap-2 text-red-600 bg-red-50 dark:bg-red-900/20 p-3 rounded-lg">
                    <AlertCircle size={18} />
                    <span className="text-sm font-medium">This combination is currently out of stock.</span>
                 </div>
            )}

            <div className="flex flex-col sm:flex-row gap-4 mb-10 border-b border-gray-200 dark:border-gray-800 pb-10">
               <button 
                 onClick={handleAddToCart}
                 disabled={currentStock <= 0}
                 className="flex-1 bg-gray-200 dark:bg-gray-800 hover:bg-gray-300 dark:hover:bg-gray-700 border border-gray-300 dark:border-gray-700 disabled:opacity-50 disabled:cursor-not-allowed text-gray-900 dark:text-white py-4 px-8 rounded-full font-bold text-lg flex items-center justify-center gap-2 transition-all"
               >
                 <ShoppingBag size={20} />
                 {currentStock <= 0 ? 'Out of Stock' : 'Add to Cart'}
               </button>

               <button 
                 onClick={handleBuyNow}
                 disabled={currentStock <= 0}
                 className="flex-1 bg-blue-600 hover:bg-blue-500 disabled:bg-gray-200 dark:disabled:bg-gray-700 disabled:text-gray-400 disabled:cursor-not-allowed text-white py-4 px-8 rounded-full font-bold text-lg flex items-center justify-center gap-2 transition-all shadow-lg shadow-blue-600/20"
               >
                 <CreditCard size={20} />
                 Buy Now
               </button>

               <button className="p-4 rounded-full border border-gray-300 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-900 dark:text-white transition-colors">
                  <Share2 size={24} />
               </button>
            </div>

            {/* Guarantees */}
            <div className="grid grid-cols-2 gap-4">
               <div className="flex items-start gap-3">
                  <div className="bg-white dark:bg-gray-800 p-2 rounded-lg text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-transparent shadow-sm">
                    <Truck size={20} />
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-900 dark:text-white text-sm">Fast Delivery</h4>
                    <p className="text-gray-500 dark:text-gray-500 text-xs mt-1">Countrywide shipping available</p>
                  </div>
               </div>
               <div className="flex items-start gap-3">
                  <div className="bg-white dark:bg-gray-800 p-2 rounded-lg text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-transparent shadow-sm">
                    <ShieldCheck size={20} />
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-900 dark:text-white text-sm">Secure Checkout</h4>
                    <p className="text-gray-500 dark:text-gray-500 text-xs mt-1">100% protected payments (M-Pesa/Card)</p>
                  </div>
               </div>
            </div>

          </div>
        </div>

        {/* Reviews Section */}
        <div className="mt-20 border-t border-gray-200 dark:border-gray-800 pt-16">
          <div className="flex justify-between items-center mb-8">
             <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Customer Reviews</h2>
             
             {/* Write Review Button Logic */}
             {canReview && !isReviewing && (
                 <button 
                   onClick={() => setIsReviewing(true)}
                   className="bg-black dark:bg-white text-white dark:text-black px-6 py-2 rounded-full font-bold text-sm flex items-center gap-2 hover:opacity-80 transition-opacity"
                 >
                    <PenTool size={16}/> Write a Review
                 </button>
             )}
          </div>

          {/* Review Form */}
          {isReviewing && (
              <div className="mb-10 bg-gray-50 dark:bg-gray-900 p-6 rounded-xl border border-gray-200 dark:border-gray-800">
                  <h3 className="font-bold text-lg mb-4">Share your experience</h3>
                  <form onSubmit={handleSubmitReview} className="space-y-4">
                      <div>
                          <label className="block text-sm font-medium mb-1">Rating</label>
                          <div className="flex gap-2">
                              {[1,2,3,4,5].map(s => (
                                  <button type="button" key={s} onClick={() => setReviewForm({...reviewForm, rating: s})} className="focus:outline-none transition-transform hover:scale-110">
                                      <Star size={24} fill={s <= reviewForm.rating ? "#EAB308" : "none"} stroke={s <= reviewForm.rating ? "#EAB308" : "currentColor"} className="text-gray-400" />
                                  </button>
                              ))}
                          </div>
                      </div>
                      <div>
                          <label className="block text-sm font-medium mb-1">Review</label>
                          <textarea 
                             required
                             rows={4}
                             value={reviewForm.comment}
                             onChange={e => setReviewForm({...reviewForm, comment: e.target.value})}
                             className="w-full bg-white dark:bg-black border border-gray-300 dark:border-gray-700 rounded-lg p-3 outline-none focus:border-blue-500"
                             placeholder="Tell us what you liked or didn't like..."
                          />
                      </div>
                      <div className="flex justify-end gap-3">
                          <button type="button" onClick={() => setIsReviewing(false)} className="text-gray-500 hover:text-black px-4 py-2">Cancel</button>
                          <button type="submit" disabled={reviewSubmitting} className="bg-blue-600 text-white px-6 py-2 rounded-lg font-bold disabled:opacity-50">
                             {reviewSubmitting ? 'Submitting...' : 'Post Review'}
                          </button>
                      </div>
                  </form>
              </div>
          )}

          {product.reviews.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {product.reviews.map(review => (
                <div key={review.id} className="bg-white dark:bg-gray-900 p-6 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <div className="flex items-center gap-2">
                         <h4 className="font-bold text-gray-900 dark:text-white">{review.userName}</h4>
                         {review.isVerified && (
                             <span className="text-[10px] font-bold uppercase tracking-wider bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 px-1.5 py-0.5 rounded flex items-center gap-0.5">
                                 <CheckCircle size={10} /> Verified
                             </span>
                         )}
                      </div>
                      <p className="text-xs text-gray-500">{review.date}</p>
                    </div>
                    <div className="flex text-yellow-500">
                      {[1,2,3,4,5].map(star => (
                        <Star key={star} size={14} fill={star <= review.rating ? "currentColor" : "none"} />
                      ))}
                    </div>
                  </div>
                  <p className="text-gray-600 dark:text-gray-300 text-sm leading-relaxed">"{review.comment}"</p>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-gray-500 italic">No reviews yet for this product.</div>
          )}
        </div>

        {/* Similar Products */}
        {similarProducts.length > 0 && (
          <div className="mt-20 border-t border-gray-200 dark:border-gray-800 pt-16">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-8">You May Also Like</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-8 gap-y-12">
               {similarProducts.slice(0, 4).map(p => (
                 <ProductCard 
                    key={p.id} 
                    product={p} 
                    onAddToCart={(p) => onAddToCart(p)} // Basic add for similar products (will default)
                    onViewProduct={onViewProduct}
                 />
               ))}
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
