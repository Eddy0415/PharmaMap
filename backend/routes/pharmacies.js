const express = require("express");
const router = express.Router();
const Pharmacy = require("../models/Pharmacy");
const Review = require("../models/Review");

// @route   GET /api/pharmacies
// @desc    Search all pharmacies
// @access  Public
router.get("/", async (req, res) => {
  try {
    const { search, city, isOpen } = req.query;

    let query = { isActive: true };

    if (search) {
      query.name = { $regex: search, $options: "i" };
    }

    if (city) {
      query["address.city"] = city;
    }

    if (isOpen === "true") {
      query.isOpen = true;
    }

    const pharmacies = await Pharmacy.find(query)
      .populate("owner", "firstName lastName email")
      .sort({ averageRating: -1, totalReviews: -1 });

    res.json({
      success: true,
      count: pharmacies.length,
      pharmacies,
    });
  } catch (error) {
    console.error("Get pharmacies error:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching pharmacies",
      error: error.message,
    });
  }
});

// @route   GET /api/pharmacies/featured
// @desc    Get all featured pharmacies
// @access  Public
router.get("/featured", async (req, res) => {
  try {
    const pharmacies = await Pharmacy.find({
      featured: true,
      isActive: true,
    })
      .populate("owner", "firstName lastName email")
      .sort({ averageRating: -1, totalReviews: -1 });

    res.json({
      success: true,
      count: pharmacies.length,
      pharmacies,
    });
  } catch (error) {
    console.error("Get featured pharmacies error:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching featured pharmacies",
      error: error.message,
    });
  }
});

// @route   GET /api/pharmacies/:id
// @desc    Get specific pharmacy by ID
// @access  Public
router.get("/:id", async (req, res) => {
  try {
    const pharmacy = await Pharmacy.findById(req.params.id).populate(
      "owner",
      "firstName lastName email phone"
    );

    if (!pharmacy) {
      return res.status(404).json({
        success: false,
        message: "Pharmacy not found",
      });
    }

    res.json({
      success: true,
      pharmacy,
    });
  } catch (error) {
    console.error("Get pharmacy error:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching pharmacy",
      error: error.message,
    });
  }
});

// @route   PUT /api/pharmacies/:id
// @desc    Update pharmacy info
// @access  Private (Pharmacy Owner)
router.put("/:id", async (req, res) => {
  try {
    const {
      name,
      address,
      phone,
      email,
      isOpen,
      is24Hours,
      logoUrl,
      featured,
    } = req.body;

    const updateData = { updatedAt: Date.now() };
    if (name !== undefined) updateData.name = name;
    if (address !== undefined) updateData.address = address;
    if (phone !== undefined) updateData.phone = phone;
    if (email !== undefined) updateData.email = email;
    if (isOpen !== undefined) updateData.isOpen = isOpen;
    if (is24Hours !== undefined) updateData.is24Hours = is24Hours;
    if (logoUrl !== undefined) updateData.logoUrl = logoUrl;
    if (featured !== undefined) updateData.featured = featured;

    const pharmacy = await Pharmacy.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    );

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

// @route   PUT /api/pharmacies/:id/working-hours
// @desc    Update working hours
// @access  Private (Pharmacy Owner)
router.put("/:id/working-hours", async (req, res) => {
  try {
    const { workingHours } = req.body;

    if (!workingHours || !Array.isArray(workingHours)) {
      return res.status(400).json({
        success: false,
        message: "Working hours array is required",
      });
    }

    const pharmacy = await Pharmacy.findByIdAndUpdate(
      req.params.id,
      { workingHours, updatedAt: Date.now() },
      { new: true, runValidators: true }
    );

    if (!pharmacy) {
      return res.status(404).json({
        success: false,
        message: "Pharmacy not found",
      });
    }

    res.json({
      success: true,
      message: "Working hours updated successfully",
      pharmacy,
    });
  } catch (error) {
    console.error("Update working hours error:", error);
    res.status(500).json({
      success: false,
      message: "Error updating working hours",
      error: error.message,
    });
  }
});

// @route   GET /api/pharmacies/:id/reviews
// @desc    Show reviews for a pharmacy
// @access  Public
router.get("/:id/reviews", async (req, res) => {
  try {
    const pharmacy = await Pharmacy.findById(req.params.id);

    if (!pharmacy) {
      return res.status(404).json({
        success: false,
        message: "Pharmacy not found",
      });
    }

    const reviews = await Review.find({ pharmacy: req.params.id })
      .populate("user", "firstName lastName")
      .populate("order", "orderNumber")
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: reviews.length,
      reviews,
    });
  } catch (error) {
    console.error("Get pharmacy reviews error:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching reviews",
      error: error.message,
    });
  }
});

module.exports = router;
