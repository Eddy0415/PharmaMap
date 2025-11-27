import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Container,
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  IconButton,
  Chip,
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
    title: "Fast Delivery Options",
    description: "Multiple delivery options available for your convenience",
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
      const response = await medicationAPI.getPopular();
      const products = response.data.medications?.slice(0, 5) || [];
      
      // Fallback popular products in Lebanon if API fails or returns empty
      const fallbackProducts = [
        { name: "Panadol", searchCount: 10000, category: "Pain Relief" },
        { name: "Advil", searchCount: 5000, category: "Pain Relief" },
        { name: "Aspirin", searchCount: 3000, category: "Pain Relief" },
        { name: "Brufen", searchCount: 2500, category: "Pain Relief" },
        { name: "Paracetamol", searchCount: 4000, category: "Pain Relief" },
      ];
      
      // Merge API data with fallback data
      const mergedProducts = products.length > 0 
        ? products.map((product, index) => ({
            ...product,
            searchCount: product.searchCount || fallbackProducts[index]?.searchCount || 0,
          }))
        : fallbackProducts.map(p => ({ ...p, _id: p.name.toLowerCase().replace(/\s/g, '-') }));
      
      setPopularProducts(mergedProducts.slice(0, 5));
    } catch (error) {
      console.error("Error fetching popular products:", error);
      // Use fallback products on error
      const fallbackProducts = [
        { name: "Panadol", searchCount: 10000, category: "Pain Relief", _id: "panadol" },
        { name: "Advil", searchCount: 5000, category: "Pain Relief", _id: "advil" },
        { name: "Aspirin", searchCount: 3000, category: "Pain Relief", _id: "aspirin" },
        { name: "Brufen", searchCount: 2500, category: "Pain Relief", _id: "brufen" },
        { name: "Paracetamol", searchCount: 4000, category: "Pain Relief", _id: "paracetamol" },
      ];
      setPopularProducts(fallbackProducts);
    }
  };

  const fetchFeaturedPharmacies = async () => {
    try {
      const response = await pharmacyAPI.getAll({ featured: true });
      const pharmacies = response.data.pharmacies?.slice(0, 5) || [];
      
      // Fallback featured pharmacies in Lebanon if API fails or returns empty
      const fallbackPharmacies = [
        { name: "Al Rahbani Pharmacy", motto: "We strive to help", city: "Beirut" },
        { name: "Maen Pharmacy", motto: "Your health is our priority", city: "Beirut" },
        { name: "Rallan Pharmacy", motto: "Caring for you", city: "Beirut" },
        { name: "Salam Pharmacy", motto: "Quality care, quality service", city: "Tripoli" },
        { name: "Al Hayat Pharmacy", motto: "Your trusted health partner", city: "Sidon" },
      ];
      
      // Merge API data with fallback data
      const mergedPharmacies = pharmacies.length > 0
        ? pharmacies.map((pharmacy, index) => ({
            ...pharmacy,
            motto: pharmacy.motto || pharmacy.tagline || fallbackPharmacies[index]?.motto || "",
          }))
        : fallbackPharmacies.map(p => ({ 
            ...p, 
            _id: p.name.toLowerCase().replace(/\s/g, '-'),
            address: { city: p.city },
            isOpen: true,
          }));
      
      setFeaturedPharmacies(mergedPharmacies.slice(0, 5));
    } catch (error) {
      console.error("Error fetching featured pharmacies:", error);
      // Use fallback pharmacies on error
      const fallbackPharmacies = [
        { name: "Al Rahbani Pharmacy", motto: "We strive to help", city: "Beirut", _id: "al-rahbani", address: { city: "Beirut" }, isOpen: true },
        { name: "Maen Pharmacy", motto: "Your health is our priority", city: "Beirut", _id: "maen", address: { city: "Beirut" }, isOpen: true },
        { name: "Rallan Pharmacy", motto: "Caring for you", city: "Beirut", _id: "rallan", address: { city: "Beirut" }, isOpen: true },
        { name: "Salam Pharmacy", motto: "Quality care, quality service", city: "Tripoli", _id: "salam", address: { city: "Tripoli" }, isOpen: true },
        { name: "Al Hayat Pharmacy", motto: "Your trusted health partner", city: "Sidon", _id: "al-hayat", address: { city: "Sidon" }, isOpen: true },
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
    navigate(`/search?category=${encodeURIComponent(categoryName)}`);
  };

  return (
    <Box
      component="main"
      sx={{ bgcolor: "background.default", minHeight: "100vh" }}
    >
      <Header user={user} />

      <Container component="section" maxWidth="xl" sx={{ py: 5 }}>
        {/* Carousel Section */}
        <Box
          component="section"
          aria-label="Featured content carousel"
          sx={{
            position: "relative",
            borderRadius: 5,
            overflow: "hidden",
            height: 450,
            mb: 5,
            boxShadow: "0 8px 32px rgba(0,0,0,0.15)",
          }}
        >
          {carouselSlides.map((slide, index) => (
            <Box
              key={index}
              sx={{
                position: "absolute",
                top: 0,
                left: 0,
                width: "100%",
                height: "100%",
                opacity: currentSlide === index ? 1 : 0,
                transition: "opacity 0.5s ease-in-out",
                backgroundImage: `url(${slide.image})`,
                backgroundSize: "cover",
                backgroundPosition: "center",
              }}
            >
              <Box
                sx={{
                  position: "absolute",
                  bottom: 0,
                  left: 0,
                  right: 0,
                  background:
                    "linear-gradient(to top, rgba(0,0,0,0.7) 0%, transparent 100%)",
                  p: 4,
                  color: "white",
                }}
              >
                <Typography variant="h4" fontWeight={700} mb={1}>
                  {slide.title}
                </Typography>
                <Typography variant="body1" sx={{ opacity: 0.9 }}>
                  {slide.description}
                </Typography>
              </Box>
            </Box>
          ))}

          {/* Carousel Controls */}
          <IconButton
            onClick={handlePrevSlide}
            sx={{
              position: "absolute",
              left: 20,
              top: "50%",
              transform: "translateY(-50%)",
              bgcolor: "rgba(255,255,255,0.9)",
              borderRadius: "50%",
              width: 48,
              height: 48,
              "&:hover": { bgcolor: "white" },
            }}
          >
            <ArrowForwardIos sx={{ transform: "rotate(180deg)" }} />
          </IconButton>
          <IconButton
            onClick={handleNextSlide}
            sx={{
              position: "absolute",
              right: 20,
              top: "50%",
              transform: "translateY(-50%)",
              bgcolor: "rgba(255,255,255,0.9)",
              borderRadius: "50%",
              width: 48,
              height: 48,
              "&:hover": { bgcolor: "white" },
            }}
          >
            <ArrowForwardIos />
          </IconButton>

          {/* Indicators */}
          <Box
            sx={{
              position: "absolute",
              bottom: 20,
              left: "50%",
              transform: "translateX(-50%)",
              display: "flex",
              gap: 1,
            }}
          >
            {carouselSlides.map((_, index) => (
              <Box
                key={index}
                onClick={() => setCurrentSlide(index)}
                sx={{
                  width: currentSlide === index ? 30 : 12,
                  height: 12,
                  borderRadius: 6,
                  bgcolor:
                    currentSlide === index ? "white" : "rgba(255,255,255,0.5)",
                  cursor: "pointer",
                  transition: "all 0.3s",
                }}
              />
            ))}
          </Box>
        </Box>

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
          Top 5 most requested (searched) products last month (updates every month)
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
            const formattedCount = searchCount >= 1000 
              ? `+${(searchCount / 1000).toFixed(searchCount % 1000 === 0 ? 0 : 1)}k` 
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
                onClick={() => navigate(`/search?q=${encodeURIComponent(product.name)}`)}
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
                <CardContent sx={{ flexGrow: 1, display: "flex", flexDirection: "column" }}>
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
              onClick={() => navigate(`/pharmacy/${pharmacy._id || pharmacy.name.toLowerCase().replace(/\s/g, '-')}`)}
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
              <CardContent sx={{ flexGrow: 1, display: "flex", flexDirection: "column", justifyContent: "space-between", pb: 3, pt: 2 }}>
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

      <Footer />
    </Box>
  );
};

export default Home;
