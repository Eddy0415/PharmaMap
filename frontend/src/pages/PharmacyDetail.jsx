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
  Rating,
  TextField,
  Typography,
} from "@mui/material";
import ArrowBack from "@mui/icons-material/ArrowBack";
import Directions from "@mui/icons-material/Directions";
import Favorite from "@mui/icons-material/Favorite";
import FavoriteBorder from "@mui/icons-material/FavoriteBorder";
import LocalPharmacy from "@mui/icons-material/LocalPharmacy";
import Room from "@mui/icons-material/Room";
import SearchIcon from "@mui/icons-material/Search";
import Star from "@mui/icons-material/Star";
import Header from "../components/Header";
import Footer from "../components/Footer";
import ProductDetailsDialog from "../components/ProductDetailsDialog";
import { medicationAPI, pharmacyAPI, userAPI, orderAPI } from "../services/api";

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
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [detailsProduct, setDetailsProduct] = useState(null);
  const [productPharmacies, setProductPharmacies] = useState([]);
  const [requestStatus, setRequestStatus] = useState({});
  const [page, setPage] = useState(1);
  const pageSize = 12;

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
    if (!user?.id && !user?._id) {
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
    }
  };

  const filteredInventory = inventory.filter((inv) =>
    (inv.item?.name || "").toLowerCase().includes(searchQuery.toLowerCase())
  );
  const totalPages = Math.max(1, Math.ceil(filteredInventory.length / pageSize));
  const paginatedInventory = filteredInventory.slice(
    (page - 1) * pageSize,
    page * pageSize
  );

  const handlePageChange = (direction) => {
    setPage((prev) => {
      if (direction === "next") return Math.min(totalPages, prev + 1);
      return Math.max(1, prev - 1);
    });
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

  const collectPharmaciesForItem = async (itemName, itemId) => {
    const params = { inStock: "true" };
    if (itemName) params.search = itemName;
    const pharmaciesMap = new Map();
    try {
      const res = await medicationAPI.getAll(params);
      res.data.results?.forEach((result) => {
        const matchesId = itemId && (result.item?._id === itemId || result.item?.id === itemId);
        const matchesName =
          itemName &&
          (result.item?.name === itemName ||
            result.item?.name?.toLowerCase() === itemName.toLowerCase());
        if (!(matchesId || matchesName)) return;

        result.inventory?.forEach((inv) => {
          const phId = inv.pharmacy?._id || inv.pharmacy?.id || inv.pharmacy?.name || inv.pharmacy;
          if (!pharmaciesMap.has(phId)) {
            pharmaciesMap.set(phId, {
              pharmacy: inv.pharmacy,
              price: inv.price,
              quantity: inv.quantity,
              stockStatus: inv.stockStatus,
            });
          }
        });
      });
    } catch (error) {
      console.error("Error collecting pharmacies for item:", error);
    }
    return Array.from(pharmaciesMap.values());
  };

  const openDetails = async (inv) => {
    setDetailsProduct(inv);
    const phs = await collectPharmaciesForItem(inv.item?.name, inv.item?._id);
    setProductPharmacies(phs || []);
    setDetailsDialogOpen(true);
  };

  const handleRequestPharmacy = async (entry) => {
    const userId = user?.id || user?._id;
    if (!userId) {
      navigate("/login");
      return false;
    }
    try {
      setRequestStatus((prev) => ({ ...prev, [entry.pharmacy?._id || entry.pharmacy]: "sending" }));
      await orderAPI.create({
        customer: userId,
        pharmacy: entry.pharmacy?._id || entry.pharmacy,
        items: [
          {
            item: detailsProduct?.item?._id || detailsProduct?.item,
            quantity: 1,
          },
        ],
        customerNotes: "Medication request",
      });
      setRequestStatus((prev) => ({
        ...prev,
        [entry.pharmacy?._id || entry.pharmacy]: "sent",
      }));
      return true;
    } catch (error) {
      console.error("Error sending request:", error);
      setRequestStatus((prev) => ({
        ...prev,
        [entry.pharmacy?._id || entry.pharmacy]: undefined,
      }));
      return false;
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
          Back to Results
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
                    variant="outlined"
                    startIcon={<Directions />}
                    onClick={() => {
                      const coordsArray = pharmacy?.address?.coordinates?.coordinates;
                      if (coordsArray && Array.isArray(coordsArray) && coordsArray.length === 2) {
                        const [longitude, latitude] = coordsArray;
                        window.open(
                          `https://www.google.com/maps?q=${latitude},${longitude}`,
                          "_blank"
                        );
                      } else {
                        console.warn("Location coordinates not available");
                      }
                    }}
                  >
                    Get Directions
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
                  {/* Phone removed per request */}
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
          <Card sx={{ width: "100%", height: "100%" }}>
            <CardContent>
              <Typography variant="h6" fontWeight={800} mb={2}>
                Location
              </Typography>
              {pharmacy?.address?.coordinates?.coordinates &&
              Array.isArray(pharmacy.address.coordinates.coordinates) &&
              pharmacy.address.coordinates.coordinates.length === 2 ? (
                <Box
                  sx={{
                    height: 420,
                    borderRadius: 3,
                    overflow: "hidden",
                    width: "100%",
                    border: "1px solid #e0e0e0",
                  }}
                >
                  <iframe
                    width="100%"
                    height="100%"
                    style={{ border: 0 }}
                    loading="lazy"
                    allowFullScreen
                    referrerPolicy="no-referrer-when-downgrade"
                    src={`https://maps.google.com/maps?q=${
                      pharmacy.address.coordinates.coordinates[1]
                    },${pharmacy.address.coordinates.coordinates[0]}&hl=en&z=15&output=embed`}
                    title="Pharmacy Location"
                  />
                </Box>
              ) : (
                <Box
                  sx={{
                    height: 420,
                    borderRadius: 3,
                    background: "linear-gradient(135deg, #e0f7fa 0%, #b2ebf2 100%)",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    width: "100%",
                    gap: 2,
                  }}
                >
                  <Room sx={{ fontSize: 72, color: "primary.main" }} />
                  <Typography variant="body2" color="text.secondary">
                    Location coordinates not available
                  </Typography>
                </Box>
              )}
            </CardContent>
          </Card>

          <Card sx={{ width: "100%", height: "100%" }}>
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
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setPage(1);
            }}
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
                sx={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
                  gap: 3,
                  alignItems: "stretch",
                  gridAutoRows: 340, // <<< all rows same height
                }}
              >
                {paginatedInventory.map((inv) => (
                  <Card
                    key={inv._id}
                    sx={{
                      width: "100%",
                      height: "100%", // fills the 340px row
                      cursor: "pointer",
                      transition: "all 0.3s",
                      border: "2px solid transparent",
                      display: "flex",
                      flexDirection: "column",
                      "&:hover": {
                        transform: "translateY(-5px)",
                        boxShadow: "0 8px 24px rgba(0,0,0,0.12)",
                        borderColor: "primary.main",
                      },
                    }}
                    onClick={() => openDetails(inv)}
                  >
                    <Box
                      sx={{
                        height: 170,
                        background: "linear-gradient(135deg, #e0f7fa 0%, #b2ebf2 100%)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: 0,
                        overflow: "hidden",
                      }}
                    >
                      <LocalPharmacy sx={{ fontSize: 64, color: "primary.main" }} />
                    </Box>
                    <CardContent
                      sx={{
                        flexGrow: 1,
                        display: "flex",
                        flexDirection: "column",
                        justifyContent: "space-between",
                        pb: 3,
                        px: 2.5,
                        overflow: "hidden",
                      }}
                    >
                      <Typography variant="h6" fontWeight={600} color="secondary" mb={1}>
                        {inv.item?.name}
                      </Typography>
                      <Typography
                        variant="body2"
                        color="text.secondary"
                        mb={1}
                        display="flex"
                        alignItems="center"
                        gap={0.5}
                      >
                        <LocalPharmacy fontSize="small" sx={{ color: "primary.main" }} />
                        {inv.item?.category || "General"}
                      </Typography>
                      <Box sx={{ mt: "auto", display: "flex", alignItems: "center", gap: 1 }}>
                        <Chip
                          size="small"
                          label={`Stock: ${inv.quantity || 0}`}
                          sx={{ ...getStockStatusColor(inv.stockStatus), fontWeight: 600 }}
                        />
                        <Typography variant="body2" color="text.secondary">
                          {inv.item?.dosage || ""}
                        </Typography>
                      </Box>
                    </CardContent>
                  </Card>
                ))}
              </Box>
            )}
            {filteredInventory.length > pageSize && (
              <Box
                sx={{
                  mt: 3,
                  display: "flex",
                  justifyContent: "center",
                  gap: 2,
                  alignItems: "center",
                }}
              >
                <Button
                  variant="outlined"
                  onClick={() => handlePageChange("prev")}
                  disabled={page === 1}
                >
                  Previous
                </Button>
                <Typography variant="body2" color="text.secondary">
                  Page {page} of {totalPages}
                </Typography>
                <Button
                  variant="outlined"
                  onClick={() => handlePageChange("next")}
                  disabled={page === totalPages}
                >
                  Next
                </Button>
              </Box>
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
              reviews.slice(0, 10).map((review, idx) => (
                <Box
                  key={review._id}
                  sx={{
                    mb: 3,
                    pb: 3,
                    borderBottom: idx !== reviews.length - 1 ? "1px solid #e0e0e0" : "none",
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
                        {review.user?.firstName || "Anonymous User"} {review.user?.lastName || ""}
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

      <ProductDetailsDialog
        open={detailsDialogOpen}
        onClose={() => {
          setDetailsDialogOpen(false);
          setDetailsProduct(null);
          setProductPharmacies([]);
        }}
        product={detailsProduct}
        pharmacies={productPharmacies}
        onSelectPharmacy={(pharmacy) =>
          navigate(`/pharmacy/${pharmacy._id || pharmacy.id || pharmacy}`)
        }
        onRequestPharmacy={handleRequestPharmacy}
      />

      <Footer />
    </Box>
  );
};

export default PharmacyDetail;
