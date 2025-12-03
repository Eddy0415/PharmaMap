import React, { useEffect, useMemo, useState } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Typography,
  Box,
  Chip,
  Button,
  IconButton,
  TextField,
  Menu,
  MenuItem,
} from "@mui/material";
import Close from "@mui/icons-material/Close";
import ArrowBack from "@mui/icons-material/ArrowBack";
import LocalPharmacy from "@mui/icons-material/LocalPharmacy";
import CheckCircle from "@mui/icons-material/CheckCircle";
import Room from "@mui/icons-material/Room";
import Add from "@mui/icons-material/Add";
import Remove from "@mui/icons-material/Remove";
import Sort from "@mui/icons-material/Sort";
import Favorite from "@mui/icons-material/Favorite";
import FavoriteBorder from "@mui/icons-material/FavoriteBorder";
import { useGeolocation } from "../hooks/useGeolocation";
import { userAPI } from "../services/api";

const InfoRow = ({ label, value }) => {
  if (!value) return null;
  return (
    <Box sx={{ mb: 1.5 }}>
      <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 0.5 }}>
        {label}
      </Typography>
      <Typography variant="body1" color="text.primary">
        {value}
      </Typography>
    </Box>
  );
};

// Helper function to calculate distance between two coordinates (Haversine formula)
const calculateDistance = (lat1, lon1, lat2, lon2) => {
  if (!lat2 || !lon2) return null; // Return null if coordinates are missing
  const R = 6371; // Radius of the Earth in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c; // Distance in km
};

