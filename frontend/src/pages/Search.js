import React, { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  Container,
  Box,
  Typography,
  TextField,
  Button,
  Card,
  CardContent,
  Grid,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Chip,
  IconButton,
  InputAdornment,
} from "@mui/material";
import {
  Search as SearchIcon,
  LocalPharmacy,
  Phone,
  Schedule,
  Room,
  FilterList,
} from "@mui/icons-material";
import Header from "../components/Header";
import Footer from "../components/Footer";
import ProductOrderDialog from "../components/ProductOrderDialog";
import { medicationAPI, pharmacyAPI } from "../services/api";

const Search = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [user, setUser] = useState(null);
  const [searchQuery, setSearchQuery] = useState(searchParams.get("q") || "");
  const [category, setCategory] = useState(searchParams.get("category") || "");
  const [sortBy, setSortBy] = useState("distance");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [orderDialogOpen, setOrderDialogOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [selectedPharmacy, setSelectedPharmacy] = useState(null);

  useEffect(() => {
    // Load user from localStorage
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }

    // Perform search if query or category exists
    const query = searchParams.get("q");
    const categoryParam = searchParams.get("category");
    if (query) {
      setSearchQuery(query);
      setCategory("");
      performSearch(query, null);
    } else if (categoryParam) {
      setCategory(categoryParam);
      setSearchQuery("");
      performCategorySearch(categoryParam);
    }
  }, [searchParams]);

  const performSearch = async (query, categoryFilter = null) => {
    if (!query.trim() && !categoryFilter) return;

    setLoading(true);
    try {
      const params = {};
      if (query) params.search = query;
      if (categoryFilter) params.category = categoryFilter;
      // Always include inStock to get inventory data
      params.inStock = "true";

      const response = await medicationAPI.getAll(params);
      console.log("Search response:", response.data);

      // Transform results to match expected format
      const transformedResults = [];
      response.data.results?.forEach((result) => {
        if (result.inventory && result.inventory.length > 0) {
          result.inventory.forEach((inv) => {
            if (inv.pharmacy) {
              const pharmacyId = inv.pharmacy._id || inv.pharmacy;
              let pharmacyResult = transformedResults.find(
                (r) => (r.pharmacy._id || r.pharmacy) === pharmacyId
              );

              if (!pharmacyResult) {
                pharmacyResult = {
                  pharmacy: inv.pharmacy,
                  items: [],
                };
                transformedResults.push(pharmacyResult);
              }

              pharmacyResult.items.push({
                item: result.item,
                price: inv.price,
                quantity: inv.quantity,
                stockStatus: inv.stockStatus,
              });
            }
          });
        }
      });

      console.log("Transformed results:", transformedResults);
      setResults(transformedResults);
    } catch (error) {
      console.error("Search error:", error);
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  const performCategorySearch = async (categoryName) => {
    setLoading(true);
    try {
      // Use getAll with category filter and inStock to get inventory
      const response = await medicationAPI.getAll({
        category: categoryName,
        inStock: "true",
      });
      console.log("Category search response:", response.data);

      // Transform results to match expected format
      const transformedResults = [];
      response.data.results?.forEach((result) => {
        if (result.inventory && result.inventory.length > 0) {
          result.inventory.forEach((inv) => {
            if (inv.pharmacy) {
              const pharmacyId = inv.pharmacy._id || inv.pharmacy;
              let pharmacyResult = transformedResults.find(
                (r) => (r.pharmacy._id || r.pharmacy) === pharmacyId
              );

              if (!pharmacyResult) {
                pharmacyResult = {
                  pharmacy: inv.pharmacy,
                  items: [],
                };
                transformedResults.push(pharmacyResult);
              }

              pharmacyResult.items.push({
                item: result.item,
                price: inv.price,
                quantity: inv.quantity,
                stockStatus: inv.stockStatus,
              });
            }
          });
        }
      });

      console.log("Transformed category results:", transformedResults);
      setResults(transformedResults);
    } catch (error) {
      console.error("Category search error:", error);
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery)}`);
      performSearch(searchQuery);
    }
  };

  const handleSortChange = (e) => {
    setSortBy(e.target.value);
    // Re-sort current results
    const sorted = [...results];
    switch (e.target.value) {
      case "price-low":
        sorted.sort((a, b) => {
          const aPrice = a.items?.[0]?.price || 0;
          const bPrice = b.items?.[0]?.price || 0;
          return aPrice - bPrice;
        });
        break;
      case "price-high":
        sorted.sort((a, b) => {
          const aPrice = a.items?.[0]?.price || 0;
          const bPrice = b.items?.[0]?.price || 0;
          return bPrice - aPrice;
        });
        break;
      case "availability":
        sorted.sort((a, b) => {
          const statusOrder = {
            "in-stock": 0,
            "low-stock": 1,
            "out-of-stock": 2,
          };
          const aStatus = a.items?.[0]?.stockStatus || "out-of-stock";
          const bStatus = b.items?.[0]?.stockStatus || "out-of-stock";
          return statusOrder[aStatus] - statusOrder[bStatus];
        });
        break;
      default:
        // distance sorting would require coordinates
        break;
    }
    setResults(sorted);
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

  const getStockStatusText = (status) => {
    switch (status) {
      case "in-stock":
        return "In Stock";
      case "low-stock":
        return "Low Stock";
      case "out-of-stock":
        return "Out of Stock";
      default:
        return "Unknown";
    }
  };

  return (
    <Box
      component="main"
      sx={{ bgcolor: "background.default", minHeight: "100vh" }}
    >
      <Header user={user} />

      <Container component="section" maxWidth="xl" sx={{ py: 5 }}>
        {/* Search Header */}
        <Box component="header" sx={{ mb: 4 }}>
          <Box
            component="form"
            onSubmit={handleSearch}
            role="search"
            sx={{
              display: "flex",
              gap: 2,
              mb: 3,
            }}
          >
            <TextField
              fullWidth
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search for medications..."
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon sx={{ color: "primary.main" }} />
                  </InputAdornment>
                ),
                sx: {
                  bgcolor: "white",
                  borderRadius: 3,
                },
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

          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              flexWrap: "wrap",
              gap: 2,
            }}
          >
            <Box>
              <Typography
                component="h1"
                variant="h5"
                fontWeight={700}
                color="secondary"
                mb={0.5}
              >
                {category
                  ? `Category: ${category}`
                  : `Search Results for "${searchQuery}"`}
              </Typography>
              <Typography component="p" variant="body2" color="text.secondary">
                Found {results.length}{" "}
                {results.length === 1 ? "pharmacy" : "pharmacies"}
              </Typography>
            </Box>

            <Box sx={{ display: "flex", gap: 2, alignItems: "center" }}>
              <Button
                variant="outlined"
                startIcon={<FilterList />}
                sx={{
                  borderColor: "#e0e0e0",
                  color: "text.primary",
                }}
              >
                Filters
              </Button>
              <FormControl sx={{ minWidth: 200 }}>
                <InputLabel>Sort by</InputLabel>
                <Select
                  value={sortBy}
                  onChange={handleSortChange}
                  label="Sort by"
                  sx={{ bgcolor: "white" }}
                >
                  <MenuItem value="distance">Distance</MenuItem>
                  <MenuItem value="price-low">Price: Low to High</MenuItem>
                  <MenuItem value="price-high">Price: High to Low</MenuItem>
                  <MenuItem value="availability">Availability</MenuItem>
                </Select>
              </FormControl>
            </Box>
          </Box>
        </Box>

        {/* Results */}
        {loading ? (
          <Box sx={{ textAlign: "center", py: 8 }}>
            <Typography variant="h6" color="text.secondary">
              Searching...
            </Typography>
          </Box>
        ) : results.length === 0 ? (
          <Card sx={{ p: 8, textAlign: "center" }}>
            <SearchIcon sx={{ fontSize: 80, color: "#e0e0e0", mb: 2 }} />
            <Typography variant="h5" color="text.secondary" mb={1}>
              No Results Found
            </Typography>
            <Typography variant="body1" color="text.secondary" mb={3}>
              We couldn't find any pharmacies with this medication in stock.
            </Typography>
            <Button
              variant="contained"
              onClick={() => navigate("/")}
              sx={{
                background: "linear-gradient(135deg, #4ecdc4 0%, #44a9a3 100%)",
              }}
            >
              Back to Home
            </Button>
          </Card>
        ) : (
          <Grid container spacing={2}>
            {results.map((result) => (
              <Grid item xs={12} md={4} key={result.pharmacy._id}>
                <Card
                  sx={{
                    transition: "all 0.3s",
                    cursor: "pointer",
                    "&:hover": {
                      transform: "translateY(-2px)",
                      boxShadow: "0 4px 16px rgba(0,0,0,0.1)",
                    },
                  }}
                  onClick={() => navigate(`/pharmacy/${result.pharmacy._id}`)}
                >
                  <CardContent sx={{ p: 2 }}>
                    <Grid container spacing={1.5} alignItems="center">
                      {/* Pharmacy Logo */}
                      <Grid item>
                        <Box
                          sx={{
                            width: 60,
                            height: 60,
                            borderRadius: 2,
                            background:
                              "linear-gradient(135deg, #e0f7fa 0%, #b2ebf2 100%)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                          }}
                        >
                          <LocalPharmacy
                            sx={{ fontSize: 32, color: "primary.main" }}
                          />
                        </Box>
                      </Grid>

                      {/* Pharmacy Info */}
                      <Grid item xs>
                        <Typography
                          variant="h6"
                          fontWeight={700}
                          color="secondary"
                          mb={0.5}
                          sx={{ fontSize: "0.95rem" }}
                        >
                          {result.pharmacy.name}
                        </Typography>
                        <Box
                          sx={{
                            display: "flex",
                            flexDirection: "column",
                            gap: 0.5,
                            mb: 1,
                          }}
                        >
                          <Box
                            sx={{
                              display: "flex",
                              alignItems: "center",
                              gap: 0.5,
                              color: "text.secondary",
                            }}
                          >
                            <Room
                              sx={{ fontSize: 14, color: "primary.main" }}
                            />
                            <Typography variant="caption" noWrap>
                              {result.pharmacy.address.street},{" "}
                              {result.pharmacy.address.city}
                            </Typography>
                          </Box>
                          <Box
                            sx={{
                              display: "flex",
                              alignItems: "center",
                              gap: 0.5,
                              color: "text.secondary",
                            }}
                          >
                            <Phone
                              sx={{ fontSize: 14, color: "primary.main" }}
                            />
                            <Typography variant="caption">
                              {result.pharmacy.phone}
                            </Typography>
                          </Box>
                          <Box
                            sx={{
                              display: "flex",
                              alignItems: "center",
                              gap: 0.5,
                              color: "text.secondary",
                            }}
                          >
                            <Schedule
                              sx={{ fontSize: 14, color: "primary.main" }}
                            />
                            <Typography variant="caption">
                              {result.pharmacy.is24Hours
                                ? "24/7"
                                : "Limited Hours"}
                            </Typography>
                          </Box>
                        </Box>

                        {/* Items List */}
                        <Box
                          sx={{
                            display: "flex",
                            gap: 0.5,
                            flexWrap: "wrap",
                            mb: 1,
                          }}
                        >
                          {result.items?.slice(0, 2).map((itemData, idx) => (
                            <Chip
                              key={idx}
                              label={`${itemData.item?.name || "Unknown"} - $${
                                itemData.price?.toFixed(2) || "0.00"
                              }`}
                              size="small"
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedProduct({
                                  ...itemData,
                                  item: itemData.item,
                                  price: itemData.price,
                                  quantity: itemData.quantity,
                                  stockStatus: itemData.stockStatus,
                                });
                                setSelectedPharmacy(result.pharmacy);
                                setOrderDialogOpen(true);
                              }}
                              sx={{
                                ...getStockStatusColor(itemData.stockStatus),
                                fontWeight: 600,
                                cursor: "pointer",
                                fontSize: "0.7rem",
                                height: 20,
                                "&:hover": {
                                  opacity: 0.8,
                                  transform: "scale(1.05)",
                                },
                              }}
                            />
                          ))}
                          {result.items?.length > 2 && (
                            <Chip
                              label={`+${result.items.length - 2} more`}
                              size="small"
                              variant="outlined"
                              onClick={(e) => {
                                e.stopPropagation();
                                navigate(`/pharmacy/${result.pharmacy._id}`);
                              }}
                              sx={{
                                cursor: "pointer",
                                fontSize: "0.7rem",
                                height: 20,
                              }}
                            />
                          )}
                        </Box>
                      </Grid>

                      {/* Price and Actions */}
                      <Grid item sx={{ textAlign: "right" }}>
                        <Typography
                          variant="h6"
                          fontWeight={700}
                          color="primary.main"
                          mb={0.5}
                          sx={{ fontSize: "1rem" }}
                        >
                          ${result.items?.[0]?.price?.toFixed(2) || "0.00"}
                        </Typography>
                        <Chip
                          label={getStockStatusText(
                            result.items?.[0]?.stockStatus || "out-of-stock"
                          )}
                          size="small"
                          sx={{
                            ...getStockStatusColor(
                              result.items?.[0]?.stockStatus || "out-of-stock"
                            ),
                            fontWeight: 600,
                            mb: 1,
                            fontSize: "0.7rem",
                            height: 20,
                          }}
                        />
                        <Box
                          sx={{
                            display: "flex",
                            gap: 0.5,
                            flexDirection: "column",
                          }}
                        >
                          <Button
                            variant="outlined"
                            size="small"
                            startIcon={<Room sx={{ fontSize: 14 }} />}
                            onClick={(e) => {
                              e.stopPropagation();
                              alert(`Opening map for ${result.pharmacy.name}`);
                            }}
                            sx={{
                              fontSize: "0.75rem",
                              minWidth: "auto",
                              px: 1,
                            }}
                          >
                            Map
                          </Button>
                          <Button
                            variant="contained"
                            size="small"
                            startIcon={<Phone sx={{ fontSize: 14 }} />}
                            onClick={(e) => {
                              e.stopPropagation();
                              window.location.href = `tel:${result.pharmacy.phone}`;
                            }}
                            disabled={
                              result.items?.[0]?.stockStatus === "out-of-stock"
                            }
                            sx={{
                              background:
                                "linear-gradient(135deg, #4ecdc4 0%, #44a9a3 100%)",
                              fontSize: "0.75rem",
                              minWidth: "auto",
                              px: 1,
                            }}
                          >
                            Call
                          </Button>
                        </Box>
                      </Grid>
                    </Grid>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        )}
      </Container>

      <ProductOrderDialog
        open={orderDialogOpen}
        onClose={() => {
          setOrderDialogOpen(false);
          setSelectedProduct(null);
          setSelectedPharmacy(null);
        }}
        product={selectedProduct}
        pharmacy={selectedPharmacy}
        user={user}
        onOrderSuccess={(order) => {
          console.log("Order placed:", order);
        }}
      />

      <Footer />
    </Box>
  );
};

export default Search;
