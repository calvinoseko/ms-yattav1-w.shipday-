
// Simple in-memory database simulation for testing the API logic

export interface Review {
  id: string;
  userName: string;
  userId?: string; // Link to user
  orderId?: string; // Link to order
  rating: number;
  comment: string;
  date: string;
  isVerified?: boolean;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  path: string; // Materialized path (e.g., "clothing/tops/hoodies")
  parentId: string | null;
  level: number;
  image?: string; // Added image field
  description?: string; // Added description
}

export interface Variant {
  size: string;
  color: string;
  stock: number;
}

export interface ProductImage {
  id?: string;
  url: string;
  isMain: boolean;
}

export interface Product {
  id: string;
  name: string;
  price: number;
  category: Category; // Primary category for display
  categories: Category[]; // Full relational array
  stock: number;
  variants?: Variant[];
  status: 'active' | 'out_of_stock';
  
  image: string; // Main thumbnail (Legacy/Computed)
  images: ProductImage[]; // Full Gallery with Main Selection
  
  description: string;
  soldCount?: number; // For analytics
  reviews: Review[];
  rating: number;
}

export interface CartItem extends Product {
  quantity: number;
  selectedSize?: string;
  selectedColor?: string;
}

export interface Address {
  id: string;
  label: string; // e.g. "Home", "Work"
  recipientName: string;
  recipientPhone: string;
  city: string;
  estate?: string; // Neighborhood/Estate
  street: string; // Building/House No
  landmark?: string;
  latitude?: number;
  longitude?: number;
  isDefault: boolean;
}

export interface Order {
  id: string;
  userId: string;
  items: CartItem[];
  total: number;
  status: 'pending_payment' | 'paid' | 'processing' | 'dispatched' | 'in_transit' | 'delivered' | 'completed' | 'cancelled';
  deliveryAddress: Address; // Snapshot of the address used
  createdAt: string;
  paymentMethod: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'customer';
  token: string;
  phone?: string;
  addresses: Address[]; // Multiple saved addresses
  isActive: boolean;
  createdAt: string;
  cart: CartItem[]; // Persistent cart
}

class MockDatabase {
  users: User[] = [];
  products: Product[] = [];
  orders: Order[] = [];
  categories: Category[] = [];
  
