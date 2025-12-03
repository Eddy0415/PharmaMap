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
  Chip,
  Paper,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  InputAdornment,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  CircularProgress,
} from "@mui/material";
import Dashboard from "@mui/icons-material/Dashboard";
import People from "@mui/icons-material/People";
import LocalPharmacy from "@mui/icons-material/LocalPharmacy";
import Medication from "@mui/icons-material/Medication";
import ShoppingCart from "@mui/icons-material/ShoppingCart";
import Reviews from "@mui/icons-material/Reviews";
import Delete from "@mui/icons-material/Delete";
import SearchIcon from "@mui/icons-material/Search";
import Visibility from "@mui/icons-material/Visibility";
import Logout from "@mui/icons-material/Logout";
import Header from "../components/Header";
import Footer from "../components/Footer";
import { adminAPI, pharmacyAPI, medicationAPI, orderAPI, reviewAPI } from "../services/api";
import { firebaseSignOut } from "../firebase/auth";

const Admin = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [activeSection, setActiveSection] = useState("dashboard");
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // Data states
  const [users, setUsers] = useState([]);
  const [pharmacies, setPharmacies] = useState([]);
  const [medications, setMedications] = useState([]);
  const [orders, setOrders] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [statistics, setStatistics] = useState(null);

  // Dialog states
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState({ type: "", id: "", name: "" });

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      const userData = JSON.parse(storedUser);
      setUser(userData);
      // Check if user is admin
      if (userData.userType !== "admin") {
        alert("Access denied. Admin privileges required.");
        navigate("/");
        return;
      }
      // Reset search when switching sections
      setSearchQuery("");
      fetchData();
    } else {
      navigate("/login");
    }
  }, [navigate, activeSection]);

  // Debounced search effect
  useEffect(() => {
    if (!user || activeSection === "dashboard") return;

    const timeoutId = setTimeout(() => {
      switch (activeSection) {
        case "users":
          fetchUsers();
          break;
        case "pharmacies":
          fetchPharmacies();
          break;
        case "medications":
          fetchMedications();
          break;
        case "orders":
          fetchOrders();
          break;
        case "reviews":
          fetchReviews();
          break;
        default:
          break;
      }
    }, searchQuery ? 300 : 0); // 300ms debounce only if there's a search query

    return () => clearTimeout(timeoutId);
  }, [searchQuery, activeSection, user]);

  const fetchData = async () => {
    setLoading(true);
    try {
      switch (activeSection) {
        case "dashboard":
          await fetchStatistics();
          break;
        case "users":
          await fetchUsers();
          break;
        case "pharmacies":
          await fetchPharmacies();
          break;
        case "medications":
          await fetchMedications();
          break;
        case "orders":
          await fetchOrders();
          break;
        case "reviews":
          await fetchReviews();
          break;
        default:
          break;
      }
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStatistics = async () => {
    try {
      // For now, we'll calculate stats from individual APIs
      // In production, use adminAPI.getStatistics()
      const [usersRes, pharmaciesRes, medicationsRes, ordersRes, reviewsRes] = await Promise.all([
        adminAPI.getAllUsers().catch(() => ({ data: { users: [] } })),
        pharmacyAPI.getAll().catch(() => ({ data: { pharmacies: [] } })),
        medicationAPI.getAll().catch(() => ({ data: { results: [] } })),
        orderAPI.getAll().catch(() => ({ data: { orders: [] } })),
        reviewAPI.getAll().catch(() => ({ data: { reviews: [] } })),
      ]);

      setStatistics({
        totalUsers: usersRes.data?.users?.length || 0,
        totalPharmacies: pharmaciesRes.data?.pharmacies?.length || 0,
        totalMedications: medicationsRes.data?.results?.length || 0,
        totalOrders: ordersRes.data?.orders?.length || 0,
        totalReviews: reviewsRes.data?.reviews?.length || 0,
      });
    } catch (error) {
      console.error("Error fetching statistics:", error);
    }
  };

  const fetchUsers = async () => {
    try {
      const response = await adminAPI.getAllUsers({ search: searchQuery });
      setUsers(response.data?.users || []);
    } catch (error) {
      console.error("Error fetching users:", error);
      setUsers([]);
    }
  };

  const fetchPharmacies = async () => {
    try {
      const response = await pharmacyAPI.getAll({ search: searchQuery });
      setPharmacies(response.data?.pharmacies || []);
    } catch (error) {
      console.error("Error fetching pharmacies:", error);
      setPharmacies([]);
    }
  };

  const fetchMedications = async () => {
    try {
      const response = await medicationAPI.getAll({ search: searchQuery });
      setMedications(response.data?.results?.map((r) => r.item).filter(Boolean) || []);
    } catch (error) {
      console.error("Error fetching medications:", error);
      setMedications([]);
    }
  };

  const fetchOrders = async () => {
    try {
      const response = await orderAPI.getAll({ search: searchQuery });
      setOrders(response.data?.orders || []);
    } catch (error) {
      console.error("Error fetching orders:", error);
      setOrders([]);
    }
  };

  const fetchReviews = async () => {
    try {
      const response = await reviewAPI.getAll({ search: searchQuery });
      setReviews(response.data?.reviews || []);
    } catch (error) {
      console.error("Error fetching reviews:", error);
      setReviews([]);
    }
  };

  const handleDelete = (type, id, name) => {
    setDeleteTarget({ type, id, name });
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    try {
      setLoading(true);
      switch (deleteTarget.type) {
        case "user":
          await adminAPI.deleteUser(deleteTarget.id);
          await fetchUsers();
          break;
        case "pharmacy":
          await adminAPI.deletePharmacy(deleteTarget.id);
          await fetchPharmacies();
          break;
        case "medication":
          await adminAPI.deleteMedication(deleteTarget.id);
          await fetchMedications();
          break;
        case "order":
          await adminAPI.deleteOrder(deleteTarget.id);
          await fetchOrders();
          break;
        case "review":
          await adminAPI.deleteReview(deleteTarget.id);
          await fetchReviews();
          break;
        default:
          break;
      }
      setDeleteDialogOpen(false);
      setDeleteTarget({ type: "", id: "", name: "" });
    } catch (error) {
      console.error("Error deleting:", error);
      alert("Failed to delete. Please try again.");
    } finally {
      setLoading(false);
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

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const renderDashboard = () => (
    <Card sx={{ mb: 4 }}>
      <CardContent>
        <Typography variant="h4" fontWeight={700} color="secondary" mb={0.5}>
          Dashboard Overview
        </Typography>
        <Typography variant="body2" color="text.secondary" mb={3}>
          Welcome back! Here's an overview of your system statistics.
        </Typography>

        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: {
              xs: "1fr",
              sm: "repeat(2, 1fr)",
              md: "repeat(3, 1fr)",
              lg: "repeat(5, 1fr)",
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
                  <People sx={{ fontSize: 28 }} />
                </Box>
                <Typography
                  variant="h4"
                  fontWeight={700}
                  color="secondary"
                  mb={1}
                >
                  {statistics?.totalUsers || 0}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Total Users
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
                  <LocalPharmacy sx={{ fontSize: 28 }} />
                </Box>
                <Typography
                  variant="h4"
                  fontWeight={700}
                  color="secondary"
                  mb={1}
                >
                  {statistics?.totalPharmacies || 0}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Total Pharmacies
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
                  <Medication sx={{ fontSize: 28 }} />
                </Box>
                <Typography
                  variant="h4"
                  fontWeight={700}
                  color="secondary"
                  mb={1}
                >
                  {statistics?.totalMedications || 0}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Total Medications
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
                  <ShoppingCart sx={{ fontSize: 28 }} />
                </Box>
                <Typography
                  variant="h4"
                  fontWeight={700}
                  color="secondary"
                  mb={1}
                >
                  {statistics?.totalOrders || 0}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Total Orders
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
                      "linear-gradient(135deg, #f3e5f5 0%, #e1bee7 100%)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "#7b1fa2",
                    mb: 2,
                    flexShrink: 0,
                  }}
                >
                  <Reviews sx={{ fontSize: 28 }} />
                </Box>
                <Typography
                  variant="h4"
                  fontWeight={700}
                  color="secondary"
                  mb={1}
                >
                  {statistics?.totalReviews || 0}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Total Reviews
                </Typography>
              </CardContent>
            </Card>
          </Box>
        </Box>
      </CardContent>
    </Card>
  );

  const renderUsers = () => (
    <Card sx={{ mb: 4 }}>
      <CardContent>
        <Typography variant="h4" fontWeight={700} color="secondary" mb={0.5}>
          Users Management
        </Typography>
        <Typography variant="body2" color="text.secondary" mb={3}>
          Manage and monitor all system users
        </Typography>

        <TextField
          fullWidth
          placeholder="Search users..."
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

        {loading ? (
          <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
            <CircularProgress />
          </Box>
        ) : (
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Name</TableCell>
                  <TableCell>Email</TableCell>
                  <TableCell>Type</TableCell>
                  <TableCell>Phone</TableCell>
                  <TableCell>Joined</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {users.map((u) => (
                  <TableRow key={u._id || u.id}>
                    <TableCell>{`${u.firstName || ""} ${u.lastName || ""}`}</TableCell>
                    <TableCell>{u.email}</TableCell>
                    <TableCell>
                      <Chip
                        label={u.userType || "customer"}
                        size="small"
                        color={u.userType === "pharmacist" ? "primary" : "default"}
                      />
                    </TableCell>
                    <TableCell>{u.phone || "N/A"}</TableCell>
                    <TableCell>{formatDate(u.createdAt)}</TableCell>
                    <TableCell align="right">
                      <IconButton
                        size="small"
                        color="error"
                        onClick={() => handleDelete("user", u._id || u.id, `${u.firstName} ${u.lastName}`)}
                      >
                        <Delete />
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
  );

  const renderPharmacies = () => (
    <Card sx={{ mb: 4 }}>
      <CardContent>
        <Typography variant="h4" fontWeight={700} color="secondary" mb={0.5}>
          Pharmacies Management
        </Typography>
        <Typography variant="body2" color="text.secondary" mb={3}>
          View and manage all registered pharmacies
        </Typography>

        <TextField
          fullWidth
          placeholder="Search pharmacies..."
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

        {loading ? (
          <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
            <CircularProgress />
          </Box>
        ) : (
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Name</TableCell>
                  <TableCell>Address</TableCell>
                  <TableCell>Rating</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {pharmacies.map((pharmacy) => (
                  <TableRow key={pharmacy._id || pharmacy.id}>
                    <TableCell>{pharmacy.name}</TableCell>
                    <TableCell>
                      {pharmacy.address?.street || ""}, {pharmacy.address?.city || ""}
                    </TableCell>
                    <TableCell>
                      {pharmacy.averageRating?.toFixed(1) || "0.0"} ({pharmacy.totalReviews || 0})
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={pharmacy.isOpen ? "Open" : "Closed"}
                        size="small"
                        color={pharmacy.isOpen ? "success" : "default"}
                      />
                    </TableCell>
                    <TableCell>
                      <IconButton
                        size="small"
                        onClick={() => navigate(`/pharmacy/${pharmacy._id || pharmacy.id}`)}
                      >
                        <Visibility />
                      </IconButton>
                      <IconButton
                        size="small"
                        color="error"
                        onClick={() => handleDelete("pharmacy", pharmacy._id || pharmacy.id, pharmacy.name)}
                      >
                        <Delete />
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
  );

  const renderMedications = () => (
    <Card sx={{ mb: 4 }}>
      <CardContent>
        <Typography variant="h4" fontWeight={700} color="secondary" mb={0.5}>
          Medications Management
        </Typography>
        <Typography variant="body2" color="text.secondary" mb={3}>
          Manage all available medications in the system
        </Typography>

        <TextField
          fullWidth
          placeholder="Search medications..."
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

        {loading ? (
          <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
            <CircularProgress />
          </Box>
        ) : (
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Name</TableCell>
                  <TableCell>Category</TableCell>
                  <TableCell>Dosage</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {medications.map((med) => (
                  <TableRow key={med._id || med.id}>
                    <TableCell>{med.name}</TableCell>
                    <TableCell>{med.category || "N/A"}</TableCell>
                    <TableCell>{med.dosage || "N/A"}</TableCell>
                    <TableCell>
                      <IconButton
                        size="small"
                        color="error"
                        onClick={() => handleDelete("medication", med._id || med.id, med.name)}
                      >
                        <Delete />
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
  );

  const renderOrders = () => (
    <Card sx={{ mb: 4 }}>
      <CardContent>
        <Typography variant="h4" fontWeight={700} color="secondary" mb={0.5}>
          Orders Management
        </Typography>
        <Typography variant="body2" color="text.secondary" mb={3}>
          View and manage all customer orders
        </Typography>

        <TextField
          fullWidth
          placeholder="Search orders..."
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

        {loading ? (
          <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
            <CircularProgress />
          </Box>
        ) : (
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Order #</TableCell>
                  <TableCell>Customer</TableCell>
                  <TableCell>Pharmacy</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Total</TableCell>
                  <TableCell>Date</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {orders.map((order) => (
                  <TableRow key={order._id || order.id}>
                    <TableCell>{order.orderNumber || "N/A"}</TableCell>
                    <TableCell>
                      {order.customer?.firstName || ""} {order.customer?.lastName || ""}
                    </TableCell>
                    <TableCell>{order.pharmacy?.name || "N/A"}</TableCell>
                    <TableCell>
                      <Chip
                        label={order.status || "pending"}
                        size="small"
                        color={
                          order.status === "completed"
                            ? "success"
                            : order.status === "cancelled"
                            ? "error"
                            : "default"
                        }
                      />
                    </TableCell>
                    <TableCell>${order.totalAmount?.toFixed(2) || "0.00"}</TableCell>
                    <TableCell>{formatDate(order.createdAt)}</TableCell>
                    <TableCell>
                      <IconButton
                        size="small"
                        color="error"
                        onClick={() => handleDelete("order", order._id || order.id, `Order #${order.orderNumber}`)}
                      >
                        <Delete />
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
  );

  const renderReviews = () => (
    <Card sx={{ mb: 4 }}>
      <CardContent>
        <Typography variant="h4" fontWeight={700} color="secondary" mb={0.5}>
          Reviews Management
        </Typography>
        <Typography variant="body2" color="text.secondary" mb={3}>
          Monitor and manage customer reviews and ratings
        </Typography>

        <TextField
          fullWidth
          placeholder="Search reviews..."
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

        {loading ? (
          <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
            <CircularProgress />
          </Box>
        ) : (
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>User</TableCell>
                  <TableCell>Pharmacy</TableCell>
                  <TableCell>Rating</TableCell>
                  <TableCell>Comment</TableCell>
                  <TableCell>Date</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {reviews.map((review) => (
                  <TableRow key={review._id || review.id}>
                    <TableCell>
                      {review.user?.firstName || ""} {review.user?.lastName || ""}
                    </TableCell>
                    <TableCell>{review.pharmacy?.name || "N/A"}</TableCell>
                    <TableCell>{review.rating || "N/A"}</TableCell>
                    <TableCell sx={{ maxWidth: 300, overflow: "hidden", textOverflow: "ellipsis" }}>
                      {review.comment || "No comment"}
                    </TableCell>
                    <TableCell>{formatDate(review.createdAt)}</TableCell>
                    <TableCell>
                      <IconButton
                        size="small"
                        color="error"
                        onClick={() =>
                          handleDelete("review", review._id || review.id, `Review by ${review.user?.firstName}`)
                        }
                      >
                        <Delete />
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
  );

  if (!user) {
    return null;
  }

  return (
    <Box component="main" sx={{ bgcolor: "background.default", minHeight: "100vh" }}>
      <Header user={user} onLogout={handleLogout} />

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
                <Typography variant="h5" fontWeight={700} color="secondary" mb={3}>
                  Admin Panel
                </Typography>

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
                    onClick={() => setActiveSection("users")}
                    sx={{
                      borderRadius: 2,
                      mb: 1,
                      cursor: "pointer",
                      transition: "all 0.3s ease",
                      bgcolor: activeSection === "users" ? "#4ecdc4" : "transparent",
                      color: activeSection === "users" ? "white" : "inherit",
                      "& .MuiListItemIcon-root": {
                        color: activeSection === "users" ? "white" : "inherit",
                      },
                      "& .MuiListItemText-primary": {
                        color: activeSection === "users" ? "white" : "inherit",
                      },
                      "&:hover": {
                        bgcolor: activeSection === "users" ? "#44a9a3" : "rgba(78, 205, 196, 0.1)",
                        transform: "translateX(4px)",
                      },
                    }}
                  >
                    <ListItemIcon>
                      <People />
                    </ListItemIcon>
                    <ListItemText primary="Users" />
                  </ListItem>

                  <ListItem
                    button
                    onClick={() => setActiveSection("pharmacies")}
                    sx={{
                      borderRadius: 2,
                      mb: 1,
                      cursor: "pointer",
                      transition: "all 0.3s ease",
                      bgcolor: activeSection === "pharmacies" ? "#4ecdc4" : "transparent",
                      color: activeSection === "pharmacies" ? "white" : "inherit",
                      "& .MuiListItemIcon-root": {
                        color: activeSection === "pharmacies" ? "white" : "inherit",
                      },
                      "& .MuiListItemText-primary": {
                        color: activeSection === "pharmacies" ? "white" : "inherit",
                      },
                      "&:hover": {
                        bgcolor: activeSection === "pharmacies" ? "#44a9a3" : "rgba(78, 205, 196, 0.1)",
                        transform: "translateX(4px)",
                      },
                    }}
                  >
                    <ListItemIcon>
                      <LocalPharmacy />
                    </ListItemIcon>
                    <ListItemText primary="Pharmacies" />
                  </ListItem>

                  <ListItem
                    button
                    onClick={() => setActiveSection("medications")}
                    sx={{
                      borderRadius: 2,
                      mb: 1,
                      cursor: "pointer",
                      transition: "all 0.3s ease",
                      bgcolor: activeSection === "medications" ? "#4ecdc4" : "transparent",
                      color: activeSection === "medications" ? "white" : "inherit",
                      "& .MuiListItemIcon-root": {
                        color: activeSection === "medications" ? "white" : "inherit",
                      },
                      "& .MuiListItemText-primary": {
                        color: activeSection === "medications" ? "white" : "inherit",
                      },
                      "&:hover": {
                        bgcolor: activeSection === "medications" ? "#44a9a3" : "rgba(78, 205, 196, 0.1)",
                        transform: "translateX(4px)",
                      },
                    }}
                  >
                    <ListItemIcon>
                      <Medication />
                    </ListItemIcon>
                    <ListItemText primary="Medications" />
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
                    onClick={() => setActiveSection("reviews")}
                    sx={{
                      borderRadius: 2,
                      mb: 1,
                      cursor: "pointer",
                      transition: "all 0.3s ease",
                      bgcolor: activeSection === "reviews" ? "#4ecdc4" : "transparent",
                      color: activeSection === "reviews" ? "white" : "inherit",
                      "& .MuiListItemIcon-root": {
                        color: activeSection === "reviews" ? "white" : "inherit",
                      },
                      "& .MuiListItemText-primary": {
                        color: activeSection === "reviews" ? "white" : "inherit",
                      },
                      "&:hover": {
                        bgcolor: activeSection === "reviews" ? "#44a9a3" : "rgba(78, 205, 196, 0.1)",
                        transform: "translateX(4px)",
                      },
                    }}
                  >
                    <ListItemIcon>
                      <Reviews />
                    </ListItemIcon>
                    <ListItemText primary="Reviews" />
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
            {activeSection === "dashboard" && renderDashboard()}
            {activeSection === "users" && renderUsers()}
            {activeSection === "pharmacies" && renderPharmacies()}
            {activeSection === "medications" && renderMedications()}
            {activeSection === "orders" && renderOrders()}
            {activeSection === "reviews" && renderReviews()}
          </Box>
        </Box>
      </Container>

      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>Confirm Delete</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete <strong>{deleteTarget.name}</strong>? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
          <Button onClick={confirmDelete} color="error" variant="contained" disabled={loading}>
            {loading ? "Deleting..." : "Delete"}
          </Button>
        </DialogActions>
      </Dialog>

      <Footer />
    </Box>
  );
};

export default Admin;

