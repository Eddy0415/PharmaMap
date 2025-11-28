import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Container,
  Box,
  Typography,
  Card,
  CardContent,
  IconButton,
  Chip,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Grid,
  Divider,
  Paper,
} from "@mui/material";
import {
  ArrowBackIos,
  ArrowForwardIos,
  Spa,
  Favorite,
  LocalPharmacy,
  PanTool,
  Bloodtype,
  Masks,
  AcUnit,
  HealthAndSafety,
  Elderly,
  ShieldMoon,
  TrendingUp,
  Close,
  Info,
} from "@mui/icons-material";
import Header from "../components/Header";
import Footer from "../components/Footer";
import { pharmacyAPI, medicationAPI } from "../services/api";

const carouselSlides = [
  {
    image:
      "https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=1200&h=450&fit=crop",
    title: "Find Your Medication Instantly",
    description: "Check availability across multiple pharmacies in Lebanon",
  },
  {
    image:
      "https://images.unsplash.com/photo-1587854692152-cbe660dbde88?w=1200&h=450&fit=crop",
    title: "Trusted Pharmacy Network",
    description: "Connected with hundreds of verified pharmacies",
  },
  {
    image:
      "https://images.unsplash.com/photo-1631549916768-4119b2e5f926?w=1200&h=450&fit=crop",
    title: "Save Time & Money",
    description: "Compare prices and find the nearest available pharmacy",
  },
  {
    image:
      "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=1200&h=450&fit=crop",
    title: "24/7 Availability",
    description: "Find pharmacies open around the clock near you",
  },
  {
    image:
      "https://images.unsplash.com/photo-1551601651-2a8555f1a136?w=1200&h=450&fit=crop",
    title: "Premium Quality Guaranteed",
    description: "All pharmacies verified for quality and authenticity",
  },
  {
    image:
      "https://images.unsplash.com/photo-1516549655169-df83a0774514?w=1200&h=450&fit=crop",
    title: "Reserve & pick up",
    description: "Ready for you when you arrive",
  },
];

const categories = [
  { name: "Derma Products", icon: Spa },
  { name: "Cardiac Care", icon: Favorite },
  { name: "Stomach Care", icon: LocalPharmacy },
  { name: "Pain Relief", icon: PanTool },
  { name: "Liver Care", icon: Bloodtype },
  { name: "Oral Care", icon: Masks },
  { name: "Respiratory", icon: AcUnit },
  { name: "Sexual Health", icon: HealthAndSafety },
  { name: "Elderly Care", icon: Elderly },
  { name: "Cold & Immunity", icon: ShieldMoon },
];

