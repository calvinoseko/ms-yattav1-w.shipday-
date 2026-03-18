
import { db, User, Product, CartItem, Category, Address, ProductImage, Order } from './mockDb';

// Types mimicking the backend response structure
interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  token?: string;
  message?: string;
  count?: number;
}

// Helper to simulate network delay
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Helper to log actions to the frontend console
type LogCallback = (method: string, url: string, status: number, data: any) => void;
let logger: LogCallback | null = null;

export const setLogger = (fn: LogCallback) => {
  logger = fn;
};

const log = (method: string, url: string, status: number, data: any) => {
  if (logger) logger(method, url, status, data);
};

// The Mock API Client
export const api = {
  auth: {
    register: async (payload: any): Promise<ApiResponse<User>> => {
      await delay(500);
      const { name, email, password, phone } = payload;
      
      if (db.users.find(u => u.email === email)) {
        const res = { success: false, error: 'Account with this email already exists' };
        log('POST', '/api/v1/auth/register', 400, res);
        return res;
      }

      const newUser: User = {
        id: Math.random().toString(36).substr(2, 9),
        name,
        email,
        phone, 
        role: 'customer',
        token: `fake-jwt-${Math.random().toString(36).substr(2)}`,
        isActive: true,
        createdAt: new Date().toISOString(),
        cart: [],
        addresses: []
      };
      
      db.users.push(newUser);
      const res = { success: true, token: newUser.token, data: newUser };
      log('POST', '/api/v1/auth/register', 201, res);
      return res;
    },

    login: async (payload: any): Promise<ApiResponse<User>> => {
      await delay(600);
      const { email, password } = payload;
      
      const user = db.users.find(u => u.email === email);
      
      if (!user) {
        const res = { success: false, error: 'Invalid credentials' };
        log('POST', '/api/v1/auth/login', 401, res);
        return res;
      }
      
      const res = { success: true, token: user.token, data: user };
      log('POST', '/api/v1/auth/login', 200, res);
      return res;
    },

    me: async (token: string): Promise<ApiResponse<User>> => {
        await delay(300);
        const user = db.users.find(u => u.token === token);
        if (!user) return { success: false, error: 'Session expired' };
        return { success: true, data: user };
    }
  },

  cart: {
    get: async (token: string): Promise<ApiResponse<CartItem[]>> => {
        await delay(200);
        const user = db.users.find(u => u.token === token);
        if (!user) return { success: false, error: 'Unauthorized' };
        return { success: true, data: user.cart };
    },
    sync: async (items: CartItem[], token: string): Promise<ApiResponse<CartItem[]>> => {
        await delay(200); 
        const user = db.users.find(u => u.token === token);
        if (!user) return { success: false, error: 'Unauthorized' };
        user.cart = items;
        return { success: true, data: user.cart };
    }
  },

  orders: {
    create: async (payload: { items: CartItem[], addressId?: string, oneTimeAddress?: Partial<Address> }, token: string): Promise<ApiResponse<any>> => {
       await delay(800);
       const user = db.users.find(u => u.token === token);
       if (!user) return { success: false, error: 'Unauthorized' };

       // 1. Resolve Address (Snapshotting)
       let deliveryAddress: Address;
       
       if (payload.addressId) {
         const saved = user.addresses.find(a => a.id === payload.addressId);
         if (!saved) return { success: false, error: 'Selected address not found in profile.' };
         deliveryAddress = { ...saved }; // Clone to snapshot
       } else if (payload.oneTimeAddress) {
         // Create a one-time snapshot
         deliveryAddress = {
           id: 'temp_' + Math.random().toString(36).substr(2, 9),
           label: 'One-Time Delivery',
           recipientName: payload.oneTimeAddress.recipientName || user.name,
           recipientPhone: payload.oneTimeAddress.recipientPhone || user.phone || '',
           city: payload.oneTimeAddress.city || '',
           street: payload.oneTimeAddress.street || '',
           estate: payload.oneTimeAddress.estate,
           isDefault: false,
           latitude: payload.oneTimeAddress.latitude,
           longitude: payload.oneTimeAddress.longitude
         };
       } else {
         return { success: false, error: 'No delivery address provided.' };
       }

       // 2. Variant Stock Validation
       for (const item of payload.items) {
          const product = db.products.find(p => p.id === item.id);
          if (!product) return { success: false, error: `Product ${item.name} not found` };
          
          if (product.variants && product.variants.length > 0) {
             const variant = product.variants.find(v => v.size === item.selectedSize && v.color === item.selectedColor);
             if (!variant) return { success: false, error: `Variant ${item.selectedSize}/${item.selectedColor} not found for ${item.name}` };
             
             if (variant.stock < item.quantity) {
                return { success: false, error: `Insufficient stock for ${item.name} (${item.selectedSize}/${item.selectedColor}).` };
             }
          } else {
             if (product.stock < item.quantity) {
                return { success: false, error: `Insufficient stock for ${item.name}.` };
             }
          }
       }

       // 3. Process Stock (Decrement)
       for (const item of payload.items) {
          const product = db.products.find(p => p.id === item.id);
          if (product) {
             if (product.variants && product.variants.length > 0) {
                 const variant = product.variants.find(v => v.size === item.selectedSize && v.color === item.selectedColor);
                 if (variant) variant.stock -= item.quantity;
                 product.stock -= item.quantity;
             } else {
                 product.stock -= item.quantity;
             }
             product.soldCount = (product.soldCount || 0) + item.quantity;
          }
       }

       const newOrder = {
          id: Math.random().toString(36).substr(2, 9),
          userId: user.id,
          items: [...payload.items],
          total: payload.items.reduce((acc, i) => acc + (i.price * i.quantity), 0),
          status: 'pending_payment',
          deliveryAddress, // Saved snapshot
          createdAt: new Date().toISOString(),
          paymentMethod: 'mpesa' // default
       };
       // @ts-ignore
       db.orders.push(newOrder);
       user.cart = [];

       return { success: true, data: newOrder };
    },
    
    get: async (orderId: string, token: string): Promise<ApiResponse<any>> => {
        const order = db.orders.find(o => o.id === orderId);
        if(!order) return { success: false, error: 'Order not found' };
        return { success: true, data: order };
    },

    myOrders: async (token: string): Promise<ApiResponse<any[]>> => {
      await delay(400);
      const user = db.users.find(u => u.token === token);
      if (!user) return { success: false, error: 'Unauthorized' };
      
      const orders = db.orders.filter(o => o.userId === user.id).sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      return { success: true, data: orders };
    }
  },

  payments: {
    initiate: async (payload: { orderId: string, provider: string, phone?: string }, token: string): Promise<ApiResponse<any>> => {
       await delay(1000);
       const order = db.orders.find(o => o.id === payload.orderId);
       if (!order) return { success: false, error: 'Order not found' };

       const payment = {
           id: 'pay_' + Math.random().toString(36).substr(2,9),
           orderId: order.id,
           status: 'pending',
           amount: order.total,
           provider: payload.provider
       };
       
       // Simulate payment success webhook
       setTimeout(() => {
           // @ts-ignore
           order.status = 'paid'; 
       }, 5000);

       return { success: true, data: payment };
    }
  },

  profile: {
    updateMe: async (payload: Partial<User>, token: string): Promise<ApiResponse<User>> => {
      await delay(400);
      const userIndex = db.users.findIndex(u => u.token === token);
      if (userIndex === -1) return { success: false, error: 'Unauthorized' };
      
      const updatedUser = { ...db.users[userIndex], ...payload };
      db.users[userIndex] = updatedUser;
      
      return { success: true, data: updatedUser };
    },
    changePassword: async (payload: any, token: string): Promise<ApiResponse<any>> => {
      await delay(400);
      return { success: true, message: 'Password updated successfully' };
    },
    // --- Address Management ---
    addAddress: async (payload: Partial<Address>, token: string): Promise<ApiResponse<User>> => {
      await delay(300);
      const user = db.users.find(u => u.token === token);
      if (!user) return { success: false, error: 'Unauthorized' };

      const newAddr: Address = {
        id: 'addr_' + Math.random().toString(36).substr(2, 6),
        label: payload.label || 'Home',
        recipientName: payload.recipientName || user.name,
        recipientPhone: payload.recipientPhone || user.phone || '',
        city: payload.city || '',
        estate: payload.estate || '',
        street: payload.street || '',
        landmark: payload.landmark,
        latitude: payload.latitude,
        longitude: payload.longitude,
        isDefault: payload.isDefault || user.addresses.length === 0
      };

      if (newAddr.isDefault) {
        user.addresses.forEach(a => a.isDefault = false);
      }
      user.addresses.push(newAddr);
      return { success: true, data: user };
    },
    updateAddress: async (addressId: string, payload: Partial<Address>, token: string): Promise<ApiResponse<User>> => {
       await delay(300);
       const user = db.users.find(u => u.token === token);
       if (!user) return { success: false, error: 'Unauthorized' };

       const idx = user.addresses.findIndex(a => a.id === addressId);
       if (idx === -1) return { success: false, error: 'Address not found' };

       if (payload.isDefault) {
          user.addresses.forEach(a => a.isDefault = false);
       }
       
       user.addresses[idx] = { ...user.addresses[idx], ...payload };
       return { success: true, data: user };
    },
    deleteAddress: async (addressId: string, token: string): Promise<ApiResponse<User>> => {
       await delay(300);
       const user = db.users.find(u => u.token === token);
       if (!user) return { success: false, error: 'Unauthorized' };

       user.addresses = user.addresses.filter(a => a.id !== addressId);
       // Ensure one is default if list not empty
       if (user.addresses.length > 0 && !user.addresses.some(a => a.isDefault)) {
         user.addresses[0].isDefault = true;
       }
       return { success: true, data: user };
    }
  },

  products: {
    list: async (filters?: any): Promise<ApiResponse<Product[]>> => {
      await delay(400);
      let data = [...db.products];
      if (filters?.search) {
        const term = filters.search.toLowerCase();
        data = data.filter(p => p.name.toLowerCase().includes(term) || p.description.toLowerCase().includes(term));
      }
      if (filters?.categoryPath) {
        const filterCat = db.categories.find(c => c.slug === filters.categoryPath);
        if (filterCat) {
          data = data.filter(product => {
            return product.categories.some(cat => cat.path === filterCat.path || cat.path.startsWith(filterCat.path + '/'));
          });
        }
      }
      if (filters?.ids && Array.isArray(filters.ids)) {
          data = data.filter(p => filters.ids.includes(p.id));
      }
      return { success: true, count: data.length, data: data };
    },

    create: async (payload: any, token: string): Promise<ApiResponse<Product>> => {
      await delay(500);
      const user = db.users.find(u => u.token === token);
      if (!user || user.role !== 'admin') return { success: false, error: 'Not authorized' };
      
      // Calculate Stock from Variants
      let stock = Number(payload.stock) || 0;
      if (payload.variants && payload.variants.length > 0) {
          stock = payload.variants.reduce((acc: number, v: any) => acc + Number(v.stock), 0);
      }

      const catObj = db.categories.find(c => c.name === payload.category) || db.categories[0];
      
      // Handle Image Array creation
      let images: ProductImage[] = [];
      if (payload.images && Array.isArray(payload.images)) {
          // If the payload has the new structure
          images = payload.images.map((img: any, idx: number) => ({
             id: Math.random().toString(36).substr(2, 5),
             url: img.url,
             isMain: img.isMain || idx === 0
          }));
      }

      // Fallback for Main Image string if array is somehow empty (shouldn't happen with updated UI)
      let mainImage = images.find(i => i.isMain)?.url || images[0]?.url || 'no-photo.jpg';

      const newProduct: Product = {
        id: Math.random().toString(36).substr(2, 9),
        name: payload.name,
        price: Number(payload.price),
        category: catObj,
        categories: [catObj],
        stock: stock,
        variants: payload.variants,
        status: 'active',
        image: mainImage,
        images: images,
        description: payload.description,
        soldCount: 0,
        reviews: [],
        rating: 0
      };
      db.products.push(newProduct);
      return { success: true, data: newProduct };
    },

    addReview: async (productId: string, payload: { rating: number, comment: string }, token: string): Promise<ApiResponse<any>> => {
        await delay(500);
        const user = db.users.find(u => u.token === token);
        if (!user) return { success: false, error: 'Unauthorized' };

        // 1. Check if product exists
        const product = db.products.find(p => p.id === productId);
        if (!product) return { success: false, error: 'Product not found' };

        // 2. Strict Verification: Check if user has a 'delivered' or 'completed' order with this product
        const eligibleOrders = db.orders.filter(o => 
            o.userId === user.id && 
            (o.status === 'delivered' || o.status === 'completed') &&
            o.items.some(i => i.id === productId)
        );

        if (eligibleOrders.length === 0) {
            return { success: false, error: 'You can only review products you have purchased and received.' };
        }

        // Use the most recent eligible order
        const eligibleOrder = eligibleOrders[0];

        // 3. Check duplicate review for this order/product
        const alreadyReviewed = product.reviews.some(r => r.userId === user.id && r.orderId === eligibleOrder.id);
        if (alreadyReviewed) {
            return { success: false, error: 'You have already reviewed this product for this order.' };
        }

        const newReview = {
            id: 'rev_' + Math.random().toString(36).substr(2, 9),
            userName: user.name,
            userId: user.id,
            orderId: eligibleOrder.id,
            rating: payload.rating,
            comment: payload.comment,
            date: new Date().toISOString().split('T')[0],
            isVerified: true
        };

        product.reviews.unshift(newReview);
        
        // Recalculate Rating
        const totalStars = product.reviews.reduce((acc, r) => acc + r.rating, 0);
        product.rating = parseFloat((totalStars / product.reviews.length).toFixed(1));

        return { success: true, data: newReview };
    }
  },

  categories: {
    list: async (): Promise<ApiResponse<Category[]>> => {
      await delay(200);
      return { success: true, data: db.categories };
    },
    create: async (payload: any, token: string): Promise<ApiResponse<Category>> => {
      await delay(500);
      const slug = payload.name.toLowerCase().replace(/ /g, '-');
      const newCat = {
          id: Math.random().toString(36).substr(2, 9),
          name: payload.name,
          slug,
          path: slug,
          parentId: null,
          level: 0
      };
      db.categories.push(newCat);
      return { success: true, data: newCat };
    },
    delete: async (id: string, token: string): Promise<ApiResponse<any>> => {
      await delay(300);
      const index = db.categories.findIndex(c => c.id === id);
      if (index !== -1) db.categories.splice(index, 1);
      return { success: true };
    }
  },

  admin: {
    analytics: {
      getOverview: async (token: string): Promise<ApiResponse<any>> => {
        await delay(300);
        return { success: true, data: { totalRevenue: 15430, todayRevenue: 200, totalOrders: 120, totalUsers: db.users.length, totalProducts: db.products.length } };
      },
      getSales: async (token: string): Promise<ApiResponse<any>> => {
          await delay(300);
          return { success: true, data: {
              labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
              data: [1200, 1900, 1500, 2100, 1800, 3200, 2800]
          }};
      },
      getUserGrowth: async (token: string): Promise<ApiResponse<any>> => {
          await delay(300);
          return { success: true, data: {
              labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
              data: [10, 15, 25, 30, 45, 50]
          }};
      }
    },
    users: {
      list: async (token: string): Promise<ApiResponse<User[]>> => {
        await delay(300);
        return { success: true, data: db.users };
      },
      updateStatus: async (userId: string, isActive: boolean, token: string): Promise<ApiResponse<User>> => {
         const user = db.users.find(u => u.id === userId);
         if(user) user.isActive = isActive;
         return { success: true, data: user! };
      }
    },
    orders: {
        list: async (token: string): Promise<ApiResponse<Order[]>> => {
            await delay(300);
            const user = db.users.find(u => u.token === token);
            if (!user || user.role !== 'admin') return { success: false, error: 'Unauthorized' };
            const sorted = [...db.orders].sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
            return { success: true, data: sorted };
        },
        updateStatus: async (orderId: string, status: any, token: string): Promise<ApiResponse<Order>> => {
            await delay(300);
            const user = db.users.find(u => u.token === token);
            if (!user || user.role !== 'admin') return { success: false, error: 'Unauthorized' };
            
            const order = db.orders.find(o => o.id === orderId);
            if(order) {
                // @ts-ignore
                order.status = status; 
                return { success: true, data: order };
            }
            return { success: false, error: 'Order not found' };
        }
    }
  }
};
