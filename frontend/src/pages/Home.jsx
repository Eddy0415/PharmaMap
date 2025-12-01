import React, { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  Container,
  Box,
  Typography,
  Card,
  CardContent,
  Chip,
  Button,
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
import Room from "@mui/icons-material/Room";
import Star from "@mui/icons-material/Star";

import Header from "../components/Header";
import Footer from "../components/Footer";
import { pharmacyAPI, medicationAPI, orderAPI } from "../services/api";
import ProductDetailsDialog from "../components/ProductDetailsDialog";

/* -------------------------------------------------------------------------- */
/*                           HERO CAROUSEL SLIDES                             */
/* -------------------------------------------------------------------------- */

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

/* -------------------------------------------------------------------------- */
/*                               CATEGORIES                                   */
/* -------------------------------------------------------------------------- */

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

/* -------------------------------------------------------------------------- */
/*                                HOME START                                  */
/* -------------------------------------------------------------------------- */

const Home = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const [currentSlide, setCurrentSlide] = useState(0);
  const [user, setUser] = useState(null);

  const [popularProducts, setPopularProducts] = useState([]);
  const [popularPharmacies, setPopularPharmacies] = useState([]);

  const categoriesRef = useRef(null);
  const productsRef = useRef(null);
  const featuredRef = useRef(null);

  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [productPharmacies, setProductPharmacies] = useState([]);
  const [loadingProduct, setLoadingProduct] = useState(false);
  const [requesting, setRequesting] = useState(false);

  /* -------------------------------------------------------------------------- */
  /*                             LOAD INITIAL DATA                              */
  /* -------------------------------------------------------------------------- */

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) setUser(JSON.parse(storedUser));

    fetchPopularProducts();
    fetchPopularPharmacies();

    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % carouselSlides.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  /* -------------------------------------------------------------------------- */
  /*                      SCROLL TO SECTIONS FROM HEADER                        */
  /* -------------------------------------------------------------------------- */

  const scrollToSection = useCallback((ref) => {
    if (!ref.current) return;
    const headerOffset = 88;
    const elementPosition =
      ref.current.getBoundingClientRect().top + window.pageYOffset;
    const offset = elementPosition - headerOffset;

    window.scrollTo({ top: offset, behavior: "smooth" });
  }, []);

  useEffect(() => {
    if (location.hash === "#categories") scrollToSection(categoriesRef);
    else if (location.hash === "#products") scrollToSection(productsRef);
    else if (location.hash === "#featured") scrollToSection(featuredRef);
  }, [location.hash, scrollToSection]);

  /* -------------------------------------------------------------------------- */
  /*                     FETCH POPULAR PRODUCTS (TOP 5)                         */
  /* -------------------------------------------------------------------------- */

  const fetchPopularProducts = async () => {
    try {
      const response = await medicationAPI.getTopSearched();
      const products = response.data.items?.slice(0, 5) || [];

      const fallbackProducts = [
        { name: "Panadol", searchCount: 10000, category: "Pain Relief" },
        { name: "Advil", searchCount: 5000, category: "Pain Relief" },
        { name: "Aspirin", searchCount: 3000, category: "Pain Relief" },
        { name: "Brufen", searchCount: 2500, category: "Pain Relief" },
        { name: "Paracetamol", searchCount: 4000, category: "Pain Relief" },
      ];

      const finalList =
        products.length > 0
          ? products.map((p, i) => ({
              ...p,
              searchCount:
                p.searchCount || fallbackProducts[i]?.searchCount || 0,
            }))
          : fallbackProducts.map((p) => ({
              ...p,
              _id: p.name.toLowerCase().replace(/\s/g, "-"),
            }));

      setPopularProducts(finalList.slice(0, 5));
    } catch (e) {
      const fallback = [
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
      setPopularProducts(fallback);
    }
  };

  /* -------------------------------------------------------------------------- */
  /*                 FETCH POPULAR PHARMACIES (TOP 5 ONLY)                      */
  /* -------------------------------------------------------------------------- */

  const fetchPopularPharmacies = async () => {
    try {
      const response = await pharmacyAPI.getFeatured();
      const list = response.data.pharmacies?.slice(0, 5) || [];

      const fallback = [
        { name: "Al Rahbani Pharmacy", city: "Beirut", isOpen: true },
        { name: "Maen Pharmacy", city: "Beirut", isOpen: true },
        { name: "Rallan Pharmacy", city: "Beirut", isOpen: true },
        { name: "Salam Pharmacy", city: "Tripoli", isOpen: true },
        { name: "Al Hayat Pharmacy", city: "Sidon", isOpen: true },
      ];

      const finalList =
        list.length > 0
          ? list.map((ph, i) => ({
              ...ph,
              address: ph.address || { city: fallback[i]?.city },
              isOpen: ph.isOpen !== undefined ? ph.isOpen : true,
            }))
          : fallback.map((p) => ({
              ...p,
              _id: p.name.toLowerCase().replace(/\s/g, "-"),
              address: { city: p.city },
            }));

      setPopularPharmacies(finalList.slice(0, 5));
    } catch (e) {
      const fallback = [
        {
          name: "Al Rahbani Pharmacy",
          _id: "al-rahbani",
          city: "Beirut",
          address: { city: "Beirut" },
          isOpen: true,
        },
        {
          name: "Maen Pharmacy",
          _id: "maen",
          city: "Beirut",
          address: { city: "Beirut" },
          isOpen: true,
        },
        {
          name: "Rallan Pharmacy",
          _id: "rallan",
          city: "Beirut",
          address: { city: "Beirut" },
          isOpen: true,
        },
        {
          name: "Salam Pharmacy",
          _id: "salam",
          city: "Tripoli",
          address: { city: "Tripoli" },
          isOpen: true,
        },
        {
          name: "Al Hayat Pharmacy",
          _id: "al-hayat",
          city: "Sidon",
          address: { city: "Sidon" },
          isOpen: true,
        },
      ];
      setPopularPharmacies(fallback);
    }
  };

  /* -------------------------------------------------------------------------- */
  /*                       PRODUCT DETAILS DIALOG OPEN                          */
  /* -------------------------------------------------------------------------- */

  const collectPharmaciesForItem = (results, itemId, fallbackName) => {
    if (!results?.length) return [];
    const map = new Map();

    results.forEach((res) => {
      const matchesId =
        itemId &&
        (res.item?._id === itemId || res.item?.id === itemId);

      const matchesName =
        fallbackName &&
        (res.item?.name === fallbackName ||
          res.item?.name?.toLowerCase() === fallbackName?.toLowerCase());

      if (!(matchesId || matchesName)) return;

      res.inventory?.forEach((inv) => {
        const phId = inv.pharmacy?._id || inv.pharmacy?.id || inv.pharmacy;
        if (!map.has(phId)) {
          map.set(phId, {
            pharmacy: inv.pharmacy,
            price: inv.price,
            quantity: inv.quantity,
            stockStatus: inv.stockStatus,
          });
        }
      });
    });

    return Array.from(map.values());
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

      const primary = pharmacies[0];

      setSelectedProduct({
        item: firstItem,
        price: primary?.price,
        quantity: primary?.quantity,
        stockStatus: primary?.stockStatus,
      });
      setProductPharmacies(pharmacies);
      setDetailsDialogOpen(true);
    } catch (err) {
      setSelectedProduct({ item: { name: productName } });
      setProductPharmacies([]);
      setDetailsDialogOpen(true);
    } finally {
      setLoadingProduct(false);
    }
  };

  const handleRequestPharmacy = async (entry) => {
    if (!user?.id) {
      navigate("/login");
      return false;
    }
    try {
      setRequesting(true);
      await orderAPI.create({
        customer: user.id,
        pharmacy: entry.pharmacy?._id || entry.pharmacy,
        items: [
          {
            item: selectedProduct.item._id || selectedProduct.item.id,
            quantity: 1,
          },
        ],
        customerNotes: "Product request",
      });
      return true;
    } catch (e) {
      return false;
    } finally {
      setRequesting(false);
    }
  };

  /* -------------------------------------------------------------------------- */
  /*                             FINAL PAGE RENDER                              */
  /* -------------------------------------------------------------------------- */

  return (
    <Box component="main" sx={{ bgcolor: "background.default", minHeight: "100vh" }}>
      <Header
        user={user}
        onScrollToCategories={() => scrollToSection(categoriesRef)}
        onScrollToProducts={() => scrollToSection(productsRef)}
        onScrollToFeatured={() => scrollToSection(featuredRef)}
      />

      {/* ---------------------------------------------------------------------- */}
      {/*                               HERO CAROUSEL                            */}
      {/* ---------------------------------------------------------------------- */}

      <Box
        component="section"
        aria-label="Featured carousel"
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
            color: "white",
            zIndex: 2,
            maxWidth: { xs: "88%", sm: "72%", md: "46%" },
          }}
        >
          <Typography
            variant="h3"
            fontWeight={800}
            sx={{
              fontSize: { xs: "2rem", sm: "2.6rem", md: "3.2rem" },
              mb: 1.5,
            }}
          >
            Fast access to the medicine you need.
          </Typography>

          <Typography
            variant="h6"
            sx={{
              fontSize: { xs: "1.05rem", sm: "1.2rem", md: "1.35rem" },
              opacity: 0.9,
              mb: 3,
            }}
          >
            We scan trusted pharmacies around you so you can reserve what you
            need before stepping out the door.
          </Typography>

          <Box sx={{ display: "flex", gap: 2 }}>
            <Button
              variant="outlined"
              size="large"
              onClick={() => navigate("/search")}
              sx={{
                color: "white",
                borderColor: "rgba(255,255,255,0.85)",
                px: 3,
                py: 1,
                fontWeight: 700,
                "&:hover": {
                  bgcolor: "white",
                  color: "primary.main",
                  borderColor: "white",
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
              }}
            />
          </Box>
        </Box>
      </Box>

      {/* ---------------------------------------------------------------------- */}
      {/*                                MAIN BODY                               */}
      {/* ---------------------------------------------------------------------- */}

      <Container maxWidth="xl" sx={{ pt: 4, pb: 5 }}>

        {/* ------------------------------------------------------------------ */}
        {/*                              CATEGORIES                            */}
        {/* ------------------------------------------------------------------ */}
        <Box ref={categoriesRef} id="categories">
          <Typography
            component="h2"
            variant="h4"
            fontWeight={700}
            color="secondary"
            mb={3}
            sx={{ pl: 2, position: "relative" }}
          >
            <Box
              sx={{
                position: "absolute",
                left: 0,
                width: 5,
                top: 0,
                bottom: 0,
                bgcolor: "primary.main",
                borderRadius: 1,
              }}
            />
            Browse by Categories
          </Typography>

          <Box
            sx={{
              display: "flex",
              flexWrap: "wrap",
              gap: 2.5,
              mb: 6,
              "& > *": {
                flex: "1 1 calc(20% - 20px)",
                minWidth: "150px",
                "@media (max-width:900px)": {
                  flex: "1 1 calc(33.333% - 20px)",
                },
                "@media (max-width:600px)": {
                  flex: "1 1 calc(50% - 20px)",
                },
              },
            }}
          >
            {categories.map((cat, i) => {
              const Icon = cat.icon;
              return (
                <Card
                  key={i}
                  onClick={() => navigate(`/search?category=${cat.name}`)}
                  sx={{
                    height: 180,
                    p: 3,
                    cursor: "pointer",
                    textAlign: "center",
                    border: "3px solid #e0e0e0",
                    transition: "0.3s",
                    "&:hover": {
                      background:
                        "linear-gradient(135deg, #4ecdc4 0%, #44a9a3 100%)",
                      borderColor: "#4ecdc4",
                      transform: "translateY(-5px)",
                      "& .MuiSvgIcon-root": { color: "white" },
                      "& .MuiTypography-root": { color: "white" },
                    },
                  }}
                >
                  <Icon sx={{ fontSize: 48, color: "primary.main", mb: 1 }} />
                  <Typography fontWeight={600} color="secondary">
                    {cat.name}
                  </Typography>
                </Card>
              );
            })}
          </Box>
        </Box>

        {/* ------------------------------------------------------------------ */}
        {/*                           POPULAR PRODUCTS                          */}
        {/* ------------------------------------------------------------------ */}

        <Box ref={productsRef} id="products">
          <Typography
            variant="h4"
            fontWeight={700}
            color="secondary"
            mb={3}
            sx={{ pl: 2, position: "relative" }}
          >
            <Box
              sx={{
                position: "absolute",
                left: 0,
                width: 5,
                top: 0,
                bottom: 0,
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
            Top 5 most searched products last month
          </Typography>

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
            {popularProducts.map((product) => {
              const searchCount = product.searchCount || 0;
              const formatted =
                searchCount >= 1000
                  ? `+${(searchCount / 1000).toFixed(
                      searchCount % 1000 === 0 ? 0 : 1
                    )}k`
                  : `+${searchCount}`;

              return (
                <Card
                  key={product._id || product.name}
                  sx={{
                    height: 280,
                    cursor: "pointer",
                    border: "2px solid transparent",
                    transition: "0.3s",
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
                      {product.name}
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
                      {formatted} searches last month
                    </Typography>
                  </CardContent>
                </Card>
              );
            })}
          </Box>
        </Box>

        {/* ------------------------------------------------------------------ */}
        {/*                         POPULAR PHARMACIES                          */}
        {/* ------------------------------------------------------------------ */}

        <Box ref={featuredRef} id="featured">
          <Typography
            variant="h4"
            fontWeight={700}
            color="secondary"
            mb={3}
            sx={{ pl: 2, position: "relative" }}
          >
            <Box
              sx={{
                position: "absolute",
                left: 0,
                width: 5,
                top: 0,
                bottom: 0,
                bgcolor: "primary.main",
                borderRadius: 1,
              }}
            />
            Popular Pharmacies
          </Typography>

          <Typography
            variant="body2"
            color="text.secondary"
            mb={3}
            sx={{ pl: 2, fontStyle: "italic" }}
          >
            Top 5 most searched pharmacies last month
          </Typography>
        </Box>

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
          {popularPharmacies.map((pharmacy, index) => {
            const rating =
              pharmacy.averageRating !== undefined &&
              pharmacy.averageRating !== null
                ? Number(pharmacy.averageRating)
                : pharmacy.rating !== undefined &&
                  pharmacy.rating !== null
                ? Number(pharmacy.rating)
                : null;

            return (
              <Card
                key={pharmacy._id || pharmacy.id || pharmacy.name || index}
                sx={{
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
                      pharmacy.id ||
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
                    pt: 2,
                    px: 2.5,
                  }}
                >
                  <Box>
                    <Typography
                      variant="h6"
                      fontWeight={600}
                      color="secondary"
                      mb={1}
                      sx={{
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                      }}
                    >
                      {pharmacy.name}
                    </Typography>

                    {/* Location + Rating Row */}
                    <Box
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        gap: 1,
                        flexWrap: "wrap",
                        mb: 1,
                      }}
                    >
                      <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{
                          display: "flex",
                          alignItems: "center",
                          gap: 0.5,
                        }}
                      >
                        <Room
                          fontSize="small"
                          sx={{ mr: 0.2, color: "primary.main" }}
                        />
                        {pharmacy.address?.city ||
                          pharmacy.city ||
                          "Lebanon"}
                      </Typography>

                      {rating !== null && Number.isFinite(rating) && (
                        <Typography
                          variant="body2"
                          color="text.secondary"
                          sx={{
                            display: "flex",
                            alignItems: "center",
                            gap: 0.25,
                          }}
                        >
                          <Star sx={{ fontSize: 18, color: "primary.main" }} />
                          {rating.toFixed(1)}
                        </Typography>
                      )}
                    </Box>
                  </Box>

                  {/* Open / Closed Chip */}
                  <Chip
                    label={pharmacy.isOpen !== false ? "Open Now" : "Closed"}
                    size="small"
                    sx={{
                      bgcolor:
                        pharmacy.isOpen !== false ? "#c8e6c9" : "#ffcdd2",
                      color:
                        pharmacy.isOpen !== false ? "#2e7d32" : "#c62828",
                      fontWeight: 600,
                      width: "fit-content",
                      mt: 2,
                    }}
                  />
                </CardContent>
              </Card>
            );
          })}
        </Box>
      </Container>

      {/* DIALOG */}
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
        onRequestPharmacy={handleRequestPharmacy}
      />

      <Footer />
    </Box>
  );
};

export default Home;
