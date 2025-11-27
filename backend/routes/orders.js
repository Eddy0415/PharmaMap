const express = require("express");
const router = express.Router();
const Order = require("../models/Order");
const Item = require("../models/Item");
const Inventory = require("../models/Inventory");

// @route   GET /api/orders
// @desc    Show orders
// @access  Private
router.get("/", async (req, res) => {
  try {
    const { customerId, pharmacyId, status } = req.query;

    let query = {};

    if (customerId) {
      query.customer = customerId;
    }

    if (pharmacyId) {
      query.pharmacy = pharmacyId;
    }

    if (status) {
      query.status = status;
    }

    const orders = await Order.find(query)
      .populate("customer", "firstName lastName email phone")
      .populate("pharmacy", "name address phone")
      .populate("items.item", "name category imageUrl")
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: orders.length,
      orders,
    });
  } catch (error) {
    console.error("Get orders error:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching orders",
      error: error.message,
    });
  }
});

// @route   GET /api/orders/:id
// @desc    Get order by ID
// @access  Private
router.get("/:id", async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate("customer", "firstName lastName email phone")
      .populate("pharmacy", "name address phone")
      .populate("items.item", "name category imageUrl");

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    res.json({
      success: true,
      order,
    });
  } catch (error) {
    console.error("Get order error:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching order",
      error: error.message,
    });
  }
});

// @route   PUT /api/orders/:id
// @desc    Update order
// @access  Private
router.put("/:id", async (req, res) => {
  try {
    const { status, pharmacyNotes } = req.body;

    const updateData = {};
    if (status !== undefined) updateData.status = status;
    if (pharmacyNotes !== undefined) updateData.pharmacyNotes = pharmacyNotes;

    if (status === "confirmed") {
      updateData.confirmedAt = Date.now();
    } else if (status === "completed") {
      updateData.completedAt = Date.now();
    } else if (status === "cancelled") {
      updateData.cancelledAt = Date.now();

      // Restore stock if cancelling
      const order = await Order.findById(req.params.id);
      if (order) {
        for (const orderItem of order.items) {
          const inventory = await Inventory.findOne({
            pharmacy: order.pharmacy,
            item: orderItem.item,
          });

          if (inventory) {
            inventory.quantity += orderItem.quantity;
            await inventory.save();
          }
        }
      }
    }

    const order = await Order.findByIdAndUpdate(req.params.id, updateData, {
      new: true,
    })
      .populate("customer", "firstName lastName email phone")
      .populate("pharmacy", "name address phone")
      .populate("items.item", "name category imageUrl");

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    res.json({
      success: true,
      message: "Order updated successfully",
      order,
    });
  } catch (error) {
    console.error("Update order error:", error);
    res.status(500).json({
      success: false,
      message: "Error updating order",
      error: error.message,
    });
  }
});

// @route   GET /api/orders/pharmacy/:pharmacyId/most-ordered
// @desc    Get most ordered item for a pharmacy
// @access  Private (Pharmacy Owner)
router.get("/pharmacy/:pharmacyId/most-ordered", async (req, res) => {
  try {
    const mongoose = require("mongoose");
    const { pharmacyId } = req.params;

    // Aggregate orders to find most ordered item
    const mostOrdered = await Order.aggregate([
      { $match: { pharmacy: new mongoose.Types.ObjectId(pharmacyId) } },
      { $unwind: "$items" },
      {
        $group: {
          _id: "$items.item",
          totalQuantity: { $sum: "$items.quantity" },
          totalOrders: { $sum: 1 },
        },
      },
      { $sort: { totalQuantity: -1 } },
      { $limit: 1 },
    ]);

    if (mostOrdered.length === 0) {
      return res.json({
        success: true,
        message: "No orders found for this pharmacy",
        item: null,
      });
    }

    const item = await Item.findById(mostOrdered[0]._id);
    if (!item) {
      return res.status(404).json({
        success: false,
        message: "Item not found",
      });
    }

    const inventory = await Inventory.findOne({
      pharmacy: pharmacyId,
      item: mostOrdered[0]._id,
    });

    res.json({
      success: true,
      item: {
        ...item.toObject(),
        totalQuantity: mostOrdered[0].totalQuantity,
        totalOrders: mostOrdered[0].totalOrders,
        inventory: inventory || null,
      },
    });
  } catch (error) {
    console.error("Get most ordered item error:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching most ordered item",
      error: error.message,
    });
  }
});

// @route   POST /api/orders
// @desc    Create new order
// @access  Private
router.post("/", async (req, res) => {
  try {
    const { customer, pharmacy, items, customerNotes } = req.body;

    // Generate order number
    const orderNumber = `ORD-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

    // Validate stock and calculate total
    let totalAmount = 0;
    const orderItems = [];

    for (const orderItem of items) {
      // Get inventory entry for this item at this pharmacy
      const inventory = await Inventory.findOne({
        pharmacy: pharmacy,
        item: orderItem.item,
      });

      if (!inventory) {
        return res.status(404).json({
          success: false,
          message: `Item ${orderItem.item} not available at this pharmacy`,
        });
      }

      if (inventory.quantity < orderItem.quantity) {
        return res.status(400).json({
          success: false,
          message: `Insufficient stock for item`,
        });
      }

      const item = await Item.findById(orderItem.item);
      if (!item) {
        return res.status(404).json({
          success: false,
          message: `Item not found`,
        });
      }

      const subtotal = inventory.price * orderItem.quantity;
      orderItems.push({
        item: item._id,
        quantity: orderItem.quantity,
        priceAtOrder: inventory.price,
        subtotal: subtotal,
      });

      totalAmount += subtotal;

      // Update inventory stock
      inventory.quantity -= orderItem.quantity;
      inventory.totalOrders += 1;
      await inventory.save();
    }

    // Create order
    const order = new Order({
      orderNumber,
      customer,
      pharmacy,
      items: orderItems,
      totalAmount: Math.round(totalAmount * 100) / 100,
      customerNotes,
    });

    await order.save();

    // Update pharmacy total orders
    const pharmacyDoc = await require("../models/Pharmacy").findById(pharmacy);
    if (pharmacyDoc) {
      pharmacyDoc.totalOrders += 1;
      await pharmacyDoc.save();
    }

    res.status(201).json({
      success: true,
      message: "Order created successfully",
      order,
    });
  } catch (error) {
    console.error("Create order error:", error);
    res.status(500).json({
      success: false,
      message: "Error creating order",
      error: error.message,
    });
  }
});

module.exports = router;
