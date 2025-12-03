import { firebaseSignOut } from "../firebase/auth";
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
  ListItemButton,
  Chip,
  IconButton,
  Paper,
  Divider,
  InputAdornment,
} from "@mui/material";
import Person from "@mui/icons-material/Person";
import ShoppingBag from "@mui/icons-material/ShoppingBag";
import Room from "@mui/icons-material/Room";
import Favorite from "@mui/icons-material/Favorite";
import Security from "@mui/icons-material/Security";
import Logout from "@mui/icons-material/Logout";
import Edit from "@mui/icons-material/Edit";
import Delete from "@mui/icons-material/Delete";
import Home from "@mui/icons-material/Home";
import Work from "@mui/icons-material/Work";
import Add from "@mui/icons-material/Add";
import Replay from "@mui/icons-material/Replay";
import Star from "@mui/icons-material/Star";
import LocalPharmacy from "@mui/icons-material/LocalPharmacy";
import Header from "../components/Header";
import Footer from "../components/Footer";
import { userAPI, orderAPI, authAPI } from "../services/api";
import { auth } from "../firebase/firebase";
import Visibility from "@mui/icons-material/Visibility";
import VisibilityOff from "@mui/icons-material/VisibilityOff";

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
    avatarUrl: "",
  });
  const [avatarPreview, setAvatarPreview] = useState("");
  const [reorderStatus, setReorderStatus] = useState({});
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [saveStatus, setSaveStatus] = useState("idle");
  const [passwordStatus, setPasswordStatus] = useState("idle");
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    next: false,
    confirm: false,
  });

  const normalizeUser = (u) => {
    if (!u) return null;
    const id = u.id || u._id || u.userId;
    return { ...u, id };
  };

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      const userData = normalizeUser(JSON.parse(storedUser));
      setUser(userData);
      fetchUserProfile();
      fetchOrders(userData.id);
      fetchFavorites(userData.id);
    } else {
      navigate("/login");
    }
    const syncFavorites = () => {
      const current = localStorage.getItem("user");
      const parsed = current ? normalizeUser(JSON.parse(current)) : null;
      if (parsed?.id) {
        fetchFavorites(parsed.id);
      }
    };
    window.addEventListener("userUpdated", syncFavorites);
    return () => {
      window.removeEventListener("userUpdated", syncFavorites);
    };
  }, [navigate]);

  const fetchUserProfile = async () => {
    try {
      const response = await authAPI.getMe();
      const profile = normalizeUser(response.data.user);
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
          avatarUrl: profile.avatarUrl || "",
        });
        setAvatarPreview(profile.avatarUrl || "");
        setUser((prev) => normalizeUser({ ...prev, ...profile }));
        localStorage.setItem(
          "user",
          JSON.stringify({
            ...JSON.parse(localStorage.getItem("user") || "{}"),
            ...profile,
          })
        );
        window.dispatchEvent(new Event("userUpdated"));
      }
    } catch (error) {
      console.error("Error fetching profile:", error);
      if (error?.response?.status === 401) {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        navigate("/login");
      }
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
  // ---- FAVORITE PHARMACIES ----
  try {
    const pharmaciesRes = await userAPI.getFavoritePharmacies(userId);
    setFavoritePharmacies(pharmaciesRes.data.favoritePharmacies || []);
  } catch (error) {
    console.error("Error fetching favorite pharmacies:", error);
    setFavoritePharmacies([]);
  }

  // ---- FAVORITE ITEMS ----
  // This will work only after backend endpoints are added
  try {
    const itemsRes = await userAPI.getFavoriteItems(userId);
    setFavoriteItems(itemsRes.data.favoriteItems || []);
  } catch (error) {
    console.error("Error fetching favorite items:", error);
    setFavoriteItems([]);
  }
};


  const handleRemoveFavoritePharmacy = async (pharmacyId) => {
    const userId = user?.id || user?._id;
    if (!userId) return;
    try {
      await userAPI.removeFavoritePharmacy(userId, pharmacyId);
      setFavoritePharmacies(
        favoritePharmacies.filter((p) => (p._id || p) !== pharmacyId)
      );
    } catch (error) {
      console.error("Error removing favorite pharmacy:", error);
    }
  };

  const handleRemoveFavoriteItem = async (itemId) => {
    const userId = user?.id || user?._id;
    if (!userId) return;
    try {
      await userAPI.removeFavoriteItem(userId, itemId);
      setFavoriteItems(favoriteItems.filter((i) => (i._id || i) !== itemId));
    } catch (error) {
      console.error("Error removing favorite item:", error);
    }
  };

