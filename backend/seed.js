const mongoose = require("mongoose");
const dotenv = require("dotenv");

// Load environment variables
dotenv.config({ path: "../.env" });

// Import models
const User = require("./models/User");
const Pharmacy = require("./models/Pharmacy");
const Item = require("./models/Item");
const Inventory = require("./models/Inventory");
const Order = require("./models/Order");
const Review = require("./models/Review");

// Lebanese cities with actual coordinates [longitude, latitude]
const cities = [
  { name: "Beirut", coords: [35.5018, 33.8938] },
  { name: "Tripoli", coords: [35.8497, 34.4367] },
  { name: "Sidon", coords: [35.3706, 33.5631] },
  { name: "Tyre", coords: [35.1969, 33.2733] },
  { name: "Byblos", coords: [35.6511, 34.1211] },
  { name: "Zahle", coords: [35.9047, 33.8497] },
  { name: "Baalbek", coords: [36.2181, 34.0058] },
];

// Streets mapped to cities for realism
const cityStreets = {
  Beirut: [
    "Hamra Street",
    "Corniche El Mazraa",
    "Achrafieh Main Road",
    "Badaro Street",
    "Mar Mikhael",
    "Gemmayze",
    "Downtown Beirut",
    "Ras Beirut",
    "Verdun Street",
    "Monot Street",
    "Spears Street",
    "Bliss Street",
  ],
  Tripoli: [
    "Al Mina Street",
    "Azmi Street",
    "Tall Square",
    "Al Nour Square",
    "Al Qobbeh Street",
    "Al Mina Road",
    "Port Street",
    "Al Mina Corniche",
  ],
  Sidon: [
    "Saida Main Road",
    "Riad El Solh Street",
    "Al Qalaa Street",
    "Corniche Saida",
    "Old Souk Street",
    "Sea Castle Road",
  ],
  Tyre: [
    "Sour Main Street",
    "Al Bass Street",
    "Hippodrome Road",
    "Corniche Tyre",
    "Old City Street",
    "Port Road",
  ],
  Byblos: [
    "Jbeil Main Street",
    "Old Souk Byblos",
    "Harbour Road",
    "Crusader Castle Street",
    "Byblos Corniche",
  ],
  Zahle: [
    "Maalaka Street",
    "Bardouni Street",
    "Zahle Main Road",
    "Berdawni Valley",
    "Al Wadi Street",
  ],
  Baalbek: [
    "Baalbek Main Street",
    "Temple Road",
    "Ras El Ain Street",
    "Al Qalaa Street",
    "Roman Ruins Road",
  ],
};

const firstNames = [
  "Ahmad",
  "Mohammad",
  "Ali",
  "Hassan",
  "Omar",
  "Khaled",
  "Sara",
  "Layla",
  "Mariam",
  "Fatima",
  "Nour",
  "Zeina",
  "Rania",
  "Yasmine",
];

const lastNames = [
  "Khoury",
  "Saad",
  "Fadel",
  "Haddad",
  "Nassar",
  "Mansour",
  "Khalil",
  "Ibrahim",
  "Saliba",
  "Tannous",
  "Chamoun",
  "Geagea",
  "Hariri",
  "Jumblatt",
];

const pharmacyNames = [
  "Al-Shifa Pharmacy",
  "Beirut Medical Center",
  "PharmaCare Lebanon",
  "Health Plus Pharmacy",
  "MedExpress",
  "City Pharmacy",
  "Wellness Pharmacy",
  "Care Pharmacy",
  "Life Pharmacy",
  "Prime Health Pharmacy",
  "Green Cross Pharmacy",
  "MediCare Plus",
  "Family Pharmacy",
  "Community Health Pharmacy",
  "Elite Medical Pharmacy",
  "Central Pharmacy",
  "Sunrise Pharmacy",
  "Golden Pharmacy",
  "Royal Medical Center",
  "Star Pharmacy",
  "Noble Health Pharmacy",
  "Premium Care Pharmacy",
  "Trust Pharmacy",
  "Reliable Medical",
  "QuickCare Pharmacy",
];

