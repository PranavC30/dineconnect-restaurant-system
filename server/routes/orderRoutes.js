const express = require("express");
const router = express.Router();
const Order = require("../models/Order");
const MenuItem = require("../models/Menu");
const Table = require("../models/Table");
const { authMiddleware, staffOrAdmin, authenticated } = require("../middleware/authMiddleware");

// Create Order (Customer or Guest)
router.post("/", authMiddleware, async (req, res) => {
  try {
    const { tableId, items, guestSession } = req.body;
    const customerId = req.user?.id || null;

    // Validate or assign table
    let table;
    if (tableId) {
      table = await Table.findById(tableId);
      if (!table) {
        return res.status(400).json({ message: "Invalid table" });
      }
    } else {
      // Assign first available table if none specified
      table = await Table.findOne({});
      if (!table) {
        return res.status(400).json({ message: "No tables available" });
      }
    }

    // Calculate totals
    let subtotal = 0;
    const orderItems = [];

    for (const item of items) {
      const menuItem = await MenuItem.findById(item.menuItemId);
      if (!menuItem || !menuItem.availability) {
        return res.status(400).json({ 
          message: `Menu item not available: ${item.menuItemId}` 
        });
      }
      
      const itemTotal = menuItem.price * item.qty;
      subtotal += itemTotal;
      
      orderItems.push({
        menuItemId: item.menuItemId,
        qty: item.qty,
        note: item.note || "",
        price: menuItem.price
      });
    }

    const tax = Math.round(subtotal * 0.1 * 100) / 100; // 10% tax
    const total = Math.round((subtotal + tax) * 100) / 100;

    const order = new Order({
      tableId: table._id,
      customerId,
      guestSession,
      items: orderItems,
      subtotal,
      tax,
      total
    });

    await order.save();
    await order.populate([
      { path: 'tableId', select: 'number' },
      { path: 'items.menuItemId', select: 'name price imageUrl' }
    ]);

    // Send real-time notification to kitchen staff
    if (global.io) {
      global.io.to('kitchen').emit('new-order-alert', {
        orderId: order._id,
        orderNumber: order.orderNumber,
        tableNumber: table.number,
        items: order.items,
        total: order.total,
        customerName: req.user?.name || 'Guest Customer',
        timestamp: new Date()
      });
    }

    res.json(order);
  } catch (error) {
    console.error('Order creation error:', error);
    res.status(500).json({ message: "Server error" });
  }
});

// Get Orders (Staff/Admin)
router.get("/", staffOrAdmin, async (req, res) => {
  try {
    const { status, table, page = 1, limit = 20 } = req.query;
    
    let query = {};
    if (status && status !== 'all') query.status = status;
    if (table) query.tableId = table;

    const skip = (page - 1) * limit;
    
    const orders = await Order.find(query)
      .populate('tableId', 'number')
      .populate('customerId', 'name email')
      .populate('items.menuItemId', 'name price')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Order.countDocuments(query);

    res.json({
      orders,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});

// Update Order Status (Staff/Admin)
router.patch("/:id/status", staffOrAdmin, async (req, res) => {
  try {
    const { status } = req.body;
    
    if (!['placed', 'preparing', 'ready', 'served', 'canceled'].includes(status)) {
      return res.status(400).json({ message: "Invalid status" });
    }

    const order = await Order.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    ).populate([
      { path: 'tableId', select: 'number' },
      { path: 'items.menuItemId', select: 'name price' },
      { path: 'customerId', select: 'name' }
    ]);

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    // Send real-time notification to customer
    if (global.io && order.tableId) {
      const statusMessages = {
        'placed': '🍽️ Your order has been placed successfully!',
        'preparing': '👨‍🍳 Your order is being prepared in the kitchen',
        'ready': '✅ Your order is ready for pickup!',
        'served': '🎉 Your order has been served. Enjoy your meal!'
      };

      global.io.to(`table-${order.tableId._id}`).emit('order-update', {
        orderId: order._id,
        orderNumber: order.orderNumber,
        status: status,
        message: statusMessages[status] || 'Order status updated',
        tableNumber: order.tableId.number,
        timestamp: new Date()
      });

      // Also notify kitchen staff
      global.io.to('kitchen').emit('kitchen-update', {
        orderId: order._id,
        orderNumber: order.orderNumber,
        status: status,
        tableNumber: order.tableId.number,
        customerName: order.customerId?.name || 'Guest Customer',
        timestamp: new Date()
      });
    }

    res.json(order);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
