const firebaseAuth = require("./firebaseAuth");

const adminAuth = async (req, res, next) => {
  // First verify Firebase token
  return firebaseAuth(req, res, () => {
    // Check if user is admin
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    if (req.user.userType !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Access denied. Admin privileges required.",
      });
    }

    next();
  });
};

module.exports = adminAuth;

