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

  // Timestamps
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

// Indexes
itemSchema.index({ name: "text", scientificName: "text" });
itemSchema.index({ category: 1 });
itemSchema.index({ popularityScore: -1 });

module.exports = mongoose.model("Item", itemSchema);
