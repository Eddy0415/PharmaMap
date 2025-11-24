const express = require('express');
const router = express.Router();
const Medication = require('../models/Medication');
const Pharmacy = require('../models/Pharmacy');

// @route   GET /api/medications
// @desc    Get all medications
// @access  Public
router.get('/', async (req, res) => {
    try {
        const { search, category, inStock } = req.query;
        
        let query = { active: true };
        
        if (search) {
            query.$or = [
                { name: { $regex: search, $options: 'i' } },
                { genericName: { $regex: search, $options: 'i' } }
            ];
        }
        
        if (category) {
            query.category = category;
        }
        
        if (inStock === 'true') {
            query.stock = { $gt: 0 };
        }

        const medications = await Medication.find(query)
            .populate('pharmacy', 'name address phone isOpen rating')
            .sort({ searchCount: -1, name: 1 });

        res.json({
            success: true,
            count: medications.length,
            medications
        });
    } catch (error) {
        console.error('Get medications error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Error fetching medications',
            error: error.message 
        });
    }
});

// @route   GET /api/medications/search
// @desc    Search medications across pharmacies
// @access  Public
router.get('/search', async (req, res) => {
    try {
        const { query, city, sortBy } = req.query;
        
        if (!query) {
            return res.status(400).json({ 
                success: false, 
                message: 'Search query is required' 
            });
        }

        // Find medications
        let medicationsQuery = {
            active: true,
            $or: [
                { name: { $regex: query, $options: 'i' } },
                { genericName: { $regex: query, $options: 'i' } }
            ]
        };

        let medications = await Medication.find(medicationsQuery)
            .populate({
                path: 'pharmacy',
                match: city ? { 'address.city': city } : {},
                select: 'name address phone isOpen rating workingHours'
            });

        // Filter out medications where pharmacy is null (didn't match city)
        medications = medications.filter(med => med.pharmacy !== null);

        // Sort results
        if (sortBy === 'price-low') {
            medications.sort((a, b) => a.price - b.price);
        } else if (sortBy === 'price-high') {
            medications.sort((a, b) => b.price - a.price);
        } else if (sortBy === 'availability') {
            medications.sort((a, b) => {
                const statusOrder = { 'in-stock': 0, 'low-stock': 1, 'out-of-stock': 2 };
                return statusOrder[a.stockStatus] - statusOrder[b.stockStatus];
            });
        }

        // Group by pharmacy
        const pharmaciesMap = new Map();
        medications.forEach(med => {
            const pharmacyId = med.pharmacy._id.toString();
            if (!pharmaciesMap.has(pharmacyId)) {
                pharmaciesMap.set(pharmacyId, {
                    pharmacy: med.pharmacy,
                    medications: []
                });
            }
            pharmaciesMap.get(pharmacyId).medications.push({
                _id: med._id,
                name: med.name,
                price: med.price,
                stock: med.stock,
                stockStatus: med.stockStatus
            });
        });

        const results = Array.from(pharmaciesMap.values());

        res.json({
            success: true,
            count: results.length,
            totalMedications: medications.length,
            results
        });
    } catch (error) {
        console.error('Search medications error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Error searching medications',
            error: error.message 
        });
    }
});

// @route   GET /api/medications/:id
// @desc    Get medication by ID
// @access  Public
router.get('/:id', async (req, res) => {
    try {
        const medication = await Medication.findById(req.params.id)
            .populate('pharmacy', 'name address phone rating');

        if (!medication) {
            return res.status(404).json({ 
                success: false, 
                message: 'Medication not found' 
            });
        }

        // Increment search count
        medication.searchCount += 1;
        await medication.save();

        res.json({
            success: true,
            medication
        });
    } catch (error) {
        console.error('Get medication error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Error fetching medication',
            error: error.message 
        });
    }
});

// @route   POST /api/medications
// @desc    Create medication
// @access  Private (Pharmacy Owner)
router.post('/', async (req, res) => {
    try {
        const medication = new Medication(req.body);
        await medication.save();

        res.status(201).json({
            success: true,
            message: 'Medication created successfully',
            medication
        });
    } catch (error) {
        console.error('Create medication error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Error creating medication',
            error: error.message 
        });
    }
});

// @route   PUT /api/medications/:id
// @desc    Update medication
// @access  Private (Pharmacy Owner)
router.put('/:id', async (req, res) => {
    try {
        const medication = await Medication.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true, runValidators: true }
        );

        if (!medication) {
            return res.status(404).json({ 
                success: false, 
                message: 'Medication not found' 
            });
        }

        res.json({
            success: true,
            message: 'Medication updated successfully',
            medication
        });
    } catch (error) {
        console.error('Update medication error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Error updating medication',
            error: error.message 
        });
    }
});

// @route   DELETE /api/medications/:id
// @desc    Delete medication
// @access  Private (Pharmacy Owner)
router.delete('/:id', async (req, res) => {
    try {
        const medication = await Medication.findByIdAndUpdate(
            req.params.id,
            { active: false },
            { new: true }
        );

        if (!medication) {
            return res.status(404).json({ 
                success: false, 
                message: 'Medication not found' 
            });
        }

        res.json({
            success: true,
            message: 'Medication deleted successfully'
        });
    } catch (error) {
        console.error('Delete medication error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Error deleting medication',
            error: error.message 
        });
    }
});

// @route   GET /api/medications/popular/all
// @desc    Get popular medications
// @access  Public
router.get('/popular/all', async (req, res) => {
    try {
        const medications = await Medication.find({ active: true })
            .populate('pharmacy', 'name address')
            .sort({ searchCount: -1 })
            .limit(10);

        res.json({
            success: true,
            count: medications.length,
            medications
        });
    } catch (error) {
        console.error('Get popular medications error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Error fetching popular medications',
            error: error.message 
        });
    }
});

module.exports = router;
