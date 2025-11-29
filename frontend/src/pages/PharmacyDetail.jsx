import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Container,
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  Grid,
  TextField,
  Chip,
  IconButton,
  Rating,
  InputAdornment,
  Divider,
  Paper,
  Alert,
} from "@mui/material";
import ArrowBack from "@mui/icons-material/ArrowBack";
import LocalPharmacy from "@mui/icons-material/LocalPharmacy";
import Phone from "@mui/icons-material/Phone";
import Room from "@mui/icons-material/Room";
import Schedule from "@mui/icons-material/Schedule";
import Star from "@mui/icons-material/Star";
import SearchIcon from "@mui/icons-material/Search";
import Directions from "@mui/icons-material/Directions";
import Share from "@mui/icons-material/Share";
import Favorite from "@mui/icons-material/Favorite";
import FavoriteBorder from "@mui/icons-material/FavoriteBorder";
import Header from "../components/Header";
import Footer from "../components/Footer";
import ProductOrderDialog from "../components/ProductOrderDialog";
import {
  pharmacyAPI,
  medicationAPI,
  reviewAPI,
  userAPI,
} from "../services/api";

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
  }, [id]);

  const checkFavoriteStatus = async (userId) => {
    try {
      const response = await userAPI.getFavoritePharmacies(userId);
      const favoriteIds = response.data.favoritePharmacies.map(
        (p) => p._id || p
      );
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

      setPharmacy(pharmacyRes.data.pharmacy);
      setReviews(reviewsRes.data.reviews || []);

      // Fetch medications with city filter to get inventory for this pharmacy
      if (pharmacyRes.data.pharmacy?.address?.city) {
        const medicationsRes = await medicationAPI.getAll({
          city: pharmacyRes.data.pharmacy.address.city,
        });

        // Filter inventory to only show items from this pharmacy
        const pharmacyInventory = [];
        medicationsRes.data.results?.forEach((result) => {
          result.inventory?.forEach((inv) => {
            if (inv.pharmacy?._id === id || inv.pharmacy === id) {
              pharmacyInventory.push({
                ...inv,
                item: result.item,
              });
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

  const filteredInventory = inventory.filter((inv) => {
    const itemName = inv.item?.name || "";
    return itemName.toLowerCase().includes(searchQuery.toLowerCase());
  });

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

  return (
    <Box
      component="main"
      sx={{ bgcolor: "background.default", minHeight: "100vh" }}
    >
      <Header user={user} />

      <Container component="article" maxWidth="xl" sx={{ py: 5 }}>
        <Button
          startIcon={<ArrowBack />}
          onClick={() => navigate(-1)}
          sx={{ mb: 3, color: "text.primary" }}
        >
          Back to Results
        </Button>

        <Card component="header" sx={{ mb: 4, p: 4 }}>
          <Grid container spacing={4} alignItems="flex-start">
            <Grid item>
              <Box
                component="figure"
                sx={{
                  width: 120,
                  height: 120,
                  borderRadius: 4,
                  background:
                    "linear-gradient(135deg, #e0f7fa 0%, #b2ebf2 100%)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  m: 0,
                }}
              >
                <LocalPharmacy sx={{ fontSize: 64, color: "primary.main" }} />
              </Box>
            </Grid>

            <Grid item xs>
              <Box
                sx={{ display: "flex", justifyContent: "space-between", mb: 2 }}
              >
                <Typography
                  component="h1"
                  variant="h4"
                  fontWeight={700}
                  color="secondary"
                >
                  {pharmacy.name}
                </Typography>
                <IconButton
                  onClick={handleToggleFavorite}
                  sx={{ color: isFavorite ? "error.main" : "text.secondary" }}
                >
                  {isFavorite ? <Favorite /> : <FavoriteBorder />}
                </IconButton>
              </Box>

              <Chip
                label={pharmacy.isOpen ? "Open Now" : "Closed"}
                sx={{
                  bgcolor: pharmacy.isOpen ? "#c8e6c9" : "#ffcdd2",
                  color: pharmacy.isOpen ? "#2e7d32" : "#c62828",
                  fontWeight: 600,
                  mb: 2,
                }}
              />

              <Grid container spacing={3}>
                <Grid item xs={12} sm={6} md={3}>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <Room sx={{ color: "primary.main" }} />
                    <Box>
                      <Typography variant="body2" fontWeight={600}>
                        Location
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {pharmacy.address.street}, {pharmacy.address.city}
                      </Typography>
                    </Box>
                  </Box>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <Phone sx={{ color: "primary.main" }} />
                    <Box>
                      <Typography variant="body2" fontWeight={600}>
                        Phone
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {pharmacy.phone}
                      </Typography>
                    </Box>
                  </Box>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <Star sx={{ color: "primary.main" }} />
                    <Box>
                      <Typography variant="body2" fontWeight={600}>
                        Rating
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {pharmacy.averageRating?.toFixed(1) || "0.0"} (
                        {pharmacy.totalReviews || 0} reviews)
                      </Typography>
                    </Box>
                  </Box>
                </Grid>
              </Grid>
            </Grid>

            <Grid item>
              <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
                <Button
                  variant="contained"
                  startIcon={<Phone />}
                  onClick={() =>
                    (window.location.href = `tel:${pharmacy.phone}`)
                  }
                  sx={{
                    background:
                      "linear-gradient(135deg, #4ecdc4 0%, #44a9a3 100%)",
                  }}
                >
                  Call Pharmacy
                </Button>
                <Button
                  variant="outlined"
                  startIcon={<Directions />}
                  onClick={() => {
                    const coords = pharmacy.address.coordinates;
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
                  Get Directions
                </Button>
              </Box>
            </Grid>
          </Grid>
        </Card>

        <Grid container spacing={4}>
          <Grid item xs={12} md={8}>
            <Card sx={{ mb: 4 }}>
              <CardContent>
                <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
                  <LocalPharmacy sx={{ mr: 1, color: "primary.main" }} />
                  <Typography variant="h5" fontWeight={700}>
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
                  <Box
                    sx={{ display: "flex", flexDirection: "column", gap: 2 }}
                  >
                    {filteredInventory.map((inv) => (
                      <Paper
                        key={inv._id}
                        onClick={() => {
                          setSelectedProduct(inv);
                          setOrderDialogOpen(true);
                        }}
                        sx={{
                          p: 2,
                          border: "2px solid #f0f0f0",
                          transition: "all 0.3s",
                          cursor: "pointer",
                          "&:hover": {
                            borderColor: "primary.main",
                            bgcolor: "#f8fdfd",
                            transform: "translateY(-2px)",
                            boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                          },
                        }}
                      >
                        <Grid container spacing={2} alignItems="center">
                          <Grid item xs>
                            <Typography
                              variant="h6"
                              fontWeight={600}
                              color="secondary"
                            >
                              {inv.item?.name || "Unknown Item"}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              {inv.item?.category || ""} •{" "}
                              {inv.item?.dosage || "N/A"}
                            </Typography>
                          </Grid>
                          <Grid item sx={{ textAlign: "right" }}>
                            <Typography
                              variant="h6"
                              fontWeight={700}
                              color="primary.main"
                              mb={0.5}
                            >
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
                          </Grid>
                        </Grid>
                      </Paper>
                    ))}
                  </Box>
                )}
              </CardContent>
            </Card>

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
          </Grid>

          <Grid item xs={12} md={4}>
            <Card sx={{ mb: 3 }}>
              <CardContent>
                <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
                  <Room sx={{ mr: 1, color: "primary.main" }} />
                  <Typography variant="h6" fontWeight={700}>
                    Location
                  </Typography>
                </Box>
                <Box
                  sx={{
                    height: 250,
                    borderRadius: 3,
                    background:
                      "linear-gradient(135deg, #e0f7fa 0%, #b2ebf2 100%)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    mb: 2,
                  }}
                >
                  <Room sx={{ fontSize: 64, color: "primary.main" }} />
                </Box>
                <Button
                  fullWidth
                  variant="contained"
                  startIcon={<Directions />}
                  onClick={() => {
                    const coords = pharmacy.address.coordinates;
                    if (coords?.latitude && coords?.longitude) {
                      window.open(
                        `https://www.google.com/maps?q=${coords.latitude},${coords.longitude}`,
                        "_blank"
                      );
                    } else {
                      alert("Location coordinates not available");
                    }
                  }}
                  sx={{
                    background:
                      "linear-gradient(135deg, #4ecdc4 0%, #44a9a3 100%)",
                  }}
                >
                  Get Directions
                </Button>
              </CardContent>
            </Card>

            <Card sx={{ mb: 3 }}>
              <CardContent>
                <Typography variant="h6" fontWeight={700} mb={2}>
                  Contact Information
                </Typography>
                <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                  <Box
                    sx={{
                      display: "flex",
                      gap: 2,
                      p: 2,
                      bgcolor: "#f8f9fa",
                      borderRadius: 2,
                    }}
                  >
                    <Box
                      sx={{
                        width: 40,
                        height: 40,
                        borderRadius: 2,
                        background:
                          "linear-gradient(135deg, #4ecdc4 0%, #44a9a3 100%)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: "white",
                      }}
                    >
                      <Phone />
                    </Box>
                    <Box>
                      <Typography variant="body2" fontWeight={600}>
                        Phone
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {pharmacy.phone}
                      </Typography>
                    </Box>
                  </Box>
                  <Box
                    sx={{
                      display: "flex",
                      gap: 2,
                      p: 2,
                      bgcolor: "#f8f9fa",
                      borderRadius: 2,
                    }}
                  >
                    <Box
                      sx={{
                        width: 40,
                        height: 40,
                        borderRadius: 2,
                        background:
                          "linear-gradient(135deg, #4ecdc4 0%, #44a9a3 100%)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: "white",
                      }}
                    >
                      <Room />
                    </Box>
                    <Box>
                      <Typography variant="body2" fontWeight={600}>
                        Address
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {pharmacy.address.street}
                        <br />
                        {pharmacy.address.city}, Lebanon
                      </Typography>
                    </Box>
                  </Box>
                </Box>
              </CardContent>
            </Card>

            <Card>
              <CardContent>
                <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
                  <Schedule sx={{ mr: 1, color: "primary.main" }} />
                  <Typography variant="h6" fontWeight={700}>
                    Working Hours
                  </Typography>
                </Box>
                <Box
                  sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}
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
                        <Typography variant="body2" fontWeight={600}>
                          {wh.day}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {wh.isClosed
                            ? "Closed"
                            : `${wh.openTime || "N/A"} - ${
                                wh.closeTime || "N/A"
                              }`}
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
          </Grid>
        </Grid>
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
        onOrderSuccess={(order) => {
          // Optionally refresh inventory or show success message
          console.log("Order placed:", order);
        }}
      />

      <Footer />
    </Box>
  );
};

export default PharmacyDetail;
