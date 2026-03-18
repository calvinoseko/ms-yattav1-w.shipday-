import React, { useState, useEffect } from 'react';
import { api } from '../lib/apiClient';
import { Product, User, Category, Variant, Order } from '../lib/mockDb';
import { Plus, Image as ImageIcon, Trash2, Package, UploadCloud, Users, BarChart3, Search, Ban, CheckCircle, FolderPlus, X, Layers, UserCheck, UserX, ArrowLeft, Star, ClipboardList, Eye, ArrowRight, Menu } from 'lucide-react';

interface Props {
  user: User;
  onNavigate: (page: string) => void;
}

// Simple Bar Chart Component (Custom implementation to avoid dependencies)
const SimpleBarChart = ({ data, labels, color = "bg-blue-500", label }: { data: number[], labels: string[], color?: string, label: string }) => {
    const max = Math.max(...data) || 100;
    
    return (
        <div className="w-full">
            <h4 className="text-sm font-bold text-gray-500 dark:text-gray-400 mb-4">{label}</h4>
            <div className="flex items-end justify-between h-48 gap-2">
                {data.map((value, idx) => (
                    <div key={idx} className="flex flex-col items-center gap-2 flex-1 group">
                         <div className="relative w-full flex justify-center">
                            <span className="absolute -top-6 text-xs font-bold text-gray-700 dark:text-gray-300 opacity-0 group-hover:opacity-100 transition-opacity">{value}</span>
                            <div 
                                className={`w-full max-w-[40px] rounded-t-sm transition-all duration-500 ${color} hover:opacity-80`} 
                                style={{ height: `${(value / max) * 100}%`, minHeight: '4px' }}
                            ></div>
                         </div>
                         <span className="text-xs text-gray-500 font-medium truncate w-full text-center hidden sm:block">{labels[idx]}</span>
                    </div>
                ))}
            </div>
        </div>
    );
};

