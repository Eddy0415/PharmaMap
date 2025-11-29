const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const inventorySchema = new Schema({
  pharmacy: {
    type: Schema.Types.ObjectId,
    ref: "Pharmacy",
    required: true,
  },
  item: {
    type: Schema.Types.ObjectId,
    ref: "Item",
    required: true,
  },

  // Stock
  quantity: {
    type: Number,
    required: true,
    min: 0,
    default: 0,
  },

  // Price at this pharmacy (defaults to item's basePrice if not provided)
  price: {
    type: Number,
    required: false,
    min: 0,
  },

  // Stock status
  stockStatus: {
    type: String,
    enum: ["in-stock", "low-stock", "out-of-stock"],
    default: function () {
      if (this.quantity === 0) return "out-of-stock";
      if (this.quantity < this.lowStockThreshold) return "low-stock";
      return "in-stock";
    },
  },

  // Low stock threshold for notifications
  lowStockThreshold: { type: Number, default: 10 },

  // Availability
  isAvailable: { type: Boolean, default: true },

  // Stats
  totalOrders: { type: Number, default: 0 },

  // Timestamps
  lastRestocked: { type: Date },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

// Compound index: one item per pharmacy
inventorySchema.index({ pharmacy: 1, item: 1 }, { unique: true });
inventorySchema.index({ pharmacy: 1, stockStatus: 1 });

// Pre-save middleware to set price from item's basePrice if not provided
inventorySchema.pre("save", async function (next) {
  // If price is not set, get it from the item's basePrice
  if (this.price === undefined || this.price === null) {
    try {
      let item;

      // Check if item is already populated
      if (this.populated("item")) {
        item = this.item;
      } else {
        // Fetch the item to get basePrice
        const Item = mongoose.model("Item");
        item = await Item.findById(this.item);
      }

      // Set price to item's basePrice if available
      if (item && item.basePrice !== undefined && item.basePrice !== null) {
        this.price = item.basePrice;
      } else {
        return next(new Error("Price is required. Item basePrice not found."));
      }
    } catch (error) {
      return next(error);
    }
  }

  // Update stock status
  if (this.quantity === 0) {
    this.stockStatus = "out-of-stock";
  } else if (this.quantity < this.lowStockThreshold) {
    this.stockStatus = "low-stock";
  } else {
    this.stockStatus = "in-stock";
  }

  next();
});

module.exports = mongoose.model("Inventory", inventorySchema);
