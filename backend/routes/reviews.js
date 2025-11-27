const express = require("express");
const router = express.Router();
const Review = require("../models/Review");
const Pharmacy = require("../models/Pharmacy");

// @route   GET /api/reviews
// @desc    Get all reviews
// @access  Public
router.get("/", async (req, res) => {
  try {
    const { pharmacyId, userId, rating } = req.query;

    let query = {};

    if (pharmacyId) {
      query.pharmacy = pharmacyId;
    }

    if (userId) {
      query.user = userId;
    }

    if (rating) {
      query.rating = parseInt(rating);
    }

    const reviews = await Review.find(query)
      .populate("user", "firstName lastName")
      .populate("pharmacy", "name")
      .populate("order", "orderNumber")
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: reviews.length,
      reviews,
    });
  } catch (error) {
    console.error("Get reviews error:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching reviews",
      error: error.message,
    });
  }
});

// @route   GET /api/reviews/:id
// @desc    Get review by ID
// @access  Public
router.get("/:id", async (req, res) => {
  try {
    const review = await Review.findById(req.params.id)
      .populate("user", "firstName lastName")
      .populate("pharmacy", "name address")
      .populate("order", "orderNumber");

    if (!review) {
      return res.status(404).json({
        success: false,
        message: "Review not found",
      });
    }

    res.json({
      success: true,
      review,
    });
  } catch (error) {
    console.error("Get review error:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching review",
      error: error.message,
    });
  }
});

// @route   POST /api/reviews
// @desc    Create new review
// @access  Private
router.post("/", async (req, res) => {
  try {
    const { user, pharmacy, rating, comment, order } = req.body;

    // Check if pharmacy exists
    const pharmacyExists = await Pharmacy.findById(pharmacy);
    if (!pharmacyExists) {
      return res.status(404).json({
        success: false,
        message: "Pharmacy not found",
      });
    }

    // Check if user already reviewed this pharmacy
    const existingReview = await Review.findOne({
      user: user,
      pharmacy: pharmacy,
    });

    if (existingReview) {
      return res.status(400).json({
        success: false,
        message: "You have already reviewed this pharmacy",
      });
    }

    // Create review (middleware will update pharmacy rating)
    const review = new Review({
      user,
      pharmacy,
      rating,
      comment,
      order,
    });

    await review.save();

    res.status(201).json({
      success: true,
      message: "Review created successfully",
      review,
    });
  } catch (error) {
    console.error("Create review error:", error);
    res.status(500).json({
      success: false,
      message: "Error creating review",
      error: error.message,
    });
  }
});

// @route   PUT /api/reviews/:id
// @desc    Update review
// @access  Private
router.put("/:id", async (req, res) => {
  try {
    const { rating, comment } = req.body;

    const review = await Review.findByIdAndUpdate(
      req.params.id,
      { rating, comment, updatedAt: Date.now() },
      { new: true, runValidators: true }
    );

    if (!review) {
      return res.status(404).json({
        success: false,
        message: "Review not found",
      });
    }

    // Trigger rating update by saving pharmacy
    const pharmacy = await Pharmacy.findById(review.pharmacy);
    if (pharmacy) {
      // Recalculate rating
      const ReviewModel = require("../models/Review");
      const stats = await ReviewModel.aggregate([
        { $match: { pharmacy: review.pharmacy } },
        {
          $group: {
            _id: null,
            avgRating: { $avg: "$rating" },
            count: { $sum: 1 },
          },
        },
      ]);

      if (stats.length > 0) {
        pharmacy.averageRating = Math.round(stats[0].avgRating * 10) / 10;
        pharmacy.totalReviews = stats[0].count;
        await pharmacy.save();
      }
    }

    res.json({
      success: true,
      message: "Review updated successfully",
      review,
    });
  } catch (error) {
    console.error("Update review error:", error);
    res.status(500).json({
      success: false,
      message: "Error updating review",
      error: error.message,
    });
  }
});

// @route   DELETE /api/reviews/:id
// @desc    Delete review
// @access  Private
router.delete("/:id", async (req, res) => {
  try {
    const review = await Review.findById(req.params.id);

    if (!review) {
      return res.status(404).json({
        success: false,
        message: "Review not found",
      });
    }

    const pharmacyId = review.pharmacy;

    await Review.findByIdAndDelete(req.params.id);

    // Recalculate pharmacy rating
    const ReviewModel = require("../models/Review");
    const pharmacy = await Pharmacy.findById(pharmacyId);
    if (pharmacy) {
      const stats = await ReviewModel.aggregate([
        { $match: { pharmacy: pharmacyId } },
        {
          $group: {
            _id: null,
            avgRating: { $avg: "$rating" },
            count: { $sum: 1 },
          },
        },
      ]);

      if (stats.length > 0) {
        pharmacy.averageRating = Math.round(stats[0].avgRating * 10) / 10;
        pharmacy.totalReviews = stats[0].count;
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

// @route   GET /api/reviews/pharmacy/:pharmacyId
// @desc    Get reviews for a pharmacy
// @access  Public
router.get("/pharmacy/:pharmacyId", async (req, res) => {
  try {
    const reviews = await Review.find({ pharmacy: req.params.pharmacyId })
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
      message: "Error fetching pharmacy reviews",
      error: error.message,
    });
  }
});

// @route   GET /api/reviews/user/:userId
// @desc    Get reviews by a user
// @access  Private
router.get("/user/:userId", async (req, res) => {
  try {
    const reviews = await Review.find({ user: req.params.userId })
      .populate("pharmacy", "name address averageRating")
      .populate("order", "orderNumber")
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: reviews.length,
      reviews,
    });
  } catch (error) {
    console.error("Get user reviews error:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching user reviews",
      error: error.message,
    });
  }
});

module.exports = router;
