import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Container,
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  Grid,
  TextField,
  Avatar,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Chip,
  IconButton,
  Paper,
  Divider,
} from "@mui/material";
import {
  Person,
  ShoppingBag,
  Room,
  Favorite,
  Security,
  Logout,
  Edit,
  Delete,
  Home,
  Work,
  Add,
  Replay,
  Star,
} from "@mui/icons-material";
import Header from "../components/Header";
import Footer from "../components/Footer";
import { userAPI, orderAPI, authAPI } from "../services/api";
import { useNavigate as useNavigateHook } from "react-router-dom";

const UserProfile = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [activeSection, setActiveSection] = useState("profile");
  const [orders, setOrders] = useState([]);
  const [favoritePharmacies, setFavoritePharmacies] = useState([]);
  const [favoriteItems, setFavoriteItems] = useState([]);
  const [profileData, setProfileData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    dateOfBirth: "",
    gender: "",
  });
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  useEffect(() => {
    // Load user from localStorage
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      const userData = JSON.parse(storedUser);
      setUser(userData);
      fetchUserProfile(userData.id);
      fetchOrders(userData.id);
      fetchFavorites(userData.id);
    } else {
      navigate("/login");
    }
  }, [navigate]);

  const fetchUserProfile = async (userId) => {
    try {
      // Use auth/me since there's no GET /users/:id endpoint
      const response = await authAPI.getMe();
      const profile = response.data.user;
      if (profile) {
        setProfileData({
          firstName: profile.firstName || "",
          lastName: profile.lastName || "",
          email: profile.email || "",
          phone: profile.phone || "",
          dateOfBirth: profile.dateOfBirth
            ? profile.dateOfBirth.split("T")[0]
            : "",
          gender: profile.gender || "",
        });
      }
    } catch (error) {
      console.error("Error fetching profile:", error);
    }
  };

  const fetchOrders = async (userId) => {
    try {
      const response = await orderAPI.getAll({ customerId: userId });
      setOrders(response.data.orders || []);
    } catch (error) {
      console.error("Error fetching orders:", error);
    }
  };

  const fetchFavorites = async (userId) => {
    try {
      const [pharmaciesRes, itemsRes] = await Promise.all([
        userAPI.getFavoritePharmacies(userId),
        userAPI.getFavoriteItems(userId),
      ]);
      setFavoritePharmacies(pharmaciesRes.data.favoritePharmacies || []);
      setFavoriteItems(itemsRes.data.favoriteItems || []);
    } catch (error) {
      console.error("Error fetching favorites:", error);
    }
  };

  const handleRemoveFavoritePharmacy = async (pharmacyId) => {
    if (!user?.id) return;
    try {
      await userAPI.removeFavoritePharmacy(user.id, pharmacyId);
      setFavoritePharmacies(
        favoritePharmacies.filter((p) => (p._id || p) !== pharmacyId)
      );
      alert("Pharmacy removed from favorites");
    } catch (error) {
      console.error("Error removing favorite pharmacy:", error);
      alert("Failed to remove favorite");
    }
  };

  const handleRemoveFavoriteItem = async (itemId) => {
    if (!user?.id) return;
    try {
      await userAPI.removeFavoriteItem(user.id, itemId);
      setFavoriteItems(favoriteItems.filter((i) => (i._id || i) !== itemId));
      alert("Item removed from favorites");
    } catch (error) {
      console.error("Error removing favorite item:", error);
      alert("Failed to remove favorite");
    }
  };

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    try {
      await userAPI.updateProfile(user.id, profileData);
      alert("Profile updated successfully!");
    } catch (error) {
      console.error("Error updating profile:", error);
      alert("Failed to update profile");
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/");
  };

  const handlePasswordUpdate = async (e) => {
    e.preventDefault();
    try {
      // Validate passwords
      if (
        !passwordData.currentPassword ||
        !passwordData.newPassword ||
        !passwordData.confirmPassword
      ) {
        alert("Please fill in all password fields");
        return;
      }

      if (passwordData.newPassword !== passwordData.confirmPassword) {
        alert("New password and confirmation do not match");
        return;
      }

      if (passwordData.newPassword.length < 8) {
        alert("New password must be at least 8 characters long");
        return;
      }

      await authAPI.changePassword(passwordData);
      alert("Password updated successfully!");
      setPasswordData({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
    } catch (error) {
      console.error("Error updating password:", error);
      const errorMessage =
        error.response?.data?.message || "Failed to update password";
      alert(errorMessage);
    }
  };

  const handleDeleteAccount = async () => {
    const confirmed = window.confirm(
      "Are you sure you want to delete your account? This action cannot be undone. All your data will be permanently deleted."
    );

    if (!confirmed) {
      return;
    }

    const doubleConfirm = window.confirm(
      "This is your last chance. Are you absolutely sure you want to delete your account?"
    );

    if (!doubleConfirm) {
      return;
    }

    try {
      await authAPI.deleteAccount();
      alert("Your account has been deleted successfully.");
      handleLogout();
    } catch (error) {
      console.error("Error deleting account:", error);
      const errorMessage =
        error.response?.data?.message || "Failed to delete account";
      alert(errorMessage);
    }
  };

  const renderProfileSection = () => (
    <Card>
      <CardContent>
        <Box sx={{ display: "flex", alignItems: "center", mb: 3 }}>
          <Person sx={{ mr: 1, color: "primary.main" }} />
          <Typography variant="h5" fontWeight={700}>
            Personal Details
          </Typography>
        </Box>

        <form onSubmit={handleProfileUpdate}>
          <Grid container spacing={2.5}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="First Name"
                value={profileData.firstName}
                onChange={(e) =>
                  setProfileData({ ...profileData, firstName: e.target.value })
                }
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Last Name"
                value={profileData.lastName}
                onChange={(e) =>
                  setProfileData({ ...profileData, lastName: e.target.value })
                }
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Email Address"
                type="email"
                value={profileData.email}
                onChange={(e) =>
                  setProfileData({ ...profileData, email: e.target.value })
                }
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Phone Number"
                value={profileData.phone}
                onChange={(e) =>
                  setProfileData({ ...profileData, phone: e.target.value })
                }
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Date of Birth"
                type="date"
                value={profileData.dateOfBirth}
                onChange={(e) =>
                  setProfileData({
                    ...profileData,
                    dateOfBirth: e.target.value,
                  })
                }
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                select
                label="Gender"
                value={profileData.gender}
                onChange={(e) =>
                  setProfileData({ ...profileData, gender: e.target.value })
                }
                SelectProps={{ native: true }}
              >
                <option value=""></option>
                <option value="female">Female</option>
                <option value="male">Male</option>
                <option value="other">Other</option>
                <option value="prefer-not">Prefer not to say</option>
              </TextField>
            </Grid>
          </Grid>

          <Box sx={{ display: "flex", gap: 2, mt: 3 }}>
            <Button
              type="submit"
              variant="contained"
              sx={{
                background: "linear-gradient(135deg, #4ecdc4 0%, #44a9a3 100%)",
              }}
            >
              Save Changes
            </Button>
            <Button variant="outlined">Reset</Button>
          </Box>
        </form>
      </CardContent>
    </Card>
  );

  const renderOrdersSection = () => (
    <Card>
      <CardContent>
        <Typography variant="h5" fontWeight={700} mb={3}>
          My Orders
        </Typography>

        {orders.length === 0 ? (
          <Box sx={{ textAlign: "center", py: 4 }}>
            <ShoppingBag sx={{ fontSize: 64, color: "#e0e0e0", mb: 2 }} />
            <Typography variant="h6" color="text.secondary">
              No orders yet
            </Typography>
          </Box>
        ) : (
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
            {orders.map((order) => (
              <Paper
                key={order._id}
                sx={{
                  p: 2.5,
                  border: "2px solid #f0f0f0",
                  transition: "all 0.3s",
                  "&:hover": {
                    borderColor: "primary.main",
                    boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
                  },
                }}
              >
                <Grid container spacing={2} alignItems="center">
                  <Grid item>
                    <Box
                      sx={{
                        width: 60,
                        height: 60,
                        borderRadius: 3,
                        background:
                          "linear-gradient(135deg, #e0f7fa 0%, #b2ebf2 100%)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <ShoppingBag
                        sx={{ fontSize: 32, color: "primary.main" }}
                      />
                    </Box>
                  </Grid>
                  <Grid item xs>
                    <Typography variant="h6" fontWeight={600}>
                      {order.medications.map((m) => m.name).join(", ")}
                    </Typography>
                    <Box
                      sx={{
                        display: "flex",
                        gap: 2,
                        flexWrap: "wrap",
                        mt: 0.5,
                      }}
                    >
                      <Typography variant="body2" color="text.secondary">
                        📅 {new Date(order.createdAt).toLocaleDateString()}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        🏪 {order.pharmacy?.name || "Pharmacy"}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        📦 Order #{order.orderNumber}
                      </Typography>
                    </Box>
                    <Chip
                      label={order.status}
                      size="small"
                      sx={{
                        mt: 1,
                        bgcolor:
                          order.status === "completed" ? "#c8e6c9" : "#fff9c4",
                        color:
                          order.status === "completed" ? "#2e7d32" : "#f57f17",
                        fontWeight: 600,
                        textTransform: "capitalize",
                      }}
                    />
                  </Grid>
                  <Grid item sx={{ textAlign: "right" }}>
                    <Typography
                      variant="h6"
                      fontWeight={700}
                      color="primary.main"
                      mb={1}
                    >
                      {order.totalAmount} LBP
                    </Typography>
                    <Button
                      variant="outlined"
                      size="small"
                      startIcon={<Replay />}
                    >
                      Reorder
                    </Button>
                  </Grid>
                </Grid>
              </Paper>
            ))}
          </Box>
        )}
      </CardContent>
    </Card>
  );

  const renderAddressesSection = () => (
    <Card>
      <CardContent>
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            mb: 3,
          }}
        >
          <Typography variant="h5" fontWeight={700}>
            Your Addresses
          </Typography>
          <Button
            variant="contained"
            startIcon={<Add />}
            sx={{
              background: "linear-gradient(135deg, #4ecdc4 0%, #44a9a3 100%)",
            }}
          >
            Add New Address
          </Button>
        </Box>

        <Grid container spacing={2}>
          <Grid item xs={12} md={6}>
            <Paper
              sx={{
                p: 2.5,
                border: "2px solid",
                borderColor: "primary.main",
                bgcolor: "#f0f9f9",
              }}
            >
              <Box
                sx={{ display: "flex", justifyContent: "space-between", mb: 1 }}
              >
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <Home sx={{ color: "primary.main" }} />
                  <Typography variant="h6" fontWeight={700}>
                    Home
                  </Typography>
                </Box>
                <Chip
                  label="DEFAULT"
                  size="small"
                  sx={{ bgcolor: "primary.main", color: "white" }}
                />
              </Box>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Sassine Square, Building 12
                <br />
                Achrafieh, Beirut
                <br />
                Lebanon
              </Typography>
              <Box sx={{ display: "flex", gap: 1 }}>
                <IconButton
                  size="small"
                  sx={{ bgcolor: "#e3f2fd", color: "#1976d2" }}
                >
                  <Edit fontSize="small" />
                </IconButton>
                <IconButton
                  size="small"
                  sx={{ bgcolor: "#ffebee", color: "#d32f2f" }}
                >
                  <Delete fontSize="small" />
                </IconButton>
              </Box>
            </Paper>
          </Grid>

          <Grid item xs={12} md={6}>
            <Paper
              sx={{
                p: 2.5,
                border: "2px solid #f0f0f0",
              }}
            >
              <Box
                sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}
              >
                <Work sx={{ color: "primary.main" }} />
                <Typography variant="h6" fontWeight={700}>
                  Work
                </Typography>
              </Box>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                ABC Tower, 5th Floor
                <br />
                Hamra Street, Beirut
                <br />
                Lebanon
              </Typography>
              <Box sx={{ display: "flex", gap: 1 }}>
                <IconButton
                  size="small"
                  sx={{ bgcolor: "#e3f2fd", color: "#1976d2" }}
                >
                  <Edit fontSize="small" />
                </IconButton>
                <IconButton
                  size="small"
                  sx={{ bgcolor: "#ffebee", color: "#d32f2f" }}
                >
                  <Delete fontSize="small" />
                </IconButton>
              </Box>
            </Paper>
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  );

  const renderFavoritesSection = () => (
    <Box>
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h5" fontWeight={700} mb={3}>
            Favorite Pharmacies
          </Typography>

          {favoritePharmacies.length === 0 ? (
            <Box sx={{ textAlign: "center", py: 8 }}>
              <Favorite sx={{ fontSize: 80, color: "#e0e0e0", mb: 2 }} />
              <Typography variant="h6" color="text.secondary" mb={1}>
                No Favorite Pharmacies Yet
              </Typography>
              <Typography variant="body2" color="text.secondary" mb={3}>
                Start adding pharmacies to your favorites for quick access
              </Typography>
              <Button
                variant="contained"
                onClick={() => navigate("/search")}
                sx={{
                  background:
                    "linear-gradient(135deg, #4ecdc4 0%, #44a9a3 100%)",
                }}
              >
                Browse Pharmacies
              </Button>
            </Box>
          ) : (
            <Grid container spacing={2}>
              {favoritePharmacies.map((pharmacy) => (
                <Grid item xs={12} sm={6} md={4} key={pharmacy._id || pharmacy}>
                  <Paper
                    sx={{
                      p: 2,
                      border: "2px solid #f0f0f0",
                      transition: "all 0.3s",
                      "&:hover": {
                        borderColor: "primary.main",
                        bgcolor: "#f8fdfd",
                      },
                    }}
                  >
                    <Box
                      sx={{
                        display: "flex",
                        justifyContent: "space-between",
                        mb: 1,
                      }}
                    >
                      <Typography
                        variant="h6"
                        fontWeight={600}
                        color="secondary"
                      >
                        {pharmacy.name}
                      </Typography>
                      <IconButton
                        size="small"
                        onClick={() =>
                          handleRemoveFavoritePharmacy(pharmacy._id || pharmacy)
                        }
                        sx={{ color: "error.main" }}
                      >
                        <Delete fontSize="small" />
                      </IconButton>
                    </Box>
                    <Typography variant="body2" color="text.secondary" mb={1}>
                      {pharmacy.address?.street}, {pharmacy.address?.city}
                    </Typography>
                    <Box sx={{ display: "flex", gap: 1, alignItems: "center" }}>
                      <Star sx={{ fontSize: 16, color: "warning.main" }} />
                      <Typography variant="body2">
                        {pharmacy.averageRating?.toFixed(1) || "0.0"} (
                        {pharmacy.totalReviews || 0} reviews)
                      </Typography>
                    </Box>
                    <Button
                      size="small"
                      variant="outlined"
                      onClick={() =>
                        navigate(`/pharmacy/${pharmacy._id || pharmacy}`)
                      }
                      sx={{ mt: 1 }}
                    >
                      View Details
                    </Button>
                  </Paper>
                </Grid>
              ))}
            </Grid>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardContent>
          <Typography variant="h5" fontWeight={700} mb={3}>
            Favorite Items
          </Typography>

          {favoriteItems.length === 0 ? (
            <Box sx={{ textAlign: "center", py: 8 }}>
              <Favorite sx={{ fontSize: 80, color: "#e0e0e0", mb: 2 }} />
              <Typography variant="h6" color="text.secondary" mb={1}>
                No Favorite Items Yet
              </Typography>
              <Typography variant="body2" color="text.secondary" mb={3}>
                Start adding items to your favorites for quick access
              </Typography>
              <Button
                variant="contained"
                onClick={() => navigate("/search")}
                sx={{
                  background:
                    "linear-gradient(135deg, #4ecdc4 0%, #44a9a3 100%)",
                }}
              >
                Browse Items
              </Button>
            </Box>
          ) : (
            <Grid container spacing={2}>
              {favoriteItems.map((item) => (
                <Grid item xs={12} sm={6} md={4} key={item._id || item}>
                  <Paper
                    sx={{
                      p: 2,
                      border: "2px solid #f0f0f0",
                      transition: "all 0.3s",
                      "&:hover": {
                        borderColor: "primary.main",
                        bgcolor: "#f8fdfd",
                      },
                    }}
                  >
                    <Box
                      sx={{
                        display: "flex",
                        justifyContent: "space-between",
                        mb: 1,
                      }}
                    >
                      <Typography
                        variant="h6"
                        fontWeight={600}
                        color="secondary"
                      >
                        {item.name}
                      </Typography>
                      <IconButton
                        size="small"
                        onClick={() =>
                          handleRemoveFavoriteItem(item._id || item)
                        }
                        sx={{ color: "error.main" }}
                      >
                        <Delete fontSize="small" />
                      </IconButton>
                    </Box>
                    <Typography variant="body2" color="text.secondary" mb={1}>
                      {item.category} • {item.dosage || "N/A"}
                    </Typography>
                    {item.imageUrl && (
                      <Box
                        component="img"
                        src={item.imageUrl}
                        alt={item.name}
                        sx={{
                          width: "100%",
                          height: 150,
                          objectFit: "cover",
                          borderRadius: 2,
                          mb: 1,
                        }}
                      />
                    )}
                    <Button
                      size="small"
                      variant="outlined"
                      onClick={() =>
                        navigate(`/medications/${item._id || item}`)
                      }
                      sx={{ mt: 1 }}
                    >
                      View Details
                    </Button>
                  </Paper>
                </Grid>
              ))}
            </Grid>
          )}
        </CardContent>
      </Card>
    </Box>
  );

  const renderSecuritySection = () => (
    <Card>
      <CardContent>
        <Box sx={{ mb: 4 }}>
          <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
            <Security sx={{ mr: 1, color: "primary.main" }} />
            <Typography variant="h5" fontWeight={700}>
              Change Password
            </Typography>
          </Box>

          <form onSubmit={handlePasswordUpdate}>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Current Password"
                  type="password"
                  placeholder="Enter current password"
                  value={passwordData.currentPassword}
                  onChange={(e) =>
                    setPasswordData({
                      ...passwordData,
                      currentPassword: e.target.value,
                    })
                  }
                  required
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="New Password"
                  type="password"
                  placeholder="Enter new password"
                  value={passwordData.newPassword}
                  onChange={(e) =>
                    setPasswordData({
                      ...passwordData,
                      newPassword: e.target.value,
                    })
                  }
                  required
                  helperText="Password must be at least 8 characters long"
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Confirm New Password"
                  type="password"
                  placeholder="Confirm new password"
                  value={passwordData.confirmPassword}
                  onChange={(e) =>
                    setPasswordData({
                      ...passwordData,
                      confirmPassword: e.target.value,
                    })
                  }
                  required
                />
              </Grid>
            </Grid>

            <Button
              type="submit"
              variant="contained"
              sx={{
                mt: 2,
                background: "linear-gradient(135deg, #4ecdc4 0%, #44a9a3 100%)",
              }}
            >
              Update Password
            </Button>
          </form>
        </Box>

        <Divider sx={{ my: 3 }} />

        <Box>
          <Typography variant="h6" fontWeight={700} mb={1}>
            Delete Account
          </Typography>
          <Typography variant="body2" color="text.secondary" mb={2}>
            Once you delete your account, there is no going back. Please be
            certain.
          </Typography>
          <Button
            variant="contained"
            onClick={handleDeleteAccount}
            sx={{
              bgcolor: "#ffebee",
              color: "#d32f2f",
              "&:hover": {
                bgcolor: "#ffcdd2",
              },
            }}
          >
            Delete My Account
          </Button>
        </Box>
      </CardContent>
    </Card>
  );

  if (!user) {
    return null;
  }

  return (
    <Box
      component="main"
      sx={{ bgcolor: "background.default", minHeight: "100vh" }}
    >
      <Header user={user} onLogout={handleLogout} />

      <Container component="section" maxWidth="xl" sx={{ py: 5 }}>
        <Grid container spacing={4}>
          {/* Sidebar */}
          <Grid item xs={12} md={3}>
            <Card sx={{ position: "sticky", top: 90 }}>
              <CardContent>
                <Box
                  sx={{
                    textAlign: "center",
                    mb: 3,
                    pb: 3,
                    borderBottom: "2px solid #f0f0f0",
                  }}
                >
                  <Avatar
                    sx={{
                      width: 100,
                      height: 100,
                      margin: "0 auto 15px",
                      background:
                        "linear-gradient(135deg, #4ecdc4 0%, #44a9a3 100%)",
                      fontSize: 42,
                    }}
                  >
                    {user.firstName?.[0]}
                    {user.lastName?.[0]}
                  </Avatar>
                  <Typography variant="h6" fontWeight={700} color="secondary">
                    {user.firstName} {user.lastName}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {user.email}
                  </Typography>
                </Box>

                <List>
                  <ListItem
                    button
                    selected={activeSection === "profile"}
                    onClick={() => setActiveSection("profile")}
                    sx={{
                      borderRadius: 2,
                      mb: 1,
                      "&.Mui-selected": {
                        background:
                          "linear-gradient(135deg, #4ecdc4 0%, #44a9a3 100%)",
                        color: "white",
                        "& .MuiListItemIcon-root": { color: "white" },
                      },
                    }}
                  >
                    <ListItemIcon>
                      <Person />
                    </ListItemIcon>
                    <ListItemText primary="Profile Info" />
                  </ListItem>
                  <ListItem
                    button
                    selected={activeSection === "orders"}
                    onClick={() => setActiveSection("orders")}
                    sx={{
                      borderRadius: 2,
                      mb: 1,
                      "&.Mui-selected": {
                        background:
                          "linear-gradient(135deg, #4ecdc4 0%, #44a9a3 100%)",
                        color: "white",
                        "& .MuiListItemIcon-root": { color: "white" },
                      },
                    }}
                  >
                    <ListItemIcon>
                      <ShoppingBag />
                    </ListItemIcon>
                    <ListItemText primary="My Orders" />
                  </ListItem>
                  <ListItem
                    button
                    selected={activeSection === "addresses"}
                    onClick={() => setActiveSection("addresses")}
                    sx={{
                      borderRadius: 2,
                      mb: 1,
                      "&.Mui-selected": {
                        background:
                          "linear-gradient(135deg, #4ecdc4 0%, #44a9a3 100%)",
                        color: "white",
                        "& .MuiListItemIcon-root": { color: "white" },
                      },
                    }}
                  >
                    <ListItemIcon>
                      <Room />
                    </ListItemIcon>
                    <ListItemText primary="Addresses" />
                  </ListItem>
                  <ListItem
                    button
                    selected={activeSection === "favorites"}
                    onClick={() => setActiveSection("favorites")}
                    sx={{
                      borderRadius: 2,
                      mb: 1,
                      "&.Mui-selected": {
                        background:
                          "linear-gradient(135deg, #4ecdc4 0%, #44a9a3 100%)",
                        color: "white",
                        "& .MuiListItemIcon-root": { color: "white" },
                      },
                    }}
                  >
                    <ListItemIcon>
                      <Favorite />
                    </ListItemIcon>
                    <ListItemText primary="Favorites" />
                  </ListItem>
                  <ListItem
                    button
                    selected={activeSection === "security"}
                    onClick={() => setActiveSection("security")}
                    sx={{
                      borderRadius: 2,
                      mb: 1,
                      "&.Mui-selected": {
                        background:
                          "linear-gradient(135deg, #4ecdc4 0%, #44a9a3 100%)",
                        color: "white",
                        "& .MuiListItemIcon-root": { color: "white" },
                      },
                    }}
                  >
                    <ListItemIcon>
                      <Security />
                    </ListItemIcon>
                    <ListItemText primary="Security" />
                  </ListItem>
                  <ListItem
                    button
                    onClick={handleLogout}
                    sx={{
                      borderRadius: 2,
                    }}
                  >
                    <ListItemIcon>
                      <Logout />
                    </ListItemIcon>
                    <ListItemText primary="Logout" />
                  </ListItem>
                </List>
              </CardContent>
            </Card>
          </Grid>

          {/* Main Content */}
          <Grid item xs={12} md={9}>
            <Box sx={{ mb: 3 }}>
              <Typography
                variant="h4"
                fontWeight={700}
                color="secondary"
                mb={0.5}
              >
                {activeSection === "profile" && "Profile Information"}
                {activeSection === "orders" && "My Orders"}
                {activeSection === "addresses" && "Saved Addresses"}
                {activeSection === "favorites" && "Favorite Pharmacies"}
                {activeSection === "security" && "Security Settings"}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {activeSection === "profile" &&
                  "Manage your personal information and preferences"}
                {activeSection === "orders" &&
                  "View and track your medication orders"}
                {activeSection === "addresses" &&
                  "Manage your delivery addresses"}
                {activeSection === "favorites" &&
                  "Quick access to your preferred pharmacies"}
                {activeSection === "security" &&
                  "Manage your password and security preferences"}
              </Typography>
            </Box>

            {activeSection === "profile" && renderProfileSection()}
            {activeSection === "orders" && renderOrdersSection()}
            {activeSection === "addresses" && renderAddressesSection()}
            {activeSection === "favorites" && renderFavoritesSection()}
            {activeSection === "security" && renderSecuritySection()}
          </Grid>
        </Grid>
      </Container>

      <Footer />
    </Box>
  );
};

export default UserProfile;
