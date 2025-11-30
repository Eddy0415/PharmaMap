const express = require("express");
const router = express.Router();
const User = require("../models/User");
const Pharmacy = require("../models/Pharmacy");
const Item = require("../models/Item");
const firebaseAuth = require("../middleware/firebaseAuth");

// @route   PUT /api/users/:id
// @desc    Update user profile
// @access  Private (must be the same user)
router.put("/:id", firebaseAuth, async (req, res) => {
  try {
    const authedId = req.user?._id?.toString();
    if (!authedId || authedId !== req.params.id.toString()) {
      return res.status(403).json({
        success: false,
        message: "You are not allowed to update this user",
      });
    }

    const { firstName, lastName, phone, dateOfBirth, gender, avatarUrl } =
      req.body;

    const user = await User.findByIdAndUpdate(
      authedId,
      {
        firstName,
        lastName,
        phone,
        dateOfBirth,
        gender,
        avatarUrl,
        updatedAt: Date.now(),
      },
      { new: true, runValidators: true }
    ).select("-password");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    res.json({
      success: true,
      message: "Profile updated successfully",
      user,
    });
  } catch (error) {
    console.error("Update user error:", error);
    res.status(500).json({
      success: false,
      message: "Error updating profile",
      error: error.message,
    });
  }
});


// @route   GET /api/users/:id/favorite-items
// @desc    Get favorite pharmacies for authed user
// @access  Private
router.get("/:id/favorite-pharmacies", firebaseAuth, async (req, res) => {
  try {
    const authedId = req.user?._id;
    if (!authedId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const user = await User.findById(authedId)
      .select("favoritePharmacies")
      .populate(
        "favoritePharmacies",
        "name address phone averageRating totalReviews logoUrl"
      );

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    res.json({
      success: true,
      count: user.favoritePharmacies.length,
      favoritePharmacies: user.favoritePharmacies,
    });
  } catch (error) {
    console.error("Get favorite pharmacies error:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching favorite pharmacies",
      error: error.message,
    });
  }
});




// @route   POST /api/users/:id/favorite-items/:itemId
// @desc    Add pharmacy to favorites
// @access  Private
router.post("/:id/favorite-pharmacies/:pharmacyId", firebaseAuth, async (req, res) => {
  try {
    const authedId = req.user?._id;
    if (!authedId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const user = await User.findById(authedId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const pharmacy = await Pharmacy.findById(req.params.pharmacyId);
    if (!pharmacy) {
      return res.status(404).json({
        success: false,
        message: "Pharmacy not found",
      });
    }

    if (user.favoritePharmacies.includes(req.params.pharmacyId)) {
      return res.status(400).json({
        success: false,
        message: "Pharmacy already in favorites",
      });
    }

    user.favoritePharmacies.push(req.params.pharmacyId);
    await user.save();
    const populated = await user.populate(
      "favoritePharmacies",
      "name address phone averageRating totalReviews logoUrl"
    );

    res.json({
      success: true,
      message: "Pharmacy added to favorites",
      favoritePharmacies: populated.favoritePharmacies,
    });
  } catch (error) {
    console.error("Add favorite pharmacy error:", error);
    res.status(500).json({
      success: false,
      message: "Error adding to favorites",
      error: error.message,
    });
  }
});


// @route   DELETE /api/users/:id/favorite-pharmacies/:pharmacyId
// @desc    Remove pharmacy from favorites
// @access  Private
router.delete("/:id/favorite-pharmacies/:pharmacyId", firebaseAuth, async (req, res) => {
  try {
    const authedId = req.user?._id;
    if (!authedId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const user = await User.findById(authedId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    user.favoritePharmacies.pull(req.params.pharmacyId);
    await user.save();
    const populated = await user.populate(
      "favoritePharmacies",
      "name address phone averageRating totalReviews logoUrl"
    );

    res.json({
      success: true,
      message: "Pharmacy removed from favorites",
      favoritePharmacies: populated.favoritePharmacies,
    });
  } catch (error) {
    console.error("Remove favorite pharmacy error:", error);
    res.status(500).json({
      success: false,
      message: "Error removing from favorites",
      error: error.message,
    });
  }
});
// -------------------------------------------------------
// FAVORITE ITEMS ROUTES
// -------------------------------------------------------

// @route   GET /api/users/:id/favorite-items
// @desc    Get favorite items
// @access  Private
router.get("/:id/favorite-items", firebaseAuth, async (req, res) => {
  try {
    const authedId = req.user?._id;

    const user = await User.findById(authedId)
      .select("favoriteItems")
      .populate("favoriteItems", "name category dosage imageUrl");

    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    res.json({
      success: true,
      count: user.favoriteItems.length,
      favoriteItems: user.favoriteItems,
    });
  } catch (error) {
    console.error("Get favorite items error:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching favorite items",
      error: error.message,
    });
  }
});


// @route   POST /api/users/:id/favorite-items/:itemId
// @desc    Add item to favorites
// @access  Private
router.post("/:id/favorite-items/:itemId", firebaseAuth, async (req, res) => {
  try {
    const authedId = req.user?._id;

    const user = await User.findById(authedId);
    if (!user) return res.status(404).json({ success: false, message: "User not found" });

    const item = await Item.findById(req.params.itemId);
    if (!item) return res.status(404).json({ success: false, message: "Item not found" });

    if (user.favoriteItems.includes(req.params.itemId)) {
      return res.status(400).json({
        success: false,
        message: "Item already in favorites",
      });
    }

    user.favoriteItems.push(req.params.itemId);
    await user.save();

    const populated = await user.populate(
      "favoriteItems",
      "name category dosage imageUrl"
    );

    res.json({
      success: true,
      message: "Item added to favorites",
      favoriteItems: populated.favoriteItems,
    });

  } catch (error) {
    console.error("Add favorite item error:", error);
    res.status(500).json({
      success: false,
      message: "Error adding to favorites",
      error: error.message,
    });
  }
});


// @route   DELETE /api/users/:id/favorite-items/:itemId
// @desc    Remove item from favorites
// @access  Private
router.delete("/:id/favorite-items/:itemId", firebaseAuth, async (req, res) => {
  try {
    const authedId = req.user?._id;

    const user = await User.findById(authedId);
    if (!user) return res.status(404).json({ success: false, message: "User not found" });

    user.favoriteItems.pull(req.params.itemId);
    await user.save();

    const populated = await user.populate(
      "favoriteItems",
      "name category dosage imageUrl"
    );

    res.json({
      success: true,
      message: "Item removed from favorites",
      favoriteItems: populated.favoriteItems,
    });

  } catch (error) {
    console.error("Remove favorite item error:", error);
    res.status(500).json({
      success: false,
      message: "Error removing favorite item",
      error: error.message,
    });
  }
});

module.exports = router;
