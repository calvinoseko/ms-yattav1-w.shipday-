
import React, { useState, useEffect } from 'react';
import { User, Address, Order } from '../lib/mockDb';
import { api } from '../lib/apiClient';
import { Save, Lock, User as UserIcon, MapPin, Phone, Loader, ArrowLeft, Plus, Trash2, Star, Check, Package, Clock, ChevronRight, X, PenTool, CheckCircle } from 'lucide-react';

interface Props {
  user: User;
  onUpdateUser: (user: User) => void;
  onNavigate: (page: string, params?: any) => void;
}

export const ProfilePage: React.FC<Props> = ({ user, onUpdateUser, onNavigate }) => {
  const [activeTab, setActiveTab] = useState<'profile' | 'addresses' | 'orders'>('profile');
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  
  // Profile State
  const [profileData, setProfileData] = useState({
    name: user.name,
    phone: user.phone || ''
  });

  // Password State
  const [passData, setPassData] = useState({ currentPassword: '', newPassword: '' });

  // Address Form State
  const [isAddingAddress, setIsAddingAddress] = useState(false);
  const [addrLoading, setAddrLoading] = useState(false);
  const [newAddress, setNewAddress] = useState<Partial<Address>>({
    label: 'Home',
    recipientName: user.name,
    recipientPhone: user.phone || '',
    city: 'Nairobi',
    estate: '',
    street: '',
    isDefault: false
  });

  // Orders State
  const [orders, setOrders] = useState<Order[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  useEffect(() => {
    if (activeTab === 'orders') {
      fetchOrders();
    }
  }, [activeTab]);

  const fetchOrders = async () => {
    setOrdersLoading(true);
    const res = await api.orders.myOrders(user.token);
    if (res.success && res.data) {
      setOrders(res.data);
    }
    setOrdersLoading(false);
  };

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setSuccessMsg('');

    const res = await api.profile.updateMe({
      name: profileData.name,
      phone: profileData.phone
    }, user.token);

    if (res.success && res.data) {
      onUpdateUser(res.data);
      setSuccessMsg('Profile updated successfully!');
      setTimeout(() => setSuccessMsg(''), 3000);
    }
    setLoading(false);
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const res = await api.profile.changePassword(passData, user.token);
    if (res.success) {
      setSuccessMsg('Password changed successfully!');
      setPassData({ currentPassword: '', newPassword: '' });
      setTimeout(() => setSuccessMsg(''), 3000);
    }
    setLoading(false);
  };

  // --- Address Logic ---

  const getLiveLocation = () => {
    if (!navigator.geolocation) return alert('Geolocation not supported');
    setAddrLoading(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setNewAddress(prev => ({
          ...prev,
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
          street: `Detected (${pos.coords.latitude.toFixed(4)}, ${pos.coords.longitude.toFixed(4)})`
        }));
        setAddrLoading(false);
      },
      () => {
        alert('Could not retrieve location');
        setAddrLoading(false);
      }
    );
  };

  const handleAddAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddrLoading(true);
    const res = await api.profile.addAddress(newAddress, user.token);
    if (res.success && res.data) {
      onUpdateUser(res.data);
      setIsAddingAddress(false);
      setNewAddress({ label: 'Home', recipientName: user.name, recipientPhone: user.phone || '', city: 'Nairobi', estate: '', street: '', isDefault: false });
    }
    setAddrLoading(false);
  };

  const deleteAddress = async (id: string) => {
    if (!confirm('Delete this address?')) return;
    const res = await api.profile.deleteAddress(id, user.token);
    if (res.success && res.data) onUpdateUser(res.data);
  };

  const setDefaultAddress = async (id: string) => {
    const res = await api.profile.updateAddress(id, { isDefault: true }, user.token);
    if (res.success && res.data) onUpdateUser(res.data);
  };

  const getStatusColor = (status: string) => {
     switch(status) {
         case 'paid': return 'text-green-600 bg-green-100 dark:bg-green-900/20';
         case 'completed': return 'text-green-700 bg-green-200 dark:bg-green-800/40';
         case 'delivered': return 'text-blue-700 bg-blue-200 dark:bg-blue-800/40';
         case 'pending_payment': return 'text-orange-600 bg-orange-100 dark:bg-orange-900/20';
         case 'processing': return 'text-blue-600 bg-blue-100 dark:bg-blue-900/20';
         case 'cancelled': return 'text-red-600 bg-red-100 dark:bg-red-900/20';
         default: return 'text-gray-600 bg-gray-100 dark:bg-gray-800';
     }
  };

  // Helper to check if item is reviewable (mock check: delivered/completed)
  const isReviewable = (order: Order) => order.status === 'delivered' || order.status === 'completed';

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-black pt-10 pb-20 px-4 transition-colors duration-300">
      <div className="max-w-5xl mx-auto space-y-8">
        
        <button 
          onClick={() => onNavigate('home')}
          className="flex items-center gap-2 text-gray-500 dark:text-gray-400 hover:text-black dark:hover:text-white transition-colors group"
        >
          <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" /> Back to Shop
        </button>

        {/* Header Profile Card */}
        <div className="flex items-center gap-6 mb-8 bg-white dark:bg-gray-900 p-6 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-800">
           <div className="w-20 h-20 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center border-2 border-blue-200 dark:border-blue-700/50 shrink-0">
               <span className="font-bold text-3xl text-blue-600 dark:text-blue-400">{user.name.charAt(0).toUpperCase()}</span>
           </div>
           <div>
             <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{user.name}</h1>
             <p className="text-gray-500 dark:text-gray-400 text-sm mb-2">{user.email}</p>
             <div className="flex items-center gap-2">
                 <span className="capitalize text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-400/30 px-2 py-0.5 rounded text-xs bg-blue-50 dark:bg-transparent">{user.role}</span>
                 <span className="text-xs text-gray-400">Joined {new Date(user.createdAt).toLocaleDateString()}</span>
             </div>
           </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 border-b border-gray-200 dark:border-gray-800 overflow-x-auto">
          {['profile', 'addresses', 'orders'].map(tab => (
            <button
              key={tab}
              onClick={() => { setActiveTab(tab as any); setSelectedOrder(null); }}
              className={`px-6 py-3 text-sm font-medium capitalize border-b-2 transition-all whitespace-nowrap ${activeTab === tab ? 'border-blue-600 text-blue-600 dark:text-blue-400' : 'border-transparent text-gray-500 hover:text-gray-900 dark:hover:text-white'}`}
            >
              {tab}
            </button>
          ))}
        </div>

        {successMsg && (
          <div className="bg-green-100 dark:bg-green-500/10 border border-green-200 dark:border-green-500/30 text-green-700 dark:text-green-400 px-4 py-3 rounded-lg text-center font-medium flex items-center justify-center gap-2">
            <Check size={18} /> {successMsg}
          </div>
        )}

        <div className="grid grid-cols-1 gap-8">
          
          {/* PROFILE TAB */}
          {activeTab === 'profile' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Personal Info */}
                <div className="bg-white dark:bg-gray-900 p-8 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm h-fit">
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
                        <UserIcon size={20} className="text-blue-500" /> Personal Details
                    </h2>
                    <form onSubmit={handleProfileUpdate} className="space-y-5">
                        <div>
                            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Full Name</label>
                            <input 
                                value={profileData.name}
                                onChange={e => setProfileData({...profileData, name: e.target.value})}
                                className="w-full bg-gray-50 dark:bg-black border border-gray-300 dark:border-gray-700 rounded-lg px-4 py-2 text-gray-900 dark:text-white focus:border-blue-500 outline-none"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Email</label>
                            <input 
                                value={user.email}
                                disabled
                                className="w-full bg-gray-100 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-800 rounded-lg px-4 py-2 text-gray-500 dark:text-gray-400 cursor-not-allowed"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Phone Number</label>
                            <div className="relative">
                                <Phone size={14} className="absolute left-3 top-3 text-gray-400 dark:text-gray-500" />
                                <input 
                                value={profileData.phone}
                                onChange={e => setProfileData({...profileData, phone: e.target.value})}
                                className="w-full bg-gray-50 dark:bg-black border border-gray-300 dark:border-gray-700 rounded-lg pl-9 pr-4 py-2 text-gray-900 dark:text-white focus:border-blue-500 outline-none"
                                placeholder="+254..."
                                />
                            </div>
                        </div>

                        <div className="pt-4 text-right">
                            <button 
                                type="submit"
                                disabled={loading}
                                className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-2 rounded-lg font-bold transition-colors flex items-center gap-2 ml-auto"
                            >
                                {loading ? <Loader className="animate-spin" size={18}/> : <Save size={18} />} Save Info
                            </button>
                        </div>
                    </form>
                </div>

                {/* Security */}
                <div className="bg-white dark:bg-gray-900 p-8 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm h-fit">
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
                        <Lock size={20} className="text-blue-500" /> Security
                    </h2>
                    <form onSubmit={handlePasswordChange} className="space-y-4">
                        <div>
                            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Current Password</label>
                            <input 
                                type="password"
                                required
                                value={passData.currentPassword}
                                onChange={e => setPassData({...passData, currentPassword: e.target.value})}
                                className="w-full bg-gray-50 dark:bg-black border border-gray-300 dark:border-gray-700 rounded-lg px-4 py-2 text-gray-900 dark:text-white focus:border-blue-500 outline-none"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">New Password</label>
                            <input 
                                type="password"
                                required
                                value={passData.newPassword}
                                onChange={e => setPassData({...passData, newPassword: e.target.value})}
                                className="w-full bg-gray-50 dark:bg-black border border-gray-300 dark:border-gray-700 rounded-lg px-4 py-2 text-gray-900 dark:text-white focus:border-blue-500 outline-none"
                            />
                        </div>

                        <div className="pt-4 text-right">
                            <button 
                                type="submit"
                                disabled={loading}
                                className="bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-900 dark:text-white px-6 py-2 rounded-lg font-bold transition-colors flex items-center gap-2 ml-auto border border-gray-300 dark:border-gray-700"
                            >
                                Update Password
                            </button>
                        </div>
                    </form>
                </div>
            </div>
          )}

          {/* ADDRESSES TAB */}
          {activeTab === 'addresses' && (
            <div className="space-y-6">
               <div className="flex justify-between items-center">
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white">Saved Addresses</h2>
                  <button onClick={() => setIsAddingAddress(true)} className="flex items-center gap-2 bg-black dark:bg-white text-white dark:text-black px-4 py-2 rounded-full text-sm font-bold">
                    <Plus size={16} /> Add New
                  </button>
               </div>

               {isAddingAddress && (
                 <div className="bg-white dark:bg-gray-900 p-6 rounded-xl border border-blue-500 shadow-lg animate-fade-in-down">
                    <h3 className="font-bold mb-4">New Address</h3>
                    <form onSubmit={handleAddAddress} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                       <input required placeholder="Label (e.g. Home, Work)" value={newAddress.label} onChange={e => setNewAddress({...newAddress, label: e.target.value})} className="input-field" />
                       <input required placeholder="Recipient Name" value={newAddress.recipientName} onChange={e => setNewAddress({...newAddress, recipientName: e.target.value})} className="input-field" />
                       <input required placeholder="Recipient Phone" value={newAddress.recipientPhone} onChange={e => setNewAddress({...newAddress, recipientPhone: e.target.value})} className="input-field" />
                       <input required placeholder="City" value={newAddress.city} onChange={e => setNewAddress({...newAddress, city: e.target.value})} className="input-field" />
                       <input required placeholder="Estate / Neighborhood" value={newAddress.estate} onChange={e => setNewAddress({...newAddress, estate: e.target.value})} className="input-field" />
                       <div className="relative">
                          <input required placeholder="Street / Building / Landmark" value={newAddress.street} onChange={e => setNewAddress({...newAddress, street: e.target.value})} className="input-field w-full" />
                          <button type="button" onClick={getLiveLocation} className="absolute right-2 top-2 text-blue-600 text-xs font-bold flex items-center gap-1 hover:underline">
                             {addrLoading ? <Loader size={12} className="animate-spin"/> : <MapPin size={12}/>} Live Loc
                          </button>
                       </div>
                       <div className="md:col-span-2 flex items-center gap-2 mt-2">
                          <input type="checkbox" id="def" checked={newAddress.isDefault} onChange={e => setNewAddress({...newAddress, isDefault: e.target.checked})} />
                          <label htmlFor="def" className="text-sm text-gray-600 dark:text-gray-400 select-none cursor-pointer">Set as default delivery address</label>
                       </div>
                       <div className="md:col-span-2 flex justify-end gap-3 mt-4">
                          <button type="button" onClick={() => setIsAddingAddress(false)} className="text-gray-500 hover:text-black px-4 py-2">Cancel</button>
                          <button type="submit" disabled={addrLoading} className="bg-blue-600 text-white px-6 py-2 rounded-lg font-bold">Save Address</button>
                       </div>
                    </form>
                 </div>
               )}

               <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {user.addresses.length > 0 ? user.addresses.map(addr => (
                    <div key={addr.id} className={`relative p-6 rounded-xl border-2 transition-all ${addr.isDefault ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/10' : 'border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900'}`}>
                       {addr.isDefault && <div className="absolute top-4 right-4 text-blue-500"><Star size={20} fill="currentColor" /></div>}
                       <div className="flex items-center gap-2 mb-3">
                          <span className="font-bold text-lg uppercase tracking-wider">{addr.label}</span>
                          {addr.latitude && <MapPin size={16} className="text-gray-400" />}
                       </div>
                       <div className="text-sm text-gray-600 dark:text-gray-300 space-y-1 mb-6">
                          <p className="font-medium text-gray-900 dark:text-white">{addr.recipientName}</p>
                          <p>{addr.street}</p>
                          <p>{addr.estate}, {addr.city}</p>
                          <p className="text-xs text-gray-400 mt-2">{addr.recipientPhone}</p>
                       </div>
                       <div className="flex gap-3 text-sm">
                          {!addr.isDefault && (
                             <button onClick={() => setDefaultAddress(addr.id)} className="text-blue-600 hover:underline">Set Default</button>
                          )}
                          <button onClick={() => deleteAddress(addr.id)} className="text-red-500 hover:text-red-700 flex items-center gap-1 ml-auto"><Trash2 size={14}/> Delete</button>
                       </div>
                    </div>
                  )) : (
                    <div className="col-span-full text-center py-10 text-gray-500">
                       <MapPin size={48} className="mx-auto mb-4 text-gray-300"/>
                       <p>No addresses saved yet.</p>
                    </div>
                  )}
               </div>
            </div>
          )}

          {/* ORDERS TAB */}
          {activeTab === 'orders' && (
              !selectedOrder ? (
                <div className="space-y-6">
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                        <Package size={20} className="text-blue-500"/> Order History
                    </h2>
                    
                    {ordersLoading ? (
                        <div className="flex justify-center py-10"><Loader className="animate-spin"/></div>
                    ) : orders.length === 0 ? (
                        <div className="text-center py-16 bg-white dark:bg-gray-900 rounded-xl border border-dashed border-gray-300 dark:border-gray-800">
                            <Package size={48} className="mx-auto mb-4 text-gray-300"/>
                            <h3 className="font-bold text-lg">No orders yet</h3>
                            <p className="text-gray-500 text-sm mb-6">Start shopping to see your orders here.</p>
                            <button onClick={() => onNavigate('home')} className="bg-black dark:bg-white text-white dark:text-black px-6 py-2 rounded-full font-bold">Shop Now</button>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {orders.map(order => (
                                <div key={order.id} className="bg-white dark:bg-gray-900 p-6 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm hover:border-blue-300 transition-colors cursor-pointer group" onClick={() => setSelectedOrder(order)}>
                                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                        <div className="space-y-1">
                                            <div className="flex items-center gap-3">
                                                <span className="font-mono text-sm font-bold text-gray-500">#{order.id}</span>
                                                <span className={`text-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded ${getStatusColor(order.status)}`}>{order.status.replace('_', ' ')}</span>
                                            </div>
                                            <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                                                <span className="flex items-center gap-1"><Clock size={14}/> {new Date(order.createdAt).toLocaleDateString()}</span>
                                                <span>•</span>
                                                <span>{order.items.length} items</span>
                                            </div>
                                        </div>
                                        <div className="flex items-center justify-between md:justify-end gap-6 min-w-[200px]">
                                            <div className="text-right">
                                                <p className="text-xs text-gray-500">Total Amount</p>
                                                <p className="font-bold text-lg">KES {order.total.toLocaleString()}</p>
                                            </div>
                                            <ChevronRight className="text-gray-300 group-hover:text-blue-500 transition-colors"/>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
              ) : (
                  <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden shadow-sm">
                      <div className="p-6 border-b border-gray-200 dark:border-gray-800 flex justify-between items-center bg-gray-50 dark:bg-gray-950">
                          <button onClick={() => setSelectedOrder(null)} className="flex items-center gap-2 text-sm font-bold text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400">
                              <ArrowLeft size={16}/> Back to Orders
                          </button>
                          <span className="font-mono text-sm text-gray-400">ORDER #{selectedOrder.id}</span>
                      </div>
                      <div className="p-8">
                          <div className="flex flex-col md:flex-row justify-between mb-8 gap-6">
                              <div>
                                  <h3 className="font-bold text-lg mb-1">Order Status</h3>
                                  <span className={`text-xs font-bold uppercase tracking-wider px-3 py-1 rounded inline-block ${getStatusColor(selectedOrder.status)}`}>{selectedOrder.status.replace('_', ' ')}</span>
                                  <p className="text-sm text-gray-500 mt-2">Placed on {new Date(selectedOrder.createdAt).toLocaleString()}</p>
                              </div>
                              <div className="text-right">
                                  <h3 className="font-bold text-lg mb-1">Total Amount</h3>
                                  <p className="text-3xl font-black text-gray-900 dark:text-white">KES {selectedOrder.total.toLocaleString()}</p>
                                  <p className="text-sm text-gray-500 uppercase tracking-wider mt-1">{selectedOrder.paymentMethod || 'M-Pesa'}</p>
                              </div>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                                <div>
                                    <h4 className="font-bold text-gray-900 dark:text-white mb-3 flex items-center gap-2 text-sm uppercase tracking-wider"><MapPin size={16}/> Delivery Address</h4>
                                    <div className="bg-gray-50 dark:bg-black p-4 rounded-lg text-sm text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-800">
                                        <p className="font-bold text-gray-900 dark:text-white mb-1">{selectedOrder.deliveryAddress.recipientName}</p>
                                        <p>{selectedOrder.deliveryAddress.street}</p>
                                        <p>{selectedOrder.deliveryAddress.estate}, {selectedOrder.deliveryAddress.city}</p>
                                        <p className="mt-2 text-xs text-gray-400">{selectedOrder.deliveryAddress.recipientPhone}</p>
                                    </div>
                                </div>
                                <div>
                                    <h4 className="font-bold text-gray-900 dark:text-white mb-3 flex items-center gap-2 text-sm uppercase tracking-wider"><Package size={16}/> Items Ordered</h4>
                                    <div className="space-y-3">
                                        {selectedOrder.items.map((item, i) => (
                                            <div key={i} className="flex justify-between items-start text-sm border-b border-gray-100 dark:border-gray-800 pb-2 last:border-0 last:pb-0">
                                                <div>
                                                    <p className="font-medium text-gray-900 dark:text-white">{item.name}</p>
                                                    <p className="text-xs text-gray-500">{item.quantity} x KES {item.price.toLocaleString()} {item.selectedSize && `• ${item.selectedSize} / ${item.selectedColor}`}</p>
                                                    {isReviewable(selectedOrder) && (
                                                        <button 
                                                            onClick={(e) => { e.stopPropagation(); onNavigate('product-detail', { productId: item.id }); }}
                                                            className="mt-1 text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline"
                                                        >
                                                            Write Review
                                                        </button>
                                                    )}
                                                </div>
                                                <p className="font-mono font-medium">KES {(item.price * item.quantity).toLocaleString()}</p>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                          </div>
                      </div>
                  </div>
              )
          )}

        </div>
      </div>

      <style>{`
        .input-field {
            width: 100%;
            background-color: transparent;
            border: 1px solid #e5e7eb;
            border-radius: 0.5rem;
            padding: 0.5rem 1rem;
            color: inherit;
        }
        .dark .input-field {
            border-color: #374151;
            background-color: #000;
        }
      `}</style>
    </div>
  );
};
