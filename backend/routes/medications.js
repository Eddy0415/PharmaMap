const express = require("express");
const router = express.Router();
const Item = require("../models/Item");
const Inventory = require("../models/Inventory");
const Pharmacy = require("../models/Pharmacy");

// @route   GET /api/medications
// @desc    Search all items
// @access  Public
router.get("/", async (req, res) => {
  try {
    const { search, category, city, inStock } = req.query;

    let itemQuery = {};

    if (search) {
      itemQuery.name = { $regex: search, $options: "i" };
    }

    if (category) {
      itemQuery.category = category;
    }

    let items = await Item.find(itemQuery).sort({
      popularityScore: -1,
      searchCount: -1,
      name: 1,
    });

    // Get inventory for each item if city or inStock filter is applied
    const results = [];
    for (const item of items) {
      let inventoryQuery = {
        item: item._id,
        isAvailable: true,
      };

      if (inStock === "true") {
        inventoryQuery.quantity = { $gt: 0 };
      }

      let inventory = await Inventory.find(inventoryQuery).populate({
        path: "pharmacy",
        match: city ? { "address.city": city } : {},
        select: "name address phone isOpen averageRating",
      });

      // Filter out null pharmacies (didn't match city filter)
      inventory = inventory.filter((inv) => inv.pharmacy !== null);

      // If city or inStock filter is applied, only include items with matching inventory
      if (city || inStock === "true") {
        if (inventory.length > 0) {
          results.push({
            item,
            inventory,
          });
        }
      } else {
        // No filters, return all items
        results.push({
          item,
          inventory: [],
        });
      }
    }

    res.json({
      success: true,
      count: results.length,
      results,
    });
  } catch (error) {
    console.error("Get items error:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching items",
      error: error.message,
    });
  }
});

// @route   GET /api/medications/top-searched
// @desc    Get top 5 most searched items
// @access  Public
router.get("/top-searched", async (req, res) => {
  try {
    const items = await Item.find()
      .sort({ searchCount: -1 })
      .limit(5)
      .select("name category imageUrl searchCount popularityScore");

    res.json({
      success: true,
      count: items.length,
      items,
    });
  } catch (error) {
    console.error("Get top searched items error:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching top searched items",
      error: error.message,
    });
  }
});

// @route   GET /api/medications/category/:category
// @desc    Search items by category
// @access  Public
router.get("/category/:category", async (req, res) => {
  try {
    const { category } = req.params;
    const { city, inStock } = req.query;

    let itemQuery = { category };

    let items = await Item.find(itemQuery).sort({
      popularityScore: -1,
      name: 1,
    });

    // Get inventory for each item
    const results = [];
    for (const item of items) {
      let inventoryQuery = {
        item: item._id,
        isAvailable: true,
      };

      if (inStock === "true") {
        inventoryQuery.quantity = { $gt: 0 };
      }

      let inventory = await Inventory.find(inventoryQuery).populate({
        path: "pharmacy",
        match: city ? { "address.city": city } : {},
        select: "name address phone isOpen averageRating",
      });

      // Filter out null pharmacies
      inventory = inventory.filter((inv) => inv.pharmacy !== null);

      if (city || inStock === "true") {
        if (inventory.length > 0) {
          results.push({
            item,
            inventory,
          });
        }
      } else {
        results.push({
          item,
          inventory,
        });
      }
    }

    res.json({
      success: true,
      count: results.length,
      category,
      results,
    });
  } catch (error) {
    console.error("Get items by category error:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching items by category",
      error: error.message,
    });
  }
});

// @route   GET /api/medications/:id
// @desc    Search specific item by ID
// @access  Public
router.get("/:id", async (req, res) => {
  try {
    const item = await Item.findById(req.params.id);

    if (!item) {
      return res.status(404).json({
        success: false,
        message: "Item not found",
      });
    }

    // Increment search count
    item.searchCount += 1;
    await item.save();

    // Get inventory for this item across all pharmacies
    const inventory = await Inventory.find({
      item: item._id,
      isAvailable: true,
    })
      .populate("pharmacy", "name address phone isOpen averageRating")
      .sort({ price: 1 });

    res.json({
      success: true,
      item,
      inventory,
    });
  } catch (error) {
    console.error("Get item error:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching item",
      error: error.message,
    });
  }
});

module.exports = router;
