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
  IconButton,
} from "@mui/material";

import LocalPharmacy from "@mui/icons-material/LocalPharmacy";
import Favorite from "@mui/icons-material/Favorite";
import FavoriteBorder from "@mui/icons-material/FavoriteBorder";
import TrendingUp from "@mui/icons-material/TrendingUp";
import Room from "@mui/icons-material/Room";
import Star from "@mui/icons-material/Star";



import Header from "../components/Header";
import Footer from "../components/Footer";
import ProductDetailsDialog from "../components/ProductDetailsDialog";
import CardItem from "../components/CardItem";
import { pharmacyAPI, medicationAPI, orderAPI, userAPI } from "../services/api";


/* -------------------------------------------------------------------------- */
/*                           HERO CAROUSEL SLIDES                             */
/* -------------------------------------------------------------------------- */

const carouselSlides = [
  {
    title: "Find Your Medication Instantly",
    description: "Check availability across multiple pharmacies in Lebanon",
  },
  {
    title: "Trusted Pharmacy Network",
    description: "Connected with hundreds of verified pharmacies",
  },
  {
    title: "Save Time & Money",
    description: "Compare prices and find the nearest available pharmacy",
  },
  {
    title: "24/7 Availability",
    description: "Find pharmacies open around the clock near you",
  },
  {
    title: "Premium Quality Guaranteed",
    description: "All pharmacies verified for quality and authenticity",
  },
  {
    title: "Reserve & pick up",
    description: "Ready for you when you arrive",
  },
];

/* -------------------------------------------------------------------------- */
/*                               CATEGORIES                                   */
/* -------------------------------------------------------------------------- */

