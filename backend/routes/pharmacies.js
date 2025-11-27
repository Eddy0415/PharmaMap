const express = require("express");
const router = express.Router();
const Pharmacy = require("../models/Pharmacy");
const Item = require("../models/Item");
const Inventory = require("../models/Inventory");
const Review = require("../models/Review");

// @route   GET /api/pharmacies
// @desc    Get all pharmacies
// @access  Public
router.get("/", async (req, res) => {
  try {
    const { search, city, featured, isOpen } = req.query;

    let query = {};

    if (search) {
      query.name = { $regex: search, $options: "i" };
    }

    if (city) {
      query["address.city"] = city;
    }

    if (featured === "true") {
      query.featured = true;
    }

    if (isOpen === "true") {
      query.isOpen = true;
    }

    const pharmacies = await Pharmacy.find(query)
      .populate("owner", "firstName lastName email")
      .sort({ featured: -1, rating: -1 });

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

// @route   GET /api/pharmacies/:id
// @desc    Get pharmacy by ID
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

    // Get inventory items for this pharmacy
    const inventory = await Inventory.find({
      pharmacy: pharmacy._id,
      isAvailable: true,
    })
      .populate(
        "item",
        "name category imageUrl description form dosage requiresPrescription"
      )
      .sort({ "item.name": 1 });

    // Get reviews for this pharmacy
    const reviews = await Review.find({ pharmacy: pharmacy._id })
      .populate("user", "firstName lastName")
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      pharmacy,
      inventory,
      reviews,
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

// @route   GET /api/pharmacies/:id/inventory
// @desc    Get inventory items for a pharmacy
// @access  Public
router.get("/:id/inventory", async (req, res) => {
  try {
    const { search, category, inStock } = req.query;

    let inventoryQuery = {
      pharmacy: req.params.id,
      isAvailable: true,
    };

    if (inStock === "true") {
      inventoryQuery.quantity = { $gt: 0 };
    }

    let inventory = await Inventory.find(inventoryQuery)
      .populate({
        path: "item",
        match: {
          ...(search
            ? {
                $or: [
                  { name: { $regex: search, $options: "i" } },
                  { scientificName: { $regex: search, $options: "i" } },
                ],
              }
            : {}),
          ...(category ? { category } : {}),
        },
      })
      .sort({ "item.name": 1 });

    // Filter out items that didn't match the search/category
    inventory = inventory.filter((inv) => inv.item !== null);

    res.json({
      success: true,
      count: inventory.length,
      inventory,
    });
  } catch (error) {
    console.error("Get pharmacy inventory error:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching inventory",
      error: error.message,
    });
  }
});

// @route   POST /api/pharmacies/:id/reviews
// @desc    Add review to pharmacy
// @access  Private
router.post("/:id/reviews", async (req, res) => {
  try {
    const { rating, comment, userId, orderId } = req.body;

    const pharmacy = await Pharmacy.findById(req.params.id);

    if (!pharmacy) {
      return res.status(404).json({
        success: false,
        message: "Pharmacy not found",
      });
    }

    // Check if user already reviewed
    const existingReview = await Review.findOne({
      user: userId,
      pharmacy: req.params.id,
    });

    if (existingReview) {
      return res.status(400).json({
        success: false,
        message: "You have already reviewed this pharmacy",
      });
    }

    // Create review (middleware will update pharmacy rating)
    const review = new Review({
      user: userId,
      pharmacy: req.params.id,
      rating,
      comment,
      order: orderId,
    });

    await review.save();

    res.json({
      success: true,
      message: "Review added successfully",
      review,
    });
  } catch (error) {
    console.error("Add review error:", error);
    res.status(500).json({
      success: false,
      message: "Error adding review",
      error: error.message,
    });
  }
});

// @route   PUT /api/pharmacies/:id
// @desc    Update pharmacy
// @access  Private (Pharmacy Owner)
router.put("/:id", async (req, res) => {
  try {
    const pharmacy = await Pharmacy.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

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

module.exports = router;
