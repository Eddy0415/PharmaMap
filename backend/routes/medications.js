const express = require("express");
const router = express.Router();
const Item = require("../models/Item");
const Inventory = require("../models/Inventory");
const Pharmacy = require("../models/Pharmacy");

// Track recent increments to prevent duplicates (within 5 seconds)
const recentIncrements = new Map();
const INCREMENT_COOLDOWN = 5000; // 5 seconds

// Helper function to check if we should increment (prevents duplicates)
const shouldIncrement = (itemId, monthKey) => {
  const key = `${itemId}-${monthKey}`;
  const lastIncrement = recentIncrements.get(key);
  const now = Date.now();

  if (lastIncrement && now - lastIncrement < INCREMENT_COOLDOWN) {
    return false; // Too soon, skip increment
  }

  recentIncrements.set(key, now);
  return true;
};

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

    // Get current month key for monthly stats
    const now = new Date();
    const monthKey = `${now.getFullYear()}-${String(
      now.getMonth() + 1
    ).padStart(2, "0")}`;

    // Increment search counts for items that match the search query
    // Only increment once per item per search session (prevent duplicates from React StrictMode)
    if (search) {
      for (const item of items) {
        // Check if we should increment (prevents duplicates within cooldown period)
        if (!shouldIncrement(item._id.toString(), monthKey)) {
          continue; // Skip this increment
        }

        // Increment monthly search count
        if (!item.monthlySearchCounts) {
          item.monthlySearchCounts = new Map();
        }
        const currentMonthCount = item.monthlySearchCounts.get(monthKey) || 0;
        item.monthlySearchCounts.set(monthKey, currentMonthCount + 1);

        // Sync searchCount with monthlySearchCounts (recalculates total from all months)
        item.syncSearchCount();
        await item.save();
      }
    }

    // Get inventory for each item if city or inStock filter is applied
    const results = [];
    for (const item of items) {
      // Add current month search count to item
      const itemObj = item.toObject();
      itemObj.currentMonthSearchCount =
        item.monthlySearchCounts?.get(monthKey) || 0;
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
            item: itemObj,
            inventory,
          });
        }
      } else {
        // No filters, return all items
        results.push({
          item: itemObj,
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
// @desc    Get top 5 most searched items (based on current month)
// @access  Public
router.get("/top-searched", async (req, res) => {
  try {
    const now = new Date();
    const monthKey = `${now.getFullYear()}-${String(
      now.getMonth() + 1
    ).padStart(2, "0")}`;

    const items = await Item.find().select(
      "name category imageUrl searchCount popularityScore monthlySearchCounts"
    );

    // Sort by current month's search count
    const itemsWithMonthlyCount = items.map((item) => {
      const monthlyCount = item.monthlySearchCounts?.get(monthKey) || 0;
      return {
        ...item.toObject(),
        currentMonthSearchCount: monthlyCount,
      };
    });

    itemsWithMonthlyCount.sort((a, b) => {
      // First sort by current month count, then by total search count
      if (b.currentMonthSearchCount !== a.currentMonthSearchCount) {
        return b.currentMonthSearchCount - a.currentMonthSearchCount;
      }
      return b.searchCount - a.searchCount;
    });

    const topItems = itemsWithMonthlyCount.slice(0, 5).map((item) => ({
      _id: item._id,
      name: item.name,
      category: item.category,
      imageUrl: item.imageUrl,
      searchCount: item.searchCount,
      popularityScore: item.popularityScore,
      currentMonthSearchCount: item.currentMonthSearchCount,
    }));

    res.json({
      success: true,
      count: topItems.length,
      items: topItems,
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

// @route   GET /api/medications/:id/monthly-stats
// @desc    Get monthly search counts for a specific item
// @access  Public
router.get("/:id/monthly-stats", async (req, res) => {
  try {
    const item = await Item.findById(req.params.id).select(
      "name monthlySearchCounts"
    );

    if (!item) {
      return res.status(404).json({
        success: false,
        message: "Item not found",
      });
    }

    // Convert Map to object for JSON response
    const monthlyStats = {};
    if (item.monthlySearchCounts) {
      item.monthlySearchCounts.forEach((count, monthKey) => {
        monthlyStats[monthKey] = count;
      });
    }

    res.json({
      success: true,
      itemName: item.name,
      monthlySearchCounts: monthlyStats,
    });
  } catch (error) {
    console.error("Get monthly stats error:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching monthly stats",
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

    // Get current month key for monthly stats
    const now = new Date();
    const monthKey = `${now.getFullYear()}-${String(
      now.getMonth() + 1
    ).padStart(2, "0")}`;

    // Increment search counts for items in this category
    // Only increment once per item per category view (prevent duplicates from React StrictMode)
    for (const item of items) {
      // Check if we should increment (prevents duplicates within cooldown period)
      if (!shouldIncrement(item._id.toString(), monthKey)) {
        continue; // Skip this increment
      }

      // Increment monthly search count
      if (!item.monthlySearchCounts) {
        item.monthlySearchCounts = new Map();
      }
      const currentMonthCount = item.monthlySearchCounts.get(monthKey) || 0;
      item.monthlySearchCounts.set(monthKey, currentMonthCount + 1);

      // Sync searchCount with monthlySearchCounts (recalculates total from all months)
      item.syncSearchCount();
      await item.save();
    }

    // Get inventory for each item
    const results = [];
    for (const item of items) {
      // Add current month search count to item
      const itemObj = item.toObject();
      itemObj.currentMonthSearchCount =
        item.monthlySearchCounts?.get(monthKey) || 0;
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
            item: itemObj,
            inventory,
          });
        }
      } else {
        results.push({
          item: itemObj,
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

    // Track monthly search count
    const now = new Date();
    const monthKey = `${now.getFullYear()}-${String(
      now.getMonth() + 1
    ).padStart(2, "0")}`;

    // Check if we should increment (prevents duplicates from React StrictMode)
    if (shouldIncrement(item._id.toString(), monthKey)) {
      if (!item.monthlySearchCounts) {
        item.monthlySearchCounts = new Map();
      }
      const currentMonthCount = item.monthlySearchCounts.get(monthKey) || 0;
      item.monthlySearchCounts.set(monthKey, currentMonthCount + 1);

      // Sync searchCount with monthlySearchCounts (recalculates total from all months)
      item.syncSearchCount();
      await item.save();
    }

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
