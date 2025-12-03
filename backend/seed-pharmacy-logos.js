const mongoose = require("mongoose");
const dotenv = require("dotenv");
const Pharmacy = require("./models/Pharmacy");

// Load environment variables
dotenv.config({ path: "../.env" });

// Pharmacy logo image URLs - using various placeholder services for pharmacy images
// Using a mix of services for variety and reliability
const getRandomLogoUrl = () => {
  const random = Math.random();

  if (random < 0.4) {
    // 40% - Use Picsum Photos with pharmacy-related seeds for variety
    const seeds = [
      "pharmacy",
      "medical",
      "medicine",
      "health",
      "drugstore",
      "clinic",
      "hospital",
      "prescription",
    ];
    const seed = seeds[Math.floor(Math.random() * seeds.length)];
    const imageId = Math.floor(Math.random() * 1000);
    return `https://picsum.photos/seed/${seed}${imageId}/400/400`;
  } else if (random < 0.7) {
    // 30% - Use placeholder.com with pharmacy text
    const colors = [
      "4ecdc4",
      "44a9a3",
      "667eea",
      "764ba2",
      "f093fb",
      "4facfe",
      "43e97b",
      "38f9d7",
    ];
    const color = colors[Math.floor(Math.random() * colors.length)];
    const text = encodeURIComponent("PHARMACY");
    return `https://via.placeholder.com/400/${color}/FFFFFF?text=${text}`;
  } else {
    // 30% - Use dummyimage.com with pharmacy text
    const colors = ["4ecdc4", "44a9a3", "667eea", "764ba2"];
    const color = colors[Math.floor(Math.random() * colors.length)];
    const text = encodeURIComponent("PHARMACY");
    return `https://dummyimage.com/400x400/${color}/ffffff&text=${text}`;
  }
};

const seedPharmacyLogos = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("✅ Connected to MongoDB");

    // Get all pharmacies
    const pharmacies = await Pharmacy.find({});
    console.log(`📋 Found ${pharmacies.length} pharmacies to update`);

    if (pharmacies.length === 0) {
      console.log("⚠️  No pharmacies found in database");
      await mongoose.connection.close();
      return;
    }

    // Update each pharmacy with a random logo URL
    let updated = 0;
    for (const pharmacy of pharmacies) {
      const logoUrl = getRandomLogoUrl();
      await Pharmacy.findByIdAndUpdate(pharmacy._id, {
        logoUrl: logoUrl,
        updatedAt: new Date(),
      });
      updated++;
      console.log(
        `✅ Updated ${pharmacy.name} with logo: ${logoUrl.substring(0, 50)}...`
      );
    }

    console.log(
      `\n🎉 Successfully updated ${updated} pharmacies with logo URLs!`
    );
    console.log("✅ Seed completed successfully");

    // Close connection
    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error("❌ Error seeding pharmacy logos:", error);
    await mongoose.connection.close();
    process.exit(1);
  }
};

// Run the seed function
seedPharmacyLogos();
