const mongoose = require("mongoose");
const dotenv = require("dotenv");

// Load environment variables
dotenv.config({ path: "../.env" });

// Import models
const Pharmacy = require("./models/Pharmacy");
const Item = require("./models/Item");
const Inventory = require("./models/Inventory");

// Generate random number in range
const randomInt = (min, max) =>
  Math.floor(Math.random() * (max - min + 1)) + min;

// Generate random date within last year
const randomDate = (start, end) => {
  return new Date(
    start.getTime() + Math.random() * (end.getTime() - start.getTime())
  );
};

// Connect to MongoDB
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("✅ MongoDB Connected");
  } catch (error) {
    console.error("❌ MongoDB Connection Error:", error.message);
    process.exit(1);
  }
};

// Seed inventory only
const seedInventory = async () => {
  try {
    console.log("🌱 Starting inventory seeding...\n");

    // Clear existing inventory
    console.log("🗑️  Clearing existing inventory...");
    await Inventory.deleteMany({});
    console.log("✅ Existing inventory cleared\n");

    // Fetch all pharmacies and items
    const pharmacies = await Pharmacy.find({});
    const items = await Item.find({});

    if (pharmacies.length === 0) {
      console.error("❌ No pharmacies found. Please seed the database first.");
      process.exit(1);
    }

    if (items.length === 0) {
      console.error("❌ No items found. Please seed the database first.");
      process.exit(1);
    }

    console.log(
      `📋 Found ${pharmacies.length} pharmacies and ${items.length} items\n`
    );

    // Create Inventory (link items to pharmacies)
    console.log("📦 Creating inventory...");
    let inventoryCount = 0;
    for (const pharmacy of pharmacies) {
      // Each pharmacy gets 60-80% of items
      const itemsForPharmacy = items.filter(() => Math.random() > 0.3);

      for (const item of itemsForPharmacy) {
        const quantity = randomInt(0, 200);

        const inventory = new Inventory({
          pharmacy: pharmacy._id,
          item: item._id,
          quantity,
          // price will be automatically set to item.basePrice by pre-save hook
          lowStockThreshold: 10,
          isAvailable: true,
          totalOrders: randomInt(0, 50),
          lastRestocked: randomDate(new Date(2024, 0, 1), new Date()),
        });
        await inventory.save();
        inventoryCount++;
      }
    }
    console.log(`✅ Created ${inventoryCount} inventory entries\n`);

    console.log("✨ Inventory seeding completed successfully!");
    console.log(`\n📊 Summary: ${inventoryCount} inventory entries created`);

    process.exit(0);
  } catch (error) {
    console.error("❌ Error seeding inventory:", error);
    process.exit(1);
  }
};

// Run seed
connectDB().then(() => {
  seedInventory();
});