const medications = [
  // Pain Relief
  {
    name: "Paracetamol 500mg",
    category: "Pain Relief",
    dosage: "500mg",
    form: "tablet",
    requiresPrescription: false,
    basePrice: 2.5,
  },
  {
    name: "Ibuprofen 400mg",
    category: "Pain Relief",
    dosage: "400mg",
    form: "tablet",
    requiresPrescription: false,
    basePrice: 3.0,
  },
  {
    name: "Aspirin 100mg",
    category: "Pain Relief",
    dosage: "100mg",
    form: "tablet",
    requiresPrescription: false,
    basePrice: 1.5,
  },
  {
    name: "Diclofenac Gel",
    category: "Pain Relief",
    dosage: "1%",
    form: "cream",
    requiresPrescription: false,
    basePrice: 5.0,
  },

  // Antibiotics
  {
    name: "Amoxicillin 500mg",
    category: "Antibiotics",
    dosage: "500mg",
    form: "capsule",
    requiresPrescription: true,
    basePrice: 8.0,
  },
  {
    name: "Azithromycin 250mg",
    category: "Antibiotics",
    dosage: "250mg",
    form: "tablet",
    requiresPrescription: true,
    basePrice: 12.0,
  },
  {
    name: "Ciprofloxacin 500mg",
    category: "Antibiotics",
    dosage: "500mg",
    form: "tablet",
    requiresPrescription: true,
    basePrice: 10.0,
  },

  // Respiratory
  {
    name: "Ventolin Inhaler",
    category: "Respiratory",
    dosage: "100mcg",
    form: "inhaler",
    requiresPrescription: true,
    basePrice: 15.0,
  },
  {
    name: "Cough Syrup",
    category: "Respiratory",
    dosage: "100ml",
    form: "syrup",
    requiresPrescription: false,
    basePrice: 6.0,
  },
  {
    name: "Nasal Drops",
    category: "Respiratory",
    dosage: "10ml",
    form: "drops",
    requiresPrescription: false,
    basePrice: 4.0,
  },

  // Cardiac Care
  {
    name: "Aspirin Cardio 100mg",
    category: "Cardiac Care",
    dosage: "100mg",
    form: "tablet",
    requiresPrescription: false,
    basePrice: 3.5,
  },
  {
    name: "Atorvastatin 20mg",
    category: "Cardiac Care",
    dosage: "20mg",
    form: "tablet",
    requiresPrescription: true,
    basePrice: 18.0,
  },

  // Stomach Care
  {
    name: "Omeprazole 20mg",
    category: "Stomach Care",
    dosage: "20mg",
    form: "capsule",
    requiresPrescription: false,
    basePrice: 7.0,
  },
  {
    name: "Antacid Tablets",
    category: "Stomach Care",
    dosage: "500mg",
    form: "tablet",
    requiresPrescription: false,
    basePrice: 3.0,
  },

  // Derma Products
  {
    name: "Moisturizing Cream",
    category: "Derma Products",
    dosage: "100g",
    form: "cream",
    requiresPrescription: false,
    basePrice: 8.0,
  },
  {
    name: "Sunscreen SPF 50",
    category: "Derma Products",
    dosage: "50ml",
    form: "cream",
    requiresPrescription: false,
    basePrice: 12.0,
  },

  // Oral Care
  {
    name: "Toothpaste",
    category: "Oral Care",
    dosage: "100g",
    form: "other",
    requiresPrescription: false,
    basePrice: 4.0,
  },
  {
    name: "Mouthwash",
    category: "Oral Care",
    dosage: "500ml",
    form: "other",
    requiresPrescription: false,
    basePrice: 5.0,
  },

  // Cold & Immunity
  {
    name: "Vitamin C 1000mg",
    category: "Cold & Immunity",
    dosage: "1000mg",
    form: "tablet",
    requiresPrescription: false,
    basePrice: 6.0,
  },
  {
    name: "Zinc Supplements",
    category: "Cold & Immunity",
    dosage: "50mg",
    form: "tablet",
    requiresPrescription: false,
    basePrice: 8.0,
  },
];

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

// Generate random date within last year
const randomDate = (start, end) => {
  return new Date(
    start.getTime() + Math.random() * (end.getTime() - start.getTime())
  );
};

// Generate random number in range
const randomInt = (min, max) =>
  Math.floor(Math.random() * (max - min + 1)) + min;

// Generate random element from array
const randomElement = (arr) => arr[Math.floor(Math.random() * arr.length)];

