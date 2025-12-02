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
} from "@mui/material";
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
import Header from "../components/Header";
import Footer from "../components/Footer";
import {
  medicationAPI,
  pharmacyAPI,
  inventoryAPI,
  orderAPI,
} from "../services/api";

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
      alert(`Order status updated to ${newStatus} successfully!`);
      // Refresh orders
      if (pharmacy?._id) {
        await fetchOrders(pharmacy._id);
      }
      setOpenOrderDialog(false);
      setSelectedOrder(null);
    } catch (error) {
      console.error("Error updating order status:", error);
      const errorMsg =
        error.response?.data?.message || "Failed to update order status";
      alert(errorMsg);
    }
  };

  const handleOpenOrderDialog = (order) => {
    setSelectedOrder(order);
    setOpenOrderDialog(true);
  };

  const handleCloseOrderDialog = () => {
    setOpenOrderDialog(false);
    setSelectedOrder(null);
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
      
      // When enabling All Day, store current times as previous (if not already 00:00-23:59)
      if (updatedDay.allDay && !currentDay.allDay) {
        if (currentDay.openTime !== "00:00" || currentDay.closeTime !== "23:59") {
          updatedDay.previousOpenTime = currentDay.openTime;
          updatedDay.previousCloseTime = currentDay.closeTime;
        }
        updatedDay.openTime = "00:00";
        updatedDay.closeTime = "23:59";
      }
      
      // When disabling All Day, restore previous times
      if (!updatedDay.allDay && currentDay.allDay) {
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
          <Typography>Loading...</Typography>
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
        <Grid container spacing={4}>
          <Grid item xs={12} md={2.5}>
            <Card sx={{ position: "sticky", top: 90 }}>
              <CardContent>
                <List>
                  <ListItem
                    button
                    selected={activeSection === "dashboard"}
                    onClick={() => setActiveSection("dashboard")}
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
                      <Dashboard />
                    </ListItemIcon>
                    <ListItemText primary="Dashboard" />
                  </ListItem>
                  <ListItem
                    button
                    selected={activeSection === "inventory"}
                    onClick={() => setActiveSection("inventory")}
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
                      <Inventory />
                    </ListItemIcon>
                    <ListItemText primary="Inventory" />
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
                      <ShoppingCart />
                    </ListItemIcon>
                    <ListItemText primary="Orders" />
                  </ListItem>
                  <ListItem button sx={{ borderRadius: 2, mb: 1 }}>
                    <ListItemIcon>
                      <TrendingUp />
                    </ListItemIcon>
                    <ListItemText primary="Analytics" />
                  </ListItem>
                  <ListItem
                    button
                    selected={activeSection === "pharmacySettings"}
                    onClick={() => setActiveSection("pharmacySettings")}
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
                      <Settings />
                    </ListItemIcon>
                    <ListItemText primary="Pharmacy Info" />
                  </ListItem>
                  <ListItem
                    button
                    sx={{ borderRadius: 2 }}
                    onClick={() => {
                      localStorage.removeItem("token");
                      localStorage.removeItem("user");
                      navigate("/");
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

          <Grid item xs={12} md={9.5}>
            {activeSection === "dashboard" && (
              <>
                <Box sx={{ mb: 4 }}>
                  <Typography
                    variant="h4"
                    fontWeight={700}
                    color="secondary"
                    mb={0.5}
                  >
                    Dashboard Overview
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Welcome back! Here's what's happening with your pharmacy
                    today.
                  </Typography>
                </Box>

                <Grid container spacing={3} mb={4}>
                  <Grid item xs={12} sm={6} md={3}>
                    <Card
                      sx={{
                        transition: "all 0.3s",
                        "&:hover": {
                          transform: "translateY(-5px)",
                          boxShadow: "0 6px 24px rgba(0,0,0,0.12)",
                        },
                      }}
                    >
                      <CardContent>
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
                  </Grid>

                  <Grid item xs={12} sm={6} md={3}>
                    <Card
                      sx={{
                        transition: "all 0.3s",
                        "&:hover": {
                          transform: "translateY(-5px)",
                          boxShadow: "0 6px 24px rgba(0,0,0,0.12)",
                        },
                      }}
                    >
                      <CardContent>
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
                  </Grid>

                  <Grid item xs={12} sm={6} md={3}>
                    <Card
                      sx={{
                        transition: "all 0.3s",
                        "&:hover": {
                          transform: "translateY(-5px)",
                          boxShadow: "0 6px 24px rgba(0,0,0,0.12)",
                        },
                      }}
                    >
                      <CardContent>
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
                  </Grid>

                  <Grid item xs={12} sm={6} md={3}>
                    <Card
                      sx={{
                        transition: "all 0.3s",
                        "&:hover": {
                          transform: "translateY(-5px)",
                          boxShadow: "0 6px 24px rgba(0,0,0,0.12)",
                        },
                      }}
                    >
                      <CardContent>
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
                  </Grid>
                </Grid>
              </>
            )}

            {activeSection === "inventory" && (
              <>
                <Box sx={{ mb: 4 }}>
                  <Typography
                    variant="h4"
                    fontWeight={700}
                    color="secondary"
                    mb={0.5}
                  >
                    Inventory Management
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Manage your pharmacy inventory items.
                  </Typography>
                </Box>

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
                        Inventory Items
                      </Typography>
                      <Button
                        variant="contained"
                        startIcon={<Add />}
                        onClick={() => handleOpenDialog()}
                        sx={{
                          background:
                            "linear-gradient(135deg, #4ecdc4 0%, #44a9a3 100%)",
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
              </>
            )}

            {activeSection === "orders" && (
              <>
                <Box sx={{ mb: 4 }}>
                  <Typography
                    variant="h4"
                    fontWeight={700}
                    color="secondary"
                    mb={0.5}
                  >
                    Orders Management
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    View and manage customer orders.
                  </Typography>
                </Box>

                <Card>
                  <CardContent>
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
              </>
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
                                  {(!d.open || d.allDay || alwaysOpen) && !alwaysOpen && (
                                    <Typography color="text.secondary" sx={{ fontStyle: "italic" }}>
                                      {d.allDay ? "All Day" : "Closed"}
                                    </Typography>
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
                          py: 1.5,
                          background: "linear-gradient(135deg, #4ecdc4 0%, #44a9a3 100%)",
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
          </Grid>
        </Grid>
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
              <FormControl fullWidth required>
                <InputLabel>Select Item</InputLabel>
                <Select
                  value={formData.itemId}
                  onChange={(e) =>
                    setFormData({ ...formData, itemId: e.target.value })
                  }
                  label="Select Item"
                  disabled={!!selectedInventory}
                >
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
              background: "linear-gradient(135deg, #4ecdc4 0%, #44a9a3 100%)",
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
                <Typography variant="subtitle2" color="text.secondary">
                  Customer Information
                </Typography>
                <Typography variant="body1" sx={{ mb: 2 }}>
                  {selectedOrder.customer
                    ? `${selectedOrder.customer.firstName || ""} ${
                        selectedOrder.customer.lastName || ""
                      }`.trim() || "Unknown"
                    : "Unknown"}
                </Typography>
                {selectedOrder.customer?.email && (
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ mb: 2 }}
                  >
                    Email: {selectedOrder.customer.email}
                  </Typography>
                )}
                {selectedOrder.customer?.phone && (
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ mb: 2 }}
                  >
                    Phone: {selectedOrder.customer.phone}
                  </Typography>
                )}
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
                    value={selectedOrder.status || "pending"}
                    onChange={(e) => {
                      const newStatus = e.target.value;
                      if (
                        window.confirm(
                          `Are you sure you want to change the order status to ${newStatus}?`
                        )
                      ) {
                        handleUpdateOrderStatus(selectedOrder._id, newStatus);
                      }
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

              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Pharmacy Notes"
                  multiline
                  rows={3}
                  placeholder="Add notes about this order..."
                  value={selectedOrder.pharmacyNotes || ""}
                  onChange={async (e) => {
                    try {
                      await orderAPI.update(selectedOrder._id, {
                        pharmacyNotes: e.target.value,
                      });
                      // Update local state
                      setSelectedOrder({
                        ...selectedOrder,
                        pharmacyNotes: e.target.value,
                      });
                    } catch (error) {
                      console.error("Error updating pharmacy notes:", error);
                    }
                  }}
                />
              </Grid>
            </Grid>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseOrderDialog}>Close</Button>
        </DialogActions>
      </Dialog>

      <Footer />
    </Box>
  );
};

export default PharmacyDashboard;
