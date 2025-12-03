import React, { useState, useEffect, useRef } from "react";
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
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Chip,
  InputAdornment,
  Paper,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Alert,
  Switch,
  FormControlLabel,
  CircularProgress,
} from "@mui/material";
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import Dashboard from "@mui/icons-material/Dashboard";
import Inventory from "@mui/icons-material/Inventory";
import ShoppingCart from "@mui/icons-material/ShoppingCart";
import TrendingUp from "@mui/icons-material/TrendingUp";
import Settings from "@mui/icons-material/Settings";
import Logout from "@mui/icons-material/Logout";
import Add from "@mui/icons-material/Add";
import Edit from "@mui/icons-material/Edit";
import Delete from "@mui/icons-material/Delete";
import SearchIcon from "@mui/icons-material/Search";
import Warning from "@mui/icons-material/Warning";
import Cancel from "@mui/icons-material/Cancel";
import Notifications from "@mui/icons-material/Notifications";
import Room from "@mui/icons-material/Room";
import Directions from "@mui/icons-material/Directions";
import Header from "../components/Header";
import Footer from "../components/Footer";
import {
  medicationAPI,
  pharmacyAPI,
  inventoryAPI,
  orderAPI,
} from "../services/api";

// Fix Leaflet default icon issue
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
});

// Component to handle map clicks
function MapClickHandler({ onMapClick }) {
  useMapEvents({
    click: (e) => {
      onMapClick(e.latlng);
    },
  });
  return null;
}

// Component to update map center when coordinates change
function MapCenterUpdater({ center }) {
  const map = useMap();
  const prevCenterRef = useRef(center);
  
  useEffect(() => {
    if (prevCenterRef.current[0] !== center[0] || prevCenterRef.current[1] !== center[1]) {
      map.setView(center, map.getZoom());
      prevCenterRef.current = center;
    }
  }, [center, map]);
  
  return null;
}

