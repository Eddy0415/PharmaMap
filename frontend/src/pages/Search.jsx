import React, { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Container,
  InputAdornment,
  TextField,
  Typography,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import LocalPharmacy from "@mui/icons-material/LocalPharmacy";
import TrendingUp from "@mui/icons-material/TrendingUp";
import Room from "@mui/icons-material/Room";
import Header from "../components/Header";
import Footer from "../components/Footer";
import ProductDetailsDialog from "../components/ProductDetailsDialog";
import { medicationAPI, pharmacyAPI } from "../services/api";

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

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) setUser(JSON.parse(storedUser));

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

      const pharmacies =
        pharmRes.data?.pharmacies ||
        pharmRes.data?.results ||
        (Array.isArray(pharmRes.data) ? pharmRes.data : []);
      setPharmacyResults(pharmacies || []);
    } catch (error) {
      console.error("Search error:", error);
      setProductResults([]);
      setPharmacyResults([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim() || category) {
      navigate(
        `/search?${searchQuery ? `q=${encodeURIComponent(searchQuery)}` : ""}${
          category ? `&category=${encodeURIComponent(category)}` : ""
        }`
      );
      performSearch(searchQuery, category || null);
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

  return (
    <Box component="main" sx={{ bgcolor: "background.default", minHeight: "100vh" }}>
      <Header user={user} />

      <Container component="section" maxWidth="xl" sx={{ py: 5 }}>
        <Box component="header" sx={{ mb: 4 }}>
          <Box
            component="form"
            onSubmit={handleSearch}
            role="search"
            sx={{ display: "flex", gap: 2, mb: 3 }}
          >
            <TextField
              fullWidth
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search for medications or pharmacies..."
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon sx={{ color: "primary.main" }} />
                  </InputAdornment>
                ),
                sx: { bgcolor: "white", borderRadius: 3 },
              }}
            />
            <Button
              type="submit"
              variant="contained"
              size="large"
              startIcon={<SearchIcon />}
              sx={{
                px: 4,
                background: "linear-gradient(135deg, #4ecdc4 0%, #44a9a3 100%)",
                whiteSpace: "nowrap",
              }}
            >
              Search
            </Button>
          </Box>

          <Box sx={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 2 }}>
            <Box>
              <Typography component="h1" variant="h5" fontWeight={700} color="secondary" mb={0.5}>
                {category ? `Category: ${category}` : `Search Results for "${searchQuery}"`}
              </Typography>
              <Typography component="p" variant="body2" color="text.secondary">
                {productResults.length} product{productResults.length === 1 ? "" : "s"} ·{" "}
                {pharmacyResults.length} pharmacy{pharmacyResults.length === 1 ? "" : "ies"}
              </Typography>
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
            <Box sx={{ mb: 4 }}>
              <Typography variant="h6" fontWeight={700} color="secondary" mb={2}>
                Products
              </Typography>
              {productResults.length === 0 ? (
                <Card sx={{ p: 4, textAlign: "center" }}>
                  <Typography variant="body1" color="text.secondary">
                    No products found.
                  </Typography>
                </Card>
              ) : (
                <Box
                  sx={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
                    gap: 3,
                    alignItems: "stretch",
                    gridAutoRows: 320, // fixed row height for all product cards
                  }}
                >
                  {productResults.map((product) => (
                    <Card
                      key={product.item?._id || product.item?.name}
                      sx={{
                        width: "100%",
                        height: "100%",
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
                      onClick={() => openProductDetails(product)}
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
                          {product.item?.name}
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
                          {product.item?.category || "General"}
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
                          {product.pharmacies?.length || 0} pharmacies nearby
                        </Typography>
                      </CardContent>
                    </Card>
                  ))}
                </Box>
              )}
            </Box>

            {/* Pharmacies section */}
            <Box sx={{ mb: 4 }}>
              <Typography variant="h6" fontWeight={700} color="secondary" mb={2}>
                Pharmacies
              </Typography>
              {pharmacyResults.length === 0 ? (
                <Card sx={{ p: 4, textAlign: "center" }}>
                  <Typography variant="body1" color="text.secondary">
                    No pharmacies found.
                  </Typography>
                </Card>
              ) : (
                <Box
                  sx={{
                    display: "grid",
                    // 3x the product min width: 3 * 220px = 660px
                    gridTemplateColumns: "repeat(auto-fill, minmax(660px, 1fr))",
                    gap: 3,
                    alignItems: "stretch",
                    gridAutoRows: 400, // fixed row height for all pharmacy cards
                  }}
                >
                  {pharmacyResults.map((pharmacy) => (
                    <Card
                      key={pharmacy._id || pharmacy.id || pharmacy.name}
                      sx={{
                        width: "100%",
                        height: "100%",
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
                          height: 200,
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
                          pb: 4,
                          pt: 3,
                          px: 3,
                          overflow: "hidden",
                        }}
                      >
                        <Box>
                          <Typography variant="h6" fontWeight={600} color="secondary" mb={1}>
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
                            <Room fontSize="small" sx={{ mr: 0.5, color: "primary.main" }} />
                            {pharmacy.address?.city || "Lebanon"}
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
              )}
            </Box>
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
      />

      <Footer />
    </Box>
  );
};

export default Search;