const categories = [
  {
    name: "Derma Products",
    icon: () => (
      <img
        src="/icons/derma.svg"
        alt="Derma"
        width={48}
        height={48}
      />
    ),
  },
  {
    name: "Cardiac Care",
    icon: () => (
      <img
        src="/icons/cardiac.svg"
        alt="Cardiac"
        width={48}
        height={48}
      />
    ),
  },
  {
    name: "Stomach Care",
    icon: () => (
      <img
        src="/icons/stomach.svg"
        alt="Stomach"
        width={48}
        height={48}
      />
    ),
  },
  {
    name: "Pain Relief",
    icon: () => (
      <img
        src="/icons/pain.svg"
        alt="Pain Relief"
        width={48}
        height={48}
      />
    ),
  },
  {
    name: "Liver Care",
    icon: () => (
      <img
        src="/icons/liver.svg"
        alt="Liver"
        width={48}
        height={48}
      />
    ),
  },
  {
    name: "Oral Care",
    icon: () => (
      <img
        src="/icons/oral.svg"
        alt="Oral Care"
        width={48}
        height={48}
      />
    ),
  },
  {
    name: "Respiratory",
    icon: () => (
      <img
        src="/icons/respiratory.svg"
        alt="Respiratory"
        width={48}
        height={48}
      />
    ),
  },
  {
    name: "Sexual Health",
    icon: () => (
      <img
        src="/icons/sexual.svg"
        alt="Sexual Health"
        width={48}
        height={48}
      />
    ),
  },
  {
    name: "Elderly Care",
    icon: () => (
      <img
        src="/icons/elderly.svg"
        alt="Elderly Care"
        width={48}
        height={48}
      />
    ),
  },
  {
    name: "Cold & Immunity",
    icon: () => (
      <img
        src="/icons/cold.svg"
        alt="Cold & Immunity"
        width={48}
        height={48}
      />
    ),
  },
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
  const [favoriteItems, setFavoriteItems] = useState([]);
  const [favoritePharmacies, setFavoritePharmacies] = useState([]);

  /* -------------------------------------------------------------------------- */
  /*                             LOAD INITIAL DATA                              */
  /* -------------------------------------------------------------------------- */

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    console.log("storedUser", storedUser);
    if (storedUser) {
      const userData = JSON.parse(storedUser);
      setUser(userData);
      setFavoriteItems(userData.favoriteItems || []);
      // Extract favorite pharmacy IDs from user data
      const favPharmIds = (userData.favoritePharmacies || []).map(
        (p) => p._id || p.id || p
      );
      setFavoritePharmacies(favPharmIds);
    }

    fetchPopularProducts();
    fetchPopularPharmacies();

    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % carouselSlides.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const syncFavorites = () => {
      const current = localStorage.getItem("user");
      if (current) {
        const parsed = JSON.parse(current);
        setFavoriteItems(parsed.favoriteItems || []);
        // Sync favorite pharmacies
        const favPharmIds = (parsed.favoritePharmacies || []).map(
          (p) => p._id || p.id || p
        );
        setFavoritePharmacies(favPharmIds);
      }
    };
    window.addEventListener("userUpdated", syncFavorites);
    return () => {
      window.removeEventListener("userUpdated", syncFavorites);
    };
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

  const handleFavoritePharmacyToggle = async (pharmacy, isFavorite) => {
    const userId = user?.id || user?._id;
    if (!userId) {
      navigate("/login");
      return;
    }
    const pharmacyId = pharmacy._id || pharmacy.id || pharmacy;
    if (!pharmacyId) return;

    try {
      if (isFavorite) {
        await userAPI.addFavoritePharmacy(userId, pharmacyId);
        setFavoritePharmacies((prev) => [...prev, pharmacyId]);
        const stored = localStorage.getItem("user");
        if (stored) {
          const parsed = JSON.parse(stored);
          const favs = parsed.favoritePharmacies || [];
          // Check if pharmacy is already in favorites
          const exists = favs.some(
            (p) => (p._id || p.id || p) === pharmacyId
          );
          if (!exists) {
            favs.push(pharmacy);
            parsed.favoritePharmacies = favs;
            localStorage.setItem("user", JSON.stringify(parsed));
            window.dispatchEvent(new Event("userUpdated"));
          }
        }
      } else {
        await userAPI.removeFavoritePharmacy(userId, pharmacyId);
        setFavoritePharmacies((prev) => prev.filter((id) => id !== pharmacyId));
        const stored = localStorage.getItem("user");
        if (stored) {
          const parsed = JSON.parse(stored);
          parsed.favoritePharmacies = (parsed.favoritePharmacies || []).filter(
            (p) => (p._id || p.id || p) !== pharmacyId
          );
          localStorage.setItem("user", JSON.stringify(parsed));
          window.dispatchEvent(new Event("userUpdated"));
        }
      }
    } catch (err) {
      console.error("Error toggling favorite pharmacy:", err);
    }
  };

  const handleFavoriteToggle = async (item, isFavorite) => {
    const userId = user?.id || user?._id;
    if (!userId) {
      navigate("/login");
      return;
    }
    const itemId = item?._id || item?.id || item?.item?._id || item?.item?.id;
    if (!itemId) return;

    try {
      if (isFavorite) {
        await userAPI.addFavoriteItem(userId, itemId);
        setFavoriteItems((prev) => [...prev, itemId]);
        const stored = localStorage.getItem("user");
        if (stored) {
          const parsed = JSON.parse(stored);
          const favs = parsed.favoriteItems || [];
          if (!favs.includes(itemId)) favs.push(itemId);
          parsed.favoriteItems = favs;
          localStorage.setItem("user", JSON.stringify(parsed));
          window.dispatchEvent(new Event("userUpdated"));
        }
      } else {
        await userAPI.removeFavoriteItem(userId, itemId);
        setFavoriteItems((prev) => prev.filter((id) => id !== itemId));
        const stored = localStorage.getItem("user");
        if (stored) {
          const parsed = JSON.parse(stored);
          parsed.favoriteItems = (parsed.favoriteItems || []).filter((id) => id !== itemId);
          localStorage.setItem("user", JSON.stringify(parsed));
          window.dispatchEvent(new Event("userUpdated"));
        }
      }
    } catch (err) {
      console.error("Error toggling favorite:", err);
    }
  };

  const handleRequestPharmacy = async (entry, quantity = 1, message = "") => {
    if (!user?.id) {
      navigate("/login");
      return false;
    }
    try {
      setRequesting(true);
      const price = entry.price || 0;
      const qty = quantity || 1;
      await orderAPI.create({
        customer: user.id,
        pharmacy: entry.pharmacy?._id || entry.pharmacy,
        items: [
          {
            item: selectedProduct.item._id || selectedProduct.item.id,
            quantity: qty,
            priceAtOrder: price,
            subtotal: price * qty,
          },
        ],
        totalAmount: price * qty,
        customerNotes: message || "Product request",
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
        {/* Background Slides */}
        {[1, 2, 3, 4, 5, 6].map((num, index) => (
          <Box
            key={index}
            sx={{
              position: "absolute",
              inset: 0,
              opacity: currentSlide === index ? 1 : 0,
              transition: "opacity 0.6s ease, transform 12s ease",
              transform: currentSlide === index ? "scale(1.03)" : "scale(1)",
              backgroundImage: `url(/images/carousel_${num}.jpg)`,
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
        {/* Floating Info Card */}
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
          <Box
            sx={{
              display: "flex",
              flexWrap: "wrap",
              gap: 2.5,
              justifyContent: "space-between",
              mb: 6,
              "& > *": {
                flex: "0 0 calc(20% - 20px)",
                maxWidth: "calc(20% - 20px)",
                minWidth: "150px",
              },
            }}
          >
            {popularProducts.map((product) => {
              console.log(product);
              // Use current month search count if available, otherwise fallback to total searchCount
              const monthlyCount = product.currentMonthSearchCount !== undefined 
                ? product.currentMonthSearchCount 
                : (product.searchCount || 0);
              const formatted =
                monthlyCount >= 1000
                  ? `+${(monthlyCount / 1000).toFixed(
                      monthlyCount % 1000 === 0 ? 0 : 1
                    )}k`
                  : `+${monthlyCount}`;

              const itemId = product._id || product.id;
              const isFavorite = itemId ? favoriteItems.includes(itemId) : false;

              return (
                <CardItem
                  key={product._id || product.name}
                  item={product}
                  onClick={() => openProductDetails(product.name)}
                  onFavoriteToggle={handleFavoriteToggle}
                  isFavorite={isFavorite}
                  showFavorite={!!user}
                  
                />
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
        </Box>

        <Box
          sx={{
            display: "flex",
            flexWrap: "wrap",
            gap: 2.5,
            justifyContent: "space-between",
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

            const pharmacyId = pharmacy._id || pharmacy.id || pharmacy;
            const isFavorite = pharmacyId
              ? favoritePharmacies.includes(pharmacyId)
              : false;

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
                  position: "relative",
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
                {user && (
                  <IconButton
                    size="small"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleFavoritePharmacyToggle(pharmacy, !isFavorite);
                    }}
                    sx={{
                      position: "absolute",
                      top: 8,
                      right: 8,
                      zIndex: 1,
                      bgcolor: "rgba(255, 255, 255, 0.9)",
                      color: isFavorite ? "error.main" : "text.secondary",
                      "&:hover": {
                        bgcolor: isFavorite ? "error.main" : "rgba(244, 67, 54, 0.1)",
                        color: isFavorite ? "white" : "error.main",
                      },
                      transition: "all 0.3s",
                    }}
                  >
                    {isFavorite ? (
                      <Favorite fontSize="small" />
                    ) : (
                      <FavoriteBorder fontSize="small" />
                    )}
                  </IconButton>
                )}
                <Box
                  sx={{
                    height: 150,
                    background: pharmacy.logoUrl
                      ? "transparent"
                      : "linear-gradient(135deg, #e0f7fa 0%, #b2ebf2 100%)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                    overflow: "hidden",
                    position: "relative",
                  }}
                >
                  {pharmacy.logoUrl ? (
                    <img
                      src={pharmacy.logoUrl.startsWith('/') ? pharmacy.logoUrl : `/${pharmacy.logoUrl}`}
                      alt={pharmacy.name}
                      style={{
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                      }}
                      onError={(e) => {
                        // Fallback to default logo if image fails to load
                        e.target.src = "/images/pharmacy_logo.png";
                      }}
                    />
                  ) : (
                    <img
                      src="/images/pharmacy_logo.png"
                      alt={pharmacy.name}
                      style={{
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                      }}
                      onError={(e) => {
                        // Final fallback to icon if default logo fails
                        e.target.style.display = "none";
                        e.target.nextSibling.style.display = "flex";
                      }}
                    />
                  )}
                  <Box
                    sx={{
                      display: "none",
                      alignItems: "center",
                      justifyContent: "center",
                      width: "100%",
                      height: "100%",
                    }}
                  >
                    <LocalPharmacy sx={{ fontSize: 64, color: "primary.main" }} />
                  </Box>
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
