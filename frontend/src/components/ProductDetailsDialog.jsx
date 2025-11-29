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
} from "@mui/material";
import Close from "@mui/icons-material/Close";
import ArrowBack from "@mui/icons-material/ArrowBack";
import LocalPharmacy from "@mui/icons-material/LocalPharmacy";
import CheckCircle from "@mui/icons-material/CheckCircle";

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

const ProductDetailsDialog = ({
  open,
  onClose,
  product,
  pharmacies = [],
  onSelectPharmacy,
  onRequestPharmacy, // optional
}) => {
  const [showPharmacies, setShowPharmacies] = useState(false);
  const [requestMode, setRequestMode] = useState(false);

  useEffect(() => {
    if (open) {
      setShowPharmacies(false);
      setRequestMode(false);
    }
  }, [open]);

  const pharmacyCount = pharmacies.length;
  const showRequest = Boolean(onRequestPharmacy);

  const composition = useMemo(() => {
    if (!product?.item) return null;
    return (
      product.item.composition ||
      product.item.activeIngredient ||
      product.item.ingredients
    );
  }, [product]);

  if (!product) return null;

  const handleSelectEntry = async (entry) => {
    if (requestMode && onRequestPharmacy) {
      await onRequestPharmacy(entry);
      setRequestMode(false);
      setShowPharmacies(false);
      return;
    }
    onSelectPharmacy(entry.pharmacy);
  };

  const renderPharmacyList = () => (
    <Box sx={{ mt: 2 }}>
      {pharmacies.map((entry) => (
        <Box
          key={entry.pharmacy._id || entry.pharmacy.id || entry.pharmacy.name}
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
                ? `${entry.pharmacy.address.street}, ${entry.pharmacy.address.city || ""}`
                : entry.pharmacy.address?.city || "Lebanon"}
            </Typography>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1, mt: 0.5 }}>
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
            </Box>
          </Box>
          <Button
            variant="contained"
            size="small"
            onClick={() => handleSelectEntry(entry)}
            sx={{
              background: "linear-gradient(135deg, #4ecdc4 0%, #44a9a3 100%)",
              whiteSpace: "nowrap",
            }}
          >
            {requestMode ? "Send request" : "View Pharmacy"}
          </Button>
        </Box>
      ))}
      {pharmacyCount === 0 && (
        <Typography color="text.secondary" textAlign="center" sx={{ py: 3 }}>
          No pharmacies found for this product.
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
            {showPharmacies && (
              <IconButton
                size="small"
                onClick={() => {
                  setShowPharmacies(false);
                  setRequestMode(false);
                }}
              >
                <ArrowBack fontSize="small" />
              </IconButton>
            )}
            <Typography variant="h5" fontWeight={800} color="secondary">
              {showPharmacies ? "Available Pharmacies" : product.item?.name || "Product"}
            </Typography>
          </Box>
          <IconButton onClick={onClose} size="small">
            <Close />
          </IconButton>
        </Box>
      </DialogTitle>

      <DialogContent dividers sx={{ pt: 2, pb: 3 }}>
        {!showPharmacies ? (
          <>
            <Box sx={{ display: "flex", gap: 2, mb: 2, alignItems: "center" }}>
              <Box
                sx={{
                  width: 96,
                  height: 96,
                  borderRadius: 2,
                  bgcolor: "#e0f7fa",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}
              >
                <LocalPharmacy sx={{ fontSize: 48, color: "primary.main" }} />
              </Box>
              <Box sx={{ flex: 1 }}>
                <Typography variant="h6" fontWeight={700} color="secondary">
                  {product.item?.name}
                </Typography>
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
            {pharmacyCount > 0
              ? `${pharmacyCount} pharmacies carry this product`
              : "No pharmacies found nearby"}
          </Typography>
        </Box>
        <Box sx={{ display: "flex", gap: 1 }}>
          <Button
            variant="contained"
            onClick={() => {
              setShowPharmacies((prev) => !prev);
              setRequestMode(false);
            }}
            disabled={pharmacyCount === 0}
            sx={{
              borderRadius: 999,
              px: 3,
              py: 1,
              background: "linear-gradient(135deg, #4ecdc4 0%, #44a9a3 100%)",
              textTransform: "none",
              fontWeight: 700,
            }}
          >
            {showPharmacies
              ? "Back to details"
              : pharmacyCount > 0
              ? `Available in ${pharmacyCount} pharmacies nearby`
              : "Not available nearby"}
          </Button>
          {showRequest && (
            <Button
              variant="outlined"
              onClick={() => {
                setRequestMode(true);
                setShowPharmacies(true);
              }}
              disabled={pharmacyCount === 0}
              sx={{ textTransform: "none", fontWeight: 700 }}
            >
              Request
            </Button>
          )}
        </Box>
      </DialogActions>
    </Dialog>
  );
};

export default ProductDetailsDialog;
