const express = require("express");
const router = express.Router();
const Item = require("../models/Item");
const Inventory = require("../models/Inventory");
const Pharmacy = require("../models/Pharmacy");

// @route   GET /api/medications
// @desc    Get all items with inventory across pharmacies
// @access  Public
router.get("/", async (req, res) => {
  try {
    const { search, category, inStock, city } = req.query;

    let itemQuery = {};

    if (search) {
      itemQuery.name = { $regex: search, $options: "i" };
    }

    if (category) {
      itemQuery.category = category;
    }

    let items = await Item.find(itemQuery).sort({
      popularityScore: -1,
      name: 1,
    });

    // Get inventory for each item
    let inventoryQuery = {};
    if (inStock === "true") {
      inventoryQuery.quantity = { $gt: 0 };
    }
    if (city) {
      // We'll filter by city after populating pharmacy
    }

    const results = [];
    for (const item of items) {
      let inventoryQueryForItem = {
        ...inventoryQuery,
        item: item._id,
        isAvailable: true,
      };

      let inventory = await Inventory.find(inventoryQueryForItem)
        .populate({
          path: "pharmacy",
          match: city ? { "address.city": city } : {},
          select: "name address phone isOpen averageRating",
        })
        .sort({ price: 1 });

      // Filter out null pharmacies (didn't match city filter)
      inventory = inventory.filter((inv) => inv.pharmacy !== null);

      if (inventory.length > 0 || !city) {
        results.push({
          item,
          inventory,
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

// @route   GET /api/medications/search
// @desc    Search items across pharmacies
// @access  Public
router.get("/search", async (req, res) => {
  try {
    const { query, city, sortBy } = req.query;

    if (!query) {
      return res.status(400).json({
        success: false,
        message: "Search query is required",
      });
    }

    // Find items matching search
    const items = await Item.find({
      name: { $regex: query, $options: "i" },
    });

    // Get inventory for each item
    const pharmaciesMap = new Map();

    for (const item of items) {
      let inventoryQuery = {
        item: item._id,
        isAvailable: true,
        quantity: { $gt: 0 },
      };

      let inventory = await Inventory.find(inventoryQuery).populate({
        path: "pharmacy",
        match: city ? { "address.city": city } : {},
        select: "name address phone isOpen averageRating workingHours",
      });

      // Filter out null pharmacies
      inventory = inventory.filter((inv) => inv.pharmacy !== null);

      // Group by pharmacy
      inventory.forEach((inv) => {
        const pharmacyId = inv.pharmacy._id.toString();
        if (!pharmaciesMap.has(pharmacyId)) {
          pharmaciesMap.set(pharmacyId, {
            pharmacy: inv.pharmacy,
            items: [],
          });
        }
        pharmaciesMap.get(pharmacyId).items.push({
          item: {
            _id: item._id,
            name: item.name,
            category: item.category,
            imageUrl: item.imageUrl,
            description: item.description,
            form: item.form,
            dosage: item.dosage,
            requiresPrescription: item.requiresPrescription,
          },
          price: inv.price,
          quantity: inv.quantity,
          stockStatus: inv.stockStatus,
        });
      });

      // Increment search count
      item.searchCount += 1;
      await item.save();
    }

    const results = Array.from(pharmaciesMap.values());

    // Sort results
    if (sortBy === "price-low") {
      results.forEach((result) => {
        result.items.sort((a, b) => a.price - b.price);
      });
    } else if (sortBy === "price-high") {
      results.forEach((result) => {
        result.items.sort((a, b) => b.price - a.price);
      });
    } else if (sortBy === "availability") {
      results.forEach((result) => {
        const statusOrder = {
          "in-stock": 0,
          "low-stock": 1,
          "out-of-stock": 2,
        };
        result.items.sort(
          (a, b) => statusOrder[a.stockStatus] - statusOrder[b.stockStatus]
        );
      });
    }

    res.json({
      success: true,
      count: results.length,
      totalItems: items.length,
      results,
    });
  } catch (error) {
    console.error("Search items error:", error);
    res.status(500).json({
      success: false,
      message: "Error searching items",
      error: error.message,
    });
  }
});

// @route   GET /api/medications/:id
// @desc    Get item by ID with inventory across pharmacies
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

// @route   POST /api/medications
// @desc    Create new item
// @access  Private (Admin)
router.post("/", async (req, res) => {
  try {
    const item = new Item(req.body);
    await item.save();

    res.status(201).json({
      success: true,
      message: "Item created successfully",
      item,
    });
  } catch (error) {
    console.error("Create item error:", error);
    res.status(500).json({
      success: false,
      message: "Error creating item",
      error: error.message,
    });
  }
});

// @route   PUT /api/medications/:id
// @desc    Update item
// @access  Private (Admin)
router.put("/:id", async (req, res) => {
  try {
    const item = await Item.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    if (!item) {
      return res.status(404).json({
        success: false,
        message: "Item not found",
      });
    }

    res.json({
      success: true,
      message: "Item updated successfully",
      item,
    });
  } catch (error) {
    console.error("Update item error:", error);
    res.status(500).json({
      success: false,
      message: "Error updating item",
      error: error.message,
    });
  }
});

// @route   DELETE /api/medications/:id
// @desc    Delete item
// @access  Private (Admin)
router.delete("/:id", async (req, res) => {
  try {
    const item = await Item.findByIdAndDelete(req.params.id);

    if (!item) {
      return res.status(404).json({
        success: false,
        message: "Item not found",
      });
    }

    // Also delete all inventory entries for this item
    await Inventory.deleteMany({ item: item._id });

    res.json({
      success: true,
      message: "Item deleted successfully",
    });
  } catch (error) {
    console.error("Delete item error:", error);
    res.status(500).json({
      success: false,
      message: "Error deleting item",
      error: error.message,
    });
  }
});

// @route   GET /api/medications/popular/all
// @desc    Get popular items
// @access  Public
router.get("/popular/all", async (req, res) => {
  try {
    const items = await Item.find()
      .sort({ popularityScore: -1, searchCount: -1 })
      .limit(10);

    res.json({
      success: true,
      count: items.length,
      items,
    });
  } catch (error) {
    console.error("Get popular items error:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching popular items",
      error: error.message,
    });
  }
});

module.exports = router;
