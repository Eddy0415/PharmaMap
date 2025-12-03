import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  Box,
  Card,
  CardContent,
  Chip,
  Container,
  MenuItem,
  TextField,
  Typography,
} from "@mui/material";
import LocalPharmacy from "@mui/icons-material/LocalPharmacy";
import TrendingUp from "@mui/icons-material/TrendingUp";
import Room from "@mui/icons-material/Room";
import Star from "@mui/icons-material/Star";
import Header from "../components/Header";
import Footer from "../components/Footer";
import ProductDetailsDialog from "../components/ProductDetailsDialog";
import CardItem from "../components/CardItem";
import { medicationAPI, pharmacyAPI, orderAPI, userAPI } from "../services/api";

const Search = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [user, setUser] = useState(null);
  const [searchQuery, setSearchQuery] = useState(searchParams.get("q") || "");
  const [category, setCategory] = useState(searchParams.get("category") || "");
  const [loading, setLoading] = useState(false);
  const [productResults, setProductResults] = useState([]);
  const [pharmacyResults, setPharmacyResults] = useState([]);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [productPharmacies, setProductPharmacies] = useState([]);
  const [filterMode, setFilterMode] = useState("all"); // all, products, pharmacies
  const [sortMode, setSortMode] = useState("none"); // none, az, za, proximity, price
  const [favoriteItems, setFavoriteItems] = useState([]);
  const sortedProducts = useMemo(() => {
    const list = [...productResults];
    if (sortMode === "az") {
      return list.sort((a, b) => (a.item?.name || "").localeCompare(b.item?.name || ""));
    }
    if (sortMode === "za") {
      return list.sort((a, b) => (b.item?.name || "").localeCompare(a.item?.name || ""));
    }
    if (sortMode === "price") {
      return list.sort((a, b) => {
        const priceA = a.pharmacies?.[0]?.price ?? Infinity;
        const priceB = b.pharmacies?.[0]?.price ?? Infinity;
        return priceA - priceB;
      });
    }
    return list;
  }, [productResults, sortMode]);

  const sortedPharmacies = useMemo(() => {
    const list = [...pharmacyResults];
    if (sortMode === "az") {
      return list.sort((a, b) => (a.name || "").localeCompare(b.name || ""));
    }
    if (sortMode === "za") {
      return list.sort((a, b) => (b.name || "").localeCompare(a.name || ""));
    }
    if (sortMode === "proximity") {
      return list.sort((a, b) => {
        const distA = a.distance ?? Infinity;
        const distB = b.distance ?? Infinity;
        return distA - distB;
      });
    }
    return list;
  }, [pharmacyResults, sortMode]);

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      const userData = JSON.parse(storedUser);
      setUser(userData);
      setFavoriteItems(userData.favoriteItems || []);
    }

    const query = searchParams.get("q");
    const categoryParam = searchParams.get("category");
    if (query) {
      setSearchQuery(query);
      setCategory("");
      performSearch(query, null);
    } else if (categoryParam) {
      setCategory(categoryParam);
      setSearchQuery("");
      performSearch("", categoryParam);
    }
  }, [searchParams]);

  useEffect(() => {
    const syncFavorites = () => {
      const current = localStorage.getItem("user");
      if (current) {
        const parsed = JSON.parse(current);
        setFavoriteItems(parsed.favoriteItems || []);
      }
    };
    window.addEventListener("userUpdated", syncFavorites);
    return () => {
      window.removeEventListener("userUpdated", syncFavorites);
    };
  }, []);

  const normalizeProducts = (results = []) =>
    results.map((res) => ({
      item: res.item,
      pharmacies:
        res.inventory?.map((inv) => ({
          pharmacy: inv.pharmacy,
          price: inv.price,
          quantity: inv.quantity,
          stockStatus: inv.stockStatus,
        })) || [],
    }));

  const performSearch = async (query, categoryFilter = null) => {
    if (!query.trim() && !categoryFilter) return;

    setLoading(true);
    try {
      const params = { inStock: "true" };
      if (query) params.search = query;
      if (categoryFilter) params.category = categoryFilter;

      const [medsRes, pharmRes] = await Promise.all([
        medicationAPI.getAll(params),
        pharmacyAPI.getAll({ search: query || categoryFilter || "" }),
      ]);

      setProductResults(normalizeProducts(medsRes.data.results || []));

      const raw = pharmRes.data;
      const pharmacies = Array.isArray(raw?.pharmacies)
        ? raw.pharmacies
        : Array.isArray(raw?.results)
        ? raw.results
        : Array.isArray(raw)
        ? raw
        : [];
      setPharmacyResults(pharmacies);
    } catch (error) {
      console.error("Search error:", error);
      setProductResults([]);
      setPharmacyResults([]);
    } finally {
      setLoading(false);
    }
  };

  const openProductDetails = (product) => {
    setSelectedProduct({
      item: product.item,
      price: product.pharmacies?.[0]?.price,
      quantity: product.pharmacies?.[0]?.quantity,
      stockStatus: product.pharmacies?.[0]?.stockStatus,
    });
    setProductPharmacies(product.pharmacies || []);
    setDetailsDialogOpen(true);
  };

  const handleFavoriteToggle = async (item, isFavorite) => {
    const userId = user?.id || user?._id;
    if (!userId) {
      navigate("/login");
      return;
    }
    const itemId = item?.item?._id || item?.item?.id || item?._id || item?.id;
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

  const handleRequestPharmacy = async (entry) => {
    if (!user?.id) {
      navigate("/login");
      return false;
    }
    if (!selectedProduct?.item?._id && !selectedProduct?.item?.id) {
      return false;
    }
    try {
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
    } catch (error) {
      console.error("Request error:", error);
      return false;
    }
  };

  return (
    <Box component="main" sx={{ bgcolor: "background.default", minHeight: "100vh" }}>
      <Header user={user} />

      <Container component="section" maxWidth="xl" sx={{ py: 5 }}>
        <Box component="header" sx={{ mb: 4 }}>
          <Box sx={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 2 }}>
            <Box>
              <Typography component="h1" variant="h5" fontWeight={700} color="secondary" mb={0.5}>
                {category ? `Category: ${category}` : `Search Results for "${searchQuery}"`}
              </Typography>
              <Typography component="p" variant="body2" color="text.secondary">
                {productResults.length} product{productResults.length === 1 ? "" : "s"} -{" "}
                {pharmacyResults.length} pharmacies
              </Typography>
            </Box>
            <Box sx={{ display: "flex", gap: 2, alignItems: "center", flexWrap: "wrap" }}>
              <TextField
                select
                label="Sort"
                size="small"
                value={sortMode}
                onChange={(e) => {
                  const val = e.target.value;
                  setSortMode(val);
                  if (val === "proximity") setFilterMode("pharmacies");
                  if (val === "price") setFilterMode("products");
                }}
                sx={{ minWidth: 180 }}
              >
                <MenuItem value="none">None</MenuItem>
                <MenuItem value="az">Alphabetical (A -{'>'} Z)</MenuItem>
                <MenuItem value="za">Alphabetical (Z -{'>'} A)</MenuItem>
                <MenuItem value="proximity">Proximity (nearest first)</MenuItem>
                <MenuItem value="price">Price (low -{'>'} high)</MenuItem>
              </TextField>
              <TextField
                select
                label="Filter"
                size="small"
                value={filterMode}
                onChange={(e) => setFilterMode(e.target.value)}
                sx={{ minWidth: 170 }}
              >
                <MenuItem value="all">Show ALL</MenuItem>
                <MenuItem value="products">Products only</MenuItem>
                <MenuItem value="pharmacies">Pharmacies only</MenuItem>
              </TextField>
            </Box>
          </Box>
        </Box>

        {loading ? (
          <Card sx={{ p: 6, textAlign: "center" }}>
            <Typography variant="h6" color="text.secondary">
              Searching...
            </Typography>
          </Card>
        ) : (
          <>
            {/* Products section */}
            {(filterMode === "all" || filterMode === "products") &&
              sortedProducts.length > 0 && (
                <Box sx={{ mb: 4 }}>
                  <Typography variant="h6" fontWeight={700} color="secondary" mb={2}>
                    Products
                  </Typography>
                  <Box
                    sx={{
                      display: "flex",
                      flexWrap: "wrap",
                      gap: 2.5,
                    }}
                  >
                    {sortedProducts.map((product, index) => {
                      const itemId = product.item?._id || product.item?.id;
                      const isFavorite = itemId ? favoriteItems.includes(itemId) : false;

                      return (
                        <CardItem
                          key={product.item?._id || product.item?.id || product.item?.name || index}
                          item={product.item ? { ...product.item, item: product.item } : product}
                          onClick={() => openProductDetails(product)}
                          onFavoriteToggle={handleFavoriteToggle}
                          isFavorite={isFavorite}
                          showFavorite={!!user}
                          sx={{ width: 250, flexShrink: 0 }}
                    
                        />
                      );
                    })}
                  </Box>
                </Box>
              )}

            {/* Pharmacies section */}
            {(filterMode === "all" || filterMode === "pharmacies") &&
              sortedPharmacies.length > 0 && (
                <Box sx={{ mb: 4 }}>
                  <Typography variant="h6" fontWeight={700} color="secondary" mb={2}>
                    Pharmacies
                  </Typography>
                  <Box
                    sx={{
                      display: "flex",
                      flexWrap: "wrap",
                      gap: 2.5,
                      "& > *": {
                        flex: "0 0 calc(20% - 20px)",
                        maxWidth: "calc(20% - 20px)",
                        minWidth: "150px",
                      },
                    }}
                  >
                    {sortedPharmacies.map((pharmacy, index) => (
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
                          navigate(`/pharmacy/${pharmacy._id || pharmacy.id || pharmacy.name}`)
                        }
                      >
                        <Box
                          sx={{
                            height: 150,
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
                              sx={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}
                            >
                              {pharmacy.name}
                            </Typography>
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
                                sx={{ display: "flex", alignItems: "center", gap: 0.5 }}
                              >
                                <Room fontSize="small" sx={{ mr: 0.2, color: "primary.main" }} />
                                {pharmacy.address?.city || pharmacy.city || "Lebanon"}
                              </Typography>
                              {(() => {
                                const rawRating = pharmacy.averageRating ?? pharmacy.rating;
                                const numericRating =
                                  rawRating !== undefined && rawRating !== null
                                    ? Number(rawRating)
                                    : null;
                                if (numericRating === null || !Number.isFinite(numericRating)) return null;
                                return (
                                  <Typography
                                    variant="body2"
                                    color="text.secondary"
                                    sx={{ display: "flex", alignItems: "center", gap: 0.25 }}
                                  >
                                    <Star sx={{ fontSize: 18, color: "primary.main" }} />
                                    {numericRating.toFixed(1)}
                                  </Typography>
                                );
                              })()}
                            </Box>
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
                </Box>
              )}
          </>
        )}
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
        onRequestPharmacy={handleRequestPharmacy}
      />

      <Footer />
    </Box>
  );
};

export default Search;


