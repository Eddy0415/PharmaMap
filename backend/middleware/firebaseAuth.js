const admin = require("firebase-admin");
const User = require("../models/User");

// Initialize Firebase Admin if not already initialized
if (!admin.apps.length) {
  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY
    ? process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n")
    : undefined;

  if (!projectId || !clientEmail || !privateKey) {
    console.warn("Firebase Admin not initialized: missing credentials");
  } else {
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId,
        clientEmail,
        privateKey,
      }),
    });
  }
}

const firebaseAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization || "";
    const token = authHeader.startsWith("Bearer ")
      ? authHeader.slice(7)
      : null;

    if (!token) {
      return res.status(401).json({ success: false, message: "No token provided" });
    }

    if (!admin.apps.length) {
      return res.status(500).json({ success: false, message: "Auth service not initialized" });
    }

    const decoded = await admin.auth().verifyIdToken(token);
    const email = decoded.email;

    if (!email) {
      return res.status(401).json({ success: false, message: "Invalid token: no email" });
    }

    let user = await User.findOne({ email });
    if (!user) {
      user = new User({
        firstName: decoded.name?.split(" ")[0] || "",
        lastName: decoded.name?.split(" ").slice(1).join(" ") || "",
        email,
        phone: decoded.phone_number || "",
        password: Math.random().toString(36).slice(-12), // never used; hashed by model
        userType: "customer",
      });
      await user.save();
    }

    req.user = user;
    next();
  } catch (error) {
    console.error("Firebase auth error:", error.message);
    return res.status(401).json({ success: false, message: "Invalid or expired token" });
  }
};

module.exports = firebaseAuth;
