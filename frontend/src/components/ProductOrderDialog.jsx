import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  TextField,
  Box,
  Grid,
  Chip,
  Alert,
  IconButton,
  Divider,
} from "@mui/material";
import Close from "@mui/icons-material/Close";
import ShoppingCart from "@mui/icons-material/ShoppingCart";
import LocalPharmacy from "@mui/icons-material/LocalPharmacy";
import Add from "@mui/icons-material/Add";
import Remove from "@mui/icons-material/Remove";
import { orderAPI } from "../services/api";

const ProductOrderDialog = ({
  open,
  onClose,
  product,
  pharmacy,
  user,
  onOrderSuccess,
}) => {
  const navigate = useNavigate();
  const [quantity, setQuantity] = useState(1);
  const [customerNotes, setCustomerNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Reset form when dialog opens/closes
  React.useEffect(() => {
    if (open) {
      setQuantity(1);
      setCustomerNotes("");
      setError("");
    }
  }, [open]);

  if (!product || !pharmacy) return null;

  const maxQuantity = Number(product.quantity ?? 0);
  const price = product.price || 0;
  const total = price * quantity;
  const isOutOfStock =
    maxQuantity === 0 || product.stockStatus === "out-of-stock";

  const handleQuantityChange = (delta) => {
    const newQuantity = Math.max(1, Math.min(maxQuantity, quantity + delta));
    setQuantity(newQuantity);
  };

  const handleQuantityInput = (e) => {
    const value = parseInt(e.target.value) || 1;
    const newQuantity = Math.max(1, Math.min(maxQuantity, value));
    setQuantity(newQuantity);
  };

  const handleOrder = async () => {
    if (!user) {
      setError("Please login to place an order");
      setTimeout(() => {
        onClose();
        navigate("/login");
      }, 2000);
      return;
    }

    if (isOutOfStock) {
      setError("This product is currently out of stock");
      return;
    }

    if (quantity > maxQuantity) {
      setError(`Only ${maxQuantity} units available`);
      return;
    }

    setLoading(true);
    setError("");

    try {
      const orderData = {
        customer: user.id,
        pharmacy: pharmacy._id || pharmacy,
        items: [
          {
            item: product.item?._id || product.item,
            quantity: quantity,
          },
        ],
        customerNotes: customerNotes.trim() || undefined,
      };

      const response = await orderAPI.create(orderData);

      if (response.data.success) {
        alert(
          "Order placed successfully! You will receive a confirmation soon."
        );
        if (onOrderSuccess) {
          onOrderSuccess(response.data.order);
        }
        onClose();
      }
    } catch (error) {
      console.error("Error placing order:", error);
      const errorMsg =
        error.response?.data?.message ||
        "Failed to place order. Please try again.";
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
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

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 3,
        },
      }}
    >
      <DialogTitle>
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <Typography variant="h5" fontWeight={700} color="secondary">
            Reserve Product
          </Typography>
          <IconButton onClick={onClose} size="small">
            <Close />
          </IconButton>
        </Box>
      </DialogTitle>

      <DialogContent>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {/* Product Information */}
        <Box sx={{ mb: 3 }}>
          <Typography variant="h6" fontWeight={600} color="secondary" mb={1}>
            {product.item?.name || "Unknown Product"}
          </Typography>
          <Box sx={{ display: "flex", gap: 1, mb: 2, flexWrap: "wrap" }}>
            {product.item?.category && (
              <Chip label={product.item.category} size="small" />
            )}
            <Chip
              label={
                isOutOfStock
                  ? "Out of Stock"
                  : product.stockStatus === "low-stock"
                  ? "Low Stock"
                  : "In Stock"
              }
              size="small"
              sx={{
                ...getStockStatusColor(product.stockStatus),
                fontWeight: 600,
              }}
            />
            {product.item?.dosage && (
              <Chip
                label={product.item.dosage}
                size="small"
                variant="outlined"
              />
            )}
          </Box>
        </Box>

        <Divider sx={{ my: 2 }} />

        {/* Pharmacy Information */}
        <Box sx={{ mb: 3 }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
            <LocalPharmacy sx={{ color: "primary.main", fontSize: 20 }} />
            <Typography variant="subtitle2" fontWeight={600}>
              Pharmacy
            </Typography>
          </Box>
          <Typography variant="body1" color="text.secondary">
            {pharmacy.name || "Unknown Pharmacy"}
          </Typography>
          {pharmacy.address && (
            <Typography variant="body2" color="text.secondary">
              {pharmacy.address.street}, {pharmacy.address.city}
            </Typography>
          )}
        </Box>

        <Divider sx={{ my: 2 }} />

        {/* Quantity Selection */}
        <Box sx={{ mb: 3 }}>
          <Typography variant="subtitle2" fontWeight={600} mb={1}>
            Quantity
          </Typography>
          <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
            <IconButton
              onClick={() => handleQuantityChange(-1)}
              disabled={quantity <= 1 || isOutOfStock}
              sx={{
                border: "2px solid",
                borderColor: "primary.main",
                color: "primary.main",
              }}
            >
              <Remove />
            </IconButton>
            <TextField
              type="number"
              value={quantity}
              onChange={handleQuantityInput}
              disabled={isOutOfStock}
              inputProps={{
                min: 1,
                max: maxQuantity,
                style: { textAlign: "center", fontWeight: 600 },
              }}
              sx={{
                width: 100,
                "& .MuiOutlinedInput-root": {
                  "& fieldset": {
                    borderColor: "primary.main",
                  },
                },
              }}
            />
            <IconButton
              onClick={() => handleQuantityChange(1)}
              disabled={quantity >= maxQuantity || isOutOfStock}
              sx={{
                border: "2px solid",
                borderColor: "primary.main",
                color: "primary.main",
              }}
            >
              <Add />
            </IconButton>
            <Typography variant="body2" color="text.secondary" sx={{ ml: 2 }}>
              {maxQuantity} available
            </Typography>
          </Box>
        </Box>

        {/* Price Information */}
        <Box
          sx={{
            p: 2,
            bgcolor: "#f8f9fa",
            borderRadius: 2,
            mb: 3,
          }}
        >
          <Grid container spacing={1}>
            <Grid item xs={6}>
              <Typography variant="body2" color="text.secondary">
                Unit Price
              </Typography>
            </Grid>
            <Grid item xs={6} sx={{ textAlign: "right" }}>
              <Typography variant="body2" fontWeight={600}>
                ${price.toFixed(2)}
              </Typography>
            </Grid>
            <Grid item xs={6}>
              <Typography variant="body2" color="text.secondary">
                Quantity
              </Typography>
            </Grid>
            <Grid item xs={6} sx={{ textAlign: "right" }}>
              <Typography variant="body2" fontWeight={600}>
                {quantity}
              </Typography>
            </Grid>
            <Grid item xs={12}>
              <Divider sx={{ my: 1 }} />
            </Grid>
            <Grid item xs={6}>
              <Typography variant="h6" fontWeight={700} color="secondary">
                Total
              </Typography>
            </Grid>
            <Grid item xs={6} sx={{ textAlign: "right" }}>
              <Typography variant="h6" fontWeight={700} color="primary.main">
                ${total.toFixed(2)}
              </Typography>
            </Grid>
          </Grid>
        </Box>

        {/* Customer Notes */}
        <TextField
          fullWidth
          multiline
          rows={3}
          label="Special Instructions (Optional)"
          placeholder="Add any special instructions for your order..."
          value={customerNotes}
          onChange={(e) => setCustomerNotes(e.target.value)}
          sx={{ mb: 2 }}
        />

        {!user && (
          <Alert severity="info" sx={{ mt: 2 }}>
            Please login to place an order. You will be redirected to the login
            page.
          </Alert>
        )}
      </DialogContent>

      <DialogActions sx={{ p: 3, pt: 0 }}>
        <Button onClick={onClose} variant="outlined">
          Cancel
        </Button>
        <Button
          onClick={handleOrder}
          variant="contained"
          disabled={loading || isOutOfStock || quantity > maxQuantity}
          startIcon={<ShoppingCart />}
          sx={{
            background: "linear-gradient(135deg, #4ecdc4 0%, #44a9a3 100%)",
            px: 3,
          }}
        >
          {loading ? "Placing Order..." : "Reserve Now"}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ProductOrderDialog;
