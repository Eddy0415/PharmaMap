const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Pharmacy = require('../models/Pharmacy');

// @route   GET /api/users/:id
// @desc    Get user profile
// @access  Private
router.get('/:id', async (req, res) => {
    try {
        const user = await User.findById(req.params.id)
            .select('-password')
            .populate('favorites', 'name address rating');

        if (!user) {
            return res.status(404).json({ 
                success: false, 
                message: 'User not found' 
            });
        }

        res.json({
            success: true,
            user
        });
    } catch (error) {
        console.error('Get user error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Error fetching user',
            error: error.message 
        });
    }
});

// @route   PUT /api/users/:id
// @desc    Update user profile
// @access  Private
router.put('/:id', async (req, res) => {
    try {
        const { firstName, lastName, phone, dateOfBirth, gender } = req.body;

        const user = await User.findByIdAndUpdate(
            req.params.id,
            { firstName, lastName, phone, dateOfBirth, gender },
            { new: true, runValidators: true }
        ).select('-password');

        if (!user) {
            return res.status(404).json({ 
                success: false, 
                message: 'User not found' 
            });
        }

        res.json({
            success: true,
            message: 'Profile updated successfully',
            user
        });
    } catch (error) {
        console.error('Update user error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Error updating profile',
            error: error.message 
        });
    }
});

// @route   POST /api/users/:id/addresses
// @desc    Add address
// @access  Private
router.post('/:id/addresses', async (req, res) => {
    try {
        const { type, street, city, isDefault } = req.body;

        const user = await User.findById(req.params.id);

        if (!user) {
            return res.status(404).json({ 
                success: false, 
                message: 'User not found' 
            });
        }

        // If this is default, unset other defaults
        if (isDefault) {
            user.addresses.forEach(addr => {
                addr.isDefault = false;
            });
        }

        user.addresses.push({
            type,
            street,
            city,
            isDefault
        });

        await user.save();

        res.json({
            success: true,
            message: 'Address added successfully',
            addresses: user.addresses
        });
    } catch (error) {
        console.error('Add address error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Error adding address',
            error: error.message 
        });
    }
});

// @route   PUT /api/users/:id/addresses/:addressId
// @desc    Update address
// @access  Private
router.put('/:id/addresses/:addressId', async (req, res) => {
    try {
        const user = await User.findById(req.params.id);

        if (!user) {
            return res.status(404).json({ 
                success: false, 
                message: 'User not found' 
            });
        }

        const address = user.addresses.id(req.params.addressId);

        if (!address) {
            return res.status(404).json({ 
                success: false, 
                message: 'Address not found' 
            });
        }

        Object.assign(address, req.body);

        // If setting as default, unset others
        if (req.body.isDefault) {
            user.addresses.forEach(addr => {
                if (addr._id.toString() !== req.params.addressId) {
                    addr.isDefault = false;
                }
            });
        }

        await user.save();

        res.json({
            success: true,
            message: 'Address updated successfully',
            addresses: user.addresses
        });
    } catch (error) {
        console.error('Update address error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Error updating address',
            error: error.message 
        });
    }
});

// @route   DELETE /api/users/:id/addresses/:addressId
// @desc    Delete address
// @access  Private
router.delete('/:id/addresses/:addressId', async (req, res) => {
    try {
        const user = await User.findById(req.params.id);

        if (!user) {
            return res.status(404).json({ 
                success: false, 
                message: 'User not found' 
            });
        }

        user.addresses.pull(req.params.addressId);
        await user.save();

        res.json({
            success: true,
            message: 'Address deleted successfully',
            addresses: user.addresses
        });
    } catch (error) {
        console.error('Delete address error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Error deleting address',
            error: error.message 
        });
    }
});

// @route   POST /api/users/:id/favorites/:pharmacyId
// @desc    Add pharmacy to favorites
// @access  Private
router.post('/:id/favorites/:pharmacyId', async (req, res) => {
    try {
        const user = await User.findById(req.params.id);

        if (!user) {
            return res.status(404).json({ 
                success: false, 
                message: 'User not found' 
            });
        }

        const pharmacy = await Pharmacy.findById(req.params.pharmacyId);

        if (!pharmacy) {
            return res.status(404).json({ 
                success: false, 
                message: 'Pharmacy not found' 
            });
        }

        // Check if already in favorites
        if (user.favorites.includes(req.params.pharmacyId)) {
            return res.status(400).json({ 
                success: false, 
                message: 'Pharmacy already in favorites' 
            });
        }

        user.favorites.push(req.params.pharmacyId);
        await user.save();

        res.json({
            success: true,
            message: 'Pharmacy added to favorites',
            favorites: user.favorites
        });
    } catch (error) {
        console.error('Add favorite error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Error adding to favorites',
            error: error.message 
        });
    }
});

// @route   DELETE /api/users/:id/favorites/:pharmacyId
// @desc    Remove pharmacy from favorites
// @access  Private
router.delete('/:id/favorites/:pharmacyId', async (req, res) => {
    try {
        const user = await User.findById(req.params.id);

        if (!user) {
            return res.status(404).json({ 
                success: false, 
                message: 'User not found' 
            });
        }

        user.favorites.pull(req.params.pharmacyId);
        await user.save();

        res.json({
            success: true,
            message: 'Pharmacy removed from favorites',
            favorites: user.favorites
        });
    } catch (error) {
        console.error('Remove favorite error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Error removing from favorites',
            error: error.message 
        });
    }
});

// @route   PUT /api/users/:id/password
// @desc    Change password
// @access  Private
router.put('/:id/password', async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;

        const user = await User.findById(req.params.id);

        if (!user) {
            return res.status(404).json({ 
                success: false, 
                message: 'User not found' 
            });
        }

        // Verify current password
        const isMatch = await user.comparePassword(currentPassword);

        if (!isMatch) {
            return res.status(401).json({ 
                success: false, 
                message: 'Current password is incorrect' 
            });
        }

        // Update password
        user.password = newPassword;
        await user.save();

        res.json({
            success: true,
            message: 'Password updated successfully'
        });
    } catch (error) {
        console.error('Change password error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Error changing password',
            error: error.message 
        });
    }
});

module.exports = router;
