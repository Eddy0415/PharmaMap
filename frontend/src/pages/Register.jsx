import React, { useState } from "react";
import { useNavigate, Link as RouterLink } from "react-router-dom";
import {
  Box,
  Typography,
  TextField,
  Button,
  Checkbox,
  FormControlLabel,
  Link,
  Alert,
  InputAdornment,
  IconButton,
  ToggleButtonGroup,
  ToggleButton,
  Grid,
  Dialog,
} from "@mui/material";
import Person from "@mui/icons-material/Person";
import Email from "@mui/icons-material/Email";
import Phone from "@mui/icons-material/Phone";
import Lock from "@mui/icons-material/Lock";
import Visibility from "@mui/icons-material/Visibility";
import VisibilityOff from "@mui/icons-material/VisibilityOff";
import PersonAdd from "@mui/icons-material/PersonAdd";
import LocalPharmacy from "@mui/icons-material/LocalPharmacy";
import Business from "@mui/icons-material/Business";
import LocationOn from "@mui/icons-material/LocationOn";
import Badge from "@mui/icons-material/Badge";
import CloseIcon from "@mui/icons-material/Close";
import Home from "./Home";
import { useAuth } from "../hooks/authContext";

const Register = () => {
  const navigate = useNavigate();
  const { signup, loading: authLoading } = useAuth();
  const [accountType, setAccountType] = useState("customer");
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
    pharmacyName: "",
    pharmacyAddress: "",
    city: "",
    license: "",
    terms: false,
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value, checked, type } = e.target;
    setFormData({
      ...formData,
      [name]: type === "checkbox" ? checked : value,
    });
  };

  const handleAccountTypeChange = (event, newType) => {
    if (newType !== null) {
      setAccountType(newType);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    // Validation
    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (formData.password.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }

    if (!formData.terms) {
      setError("You must agree to the Terms of Service");
      return;
    }

    if (accountType === "pharmacy") {
      if (
        !formData.pharmacyName ||
        !formData.pharmacyAddress ||
        !formData.city ||
        !formData.license
      ) {
        setError("Please fill in all pharmacy information");
        return;
      }
    }

    setLoading(true);

    try {
      await signup({
        ...formData,
        userType: accountType === "pharmacy" ? "pharmacist" : "customer",
      });
      window.dispatchEvent(new Event("userUpdated"));
      navigate("/");
    } catch (error) {
      setError(error?.message || "Registration failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    navigate("/");
  };

  return (
    <>
      <Home />

      <Dialog
        open={true}
        onClose={handleClose}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: {
            maxWidth: "900px",
            margin: "auto",
            borderRadius: 2,
            maxHeight: "95vh",
            display: "flex",
            flexDirection: "column",
          },
        }}
        BackdropProps={{
          sx: {
            backgroundColor: "rgba(0, 0, 0, 0.7)",
          },
        }}
      >
        <Box
          sx={{
            display: "flex",
            flexDirection: { xs: "column", md: "row" },
            position: "relative",
          }}
        >
          {/* Close Button */}
          <IconButton
            onClick={handleClose}
            sx={{
              position: "absolute",
              top: 16,
              right: 16,
              zIndex: 10,
              bgcolor: "rgba(255, 255, 255, 0.9)",
              "&:hover": {
                bgcolor: "white",
              },
            }}
          >
            <CloseIcon />
          </IconButton>

          {/* Left Section - Register Form (2/3 width) */}
          <Box
            sx={{
              width: { xs: "100%", md: "66.666%" },
              flex: { xs: "none", md: "0 0 66.666%" },
              display: "flex",
              flexDirection: "column",
              bgcolor: "background.paper",
              p: { xs: 3, sm: 4 },
              minWidth: 0,
            }}
          >
            {/* Form Container */}
            <Box
              sx={{
                width: "100%",
                display: "flex",
                flexDirection: "column",
                minHeight: "min-content",
              }}
            >
              {/* Header */}
              <Box component="header" sx={{ mb: 3 }}>
                <Typography
                  component="h1"
                  variant="h4"
                  fontWeight={700}
                  color="secondary"
                  mb={1}
                >
                  Sign up
                </Typography>
              </Box>

              {/* Account Type Toggle */}
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "center",
                  mb: 3,
                  width: "100%",
                }}
              >
                <ToggleButtonGroup
                  value={accountType}
                  exclusive
                  onChange={handleAccountTypeChange}
                  sx={{ width: "100%" }}
                >
                  <ToggleButton
                    value="customer"
                    sx={{
                      flex: 1,
                      py: 1.5,
                      fontSize: "0.875rem",
                      "&.Mui-selected": {
                        background:
                          "linear-gradient(135deg, #4ecdc4 0%, #44a9a3 100%)",
                        color: "white",
                        "&:hover": {
                          background:
                            "linear-gradient(135deg, #44a9a3 0%, #3a8f8a 100%)",
                        },
                      },
                    }}
                  >
                    <Person sx={{ mr: 1, fontSize: "1rem" }} />
                    Customer
                  </ToggleButton>
                  <ToggleButton
                    value="pharmacy"
                    sx={{
                      flex: 1,
                      py: 1.5,
                      fontSize: "0.875rem",
                      "&.Mui-selected": {
                        background:
                          "linear-gradient(135deg, #4ecdc4 0%, #44a9a3 100%)",
                        color: "white",
                        "&:hover": {
                          background:
                            "linear-gradient(135deg, #44a9a3 0%, #3a8f8a 100%)",
                        },
                      },
                    }}
                  >
                    <LocalPharmacy sx={{ mr: 1, fontSize: "1rem" }} />
                    Pharmacy
                  </ToggleButton>
                </ToggleButtonGroup>
              </Box>

              {/* Error Alert */}
              {error && (
                <Alert severity="error" sx={{ mb: 2 }}>
                  {error}
                </Alert>
              )}

              {/* Registration Form */}
              <form onSubmit={handleSubmit} style={{ width: "100%" }}>
                {/* First Name and Last Name - Side by side */}
                <Box sx={{ display: "flex", gap: 2, mb: 1.5, width: "100%" }}>
                  <TextField
                    label="First Name"
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleChange}
                    required
                    sx={{ flex: 1, width: "100%" }}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <Person sx={{ color: "primary.main" }} />
                        </InputAdornment>
                      ),
                    }}
                  />
                  <TextField
                    label="Last Name"
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleChange}
                    required
                    sx={{ flex: 1, width: "100%" }}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <Person sx={{ color: "primary.main" }} />
                        </InputAdornment>
                      ),
                    }}
                  />
                </Box>

                {/* Email Address - Full width, on its own line */}
                <Box sx={{ width: "100%", mb: 1.5 }}>
                  <TextField
                    fullWidth
                    label="Email Address"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    sx={{ width: "100%" }}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <Email sx={{ color: "primary.main" }} />
                        </InputAdornment>
                      ),
                    }}
                  />
                </Box>

                {/* Phone Number - Full width, on its own line */}
                <Box sx={{ width: "100%", mb: 1.5 }}>
                  <TextField
                    fullWidth
                    label="Phone Number"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    required
                    placeholder="+961 XX XXX XXX"
                    sx={{ width: "100%" }}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <Phone sx={{ color: "primary.main" }} />
                        </InputAdornment>
                      ),
                    }}
                  />
                </Box>

                {/* Pharmacy Fields */}
                {accountType === "pharmacy" && (
                  <>
                    {/* Pharmacy Name and Address - Side by side */}
                    <Box
                      sx={{ display: "flex", gap: 2, mb: 1.5, width: "100%" }}
                    >
                      <TextField
                        label="Pharmacy Name"
                        name="pharmacyName"
                        value={formData.pharmacyName}
                        onChange={handleChange}
                        required={accountType === "pharmacy"}
                        sx={{ flex: 1, width: "100%" }}
                        InputProps={{
                          startAdornment: (
                            <InputAdornment position="start">
                              <Business sx={{ color: "primary.main" }} />
                            </InputAdornment>
                          ),
                        }}
                      />
                      <TextField
                        label="Pharmacy Address"
                        name="pharmacyAddress"
                        value={formData.pharmacyAddress}
                        onChange={handleChange}
                        required={accountType === "pharmacy"}
                        sx={{ flex: 1, width: "100%" }}
                        InputProps={{
                          startAdornment: (
                            <InputAdornment position="start">
                              <LocationOn sx={{ color: "primary.main" }} />
                            </InputAdornment>
                          ),
                        }}
                      />
                    </Box>

                    {/* City and License - Side by side */}
                    <Box
                      sx={{ display: "flex", gap: 2, mb: 1.5, width: "100%" }}
                    >
                      <TextField
                        label="City"
                        name="city"
                        value={formData.city}
                        onChange={handleChange}
                        required={accountType === "pharmacy"}
                        sx={{ flex: 1, width: "100%" }}
                        InputProps={{
                          startAdornment: (
                            <InputAdornment position="start">
                              <LocationOn sx={{ color: "primary.main" }} />
                            </InputAdornment>
                          ),
                        }}
                      />
                      <TextField
                        label="License Number"
                        name="license"
                        value={formData.license}
                        onChange={handleChange}
                        required={accountType === "pharmacy"}
                        sx={{ flex: 1, width: "100%" }}
                        InputProps={{
                          startAdornment: (
                            <InputAdornment position="start">
                              <Badge sx={{ color: "primary.main" }} />
                            </InputAdornment>
                          ),
                        }}
                      />
                    </Box>
                  </>
                )}

                {/* Password - Full width, on its own line */}
                <Box sx={{ width: "100%", mb: 1.5 }}>
                  <TextField
                    fullWidth
                    label="Password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    value={formData.password}
                    onChange={handleChange}
                    required
                    sx={{ width: "100%" }}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <Lock sx={{ color: "primary.main" }} />
                        </InputAdornment>
                      ),
                      endAdornment: (
                        <InputAdornment position="end">
                          <IconButton
                            onClick={() => setShowPassword(!showPassword)}
                            edge="end"
                          >
                            {showPassword ? <VisibilityOff /> : <Visibility />}
                          </IconButton>
                        </InputAdornment>
                      ),
                    }}
                  />
                </Box>

                {/* Confirm Password - Full width, on its own line */}
                <Box sx={{ width: "100%", mb: 1.5 }}>
                  <TextField
                    fullWidth
                    label="Confirm Password"
                    name="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    required
                    sx={{ width: "100%" }}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <Lock sx={{ color: "primary.main" }} />
                        </InputAdornment>
                      ),
                      endAdornment: (
                        <InputAdornment position="end">
                          <IconButton
                            onClick={() =>
                              setShowConfirmPassword(!showConfirmPassword)
                            }
                            edge="end"
                          >
                            {showConfirmPassword ? (
                              <VisibilityOff />
                            ) : (
                              <Visibility />
                            )}
                          </IconButton>
                        </InputAdornment>
                      ),
                    }}
                  />
                </Box>

                {/* Terms Checkbox */}
                <Box sx={{ width: "100%", mb: 1.5 }}>
                  <FormControlLabel
                    control={
                      <Checkbox
                        name="terms"
                        checked={formData.terms}
                        onChange={handleChange}
                        sx={{ color: "primary.main" }}
                      />
                    }
                    label={
                      <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{ fontSize: "0.75rem" }}
                      >
                        I agree to the{" "}
                        <Link
                          href="#"
                          sx={{ color: "primary.main", textDecoration: "none" }}
                        >
                          Terms
                        </Link>{" "}
                        and{" "}
                        <Link
                          href="#"
                          sx={{ color: "primary.main", textDecoration: "none" }}
                        >
                          Privacy Policy
                        </Link>
                      </Typography>
                    }
                  />
                </Box>

                <Button
                  fullWidth
                  type="submit"
                  variant="contained"
                  size="large"
                  disabled={loading}
                  loading={loading || authLoading}
                  startIcon={<PersonAdd />}
                  sx={{
                    py: 1.5,
                    mt: 1.5,
                    mb: 1.5,
                    background:
                      "linear-gradient(135deg, #4ecdc4 0%, #44a9a3 100%)",
                    fontSize: 16,
                    fontWeight: 700,
                    boxShadow: "0 4px 12px rgba(78, 205, 196, 0.3)",
                    "&:hover": {
                      transform: "translateY(-2px)",
                      boxShadow: "0 6px 20px rgba(78, 205, 196, 0.4)",
                    },
                  }}
                >
                  {loading ? "Creating Account..." : "Sign up"}
                </Button>
              </form>

              {/* Login Link */}
              <Typography
                variant="body2"
                textAlign="center"
                color="text.secondary"
                sx={{ fontSize: "0.875rem" }}
              >
                Already have an account?{" "}
                <Link
                  component={RouterLink}
                  to="/login"
                  sx={{
                    color: "primary.main",
                    fontWeight: 700,
                    textDecoration: "underline",
                  }}
                >
                  Log in
                </Link>
              </Typography>
            </Box>
          </Box>

          {/* Right Section - Image (1/3 width) */}
          <Box
            sx={{
              width: { xs: "100%", md: "33.333%" },
              flex: { xs: "none", md: "0 0 33.333%" },
              minHeight: { xs: "200px", md: "auto" },
              backgroundImage:
                "url(https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=1200&h=800&fit=crop)",
              backgroundSize: "cover",
              backgroundPosition: "center",
              backgroundRepeat: "no-repeat",
              display: { xs: "none", md: "block" },
            }}
          />
        </Box>
      </Dialog>
    </>
  );
};

export default Register;