const handleProfileUpdate = async (e) => {
  e.preventDefault();

  const userId = user?.id || user?._id;
  if (!userId) {
    navigate("/login");
    return;
  }

  try {
    setSaveStatus("saving");
    // Always refresh Firebase token before saving
    if (auth.currentUser) {
      const fresh = await auth.currentUser.getIdToken(true);
      localStorage.setItem("token", fresh);
    }

    // Payload to send to backend
    const payload = {
      ...profileData,
      phone: profileData.phone || "",
      firstName: profileData.firstName || "",
      lastName: profileData.lastName || "",
    };

    // Update DB
    await userAPI.updateProfile(userId, payload);

    // 🔥 FIX: fetch the updated user fresh from backend
    const refreshed = await authAPI.getMe();
    const freshUser = refreshed.data.user;

    // Update state + avatar preview
    setUser(freshUser);
    setAvatarPreview(freshUser.avatarUrl || "");
    setProfileData({
      firstName: freshUser.firstName || "",
      lastName: freshUser.lastName || "",
      email: freshUser.email || "",
      phone: freshUser.phone || "",
      dateOfBirth: freshUser.dateOfBirth
        ? freshUser.dateOfBirth.split("T")[0]
        : "",
      gender: freshUser.gender || "",
      avatarUrl: freshUser.avatarUrl || "",
    });

    // Sync with localStorage
    localStorage.setItem("user", JSON.stringify(freshUser));
    window.dispatchEvent(new Event("userUpdated"));
    setSaveStatus("saved");
  } catch (error) {
    console.error("Error updating profile:", error);
    setSaveStatus("idle");
  }
};


const handleLogout = async () => {
  try {
    await firebaseSignOut();
  } catch (err) {
    console.error("Firebase logout error:", err);
  }

  localStorage.removeItem("token");
  localStorage.removeItem("user");

  navigate("/");
};


const handlePasswordUpdate = async (e) => {
  e.preventDefault();
  try {
    if (
      !passwordData.currentPassword ||
        !passwordData.newPassword ||
        !passwordData.confirmPassword
      ) {
        return;
      }

      if (passwordData.newPassword !== passwordData.confirmPassword) {
        return;
      }

    if (passwordData.newPassword.length < 8) {
      return;
    }

    setPasswordStatus("saving");
    await authAPI.changePassword(passwordData);
    setPasswordData({
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    });
    setPasswordStatus("saved");
  } catch (error) {
    console.error("Error updating password:", error);
    setPasswordStatus("idle");
  }
};

const handleDeleteAccount = async () => {
  const confirmDelete = window.confirm("Are you sure you want to delete?");
  if (!confirmDelete) return;
  try {
    await authAPI.deleteAccount();
    handleLogout();
  } catch (error) {
    console.error("Error deleting account:", error);
  }
};

