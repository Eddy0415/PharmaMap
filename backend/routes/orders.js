const express = require('express');
const router = express.Router();
const Order = require('../models/Order');
const Medication = require('../models/Medication');

// @route   GET /api/orders
// @desc    Get all orders (for admin/pharmacy)
// @access  Private
router.get('/', async (req, res) => {
    try {
        const { userId, pharmacyId, status } = req.query;
        
        let query = {};
        
        if (userId) {
            query.user = userId;
        }
        
        if (pharmacyId) {
            query.pharmacy = pharmacyId;
        }
        
        if (status) {
            query.status = status;
        }

        const orders = await Order.find(query)
            .populate('user', 'firstName lastName email phone')
            .populate('pharmacy', 'name address phone')
            .populate('medications.medication', 'name category')
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
            .populate('user', 'firstName lastName email phone')
            .populate('pharmacy', 'name address phone')
            .populate('medications.medication', 'name category price');

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
        const { user, pharmacy, medications, deliveryAddress, deliveryType, paymentMethod, notes } = req.body;

        // Validate stock and calculate total
        let totalAmount = 0;
        const orderMedications = [];

        for (const item of medications) {
            const medication = await Medication.findById(item.medication);
            
            if (!medication) {
                return res.status(404).json({ 
                    success: false, 
                    message: `Medication ${item.medication} not found` 
                });
            }

            if (medication.stock < item.quantity) {
                return res.status(400).json({ 
                    success: false, 
                    message: `Insufficient stock for ${medication.name}` 
                });
            }

            orderMedications.push({
                medication: medication._id,
                name: medication.name,
                quantity: item.quantity,
                price: medication.price,
                subtotal: medication.price * item.quantity
            });

            totalAmount += medication.price * item.quantity;

            // Update stock
            medication.stock -= item.quantity;
            await medication.save();
        }

        // Create order
        const order = new Order({
            user,
            pharmacy,
            medications: orderMedications,
            totalAmount,
            deliveryAddress,
            deliveryType,
            paymentMethod,
            notes
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

        const order = await Order.findByIdAndUpdate(
            req.params.id,
            { 
                status,
                ...(status === 'completed' ? { completedAt: Date.now() } : {})
            },
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

        if (order.status !== 'pending') {
            return res.status(400).json({ 
                success: false, 
                message: 'Cannot cancel order that is not pending' 
            });
        }

        // Restore stock
        for (const item of order.medications) {
            const medication = await Medication.findById(item.medication);
            if (medication) {
                medication.stock += item.quantity;
                await medication.save();
            }
        }

        order.status = 'cancelled';
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
