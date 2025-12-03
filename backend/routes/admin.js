const express = require("express");
const router = express.Router();
const User = require("../models/User");
const Pharmacy = require("../models/Pharmacy");
const Item = require("../models/Item");
const Order = require("../models/Order");
const Review = require("../models/Review");
const Inventory = require("../models/Inventory");
const adminAuth = require("../middleware/adminAuth");

// ==============================
// USERS MANAGEMENT
// ==============================

// @route   GET /api/admin/users
// @desc    Get all users
// @access  Private (Admin only)
router.get("/users", adminAuth, async (req, res) => {
  try {
    const { search, userType, page = 1, limit = 50 } = req.query;
    const query = {};

    if (search) {
      query.$or = [
        { firstName: { $regex: search, $options: "i" } },
        { lastName: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
      ];
    }

    if (userType) {
      query.userType = userType;
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const users = await User.find(query)
      .select("-__v")
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip(skip);

    const total = await User.countDocuments(query);

    res.json({
      success: true,
      users,
      total,
      page: parseInt(page),
      limit: parseInt(limit),
    });
  } catch (error) {
    console.error("Get all users error:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching users",
      error: error.message,
    });
  }
});

// @route   GET /api/admin/users/:id
// @desc    Get user by ID
// @access  Private (Admin only)
router.get("/users/:id", adminAuth, async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select("-__v");
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    res.json({
      success: true,
      user,
    });
  } catch (error) {
    console.error("Get user error:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching user",
      error: error.message,
    });
  }
});

// @route   PUT /api/admin/users/:id
// @desc    Update user
// @access  Private (Admin only)
router.put("/users/:id", adminAuth, async (req, res) => {
  try {
    const {
      firstName,
      lastName,
      phone,
      dateOfBirth,
      gender,
      avatarUrl,
      userType,
      isActive,
      isVerified,
    } = req.body;

    const updateData = {};
    if (firstName !== undefined) updateData.firstName = firstName;
    if (lastName !== undefined) updateData.lastName = lastName;
    if (phone !== undefined) updateData.phone = phone;
    if (dateOfBirth !== undefined) updateData.dateOfBirth = dateOfBirth;
    if (gender !== undefined) updateData.gender = gender;
    if (avatarUrl !== undefined) updateData.avatarUrl = avatarUrl;
    if (userType !== undefined) updateData.userType = userType;
    if (isActive !== undefined) updateData.isActive = isActive;
    if (isVerified !== undefined) updateData.isVerified = isVerified;
    updateData.updatedAt = Date.now();

    const user = await User.findByIdAndUpdate(req.params.id, updateData, {
      new: true,
      runValidators: true,
    }).select("-__v");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    res.json({
      success: true,
      message: "User updated successfully",
      user,
    });
  } catch (error) {
    console.error("Update user error:", error);
    res.status(500).json({
      success: false,
      message: "Error updating user",
      error: error.message,
    });
  }
});

// @route   DELETE /api/admin/users/:id
// @desc    Delete user
// @access  Private (Admin only)
router.delete("/users/:id", adminAuth, async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Prevent deleting yourself
    if (user._id.toString() === req.user._id.toString()) {
      return res.status(400).json({
        success: false,
        message: "You cannot delete your own account",
      });
    }

    // Delete associated data
    await Review.deleteMany({ user: user._id });
    await Order.deleteMany({ customer: user._id });

    await User.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: "User deleted successfully",
    });
  } catch (error) {
    console.error("Delete user error:", error);
    res.status(500).json({
      success: false,
      message: "Error deleting user",
      error: error.message,
    });
  }
});

// ==============================
// PHARMACIES MANAGEMENT
// ==============================

// @route   GET /api/admin/pharmacies
// @desc    Get all pharmacies
// @access  Private (Admin only)
router.get("/pharmacies", adminAuth, async (req, res) => {
  try {
    const { search, page = 1, limit = 50 } = req.query;
    const query = {};

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { "address.street": { $regex: search, $options: "i" } },
        { "address.city": { $regex: search, $options: "i" } },
      ];
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const pharmacies = await Pharmacy.find(query)
      .select("-__v")
      .populate("owner", "firstName lastName email")
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip(skip);

    const total = await Pharmacy.countDocuments(query);

    res.json({
      success: true,
      pharmacies,
      total,
      page: parseInt(page),
      limit: parseInt(limit),
    });
  } catch (error) {
    console.error("Get all pharmacies error:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching pharmacies",
      error: error.message,
    });
  }
});

