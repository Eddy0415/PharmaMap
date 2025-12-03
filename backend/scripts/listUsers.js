const mongoose = require("mongoose");
const dotenv = require("dotenv");
const User = require("../models/User");

// Load environment variables
dotenv.config({ path: "../.env" });

const listUsers = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("✅ Connected to MongoDB\n");

    // Get all users
    const users = await User.find({}).select("firstName lastName email userType createdAt").sort({ createdAt: -1 });

    if (users.length === 0) {
      console.log("No users found in the database.");
    } else {
      console.log(`Found ${users.length} user(s):\n`);
      console.log("Email".padEnd(40) + "Name".padEnd(30) + "Type".padEnd(15) + "Created");
      console.log("-".repeat(100));

      users.forEach((user) => {
        const email = (user.email || "").padEnd(40);
        const name = `${user.firstName || ""} ${user.lastName || ""}`.padEnd(30);
        const type = (user.userType || "customer").padEnd(15);
        const created = user.createdAt ? new Date(user.createdAt).toLocaleDateString() : "N/A";
        console.log(`${email}${name}${type}${created}`);
      });
    }

    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error("❌ Error listing users:", error.message);
    process.exit(1);
  }
};

listUsers();

