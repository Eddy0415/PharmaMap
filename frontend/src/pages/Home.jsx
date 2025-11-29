import React, { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  Container,
  Box,
  Typography,
  Card,
  CardContent,
  IconButton,
  Chip,
  Button,
  CircularProgress,
} from "@mui/material";
import ArrowBackIos from "@mui/icons-material/ArrowBackIos";
import ArrowForwardIos from "@mui/icons-material/ArrowForwardIos";
import Spa from "@mui/icons-material/Spa";
import Favorite from "@mui/icons-material/Favorite";
import LocalPharmacy from "@mui/icons-material/LocalPharmacy";
import PanTool from "@mui/icons-material/PanTool";
import Bloodtype from "@mui/icons-material/Bloodtype";
import Masks from "@mui/icons-material/Masks";
import AcUnit from "@mui/icons-material/AcUnit";
import HealthAndSafety from "@mui/icons-material/HealthAndSafety";
import Elderly from "@mui/icons-material/Elderly";
import ShieldMoon from "@mui/icons-material/ShieldMoon";
import TrendingUp from "@mui/icons-material/TrendingUp";
import Header from "../components/Header";
import Footer from "../components/Footer";
import { pharmacyAPI, medicationAPI } from "../services/api";
import ProductDetailsDialog from "../components/ProductDetailsDialog";

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
  const location = useLocation();
  const [currentSlide, setCurrentSlide] = useState(0);
  const [user, setUser] = useState(null);
  const [popularProducts, setPopularProducts] = useState([]);
  const [featuredPharmacies, setFeaturedPharmacies] = useState([]);
  const categoriesRef = useRef(null);
  const productsRef = useRef(null);
  const featuredRef = useRef(null);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [productPharmacies, setProductPharmacies] = useState([]);
  const [loadingProduct, setLoadingProduct] = useState(false);

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

  const scrollToSection = useCallback((ref) => {
    if (!ref.current) return;
    const headerOffset = 88;
    const elementPosition =
      ref.current.getBoundingClientRect().top + window.pageYOffset;
    const offsetPosition = elementPosition - headerOffset;

    window.scrollTo({
      top: offsetPosition,
      behavior: "smooth",
    });
  }, []);

  useEffect(() => {
    if (location.hash === "#categories") {
      scrollToSection(categoriesRef);
    } else if (location.hash === "#products") {
      scrollToSection(productsRef);
    } else if (location.hash === "#featured") {
      scrollToSection(featuredRef);
    }
  }, [location.hash, scrollToSection]);

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

  const collectPharmaciesForItem = (results, itemId, fallbackName) => {
    if (!results?.length) return [];
    const pharmaciesMap = new Map();
    results.forEach((res) => {
      const matchesId =
        itemId && (res.item?._id === itemId || res.item?.id === itemId);
      const matchesName =
        fallbackName &&
        (res.item?.name === fallbackName ||
          res.item?.name?.toLowerCase() === fallbackName?.toLowerCase());
      if (!(matchesId || matchesName)) return;

      res.inventory?.forEach((inv) => {
        const phId = inv.pharmacy?._id || inv.pharmacy?.id || inv.pharmacy;
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
    return Array.from(pharmaciesMap.values());
  };

  const openProductDetails = async (productName) => {
    setLoadingProduct(true);
    try {
      const response = await medicationAPI.getAll({
        search: productName,
        inStock: "true",
      });
      const results = response.data.results || [];
      if (results.length === 0) {
        setSelectedProduct({ item: { name: productName } });
        setProductPharmacies([]);
        setDetailsDialogOpen(true);
        return;
      }

      const firstItem = results[0].item || { name: productName };
      const pharmacies = collectPharmaciesForItem(
        results,
        firstItem._id || firstItem.id,
        firstItem.name
      );
      const primaryEntry = pharmacies[0];

      setSelectedProduct({
        item: firstItem,
        price: primaryEntry?.price,
        quantity: primaryEntry?.quantity,
        stockStatus: primaryEntry?.stockStatus,
      });
      setProductPharmacies(pharmacies);
      setDetailsDialogOpen(true);
    } catch (error) {
      console.error("Error loading product details:", error);
      setSelectedProduct({ item: { name: productName } });
      setProductPharmacies([]);
      setDetailsDialogOpen(true);
    } finally {
      setLoadingProduct(false);
    }
  };

  return (
    <Box
      component="main"
      sx={{ bgcolor: "background.default", minHeight: "100vh" }}
    >
      <Header
        user={user}
        onScrollToCategories={() => scrollToSection(categoriesRef)}
        onScrollToProducts={() => scrollToSection(productsRef)}
        onScrollToFeatured={() => scrollToSection(featuredRef)}
      />

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
        <Box ref={categoriesRef} id="categories">
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
                  <Icon
                    sx={{ fontSize: 48, color: "primary.main", mb: 1.5 }}
                  />
                  <Typography
                    variant="body1"
                    fontWeight={600}
                    color="secondary"
                  >
                    {category.name}
                  </Typography>
                </Card>
              );
            })}
          </Box>
        </Box>

        {/* Popular Products Section */}
        <Box ref={productsRef} id="products">
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
                  onClick={() => openProductDetails(product.name)}
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
                    <LocalPharmacy
                      sx={{ fontSize: 64, color: "primary.main" }}
                    />
                  </Box>
                  <CardContent
                    sx={{
                      flexGrow: 1,
                      display: "flex",
                      flexDirection: "column",
                    }}
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
        </Box>

        {/* Featured Pharmacies Section */}
        <Box ref={featuredRef} id="featured">
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
        </Box>
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

      <ProductDetailsDialog
        open={detailsDialogOpen}
        onClose={() => {
          setDetailsDialogOpen(false);
          setSelectedProduct(null);
          setProductPharmacies([]);
        }}
        product={selectedProduct}
        pharmacies={productPharmacies}
        onSelectPharmacy={(pharmacy) =>
          navigate(`/pharmacy/${pharmacy._id || pharmacy.id || pharmacy}`)
        }
      />

      <Footer />
    </Box>
  );
};

export default Home;