// @route   PUT /api/admin/pharmacies/:id
// @desc    Update pharmacy
// @access  Private (Admin only)
router.put("/pharmacies/:id", adminAuth, async (req, res) => {
  try {
    const pharmacy = await Pharmacy.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    }).select("-__v");

    if (!pharmacy) {
      return res.status(404).json({
        success: false,
        message: "Pharmacy not found",
      });
    }

    res.json({
      success: true,
      message: "Pharmacy updated successfully",
      pharmacy,
    });
  } catch (error) {
    console.error("Update pharmacy error:", error);
    res.status(500).json({
      success: false,
      message: "Error updating pharmacy",
      error: error.message,
    });
  }
});

// @route   DELETE /api/admin/pharmacies/:id
// @desc    Delete pharmacy
// @access  Private (Admin only)
router.delete("/pharmacies/:id", adminAuth, async (req, res) => {
  try {
    const pharmacy = await Pharmacy.findById(req.params.id);
    if (!pharmacy) {
      return res.status(404).json({
        success: false,
        message: "Pharmacy not found",
      });
    }

    // Delete associated data
    await Inventory.deleteMany({ pharmacy: pharmacy._id });
    await Review.deleteMany({ pharmacy: pharmacy._id });
    await Order.deleteMany({ pharmacy: pharmacy._id });

    // Remove pharmacy reference from users
    await User.updateMany(
      { pharmacy: pharmacy._id },
      { $unset: { pharmacy: "" } }
    );

    await Pharmacy.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: "Pharmacy deleted successfully",
    });
  } catch (error) {
    console.error("Delete pharmacy error:", error);
    res.status(500).json({
      success: false,
      message: "Error deleting pharmacy",
      error: error.message,
    });
  }
});

// ==============================
// MEDICATIONS MANAGEMENT
// ==============================

// @route   GET /api/admin/medications
// @desc    Get all medications
// @access  Private (Admin only)
router.get("/medications", adminAuth, async (req, res) => {
  try {
    const { search, category, page = 1, limit = 50 } = req.query;
    const query = {};

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { category: { $regex: search, $options: "i" } },
        { dosage: { $regex: search, $options: "i" } },
      ];
    }

    if (category) {
      query.category = category;
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const medications = await Item.find(query)
      .select("-__v")
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip(skip);

    const total = await Item.countDocuments(query);

    res.json({
      success: true,
      medications,
      total,
      page: parseInt(page),
      limit: parseInt(limit),
    });
  } catch (error) {
    console.error("Get all medications error:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching medications",
      error: error.message,
    });
  }
});

// @route   DELETE /api/admin/medications/:id
// @desc    Delete medication
// @access  Private (Admin only)
router.delete("/medications/:id", adminAuth, async (req, res) => {
  try {
    const medication = await Item.findById(req.params.id);
    if (!medication) {
      return res.status(404).json({
        success: false,
        message: "Medication not found",
      });
    }

    // Delete associated inventory
    await Inventory.deleteMany({ item: medication._id });

    await Item.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: "Medication deleted successfully",
    });
  } catch (error) {
    console.error("Delete medication error:", error);
    res.status(500).json({
      success: false,
      message: "Error deleting medication",
      error: error.message,
    });
  }
});

// ==============================
// ORDERS MANAGEMENT
// ==============================

// @route   GET /api/admin/orders
// @desc    Get all orders
// @access  Private (Admin only)
router.get("/orders", adminAuth, async (req, res) => {
  try {
    const { search, status, page = 1, limit = 50 } = req.query;
    const query = {};

    if (status) {
      query.status = status;
    }

    if (search) {
      query.orderNumber = { $regex: search, $options: "i" };
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const orders = await Order.find(query)
      .select("-__v")
      .populate("customer", "firstName lastName email")
      .populate("pharmacy", "name address")
      .populate("items.item", "name category dosage")
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip(skip);

    const total = await Order.countDocuments(query);

    res.json({
      success: true,
      orders,
      total,
      page: parseInt(page),
      limit: parseInt(limit),
    });
  } catch (error) {
    console.error("Get all orders error:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching orders",
      error: error.message,
    });
  }
});

