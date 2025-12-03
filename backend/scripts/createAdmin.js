const mongoose = require("mongoose");
const dotenv = require("dotenv");
const User = require("../models/User");

// Load environment variables
dotenv.config({ path: "../.env" });

const createAdmin = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("✅ Connected to MongoDB");

    // Get email from command line arguments
    const email = process.argv[2];

    if (!email) {
      console.error("❌ Please provide an email address");
      console.log("Usage: node createAdmin.js <email>");
      process.exit(1);
    }

    // Find user by email
    const user = await User.findOne({ email: email.toLowerCase() });

    if (!user) {
      console.error(`❌ User with email "${email}" not found`);
      console.log("Please make sure the user exists in the database first.");
      process.exit(1);
    }

    // Update user to admin
    user.userType = "admin";
    await user.save();

    console.log(`✅ Successfully set user "${user.firstName} ${user.lastName}" (${email}) as admin`);
    console.log(`   User ID: ${user._id}`);
    console.log(`   User Type: ${user.userType}`);

    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error("❌ Error creating admin:", error.message);
    process.exit(1);
  }
};

createAdmin();