// Seed function
const seedDatabase = async () => {
  try {
    console.log("🌱 Starting database seeding...\n");

    // Clear existing data (optional - comment out if you want to keep existing data)
    console.log("🗑️  Clearing existing data...");
    await User.deleteMany({});
    await Pharmacy.deleteMany({});
    await Item.deleteMany({});
    await Inventory.deleteMany({});
    await Order.deleteMany({});
    await Review.deleteMany({});
    console.log("✅ Existing data cleared\n");

    // 1. Create Users (Customers and Pharmacists)
    console.log("👥 Creating users...");
    const customers = [];
    const pharmacists = [];

    // Create specific users first
    const user1 = new User({
      firstName: "John",
      lastName: "Doe",
      email: "user1@gmail.com",
      phone: "03123456",
      userType: "customer",
      dateOfBirth: new Date(1990, 5, 15),
      gender: "male",
      isActive: true,
      isVerified: true,
    });
    await user1.save();
    customers.push(user1);

    const user2 = new User({
      firstName: "Jane",
      lastName: "Smith",
      email: "user2@gmail.com",
      phone: "03765432",
      userType: "customer",
      dateOfBirth: new Date(1992, 8, 20),
      gender: "female",
      isActive: true,
      isVerified: true,
    });
    await user2.save();
    customers.push(user2);

    const pharmacist1 = new User({
      firstName: "Ahmad",
      lastName: "Khoury",
      email: "pharmacy1@gmail.com",
      phone: "01123456",
      userType: "pharmacist",
      isActive: true,
      isVerified: true,
    });
    await pharmacist1.save();
    pharmacists.push(pharmacist1);

    const pharmacist2 = new User({
      firstName: "Mariam",
      lastName: "Saad",
      email: "pharmacy2@gmail.com",
      phone: "01765432",
      userType: "pharmacist",
      isActive: true,
      isVerified: true,
    });
    await pharmacist2.save();
    pharmacists.push(pharmacist2);

    // Create additional customers
    for (let i = 0; i < 5; i++) {
      const firstName = randomElement(firstNames);
      const lastName = randomElement(lastNames);
      const customer = new User({
        firstName,
        lastName,
        email: `customer${i + 1}@example.com`,
        phone: `03${randomInt(100000, 999999)}`,
        userType: "customer",
        dateOfBirth: randomDate(new Date(1970, 0, 1), new Date(2005, 11, 31)),
        gender: randomElement(["male", "female", "prefer-not"]),
        isActive: true,
        isVerified: Math.random() > 0.3, // 70% verified
      });
      await customer.save();
      customers.push(customer);
    }
    console.log(
      `✅ Created ${customers.length} customers (including user1@gmail.com, user2@gmail.com)`
    );

    // Create additional pharmacists
    for (let i = 0; i < 8; i++) {
      const firstName = randomElement(firstNames);
      const lastName = randomElement(lastNames);
      const pharmacist = new User({
        firstName,
        lastName,
        email: `pharmacist${i + 1}@example.com`,
        phone: `03${randomInt(100000, 999999)}`,
        userType: "pharmacist",
        isActive: true,
        isVerified: true,
      });
      await pharmacist.save();
      pharmacists.push(pharmacist);
    }
    console.log(
      `✅ Created ${pharmacists.length} pharmacists (including pharmacy1@gmail.com, pharmacy2@gmail.com)\n`
    );

    // 2. Create Items
    console.log("💊 Creating items...");
    const items = [];
    const now = new Date();
    const currentMonthKey = `${now.getFullYear()}-${String(
      now.getMonth() + 1
    ).padStart(2, "0")}`;
    const lastMonthKey =
      now.getMonth() === 0
        ? `${now.getFullYear() - 1}-12`
        : `${now.getFullYear()}-${String(now.getMonth()).padStart(2, "0")}`;

    // Generate last 3 months keys for more realistic data
    const monthKeys = [currentMonthKey, lastMonthKey];
    if (now.getMonth() >= 2) {
      const twoMonthsAgo = `${now.getFullYear()}-${String(
        now.getMonth() - 1
      ).padStart(2, "0")}`;
      monthKeys.push(twoMonthsAgo);
    } else if (now.getMonth() === 1) {
      monthKeys.push(`${now.getFullYear() - 1}-12`);
    } else {
      monthKeys.push(`${now.getFullYear() - 1}-11`);
    }

    for (const med of medications) {
      const searchCount = randomInt(50, 500);
      const currentMonthCount = randomInt(10, 100);
      const lastMonthCount = randomInt(5, 80);
      const twoMonthsAgoCount = randomInt(3, 60);

      // Create monthly search counts map
      const monthlySearchCounts = new Map();
      monthlySearchCounts.set(monthKeys[0], currentMonthCount);
      monthlySearchCounts.set(monthKeys[1], lastMonthCount);
      if (monthKeys[2]) {
        monthlySearchCounts.set(monthKeys[2], twoMonthsAgoCount);
      }

      const item = new Item({
        ...med,
        description: `${med.name} - High quality medication`,
        manufacturer: "PharmaLebanon",
        imageUrl: `https://via.placeholder.com/300x300?text=${encodeURIComponent(
          med.name
        )}`,
        searchCount,
        popularityScore: randomInt(0, 100),
        monthlySearchCounts,
      });
      await item.save();
      items.push(item);
    }
    console.log(
      `✅ Created ${items.length} items with monthly search counts\n`
    );

    // 3. Create Pharmacies
    console.log("🏥 Creating pharmacies...");
    const pharmacies = [];
    const days = [
      "Monday",
      "Tuesday",
      "Wednesday",
      "Thursday",
      "Friday",
      "Saturday",
      "Sunday",
    ];

    // Shuffle pharmacy names to ensure unique assignment
    const availablePharmacyNames = [...pharmacyNames].sort(
      () => Math.random() - 0.5
    );
    let nameIndex = 0;

    for (let i = 0; i < pharmacists.length; i++) {
      const pharmacist = pharmacists[i];
      const workingHours = days.map((day) => ({
        day,
        openTime: day === "Sunday" ? "09:00" : "08:00",
        closeTime:
          day === "Sunday" ? "18:00" : day === "Saturday" ? "21:00" : "22:00",
        isClosed: false,
      }));

      // Select city with actual coordinates
      const selectedCity = randomElement(cities);
      // Add small random offset for variety within the city
      const coordOffset = () => (Math.random() - 0.5) * 0.03; // ~3km offset

      // Get realistic street for the selected city
      const streetsForCity =
        cityStreets[selectedCity.name] || cityStreets.Beirut;
      const selectedStreet = randomElement(streetsForCity);

      // Assign unique pharmacy names
      let pharmacyName;
      if (i === 0) {
        pharmacyName = "Al-Shifa Pharmacy";
      } else if (i === 1) {
        pharmacyName = "Beirut Medical Center";
      } else {
        // Get next unique name from shuffled array
        pharmacyName = availablePharmacyNames[nameIndex];
        nameIndex++;
        // If we run out of names, generate a unique one
        if (!pharmacyName) {
          pharmacyName = `Pharmacy ${i + 1} - ${selectedCity.name}`;
        }
      }

      const pharmacy = new Pharmacy({
        name: pharmacyName,
        owner: pharmacist._id,
        user: pharmacist._id,
        address: {
          street: selectedStreet,
          city: selectedCity.name,
          coordinates: {
            type: "Point",
            // GeoJSON format: [longitude, latitude] with small offset
            coordinates: [
              selectedCity.coords[0] + coordOffset(),
              selectedCity.coords[1] + coordOffset(),
            ],
          },
        },
        phone: `01${randomInt(100000, 999999)}`,
        email: pharmacist.email,
        workingHours,
        isOpen: Math.random() > 0.2, // 80% open
        is24Hours: Math.random() > 0.9, // 10% 24 hours
        licenseNumber: `PH${randomInt(10000, 99999)}`,
        averageRating: 0,
        totalReviews: 0,
        totalOrders: 0,
        isVerified: Math.random() > 0.3, // 70% verified
        isActive: true,
        featured: i < 2 || Math.random() > 0.7, // First 2 and 30% featured
      });
      await pharmacy.save();
      pharmacies.push(pharmacy);

      // Link pharmacy to pharmacist
      pharmacist.pharmacy = pharmacy._id;
      await pharmacist.save();
    }
    console.log(
      `✅ Created ${pharmacies.length} pharmacies with correct coordinates\n`
    );

    // 4. Create Inventory (link items to pharmacies)
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

    // 5. Create Orders
    console.log("🛒 Creating orders...");
    const orders = [];
    for (let i = 0; i < 30; i++) {
      const customer = randomElement(customers);
      const pharmacy = randomElement(pharmacies);

      // Get inventory for this pharmacy
      const pharmacyInventory = await Inventory.find({
        pharmacy: pharmacy._id,
        quantity: { $gt: 0 },
      }).limit(5);

      if (pharmacyInventory.length === 0) continue;

      const orderItems = [];
      let totalAmount = 0;
      const selectedItems = pharmacyInventory.slice(0, randomInt(1, 3));

      for (const inv of selectedItems) {
        const quantity = randomInt(1, 3);
        const subtotal = inv.price * quantity;
        orderItems.push({
          item: inv.item,
          quantity,
          priceAtOrder: inv.price,
          subtotal,
        });
        totalAmount += subtotal;
      }

      const statuses = [
        "pending",
        "confirmed",
        "ready",
        "completed",
        "cancelled",
      ];
      const status = randomElement(statuses);
      const createdAt = randomDate(new Date(2024, 0, 1), new Date());

      const order = new Order({
        orderNumber: `ORD-${Date.now()}-${i}`,
        customer: customer._id,
        pharmacy: pharmacy._id,
        items: orderItems,
        totalAmount: Math.round(totalAmount * 100) / 100,
        status,
        customerNotes:
          Math.random() > 0.7 ? "Please handle with care" : undefined,
        createdAt,
        ...(status === "confirmed"
          ? { confirmedAt: new Date(createdAt.getTime() + 3600000) }
          : {}),
        ...(status === "completed"
          ? { completedAt: new Date(createdAt.getTime() + 7200000) }
          : {}),
        ...(status === "cancelled"
          ? { cancelledAt: new Date(createdAt.getTime() + 1800000) }
          : {}),
      });
      await order.save();
      orders.push(order);

      // Update pharmacy total orders
      pharmacy.totalOrders += 1;
      await pharmacy.save();
    }
    console.log(`✅ Created ${orders.length} orders\n`);

    // 6. Create Reviews
    console.log("⭐ Creating reviews...");
    let reviewCount = 0;
    for (const pharmacy of pharmacies) {
      // Each pharmacy gets 2-5 reviews
      const numReviews = randomInt(2, 5);
      const reviewedCustomers = customers
        .sort(() => Math.random() - 0.5)
        .slice(0, numReviews);

      for (const customer of reviewedCustomers) {
        const rating = randomInt(3, 5); // Mostly positive reviews
        const review = new Review({
          user: customer._id,
          pharmacy: pharmacy._id,
          rating,
          comment:
            rating >= 4
              ? "Great service !"
              : "Good pharmacy, could improve service.",
          order: randomElement(
            orders.filter(
              (o) => o.customer.toString() === customer._id.toString()
            )
          )?._id,
          createdAt: randomDate(new Date(2024, 0, 1), new Date()),
        });
        await review.save();
        reviewCount++;
      }
    }
    console.log(`✅ Created ${reviewCount} reviews\n`);

    // 7. Add some favorites
    console.log("❤️  Adding favorites...");
    for (const customer of customers.slice(0, 10)) {
      // Add favorite pharmacies
      const favoritePharmacies = pharmacies
        .sort(() => Math.random() - 0.5)
        .slice(0, randomInt(1, 3));
      customer.favoritePharmacies = favoritePharmacies.map((p) => p._id);

      // Add favorite items
      const favoriteItems = items
        .sort(() => Math.random() - 0.5)
        .slice(0, randomInt(2, 5));
      customer.favoriteItems = favoriteItems.map((i) => i._id);

      await customer.save();
    }
    console.log("✅ Added favorites\n");

    console.log("✨ Database seeding completed successfully!");
    console.log("\n📊 Summary:");
    console.log(
      `   - Users: ${customers.length + pharmacists.length} (${
        customers.length
      } customers, ${pharmacists.length} pharmacists)`
    );
    console.log(`   - Pharmacies: ${pharmacies.length}`);
    console.log(`   - Items: ${items.length}`);
    console.log(`   - Inventory entries: ${inventoryCount}`);
    console.log(`   - Orders: ${orders.length}`);
    console.log(`   - Reviews: ${reviewCount}`);
    console.log("\n🔑 Auth:");
    console.log(
      "   Seeded users are profile records only; manage passwords via Firebase."
    );

    process.exit(0);
  } catch (error) {
    console.error("❌ Error seeding database:", error);
    process.exit(1);
  }
};

// Run seed
connectDB().then(() => {
  seedDatabase();
});