const handleAvatarChange = (e) => {
  const file = e.target.files?.[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = (event) => {
    const result = event.target?.result;
    if (typeof result === "string") {
      setAvatarPreview(result);

      // 🔥 Most important part:
      // mark the profileData as changed immediately
      setProfileData((prev) => ({
        ...prev,
        avatarUrl: result,
      }));
    }
  };

  reader.readAsDataURL(file);
};


  const handleReorder = async (order) => {
    const userId = user?.id || user?._id;
    if (!userId) {
      navigate("/login");
      return;
    }
    setReorderStatus((prev) => ({ ...prev, [order._id]: "sending" }));
    try {
      const items = order.items?.map((item) => {
        const itemId = item.item?._id || item.item?.id || item.item;
        const quantity = Number(item.quantity);
        // Use the original priceAtOrder from the order, or default to 0 if not available
        const priceAtOrder = item.priceAtOrder || 0;
        const subtotal = priceAtOrder * quantity;
        
        return {
          item: itemId,
          quantity: quantity,
          priceAtOrder: priceAtOrder,
          subtotal: subtotal,
        };
      }) || [];
      
      // Calculate total amount
      const totalAmount = items.reduce((sum, item) => sum + item.subtotal, 0);
      
      const payload = {
        customer: userId,
        pharmacy: order.pharmacy?._id || order.pharmacy,
        items: items,
        totalAmount: totalAmount,
        customerNotes: order.customerNotes || "",
      };
      
      const res = await orderAPI.create(payload);
      // Refetch all orders to ensure we have complete data with all populated fields
      await fetchOrders(userId);
      setReorderStatus((prev) => ({ ...prev, [order._id]: "sent" }));
    } catch (error) {
      console.error("Error reordering:", error);
      setReorderStatus((prev) => ({ ...prev, [order._id]: undefined }));
    }
  };

  const renderProfileSection = () => (
  <Card sx={{ width: "100%" }}>
    <CardContent>
      <Box sx={{ display: "flex", alignItems: "center", mb: 3 }}>
        <Person sx={{ mr: 1, color: "primary.main" }} />
        <Typography variant="h5" fontWeight={700}>
          Personal Details
        </Typography>
      </Box>

      <form onSubmit={handleProfileUpdate}>
      <Grid container spacing={3}>

        {/* FIRST + LAST NAME */}
        <Grid item xs={12} md={6}>
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
        <Grid item xs={12} md={6}>
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

        <Divider flexItem sx={{ my: 2 }} />

        {/* PHONE + EMAIL */}
        <Grid item xs={12} md={6}>
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
        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            label="Email Address"
            type="email"
            value={profileData.email}
            InputProps={{ readOnly: true }}
            disabled
          />
        </Grid>

        <Divider flexItem sx={{ my: 2 }} />

        {/* DOB + GENDER */}
        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            label="Date of Birth"
            type="date"
            value={profileData.dateOfBirth}
            onChange={(e) =>
              setProfileData({ ...profileData, dateOfBirth: e.target.value })
            }
            InputLabelProps={{ shrink: true }}
          />
        </Grid>

        <Grid item xs={12} md={6}>
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

      {/* BUTTONS */}
      <Box sx={{ display: "flex", justifyContent: "flex-end", mt: 4 }}>
        <Button
          type="submit"
          variant="contained"
          sx={{
            px: 4,
            py: 1.2,
            borderRadius: 2,
            textTransform: "none",
            fontSize: "1rem",
            background:
              saveStatus === "saved"
                ? "linear-gradient(135deg, #4caf50, #388e3c)"
                : "linear-gradient(135deg, #4ecdc4, #44a9a3)",
          }}
        >
          {saveStatus === "saving"
            ? "Saving..."
            : saveStatus === "saved"
            ? "Saved"
            : "Save Changes"}
        </Button>
      </Box>
      </form>
    </CardContent>
  </Card>
);
  const getOrderStatusColor = (status) => {
    switch (status) {
      case "pending":
        return { bgcolor: "#fff3e0", color: "#f57c00" };
      case "confirmed":
        return { bgcolor: "#e3f2fd", color: "#1976d2" };
      case "ready":
        return { bgcolor: "#e8f5e9", color: "#388e3c" };
      case "completed":
        return { bgcolor: "#c8e6c9", color: "#2e7d32" };
      case "cancelled":
        return { bgcolor: "#ffcdd2", color: "#c62828" };
      default:
        return { bgcolor: "#e0e0e0", color: "#666" };
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const renderOrdersSection = () => (
    <Card sx={{ mb: 4 }}>
      <CardContent>
        <Typography variant="h4" fontWeight={700} color="secondary" mb={0.5}>
          My Orders
        </Typography>
        <Typography variant="body2" color="text.secondary" mb={3}>
          View and track your medication orders
        </Typography>

        {orders.length === 0 ? (
          <Box sx={{ textAlign: "center", py: 6 }}>
            <ShoppingBag sx={{ fontSize: 64, color: "#e0e0e0", mb: 2 }} />
            <Typography variant="h6" color="text.secondary" mb={1}>
              No orders yet
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Start shopping to see your orders here
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
                  borderRadius: 2,
                  transition: "all 0.3s",
                  "&:hover": {
                    borderColor: "primary.main",
                    boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
                  },
                }}
              >
                <Grid container spacing={2} alignItems="flex-start">
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
                    <Box
                      sx={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "flex-start",
                        mb: 1,
                      }}
                    >
                      <Box>
                        <Typography variant="h6" fontWeight={600} mb={0.5}>
                          Order #{order.orderNumber || "N/A"}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {order.items?.length > 0
                            ? order.items
                                .map(
                                  (item) =>
                                    `${item.item?.name || "Unknown"} (x${Number(item.quantity)})`
                                )
                                .join(", ")
                            : "No items"}
                        </Typography>
                        <Typography
                          variant="body2"
                          color="text.secondary"
                          sx={{ mt: 0.5 }}
                        >
                          Total:{" "}
                          {order.items?.reduce(
                            (sum, item) => sum + Number(item.quantity),
                            0
                          )}{" "}
                          unit(s)
                          {order.items?.length > 1 &&
                            ` (${order.items.length} items)`}
                        </Typography>
                      </Box>
                      <Chip
                        label={
                          order.status?.charAt(0).toUpperCase() +
                            order.status?.slice(1) || "Unknown"
                        }
                        size="small"
                        sx={{
                          ...getOrderStatusColor(order.status),
                          fontWeight: 600,
                        }}
                      />
                    </Box>
                    <Box
                      sx={{
                        display: "flex",
                        gap: 2,
                        flexWrap: "wrap",
                        mt: 1.5,
                      }}
                    >
                      <Typography variant="body2" color="text.secondary">
                        📅 {formatDate(order.createdAt)}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        🏪 {order.pharmacy?.name || "Pharmacy"}
                      </Typography>
                      {order.pharmacy?.address && (
                        <Typography variant="body2" color="text.secondary">
                          📍 {order.pharmacy.address.city}
                        </Typography>
                      )}
                    </Box>
                    {order.customerNotes && (
                      <Box
                        sx={{
                          mt: 1.5,
                          p: 1.5,
                          bgcolor: "#f8f9fa",
                          borderRadius: 1,
                        }}
                      >
                        <Typography
                          variant="caption"
                          fontWeight={600}
                          color="text.secondary"
                        >
                          Your Notes:
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {order.customerNotes}
                        </Typography>
                      </Box>
                    )}
                  </Grid>
                  <Grid item sx={{ textAlign: "right" }}>
                    <Typography
                      variant="h6"
                      fontWeight={700}
                      color="primary.main"
                      mb={1}
                    >
                      ${order.totalAmount?.toFixed(2) || "0.00"}
                    </Typography>
                    <Button
                      variant={reorderStatus[order._id] === "sent" ? "contained" : "outlined"}
                      size="small"
                      startIcon={<Replay />}
                      onClick={() => handleReorder(order)}
                      disabled={reorderStatus[order._id] === "sent" || reorderStatus[order._id] === "sending"}
                      sx={
                        reorderStatus[order._id] === "sent"
                          ? { bgcolor: "#4caf50", color: "white", "&:hover": { bgcolor: "#43a047" } }
                          : {}
                      }
                    >
                      {reorderStatus[order._id] === "sent" ? "Request sent" : "Reorder"}
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
    <Card sx={{ mb: 4 }}>
      <CardContent>
        <Typography variant="h4" fontWeight={700} color="secondary" mb={0.5}>
          Saved Addresses
        </Typography>
        <Typography variant="body2" color="text.secondary" mb={3}>
          Manage your delivery addresses
        </Typography>
        
        <Box
          sx={{
            display: "flex",
            justifyContent: "flex-end",
            mb: 3,
          }}
        >
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
                borderRadius: 2,
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
                borderRadius: 2,
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
    <>
      <Card sx={{ mb: 4 }}>
        <CardContent>
          <Typography variant="h4" fontWeight={700} color="secondary" mb={0.5}>
            Favorite Pharmacies
          </Typography>
          <Typography variant="body2" color="text.secondary" mb={3}>
            Quick access to your preferred pharmacies
          </Typography>

          {favoritePharmacies.length === 0 ? (
            <Box sx={{ textAlign: "center", py: 6 }}>
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
                      p: 2.5,
                      border: "2px solid #f0f0f0",
                      borderRadius: 2,
                      transition: "all 0.3s",
                      "&:hover": {
                        borderColor: "primary.main",
                        bgcolor: "#f8fdfd",
                        boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
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

      <Card sx={{ mb: 4 }}>
        <CardContent>
          <Typography variant="h4" fontWeight={700} color="secondary" mb={0.5}>
            Favorite Items
          </Typography>
          <Typography variant="body2" color="text.secondary" mb={3}>
            Quick access to your favorite medications
          </Typography>

          {favoriteItems.length === 0 ? (
            <Box sx={{ textAlign: "center", py: 6 }}>
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
            <Box
              sx={{
                display: "flex",
                flexWrap: "wrap",
                gap: 2.5,
                mb: 6,
                "& > *": {
                  flex: "0 0 calc(20% - 20px)",
                  maxWidth: "calc(20% - 20px)",
                  minWidth: "150px",
                },
              }}
            >
              {favoriteItems.map((item) => (
                <Card
                  key={item._id || item}
                  sx={{
                    height: 280,
                    cursor: "pointer",
                    border: "2px solid transparent",
                    transition: "0.3s",
                    display: "flex",
                    flexDirection: "column",
                    position: "relative",
                    "&:hover": {
                      transform: "translateY(-5px)",
                      boxShadow: "0 8px 24px rgba(0,0,0,0.12)",
                      borderColor: "primary.main",
                    },
                  }}
                  onClick={() => navigate(`/medications/${item._id || item}`)}
                >
                  <IconButton
                    size="small"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRemoveFavoriteItem(item._id || item);
                    }}
                    sx={{
                      position: "absolute",
                      top: 8,
                      right: 8,
                      zIndex: 1,
                      bgcolor: "rgba(255, 255, 255, 0.9)",
                      color: "error.main",
                      "&:hover": {
                        bgcolor: "error.main",
                        color: "white",
                      },
                    }}
                  >
                    <Delete fontSize="small" />
                  </IconButton>
                  <Box
                    sx={{
                      height: 150,
                      background:
                        "linear-gradient(135deg, #e0f7fa 0%, #b2ebf2 100%)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <LocalPharmacy
                      sx={{ fontSize: 64, color: "primary.main" }}
                    />
                  </Box>

                  <CardContent sx={{ display: "flex", flexDirection: "column" }}>
                    <Typography
                      variant="h6"
                      fontWeight={600}
                      color="secondary"
                      mb={1}
                    >
                      {item.name}
                    </Typography>

                    <Typography
                      variant="body2"
                      color="text.secondary"
                      display="flex"
                      gap={0.5}
                    >
                      <LocalPharmacy
                        fontSize="small"
                        sx={{ color: "primary.main" }}
                      />
                      {item.category || "General"}
                    </Typography>
                  </CardContent>
                </Card>
              ))}
            </Box>
          )}
        </CardContent>
      </Card>
    </>
  );

  const renderSecuritySection = () => (
    <Card sx={{ mb: 4 }}>
      <CardContent>
        <Typography variant="h4" fontWeight={700} color="secondary" mb={0.5}>
          Security Settings
        </Typography>
        <Typography variant="body2" color="text.secondary" mb={3}>
          Manage your password and security preferences
        </Typography>

        <form onSubmit={handlePasswordUpdate}>
          <Grid container spacing={2}>
            {/* Three equal-width fields */}
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="Current Password"
                type={showPasswords.current ? "text" : "password"}
                placeholder="Enter current password"
                value={passwordData.currentPassword}
                onChange={(e) =>
                  setPasswordData({
                    ...passwordData,
                    currentPassword: e.target.value,
                  })
                }
                required
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        onClick={() =>
                          setShowPasswords((prev) => ({
                            ...prev,
                            current: !prev.current,
                          }))
                        }
                        edge="end"
                      >
                        {showPasswords.current ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="New Password"
                type={showPasswords.next ? "text" : "password"}
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
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        onClick={() =>
                          setShowPasswords((prev) => ({
                            ...prev,
                            next: !prev.next,
                          }))
                        }
                        edge="end"
                      >
                        {showPasswords.next ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="Confirm New Password"
                type={showPasswords.confirm ? "text" : "password"}
                placeholder="Confirm new password"
                value={passwordData.confirmPassword}
                onChange={(e) =>
                  setPasswordData({
                    ...passwordData,
                    confirmPassword: e.target.value,
                  })
                }
                required
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        onClick={() =>
                          setShowPasswords((prev) => ({
                            ...prev,
                            confirm: !prev.confirm,
                          }))
                        }
                        edge="end"
                      >
                        {showPasswords.confirm ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
          </Grid>

          <Button
            type="submit"
            variant="contained"
            sx={{
              mt: 2,
              background:
                passwordStatus === "saved"
                  ? "linear-gradient(135deg, #4caf50 0%, #388e3c 100%)"
                  : "linear-gradient(135deg, #4ecdc4 0%, #44a9a3 100%)",
            }}
          >
            {passwordStatus === "saving"
              ? "Updating..."
              : passwordStatus === "saved"
              ? "Password updated"
              : "Update Password"}
          </Button>
        </form>

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

      <Container component="section" maxWidth="xl" sx={{ py: 5, display: "flex", flexDirection: "column", minHeight: "calc(100vh - 200px)" }}>
        <Grid container spacing={4} sx={{ flex: 1 }}>
          <Grid item xs={12} md={2.5}>
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
                    src={avatarPreview || undefined}
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
                    onClick={() => setActiveSection("profile")}
                    sx={{
                      borderRadius: 2,
                      mb: 1,
                      cursor: "pointer",
                      transition: "all 0.3s ease",
                      bgcolor: activeSection === "profile" ? "#4ecdc4" : "transparent",
                      color: activeSection === "profile" ? "white" : "inherit",
                      "& .MuiListItemIcon-root": {
                        color: activeSection === "profile" ? "white" : "inherit",
                      },
                      "& .MuiListItemText-primary": {
                        color: activeSection === "profile" ? "white" : "inherit",
                      },
                      "&:hover": {
                        bgcolor: activeSection === "profile" ? "#44a9a3" : "rgba(78, 205, 196, 0.1)",
                        transform: "translateX(4px)",
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
                    onClick={() => setActiveSection("orders")}
                    sx={{
                      borderRadius: 2,
                      mb: 1,
                      cursor: "pointer",
                      transition: "all 0.3s ease",
                      bgcolor: activeSection === "orders" ? "#4ecdc4" : "transparent",
                      color: activeSection === "orders" ? "white" : "inherit",
                      "& .MuiListItemIcon-root": {
                        color: activeSection === "orders" ? "white" : "inherit",
                      },
                      "& .MuiListItemText-primary": {
                        color: activeSection === "orders" ? "white" : "inherit",
                      },
                      "&:hover": {
                        bgcolor: activeSection === "orders" ? "#44a9a3" : "rgba(78, 205, 196, 0.1)",
                        transform: "translateX(4px)",
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
                    onClick={() => setActiveSection("favorites")}
                    sx={{
                      borderRadius: 2,
                      mb: 1,
                      cursor: "pointer",
                      transition: "all 0.3s ease",
                      bgcolor: activeSection === "favorites" ? "#4ecdc4" : "transparent",
                      color: activeSection === "favorites" ? "white" : "inherit",
                      "& .MuiListItemIcon-root": {
                        color: activeSection === "favorites" ? "white" : "inherit",
                      },
                      "& .MuiListItemText-primary": {
                        color: activeSection === "favorites" ? "white" : "inherit",
                      },
                      "&:hover": {
                        bgcolor: activeSection === "favorites" ? "#44a9a3" : "rgba(78, 205, 196, 0.1)",
                        transform: "translateX(4px)",
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
                    onClick={() => setActiveSection("security")}
                    sx={{
                      borderRadius: 2,
                      mb: 1,
                      cursor: "pointer",
                      transition: "all 0.3s ease",
                      bgcolor: activeSection === "security" ? "#4ecdc4" : "transparent",
                      color: activeSection === "security" ? "white" : "inherit",
                      "& .MuiListItemIcon-root": {
                        color: activeSection === "security" ? "white" : "inherit",
                      },
                      "& .MuiListItemText-primary": {
                        color: activeSection === "security" ? "white" : "inherit",
                      },
                      "&:hover": {
                        bgcolor: activeSection === "security" ? "#44a9a3" : "rgba(78, 205, 196, 0.1)",
                        transform: "translateX(4px)",
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
                      cursor: "pointer",
                      transition: "all 0.3s ease",
                      "&:hover": {
                        bgcolor: "rgba(244, 67, 54, 0.1)",
                        transform: "translateX(4px)",
                      },
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

          <Grid item xs={12} md={9.5} sx={{ display: "flex", flexDirection: "column" }}>
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
