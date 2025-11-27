const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
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
  password: { type: String, required: true }, // Hash with bcrypt
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
    enum: ["male", "female", "prefer-not"],
  },

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

// Hash password before saving
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) {
    return next();
  }

  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Method to compare passwords
userSchema.methods.comparePassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Virtual for full name
userSchema.virtual("fullName").get(function () {
  return `${this.firstName} ${this.lastName}`;
});

module.exports = mongoose.model("User", userSchema);
