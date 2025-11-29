const mongoose = require("mongoose");
const dotenv = require("dotenv");

// Load environment variables
dotenv.config({ path: "../.env" });

// Import Pharmacy model
const Pharmacy = require("./models/Pharmacy");

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

// Migrate coordinates from old format to GeoJSON format
const migrateCoordinates = async () => {
  try {
    console.log("🔄 Starting coordinate migration...\n");

    // Find all pharmacies
    const pharmacies = await Pharmacy.find({});

    if (pharmacies.length === 0) {
      console.log("ℹ️  No pharmacies found in database");
      process.exit(0);
    }

    console.log(`📋 Found ${pharmacies.length} pharmacies to migrate\n`);

    let migratedCount = 0;
    let skippedCount = 0;
    let errorCount = 0;

    for (const pharmacy of pharmacies) {
      try {
        const coords = pharmacy.address?.coordinates.toJSON();
        console.log(coords);

        // Check if already in GeoJSON format
        if (
          coords?.type === "Point" &&
          Array.isArray(coords.coordinates) &&
          coords.coordinates.length === 2
        ) {
          console.log(
            `⏭️  Skipping ${pharmacy.name} - already in GeoJSON format`
          );
          skippedCount++;
          continue;
        }
        console.log(coords.latitude);
        // Check if has old format coordinates
        if (coords?.latitude !== undefined && coords?.longitude !== undefined) {
          console.log("hi2");
          const latitude = coords.latitude;
          const longitude = coords.longitude;

          // Convert to GeoJSON format
          pharmacy.address.coordinates = {
            type: "Point",
            coordinates: [longitude, latitude], // GeoJSON: [longitude, latitude]
          };
          console.log("hi");
          await pharmacy.save();
          console.log(
            `✅ Migrated ${pharmacy.name}: [${longitude}, ${latitude}]`
          );
          migratedCount++;
        } else {
          console.log(`⚠️  Skipping ${pharmacy.name} - no coordinates found`);
          skippedCount++;
        }
      } catch (error) {
        console.error(`❌ Error migrating ${pharmacy.name}:`, error.message);
        errorCount++;
      }
    }

    console.log("\n✨ Migration completed!");
    console.log("\n📊 Summary:");
    console.log(`   - Migrated: ${migratedCount}`);
    console.log(`   - Skipped: ${skippedCount}`);
    console.log(`   - Errors: ${errorCount}`);

    process.exit(0);
  } catch (error) {
    console.error("❌ Migration error:", error);
    process.exit(1);
  }
};

// Run migration
connectDB().then(() => {
  migrateCoordinates();
});