const Home = () => {
  const navigate = useNavigate();
  const [currentSlide, setCurrentSlide] = useState(0);
  const [user, setUser] = useState(null);
  const [popularProducts, setPopularProducts] = useState([]);
  const [featuredPharmacies, setFeaturedPharmacies] = useState([]);
  const [productDialogOpen, setProductDialogOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [productDetails, setProductDetails] = useState(null);

  useEffect(() => {
    // Load user from localStorage
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }

    // Fetch popular products
    fetchPopularProducts();

    // Fetch featured pharmacies
    fetchFeaturedPharmacies();

    // Auto-advance carousel
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % carouselSlides.length);
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  const fetchPopularProducts = async () => {
    try {
      const response = await medicationAPI.getTopSearched();
      const products = response.data.items?.slice(0, 5) || [];

      // Fallback popular products in Lebanon if API fails or returns empty
      const fallbackProducts = [
        { name: "Panadol", searchCount: 10000, category: "Pain Relief" },
        { name: "Advil", searchCount: 5000, category: "Pain Relief" },
        { name: "Aspirin", searchCount: 3000, category: "Pain Relief" },
        { name: "Brufen", searchCount: 2500, category: "Pain Relief" },
        { name: "Paracetamol", searchCount: 4000, category: "Pain Relief" },
      ];

      // Merge API data with fallback data
      const mergedProducts =
        products.length > 0
          ? products.map((product, index) => ({
              ...product,
              searchCount:
                product.searchCount ||
                fallbackProducts[index]?.searchCount ||
                0,
            }))
          : fallbackProducts.map((p) => ({
              ...p,
              _id: p.name.toLowerCase().replace(/\s/g, "-"),
            }));

      setPopularProducts(mergedProducts.slice(0, 5));
    } catch (error) {
      console.error("Error fetching popular products:", error);
      // Use fallback products on error
      const fallbackProducts = [
        {
          name: "Panadol",
          searchCount: 10000,
          category: "Pain Relief",
          _id: "panadol",
        },
        {
          name: "Advil",
          searchCount: 5000,
          category: "Pain Relief",
          _id: "advil",
        },
        {
          name: "Aspirin",
          searchCount: 3000,
          category: "Pain Relief",
          _id: "aspirin",
        },
        {
          name: "Brufen",
          searchCount: 2500,
          category: "Pain Relief",
          _id: "brufen",
        },
        {
          name: "Paracetamol",
          searchCount: 4000,
          category: "Pain Relief",
          _id: "paracetamol",
        },
      ];
      setPopularProducts(fallbackProducts);
    }
  };

  const fetchFeaturedPharmacies = async () => {
    try {
      const response = await pharmacyAPI.getFeatured();
      const pharmacies = response.data.pharmacies?.slice(0, 5) || [];

      // Fallback featured pharmacies in Lebanon if API fails or returns empty
      const fallbackPharmacies = [
        {
          name: "Al Rahbani Pharmacy",
          motto: "We strive to help",
          city: "Beirut",
        },
        {
          name: "Maen Pharmacy",
          motto: "Your health is our priority",
          city: "Beirut",
        },
        { name: "Rallan Pharmacy", motto: "Caring for you", city: "Beirut" },
        {
          name: "Salam Pharmacy",
          motto: "Quality care, quality service",
          city: "Tripoli",
        },
        {
          name: "Al Hayat Pharmacy",
          motto: "Your trusted health partner",
          city: "Sidon",
        },
      ];

      // Merge API data with fallback data
      const mergedPharmacies =
        pharmacies.length > 0
          ? pharmacies.map((pharmacy, index) => ({
              ...pharmacy,
              motto:
                pharmacy.motto ||
                pharmacy.tagline ||
                fallbackPharmacies[index]?.motto ||
                "",
            }))
          : fallbackPharmacies.map((p) => ({
              ...p,
              _id: p.name.toLowerCase().replace(/\s/g, "-"),
              address: { city: p.city },
              isOpen: true,
            }));

      setFeaturedPharmacies(mergedPharmacies.slice(0, 5));
    } catch (error) {
      console.error("Error fetching featured pharmacies:", error);
      // Use fallback pharmacies on error
      const fallbackPharmacies = [
        {
          name: "Al Rahbani Pharmacy",
          motto: "We strive to help",
          city: "Beirut",
          _id: "al-rahbani",
          address: { city: "Beirut" },
          isOpen: true,
        },
        {
          name: "Maen Pharmacy",
          motto: "Your health is our priority",
          city: "Beirut",
          _id: "maen",
          address: { city: "Beirut" },
          isOpen: true,
        },
        {
          name: "Rallan Pharmacy",
          motto: "Caring for you",
          city: "Beirut",
          _id: "rallan",
          address: { city: "Beirut" },
          isOpen: true,
        },
        {
          name: "Salam Pharmacy",
          motto: "Quality care, quality service",
          city: "Tripoli",
          _id: "salam",
          address: { city: "Tripoli" },
          isOpen: true,
        },
        {
          name: "Al Hayat Pharmacy",
          motto: "Your trusted health partner",
          city: "Sidon",
          _id: "al-hayat",
          address: { city: "Sidon" },
          isOpen: true,
        },
      ];
      setFeaturedPharmacies(fallbackPharmacies);
    }
  };

  const handlePrevSlide = () => {
    setCurrentSlide(
      (prev) => (prev - 1 + carouselSlides.length) % carouselSlides.length
    );
  };

  const handleNextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % carouselSlides.length);
  };

  const handleCategoryClick = (categoryName) => {
    medicationAPI.getByCategory(categoryName).then((response) => {
      console.log(response.data);
    });
    navigate(`/search?category=${encodeURIComponent(categoryName)}`);
  };

  const handleProductClick = async (product) => {
    setSelectedProduct(product);
    setProductDialogOpen(true);
    try {
      const response = await medicationAPI.getAll({ search: product.name });
      if (response.data.results && response.data.results.length > 0) {
        const productData = response.data.results[0];
        setProductDetails({
          ...productData,
          searchCount: product.searchCount,
        });
      } else {
        setProductDetails({
          ...product,
          description: "Product information not available",
        });
      }
    } catch (error) {
      console.error("Error fetching product details:", error);
      setProductDetails({
        ...product,
        description: "Unable to load product details",
      });
    }
  };

  const handleCloseProductDialog = () => {
    setProductDialogOpen(false);
    setSelectedProduct(null);
    setProductDetails(null);
  };

  return (
    <Box
      component="main"
      sx={{
        bgcolor: "background.default",
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <Header user={user} />

      {/* Hero Carousel */}
      <Box
        component="section"
        aria-label="Featured content carousel"
        sx={{
          position: "relative",
          width: "100%",
          height: {
            xs: "calc(100vh - 64px)",
            sm: "calc(100vh - 64px)",
            md: "calc(100vh - 64px)",
          },
          minHeight: 620,
          overflow: "hidden",
          mb: 0,
          borderRadius: 0,
        }}
      >
        {carouselSlides.map((slide, index) => (
          <Box
            key={index}
            sx={{
              position: "absolute",
              inset: 0,
              opacity: currentSlide === index ? 1 : 0,
              transition: "opacity 0.6s ease, transform 12s ease",
              transform: currentSlide === index ? "scale(1.03)" : "scale(1)",
              backgroundImage: `url(${slide.image})`,
              backgroundSize: "cover",
              backgroundPosition: "center",
              filter: "brightness(0.9)",
            }}
          />
        ))}

        <Box
          sx={{
            position: "absolute",
            inset: 0,
            background:
              "linear-gradient(120deg, rgba(0,0,0,0.65) 0%, rgba(0,0,0,0.35) 55%, rgba(0,0,0,0.15) 100%)",
            zIndex: 1,
          }}
        />

        <Box
          sx={{
            position: "absolute",
            top: { xs: "35%", md: "50%" },
            left: { xs: "6%", sm: "8%", md: "6%" },
            transform: "translateY(-50%)",
            color: "common.white",
            zIndex: 2,
            maxWidth: { xs: "88%", sm: "72%", md: "46%" },
          }}
        >
          <Typography
            variant="h3"
            fontWeight={800}
            sx={{
              fontSize: { xs: "2rem", sm: "2.6rem", md: "3.2rem" },
              textShadow: "2px 2px 10px rgba(0,0,0,0.55)",
              mb: 1.5,
            }}
          >
            Fast access to the medicine you need.
          </Typography>
          <Typography
            variant="h6"
            sx={{
              fontSize: { xs: "1.05rem", sm: "1.2rem", md: "1.35rem" },
              lineHeight: 1.5,
              maxWidth: 640,
              opacity: 0.9,
              mb: 3,
            }}
          >
            We scan trusted pharmacies around you so you can reserve what you
            need before stepping out the door.
          </Typography>
          <Box sx={{ display: "flex", gap: 2, alignItems: "center" }}>
            <Button
              variant="outlined"
              size="large"
              onClick={() => navigate("/search")}
              sx={{
                color: "common.white",
                borderColor: "rgba(255,255,255,0.85)",
                px: 3,
                py: 1,
                fontWeight: 700,
                letterSpacing: 0.5,
                "&:hover": {
                  bgcolor: "common.white",
                  color: "primary.main",
                  borderColor: "common.white",
                },
              }}
            >
              Start a search
            </Button>
            <Chip
              icon={<TrendingUp sx={{ color: "inherit" }} />}
              label="Live availability checks"
              sx={{
                bgcolor: "rgba(255,255,255,0.18)",
                color: "white",
                border: "1px solid rgba(255,255,255,0.35)",
                fontWeight: 700,
                "& .MuiChip-icon": { color: "white" },
              }}
            />
          </Box>
        </Box>

        <Card
          sx={{
            position: "absolute",
            bottom: { xs: 16, sm: 28, md: 42 },
            right: { xs: 16, sm: 28, md: 64 },
            width: { xs: "82%", sm: 360, md: 400 },
            zIndex: 3,
            backdropFilter: "blur(10px)",
            backgroundColor: "rgba(255,255,255,0.12)",
            border: "1px solid rgba(255,255,255,0.25)",
            color: "white",
            boxShadow: "0 20px 60px rgba(0,0,0,0.45)",
          }}
          elevation={0}
        >
          <CardContent sx={{ pb: 3 }}>
            <Typography
              variant="subtitle2"
              sx={{ textTransform: "uppercase", letterSpacing: 1.1, mb: 1 }}
            >
              Featured highlight
            </Typography>
            <Typography variant="h6" fontWeight={800} mb={1}>
              {carouselSlides[currentSlide].title}
            </Typography>
            <Typography variant="body2" sx={{ opacity: 0.85 }}>
              {carouselSlides[currentSlide].description}
            </Typography>
          </CardContent>
        </Card>

        <Box
          sx={{
            position: "absolute",
            bottom: 16,
            left: "50%",
            transform: "translateX(-50%)",
            display: "flex",
            gap: 1.2,
            zIndex: 3,
          }}
        >
          {carouselSlides.map((_, index) => (
            <Box
              key={index}
              onClick={() => setCurrentSlide(index)}
              sx={{
                width: currentSlide === index ? 34 : 12,
                height: 12,
                borderRadius: 999,
                bgcolor:
                  currentSlide === index
                    ? "common.white"
                    : "rgba(255,255,255,0.55)",
                cursor: "pointer",
                transition: "all 0.3s",
                boxShadow:
                  currentSlide === index
                    ? "0 8px 20px rgba(0,0,0,0.35)"
                    : "none",
              }}
            />
          ))}
        </Box>
      </Box>

      <Container component="section" maxWidth="xl" sx={{ pt: 4, pb: 5 }}>
        {/* Categories Section */}
        <Typography
          component="h2"
          variant="h4"
          fontWeight={700}
          color="secondary"
          mb={3}
          sx={{ position: "relative", pl: 2 }}
        >
          <Box
            component="span"
            sx={{
              position: "absolute",
              left: 0,
              top: 0,
              bottom: 0,
              width: 5,
              bgcolor: "primary.main",
              borderRadius: 1,
            }}
          />
          Browse by Categories
        </Typography>
        <Box
          component="nav"
          aria-label="Medication categories"
          sx={{
            display: "flex",
            flexWrap: "wrap",
            gap: 2.5,
            mb: 6,
            "& > *": {
              flex: "1 1 calc(20% - 20px)",
              minWidth: "150px",
              "@media (max-width: 900px)": {
                flex: "1 1 calc(33.333% - 20px)",
              },
              "@media (max-width: 600px)": {
                flex: "1 1 calc(50% - 20px)",
              },
            },
          }}
        >
          {categories.map((category, index) => {
            const Icon = category.icon;
            return (
              <Card
                key={index}
                onClick={() => handleCategoryClick(category.name)}
                sx={{
                  width: "100%",
                  height: 180,
                  p: 3,
                  textAlign: "center",
                  cursor: "pointer",
                  border: "3px solid #e0e0e0",
                  transition: "all 0.3s",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "center",
                  alignItems: "center",
                  "&:hover": {
                    background:
                      "linear-gradient(135deg, #4ecdc4 0%, #44a9a3 100%)",
                    borderColor: "#4ecdc4",
                    transform: "translateY(-5px)",
                    boxShadow: "0 8px 24px rgba(78, 205, 196, 0.3)",
                    "& .MuiSvgIcon-root": { color: "white" },
                    "& .MuiTypography-root": { color: "white" },
                  },
                }}
              >
                <Icon sx={{ fontSize: 48, color: "primary.main", mb: 1.5 }} />
                <Typography variant="body1" fontWeight={600} color="secondary">
                  {category.name}
                </Typography>
              </Card>
            );
          })}
        </Box>

        {/* Popular Products Section */}
        <Typography
          component="h2"
          variant="h4"
          fontWeight={700}
          color="secondary"
          mb={3}
          sx={{ position: "relative", pl: 2 }}
        >
          <Box
            component="span"
            sx={{
              position: "absolute",
              left: 0,
              top: 0,
              bottom: 0,
              width: 5,
              bgcolor: "primary.main",
              borderRadius: 1,
            }}
          />
          Popular Products
        </Typography>
        <Typography
          variant="body2"
          color="text.secondary"
          mb={3}
          sx={{ pl: 2, fontStyle: "italic" }}
        >
          Top 5 most requested (searched) products last month (updates every
          month)
        </Typography>
        <Box
          component="section"
          aria-label="Popular medications"
          sx={{
            display: "flex",
            flexWrap: "wrap",
            gap: 2.5,
            mb: 6,
            "& > *": {
              flex: "1 1 calc(20% - 20px)",
              minWidth: "150px",
              "@media (max-width: 900px)": {
                flex: "1 1 calc(33.333% - 20px)",
              },
              "@media (max-width: 600px)": {
                flex: "1 1 calc(50% - 20px)",
              },
            },
          }}
        >
          {popularProducts.slice(0, 5).map((product) => {
            const searchCount = product.searchCount || 0;
            const formattedCount =
              searchCount >= 1000
                ? `+${(searchCount / 1000).toFixed(
                    searchCount % 1000 === 0 ? 0 : 1
                  )}k`
                : `+${searchCount}`;

            return (
              <Card
                key={product._id || product.name}
                sx={{
                  width: "100%",
                  height: 280,
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
                onClick={() =>
                  navigate(`/search?q=${encodeURIComponent(product.name)}`)
                }
              >
                <Box
                  sx={{
                    position: "relative",
                    height: 150,
                    background:
                      "linear-gradient(135deg, #e0f7fa 0%, #b2ebf2 100%)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                  }}
                >
                  <LocalPharmacy sx={{ fontSize: 64, color: "primary.main" }} />
                  <IconButton
                    onClick={(e) => {
                      e.stopPropagation();
                      handleProductClick(product);
                    }}
                    sx={{
                      position: "absolute",
                      top: 8,
                      right: 8,
                      bgcolor: "rgba(255, 255, 255, 0.9)",
                      "&:hover": {
                        bgcolor: "rgba(255, 255, 255, 1)",
                        transform: "scale(1.1)",
                      },
                      transition: "all 0.2s",
                      boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
                    }}
                    size="small"
                    aria-label="Product information"
                  >
                    <Info sx={{ fontSize: 20, color: "primary.main" }} />
                  </IconButton>
                </Box>
                <CardContent
                  sx={{ flexGrow: 1, display: "flex", flexDirection: "column" }}
                >
                  <Typography
                    variant="h6"
                    fontWeight={600}
                    color="secondary"
                    mb={1}
                  >
                    {product.name}
                  </Typography>
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    mb={1}
                    display="flex"
                    alignItems="center"
                    gap={0.5}
                  >
                    <LocalPharmacy
                      fontSize="small"
                      sx={{ color: "primary.main" }}
                    />
                    {product.category || "General"}
                  </Typography>
                  <Typography
                    variant="body2"
                    color="primary.main"
                    fontWeight={600}
                    display="flex"
                    alignItems="center"
                    gap={0.5}
                    sx={{ mt: 1 }}
                  >
                    <TrendingUp fontSize="small" />
                    {formattedCount} searches last month
                  </Typography>
                </CardContent>
              </Card>
            );
          })}
        </Box>

        {/* Featured Pharmacies Section */}
        <Typography
          component="h2"
          variant="h4"
          fontWeight={700}
          color="secondary"
          mb={3}
          sx={{ position: "relative", pl: 2 }}
        >
          <Box
            component="span"
            sx={{
              position: "absolute",
              left: 0,
              top: 0,
              bottom: 0,
              width: 5,
              bgcolor: "primary.main",
              borderRadius: 1,
            }}
          />
          Featured Pharmacies
        </Typography>
        <Typography
          variant="body2"
          color="text.secondary"
          mb={3}
          sx={{ pl: 2, fontStyle: "italic" }}
        >
          Paid by 5 pharmacies
        </Typography>
        <Box
          component="section"
          aria-label="Featured pharmacies"
          sx={{
            display: "flex",
            flexWrap: "wrap",
            gap: 2.5,
            "& > *": {
              flex: "1 1 calc(20% - 20px)",
              minWidth: "150px",
              "@media (max-width: 900px)": {
                flex: "1 1 calc(33.333% - 20px)",
              },
              "@media (max-width: 600px)": {
                flex: "1 1 calc(50% - 20px)",
              },
            },
          }}
        >
          {featuredPharmacies.slice(0, 5).map((pharmacy) => (
            <Card
              key={pharmacy._id || pharmacy.name}
              sx={{
                width: "100%",
                height: 320,
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
              onClick={() =>
                navigate(
                  `/pharmacy/${
                    pharmacy._id ||
                    pharmacy.name.toLowerCase().replace(/\s/g, "-")
                  }`
                )
              }
            >
              <Box
                sx={{
                  height: 150,
                  background:
                    "linear-gradient(135deg, #e0f7fa 0%, #b2ebf2 100%)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
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
                  pt: 2,
                }}
              >
                <Box>
                  <Typography
                    variant="h6"
                    fontWeight={600}
                    color="secondary"
                    mb={1}
                  >
                    {pharmacy.name}
                  </Typography>
                  {pharmacy.motto && (
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      mb={1}
                      sx={{ fontStyle: "italic" }}
                    >
                      {pharmacy.motto}
                    </Typography>
                  )}
                  <Typography variant="body2" color="text.secondary" mb={2}>
                    📍 {pharmacy.address?.city || pharmacy.city || "Lebanon"}
                  </Typography>
                </Box>
                <Chip
                  label={pharmacy.isOpen !== false ? "Open Now" : "Closed"}
                  size="small"
                  sx={{
                    bgcolor: pharmacy.isOpen !== false ? "#c8e6c9" : "#ffcdd2",
                    color: pharmacy.isOpen !== false ? "#2e7d32" : "#c62828",
                    fontWeight: 600,
                    width: "fit-content",
                    mt: 2,
                  }}
                />
              </CardContent>
            </Card>
          ))}
        </Box>
      </Container>

      {/* Product Details Dialog */}
      <Dialog
        open={productDialogOpen}
        onClose={handleCloseProductDialog}
        maxWidth="sm"
        PaperProps={{
          sx: {
            borderRadius: 2,
            maxHeight: "85vh",
            width: "90%",
            maxWidth: 500,
          },
        }}
      >
        <DialogTitle
          sx={{
            background: "linear-gradient(135deg, #4ecdc4 0%, #44a9a3 100%)",
            color: "white",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            py: 1,
            px: 1.5,
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 1, flex: 1 }}>
            <LocalPharmacy sx={{ fontSize: 24, color: "white" }} />
            <Typography variant="h6" fontWeight={700} fontSize="1rem" noWrap>
              {productDetails?.item?.name || productDetails?.name || "Product"}
            </Typography>
          </Box>
          <IconButton
            onClick={handleCloseProductDialog}
            size="small"
            sx={{
              color: "white",
              ml: 1,
              "&:hover": {
                bgcolor: "rgba(255,255,255,0.2)",
              },
            }}
          >
            <Close sx={{ fontSize: 20 }} />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers sx={{ p: 1.5 }}>
          {productDetails ? (
            <Box>
              {/* Quick Info Chips */}
              <Box
                sx={{ display: "flex", gap: 0.75, mb: 1.5, flexWrap: "wrap" }}
              >
                <Chip
                  label={
                    productDetails?.item?.category ||
                    productDetails?.category ||
                    "General"
                  }
                  size="small"
                  sx={{
                    bgcolor: "primary.main",
                    color: "white",
                    fontWeight: 600,
                    fontSize: "0.7rem",
                    height: 24,
                  }}
                />
                {productDetails?.searchCount && (
                  <Chip
                    icon={<TrendingUp sx={{ fontSize: 14 }} />}
                    label={
                      productDetails.searchCount >= 1000
                        ? `+${(productDetails.searchCount / 1000).toFixed(
                            productDetails.searchCount % 1000 === 0 ? 0 : 1
                          )}k`
                        : `+${productDetails.searchCount}`
                    }
                    size="small"
                    sx={{
                      bgcolor: "success.main",
                      color: "white",
                      fontWeight: 600,
                      fontSize: "0.7rem",
                      height: 24,
                      "& .MuiChip-icon": { color: "white" },
                    }}
                  />
                )}
              </Box>

              {/* Product Details - Compact */}
              {(productDetails.item?.dosage ||
                productDetails.item?.form ||
                productDetails.item?.description) && (
                <Box sx={{ mb: 1.5 }}>
                  <Typography
                    variant="caption"
                    fontWeight={700}
                    color="text.secondary"
                    textTransform="uppercase"
                    fontSize="0.7rem"
                    display="block"
                    mb={0.75}
                  >
                    Details
                  </Typography>
                  <Box
                    sx={{ display: "flex", flexDirection: "column", gap: 0.75 }}
                  >
                    {productDetails.item?.dosage && (
                      <Box
                        sx={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          py: 0.5,
                          borderBottom: "1px solid",
                          borderColor: "divider",
                        }}
                      >
                        <Typography
                          variant="caption"
                          color="text.secondary"
                          fontSize="0.7rem"
                        >
                          Dosage:
                        </Typography>
                        <Typography
                          variant="body2"
                          fontWeight={600}
                          fontSize="0.8rem"
                        >
                          {productDetails.item.dosage}
                        </Typography>
                      </Box>
                    )}
                    {productDetails.item?.form && (
                      <Box
                        sx={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          py: 0.5,
                          borderBottom: "1px solid",
                          borderColor: "divider",
                        }}
                      >
                        <Typography
                          variant="caption"
                          color="text.secondary"
                          fontSize="0.7rem"
                        >
                          Form:
                        </Typography>
                        <Typography
                          variant="body2"
                          fontWeight={600}
                          fontSize="0.8rem"
                        >
                          {productDetails.item.form}
                        </Typography>
                      </Box>
                    )}
                    {productDetails.item?.description && (
                      <Box sx={{ pt: 0.5 }}>
                        <Typography
                          variant="caption"
                          color="text.secondary"
                          fontSize="0.7rem"
                          display="block"
                          mb={0.5}
                        >
                          Description:
                        </Typography>
                        <Typography
                          variant="body2"
                          lineHeight={1.5}
                          fontSize="0.75rem"
                          color="text.secondary"
                        >
                          {productDetails.item.description}
                        </Typography>
                      </Box>
                    )}
                  </Box>
                </Box>
              )}

              {/* Available Pharmacies - Compact List */}
              {productDetails.inventory &&
                productDetails.inventory.length > 0 && (
                  <Box>
                    <Box
                      sx={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        mb: 1,
                      }}
                    >
                      <Typography
                        variant="caption"
                        fontWeight={700}
                        color="text.secondary"
                        textTransform="uppercase"
                        fontSize="0.7rem"
                      >
                        Pharmacies ({productDetails.inventory.length})
                      </Typography>
                    </Box>
                    <Box
                      sx={{
                        display: "flex",
                        flexDirection: "column",
                        gap: 0.75,
                        maxHeight: "200px",
                        overflowY: "auto",
                        pr: 0.5,
                        "&::-webkit-scrollbar": {
                          width: "4px",
                        },
                        "&::-webkit-scrollbar-track": {
                          background: "#f1f1f1",
                          borderRadius: "2px",
                        },
                        "&::-webkit-scrollbar-thumb": {
                          background: "#888",
                          borderRadius: "2px",
                          "&:hover": {
                            background: "#555",
                          },
                        },
                      }}
                    >
                      {productDetails.inventory.slice(0, 4).map((inv, idx) => (
                        <Paper
                          key={idx}
                          elevation={0}
                          sx={{
                            p: 0.75,
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            transition: "all 0.2s",
                            border: "1px solid",
                            borderColor: "divider",
                            borderRadius: 1,
                            "&:hover": {
                              bgcolor: "grey.50",
                              borderColor: "primary.main",
                            },
                          }}
                        >
                          <Box sx={{ flex: 1, minWidth: 0 }}>
                            <Typography
                              variant="body2"
                              fontWeight={600}
                              color="secondary"
                              fontSize="0.85rem"
                              noWrap
                              mb={0.25}
                            >
                              {inv.pharmacy?.name || "Unknown"}
                            </Typography>
                            <Typography
                              variant="caption"
                              color="text.secondary"
                              fontSize="0.7rem"
                            >
                              {inv.pharmacy?.address?.city || "N/A"}
                            </Typography>
                          </Box>
                          <Box
                            sx={{
                              textAlign: "right",
                              ml: 1,
                              display: "flex",
                              flexDirection: "column",
                              alignItems: "flex-end",
                              gap: 0.25,
                              flexShrink: 0,
                            }}
                          >
                            <Typography
                              variant="body2"
                              fontWeight={700}
                              color="primary.main"
                              fontSize="0.9rem"
                            >
                              ${inv.price?.toFixed(2) || "0.00"}
                            </Typography>
                            <Chip
                              label={
                                inv.stockStatus === "in-stock"
                                  ? `${inv.quantity || 0}`
                                  : inv.stockStatus === "low-stock"
                                  ? `Low`
                                  : "Out"
                              }
                              size="small"
                              sx={{
                                bgcolor:
                                  inv.stockStatus === "in-stock"
                                    ? "success.light"
                                    : inv.stockStatus === "low-stock"
                                    ? "warning.light"
                                    : "error.light",
                                color:
                                  inv.stockStatus === "in-stock"
                                    ? "success.dark"
                                    : inv.stockStatus === "low-stock"
                                    ? "warning.dark"
                                    : "error.dark",
                                fontWeight: 600,
                                fontSize: "0.65rem",
                                height: 18,
                                minWidth: 35,
                              }}
                            />
                          </Box>
                        </Paper>
                      ))}
                      {productDetails.inventory.length > 4 && (
                        <Typography
                          variant="caption"
                          color="text.secondary"
                          textAlign="center"
                          fontSize="0.7rem"
                          sx={{ py: 0.5 }}
                        >
                          +{productDetails.inventory.length - 4} more
                        </Typography>
                      )}
                    </Box>
                  </Box>
                )}
            </Box>
          ) : (
            <Box sx={{ textAlign: "center", py: 2 }}>
              <Typography
                variant="body2"
                color="text.secondary"
                fontSize="0.85rem"
              >
                Loading...
              </Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 1, gap: 1 }}>
          <Button
            onClick={handleCloseProductDialog}
            variant="outlined"
            size="small"
            sx={{
              fontSize: "0.8rem",
              px: 1.5,
              py: 0.5,
            }}
          >
            Close
          </Button>
          <Button
            onClick={() => {
              handleCloseProductDialog();
              navigate(
                `/search?q=${encodeURIComponent(selectedProduct?.name || "")}`
              );
            }}
            variant="contained"
            size="small"
            sx={{
              background: "linear-gradient(135deg, #4ecdc4 0%, #44a9a3 100%)",
              color: "white",
              fontWeight: 600,
              fontSize: "0.8rem",
              px: 1.5,
              py: 0.5,
              "&:hover": {
                background: "linear-gradient(135deg, #44a9a3 0%, #3d9791 100%)",
              },
            }}
          >
            View All
          </Button>
        </DialogActions>
      </Dialog>

      <Footer />
    </Box>
  );
};

export default Home;
