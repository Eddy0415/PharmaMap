const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const userSchema = new Schema({
  // Basic Info
  firstName: { type: String, required: true, trim: true },
  lastName: { type: String, required: true, trim: true },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
  },
  phone: { type: String, required: true },

  // User Type
  userType: {
    type: String,
    enum: ["customer", "pharmacist"],
    required: true,
  },

  // Customer-specific fields
  dateOfBirth: { type: Date },
  gender: {
  type: String,
  enum: ["male", "female", "other", "prefer-not", ""],
  default: "",
},


  // Avatar
  avatarUrl: { type: String },

  // Favorites
  favoritePharmacies: [
    {
      type: Schema.Types.ObjectId,
      ref: "Pharmacy",
    },
  ],
  favoriteItems: [
    {
      type: Schema.Types.ObjectId,
      ref: "Item",
    },
  ],

  // Pharmacist-specific: reference to their pharmacy
  pharmacy: {
    type: Schema.Types.ObjectId,
    ref: "Pharmacy",
  },
  // Account status
  isActive: { type: Boolean, default: true },
  isVerified: { type: Boolean, default: false },

  // Timestamps
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

// Index for faster queries
// Note: email index is automatically created by unique: true
userSchema.index({ userType: 1 });

// Virtual for full name
userSchema.virtual("fullName").get(function () {
  return `${this.firstName} ${this.lastName}`;
});

module.exports = mongoose.model("User", userSchema);
