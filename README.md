# Fashion Store E-Commerce Platform

A modern, full-stack e-commerce platform built with Node.js, Express, MongoDB, and React (Vite). It features a robust backend with advanced product management, hierarchical categories, real-time analytics, and M-Pesa payment integration.

## 🚀 Features

### 🛍️ Customer Features
- **Authentication & Profiles**: Secure JWT authentication, password management, and user profiles.
- **Address Management**: Save multiple delivery addresses, including live location (latitude/longitude) support.
- **Product Discovery**: Browse products by hierarchical categories, view detailed product pages with image galleries, variants (size/color), and stock status.
- **Shopping Cart & Checkout**: Seamless cart management and checkout process.
- **Payments**: Integrated with M-Pesa (STK Push) for seamless mobile payments in Kenya, plus support for Card and Airtel.
- **Order Tracking**: View order history and track delivery status (integrated with Shipday).
- **Reviews & Ratings**: Leave reviews and rate purchased products.

### 🛡️ Admin Features
- **Advanced Dashboard**: Comprehensive analytics including sales, user growth, real-time active users, and top-viewed products.
- **Product Management**: Full CRUD operations for products, variant management, stock tracking, and image gallery management.
- **AI Categorization**: Automatically categorize products using AI.
- **Category Management**: Infinite-depth hierarchical category tree using the Materialized Path pattern.
- **Order Management**: View and update order statuses, manage deliveries.
- **User Management**: View user analytics and manage customer accounts.

## 🛠️ Tech Stack

- **Frontend**: React 18, Vite, Tailwind CSS
- **Backend**: Node.js, Express.js
- **Database**: MongoDB (Mongoose ODM)
- **Authentication**: JSON Web Tokens (JWT)
- **Payments**: Safaricom Daraja API (M-Pesa)
- **Delivery**: Shipday API

## ⚙️ Prerequisites

- Node.js (v18 or higher)
- MongoDB (Local instance or MongoDB Atlas cluster)
- M-Pesa Daraja API Credentials (for payments)

## 📦 Installation & Setup

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Environment Variables**
   Create a `.env` file in the root directory and add the following variables:
   ```env
   NODE_ENV=development
   PORT=3000
   MONGO_URI=your_mongodb_connection_string
   JWT_SECRET=your_jwt_secret_key
   JWT_EXPIRE=30d
   
   # M-Pesa Credentials
   MPESA_CONSUMER_KEY=your_consumer_key
   MPESA_CONSUMER_SECRET=your_consumer_secret
   MPESA_PASSKEY=your_passkey
   MPESA_SHORTCODE=your_shortcode
   
   # Shipday API
   SHIPDAY_API_KEY=your_shipday_api_key
   
   # AI Services (if applicable)
   GEMINI_API_KEY=your_gemini_api_key
   ```

3. **Run the Development Server**
   ```bash
   npm run dev
   ```
   The application will start concurrently. The backend API will be available at `http://localhost:3000/api/v1` and the Vite frontend will be served on `http://localhost:3000`.

## 🏗️ Building for Production

To build the application for production:

```bash
npm run build
```

To start the production server:

```bash
npm start
```

## 📁 Project Structure

- `/src/models` - Mongoose database schemas (User, Product, Order, Category, Event, Payment)
- `/src/controllers` - Request handlers for API routes
- `/src/routes` - Express route definitions
- `/src/services` - Business logic and third-party integrations (M-Pesa, Shipday, Analytics)
- `/src/middleware` - Custom middleware (Auth, Error Handling, Security)
- `/frontend` - React frontend application (Vite)
- `server.ts` - Main application entry point (Express + Vite middleware)

## 🔒 Security Features

- Helmet.js for secure HTTP headers
- Express Rate Limit to prevent brute-force attacks
- Mongo Sanitize to prevent NoSQL injection
- XSS Clean to sanitize user input
- HPP to prevent HTTP Parameter Pollution
- Secure JWT-based authentication with role-based access control (RBAC)
