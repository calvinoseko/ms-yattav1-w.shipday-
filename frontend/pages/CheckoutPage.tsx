
import React, { useState, useEffect, useRef } from 'react';
import { MapPin, Loader, ArrowRight, CheckCircle, AlertCircle, Home, Smartphone, ArrowLeft, Plus } from 'lucide-react';
import { Product, User, CartItem, Address } from '../lib/mockDb';
import { api } from '../lib/apiClient';

interface Props {
  items: CartItem[];
  user: User | null;
  onNavigate: (page: string) => void;
  onOrderSuccess: () => void;
  isDirectBuy: boolean;
}

export const CheckoutPage: React.FC<Props> = ({ items, user, onNavigate, onOrderSuccess, isDirectBuy }) => {
  const [loadingLoc, setLoadingLoc] = useState(false);
  const [processingStep, setProcessingStep] = useState<'idle' | 'creating_order' | 'initiating_payment' | 'polling'>('idle');
  const [orderPlaced, setOrderPlaced] = useState(false);
  const [error, setError] = useState('');
  
  const [useSavedAddress, setUseSavedAddress] = useState(true);
  const [selectedAddressId, setSelectedAddressId] = useState<string>('');
  
  const [paymentPhone, setPaymentPhone] = useState('');
  
  // Updated state to match DB Address interface (removed zip, added landmark)
  const [oneTimeAddress, setOneTimeAddress] = useState({
    street: '',
    city: 'Nairobi', // Defaulting to Nairobi as per common local context
    estate: '',
    landmark: ''
  });

  const pollIntervalRef = useRef<number | null>(null);

  // Initialize defaults
  useEffect(() => {
    if (user?.addresses && user.addresses.length > 0) {
      const defaultAddr = user.addresses.find(a => a.isDefault) || user.addresses[0];
      setSelectedAddressId(defaultAddr.id);
      setUseSavedAddress(true);
    } else {
      setUseSavedAddress(false);
    }
    
    if(user?.phone) setPaymentPhone(user.phone);
  }, [user]);

  useEffect(() => {
    return () => {
        if(pollIntervalRef.current) window.clearInterval(pollIntervalRef.current);
    }
  }, []);

  const total = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  const handleGetLocation = () => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser");
      return;
    }
    setLoadingLoc(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setTimeout(() => {
          setOneTimeAddress(prev => ({
            ...prev,
            street: `Detected Location (${position.coords.latitude.toFixed(4)}, ${position.coords.longitude.toFixed(4)})`,
            city: 'Nairobi'
          }));
          setLoadingLoc(false);
        }, 1500);
      },
      (error) => {
        console.error(error);
        alert("Unable to retrieve your location");
        setLoadingLoc(false);
      }
    );
  };

  const startPolling = (orderId: string) => {
      setProcessingStep('polling');
      let attempts = 0;
      
      pollIntervalRef.current = window.setInterval(async () => {
          attempts++;
          if(attempts > 20) { 
             if(pollIntervalRef.current) window.clearInterval(pollIntervalRef.current);
             setError("Payment timeout. Please check if you received the prompt.");
             setProcessingStep('idle');
             return;
          }

          const res = await api.orders.get(orderId, user?.token || '');
          if(res.success && res.data && res.data.status === 'completed') {
             if(pollIntervalRef.current) window.clearInterval(pollIntervalRef.current);
             setOrderPlaced(true);
             setTimeout(() => {
                 onOrderSuccess();
             }, 500);
          }
      }, 2000);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    
    setProcessingStep('creating_order');
    setError('');

    try {
        let orderPayload: { items: CartItem[], addressId?: string, oneTimeAddress?: Partial<Address> } = { items };
        
        if (useSavedAddress) {
             if (!selectedAddressId) {
                 throw new Error("Please select a delivery address");
             }
             orderPayload.addressId = selectedAddressId;
        } else {
             if (!oneTimeAddress.street || !oneTimeAddress.city) {
                 throw new Error("Please fill in required delivery details (Street and City)");
             }
             orderPayload.oneTimeAddress = {
                 street: oneTimeAddress.street,
                 city: oneTimeAddress.city,
                 estate: oneTimeAddress.estate,
                 landmark: oneTimeAddress.landmark,
                 recipientName: user.name,
                 recipientPhone: paymentPhone || user.phone || ''
             };
        }

        const orderRes = await api.orders.create(orderPayload, user.token);
        
        if (!orderRes.success || !orderRes.data) {
            throw new Error(orderRes.error || 'Failed to create order');
        }

        const orderId = orderRes.data.id;

        setProcessingStep('initiating_payment');
        const payRes = await api.payments.initiate({
            orderId,
            provider: 'mpesa',
            phone: paymentPhone
        }, user.token);

        if(!payRes.success) {
            throw new Error(payRes.error || 'Failed to initiate payment');
        }

        startPolling(orderId);

    } catch (err: any) {
        setError(err.message || 'An unexpected error occurred');
        setProcessingStep('idle');
    }
  };

  if (orderPlaced) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-black flex items-center justify-center p-4">
        <div className="bg-white dark:bg-gray-900 p-8 rounded-2xl max-w-md w-full text-center border border-gray-200 dark:border-gray-800 shadow-xl">
          <div className="w-16 h-16 bg-green-100 dark:bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="text-green-600 dark:text-green-500" size={32} />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Payment Successful!</h2>
          <p className="text-gray-500 dark:text-gray-400 mb-6">Your order has been confirmed.</p>
          <button onClick={() => onNavigate('home')} className="bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 px-8 rounded-full transition-colors">
            Continue Shopping
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-black pt-10 pb-12 px-4 transition-colors duration-300">
      <div className="max-w-4xl mx-auto">
        
        <button 
          onClick={() => onNavigate('home')}
          className="flex items-center gap-2 text-gray-500 dark:text-gray-400 hover:text-black dark:hover:text-white mb-6 transition-colors group"
        >
          <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" /> Back to Shop
        </button>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
            <div>
            <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Checkout</h2>
                {isDirectBuy && <span className="text-xs bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 px-2 py-1 rounded">Quick Buy Mode</span>}
            </div>
            <form onSubmit={handleSubmit} className="space-y-6">
                
                {/* Address Selector Switch */}
                <div className="bg-white dark:bg-gray-900 p-1 rounded-lg flex border border-gray-200 dark:border-gray-800 mb-6">
                    <button 
                        type="button" 
                        onClick={() => setUseSavedAddress(true)} 
                        className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-md text-sm font-medium transition-all ${useSavedAddress ? 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white shadow' : 'text-gray-500 dark:text-gray-400'}`}
                    >
                        <Home size={16} /> Saved Addresses
                    </button>
                    <button 
                        type="button" 
                        onClick={() => setUseSavedAddress(false)} 
                        className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-md text-sm font-medium transition-all ${!useSavedAddress ? 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white shadow' : 'text-gray-500 dark:text-gray-400'}`}
                    >
                        <MapPin size={16} /> One-Time Address
                    </button>
                </div>
                
                {/* Address Selection Area */}
                {useSavedAddress ? (
                     <div className="space-y-3">
                         {user?.addresses && user.addresses.length > 0 ? (
                             user.addresses.map(addr => (
                                 <div 
                                    key={addr.id}
                                    onClick={() => setSelectedAddressId(addr.id)}
                                    className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${selectedAddressId === addr.id ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/10' : 'border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 hover:border-blue-300'}`}
                                 >
                                     <div className="flex justify-between items-start">
                                         <div>
                                             <p className="font-bold text-gray-900 dark:text-white">{addr.label}</p>
                                             <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">{addr.street}</p>
                                             <p className="text-xs text-gray-500">{addr.estate}, {addr.city}</p>
                                         </div>
                                         <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${selectedAddressId === addr.id ? 'border-blue-500' : 'border-gray-300'}`}>
                                             {selectedAddressId === addr.id && <div className="w-2.5 h-2.5 rounded-full bg-blue-500" />}
                                         </div>
                                     </div>
                                 </div>
                             ))
                         ) : (
                             <div className="text-center p-8 bg-white dark:bg-gray-900 rounded-xl border border-dashed border-gray-300 dark:border-gray-700">
                                 <p className="text-gray-500 mb-4">No saved addresses found.</p>
                                 <button type="button" onClick={() => setUseSavedAddress(false)} className="text-blue-600 font-bold hover:underline">Enter Address Manually</button>
                             </div>
                         )}
                     </div>
                ) : (
                    <div className="bg-white dark:bg-gray-900 p-6 rounded-xl border border-gray-200 dark:border-gray-800 space-y-4 shadow-sm">
                        <div className="flex justify-between items-center mb-2">
                            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Enter Delivery Details</h3>
                            <button type="button" onClick={handleGetLocation} disabled={loadingLoc} className="flex items-center gap-2 text-xs font-bold text-blue-600 dark:text-blue-400 hover:text-blue-500">
                                {loadingLoc ? <Loader className="animate-spin" size={14} /> : <MapPin size={14} />} USE GPS
                            </button>
                        </div>
                        <div>
                            <label className="block text-xs text-gray-500 mb-1">Street / Building / House No.</label>
                            <input required value={oneTimeAddress.street} onChange={e => setOneTimeAddress({...oneTimeAddress, street: e.target.value})} className="w-full bg-gray-50 dark:bg-black border border-gray-300 dark:border-gray-700 rounded-lg px-4 py-2 text-gray-900 dark:text-white focus:border-blue-500 outline-none" placeholder="e.g. Wood Avenue, Plot 54" />
                        </div>
                        <div>
                            <label className="block text-xs text-gray-500 mb-1">Estate / Neighborhood (Optional)</label>
                            <input value={oneTimeAddress.estate} onChange={e => setOneTimeAddress({...oneTimeAddress, estate: e.target.value})} className="w-full bg-gray-50 dark:bg-black border border-gray-300 dark:border-gray-700 rounded-lg px-4 py-2 text-gray-900 dark:text-white focus:border-blue-500 outline-none" placeholder="e.g. Kilimani" />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs text-gray-500 mb-1">Landmark (Optional)</label>
                                <input value={oneTimeAddress.landmark} onChange={e => setOneTimeAddress({...oneTimeAddress, landmark: e.target.value})} className="w-full bg-gray-50 dark:bg-black border border-gray-300 dark:border-gray-700 rounded-lg px-4 py-2 text-gray-900 dark:text-white focus:border-blue-500 outline-none" placeholder="e.g. Near Yaya Center" />
                            </div>
                            <div>
                                <label className="block text-xs text-gray-500 mb-1">City</label>
                                <input required value={oneTimeAddress.city} onChange={e => setOneTimeAddress({...oneTimeAddress, city: e.target.value})} className="w-full bg-gray-50 dark:bg-black border border-gray-300 dark:border-gray-700 rounded-lg px-4 py-2 text-gray-900 dark:text-white focus:border-blue-500 outline-none" placeholder="Nairobi" />
                            </div>
                        </div>
                    </div>
                )}

                <div className="bg-white dark:bg-gray-900 p-6 rounded-xl border border-gray-200 dark:border-gray-800 space-y-4 shadow-sm">
                <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 flex items-center gap-2"><Smartphone size={16}/> M-Pesa Payment</h3>
                <div>
                    <label className="block text-xs text-gray-500 mb-1">M-Pesa Phone Number</label>
                    <input required type="tel" value={paymentPhone} onChange={e => setPaymentPhone(e.target.value)} className="w-full bg-gray-50 dark:bg-black border border-gray-300 dark:border-gray-700 rounded-lg px-4 py-2 text-gray-900 dark:text-white focus:border-blue-500 outline-none text-lg tracking-wide font-mono" placeholder="07XX XXX XXX" />
                </div>
                </div>

                {error && <div className="bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/30 p-4 rounded-lg flex items-start gap-3"><AlertCircle className="text-red-600 dark:text-red-500 shrink-0" size={20} /><p className="text-sm text-red-700 dark:text-red-200">{error}</p></div>}

                <button type="submit" disabled={processingStep !== 'idle' || items.length === 0} className={`w-full font-bold py-4 rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 ${processingStep === 'polling' ? 'bg-green-600' : 'bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white'}`}>
                {processingStep === 'idle' && <>Pay KES {total.toLocaleString()} <ArrowRight size={20} /></>}
                {processingStep === 'creating_order' && <>Creating Order <Loader className="animate-spin" size={20} /></>}
                {processingStep === 'initiating_payment' && <>Initiating M-Pesa <Loader className="animate-spin" size={20} /></>}
                {processingStep === 'polling' && <>Check your phone... <Loader className="animate-spin" size={20} /></>}
                </button>
            </form>
            </div>

            <div className="bg-white dark:bg-gray-900 p-6 rounded-xl border border-gray-200 dark:border-gray-800 h-fit sticky top-24 shadow-sm">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6">Order Summary</h3>
            <div className="space-y-4 mb-6 max-h-[400px] overflow-y-auto">
                {items.map((item, i) => (
                <div key={`${item.id}-${i}`} className="flex justify-between items-center">
                    <div className="flex items-center gap-3">
                    <img src={item.image} alt={item.name} className="w-12 h-12 rounded object-cover border border-gray-200 dark:border-gray-700" />
                    <div>
                        <p className="text-sm text-gray-800 dark:text-gray-200 line-clamp-1">{item.name}</p>
                        <div className="flex flex-col text-xs text-gray-500">
                            <span>Qty: {item.quantity}</span>
                            {(item.selectedSize || item.selectedColor) && (
                                <span className="text-gray-400">{item.selectedSize} / {item.selectedColor}</span>
                            )}
                        </div>
                    </div>
                    </div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">KES {(item.price * item.quantity).toLocaleString()}</p>
                </div>
                ))}
            </div>
            <div className="border-t border-gray-200 dark:border-gray-800 pt-4 space-y-2">
                <div className="flex justify-between text-sm text-gray-500 dark:text-gray-400"><span>Subtotal</span><span>KES {total.toLocaleString()}</span></div>
                <div className="flex justify-between text-lg font-bold text-gray-900 dark:text-white pt-2 border-t border-gray-200 dark:border-gray-800 mt-2"><span>Total</span><span>KES {total.toLocaleString()}</span></div>
            </div>
            </div>

        </div>
      </div>
    </div>
  );
};
