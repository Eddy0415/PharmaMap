const express = require('express');
const router = express.Router();
const Order = require('../models/Order');
const Item = require('../models/Item');
const Inventory = require('../models/Inventory');

// @route   GET /api/orders
// @desc    Get all orders (for admin/pharmacy)
// @access  Private
router.get('/', async (req, res) => {
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
            .populate('customer', 'firstName lastName email phone')
            .populate('pharmacy', 'name address phone')
            .populate('items.item', 'name category imageUrl')
            .sort({ createdAt: -1 });

        res.json({
            success: true,
            count: orders.length,
            orders
        });
    } catch (error) {
        console.error('Get orders error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Error fetching orders',
            error: error.message 
        });
    }
});

// @route   GET /api/orders/:id
// @desc    Get order by ID
// @access  Private
router.get('/:id', async (req, res) => {
    try {
        const order = await Order.findById(req.params.id)
            .populate('customer', 'firstName lastName email phone')
            .populate('pharmacy', 'name address phone')
            .populate('items.item', 'name category imageUrl');

        if (!order) {
            return res.status(404).json({ 
                success: false, 
                message: 'Order not found' 
            });
        }

        res.json({
            success: true,
            order
        });
    } catch (error) {
        console.error('Get order error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Error fetching order',
            error: error.message 
        });
    }
});

// @route   POST /api/orders
// @desc    Create new order
// @access  Private
router.post('/', async (req, res) => {
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
                item: orderItem.item
            });
            
            if (!inventory) {
                return res.status(404).json({ 
                    success: false, 
                    message: `Item ${orderItem.item} not available at this pharmacy` 
                });
            }

            if (inventory.quantity < orderItem.quantity) {
                return res.status(400).json({ 
                    success: false, 
                    message: `Insufficient stock for item` 
                });
            }

            const item = await Item.findById(orderItem.item);
            if (!item) {
                return res.status(404).json({ 
                    success: false, 
                    message: `Item not found` 
                });
            }

            const subtotal = inventory.price * orderItem.quantity;
            orderItems.push({
                item: item._id,
                quantity: orderItem.quantity,
                priceAtOrder: inventory.price,
                subtotal: subtotal
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
            totalAmount,
            customerNotes
        });

        await order.save();

        res.status(201).json({
            success: true,
            message: 'Order created successfully',
            order
        });
    } catch (error) {
        console.error('Create order error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Error creating order',
            error: error.message 
        });
    }
});

// @route   PUT /api/orders/:id
// @desc    Update order status
// @access  Private
router.put('/:id', async (req, res) => {
    try {
        const { status } = req.body;

        const updateData = { status };
        
        if (status === 'confirmed') {
            updateData.confirmedAt = Date.now();
        } else if (status === 'completed') {
            updateData.completedAt = Date.now();
        } else if (status === 'cancelled') {
            updateData.cancelledAt = Date.now();
        }

        const order = await Order.findByIdAndUpdate(
            req.params.id,
            updateData,
            { new: true }
        );

        if (!order) {
            return res.status(404).json({ 
                success: false, 
                message: 'Order not found' 
            });
        }

        res.json({
            success: true,
            message: 'Order updated successfully',
            order
        });
    } catch (error) {
        console.error('Update order error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Error updating order',
            error: error.message 
        });
    }
});

// @route   DELETE /api/orders/:id
// @desc    Cancel order
// @access  Private
router.delete('/:id', async (req, res) => {
    try {
        const order = await Order.findById(req.params.id);

        if (!order) {
            return res.status(404).json({ 
                success: false, 
                message: 'Order not found' 
            });
        }

        if (order.status === 'cancelled' || order.status === 'completed') {
            return res.status(400).json({ 
                success: false, 
                message: `Cannot cancel order with status: ${order.status}` 
            });
        }

        // Restore stock
        for (const orderItem of order.items) {
            const inventory = await Inventory.findOne({
                pharmacy: order.pharmacy,
                item: orderItem.item
            });
            
            if (inventory) {
                inventory.quantity += orderItem.quantity;
                await inventory.save();
            }
        }

        order.status = 'cancelled';
        order.cancelledAt = Date.now();
        await order.save();

        res.json({
            success: true,
            message: 'Order cancelled successfully'
        });
    } catch (error) {
        console.error('Cancel order error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Error cancelling order',
            error: error.message 
        });
    }
});

module.exports = router;