const PharmacyDashboard = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [pharmacy, setPharmacy] = useState(null);
  const [inventoryItems, setInventoryItems] = useState([]);
  const [allItems, setAllItems] = useState([]);
  const [orders, setOrders] = useState([]);
  const [filteredInventory, setFilteredInventory] = useState([]);
  const [filteredOrders, setFilteredOrders] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [orderSearchQuery, setOrderSearchQuery] = useState("");
  const [orderStatusFilter, setOrderStatusFilter] = useState("all");
  const [activeSection, setActiveSection] = useState("dashboard");
  const [openDialog, setOpenDialog] = useState(false);
  const [openOrderDialog, setOpenOrderDialog] = useState(false);
  const [openStatusConfirmDialog, setOpenStatusConfirmDialog] = useState(false);
  const [pendingStatusChange, setPendingStatusChange] = useState(null);
  const [displayedOrderStatus, setDisplayedOrderStatus] = useState(null);
  const [selectedInventory, setSelectedInventory] = useState(null);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [formData, setFormData] = useState({
    itemId: "",
    quantity: "",
    price: "",
    lowStockThreshold: 10,
    isAvailable: true,
  });
  const [pharmacyForm, setPharmacyForm] = useState({
    name: "",
    city: "",
    street: "",
    workingHours: [],
  });
  const [pharmacySaveStatus, setPharmacySaveStatus] = useState("idle");
  const [pharmacySaveError, setPharmacySaveError] = useState("");
  const [alwaysOpen, setAlwaysOpen] = useState(false);
  const [hours, setHours] = useState({});
  const [coordinates, setCoordinates] = useState({ lat: 0, lng: 0 });

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      const userData = JSON.parse(storedUser);
      if (userData.userType !== "pharmacist") {
        navigate("/");
        return;
      }
      setUser(userData);
      fetchPharmacyData(userData.id);
    } else {
      navigate("/login");
    }
  }, [navigate]);

  useEffect(() => {
    const filtered = inventoryItems.filter((inv) => {
      const itemName = inv.item?.name || "";
      return itemName.toLowerCase().includes(searchQuery.toLowerCase());
    });
    setFilteredInventory(filtered);
  }, [searchQuery, inventoryItems]);

  const defaultWorkingHours = [
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
    "Sunday",
  ].map((day) => ({
    day,
    openTime: "",
    closeTime: "",
    isClosed: day === "Sunday",
  }));

  useEffect(() => {
    if (pharmacy) {
      setPharmacyForm({
        name: pharmacy.name || "",
        city: pharmacy.address?.city || "",
        street: pharmacy.address?.street || "",
        workingHours:
          pharmacy.workingHours && pharmacy.workingHours.length > 0
            ? pharmacy.workingHours
            : defaultWorkingHours,
      });

      // Convert workingHours to hours format
      const workingHours = pharmacy.workingHours && pharmacy.workingHours.length > 0
        ? pharmacy.workingHours
        : defaultWorkingHours;
      
      const hoursObj = {};
      const days = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"];
      
      days.forEach((day) => {
        const wh = workingHours.find((h) => h.day?.toLowerCase() === day);
        const openTime = wh?.openTime || "09:00";
        const closeTime = wh?.closeTime || "18:00";
        const isOpen = wh ? !wh.isClosed : day !== "sunday";
        // Check if times are 00:00 to 23:59 to set allDay automatically
        const isAllDay = isOpen && openTime === "00:00" && closeTime === "23:59";
        
        hoursObj[day] = {
          open: isOpen,
          openTime,
          closeTime,
          allDay: isAllDay,
          // Store previous hours for restoring when All Day is toggled off
          previousOpenTime: isAllDay ? "09:00" : openTime,
          previousCloseTime: isAllDay ? "18:00" : closeTime,
        };
      });
      
      setHours(hoursObj);
      setAlwaysOpen(pharmacy.is24Hours || false);
      
      // Set coordinates from pharmacy address
      if (pharmacy.address?.coordinates?.coordinates) {
        const [lng, lat] = pharmacy.address.coordinates.coordinates;
        setCoordinates({ lat, lng });
      } else {
        // Default to Beirut coordinates if not set
        setCoordinates({ lat: 33.8938, lng: 35.5018 });
      }
    }
  }, [pharmacy]);

  useEffect(() => {
    let filtered = orders;

    // Filter by search query (order number, customer name)
    if (orderSearchQuery) {
      filtered = filtered.filter((order) => {
        const orderNumber = order.orderNumber?.toLowerCase() || "";
        const customerName = `${order.customer?.firstName || ""} ${
          order.customer?.lastName || ""
        }`.toLowerCase();
        return (
          orderNumber.includes(orderSearchQuery.toLowerCase()) ||
          customerName.includes(orderSearchQuery.toLowerCase())
        );
      });
    }

    // Filter by status
    if (orderStatusFilter !== "all") {
      filtered = filtered.filter((order) => order.status === orderStatusFilter);
    }

    setFilteredOrders(filtered);
  }, [orderSearchQuery, orderStatusFilter, orders]);

  const fetchPharmacyData = async (userId) => {
    try {
      // Try to find pharmacy by owner ID
      // First, try getting all pharmacies and filtering (fallback)
      const pharmaciesResponse = await pharmacyAPI.getAll({});
      const userPharmacy = pharmaciesResponse.data.pharmacies.find((p) => {
        const ownerId = p.owner?._id || p.owner;
        return ownerId === userId || ownerId?.toString() === userId?.toString();
      });

      if (userPharmacy) {
        setPharmacy(userPharmacy);
        await Promise.all([
          fetchInventory(userPharmacy._id),
          fetchAllItems(),
          fetchOrders(userPharmacy._id),
        ]);
      } else {
        console.error("Pharmacy not found for user");
        alert("Pharmacy not found. Please contact support.");
      }
    } catch (error) {
      console.error("Error fetching pharmacy data:", error);
      alert("Error loading pharmacy data. Please try again.");
    }
  };

  const fetchInventory = async (pharmacyId) => {
    try {
      if (!pharmacyId) {
        console.error("Pharmacy ID is required");
        return;
      }

      const response = await inventoryAPI.getAll({ pharmacyId });

      if (response.data.success) {
        // Ensure stockStatus is calculated correctly
        const inventoryWithStatus = response.data.inventory.map((inv) => {
          // Calculate stock status if not present
          let stockStatus = inv.stockStatus;
          if (!stockStatus) {
            if (inv.quantity === 0) {
              stockStatus = "out-of-stock";
            } else if (inv.quantity < (inv.lowStockThreshold || 10)) {
              stockStatus = "low-stock";
            } else {
              stockStatus = "in-stock";
            }
          }
          return {
            ...inv,
            stockStatus,
          };
        });
        setInventoryItems(inventoryWithStatus);
      }
    } catch (error) {
      console.error("Error fetching inventory:", error);
      // If error, set empty array to avoid breaking the UI
      setInventoryItems([]);
    }
  };

  const fetchAllItems = async () => {
    try {
      const response = await medicationAPI.getAll({});
      const items =
        response.data.results?.map((r) => r.item).filter(Boolean) || [];
      setAllItems(items);
    } catch (error) {
      console.error("Error fetching items:", error);
    }
  };

  const fetchOrders = async (pharmacyId) => {
    try {
      const response = await orderAPI.getAll({ pharmacyId });
      setOrders(response.data.orders || []);
    } catch (error) {
      console.error("Error fetching orders:", error);
      setOrders([]);
    }
  };

  const handleUpdateOrderStatus = async (orderId, newStatus) => {
    try {
      await orderAPI.update(orderId, { status: newStatus });
      // Update the selected order state
      setSelectedOrder((prev) => (prev ? { ...prev, status: newStatus } : null));
      setDisplayedOrderStatus(newStatus);
      // Refresh orders list in background
      if (pharmacy?._id) {
        fetchOrders(pharmacy._id);
      }
    } catch (error) {
      console.error("Error updating order status:", error);
      const errorMsg =
        error.response?.data?.message || "Failed to update order status";
      alert(errorMsg);
      // Revert displayed status on error
      setDisplayedOrderStatus(selectedOrder?.status || "pending");
    }
  };

  const handleOpenOrderDialog = (order) => {
    setSelectedOrder(order);
    setDisplayedOrderStatus(order.status || "pending");
    setOpenOrderDialog(true);
  };

  const handleCloseOrderDialog = () => {
    setOpenOrderDialog(false);
    setSelectedOrder(null);
    setDisplayedOrderStatus(null);
  };

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

  const handlePharmacyInputChange = (field, value) => {
    setPharmacyForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleWorkingHourChange = (index, field, value) => {
    setPharmacyForm((prev) => {
      const updated = [...prev.workingHours];
      updated[index] = { ...updated[index], [field]: value };
      return { ...prev, workingHours: updated };
    });
  };

  const updateDay = (day, updates) => {
    setHours((prev) => {
      const currentDay = prev[day] || { open: false, openTime: "09:00", closeTime: "18:00", allDay: false, previousOpenTime: "09:00", previousCloseTime: "18:00" };
      const updatedDay = { ...currentDay, ...updates };
      
      // When closing a day, reset allDay to false
      if (updatedDay.open === false && currentDay.open) {
        updatedDay.allDay = false;
      }
      
      // When enabling All Day, store current times as previous (if not already 00:00-23:59)
      if (updatedDay.allDay && !currentDay.allDay && updatedDay.open) {
        if (currentDay.openTime !== "00:00" || currentDay.closeTime !== "23:59") {
          updatedDay.previousOpenTime = currentDay.openTime;
          updatedDay.previousCloseTime = currentDay.closeTime;
        }
        updatedDay.openTime = "00:00";
        updatedDay.closeTime = "23:59";
      }
      
      // When disabling All Day, restore previous times
      if (!updatedDay.allDay && currentDay.allDay && updatedDay.open) {
        updatedDay.openTime = currentDay.previousOpenTime || "09:00";
        updatedDay.closeTime = currentDay.previousCloseTime || "18:00";
      }
      
      return {
        ...prev,
        [day]: updatedDay,
      };
    });
  };

  const handleSavePharmacy = async () => {
    if (!pharmacy?._id) return;
    setPharmacySaveStatus("saving");
    setPharmacySaveError("");
      try {
        // Convert hours format back to workingHours array format
        const days = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"];
        const workingHours = days.map((day) => {
          const dayHours = hours[day] || { open: false, openTime: "09:00", closeTime: "18:00", allDay: false };
          const dayName = day.charAt(0).toUpperCase() + day.slice(1);
          
          if (alwaysOpen || dayHours.allDay) {
            return {
              day: dayName,
              openTime: "00:00",
              closeTime: "23:59",
              isClosed: false,
            };
          }
          
          return {
            day: dayName,
            openTime: dayHours.open ? dayHours.openTime : "",
            closeTime: dayHours.open ? dayHours.closeTime : "",
            isClosed: !dayHours.open,
          };
        });

        const payload = {
          name: pharmacyForm.name,
          address: {
            ...pharmacy.address,
            city: pharmacyForm.city,
            street: pharmacyForm.street || pharmacy.address?.street || "",
            coordinates: {
              type: "Point",
              coordinates: [coordinates.lng, coordinates.lat], // GeoJSON format: [longitude, latitude]
            },
          },
          workingHours,
          is24Hours: alwaysOpen,
        };
      await pharmacyAPI.update(pharmacy._id, payload);
      const refreshed = await pharmacyAPI.getById(pharmacy._id);
      setPharmacy(refreshed.data.pharmacy || pharmacy);
      setPharmacySaveStatus("saved");
      setTimeout(() => setPharmacySaveStatus("idle"), 2000);
    } catch (error) {
      setPharmacySaveError(error?.response?.data?.message || "Failed to save pharmacy info");
      setPharmacySaveStatus("idle");
    }
  };

  const handleOpenDialog = (inventoryItem = null) => {
    if (inventoryItem) {
      setSelectedInventory(inventoryItem);
      setFormData({
        itemId: inventoryItem.item?._id || inventoryItem.item || "",
        quantity: inventoryItem.quantity || "",
        price: inventoryItem.price || "",
        lowStockThreshold: inventoryItem.lowStockThreshold || 10,
        isAvailable: inventoryItem.isAvailable !== false,
      });
    } else {
      setSelectedInventory(null);
      setFormData({
        itemId: "",
        quantity: "",
        price: "",
        lowStockThreshold: 10,
        isAvailable: true,
      });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setSelectedInventory(null);
  };

  const handleSubmit = async () => {
    if (!pharmacy?._id) {
      alert("Pharmacy not found");
      return;
    }

    if (!formData.itemId || !formData.price || formData.quantity === "") {
      alert("Please fill in all required fields");
      return;
    }

    try {
      if (selectedInventory) {
        // Update inventory
        await inventoryAPI.update(selectedInventory._id, {
          quantity: parseInt(formData.quantity),
          price: parseFloat(formData.price),
          lowStockThreshold: parseInt(formData.lowStockThreshold),
          isAvailable: formData.isAvailable,
        });
        alert("Inventory updated successfully!");
      } else {
        // Create new inventory entry
        await inventoryAPI.add({
          pharmacy: pharmacy._id,
          item: formData.itemId,
          quantity: parseInt(formData.quantity),
          price: parseFloat(formData.price),
          lowStockThreshold: parseInt(formData.lowStockThreshold),
          isAvailable: formData.isAvailable,
        });
        alert("Inventory item added successfully!");
      }
      handleCloseDialog();
      // Refresh inventory after adding/updating
      if (pharmacy?._id) {
        await fetchInventory(pharmacy._id);
      }
    } catch (error) {
      console.error("Error saving inventory:", error);
      const errorMsg =
        error.response?.data?.message || "Failed to save inventory";
      alert(errorMsg);
    }
  };

  const handleDelete = async (inventoryId) => {
    if (
      window.confirm("Are you sure you want to delete this inventory item?")
    ) {
      try {
        await inventoryAPI.delete(inventoryId);
        alert("Inventory item deleted successfully!");
        // Refresh inventory after deleting
        if (pharmacy?._id) {
          await fetchInventory(pharmacy._id);
        }
      } catch (error) {
        console.error("Error deleting inventory:", error);
        alert("Failed to delete inventory item");
      }
    }
  };

  const getStockStatusColor = (status) => {
    switch (status) {
      case "in-stock":
        return { bgcolor: "#c8e6c9", color: "#2e7d32" };
      case "low-stock":
        return { bgcolor: "#fff9c4", color: "#f57f17" };
      case "out-of-stock":
        return { bgcolor: "#ffcdd2", color: "#c62828" };
      default:
        return { bgcolor: "#e0e0e0", color: "#666" };
    }
  };

  const stats = {
    totalProducts: inventoryItems.length,
    ordersThisMonth: orders.filter((o) => {
      const orderDate = new Date(o.createdAt);
      const now = new Date();
      return (
        orderDate.getMonth() === now.getMonth() &&
        orderDate.getFullYear() === now.getFullYear()
      );
    }).length,
    lowStockItems: inventoryItems.filter(
      (inv) => inv.stockStatus === "low-stock"
    ).length,
    outOfStock: inventoryItems.filter(
      (inv) => inv.stockStatus === "out-of-stock"
    ).length,
  };

  if (!user || !pharmacy) {
    return (
      <Box sx={{ bgcolor: "background.default", minHeight: "100vh" }}>
        <Header user={user} />
        <Container maxWidth="xl" sx={{ py: 5 }}>
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              minHeight: "60vh",
            }}
          >
            <CircularProgress size={60} sx={{ color: "#4ecdc4" }} />
          </Box>
        </Container>
        <Footer />
      </Box>
    );
  }

  return (
    <Box
      component="main"
      sx={{ bgcolor: "background.default", minHeight: "100vh" }}
    >
      <Header user={user} />

      <Container component="section" maxWidth="xl" sx={{ py: 5 }}>
        <Box
          sx={{
            display: "flex",
            flexDirection: { xs: "column", md: "row" },
            gap: 4,
            alignItems: "flex-start",
          }}
        >
          {/* Sidebar Panel */}
          <Box
            sx={{
              width: { xs: "100%", md: "280px" },
              flexShrink: 0,
              position: { md: "sticky" },
              top: { md: 90 },
            }}
          >
            <Card>
              <CardContent>
                <List>
                  <ListItem
                    button
                    onClick={() => setActiveSection("dashboard")}
                    sx={{
                      borderRadius: 2,
                      mb: 1,
                      cursor: "pointer",
                      transition: "all 0.3s ease",
                      bgcolor: activeSection === "dashboard" ? "#4ecdc4" : "transparent",
                      color: activeSection === "dashboard" ? "white" : "inherit",
                      "& .MuiListItemIcon-root": {
                        color: activeSection === "dashboard" ? "white" : "inherit",
                      },
                      "& .MuiListItemText-primary": {
                        color: activeSection === "dashboard" ? "white" : "inherit",
                      },
                      "&:hover": {
                        bgcolor: activeSection === "dashboard" ? "#44a9a3" : "rgba(78, 205, 196, 0.1)",
                        transform: "translateX(4px)",
                      },
                    }}
                  >
                    <ListItemIcon>
                      <Dashboard />
                    </ListItemIcon>
                    <ListItemText primary="Dashboard" />
                  </ListItem>
                  <ListItem
                    button
                    onClick={() => setActiveSection("inventory")}
                    sx={{
                      borderRadius: 2,
                      mb: 1,
                      cursor: "pointer",
                      transition: "all 0.3s ease",
                      bgcolor: activeSection === "inventory" ? "#4ecdc4" : "transparent",
                      color: activeSection === "inventory" ? "white" : "inherit",
                      "& .MuiListItemIcon-root": {
                        color: activeSection === "inventory" ? "white" : "inherit",
                      },
                      "& .MuiListItemText-primary": {
                        color: activeSection === "inventory" ? "white" : "inherit",
                      },
                      "&:hover": {
                        bgcolor: activeSection === "inventory" ? "#44a9a3" : "rgba(78, 205, 196, 0.1)",
                        transform: "translateX(4px)",
                      },
                    }}
                  >
                    <ListItemIcon>
                      <Inventory />
                    </ListItemIcon>
                    <ListItemText primary="Inventory" />
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
                      <ShoppingCart />
                    </ListItemIcon>
                    <ListItemText primary="Orders" />
                  </ListItem>
                  
                  <ListItem
                    button
                    onClick={() => setActiveSection("pharmacySettings")}
                    sx={{
                      borderRadius: 2,
                      mb: 1,
                      cursor: "pointer",
                      transition: "all 0.3s ease",
                      bgcolor: activeSection === "pharmacySettings" ? "#4ecdc4" : "transparent",
                      color: activeSection === "pharmacySettings" ? "white" : "inherit",
                      "& .MuiListItemIcon-root": {
                        color: activeSection === "pharmacySettings" ? "white" : "inherit",
                      },
                      "& .MuiListItemText-primary": {
                        color: activeSection === "pharmacySettings" ? "white" : "inherit",
                      },
                      "&:hover": {
                        bgcolor: activeSection === "pharmacySettings" ? "#44a9a3" : "rgba(78, 205, 196, 0.1)",
                        transform: "translateX(4px)",
                      },
                    }}
                  >
                    <ListItemIcon>
                      <Settings />
                    </ListItemIcon>
                    <ListItemText primary="Pharmacy Info" />
                  </ListItem>
                  <ListItem
                    button
                    onClick={() => {
                      localStorage.removeItem("token");
                      localStorage.removeItem("user");
                      navigate("/");
                    }}
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
          </Box>

          {/* Main Content */}
          <Box
            sx={{
              flex: 1,
              minWidth: 0,
              display: "flex",
              flexDirection: "column",
            }}
          >
            {activeSection === "dashboard" && (
              <Card sx={{ mb: 4 }}>
                <CardContent>
                  <Typography variant="h4" fontWeight={700} color="secondary" mb={0.5}>
                    Dashboard Overview
                  </Typography>
                  <Typography variant="body2" color="text.secondary" mb={3}>
                    Welcome back! Here's what's happening with your pharmacy
                    today.
                  </Typography>

                  <Box
                    sx={{
                      display: "grid",
                      gridTemplateColumns: {
                        xs: "1fr",
                        sm: "repeat(2, 1fr)",
                        md: "repeat(4, 1fr)",
                      },
                      gap: 3,
                    }}
                  >
                    <Box>
                      <Card
                        sx={{
                          height: "100%",
                          minHeight: 180,
                          display: "flex",
                          flexDirection: "column",
                          transition: "all 0.3s",
                          "&:hover": {
                            transform: "translateY(-5px)",
                            boxShadow: "0 6px 24px rgba(0,0,0,0.12)",
                          },
                        }}
                      >
                        <CardContent
                          sx={{
                            display: "flex",
                            flexDirection: "column",
                            height: "100%",
                            flex: 1,
                          }}
                        >
                          <Box
                            sx={{
                              width: 50,
                              height: 50,
                              borderRadius: 3,
                              background:
                                "linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%)",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              color: "#1976d2",
                              mb: 2,
                              flexShrink: 0,
                            }}
                          >
                            <Inventory sx={{ fontSize: 28 }} />
                          </Box>
                          <Typography
                            variant="h4"
                            fontWeight={700}
                            color="secondary"
                            mb={1}
                          >
                            {stats.totalProducts}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            Total Products
                          </Typography>
                        </CardContent>
                      </Card>
                    </Box>

                    <Box>
                      <Card
                        sx={{
                          height: "100%",
                          minHeight: 180,
                          display: "flex",
                          flexDirection: "column",
                          transition: "all 0.3s",
                          "&:hover": {
                            transform: "translateY(-5px)",
                            boxShadow: "0 6px 24px rgba(0,0,0,0.12)",
                          },
                        }}
                      >
                        <CardContent
                          sx={{
                            display: "flex",
                            flexDirection: "column",
                            height: "100%",
                            flex: 1,
                          }}
                        >
                          <Box
                            sx={{
                              width: 50,
                              height: 50,
                              borderRadius: 3,
                              background:
                                "linear-gradient(135deg, #e8f5e9 0%, #c8e6c9 100%)",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              color: "#388e3c",
                              mb: 2,
                              flexShrink: 0,
                            }}
                          >
                            <ShoppingCart sx={{ fontSize: 28 }} />
                          </Box>
                          <Typography
                            variant="h4"
                            fontWeight={700}
                            color="secondary"
                            mb={1}
                          >
                            {stats.ordersThisMonth}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            Orders This Month
                          </Typography>
                        </CardContent>
                      </Card>
                    </Box>

                    <Box>
                      <Card
                        sx={{
                          height: "100%",
                          minHeight: 180,
                          display: "flex",
                          flexDirection: "column",
                          transition: "all 0.3s",
                          "&:hover": {
                            transform: "translateY(-5px)",
                            boxShadow: "0 6px 24px rgba(0,0,0,0.12)",
                          },
                        }}
                      >
                        <CardContent
                          sx={{
                            display: "flex",
                            flexDirection: "column",
                            height: "100%",
                            flex: 1,
                          }}
                        >
                          <Box
                            sx={{
                              width: 50,
                              height: 50,
                              borderRadius: 3,
                              background:
                                "linear-gradient(135deg, #fff3e0 0%, #ffe0b2 100%)",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              color: "#f57c00",
                              mb: 2,
                              flexShrink: 0,
                            }}
                          >
                            <Warning sx={{ fontSize: 28 }} />
                          </Box>
                          <Typography
                            variant="h4"
                            fontWeight={700}
                            color="secondary"
                            mb={1}
                          >
                            {stats.lowStockItems}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            Low Stock Items
                          </Typography>
                        </CardContent>
                      </Card>
                    </Box>

                    <Box>
                      <Card
                        sx={{
                          height: "100%",
                          minHeight: 180,
                          display: "flex",
                          flexDirection: "column",
                          transition: "all 0.3s",
                          "&:hover": {
                            transform: "translateY(-5px)",
                            boxShadow: "0 6px 24px rgba(0,0,0,0.12)",
                          },
                        }}
                      >
                        <CardContent
                          sx={{
                            display: "flex",
                            flexDirection: "column",
                            height: "100%",
                            flex: 1,
                          }}
                        >
                          <Box
                            sx={{
                              width: 50,
                              height: 50,
                              borderRadius: 3,
                              background:
                                "linear-gradient(135deg, #ffebee 0%, #ffcdd2 100%)",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              color: "#d32f2f",
                              mb: 2,
                              flexShrink: 0,
                            }}
                          >
                            <Cancel sx={{ fontSize: 28 }} />
                          </Box>
                          <Typography
                            variant="h4"
                            fontWeight={700}
                            color="secondary"
                            mb={1}
                          >
                            {stats.outOfStock}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            Out of Stock
                          </Typography>
                        </CardContent>
                      </Card>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            )}

            {activeSection === "inventory" && (
              <Card sx={{ mb: 4 }}>
                <CardContent>
                  <Typography variant="h4" fontWeight={700} color="secondary" mb={0.5}>
                    Inventory Management
                  </Typography>
                  <Typography variant="body2" color="text.secondary" mb={3}>
                    Manage your pharmacy inventory items.
                  </Typography>
                    <Box
                      sx={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        mb: 3,
                      }}
                    >
                      <Typography variant="h5" fontWeight={700}>
                        Inventory Items
                      </Typography>
                      <Button
                        variant="contained"
                        startIcon={<Add />}
                        onClick={() => handleOpenDialog()}
                        sx={{
                          px: 4,
                          py: 1.2,
                          borderRadius: 2,
                          textTransform: "none",
                          fontSize: "1rem",
                          color: "#ffffff",
                          backgroundColor: "#4ecdc4",
                          "&:hover": {
                            backgroundColor: "#3bb5ac",
                          },
                        }}
                      >
                        Add Inventory Item
                      </Button>
                    </Box>

                    <TextField
                      fullWidth
                      placeholder="Search inventory..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      sx={{ mb: 3 }}
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <SearchIcon sx={{ color: "primary.main" }} />
                          </InputAdornment>
                        ),
                      }}
                    />

                    {filteredInventory.length === 0 ? (
                      <Alert severity="info">
                        No inventory items found. Add your first item!
                      </Alert>
                    ) : (
                      <TableContainer>
                        <Table>
                          <TableHead>
                            <TableRow sx={{ bgcolor: "#f8f9fa" }}>
                              <TableCell>
                                <strong>Item Name</strong>
                              </TableCell>
                              <TableCell>
                                <strong>Category</strong>
                              </TableCell>
                              <TableCell>
                                <strong>Price</strong>
                              </TableCell>
                              <TableCell>
                                <strong>Quantity</strong>
                              </TableCell>
                              <TableCell>
                                <strong>Status</strong>
                              </TableCell>
                              <TableCell align="center">
                                <strong>Actions</strong>
                              </TableCell>
                            </TableRow>
                          </TableHead>
                          <TableBody>
                            {filteredInventory.map((inv) => (
                              <TableRow
                                key={inv._id}
                                sx={{ "&:hover": { bgcolor: "#f8f9fa" } }}
                              >
                                <TableCell>
                                  <strong>{inv.item?.name || "Unknown"}</strong>
                                </TableCell>
                                <TableCell>
                                  {inv.item?.category || "N/A"}
                                </TableCell>
                                <TableCell>
                                  ${inv.price?.toFixed(2) || "0.00"}
                                </TableCell>
                                <TableCell>{Number(inv.quantity ?? 0)} units</TableCell>
                                <TableCell>
                                  <Chip
                                    label={
                                      inv.stockStatus === "in-stock"
                                        ? "In Stock"
                                        : inv.stockStatus === "low-stock"
                                        ? "Low Stock"
                                        : "Out of Stock"
                                    }
                                    size="small"
                                    sx={{
                                      ...getStockStatusColor(inv.stockStatus),
                                      fontWeight: 600,
                                    }}
                                  />
                                </TableCell>
                                <TableCell align="center">
                                  <IconButton
                                    size="small"
                                    onClick={() => handleOpenDialog(inv)}
                                    sx={{
                                      bgcolor: "#e3f2fd",
                                      color: "#1976d2",
                                      mr: 1,
                                    }}
                                  >
                                    <Edit fontSize="small" />
                                  </IconButton>
                                  <IconButton
                                    size="small"
                                    onClick={() => handleDelete(inv._id)}
                                    sx={{
                                      bgcolor: "#ffebee",
                                      color: "#d32f2f",
                                    }}
                                  >
                                    <Delete fontSize="small" />
                                  </IconButton>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </TableContainer>
                    )}
                </CardContent>
              </Card>
            )}

            {activeSection === "orders" && (
              <Card sx={{ mb: 4 }}>
                <CardContent>
                  <Typography variant="h4" fontWeight={700} color="secondary" mb={0.5}>
                    Orders Management
                  </Typography>
                  <Typography variant="body2" color="text.secondary" mb={3}>
                    View and manage customer orders.
                  </Typography>
                    <Box
                      sx={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        mb: 3,
                        flexWrap: "wrap",
                        gap: 2,
                      }}
                    >
                      <Typography variant="h5" fontWeight={700}>
                        Orders
                      </Typography>
                      <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap" }}>
                        <TextField
                          placeholder="Search orders..."
                          value={orderSearchQuery}
                          onChange={(e) => setOrderSearchQuery(e.target.value)}
                          size="small"
                          sx={{ minWidth: 200 }}
                          InputProps={{
                            startAdornment: (
                              <InputAdornment position="start">
                                <SearchIcon sx={{ color: "primary.main" }} />
                              </InputAdornment>
                            ),
                          }}
                        />
                        <FormControl size="small" sx={{ minWidth: 150 }}>
                          <InputLabel>Status</InputLabel>
                          <Select
                            value={orderStatusFilter}
                            onChange={(e) =>
                              setOrderStatusFilter(e.target.value)
                            }
                            label="Status"
                          >
                            <MenuItem value="all">All Orders</MenuItem>
                            <MenuItem value="pending">Pending</MenuItem>
                            <MenuItem value="confirmed">Confirmed</MenuItem>
                            <MenuItem value="ready">Ready</MenuItem>
                            <MenuItem value="completed">Completed</MenuItem>
                            <MenuItem value="cancelled">Cancelled</MenuItem>
                          </Select>
                        </FormControl>
                      </Box>
                    </Box>

                    {filteredOrders.length === 0 ? (
                      <Alert severity="info">
                        No orders found.{" "}
                        {orderSearchQuery || orderStatusFilter !== "all"
                          ? "Try adjusting your filters."
                          : "Orders will appear here when customers place them."}
                      </Alert>
                    ) : (
                      <TableContainer>
                        <Table>
                          <TableHead>
                            <TableRow sx={{ bgcolor: "#f8f9fa" }}>
                              <TableCell>
                                <strong>Order #</strong>
                              </TableCell>
                              <TableCell>
                                <strong>Customer</strong>
                              </TableCell>
                              <TableCell>
                                <strong>Items</strong>
                              </TableCell>
                              <TableCell>
                                <strong>Total</strong>
                              </TableCell>
                              <TableCell>
                                <strong>Status</strong>
                              </TableCell>
                              <TableCell>
                                <strong>Date</strong>
                              </TableCell>
                              <TableCell align="center">
                                <strong>Actions</strong>
                              </TableCell>
                            </TableRow>
                          </TableHead>
                          <TableBody>
                            {filteredOrders.map((order) => (
                              <TableRow
                                key={order._id}
                                sx={{ "&:hover": { bgcolor: "#f8f9fa" } }}
                              >
                                <TableCell>
                                  <strong>{order.orderNumber || "N/A"}</strong>
                                </TableCell>
                                <TableCell>
                                  {order.customer
                                    ? `${order.customer.firstName || ""} ${
                                        order.customer.lastName || ""
                                      }`.trim() || "Unknown"
                                    : "Unknown"}
                                </TableCell>
                                <TableCell>
                                  {order.items?.reduce(
                                    (sum, item) => sum + Number(item.quantity),
                                    0
                                  )}{" "}
                                  unit(s)
                                  {order.items?.length > 1 &&
                                    ` (${order.items.length} items)`}
                                </TableCell>
                                <TableCell>
                                  <strong>
                                    ${order.totalAmount?.toFixed(2) || "0.00"}
                                  </strong>
                                </TableCell>
                                <TableCell>
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
                                </TableCell>
                                <TableCell>
                                  {formatDate(order.createdAt)}
                                </TableCell>
                                <TableCell align="center">
                                  <Button
                                    size="small"
                                    variant="outlined"
                                    onClick={() => handleOpenOrderDialog(order)}
                                    sx={{ mr: 1 }}
                                  >
                                    View/Update
                                  </Button>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </TableContainer>
                    )}
                </CardContent>
              </Card>
            )}

            {activeSection === "pharmacySettings" && (
              <Card sx={{ mb: 4 }}>
                <CardContent>
                  <Typography variant="h4" fontWeight={700} color="secondary" mb={0.5}>
                    Pharmacy Settings
                  </Typography>
                  <Typography variant="body2" color="text.secondary" mb={3}>
                    Update your pharmacy details and working hours.
                  </Typography>

                  {pharmacySaveError && (
                    <Alert severity="error" sx={{ mb: 2 }}>
                      {pharmacySaveError}
                    </Alert>
                  )}
                  {pharmacySaveStatus === "saved" && (
                    <Alert severity="success" sx={{ mb: 2 }}>
                      Saved successfully
                    </Alert>
                  )}

                  <Grid container spacing={2} sx={{ mb: 3 }}>
                      <Grid item xs={12} md={6}>
                        <TextField
                          fullWidth
                          label="Pharmacy Name"
                          value={pharmacyForm.name}
                          onChange={(e) => handlePharmacyInputChange("name", e.target.value)}
                        />
                      </Grid>
                    <Grid item xs={12} md={6}>
                      <TextField
                        fullWidth
                        label="City"
                        value={pharmacyForm.city}
                        onChange={(e) => handlePharmacyInputChange("city", e.target.value)}
                      />
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <TextField
                        fullWidth
                        label="Street"
                        value={pharmacyForm.street}
                        onChange={(e) => handlePharmacyInputChange("street", e.target.value)}
                      />
                    </Grid>
                  </Grid>

                  {/* Location Section */}
                  <Box sx={{ mb: 4, mt: 4 }}>
                    <Typography variant="h6" fontWeight={600} color="secondary" mb={2}>
                      Pharmacy Location
                    </Typography>
                    <Typography variant="body2" color="text.secondary" mb={3}>
                      Drag the marker or click on the map to set your pharmacy location
                    </Typography>
                    
                    <Box
                      sx={{
                        width: "100%",
                        height: { xs: 350, md: 450 },
                        borderRadius: 3,
                        overflow: "hidden",
                        border: "2px solid",
                        borderColor: "divider",
                        position: "relative",
                        boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
                        "& .leaflet-container": {
                          height: "100%",
                          width: "100%",
                          borderRadius: "12px",
                        },
                      }}
                    >
                      <MapContainer
                        center={[coordinates.lat, coordinates.lng]}
                        zoom={15}
                        style={{ height: "100%", width: "100%" }}
                        scrollWheelZoom={true}
                      >
                        <TileLayer
                          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                        />
                        <MapCenterUpdater center={[coordinates.lat, coordinates.lng]} />
                        <Marker
                          position={[coordinates.lat, coordinates.lng]}
                          draggable={true}
                          eventHandlers={{
                            dragend: (e) => {
                              const marker = e.target;
                              const position = marker.getLatLng();
                              setCoordinates({
                                lat: parseFloat(position.lat.toFixed(6)),
                                lng: parseFloat(position.lng.toFixed(6)),
                              });
                            },
                          }}
                        />
                        <MapClickHandler
                          onMapClick={(latlng) => {
                            setCoordinates({
                              lat: parseFloat(latlng.lat.toFixed(6)),
                              lng: parseFloat(latlng.lng.toFixed(6)),
                            });
                          }}
                        />
                      </MapContainer>
                    </Box>
                    
                    <Box
                      sx={{
                        mt: 3,
                        display: "flex",
                        gap: 2,
                        flexWrap: "wrap",
                        justifyContent: { xs: "center", md: "flex-start" },
                      }}
                    >
                      <Button
                        variant="contained"
                        startIcon={<Room />}
                        onClick={() => {
                          if (navigator.geolocation) {
                            navigator.geolocation.getCurrentPosition(
                              (position) => {
                                setCoordinates({
                                  lat: position.coords.latitude,
                                  lng: position.coords.longitude,
                                });
                              },
                              (error) => {
                                alert("Unable to get your location. Please click on the map to set your location.");
                              }
                            );
                          } else {
                            alert("Geolocation is not supported by your browser.");
                          }
                        }}
                        sx={{
                          px: 4,
                          py: 1.2,
                          borderRadius: 2,
                          textTransform: "none",
                          fontSize: "1rem",
                          color: "#ffffff",
                          backgroundColor: "#4ecdc4",
                          "&:hover": {
                            backgroundColor: "#3bb5ac",
                            transform: "translateY(-2px)",
                            boxShadow: "0 4px 12px rgba(78, 205, 196, 0.4)",
                          },
                          transition: "all 0.3s ease",
                        }}
                      >
                        Use My Current Location
                      </Button>
                      <Button
                        variant="outlined"
                        startIcon={<Directions />}
                        onClick={() => {
                          window.open(
                            `https://www.google.com/maps?q=${coordinates.lat},${coordinates.lng}`,
                            "_blank"
                          );
                        }}
                        sx={{
                          borderColor: "primary.main",
                          color: "primary.main",
                          px: 3,
                          py: 1.2,
                          borderRadius: 2,
                          textTransform: "none",
                          fontWeight: 600,
                          "&:hover": {
                            borderColor: "primary.dark",
                            bgcolor: "primary.light",
                            color: "primary.dark",
                            transform: "translateY(-2px)",
                            boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                          },
                          transition: "all 0.3s ease",
                        }}
                      >
                        Open in Google Maps
                      </Button>
                    </Box>
                  </Box>

                  <Card sx={{ p: 3, borderRadius: 3, maxWidth: 1000, mx: "auto" }}>
                    {/* HEADER */}
                    <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
                      <Typography variant="h6" fontWeight={600}>Working Hours</Typography>
                      {/* 24/7 SWITCH */}
                      <FormControlLabel
                        control={
                          <Switch
                            checked={alwaysOpen}
                            onChange={(e) => setAlwaysOpen(e.target.checked)}
                          />
                        }
                        label="Open 24/7"
                      />
                    </Box>

                    {/* TABLE LAYOUT */}
                    <TableContainer
                      component={Paper}
                      sx={{
                        borderRadius: 2,
                        overflow: "hidden",
                        border: "1px solid",
                        borderColor: "divider",
                      }}
                    >
                      <Table>
                        <TableHead>
                          <TableRow sx={{ bgcolor: "#f8f9fa" }}>
                            <TableCell align="center" sx={{ fontWeight: 600 }}>
                              Day
                            </TableCell>
                            <TableCell align="center" sx={{ fontWeight: 600 }}>
                              Status
                            </TableCell>
                            <TableCell align="center" sx={{ fontWeight: 600 }}>
                              Working Hours
                            </TableCell>
                            <TableCell align="center" sx={{ fontWeight: 600 }}>
                              All Day
                            </TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"].map((day, index) => {
                            const d = hours[day] || { open: false, openTime: "09:00", closeTime: "18:00", allDay: false };
                            const label = day.charAt(0).toUpperCase() + day.slice(1);
                            const isLast = index === 6;

                            return (
                              <TableRow
                                key={day}
                                sx={{
                                  opacity: alwaysOpen ? 0.4 : 1,
                                  "&:hover": { bgcolor: "#f8f9fa" },
                                  "&:last-child td": {
                                    borderBottom: "none",
                                  },
                                }}
                              >
                                {/* DAY NAME */}
                                <TableCell align="center">
                                  <Typography fontWeight={500}>{label}</Typography>
                                </TableCell>

                                {/* OPEN/CLOSED SWITCH */}
                                <TableCell align="center">
                                  <FormControlLabel
                                    control={
                                      <Switch
                                        checked={d.open}
                                        disabled={alwaysOpen}
                                        onChange={(e) =>
                                          updateDay(day, { open: e.target.checked })
                                        }
                                      />
                                    }
                                    label={d.open ? "Open" : "Closed"}
                                  />
                                </TableCell>

                                {/* TIME PICKERS */}
                                <TableCell align="center">
                                  {d.open && !d.allDay && !alwaysOpen && (
                                    <Box display="flex" gap={1} alignItems="center" justifyContent="center">
                                      <TextField
                                        type="time"
                                        label="Open"
                                        value={d.openTime}
                                        onChange={(e) =>
                                          updateDay(day, { openTime: e.target.value })
                                        }
                                        size="small"
                                        InputLabelProps={{ shrink: true }}
                                        sx={{ width: 130 }}
                                      />
                                      <Typography color="text.secondary" sx={{ mx: 0.5 }}>
                                        to
                                      </Typography>
                                      <TextField
                                        type="time"
                                        label="Close"
                                        value={d.closeTime}
                                        onChange={(e) =>
                                          updateDay(day, { closeTime: e.target.value })
                                        }
                                        size="small"
                                        InputLabelProps={{ shrink: true }}
                                        sx={{ width: 130 }}
                                      />
                                    </Box>
                                  )}

                                  {/* If closed or all day */}
                                  {!alwaysOpen && (
                                    <>
                                      {!d.open && (
                                        <Typography color="text.secondary" sx={{ fontStyle: "italic" }}>
                                          Closed
                                        </Typography>
                                      )}
                                      {d.open && d.allDay && (
                                        <Typography color="text.secondary" sx={{ fontStyle: "italic" }}>
                                          All Day
                                        </Typography>
                                      )}
                                    </>
                                  )}

                                  {alwaysOpen && (
                                    <Typography color="text.secondary" sx={{ fontStyle: "italic" }}>
                                      24/7
                                    </Typography>
                                  )}
                                </TableCell>

                                {/* ALL DAY SWITCH */}
                                <TableCell align="center">
                                  {d.open && !alwaysOpen && (
                                    <FormControlLabel
                                      control={
                                        <Switch
                                          checked={d.allDay}
                                          onChange={(e) =>
                                            updateDay(day, { allDay: e.target.checked })
                                          }
                                        />
                                      }
                                      label="All Day"
                                    />
                                  )}
                                  {(!d.open || alwaysOpen) && (
                                    <Typography color="text.secondary" variant="body2">
                                      -
                                    </Typography>
                                  )}
                                </TableCell>
                              </TableRow>
                            );
                          })}
                        </TableBody>
                      </Table>
                    </TableContainer>

                    {/* SAVE BUTTON */}
                    <Box textAlign="center" mt={4}>
                      <Button 
                        variant="contained" 
                        sx={{ 
                          px: 4,
                          py: 1.2,
                          borderRadius: 2,
                          textTransform: "none",
                          color: "#ffffff",
                          backgroundColor: "#4ecdc4",
                          "&:hover": {
                            backgroundColor: "#3bb5ac",
                          },
                          fontSize: "1rem",
                          fontWeight: 600,
                        }} 
                        onClick={handleSavePharmacy}
                        disabled={pharmacySaveStatus === "saving"}
                      >
                        {pharmacySaveStatus === "saving"
                          ? "Saving..."
                          : pharmacySaveStatus === "saved"
                          ? "Saved ✓"
                          : "Save Changes"}
                      </Button>
                    </Box>
                  </Card>
                </CardContent>
              </Card>
            )}
          </Box>
        </Box>
      </Container>

      <Dialog
        open={openDialog}
        onClose={handleCloseDialog}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          {selectedInventory ? "Edit Inventory Item" : "Add New Inventory Item"}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <FormControl fullWidth required sx={{ minWidth: 200 }} >
                <InputLabel>Select Item</InputLabel>
                <Select
                  value={formData.itemId || ""}
                  onChange={(e) => {
                    const selectedItemId = e.target.value;
                    if (!selectedItemId) return; // Don't process if "Choose Item" is selected
                    const selectedItem = allItems.find((item) => item._id === selectedItemId);
                    setFormData({
                      ...formData,
                      itemId: selectedItemId,
                      // Set price to item's basePrice if available (only for new items, not when editing)
                      price: !selectedInventory && selectedItem?.basePrice
                        ? selectedItem.basePrice.toString()
                        : formData.price,
                    });
                  }}
                  label="Select Item"
                  disabled={!!selectedInventory}
                  displayEmpty
                >
                  <MenuItem value="" disabled>
                    <em>Choose Item</em>
                  </MenuItem>
                  {allItems.map((item) => (
                    <MenuItem key={item._id} value={item._id}>
                      {item.name} - {item.category}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              {!selectedInventory && allItems.length === 0 && (
                <Alert severity="info" sx={{ mt: 1 }}>
                  No items available. Items must be created first via the
                  medications API.
                </Alert>
              )}
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Price"
                type="number"
                value={formData.price}
                onChange={(e) =>
                  setFormData({ ...formData, price: e.target.value })
                }
                required
                inputProps={{ step: "0.01", min: "0" }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Quantity"
                type="number"
                value={formData.quantity}
                onChange={(e) =>
                  setFormData({ ...formData, quantity: e.target.value })
                }
                required
                inputProps={{ min: "0" }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Low Stock Threshold"
                type="number"
                value={formData.lowStockThreshold}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    lowStockThreshold: e.target.value,
                  })
                }
                inputProps={{ min: "0" }}
                helperText="Alert when stock falls below this number"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Availability</InputLabel>
                <Select
                  value={formData.isAvailable}
                  onChange={(e) =>
                    setFormData({ ...formData, isAvailable: e.target.value })
                  }
                  label="Availability"
                >
                  <MenuItem value={true}>Available</MenuItem>
                  <MenuItem value={false}>Unavailable</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button
            onClick={handleSubmit}
            variant="contained"
            disabled={
              !formData.itemId || !formData.price || formData.quantity === ""
            }
            sx={{
              px: 4,
              py: 1.2,
              borderRadius: 2,
              textTransform: "none",
              fontSize: "1rem",
              color: "#ffffff",
              backgroundColor: "#4ecdc4",
              "&:hover": {
                backgroundColor: "#3bb5ac",
              },
            }}
          >
            {selectedInventory ? "Update" : "Add"} Inventory
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={openOrderDialog}
        onClose={handleCloseOrderDialog}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          Order Details - {selectedOrder?.orderNumber || "N/A"}
        </DialogTitle>
        <DialogContent>
          {selectedOrder && (
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={12}>
                <Typography
                  variant="subtitle2"
                  color="text.secondary"
                  sx={{ mb: 2, fontWeight: 600 }}
                >
                  Customer Information
                </Typography>
                <Box
                  sx={{
                    p: 2,
                    bgcolor: "#f8f9fa",
                    borderRadius: 2,
                    mb: 3,
                  }}
                >
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={6}>
                      <Typography
                        variant="caption"
                        color="text.secondary"
                        sx={{ display: "block", mb: 0.5 }}
                      >
                        Name
                      </Typography>
                      <Typography variant="body1" fontWeight={500}>
                        {selectedOrder.customer
                          ? `${selectedOrder.customer.firstName || ""} ${
                              selectedOrder.customer.lastName || ""
                            }`.trim() || "Unknown"
                          : "Unknown"}
                      </Typography>
                    </Grid>
                    {selectedOrder.customer?.email && (
                      <Grid item xs={12} sm={6}>
                        <Typography
                          variant="caption"
                          color="text.secondary"
                          sx={{ display: "block", mb: 0.5 }}
                        >
                          Email
                        </Typography>
                        <Typography variant="body1" fontWeight={500}>
                          {selectedOrder.customer.email}
                        </Typography>
                      </Grid>
                    )}
                    {selectedOrder.customer?.phone && (
                      <Grid item xs={12} sm={6}>
                        <Typography
                          variant="caption"
                          color="text.secondary"
                          sx={{ display: "block", mb: 0.5 }}
                        >
                          Phone
                        </Typography>
                        <Typography variant="body1" fontWeight={500}>
                          {selectedOrder.customer.phone}
                        </Typography>
                      </Grid>
                    )}
                  </Grid>
                </Box>
              </Grid>

              <Grid item xs={12}>
                <Typography
                  variant="subtitle2"
                  color="text.secondary"
                  sx={{ mb: 1 }}
                >
                  Order Items
                </Typography>
                <TableContainer component={Paper} variant="outlined">
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>
                          <strong>Item</strong>
                        </TableCell>
                        <TableCell align="right">
                          <strong>Quantity</strong>
                        </TableCell>
                        <TableCell align="right">
                          <strong>Price</strong>
                        </TableCell>
                        <TableCell align="right">
                          <strong>Subtotal</strong>
                        </TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {selectedOrder.items?.map((item, index) => (
                        <TableRow key={index}>
                          <TableCell>
                            {item.item?.name || "Unknown Item"}
                          </TableCell>
                          <TableCell align="right">
                            {Number(item.quantity)}
                          </TableCell>
                          <TableCell align="right">
                            ${item.priceAtOrder?.toFixed(2) || "0.00"}
                          </TableCell>
                          <TableCell align="right">
                            <strong>
                              ${item.subtotal?.toFixed(2) || "0.00"}
                            </strong>
                          </TableCell>
                        </TableRow>
                      ))}
                      <TableRow>
                        <TableCell colSpan={3} align="right">
                          <strong>Total Amount:</strong>
                        </TableCell>
                        <TableCell align="right">
                          <strong>
                            ${selectedOrder.totalAmount?.toFixed(2) || "0.00"}
                          </strong>
                        </TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </TableContainer>
              </Grid>

              <Grid item xs={12} sm={6}>
                <Typography
                  variant="subtitle2"
                  color="text.secondary"
                  sx={{ mb: 1 }}
                >
                  Order Status
                </Typography>
                <FormControl fullWidth>
                  <InputLabel>Status</InputLabel>
                  <Select
                    value={displayedOrderStatus || selectedOrder.status || "pending"}
                    onChange={(e) => {
                      const newStatus = e.target.value;
                      setPendingStatusChange(newStatus);
                      setDisplayedOrderStatus(newStatus);
                      setOpenStatusConfirmDialog(true);
                    }}
                    label="Status"
                  >
                    <MenuItem value="pending">Pending</MenuItem>
                    <MenuItem value="confirmed">Confirmed</MenuItem>
                    <MenuItem value="ready">Ready</MenuItem>
                    <MenuItem value="completed">Completed</MenuItem>
                    <MenuItem value="cancelled">Cancelled</MenuItem>
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12} sm={6}>
                <Typography
                  variant="subtitle2"
                  color="text.secondary"
                  sx={{ mb: 1 }}
                >
                  Order Date
                </Typography>
                <Typography variant="body1">
                  {formatDate(selectedOrder.createdAt)}
                </Typography>
              </Grid>

              {selectedOrder.customerNotes && (
                <Grid item xs={12}>
                  <Typography
                    variant="subtitle2"
                    color="text.secondary"
                    sx={{ mb: 1 }}
                  >
                    Customer Notes
                  </Typography>
                  <Typography
                    variant="body2"
                    sx={{ p: 2, bgcolor: "#f5f5f5", borderRadius: 1 }}
                  >
                    {selectedOrder.customerNotes}
                  </Typography>
                </Grid>
              )}
            </Grid>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseOrderDialog}>Close</Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={openStatusConfirmDialog}
        onClose={() => {
          setOpenStatusConfirmDialog(false);
          setPendingStatusChange(null);
        }}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{ pb: 1 }}>
          <Typography variant="h6" fontWeight={600}>
            Confirm Status Change
          </Typography>
        </DialogTitle>
        <DialogContent>
          <Typography variant="body1" sx={{ mb: 1 }}>
            Are you sure you want to change the order status to{" "}
            <strong>{pendingStatusChange}</strong>?
          </Typography>
          <Typography variant="body2" color="text.secondary">
            This action will update the order status and notify the customer.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2, pt: 1 }}>
          <Button
            onClick={() => {
              // Revert to original status
              setDisplayedOrderStatus(selectedOrder?.status || "pending");
              setOpenStatusConfirmDialog(false);
              setPendingStatusChange(null);
            }}
            sx={{
              textTransform: "none",
              color: "text.secondary",
            }}
          >
            Cancel
          </Button>
          <Button
            onClick={() => {
              if (pendingStatusChange && selectedOrder?._id) {
                handleUpdateOrderStatus(selectedOrder._id, pendingStatusChange);
                setOpenStatusConfirmDialog(false);
                setPendingStatusChange(null);
                // Keep displayedOrderStatus as the new status since it's confirmed
              }
            }}
            variant="contained"
            sx={{
              background: "linear-gradient(135deg, #4ecdc4 0%, #44a9a3 100%)",
              textTransform: "none",
              fontWeight: 600,
              px: 3,
              "&:hover": {
                background: "linear-gradient(135deg, #44a9a3 0%, #3d9993 100%)",
              },
            }}
          >
            Confirm
          </Button>
        </DialogActions>
      </Dialog>

      <Footer />
    </Box>
  );
};

export default PharmacyDashboard;