const ProductDetailsDialog = ({
  open,
  onClose,
  product,
  pharmacies = [],
  onSelectPharmacy,
  onRequestPharmacy, // optional, should return Promise<boolean>
  singlePharmacyEntry,
}) => {
  const isSinglePharmacy = !!singlePharmacyEntry;
  const [showPharmacies, setShowPharmacies] = useState(false);
  const { location, requestLocation } = useGeolocation();
  const [requestStatus, setRequestStatus] = useState({});
  const [quantities, setQuantities] = useState({});
  const [requestDialogOpen, setRequestDialogOpen] = useState(false);
  const [requestEntry, setRequestEntry] = useState(null);
  const [requestQuantity, setRequestQuantity] = useState(1);
  const [requestMessage, setRequestMessage] = useState("");
  const [listMode, setListMode] = useState("all");
  const [sortMode, setSortMode] = useState("distance");
  const [sortMenuAnchor, setSortMenuAnchor] = useState(null);
  const isAllSelected = showPharmacies && listMode === "all";
  const isNearbySelected = showPharmacies && listMode === "nearby";

  // ⭐ Favorites
  const [user, setUser] = useState(null);
  const [isFavorite, setIsFavorite] = useState(false);

  // Sort pharmacies by distance if location is available
  const sortedPharmacies = useMemo(() => {
    if (!location || pharmacies.length === 0) return pharmacies;

    const distanceSorted = [...pharmacies].map((entry) => {
      const coords = entry.pharmacy?.address?.coordinates?.coordinates;
      let distance = null;

      if (coords && Array.isArray(coords) && coords.length === 2) {
        const [longitude, latitude] = coords;
        distance = calculateDistance(
          location.latitude,
          location.longitude,
          latitude,
          longitude
        );
      }

      return { ...entry, distance };
    });

    // Base sort by distance (nearest first)
    return distanceSorted.sort((a, b) => {
      if (a.distance === null && b.distance === null) return 0;
      if (a.distance === null) return 1;
      if (b.distance === null) return -1;
      return a.distance - b.distance;
    });
  }, [pharmacies, location]);

  const visiblePharmacies =
    listMode === "nearby"
      ? sortedPharmacies.filter(
          (entry) =>
            entry.distance !== null &&
            entry.distance !== undefined &&
            entry.distance <= 10
        )
      : sortedPharmacies;

  const sortedVisiblePharmacies = useMemo(() => {
    const cloned = [...visiblePharmacies];
    if (sortMode === "name") {
      cloned.sort((a, b) =>
        (a.pharmacy?.name || "").localeCompare(b.pharmacy?.name || "")
      );
    } else if (sortMode === "price") {
      cloned.sort((a, b) => (a.price || 0) - (b.price || 0));
    }
    // default distance sort already applied in sortedPharmacies
    return cloned;
  }, [visiblePharmacies, sortMode]);

  const pharmacyCount = isSinglePharmacy ? 1 : pharmacies.length;
  const nearbyCount = sortedPharmacies.filter(
    (p) => p.distance !== null && p.distance !== undefined && p.distance <= 10
  ).length;

  const composition = useMemo(() => {
    if (!product?.item) return null;
    return (
      product.item.composition ||
      product.item.activeIngredient ||
      product.item.ingredients
    );
  }, [product]);

  // Reset dialog + request location on open
  useEffect(() => {
    if (!open) return;
    setShowPharmacies(false);
    setRequestStatus({});
    setQuantities({});
    setRequestDialogOpen(false);
    setRequestEntry(null);
    setRequestQuantity(1);
    setRequestMessage("");
    setListMode("all");
    // Request location when dialog opens
    requestLocation();
  }, [open, requestLocation]);

  // Load user from localStorage and set initial favorite state
  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      const parsed = JSON.parse(storedUser);
      const normalized = {
        ...parsed,
        id: parsed.id || parsed._id || parsed.userId,
      };
      setUser(normalized);

      if (product?.item?._id || product?.item?.id) {
        const itemId = product.item._id || product.item.id;
        const favs = normalized.favoriteItems || [];
        setIsFavorite(favs.includes(itemId));
      } else {
        setIsFavorite(false);
      }
    } else {
      setUser(null);
      setIsFavorite(false);
    }
  }, [open, product]);

  if (!product) return null;

  const handleSelectEntry = (entry) => {
    onSelectPharmacy(entry.pharmacy);
  };

  const openRequestDialog = (entry) => {
    const id = String(entry.pharmacy._id || entry.pharmacy.id || entry.pharmacy);
    const qty = Number(quantities[String(id)] ?? 1);
    setRequestEntry(entry);
    setRequestQuantity(qty);
    setRequestMessage("");
    setRequestDialogOpen(true);
  };

  const handleSendRequest = async () => {
    if (!onRequestPharmacy || !requestEntry) return;
    const id = String(
      requestEntry.pharmacy._id || requestEntry.pharmacy.id || requestEntry.pharmacy
    );
    setRequestStatus((prev) => ({ ...prev, [id]: "sending" }));
    try {
      const ok = await onRequestPharmacy(
        requestEntry,
        requestQuantity,
        requestMessage
      );
      if (ok) {
        setQuantities((prev) => ({ ...prev, [id]: requestQuantity }));
        setRequestStatus((prev) => ({ ...prev, [id]: "sent" }));
        setRequestDialogOpen(false);
      } else {
        setRequestStatus((prev) => ({ ...prev, [id]: undefined }));
      }
    } catch (err) {
      console.error("Request error", err);
      setRequestStatus((prev) => ({ ...prev, [id]: undefined }));
    }
  };

  // ⭐ Toggle favorite product
  const handleToggleFavorite = async () => {
    if (!user?.id) return;
    const itemId = product.item?._id || product.item?.id;
    if (!itemId) return;

    try {
      if (isFavorite) {
        // Remove favorite
        await userAPI.removeFavoriteItem(user.id, itemId);
        setIsFavorite(false);

        const stored = localStorage.getItem("user");
        if (stored) {
          const parsed = JSON.parse(stored);
          const favs = parsed.favoriteItems || [];
          parsed.favoriteItems = favs.filter((id) => id !== itemId);
          localStorage.setItem("user", JSON.stringify(parsed));
        }
      } else {
        // Add favorite
        await userAPI.addFavoriteItem(user.id, itemId);
        setIsFavorite(true);

        const stored = localStorage.getItem("user");
        if (stored) {
          const parsed = JSON.parse(stored);
          const favs = parsed.favoriteItems || [];
          if (!favs.includes(itemId)) favs.push(itemId);
          parsed.favoriteItems = favs;
          localStorage.setItem("user", JSON.stringify(parsed));
        }
      }
    } catch (err) {
      console.error("Error toggling favourite:", err);
    }
  };

  const renderPharmacyList = () => (
    <Box sx={{ mt: 2 }}>
      <Box sx={{ display: "flex", justifyContent: "flex-end", mb: 1 }}>
        <IconButton
          size="small"
          onClick={(e) => setSortMenuAnchor(e.currentTarget)}
          aria-label="Sort pharmacies"
        >
          <Sort />
        </IconButton>
        <Menu
          anchorEl={sortMenuAnchor}
          open={Boolean(sortMenuAnchor)}
          onClose={() => setSortMenuAnchor(null)}
        >
          <MenuItem
            selected={sortMode === "name"}
            onClick={() => {
              setSortMode("name");
              setSortMenuAnchor(null);
            }}
          >
            Sort by Name (A → Z)
          </MenuItem>
          <MenuItem
            selected={sortMode === "price"}
            onClick={() => {
              setSortMode("price");
              setSortMenuAnchor(null);
            }}
          >
            Sort by Price (Low → High)
          </MenuItem>
          <MenuItem
            selected={sortMode === "distance"}
            onClick={() => {
              setSortMode("distance");
              setSortMenuAnchor(null);
            }}
          >
            Sort by Distance (Nearest First)
          </MenuItem>
        </Menu>
      </Box>
      {sortedVisiblePharmacies.map((entry) => (
        <Box
          key={String(
            entry.pharmacy._id || entry.pharmacy.id || entry.pharmacy.name
          )}
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 2,
            p: 2,
            borderRadius: 2,
            border: "1px solid #e0e0e0",
            mb: 1.5,
            bgcolor: "background.paper",
          }}
        >
          <Box
            sx={{
              width: 52,
              height: 52,
              borderRadius: 2,
              bgcolor: "#e0f7fa",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <LocalPharmacy sx={{ color: "primary.main" }} />
          </Box>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography variant="subtitle1" fontWeight={700} noWrap>
              {entry.pharmacy.name}
            </Typography>
            <Typography
              variant="body2"
              color="text.secondary"
              noWrap
              sx={{ mt: 0.25 }}
            >
              {entry.pharmacy.address?.street
                ? `${entry.pharmacy.address.street}, ${
                    entry.pharmacy.address.city || ""
                  }`
                : entry.pharmacy.address?.city || "Lebanon"}
            </Typography>
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 1,
                mt: 0.5,
                flexWrap: "wrap",
              }}
            >
              <Chip
                size="small"
                label={`$${entry.price?.toFixed(2) ?? "N/A"}`}
                sx={{ fontWeight: 700 }}
              />
              <Chip
                size="small"
                color={
                  entry.stockStatus === "in-stock"
                    ? "success"
                    : entry.stockStatus === "low-stock"
                    ? "warning"
                    : "default"
                }
                label={
                  entry.stockStatus === "low-stock"
                    ? "Low stock"
                    : entry.stockStatus === "out-of-stock"
                    ? "Out of stock"
                    : "In stock"
                }
              />
              {entry.distance !== null && location && (
                <Chip
                  size="small"
                  icon={<Room sx={{ fontSize: 14 }} />}
                  label={
                    entry.distance < 1
                      ? `${(entry.distance * 1000).toFixed(0)}m away`
                      : `${entry.distance.toFixed(1)}km away`
                  }
                  sx={{
                    color: "primary.main",
                    borderColor: "primary.main",
                  }}
                  variant="outlined"
                />
              )}
            </Box>
          </Box>
          <Box sx={{ display: "flex", gap: 1, alignItems: "center" }}>
            <Button
              variant="contained"
              size="small"
              onClick={() => handleSelectEntry(entry)}
              sx={{
                background: "linear-gradient(135deg, #4ecdc4 0%, #44a9a3 100%)",
                whiteSpace: "nowrap",
              }}
            >
              View Pharmacy
            </Button>
            {onRequestPharmacy && (
              <Button
                variant={
                  requestStatus[
                    String(
                      entry.pharmacy._id || entry.pharmacy.id || entry.pharmacy
                    )
                  ] === "sent"
                    ? "contained"
                    : "outlined"
                }
                size="small"
                onClick={() => openRequestDialog(entry)}
                disabled={
                  requestStatus[
                    String(
                      entry.pharmacy._id || entry.pharmacy.id || entry.pharmacy
                    )
                  ] === "sent" ||
                  requestStatus[
                    String(
                      entry.pharmacy._id || entry.pharmacy.id || entry.pharmacy
                    )
                  ] === "sending"
                }
                sx={
                  requestStatus[
                    String(
                      entry.pharmacy._id || entry.pharmacy.id || entry.pharmacy
                    )
                  ] === "sent"
                    ? {
                        bgcolor: "#4caf50",
                        color: "white",
                        "&:hover": { bgcolor: "#43a047" },
                      }
                    : {}
                }
              >
                {requestStatus[
                  String(
                    entry.pharmacy._id || entry.pharmacy.id || entry.pharmacy
                  )
                ] === "sent"
                  ? "Request sent"
                  : "Request"}
              </Button>
            )}
          </Box>
        </Box>
      ))}
      {visiblePharmacies.length === 0 && (
        <Typography color="text.secondary" textAlign="center" sx={{ py: 3 }}>
          No pharmacies found for this filter.
        </Typography>
      )}
    </Box>
  );

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{ sx: { borderRadius: 3 } }}
    >
      <DialogTitle sx={{ pb: 1 }}>
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            {showPharmacies && !isSinglePharmacy && (
              <IconButton
                size="small"
                onClick={() => {
                  setShowPharmacies(false);
                }}
              >
                <ArrowBack fontSize="small" />
              </IconButton>
            )}
            <Typography variant="h5" fontWeight={800} color="secondary">
              {showPharmacies && !isSinglePharmacy
                ? listMode === "nearby"
                  ? "Pharmacies Nearby"
                  : "Available Pharmacies"
                : product.item?.name || "Product"}
            </Typography>
          </Box>
          <IconButton onClick={onClose} size="small">
            <Close />
          </IconButton>
        </Box>
      </DialogTitle>

      <DialogContent dividers sx={{ pt: 2, pb: 3 }}>
        {!showPharmacies || isSinglePharmacy ? (
          <>
            <Box sx={{ display: "flex", gap: 2, mb: 2, alignItems: "center" }}>
              <Box
                sx={{
                  width: 96,
                  height: 96,
                  borderRadius: 2,
                  bgcolor: product.item?.imageUrl ? "transparent" : "#e0f7fa",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                  overflow: "hidden",
                  position: "relative",
                }}
              >
                {product.item?.imageUrl ? (
                  <img
                    src={product.item.imageUrl}
                    alt={product.item?.name}
                    style={{
                      width: "100%",
                      height: "100%",
                      objectFit: "cover",
                      borderRadius: "8px",
                    }}
                    onError={(e) => {
                      // Fallback to icon if image fails to load
                      e.target.style.display = "none";
                      e.target.nextSibling.style.display = "flex";
                    }}
                  />
                ) : null}
                <Box
                  sx={{
                    display: product.item?.imageUrl ? "none" : "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    width: "100%",
                    height: "100%",
                  }}
                >
                  <LocalPharmacy sx={{ fontSize: 48, color: "primary.main" }} />
                </Box>
              </Box>
              <Box sx={{ flex: 1 }}>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <Typography variant="h6" fontWeight={700} color="secondary">
                    {product.item?.name}
                  </Typography>

                  {user && (
                    <IconButton
                      size="small"
                      onClick={handleToggleFavorite}
                      sx={{
                        color: isFavorite ? "error.main" : "text.secondary",
                      }}
                    >
                      {isFavorite ? <Favorite /> : <FavoriteBorder />}
                    </IconButton>
                  )}
                </Box>
                <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap", mt: 1 }}>
                  {product.item?.category && (
                    <Chip label={product.item.category} size="small" />
                  )}
                  {product.item?.dosage && (
                    <Chip label={product.item.dosage} size="small" />
                  )}
                  {product.item?.form && (
                    <Chip label={product.item.form} size="small" />
                  )}
                  {product.item?.brand && (
                    <Chip label={product.item.brand} size="small" />
                  )}
                </Box>
              </Box>
            </Box>

            <InfoRow label="Composition" value={composition} />
            <InfoRow label="Usage" value={product.item?.usage} />
            <InfoRow label="Description" value={product.item?.description} />
            <InfoRow label="Side Effects" value={product.item?.sideEffects} />
          </>
        ) : (
          renderPharmacyList()
        )}
      </DialogContent>

      <DialogActions
        sx={{
          px: 3,
          py: 2,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: 1,
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <CheckCircle sx={{ color: "#2e7d32" }} />
          <Typography variant="body2" fontWeight={600} color="text.secondary">
            {pharmacyCount === 0
              ? "No pharmacies found"
              : isNearbySelected
              ? `${nearbyCount} pharmacies who carry this product are less than 10km away!`
              : `${pharmacyCount} pharmacies carry this product`}
          </Typography>
        </Box>
        {!isSinglePharmacy && (
          <Box sx={{ display: "flex", gap: 1 }}>
            <Button
              variant={isAllSelected ? "contained" : "outlined"}
              onClick={() => {
                setListMode("all");
                setShowPharmacies(true);
              }}
              disabled={pharmacyCount === 0}
              sx={{
                borderRadius: 999,
                px: 3,
                py: 1,
                textTransform: "none",
                fontWeight: 700,
                background: isAllSelected
                  ? "linear-gradient(135deg, #4ecdc4 0%, #44a9a3 100%)"
                  : "white",
                color: isAllSelected ? "white" : "primary.main",
                border: isAllSelected ? "none" : "1px solid #ccc",
              }}
            >
              {`Available in ${pharmacyCount} pharmacies`}
            </Button>
            <Button
              variant={isNearbySelected ? "contained" : "outlined"}
              onClick={() => {
                setListMode("nearby");
                setShowPharmacies(true);
              }}
              disabled={
                visiblePharmacies.filter(
                  (p) =>
                    p.distance !== null &&
                    p.distance !== undefined &&
                    p.distance <= 10
                ).length === 0
              }
              sx={{
                borderRadius: 999,
                px: 3,
                py: 1,
                background: isNearbySelected
                  ? "linear-gradient(135deg, #4ecdc4 0%, #44a9a3 100%)"
                  : "white",
                color: isNearbySelected ? "white" : "primary.main",
                border: isNearbySelected ? "none" : "1px solid #ccc",
                textTransform: "none",
                fontWeight: 700,
              }}
            >
              {`${visiblePharmacies.filter(
                (p) =>
                  p.distance !== null &&
                  p.distance !== undefined &&
                  p.distance <= 10
              ).length} nearby`}
            </Button>
          </Box>
        )}
        {isSinglePharmacy && singlePharmacyEntry && (
          <Box sx={{ display: "flex", gap: 1 }}>
            <Button
              variant="contained"
              onClick={() => openRequestDialog(singlePharmacyEntry)}
              sx={{
                borderRadius: 999,
                px: 3,
                py: 1,
                background: "linear-gradient(135deg, #4ecdc4 0%, #44a9a3 100%)",
                textTransform: "none",
                fontWeight: 700,
              }}
            >
              Request
            </Button>
          </Box>
        )}
      </DialogActions>

      <Dialog
        open={requestDialogOpen}
        onClose={() => setRequestDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Request Product</DialogTitle>
        <DialogContent>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}>
            <Typography variant="subtitle1" fontWeight={600}>
              Quantity
            </Typography>
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 0.5,
                bgcolor: "#f5f5f5",
                borderRadius: 2,
                px: 1,
                py: 0.25,
              }}
            >
              <IconButton
                size="small"
                onClick={() =>
                  setRequestQuantity((prev) => Math.max(1, prev - 1))
                }
              >
                <Remove fontSize="small" />
              </IconButton>
              <Typography variant="body2" fontWeight={700}>
                {requestQuantity}
              </Typography>
              <IconButton
                size="small"
                onClick={() => setRequestQuantity((prev) => prev + 1)}
              >
                <Add fontSize="small" />
              </IconButton>
            </Box>
          </Box>
          <TextField
            fullWidth
            multiline
            minRows={3}
            label="Message to pharmacy"
            value={requestMessage}
            onChange={(e) => setRequestMessage(e.target.value)}
            placeholder="Add details or instructions"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRequestDialogOpen(false)}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handleSendRequest}
            disabled={
              requestStatus[
                requestEntry
                  ? String(
                      requestEntry.pharmacy._id ||
                        requestEntry.pharmacy.id ||
                        requestEntry.pharmacy
                    )
                  : ""
              ] === "sending" ||
              requestStatus[
                requestEntry
                  ? String(
                      requestEntry.pharmacy._id ||
                        requestEntry.pharmacy.id ||
                        requestEntry.pharmacy
                    )
                  : ""
              ] === "sent"
            }
            sx={{
              background:
                requestStatus[
                  requestEntry
                    ? String(
                        requestEntry.pharmacy._id ||
                          requestEntry.pharmacy.id ||
                          requestEntry.pharmacy
                      )
                    : ""
                ] === "sent"
                  ? "#4caf50"
                  : "linear-gradient(135deg, #4ecdc4 0%, #44a9a3 100%)",
            }}
          >
            {requestStatus[
              requestEntry
                ? String(
                    requestEntry.pharmacy._id ||
                      requestEntry.pharmacy.id ||
                      requestEntry.pharmacy
                  )
                : ""
            ] === "sending"
              ? "Sending..."
              : requestStatus[
                  requestEntry
                    ? String(
                        requestEntry.pharmacy._id ||
                          requestEntry.pharmacy.id ||
                          requestEntry.pharmacy
                      )
                    : ""
                ] === "sent"
              ? "Sent"
              : "Send Request"}
          </Button>
        </DialogActions>
      </Dialog>
    </Dialog>
  );
};

export default ProductDetailsDialog;
