const express = require("express");
const router = express.Router();
const User = require("../models/User");
const Pharmacy = require("../models/Pharmacy");
const firebaseAuth = require("../middleware/firebaseAuth");
const admin = require("firebase-admin");

// =======================
// REGISTER (used in signup)
// =======================
router.post("/register", async (req, res) => {
  try {
    const {
      firstName,
      lastName,
      email,
      phone,
      password,
      userType,
      pharmacyName,
      pharmacyAddress,
      city,
      license,
    } = req.body;

    // Check if user exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: "User already exists with this email",
      });
    }

    // Create user in Mongo
    const user = new User({
      firstName,
      lastName,
      email,
      phone,
      password, // still stored (hashed by model)
      userType,
    });

    await user.save();

    // If pharmacist, create pharmacy too
    if (userType === "pharmacist") {
      const pharmacy = new Pharmacy({
        owner: user._id,
        name: pharmacyName,
        licenseNumber: license,
        address: {
          street: pharmacyAddress,
          city: city,
        },
        phone: phone,
        email: email,
        workingHours: [
          {
            day: "Monday",
            openTime: "08:00",
            closeTime: "22:00",
            isClosed: false,
          },
          {
            day: "Tuesday",
            openTime: "08:00",
            closeTime: "22:00",
            isClosed: false,
          },
          {
            day: "Wednesday",
            openTime: "08:00",
            closeTime: "22:00",
            isClosed: false,
          },
          {
            day: "Thursday",
            openTime: "08:00",
            closeTime: "22:00",
            isClosed: false,
          },
          {
            day: "Friday",
            openTime: "08:00",
            closeTime: "22:00",
            isClosed: false,
          },
          {
            day: "Saturday",
            openTime: "09:00",
            closeTime: "21:00",
            isClosed: false,
          },
          {
            day: "Sunday",
            openTime: "09:00",
            closeTime: "18:00",
            isClosed: false,
          },
        ],
      });

      await pharmacy.save();

      // Link pharmacy to user
      user.pharmacy = pharmacy._id;
      await user.save();
    }

    res.status(201).json({
      success: true,
      message: "User registered successfully",
      user: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        userType: user.userType,
        avatarUrl: user.avatarUrl || "",
      },
    });
  } catch (error) {
    console.error("Register error:", error);
    res.status(500).json({
      success: false,
      message: "Error registering user",
      error: error.message,
    });
  }
});

// =======================
// LOGIN (now basically disabled – you use Firebase on frontend)
// =======================
router.post("/login", (req, res) => {
  return res.status(400).json({
    success: false,
    message: "Email/password login is handled by Firebase on the client.",
  });
});

// =======================
// GET CURRENT USER (used by authAPI.getMe)
// =======================
router.get("/me", firebaseAuth, async (req, res) => {
  try {
    const user = req.user; // set by firebaseAuth
    res.json({
      success: true,
      user,
    });
  } catch (error) {
    console.error("Get user error:", error);
    res.status(401).json({
      success: false,
      message: "Invalid token",
      error: error.message,
    });
  }
});

// =======================
// CHANGE PASSWORD (Firebase + Mongo sync)
// =======================
router.put("/password", firebaseAuth, async (req, res) => {
  try {
    const { currentPassword, newPassword, confirmPassword } = req.body;

    if (!currentPassword || !newPassword || !confirmPassword) {
      return res.status(400).json({
        success: false,
        message: "All password fields are required",
      });
    }

    if (newPassword !== confirmPassword) {
      return res.status(400).json({
        success: false,
        message: "New password and confirmation do not match",
      });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({
        success: false,
        message: "New password must be at least 8 characters long",
      });
    }

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: "Current password is incorrect",
      });
    }

    const userRecord = await admin.auth().getUserByEmail(user.email);
    await admin.auth().updateUser(userRecord.uid, {
      password: newPassword,
    });

    user.password = newPassword;
    await user.save();

    res.json({
      success: true,
      message: "Password updated successfully",
    });
  } catch (error) {
    console.error("Update password error:", error);
    res.status(500).json({
      success: false,
      message: "Error updating password",
      error: error.message,
    });
  }
});


// =======================
// DELETE ACCOUNT (Firebase + Mongo + Pharmacy)
// =======================
router.delete("/account", firebaseAuth, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    if (user.userType === "pharmacist") {
      await Pharmacy.deleteOne({ owner: user._id });
    }

    try {
      const userRecord = await admin.auth().getUserByEmail(user.email);
      await admin.auth().deleteUser(userRecord.uid);
    } catch (err) {
      console.warn("Firebase deleteUser skipped:", err.message);
    }

    await User.deleteOne({ _id: user._id });

    res.json({
      success: true,
      message: "Account deleted successfully",
    });
  } catch (error) {
    console.error("Delete account error:", error);
    res.status(500).json({
      success: false,
      message: "Error deleting account",
      error: error.message,
    });
  }
});

module.exports = router;
