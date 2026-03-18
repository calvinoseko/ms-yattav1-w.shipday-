
const Order = require('../models/Order');
const Product = require('../models/Product');
const User = require('../models/User');
const asyncHandler = require('../utils/asyncHandler');

// @desc    Create new order with Atomic Inventory Checking
// @route   POST /api/v1/orders
// @access  Private
exports.createOrder = asyncHandler(async (req, res) => {
  const { 
    items, 
    useProfileInfo, 
    customerInfo, 
    saveAddress 
  } = req.body;

  if (!items || items.length === 0) {
    res.status(400);
    throw new Error('No order items');
  }

  // 1. Determine Customer Info
  let finalCustomerInfo = {};
  if (useProfileInfo) {
    const user = await User.findById(req.user.id);
    const addressToUse = user.savedAddresses.find(a => a.isDefault) || user.savedAddresses[0];

    if (!addressToUse) {
        res.status(400);
        throw new Error('No saved address found in profile. Please provide address.');
    }

    finalCustomerInfo = {
        name: user.name,
        phone: user.phone,
        email: user.email,
        address: {
            street: addressToUse.street,
            city: addressToUse.city,
            country: addressToUse.country,
            zipCode: addressToUse.zipCode,
            latitude: addressToUse.latitude,
            longitude: addressToUse.longitude
        }
    };
  } else {
    if (!customerInfo || !customerInfo.address) {
        res.status(400);
        throw new Error('Customer info and address are required when not using profile');
    }
    
    finalCustomerInfo = {
        name: customerInfo.name || req.user.name,
        phone: customerInfo.phone || req.user.phone,
        email: req.user.email,
        address: customerInfo.address
    };

    if (saveAddress) {
        await User.findByIdAndUpdate(req.user.id, {
            $push: { 
                savedAddresses: {
                    ...customerInfo.address,
                    label: 'Saved during checkout',
                    isDefault: false
                } 
            }
        });
    }
  }

  // 2. Validate Stock & Calculate Total (ATOMICALLY)
  let totalAmount = 0;
  const dbItems = [];

  for (const item of items) {
    const productDoc = await Product.findById(item.id);
    if (!productDoc) throw new Error(`Product not found: ${item.id}`);

    let updatedProduct;

    // Check if product uses variants
    if (productDoc.variants && productDoc.variants.length > 0) {
      if (!item.size || !item.color) {
        throw new Error(`Size and Color required for ${productDoc.name}`);
      }

      // Find Specific Variant Update
      updatedProduct = await Product.findOneAndUpdate(
        { 
          _id: item.id, 
          status: 'active',
          variants: { 
            $elemMatch: { 
              size: item.size, 
              color: item.color, 
              stock: { $gte: item.quantity } 
            } 
          }
        },
        { 
          $inc: { "variants.$.stock": -item.quantity, "stock": -item.quantity, "soldCount": item.quantity } 
        },
        { new: true }
      );
      
      if (!updatedProduct) {
        throw new Error(`Insufficient stock for ${productDoc.name} (${item.size}/${item.color})`);
      }

    } else {
      // Legacy Global Stock Logic
      updatedProduct = await Product.findOneAndUpdate(
        { 
          _id: item.id, 
          stock: { $gte: item.quantity },
          status: 'active'
        },
        { 
          $inc: { stock: -item.quantity, soldCount: item.quantity } 
        },
        { new: true }
      );

      if (!updatedProduct) {
        throw new Error(`Insufficient stock for ${productDoc.name}`);
      }
    }

    // Auto-update status if total stock hits 0
    if (updatedProduct.stock <= 0) {
        await Product.findByIdAndUpdate(updatedProduct._id, { status: 'out_of_stock' });
    }

    totalAmount += updatedProduct.price * item.quantity;
    
    dbItems.push({
        product: updatedProduct._id,
        productName: updatedProduct.name,
        quantity: item.quantity,
        price: updatedProduct.price,
        size: item.size,
        color: item.color
    });
  }

  // 3. Create Order
  const order = await Order.create({
    user: req.user.id,
    items: dbItems,
    customerInfo: finalCustomerInfo,
    totalAmount,
    paymentResult: {
        status: 'pending',
        provider: 'mpesa' // Default
    }
  });

  res.status(201).json({
    success: true,
    data: order
  });
});

// @desc    Get logged in user orders
// @route   GET /api/v1/orders/myorders
// @access  Private
exports.getMyOrders = asyncHandler(async (req, res) => {
  const orders = await Order.find({ user: req.user.id }).sort('-createdAt');
  res.status(200).json({
    success: true,
    data: orders
  });
});
