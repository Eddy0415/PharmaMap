const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const itemSchema = new Schema({
  name: { type: String, required: true, trim: true },

  // Category
  category: {
    type: String,
    required: true,
    enum: [
      "Pain Relief",
      "Antibiotics",
      "Respiratory",
      "Cardiac Care",
      "Stomach Care",
      "Derma Products",
      "Oral Care",
      "Sexual Health",
      "Elderly Care",
      "Cold & Immunity",
      "Other",
    ],
  },

  // Details
  dosage: { type: String }, // e.g., "500mg", "100mcg"
  form: {
    type: String,
    enum: [
      "tablet",
      "capsule",
      "syrup",
      "injection",
      "cream",
      "inhaler",
      "drops",
      "other",
    ],
  },
  description: { type: String },
  manufacturer: {
    type: String,
    trim: true,
  },

  // Prescription requirement
  requiresPrescription: { type: Boolean, default: false },

  // Base price (can vary by pharmacy)
  basePrice: { type: Number },

  // Image
  imageUrl: { type: String },

  // Search & Stats
  searchCount: { type: Number, default: 0 },
  popularityScore: { type: Number, default: 0 },
  // Monthly search counts: { "YYYY-MM": count }
  monthlySearchCounts: {
    type: Map,
    of: Number,
    default: {},
  },

  // Timestamps
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

// Virtual to calculate total search count from monthly counts (backup method)
itemSchema.virtual("calculatedSearchCount").get(function () {
  if (!this.monthlySearchCounts || this.monthlySearchCounts.size === 0) {
    return this.searchCount || 0;
  }
  let total = 0;
  this.monthlySearchCounts.forEach((count) => {
    total += count;
  });
  return total;
});

// Method to sync searchCount from monthlySearchCounts (useful for data integrity)
itemSchema.methods.syncSearchCount = function () {
  if (this.monthlySearchCounts && this.monthlySearchCounts.size > 0) {
    let total = 0;
    this.monthlySearchCounts.forEach((count) => {
      total += count;
    });
    this.searchCount = total;
  }
  return this;
};

// Indexes
itemSchema.index({ name: "text" });
itemSchema.index({ category: 1 });
itemSchema.index({ popularityScore: -1 });
itemSchema.index({ searchCount: -1 }); // Add index for searchCount sorting

module.exports = mongoose.model("Item", itemSchema);