export const AdminPage: React.FC<Props> = ({ user, onNavigate }) => {
  const [activeTab, setActiveTab] = useState<'analytics' | 'inventory' | 'users' | 'orders'>('analytics');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  
  // Data States
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [analytics, setAnalytics] = useState<any>(null);
  const [graphs, setGraphs] = useState<{ sales: any, growth: any }>({ sales: null, growth: null });
  const [loading, setLoading] = useState(false);

  // Form State
  const [productForm, setProductForm] = useState({
    name: '',
    price: '',
    category: '',
    stock: '', // Deprecated if variants used, but kept for simple products
    description: '',
  });
  
  // Order View Modal State
  const [viewingOrder, setViewingOrder] = useState<Order | null>(null);

  // New Image Handling
  const [uploadedImages, setUploadedImages] = useState<{ url: string; isMain: boolean }[]>([]);

  const [variants, setVariants] = useState<Variant[]>([]);
  const [newVariant, setNewVariant] = useState({ size: '', color: '', stock: '' });

  const [categoryForm, setCategoryForm] = useState({
    name: '',
    parentId: ''
  });

  const [isCreatingProduct, setIsCreatingProduct] = useState(false);
  const [isSendingToShipday, setIsSendingToShipday] = useState(false);

  useEffect(() => {
    fetchAnalytics();
    fetchInventory();
    fetchCategories();
    fetchUsers();
    fetchOrders();
  }, []);

  const fetchAnalytics = async () => {
    const res = await api.admin.analytics.getOverview(user.token);
    if (res.success) setAnalytics(res.data);

    // Fetch Graph Data
    const salesRes = await api.admin.analytics.getSales(user.token);
    const growthRes = await api.admin.analytics.getUserGrowth(user.token);
    
    if(salesRes.success && growthRes.success) {
        setGraphs({ sales: salesRes.data, growth: growthRes.data });
    }
  };

  const fetchInventory = async () => {
    const res = await api.products.list();
    if (res.success && res.data) setProducts(res.data);
  };

  const fetchCategories = async () => {
    const res = await api.categories.list();
    if (res.success && res.data) setCategories(res.data);
  };

  const fetchUsers = async () => {
    const res = await api.admin.users.list(user.token);
    if (res.success && res.data) setUsers(res.data);
  };

  const fetchOrders = async () => {
      const res = await api.admin.orders.list(user.token);
      if (res.success && res.data) setOrders(res.data);
  };

  const toggleUserStatus = async (userId: string, currentStatus: boolean) => {
    if(userId === user.id) {
        alert("You cannot deactivate yourself.");
        return;
    }
    const res = await api.admin.users.updateStatus(userId, !currentStatus, user.token);
    if (res.success) {
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, isActive: !currentStatus } : u));
    }
  };

  const updateOrderStatus = async (orderId: string, newStatus: string) => {
      const res = await api.admin.orders.updateStatus(orderId, newStatus, user.token);
      if(res.success) {
          setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: newStatus as any } : o));
      }
  };

  const sendToShipday = async (order: Order) => {
    setIsSendingToShipday(true);
    try {
      const payload = {
        orderNumber: order.id,
        customerName: order.deliveryAddress.recipientName,
        customerAddress: `${order.deliveryAddress.street}, ${order.deliveryAddress.estate}, ${order.deliveryAddress.city}`,
        customerEmail: "customer@example.com",
        customerPhoneNumber: order.deliveryAddress.recipientPhone || "0000000000",
        restaurantName: "Fashion Store",
        restaurantAddress: "123 Fashion Ave, Nairobi",
        expectedDeliveryDate: new Date().toISOString().split('T')[0],
        expectedDeliveryTime: "14:00:00",
        deliveryInstruction: "Handle with care",
        orderItem: order.items.map(item => ({
          name: `${item.name} (${item.selectedSize}/${item.selectedColor})`,
          unitPrice: item.price,
          quantity: item.quantity
        }))
      };

      const response = await fetch('/api/shipday/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      const data = await response.json();
      if (data.success) {
        alert('Order successfully sent to Shipday!');
        updateOrderStatus(order.id, 'shipped');
        setViewingOrder(prev => prev ? { ...prev, status: 'shipped' } : null);
      } else {
        alert('Failed to send to Shipday: ' + JSON.stringify(data.error));
      }
    } catch (error: any) {
      alert('Error sending to Shipday: ' + error.message);
    } finally {
      setIsSendingToShipday(false);
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      // Convert multiple files to base64
      Array.from(files).forEach(file => {
          const reader = new FileReader();
          reader.onloadend = () => {
              const url = reader.result as string;
              setUploadedImages(prev => {
                  // If first image, set as main automatically
                  const isFirst = prev.length === 0;
                  return [...prev, { url, isMain: isFirst }];
              });
          };
          reader.readAsDataURL(file as Blob);
      });
    }
  };

  const removeImage = (index: number) => {
      setUploadedImages(prev => {
          const newImages = prev.filter((_, i) => i !== index);
          // If we deleted the main image, make the first one main if available
          if (prev[index].isMain && newImages.length > 0) {
              newImages[0].isMain = true;
          }
          return newImages;
      });
  };

  const setMainImage = (index: number) => {
      setUploadedImages(prev => prev.map((img, i) => ({
          ...img,
          isMain: i === index
      })));
  };

  const handleAddVariant = () => {
      if(!newVariant.size || !newVariant.color || !newVariant.stock) return;
      setVariants([...variants, {
          size: newVariant.size,
          color: newVariant.color,
          stock: Number(newVariant.stock)
      }]);
      setNewVariant({ size: '', color: '', stock: '' });
  };

  const removeVariant = (idx: number) => {
      setVariants(variants.filter((_, i) => i !== idx));
  };

  const handleProductSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (uploadedImages.length === 0) {
        alert("Please upload at least one image.");
        return;
    }

    setLoading(true);
    
    // Calculate total stock if variants exist, else use form stock
    const finalStock = variants.length > 0 
        ? variants.reduce((acc, v) => acc + v.stock, 0)
        : Number(productForm.stock);

    const res = await api.products.create({
      ...productForm,
      price: Number(productForm.price),
      stock: finalStock,
      variants: variants.length > 0 ? variants : undefined,
      images: uploadedImages // Send array of objects
    }, user.token);

    if (res.success) {
      await fetchInventory();
      setIsCreatingProduct(false);
      setProductForm({ name: '', price: '', category: '', stock: '', description: '' });
      setUploadedImages([]);
      setVariants([]);
      fetchAnalytics();
    } else {
      alert("Failed: " + res.error);
    }
    setLoading(false);
  };

  const handleCategorySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const res = await api.categories.create({
        name: categoryForm.name,
        parentId: categoryForm.parentId || undefined
    }, user.token);
    if (res.success) { await fetchCategories(); setCategoryForm({ name: '', parentId: '' }); alert("Category created!"); } 
    setLoading(false);
  };
  const handleDeleteCategory = async (id: string) => {
      if(!confirm("Are you sure?")) return;
      const res = await api.categories.delete(id, user.token);
      if (res.success) fetchCategories();
  };


  return (
    <div className="min-h-screen bg-gray-50 dark:bg-black text-gray-900 dark:text-white transition-colors duration-300 font-sans flex relative">
      
      {/* Mobile Overlay */}
      {isSidebarOpen && (
        <div 
            className="fixed inset-0 bg-black/50 z-20 md:hidden backdrop-blur-sm"
            onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`w-64 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 flex flex-col fixed h-full overflow-y-auto z-30 transition-transform duration-300 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0`}>
        <div className="p-6">
           <div className="flex items-center justify-between mb-8">
               <button 
                 onClick={() => onNavigate('home')}
                 className="flex items-center gap-2 text-gray-500 dark:text-gray-400 hover:text-black dark:hover:text-white transition-colors group text-sm font-medium"
               >
                 <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" /> Back to Store
               </button>
               <button onClick={() => setIsSidebarOpen(false)} className="md:hidden text-gray-500">
                   <X size={20} />
               </button>
           </div>
           
           <h1 className="text-xl font-bold mb-1 text-gray-900 dark:text-white">Admin</h1>
           <p className="text-xs text-gray-500 dark:text-gray-400 mb-6">Dashboard & Management</p>

           <nav className="space-y-1">
            {['analytics', 'inventory', 'orders', 'users'].map(tab => (
              <button 
                key={tab}
                onClick={() => { setActiveTab(tab as any); setIsSidebarOpen(false); }}
                className={`w-full px-4 py-3 rounded-lg text-sm font-medium transition-all flex items-center gap-3 capitalize ${activeTab === tab ? 'bg-blue-600 text-white shadow-lg' : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-black dark:hover:text-white'}`}
              >
                {tab === 'analytics' && <BarChart3 size={18} />}
                {tab === 'inventory' && <Package size={18} />}
                {tab === 'orders' && <ClipboardList size={18} />}
                {tab === 'users' && <Users size={18} />}
                {tab}
              </button>
            ))}
           </nav>
        </div>
        
        <div className="mt-auto p-6 border-t border-gray-200 dark:border-gray-800">
            <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center border border-blue-200 dark:border-blue-700/50">
                    <span className="font-bold text-blue-600 dark:text-blue-400 text-xs">{user.name.charAt(0).toUpperCase()}</span>
                </div>
                <div>
                    <p className="text-sm font-bold text-gray-900 dark:text-white truncate max-w-[120px]">{user.name}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Administrator</p>
                </div>
            </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 md:ml-64 p-4 md:p-8 w-full min-h-screen transition-all duration-300">
         <div className="max-w-7xl mx-auto">
            <div className="mb-8 flex items-center gap-4">
                <button onClick={() => setIsSidebarOpen(true)} className="md:hidden p-2 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm">
                    <Menu size={20} />
                </button>
                <div>
                    <h2 className="text-2xl font-bold capitalize text-gray-900 dark:text-white">{activeTab} Overview</h2>
                    <p className="text-gray-500 dark:text-gray-400 text-sm">Manage your store's {activeTab}.</p>
                </div>
            </div>

        {/* Content Area */}
        {activeTab === 'analytics' && analytics && (
          <div className="space-y-6 animate-fade-in">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
               <div className="bg-white dark:bg-gray-900 p-6 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm">
                 <p className="text-gray-500 dark:text-gray-400 text-sm mb-1">Total Revenue</p>
                 <h3 className="text-3xl font-bold text-gray-900 dark:text-white">KES {analytics.totalRevenue.toLocaleString()}</h3>
                 <p className="text-green-500 text-xs mt-2 flex items-center gap-1"><CheckCircle size={12}/> +KES {analytics.todayRevenue.toLocaleString()} today</p>
               </div>
               <div className="bg-white dark:bg-gray-900 p-6 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm">
                 <p className="text-gray-500 dark:text-gray-400 text-sm mb-1">Total Orders</p>
                 <h3 className="text-3xl font-bold text-gray-900 dark:text-white">{analytics.totalOrders}</h3>
                 <p className="text-blue-500 text-xs mt-2">{analytics.todayOrders} new orders</p>
               </div>
               <div className="bg-white dark:bg-gray-900 p-6 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm">
                 <p className="text-gray-500 dark:text-gray-400 text-sm mb-1">Total Users</p>
                 <h3 className="text-3xl font-bold text-gray-900 dark:text-white">{analytics.totalUsers}</h3>
                 <p className="text-gray-500 text-xs mt-2">Registered accounts</p>
               </div>
               <div className="bg-white dark:bg-gray-900 p-6 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm">
                 <p className="text-gray-500 dark:text-gray-400 text-sm mb-1">Products</p>
                 <h3 className="text-3xl font-bold text-gray-900 dark:text-white">{analytics.totalProducts}</h3>
                 <p className="text-gray-500 text-xs mt-2">Active in catalog</p>
               </div>
            </div>

            {/* Graphs Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8">
                {graphs.sales && (
                    <div className="bg-white dark:bg-gray-900 p-6 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm">
                        <SimpleBarChart 
                            label="Weekly Revenue (KES)" 
                            data={graphs.sales.data} 
                            labels={graphs.sales.labels} 
                            color="bg-blue-600 dark:bg-blue-500"
                        />
                    </div>
                )}
                {graphs.growth && (
                    <div className="bg-white dark:bg-gray-900 p-6 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm">
                        <SimpleBarChart 
                            label="User Growth (6 Months)" 
                            data={graphs.growth.data} 
                            labels={graphs.growth.labels} 
                            color="bg-purple-600 dark:bg-purple-500"
                        />
                    </div>
                )}
            </div>
          </div>
        )}

        {activeTab === 'inventory' && (
          <div className="space-y-8 animate-fade-in">
            {/* Category Form */}
             <div className="bg-white dark:bg-gray-900 p-6 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm">
                <h3 className="font-bold mb-4 flex items-center gap-2 text-gray-900 dark:text-white"><FolderPlus size={18} className="text-blue-500"/> Quick Add Category</h3>
                <form onSubmit={handleCategorySubmit} className="flex flex-col md:flex-row gap-4 items-end border-b border-gray-200 dark:border-gray-800 pb-6 mb-6">
                   {/* Inputs for Category */}
                   <input required value={categoryForm.name} onChange={e => setCategoryForm({...categoryForm, name: e.target.value})} className="w-full bg-gray-50 dark:bg-black border border-gray-300 dark:border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-900 dark:text-white focus:border-blue-500 outline-none" placeholder="Category Name" />
                   <button type="submit" className="bg-gray-200 dark:bg-gray-800 text-gray-900 dark:text-white px-4 py-2 rounded-lg text-sm font-medium border border-gray-300 dark:border-gray-700">Create</button>
                </form>
                {/* Categories List */}
                <div className="flex flex-wrap gap-2 max-h-40 overflow-y-auto pr-2 custom-scrollbar">
                    {categories.map(c => (
                        <div key={c.id} className="group flex items-center gap-2 bg-gray-100 dark:bg-black border border-gray-300 dark:border-gray-800 px-3 py-1.5 rounded-full text-xs text-gray-700 dark:text-gray-300">
                            <span>{c.name}</span>
                            <button onClick={() => handleDeleteCategory(c.id)} className="text-gray-500 hover:text-red-500"><X size={12}/></button>
                        </div>
                    ))}
                </div>
            </div>

            {!isCreatingProduct ? (
              <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden shadow-sm">
                <div className="p-4 border-b border-gray-200 dark:border-gray-800 flex justify-between items-center">
                  <h3 className="font-bold text-gray-900 dark:text-white">Product List</h3>
                  <button onClick={() => setIsCreatingProduct(true)} className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-3 py-1.5 rounded-lg text-sm font-medium transition-colors">
                    <Plus size={16} /> Add Product
                  </button>
                </div>
                {/* Product Table */}
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead className="bg-gray-50 dark:bg-gray-950 text-gray-500 dark:text-gray-400 text-xs uppercase">
                      <tr>
                        <th className="px-6 py-4">Product</th>
                        <th className="px-6 py-4">Category</th>
                        <th className="px-6 py-4">Price</th>
                        <th className="px-6 py-4">Stock</th>
                        <th className="px-6 py-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-gray-800 text-sm">
                      {products.map((p) => (
                        <tr key={p.id}>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-4">
                              <img src={p.image} className="w-10 h-10 rounded bg-gray-200 dark:bg-gray-800 object-cover" />
                              <span className="font-medium text-gray-900 dark:text-white">{p.name}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-gray-500 dark:text-gray-400">{typeof p.category === 'object' ? p.category.name : p.category}</td>
                          <td className="px-6 py-4 font-mono">KES {p.price.toLocaleString()}</td>
                          <td className="px-6 py-4">
                             {p.variants && p.variants.length > 0 ? (
                               <span className="text-xs bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded border border-gray-200 dark:border-gray-700">
                                  {p.stock} (Across {p.variants.length} Variants)
                               </span>
                             ) : (
                               <span className={`px-2 py-1 rounded text-xs font-bold ${p.stock > 0 ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>{p.stock} In Stock</span>
                             )}
                          </td>
                          <td className="px-6 py-4 text-right"><Trash2 size={16} className="text-red-500 cursor-pointer inline"/></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              <div className="max-w-3xl mx-auto bg-white dark:bg-gray-900 p-8 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm">
                <h2 className="text-xl font-bold mb-6 flex items-center gap-2 text-gray-900 dark:text-white">
                  <ImageIcon className="text-blue-500" /> New Product Details
                </h2>
                <form onSubmit={handleProductSubmit} className="space-y-8">
                  
                  {/* Image Upload Section */}
                  <div>
                    <label className="block text-sm font-bold text-gray-900 dark:text-white mb-2">Product Gallery</label>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">Upload multiple images. Select the star to set the main image.</p>
                    
                    <div className="grid grid-cols-3 sm:grid-cols-4 gap-4 mb-4">
                        {uploadedImages.map((img, idx) => (
                            <div key={idx} className={`relative aspect-square rounded-lg overflow-hidden border-2 group ${img.isMain ? 'border-blue-500' : 'border-gray-200 dark:border-gray-700'}`}>
                                <img src={img.url} alt="Uploaded" className="w-full h-full object-cover" />
                                
                                <div className="absolute top-1 right-1 flex gap-1">
                                    <button 
                                        type="button"
                                        onClick={() => setMainImage(idx)}
                                        className={`p-1 rounded-full shadow-sm backdrop-blur-md ${img.isMain ? 'bg-blue-500 text-white' : 'bg-white/80 text-gray-400 hover:text-blue-500'}`}
                                        title="Set as Main"
                                    >
                                        <Star size={12} fill={img.isMain ? "currentColor" : "none"} />
                                    </button>
                                    <button 
                                        type="button"
                                        onClick={() => removeImage(idx)}
                                        className="p-1 bg-white/80 text-red-500 rounded-full shadow-sm hover:bg-red-50 backdrop-blur-md"
                                        title="Remove"
                                    >
                                        <X size={12} />
                                    </button>
                                </div>
                                {img.isMain && <div className="absolute bottom-0 inset-x-0 bg-blue-500 text-white text-[10px] text-center py-0.5 font-bold uppercase">Main</div>}
                            </div>
                        ))}
                        
                        <label className="aspect-square border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-blue-500 dark:hover:border-blue-500 transition-colors bg-gray-50 dark:bg-gray-800/50">
                            <input type="file" multiple accept="image/*" onChange={handleImageUpload} className="hidden" />
                            <UploadCloud className="text-gray-400 mb-2" />
                            <span className="text-xs text-gray-500 font-medium">Add Images</span>
                        </label>
                    </div>
                  </div>
                  
                  {/* Basic Info */}
                  <div className="grid grid-cols-2 gap-4">
                     <div className="space-y-1">
                         <label className="text-xs font-bold uppercase text-gray-500">Product Name</label>
                         <input required placeholder="e.g. Urban Hoodie" className="w-full bg-gray-50 dark:bg-black border border-gray-300 dark:border-gray-700 rounded p-2 text-gray-900 dark:text-white" value={productForm.name} onChange={e => setProductForm({...productForm, name: e.target.value})} />
                     </div>
                     <div className="space-y-1">
                         <label className="text-xs font-bold uppercase text-gray-500">Category</label>
                         <select required value={productForm.category} onChange={e => setProductForm({...productForm, category: e.target.value})} className="w-full bg-gray-50 dark:bg-black border border-gray-300 dark:border-gray-700 rounded p-2 text-gray-900 dark:text-gray-300">
                            <option value="">Select Category</option>
                            {categories.map(c => (<option key={c.id} value={c.name}>{c.name}</option>))}
                        </select>
                     </div>
                     <div className="space-y-1">
                         <label className="text-xs font-bold uppercase text-gray-500">Price (KES)</label>
                         <input required type="number" placeholder="0.00" className="w-full bg-gray-50 dark:bg-black border border-gray-300 dark:border-gray-700 rounded p-2 text-gray-900 dark:text-white" value={productForm.price} onChange={e => setProductForm({...productForm, price: e.target.value})} />
                     </div>
                     <div className="space-y-1">
                         <label className="text-xs font-bold uppercase text-gray-500">Stock (Simple)</label>
                         <input type="number" placeholder="Total Qty" className="w-full bg-gray-50 dark:bg-black border border-gray-300 dark:border-gray-700 rounded p-2 text-gray-900 dark:text-white" value={productForm.stock} onChange={e => setProductForm({...productForm, stock: e.target.value})} disabled={variants.length > 0} />
                     </div>
                  </div>
                  
                  <div className="space-y-1">
                      <label className="text-xs font-bold uppercase text-gray-500">Description</label>
                      <textarea required placeholder="Product description..." rows={4} className="w-full bg-gray-50 dark:bg-black border border-gray-300 dark:border-gray-700 rounded p-2 text-gray-900 dark:text-white" value={productForm.description} onChange={e => setProductForm({...productForm, description: e.target.value})} />
                  </div>

                  {/* Variants Section */}
                  <div className="border border-gray-200 dark:border-gray-800 rounded-lg p-5 bg-gray-50 dark:bg-black">
                     <h4 className="font-bold text-sm mb-4 flex items-center gap-2 text-gray-900 dark:text-white"><Layers size={16}/> Variants (Optional)</h4>
                     <div className="flex gap-2 mb-3">
                         <input placeholder="Size (e.g. XL)" className="w-24 border rounded p-2 text-sm bg-white dark:bg-gray-900 text-gray-900 dark:text-white" value={newVariant.size} onChange={e => setNewVariant({...newVariant, size: e.target.value})} />
                         <input placeholder="Color" className="flex-1 border rounded p-2 text-sm bg-white dark:bg-gray-900 text-gray-900 dark:text-white" value={newVariant.color} onChange={e => setNewVariant({...newVariant, color: e.target.value})} />
                         <input type="number" placeholder="Qty" className="w-24 border rounded p-2 text-sm bg-white dark:bg-gray-900 text-gray-900 dark:text-white" value={newVariant.stock} onChange={e => setNewVariant({...newVariant, stock: e.target.value})} />
                         <button type="button" onClick={handleAddVariant} className="bg-blue-600 hover:bg-blue-500 text-white px-4 rounded text-lg font-bold transition-colors">+</button>
                     </div>
                     <div className="space-y-2">
                        {variants.map((v, i) => (
                           <div key={i} className="flex justify-between items-center bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 px-4 py-2 rounded text-sm">
                               <span className="font-medium text-gray-700 dark:text-gray-300">{v.size} <span className="text-gray-400 mx-2">|</span> {v.color}</span>
                               <div className="flex items-center gap-4">
                                   <span className="font-mono font-bold text-gray-900 dark:text-white">{v.stock} units</span>
                                   <button type="button" onClick={() => removeVariant(i)} className="text-gray-400 hover:text-red-500 transition-colors"><X size={16}/></button>
                               </div>
                           </div>
                        ))}
                        {variants.length === 0 && <p className="text-xs text-gray-400 italic">No variants added yet. Simple stock will be used.</p>}
                     </div>
                  </div>

                  <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-800">
                    <button type="button" onClick={() => setIsCreatingProduct(false)} className="px-6 py-2 text-gray-500 font-medium hover:text-black dark:hover:text-white transition-colors">Cancel</button>
                    <button type="submit" disabled={loading} className="bg-blue-600 hover:bg-blue-500 text-white px-8 py-2 rounded-lg font-bold shadow-lg shadow-blue-500/30 transition-all">{loading ? 'Saving...' : 'Create Product'}</button>
                  </div>
                </form>
              </div>
            )}
          </div>
        )}

        {/* ORDERS TAB */}
        {activeTab === 'orders' && (
             <div className="space-y-6 animate-fade-in">
                 <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden shadow-sm">
                     <div className="p-4 border-b border-gray-200 dark:border-gray-800 flex justify-between items-center">
                         <h3 className="font-bold text-gray-900 dark:text-white flex items-center gap-2"><ClipboardList size={18}/> All Orders</h3>
                         <span className="text-xs text-gray-500 bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">{orders.length} Total</span>
                     </div>
                     <div className="overflow-x-auto">
                        <table className="w-full text-left">
                           <thead className="bg-gray-50 dark:bg-gray-950 text-gray-500 dark:text-gray-400 text-xs uppercase">
                              <tr>
                                <th className="px-6 py-4">Order ID</th>
                                <th className="px-6 py-4">Customer</th>
                                <th className="px-6 py-4">Date</th>
                                <th className="px-6 py-4">Total</th>
                                <th className="px-6 py-4">Status</th>
                                <th className="px-6 py-4 text-right">Actions</th>
                              </tr>
                           </thead>
                           <tbody className="divide-y divide-gray-200 dark:divide-gray-800 text-sm">
                             {orders.map(o => (
                                <tr key={o.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                                    <td className="px-6 py-4 font-mono font-medium text-blue-600 dark:text-blue-400">#{o.id}</td>
                                    <td className="px-6 py-4">
                                        <p className="font-bold text-gray-900 dark:text-white">{o.deliveryAddress?.recipientName || 'Unknown'}</p>
                                        <p className="text-xs text-gray-500">{o.deliveryAddress?.city}</p>
                                    </td>
                                    <td className="px-6 py-4 text-gray-500 text-xs">
                                        {new Date(o.createdAt).toLocaleDateString()}
                                    </td>
                                    <td className="px-6 py-4 font-mono font-bold">
                                        KES {o.total.toLocaleString()}
                                    </td>
                                    <td className="px-6 py-4">
                                        <select 
                                            value={o.status}
                                            onChange={(e) => updateOrderStatus(o.id, e.target.value)}
                                            className={`text-xs uppercase font-bold px-2 py-1 rounded border-none outline-none cursor-pointer bg-transparent ${
                                                o.status === 'delivered' ? 'text-green-600' :
                                                o.status === 'paid' ? 'text-blue-600' :
                                                o.status === 'cancelled' ? 'text-red-600' :
                                                'text-orange-500'
                                            }`}
                                        >
                                            <option value="pending_payment">Pending Payment</option>
                                            <option value="paid">Paid</option>
                                            <option value="processing">Processing</option>
                                            <option value="shipped">Shipped</option>
                                            <option value="delivered">Delivered</option>
                                            <option value="completed">Completed</option>
                                            <option value="cancelled">Cancelled</option>
                                        </select>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <button onClick={() => setViewingOrder(o)} className="text-gray-500 hover:text-black dark:hover:text-white transition-colors" title="View Details">
                                            <Eye size={18} />
                                        </button>
                                    </td>
                                </tr>
                             ))}
                           </tbody>
                        </table>
                     </div>
                 </div>
             </div>
        )}

        {/* VIEW ORDER MODAL */}
        {viewingOrder && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={() => setViewingOrder(null)}>
                <div className="bg-white dark:bg-gray-900 w-full max-w-2xl rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-800 overflow-hidden" onClick={e => e.stopPropagation()}>
                    <div className="p-6 border-b border-gray-200 dark:border-gray-800 flex justify-between items-center">
                        <div>
                            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Order #{viewingOrder.id}</h2>
                            <p className="text-sm text-gray-500 dark:text-gray-400">{new Date(viewingOrder.createdAt).toLocaleString()}</p>
                        </div>
                        <button onClick={() => setViewingOrder(null)} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full"><X size={20}/></button>
                    </div>
                    <div className="p-6 max-h-[70vh] overflow-y-auto">
                        <div className="flex flex-col md:flex-row gap-8 mb-8">
                             <div className="flex-1 p-4 bg-gray-50 dark:bg-gray-950 rounded-lg">
                                 <h3 className="font-bold text-sm uppercase tracking-wide text-gray-500 mb-3">Customer</h3>
                                 <p className="font-bold">{viewingOrder.deliveryAddress.recipientName}</p>
                                 <p className="text-sm text-gray-600 dark:text-gray-400">{viewingOrder.deliveryAddress.recipientPhone}</p>
                                 <p className="text-sm text-gray-600 dark:text-gray-400">{viewingOrder.deliveryAddress.street}, {viewingOrder.deliveryAddress.estate}</p>
                                 <p className="text-sm text-gray-600 dark:text-gray-400">{viewingOrder.deliveryAddress.city}</p>
                             </div>
                             <div className="flex-1 p-4 bg-gray-50 dark:bg-gray-950 rounded-lg">
                                 <h3 className="font-bold text-sm uppercase tracking-wide text-gray-500 mb-3">Payment</h3>
                                 <div className="flex justify-between mb-2">
                                     <span className="text-sm text-gray-600 dark:text-gray-400">Method</span>
                                     <span className="font-bold uppercase">{viewingOrder.paymentMethod || 'M-Pesa'}</span>
                                 </div>
                                 <div className="flex justify-between mb-2">
                                     <span className="text-sm text-gray-600 dark:text-gray-400">Total</span>
                                     <span className="font-bold text-lg">KES {viewingOrder.total.toLocaleString()}</span>
                                 </div>
                                 <div className="flex justify-between">
                                     <span className="text-sm text-gray-600 dark:text-gray-400">Status</span>
                                     <span className="font-bold uppercase text-blue-600">{viewingOrder.status}</span>
                                 </div>
                                 <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-800">
                                     <button 
                                        onClick={() => sendToShipday(viewingOrder)}
                                        disabled={isSendingToShipday}
                                        className="w-full bg-indigo-600 hover:bg-indigo-500 text-white py-2 rounded-lg font-bold transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                                     >
                                         <Package size={18} />
                                         {isSendingToShipday ? 'Sending...' : 'Send to Shipday'}
                                     </button>
                                 </div>
                             </div>
                        </div>

                        <h3 className="font-bold text-sm uppercase tracking-wide text-gray-500 mb-4">Items ({viewingOrder.items.length})</h3>
                        <div className="space-y-4">
                            {viewingOrder.items.map((item, idx) => (
                                <div key={idx} className="flex gap-4 items-center">
                                    <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-md overflow-hidden">
                                        <img src={item.image} className="w-full h-full object-cover" />
                                    </div>
                                    <div className="flex-1">
                                        <p className="font-bold text-gray-900 dark:text-white">{item.name}</p>
                                        <p className="text-xs text-gray-500">{item.selectedSize} / {item.selectedColor}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-sm font-medium">{item.quantity} x KES {item.price.toLocaleString()}</p>
                                        <p className="font-bold">KES {(item.price * item.quantity).toLocaleString()}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        )}

        {activeTab === 'users' && (
          <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden shadow-sm animate-fade-in">
             <div className="p-4 border-b border-gray-200 dark:border-gray-800 flex justify-between items-center">
                 <h3 className="font-bold text-gray-900 dark:text-white flex items-center gap-2"><Users size={18}/> Users Directory</h3>
                 <span className="text-xs text-gray-500 bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">{users.length} Total</span>
             </div>
             <div className="overflow-x-auto">
                <table className="w-full text-left">
                   <thead className="bg-gray-50 dark:bg-gray-950 text-gray-500 dark:text-gray-400 text-xs uppercase">
                      <tr>
                        <th className="px-6 py-4">User</th>
                        <th className="px-6 py-4">Role</th>
                        <th className="px-6 py-4">Status</th>
                        <th className="px-6 py-4">Joined</th>
                        <th className="px-6 py-4 text-right">Actions</th>
                      </tr>
                   </thead>
                   <tbody className="divide-y divide-gray-200 dark:divide-gray-800 text-sm">
                     {users.map(u => (
                        <tr key={u.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                            <td className="px-6 py-4">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center border border-blue-200 dark:border-blue-700/50">
                                       <span className="font-bold text-blue-600 dark:text-blue-400 text-xs">{u.name.charAt(0).toUpperCase()}</span>
                                    </div>
                                    <div>
                                        <p className="font-bold text-gray-900 dark:text-white">{u.name}</p>
                                        <p className="text-xs text-gray-500">{u.email}</p>
                                    </div>
                                </div>
                            </td>
                            <td className="px-6 py-4">
                                <span className={`capitalize px-2 py-1 rounded text-xs border ${u.role === 'admin' ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800' : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-gray-700'}`}>{u.role}</span>
                            </td>
                            <td className="px-6 py-4">
                                {u.isActive ? (
                                    <span className="flex items-center gap-1 text-green-600 dark:text-green-400 text-xs font-bold"><CheckCircle size={12}/> Active</span>
                                ) : (
                                    <span className="flex items-center gap-1 text-red-600 dark:text-red-400 text-xs font-bold"><Ban size={12}/> Suspended</span>
                                )}
                            </td>
                            <td className="px-6 py-4 text-gray-500 text-xs">
                                {new Date(u.createdAt).toLocaleDateString()}
                            </td>
                            <td className="px-6 py-4 text-right">
                                <button 
                                    onClick={() => toggleUserStatus(u.id, u.isActive)}
                                    className={`p-1.5 rounded transition-colors ${u.isActive ? 'text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20' : 'text-green-500 hover:bg-green-50 dark:hover:bg-green-900/20'}`}
                                    title={u.isActive ? "Suspend User" : "Activate User"}
                                >
                                    {u.isActive ? <UserX size={16} /> : <UserCheck size={16} />}
                                </button>
                            </td>
                        </tr>
                     ))}
                   </tbody>
                </table>
             </div>
          </div>
        )}

      </div>
      </main>
    </div>
  );
};