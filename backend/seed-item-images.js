const mongoose = require("mongoose");
const dotenv = require("dotenv");
const Item = require("./models/Item");

// Load environment variables
dotenv.config({ path: "../.env" });

// Medication image search terms based on category
const categoryImageTerms = {
  "Pain Relief": [
    "pain relief medicine",
    "analgesic",
    "painkiller",
    "ibuprofen",
    "paracetamol",
  ],
  Antibiotics: [
    "antibiotic medicine",
    "antibiotic pills",
    "amoxicillin",
    "antibiotic tablets",
  ],
  Respiratory: [
    "respiratory medicine",
    "inhaler",
    "asthma medication",
    "cough medicine",
  ],
  "Cardiac Care": [
    "heart medication",
    "cardiac medicine",
    "blood pressure medicine",
    "cardiovascular",
  ],
  "Stomach Care": [
    "stomach medicine",
    "antacid",
    "digestive medicine",
    "gastrointestinal",
  ],
  "Derma Products": [
    "dermatology cream",
    "skin care medicine",
    "topical cream",
    "dermatology",
  ],
  "Oral Care": [
    "oral medicine",
    "mouth care",
    "dental medicine",
    "oral hygiene",
  ],
  "Sexual Health": [
    "sexual health medicine",
    "pharmaceutical",
    "medicine pills",
  ],
  "Elderly Care": [
    "elderly medicine",
    "senior medication",
    "pharmaceutical",
    "medicine",
  ],
  "Cold & Immunity": [
    "cold medicine",
    "immune system",
    "vitamin",
    "supplement",
  ],
  Other: ["medicine", "pharmaceutical", "pills", "medication"],
};

// Get image URL based on item name and category
// Uses Unsplash for real medication photos (no API key needed)
const getMedicationImageUrl = (item) => {
  const itemName = item.name || "";
  const category = item.category || "Other";

  // Clean item name for search
  const cleanName = itemName
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, "")
    .trim();

  // Get category-specific search terms
  const searchTerms =
    categoryImageTerms[category] || categoryImageTerms["Other"];

  // Build search term: prefer item name, fallback to category terms
  let searchTerm;
  if (cleanName.length > 3 && cleanName.split(" ").length <= 3) {
    // Use item name if it's reasonable
    searchTerm = `${cleanName} medicine`;
  } else {
    // Use category-specific term
    searchTerm = searchTerms[Math.floor(Math.random() * searchTerms.length)];
  }

  // Use Unsplash Source API for real medication photos
  // This will return actual photos from Unsplash matching the search term
  const encodedTerm = encodeURIComponent(searchTerm);
  const unsplashUrl = `https://source.unsplash.com/400x400/?${encodedTerm}`;

  return unsplashUrl;
};

// Alternative: Use Google Custom Search API for real Google Images
// To use this, you need to:
// 1. Get a Google API key from https://console.cloud.google.com/
// 2. Create a Custom Search Engine at https://cse.google.com/cse/
// 3. Enable "Image search" in your Custom Search Engine settings
// 4. Add GOOGLE_API_KEY and GOOGLE_SEARCH_ENGINE_ID to your .env file
const getGoogleImageUrl = async (item) => {
  const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY;
  const GOOGLE_SEARCH_ENGINE_ID = process.env.GOOGLE_SEARCH_ENGINE_ID;

  if (!GOOGLE_API_KEY || !GOOGLE_SEARCH_ENGINE_ID) {
    return null; // Will fallback to Unsplash
  }

  try {
    const searchTerm = `${item.name} medicine pharmaceutical drug`;
    const url = `https://www.googleapis.com/customsearch/v1?key=${GOOGLE_API_KEY}&cx=${GOOGLE_SEARCH_ENGINE_ID}&q=${encodeURIComponent(
      searchTerm
    )}&searchType=image&num=1&safe=active`;

    const https = require("https");
    return new Promise((resolve, reject) => {
      https
        .get(url, (res) => {
          let data = "";
          res.on("data", (chunk) => {
            data += chunk;
          });
          res.on("end", () => {
            try {
              const json = JSON.parse(data);
              if (json.items && json.items.length > 0) {
                resolve(json.items[0].link);
              } else {
                resolve(null);
              }
            } catch (error) {
              console.error(
                `Error parsing Google response for ${item.name}:`,
                error.message
              );
              resolve(null);
            }
          });
        })
        .on("error", (error) => {
          console.error(
            `Error fetching Google image for ${item.name}:`,
            error.message
          );
          resolve(null);
        });
    });
  } catch (error) {
    console.error(
      `Error fetching Google image for ${item.name}:`,
      error.message
    );
    return null;
  }
};

const seedItemImages = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("✅ Connected to MongoDB");

    // Get all items
    const items = await Item.find({});
    console.log(`📋 Found ${items.length} items to update`);

    if (items.length === 0) {
      console.log("⚠️  No items found in database");
      await mongoose.connection.close();
      return;
    }

    // Update each item with a medication image URL
    let updated = 0;
    let skipped = 0;
    let googleUsed = 0;
    let unsplashUsed = 0;

    // Check if Google API is configured
    const useGoogle =
      process.env.GOOGLE_API_KEY && process.env.GOOGLE_SEARCH_ENGINE_ID;
    if (useGoogle) {
      console.log("🔍 Using Google Custom Search API for images");
    } else {
      console.log(
        "📸 Using Unsplash API for images (add GOOGLE_API_KEY to .env to use Google Images)"
      );
    }

    for (const item of items) {
      // Skip if already has an imageUrl
      //   if (item.imageUrl) {
      //     console.log(`⏭️  Skipping ${item.name} (already has imageUrl)`);
      //     skipped++;
      //     continue;
      //   }

      let imageUrl;

      // Try Google first if configured, otherwise use Unsplash
      if (useGoogle) {
        imageUrl = await getGoogleImageUrl(item);
        if (imageUrl) {
          googleUsed++;
        }
      }

      // Fallback to Unsplash if Google didn't return an image
      if (!imageUrl) {
        imageUrl = getMedicationImageUrl(item);
        unsplashUsed++;
      }

      await Item.findByIdAndUpdate(item._id, {
        imageUrl: imageUrl,
        updatedAt: new Date(),
      });
      updated++;
      console.log(
        `✅ Updated ${item.name} (${
          item.category
        }) with image: ${imageUrl.substring(0, 60)}...`
      );

      // Small delay to avoid rate limiting (especially for Google API)
      await new Promise((resolve) =>
        setTimeout(resolve, useGoogle ? 500 : 100)
      );
    }

    if (useGoogle) {
      console.log(
        `\n📊 Image sources: ${googleUsed} from Google, ${unsplashUsed} from Unsplash`
      );
    }

    console.log(`\n🎉 Successfully updated ${updated} items with image URLs!`);
    if (skipped > 0) {
      console.log(`⏭️  Skipped ${skipped} items (already had imageUrl)`);
    }
    console.log("✅ Seed completed successfully");

    // Close connection
    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error("❌ Error seeding item images:", error);
    await mongoose.connection.close();
    process.exit(1);
  }
};

// Run the seed function
seedItemImages();
