const express = require("express");
const router = express.Router();
const Inventory = require("../models/Inventory");
const Item = require("../models/Item");
const Pharmacy = require("../models/Pharmacy");

// @route   POST /api/inventory
// @desc    Add inventory item
// @access  Private (Pharmacy Owner)
router.post("/", async (req, res) => {
  try {
    const { pharmacy, item, quantity, price, lowStockThreshold, isAvailable } =
      req.body;

    // Validate required fields
    if (!pharmacy || !item || quantity === undefined || price === undefined) {
      return res.status(400).json({
        success: false,
        message: "Pharmacy, item, quantity, and price are required",
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
    const inventory = new Inventory({
      pharmacy,
      item,
      quantity: quantity || 0,
      price,
      lowStockThreshold: lowStockThreshold || 10,
      isAvailable: isAvailable !== undefined ? isAvailable : true,
      lastRestocked: new Date(),
    });

    await inventory.save();

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

    const inventory = await Inventory.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    )
      .populate("item", "name category")
      .populate("pharmacy", "name");

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
