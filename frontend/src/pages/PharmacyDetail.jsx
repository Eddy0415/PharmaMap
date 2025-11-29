import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Container,
  Grid,
  IconButton,
  InputAdornment,
  Paper,
  Rating,
  TextField,
  Typography,
} from "@mui/material";
import ArrowBack from "@mui/icons-material/ArrowBack";
import Directions from "@mui/icons-material/Directions";
import Favorite from "@mui/icons-material/Favorite";
import FavoriteBorder from "@mui/icons-material/FavoriteBorder";
import LocalPharmacy from "@mui/icons-material/LocalPharmacy";
import Phone from "@mui/icons-material/Phone";
import Room from "@mui/icons-material/Room";
import SearchIcon from "@mui/icons-material/Search";
import Star from "@mui/icons-material/Star";
import Header from "../components/Header";
import Footer from "../components/Footer";
import ProductOrderDialog from "../components/ProductOrderDialog";
import { medicationAPI, pharmacyAPI, userAPI } from "../services/api";

const PharmacyDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [user, setUser] = useState(null);
  const [pharmacy, setPharmacy] = useState(null);
  const [inventory, setInventory] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [isFavorite, setIsFavorite] = useState(false);
  const [orderDialogOpen, setOrderDialogOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      const userData = JSON.parse(storedUser);
      setUser(userData);
      if (userData.id) {
        checkFavoriteStatus(userData.id);
      }
    }
    fetchPharmacyDetails();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const checkFavoriteStatus = async (userId) => {
    try {
      const response = await userAPI.getFavoritePharmacies(userId);
      const favoriteIds = response.data.favoritePharmacies.map((p) => p._id || p);
      setIsFavorite(favoriteIds.includes(id));
    } catch (error) {
      console.error("Error checking favorite status:", error);
    }
  };

  const fetchPharmacyDetails = async () => {
    setLoading(true);
    try {
      const [pharmacyRes, reviewsRes] = await Promise.all([
        pharmacyAPI.getById(id),
        pharmacyAPI.getReviews(id),
      ]);

      const pharmacyData = pharmacyRes?.data?.pharmacy;
      if (!pharmacyData) throw new Error("Pharmacy not found");

      setPharmacy(pharmacyData);
      setReviews(reviewsRes.data.reviews || []);

      const city = pharmacyData?.address?.city;
      if (city) {
        const medicationsRes = await medicationAPI.getAll({ city });
        const pharmacyInventory = [];

        medicationsRes.data.results?.forEach((result) => {
          result.inventory?.forEach((inv) => {
            if (inv.pharmacy?._id === id || inv.pharmacy === id) {
              pharmacyInventory.push({ ...inv, item: result.item });
            }
          });
        });

        setInventory(pharmacyInventory);
      }
    } catch (error) {
      console.error("Error fetching pharmacy details:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleFavorite = async () => {
    if (!user?.id) {
      alert("Please login to add favorites");
      return;
    }
    try {
      if (isFavorite) {
        await userAPI.removeFavoritePharmacy(user.id, id);
        setIsFavorite(false);
      } else {
        await userAPI.addFavoritePharmacy(user.id, id);
        setIsFavorite(true);
      }
    } catch (error) {
      console.error("Error toggling favorite:", error);
      alert("Failed to update favorite");
    }
  };

  const filteredInventory = inventory.filter((inv) =>
    (inv.item?.name || "").toLowerCase().includes(searchQuery.toLowerCase())
  );

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

  if (loading) {
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

  if (!pharmacy) {
    return (
      <Box sx={{ bgcolor: "background.default", minHeight: "100vh" }}>
        <Header user={user} />
        <Container maxWidth="xl" sx={{ py: 5 }}>
          <Typography>Pharmacy not found</Typography>
        </Container>
        <Footer />
      </Box>
    );
  }

  const address = pharmacy.address || {};
  const coords = address.coordinates || {};

  return (
    <Box component="main" sx={{ bgcolor: "background.default", minHeight: "100vh" }}>
      <Header user={user} />

      <Container component="article" maxWidth="xl" sx={{ py: 5 }}>
        <Button
          startIcon={<ArrowBack />}
          onClick={() => navigate(-1)}
          sx={{ mb: 3, color: "text.primary" }}
        >
          Back
        </Button>

        {/* Hero strip */}
        <Card sx={{ mb: 4, p: { xs: 3, md: 4 } }}>
          <Grid container spacing={3} alignItems="center">
            <Grid item>
              <Box
                sx={{
                  width: 120,
                  height: 120,
                  borderRadius: 4,
                  background: "linear-gradient(135deg, #e0f7fa 0%, #b2ebf2 100%)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <LocalPharmacy sx={{ fontSize: 64, color: "primary.main" }} />
              </Box>
            </Grid>

            <Grid item xs>
              <Box
                sx={{
                  display: "flex",
                  flexWrap: "wrap",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: 2,
                  mb: 1,
                }}
              >
                <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, flexWrap: "wrap" }}>
                  <Typography variant="h4" fontWeight={800} color="secondary">
                    {pharmacy.name}
                  </Typography>
                  <Chip
                    label={pharmacy.isOpen ? "Open Now" : "Closed"}
                    sx={{
                      bgcolor: pharmacy.isOpen ? "#c8e6c9" : "#ffcdd2",
                      color: pharmacy.isOpen ? "#2e7d32" : "#c62828",
                      fontWeight: 700,
                    }}
                  />
                  <IconButton
                    onClick={handleToggleFavorite}
                    sx={{ color: isFavorite ? "error.main" : "text.secondary" }}
                  >
                    {isFavorite ? <Favorite /> : <FavoriteBorder />}
                  </IconButton>
                </Box>

                <Box sx={{ display: "flex", gap: 1 }}>
                  <Button
                    variant="contained"
                    startIcon={<Phone />}
                    onClick={() => (window.location.href = `tel:${pharmacy.phone}`)}
                    sx={{
                      background: "linear-gradient(135deg, #4ecdc4 0%, #44a9a3 100%)",
                      boxShadow: "0 6px 16px rgba(78,205,196,0.35)",
                    }}
                  >
                    Call pharmacy
                  </Button>
                  <Button
                    variant="outlined"
                    startIcon={<Directions />}
                    onClick={() => {
                      if (coords?.latitude && coords?.longitude) {
                        window.open(
                          `https://www.google.com/maps?q=${coords.latitude},${coords.longitude}`,
                          "_blank"
                        );
                      } else {
                        alert("Location coordinates not available");
                      }
                    }}
                  >
                    Get directions
                  </Button>
                </Box>
              </Box>

              <Grid container spacing={2}>
                <Grid item xs={12} sm={4}>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <Room sx={{ color: "primary.main" }} />
                    <Typography variant="body1" color="text.secondary">
                      {address.street || "Address not available"}, {address.city || ""}
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={12} sm={4}>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <Phone sx={{ color: "primary.main" }} />
                    <Typography variant="body1" color="text.secondary">
                      {pharmacy.phone || "N/A"}
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={12} sm={4}>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <Star sx={{ color: "primary.main" }} />
                    <Typography variant="body1" color="text.secondary">
                      {pharmacy.averageRating?.toFixed(1) || "0.0"} (
                      {pharmacy.totalReviews || 0} reviews)
                    </Typography>
                  </Box>
                </Grid>
              </Grid>
            </Grid>
          </Grid>
        </Card>

        {/* Location + Working hours row */}
        <Box
          sx={{
            mb: 4,
            display: "grid",
            gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" },
            gap: 3,
          }}
        >
          <Card sx={{ height: "100%" }}>
            <CardContent>
              <Typography variant="h6" fontWeight={800} mb={2}>
                Location
              </Typography>
              <Box
                sx={{
                  height: 420,
                  borderRadius: 3,
                  background: "linear-gradient(135deg, #e0f7fa 0%, #b2ebf2 100%)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  width: "100%",
                }}
              >
                <Room sx={{ fontSize: 72, color: "primary.main" }} />
              </Box>
            </CardContent>
          </Card>

          <Card sx={{ height: "100%" }}>
            <CardContent>
              <Typography variant="h6" fontWeight={800} mb={2}>
                Working Hours
              </Typography>
              <Box
                sx={{
                  display: "flex",
                  flexDirection: "column",
                  gap: 1.5,
                  minHeight: 420,
                  justifyContent: "flex-start",
                  width: "100%",
                }}
              >
                {pharmacy.workingHours && pharmacy.workingHours.length > 0 ? (
                  pharmacy.workingHours.map((wh) => (
                    <Box
                      key={wh.day}
                      sx={{
                        display: "flex",
                        justifyContent: "space-between",
                        p: 1.5,
                        bgcolor: "#f8f9fa",
                        borderRadius: 2,
                      }}
                    >
                      <Typography variant="body2" fontWeight={700}>
                        {wh.day}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {wh.isClosed
                          ? "Closed"
                          : `${wh.openTime || "N/A"} - ${wh.closeTime || "N/A"}`}
                      </Typography>
                    </Box>
                  ))
                ) : (
                  <Typography variant="body2" color="text.secondary">
                    Working hours not available
                  </Typography>
                )}
              </Box>
            </CardContent>
          </Card>
        </Box>

        {/* Available medications row */}
        <Card sx={{ mb: 4 }}>
          <CardContent>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}>
              <LocalPharmacy sx={{ color: "primary.main" }} />
              <Typography variant="h5" fontWeight={800}>
                Available Medications
              </Typography>
            </Box>

            <TextField
              fullWidth
              placeholder="Search in this pharmacy..."
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
              <Alert severity="info">No medications found</Alert>
            ) : (
              <Grid container spacing={2}>
                {filteredInventory.map((inv) => (
                  <Grid item xs={12} sm={6} md={4} lg={3} key={inv._id}>
                    <Paper
                      onClick={() => {
                        setSelectedProduct(inv);
                        setOrderDialogOpen(true);
                      }}
                      sx={{
                        p: 2,
                        height: "100%",
                        border: "2px solid #f0f0f0",
                        transition: "all 0.3s",
                        cursor: "pointer",
                        display: "flex",
                        flexDirection: "column",
                        gap: 1,
                        "&:hover": {
                          borderColor: "primary.main",
                          bgcolor: "#f8fdfd",
                          transform: "translateY(-2px)",
                          boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                        },
                      }}
                    >
                      <Typography variant="h6" fontWeight={700} color="secondary">
                        {inv.item?.name || "Unknown Item"}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {inv.item?.category || ""} • {inv.item?.dosage || "N/A"}
                      </Typography>
                      <Box
                        sx={{
                          mt: "auto",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                        }}
                      >
                        <Typography variant="h6" fontWeight={700} color="primary.main">
                          ${inv.price?.toFixed(2) || "0.00"}
                        </Typography>
                        <Chip
                          label={`Stock: ${inv.quantity || 0} units`}
                          size="small"
                          sx={{
                            ...getStockStatusColor(inv.stockStatus),
                            fontWeight: 600,
                          }}
                        />
                      </Box>
                    </Paper>
                  </Grid>
                ))}
              </Grid>
            )}
          </CardContent>
        </Card>

        {/* Reviews */}
        <Card>
          <CardContent>
            <Box sx={{ display: "flex", alignItems: "center", mb: 3 }}>
              <Star sx={{ mr: 1, color: "primary.main" }} />
              <Typography variant="h5" fontWeight={700}>
                Reviews & Ratings
              </Typography>
            </Box>

            <Box
              sx={{
                display: "flex",
                gap: 3,
                p: 3,
                bgcolor: "#f8f9fa",
                borderRadius: 3,
                mb: 3,
              }}
            >
              <Typography variant="h2" fontWeight={700} color="secondary">
                {pharmacy.averageRating?.toFixed(1) || "0.0"}
              </Typography>
              <Box>
                <Rating
                  value={pharmacy.averageRating || 0}
                  precision={0.1}
                  readOnly
                  size="large"
                />
                <Typography variant="body2" color="text.secondary">
                  Based on {pharmacy.totalReviews || 0} reviews
                </Typography>
              </Box>
            </Box>

            {reviews.length === 0 ? (
              <Alert severity="info">No reviews yet</Alert>
            ) : (
              reviews.slice(0, 10).map((review) => (
                <Box
                  key={review._id}
                  sx={{
                    mb: 3,
                    pb: 3,
                    borderBottom:
                      review !== reviews[reviews.length - 1]
                        ? "1px solid #e0e0e0"
                        : "none",
                  }}
                >
                  <Box
                    sx={{
                      display: "flex",
                      justifyContent: "space-between",
                      mb: 1,
                    }}
                  >
                    <Box>
                      <Typography variant="subtitle1" fontWeight={600}>
                        {review.user?.firstName || "Anonymous User"}{" "}
                        {review.user?.lastName || ""}
                      </Typography>
                      <Rating value={review.rating} readOnly size="small" />
                    </Box>
                    <Typography variant="caption" color="text.secondary">
                      {new Date(review.createdAt).toLocaleDateString()}
                    </Typography>
                  </Box>
                  {review.comment && (
                    <Typography variant="body2" color="text.secondary">
                      {review.comment}
                    </Typography>
                  )}
                </Box>
              ))
            )}
          </CardContent>
        </Card>
      </Container>

      <ProductOrderDialog
        open={orderDialogOpen}
        onClose={() => {
          setOrderDialogOpen(false);
          setSelectedProduct(null);
        }}
        product={selectedProduct}
        pharmacy={pharmacy}
        user={user}
        onOrderSuccess={() => {
          // handle success if needed (e.g. show toast, refetch inventory, etc.)
        }}
      />

      <Footer />
    </Box>
  );
};

export default PharmacyDetail;