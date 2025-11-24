const express = require('express');
const router = express.Router();
const Pharmacy = require('../models/Pharmacy');
const Medication = require('../models/Medication');

// @route   GET /api/pharmacies
// @desc    Get all pharmacies
// @access  Public
router.get('/', async (req, res) => {
    try {
        const { search, city, featured, isOpen } = req.query;
        
        let query = {};
        
        if (search) {
            query.name = { $regex: search, $options: 'i' };
        }
        
        if (city) {
            query['address.city'] = city;
        }
        
        if (featured === 'true') {
            query.featured = true;
        }
        
        if (isOpen === 'true') {
            query.isOpen = true;
        }

        const pharmacies = await Pharmacy.find(query)
            .populate('owner', 'firstName lastName email')
            .sort({ featured: -1, rating: -1 });

        res.json({
            success: true,
            count: pharmacies.length,
            pharmacies
        });
    } catch (error) {
        console.error('Get pharmacies error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Error fetching pharmacies',
            error: error.message 
        });
    }
});

// @route   GET /api/pharmacies/:id
// @desc    Get pharmacy by ID
// @access  Public
router.get('/:id', async (req, res) => {
    try {
        const pharmacy = await Pharmacy.findById(req.params.id)
            .populate('owner', 'firstName lastName email phone')
            .populate('reviews.user', 'firstName lastName');

        if (!pharmacy) {
            return res.status(404).json({ 
                success: false, 
                message: 'Pharmacy not found' 
            });
        }

        // Get medications for this pharmacy
        const medications = await Medication.find({ 
            pharmacy: pharmacy._id,
            active: true 
        }).sort({ name: 1 });

        res.json({
            success: true,
            pharmacy,
            medications
        });
    } catch (error) {
        console.error('Get pharmacy error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Error fetching pharmacy',
            error: error.message 
        });
    }
});

// @route   GET /api/pharmacies/:id/medications
// @desc    Get medications for a pharmacy
// @access  Public
router.get('/:id/medications', async (req, res) => {
    try {
        const { search, category } = req.query;
        
        let query = { 
            pharmacy: req.params.id,
            active: true 
        };
        
        if (search) {
            query.name = { $regex: search, $options: 'i' };
        }
        
        if (category) {
            query.category = category;
        }

        const medications = await Medication.find(query).sort({ name: 1 });

        res.json({
            success: true,
            count: medications.length,
            medications
        });
    } catch (error) {
        console.error('Get pharmacy medications error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Error fetching medications',
            error: error.message 
        });
    }
});

// @route   POST /api/pharmacies/:id/reviews
// @desc    Add review to pharmacy
// @access  Private
router.post('/:id/reviews', async (req, res) => {
    try {
        const { rating, comment, userId } = req.body;

        const pharmacy = await Pharmacy.findById(req.params.id);
        
        if (!pharmacy) {
            return res.status(404).json({ 
                success: false, 
                message: 'Pharmacy not found' 
            });
        }

        // Check if user already reviewed
        const existingReview = pharmacy.reviews.find(
            r => r.user.toString() === userId
        );

        if (existingReview) {
            return res.status(400).json({ 
                success: false, 
                message: 'You have already reviewed this pharmacy' 
            });
        }

        pharmacy.reviews.push({
            user: userId,
            rating,
            comment
        });

        pharmacy.updateRating();
        await pharmacy.save();

        res.json({
            success: true,
            message: 'Review added successfully',
            pharmacy
        });
    } catch (error) {
        console.error('Add review error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Error adding review',
            error: error.message 
        });
    }
});

// @route   PUT /api/pharmacies/:id
// @desc    Update pharmacy
// @access  Private (Pharmacy Owner)
router.put('/:id', async (req, res) => {
    try {
        const pharmacy = await Pharmacy.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true, runValidators: true }
        );

        if (!pharmacy) {
            return res.status(404).json({ 
                success: false, 
                message: 'Pharmacy not found' 
            });
        }

        res.json({
            success: true,
            message: 'Pharmacy updated successfully',
            pharmacy
        });
    } catch (error) {
        console.error('Update pharmacy error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Error updating pharmacy',
            error: error.message 
        });
    }
});

module.exports = router;
