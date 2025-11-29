const express = require("express");
const router = express.Router();
const Inventory = require("../models/Inventory");
const Item = require("../models/Item");
const Pharmacy = require("../models/Pharmacy");

// @route   GET /api/inventory
// @desc    Get inventory items by pharmacy ID
// @access  Private (Pharmacy Owner)
router.get("/", async (req, res) => {
  try {
    const { pharmacyId } = req.query;

    if (!pharmacyId) {
      return res.status(400).json({
        success: false,
        message: "Pharmacy ID is required",
      });
    }

    const inventory = await Inventory.find({ pharmacy: pharmacyId })
      .populate("item", "name category imageUrl")
      .populate("pharmacy", "name address")
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: inventory.length,
      inventory,
    });
  } catch (error) {
    console.error("Get inventory error:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching inventory",
      error: error.message,
    });
  }
});

// @route   POST /api/inventory
// @desc    Add inventory item
// @access  Private (Pharmacy Owner)
router.post("/", async (req, res) => {
  try {
    const { pharmacy, item, quantity, price, lowStockThreshold, isAvailable } =
      req.body;

    // Validate required fields
    if (!pharmacy || !item || quantity === undefined) {
      return res.status(400).json({
        success: false,
        message: "Pharmacy, item, and quantity are required",
      });
    }

    // Check if item exists
    const itemExists = await Item.findById(item);
    if (!itemExists) {
      return res.status(404).json({
        success: false,
        message: "Item not found",
      });
    }

    // Check if pharmacy exists
    const pharmacyExists = await Pharmacy.findById(pharmacy);
    if (!pharmacyExists) {
      return res.status(404).json({
        success: false,
        message: "Pharmacy not found",
      });
    }

    // Check if inventory entry already exists
    const existingInventory = await Inventory.findOne({ pharmacy, item });
    if (existingInventory) {
      return res.status(400).json({
        success: false,
        message:
          "Inventory entry already exists for this item at this pharmacy",
      });
    }

    // Create inventory entry
    // Price will default to item's basePrice if not provided (handled in pre-save hook)
    const inventory = new Inventory({
      pharmacy,
      item,
      quantity: quantity || 0,
      price: price !== undefined ? price : undefined, // Let pre-save hook set from basePrice if not provided
      lowStockThreshold: lowStockThreshold || 10,
      isAvailable: isAvailable !== undefined ? isAvailable : true,
      lastRestocked: new Date(),
    });

    await inventory.save();

    // Populate item and pharmacy before returning
    await inventory.populate("item", "name category imageUrl");
    await inventory.populate("pharmacy", "name address");

    res.status(201).json({
      success: true,
      message: "Inventory item added successfully",
      inventory,
    });
  } catch (error) {
    console.error("Add inventory error:", error);
    res.status(500).json({
      success: false,
      message: "Error adding inventory",
      error: error.message,
    });
  }
});

// @route   PUT /api/inventory/:id
// @desc    Update inventory item
// @access  Private (Pharmacy Owner)
router.put("/:id", async (req, res) => {
  try {
    const { quantity, price, lowStockThreshold, isAvailable, lastRestocked } =
      req.body;

    const updateData = { updatedAt: Date.now() };
    if (quantity !== undefined) updateData.quantity = quantity;
    if (price !== undefined) updateData.price = price;
    if (lowStockThreshold !== undefined)
      updateData.lowStockThreshold = lowStockThreshold;
    if (isAvailable !== undefined) updateData.isAvailable = isAvailable;
    if (lastRestocked !== undefined) updateData.lastRestocked = lastRestocked;

    // Get current inventory to calculate stockStatus
    const currentInventory = await Inventory.findById(req.params.id);
    if (!currentInventory) {
      return res.status(404).json({
        success: false,
        message: "Inventory item not found",
      });
    }

    // Calculate stockStatus based on updated quantity
    const finalQuantity =
      quantity !== undefined ? quantity : currentInventory.quantity;
    const finalLowStockThreshold =
      lowStockThreshold !== undefined
        ? lowStockThreshold
        : currentInventory.lowStockThreshold;

    if (finalQuantity === 0) {
      updateData.stockStatus = "out-of-stock";
    } else if (finalQuantity < finalLowStockThreshold) {
      updateData.stockStatus = "low-stock";
    } else {
      updateData.stockStatus = "in-stock";
    }

    const inventory = await Inventory.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    )
      .populate("item", "name category imageUrl")
      .populate("pharmacy", "name address");

    if (!inventory) {
      return res.status(404).json({
        success: false,
        message: "Inventory item not found",
      });
    }

    res.json({
      success: true,
      message: "Inventory updated successfully",
      inventory,
    });
  } catch (error) {
    console.error("Update inventory error:", error);
    res.status(500).json({
      success: false,
      message: "Error updating inventory",
      error: error.message,
    });
  }
});

// @route   DELETE /api/inventory/:id
// @desc    Delete inventory item
// @access  Private (Pharmacy Owner)
router.delete("/:id", async (req, res) => {
  try {
    const inventory = await Inventory.findByIdAndDelete(req.params.id);

    if (!inventory) {
      return res.status(404).json({
        success: false,
        message: "Inventory item not found",
      });
    }

    res.json({
      success: true,
      message: "Inventory item deleted successfully",
    });
  } catch (error) {
    console.error("Delete inventory error:", error);
    res.status(500).json({
      success: false,
      message: "Error deleting inventory",
      error: error.message,
    });
  }
});

module.exports = router;
