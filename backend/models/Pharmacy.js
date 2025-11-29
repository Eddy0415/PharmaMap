const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const pharmacySchema = new Schema({
  name: { type: String, required: true, trim: true },

  // Owner (pharmacist user)
  owner: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },

  // Location
  address: {
    street: { type: String, required: true },
    city: { type: String, required: true },
    // GeoJSON format: [longitude, latitude] for MongoDB 2dsphere index
    coordinates: {
      type: {
        type: String,
        enum: ["Point"],
        default: "Point",
      },
      coordinates: {
        type: [Number], // [longitude, latitude]
        required: true,
      },
    },
  },

  // Contact
  phone: { type: String, required: true },
  email: { type: String },

  // Working Hours
  workingHours: [
    {
      day: {
        type: String,
        enum: [
          "Monday",
          "Tuesday",
          "Wednesday",
          "Thursday",
          "Friday",
          "Saturday",
          "Sunday",
        ],
      },
      openTime: { type: String }, // "08:00"
      closeTime: { type: String }, // "22:00"
      isClosed: { type: Boolean, default: false },
    },
  ],

  // Status
  isOpen: { type: Boolean, default: true },
  is24Hours: { type: Boolean, default: false },

  // License
  licenseNumber: { type: String, required: true, unique: true },

  // Rating & Reviews
  averageRating: { type: Number, default: 0, min: 0, max: 5 },
  totalReviews: { type: Number, default: 0 },

  // Stats
  totalOrders: { type: Number, default: 0 },

  // Image
  logoUrl: { type: String },

  featured: {
    type: Boolean,
    default: false,
  },

  // Account
  isVerified: { type: Boolean, default: false },
  isActive: { type: Boolean, default: true },

  // Timestamps
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

// Indexes
pharmacySchema.index({ "address.city": 1 });
pharmacySchema.index({ "address.coordinates": "2dsphere" }); // GeoJSON index for geospatial queries
pharmacySchema.index({ averageRating: -1 });

module.exports = mongoose.model("Pharmacy", pharmacySchema);