  constructor() {
    // Seed Categories (Hierarchical) with Images
    this.categories = [
      { 
        id: 'c1', 
        name: 'Clothing', 
        slug: 'clothing', 
        path: 'clothing', 
        parentId: null, 
        level: 0,
        image: 'https://images.unsplash.com/photo-1523381210434-271e8be1f52b?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80',
        description: 'The foundation of your wardrobe. Premium fabrics, timeless cuts.'
      },
      { 
        id: 'c2', 
        name: 'Tops', 
        slug: 'tops', 
        path: 'clothing/tops', 
        parentId: 'c1', 
        level: 1,
        image: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80',
        description: 'From essential tees to statement hoodies.'
      },
      { 
        id: 'c3', 
        name: 'Bottoms', 
        slug: 'bottoms', 
        path: 'clothing/bottoms', 
        parentId: 'c1', 
        level: 1,
        image: 'https://images.unsplash.com/photo-1542272454324-9927c74f1dde?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80',
        description: 'Denim, cargo, and tailored fits for every occasion.'
      },
      { 
        id: 'c4', 
        name: 'Hoodies', 
        slug: 'hoodies', 
        path: 'clothing/tops/hoodies', 
        parentId: 'c2', 
        level: 2,
        image: 'https://images.unsplash.com/photo-1556905055-8f358a7a47b2?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80',
        description: 'Oversized comfort meets street style.'
      },
      { 
        id: 'c5', 
        name: 'Jackets', 
        slug: 'jackets', 
        path: 'clothing/tops/jackets', 
        parentId: 'c2', 
        level: 2,
        image: 'https://images.unsplash.com/photo-1551488852-d8023f543fcc?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80',
        description: 'Outerwear designed to turn heads.'
      },
      { 
        id: 'c6', 
        name: 'Footwear', 
        slug: 'footwear', 
        path: 'footwear', 
        parentId: null, 
        level: 0,
        image: 'https://images.unsplash.com/photo-1549298916-b41d501d3772?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80',
        description: 'Step up your game with our exclusive sneaker drops.'
      }
    ];

    // Seed Admin
    this.users.push({
      id: '1',
      name: 'Admin User',
      email: 'admin@fashion.com',
      role: 'admin',
      token: 'fake-jwt-token-admin',
      isActive: true,
      createdAt: new Date().toISOString(),
      phone: '+1 555 0199',
      addresses: [
        {
          id: 'addr_1',
          label: 'HQ',
          recipientName: 'Admin User',
          recipientPhone: '+1 555 0199',
          city: 'Silicon Valley',
          street: '1 Admin Way',
          isDefault: true
        }
      ],
      cart: []
    });

    // Seed Customer
    this.users.push({
      id: '2',
      name: 'Jane Doe',
      email: 'jane@example.com',
      role: 'customer',
      token: 'fake-jwt-token-jane',
      isActive: true,
      createdAt: new Date(Date.now() - 86400000 * 5).toISOString(), // 5 days ago
      phone: '+254 712 345 678',
      addresses: [
        {
          id: 'addr_2',
          label: 'Home',
          recipientName: 'Jane Doe',
          recipientPhone: '+254 712 345 678',
          city: 'Nairobi',
          estate: 'Kilimani',
          street: 'Wood Avenue, Apt 4B',
          isDefault: true,
          latitude: -1.2921,
          longitude: 36.8219
        }
      ],
      cart: []
    });

    // Helper to get category by ID
    const getCat = (id: string) => this.categories.find(c => c.id === id)!;

    // Seed Products
    this.products = [
      {
        id: 'p1',
        name: 'Oversized Streetwear Hoodie',
        price: 89.00,
        category: getCat('c4'), 
        categories: [getCat('c1'), getCat('c2'), getCat('c4')],
        stock: 15,
        variants: [
          { size: 'M', color: 'Black', stock: 5 },
          { size: 'L', color: 'Black', stock: 5 },
          { size: 'L', color: 'Gray', stock: 5 },
          { size: 'XL', color: 'Black', stock: 0 } // Out of stock variant
        ],
        status: 'active',
        image: 'https://images.unsplash.com/photo-1556905055-8f358a7a47b2?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
        images: [
           { url: 'https://images.unsplash.com/photo-1556905055-8f358a7a47b2?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80', isMain: true },
           { url: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80', isMain: false }
        ],
        description: 'Premium cotton blend oversized hoodie for the ultimate street style.',
        soldCount: 45,
        rating: 4.8,
        reviews: [
            { id: 'r1', userName: 'Alex M.', rating: 5, comment: 'Absolutely love the fit!', date: '2023-10-12', isVerified: true }
        ]
      },
      {
        id: 'p2',
        name: 'Vintage Wash Denim Jacket',
        price: 120.00,
        category: getCat('c5'),
        categories: [getCat('c1'), getCat('c2'), getCat('c5')],
        stock: 8,
        variants: [
           { size: 'S', color: 'Blue', stock: 2 },
           { size: 'M', color: 'Blue', stock: 6 }
        ],
        status: 'active',
        image: 'https://images.unsplash.com/photo-1576871337622-98d48d1cf531?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
        images: [
            { url: 'https://images.unsplash.com/photo-1576871337622-98d48d1cf531?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80', isMain: true }
        ],
        description: 'Classic denim jacket with a vintage wash finish.',
        soldCount: 20,
        rating: 4.5,
        reviews: []
      },
      {
        id: 'p3',
        name: 'Urban Cargo Pants',
        price: 75.00,
        category: getCat('c3'),
        categories: [getCat('c1'), getCat('c3')],
        stock: 20,
        variants: [
            { size: '30', color: 'Green', stock: 10 },
            { size: '32', color: 'Green', stock: 10 },
            { size: '32', color: 'Black', stock: 0 }
        ],
        status: 'active',
        image: 'https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
        images: [
          { url: 'https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80', isMain: true }
        ],
        description: 'Functional cargo pants with multiple pockets.',
        soldCount: 150,
        rating: 4.2,
        reviews: []
      },
      {
        id: 'p4',
        name: 'Minimalist White Tee',
        price: 35.00,
        category: getCat('c2'),
        categories: [getCat('c1'), getCat('c2')],
        stock: 50,
        variants: [
            { size: 'S', color: 'White', stock: 20 },
            { size: 'M', color: 'White', stock: 20 },
            { size: 'L', color: 'White', stock: 10 }
        ],
        status: 'active',
        image: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
        images: [
          { url: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80', isMain: true }
        ],
        description: 'Essential white t-shirt made from organic cotton.',
        soldCount: 300,
        rating: 4.9,
        reviews: []
      },
      {
        id: 'p5',
        name: 'Chunky Sole Sneakers',
        price: 150.00,
        category: getCat('c6'),
        categories: [getCat('c6')],
        stock: 5,
        variants: [
            { size: '40', color: 'Multi', stock: 2 },
            { size: '42', color: 'Multi', stock: 3 }
        ],
        status: 'active',
        image: 'https://images.unsplash.com/photo-1552346154-21d32810aba3?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
        images: [
          { url: 'https://images.unsplash.com/photo-1552346154-21d32810aba3?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80', isMain: true }
        ],
        description: 'Statement sneakers with a chunky sole.',
        soldCount: 85,
        rating: 4.7,
        reviews: []
      }
    ];

    // Seed a Delivered Order for Jane Doe
    const p3 = this.products.find(p => p.id === 'p3');
    if (p3) {
      this.orders.push({
        id: 'ord_legacy_1',
        userId: '2', // Jane Doe
        items: [{ ...p3, quantity: 1, selectedSize: '30', selectedColor: 'Green' }],
        total: 75.00,
        status: 'delivered', // ELIGIBLE for review
        deliveryAddress: this.users[1].addresses[0],
        createdAt: new Date(Date.now() - 86400000 * 3).toISOString(), // 3 days ago
        paymentMethod: 'mpesa'
      });
    }
  }
}

export const db = new MockDatabase();