// @route   DELETE /api/admin/orders/:id
// @desc    Delete order
// @access  Private (Admin only)
router.delete("/orders/:id", adminAuth, async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    await Order.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: "Order deleted successfully",
    });
  } catch (error) {
    console.error("Delete order error:", error);
    res.status(500).json({
      success: false,
      message: "Error deleting order",
      error: error.message,
    });
  }
});

// ==============================
// REVIEWS MANAGEMENT
// ==============================

// @route   GET /api/admin/reviews
// @desc    Get all reviews
// @access  Private (Admin only)
router.get("/reviews", adminAuth, async (req, res) => {
  try {
    const { search, page = 1, limit = 50 } = req.query;
    const query = {};

    if (search) {
      query.comment = { $regex: search, $options: "i" };
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const reviews = await Review.find(query)
      .select("-__v")
      .populate("user", "firstName lastName email")
      .populate("pharmacy", "name")
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip(skip);

    const total = await Review.countDocuments(query);

    res.json({
      success: true,
      reviews,
      total,
      page: parseInt(page),
      limit: parseInt(limit),
    });
  } catch (error) {
    console.error("Get all reviews error:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching reviews",
      error: error.message,
    });
  }
});

// @route   DELETE /api/admin/reviews/:id
// @desc    Delete review
// @access  Private (Admin only)
router.delete("/reviews/:id", adminAuth, async (req, res) => {
  try {
    const review = await Review.findById(req.params.id);
    if (!review) {
      return res.status(404).json({
        success: false,
        message: "Review not found",
      });
    }

    // Update pharmacy rating after deletion
    const pharmacy = await Pharmacy.findById(review.pharmacy);

    // Delete the review
    await Review.findByIdAndDelete(req.params.id);

    // Recalculate pharmacy rating if pharmacy exists
    if (pharmacy) {
      const remainingReviews = await Review.find({ pharmacy: pharmacy._id });
      if (remainingReviews.length > 0) {
        const totalRating = remainingReviews.reduce(
          (sum, r) => sum + (r.rating || 0),
          0
        );
        pharmacy.averageRating =
          Math.round((totalRating / remainingReviews.length) * 10) / 10;
        pharmacy.totalReviews = remainingReviews.length;
      } else {
        pharmacy.averageRating = 0;
        pharmacy.totalReviews = 0;
      }
      await pharmacy.save();
    }

    res.json({
      success: true,
      message: "Review deleted successfully",
    });
  } catch (error) {
    console.error("Delete review error:", error);
    res.status(500).json({
      success: false,
      message: "Error deleting review",
      error: error.message,
    });
  }
});

// ==============================
// STATISTICS
// ==============================

// @route   GET /api/admin/statistics
// @desc    Get admin statistics
// @access  Private (Admin only)
router.get("/statistics", adminAuth, async (req, res) => {
  try {
    const [
      totalUsers,
      totalPharmacies,
      totalMedications,
      totalOrders,
      totalReviews,
      activeUsers,
      activePharmacies,
      pendingOrders,
      completedOrders,
    ] = await Promise.all([
      User.countDocuments(),
      Pharmacy.countDocuments(),
      Item.countDocuments(),
      Order.countDocuments(),
      Review.countDocuments(),
      User.countDocuments({ isActive: true }),
      Pharmacy.countDocuments({ isOpen: true }),
      Order.countDocuments({ status: "pending" }),
      Order.countDocuments({ status: "completed" }),
    ]);

    // Calculate total revenue
    const completedOrdersData = await Order.find({
      status: "completed",
    }).select("totalAmount");
    const totalRevenue = completedOrdersData.reduce(
      (sum, order) => sum + (order.totalAmount || 0),
      0
    );

    res.json({
      success: true,
      statistics: {
        totalUsers,
        totalPharmacies,
        totalMedications,
        totalOrders,
        totalReviews,
        activeUsers,
        activePharmacies,
        pendingOrders,
        completedOrders,
        totalRevenue,
      },
    });
  } catch (error) {
    console.error("Get statistics error:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching statistics",
      error: error.message,
    });
  }
});

module.exports = router;
