import React, { useState } from "react";
import { useNavigate, Link as RouterLink } from "react-router-dom";
import {
  Box,
  Typography,
  TextField,
  Button,
  Link,
  Alert,
  InputAdornment,
  IconButton,
  Dialog,
} from "@mui/material";
import Email from "@mui/icons-material/Email";
import Lock from "@mui/icons-material/Lock";
import Visibility from "@mui/icons-material/Visibility";
import VisibilityOff from "@mui/icons-material/VisibilityOff";
import CloseIcon from "@mui/icons-material/Close";
import Home from "./Home";
import { authAPI } from "../services/api";

const Login = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value, checked, type } = e.target;
    setFormData({
      ...formData,
      [name]: type === "checkbox" ? checked : value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await authAPI.login({
        email: formData.email,
        password: formData.password,
      });

      if (response.data.success) {
        // Store token and user data
        localStorage.setItem("token", response.data.token);
        localStorage.setItem("user", JSON.stringify(response.data.user));

        // Redirect based on account type
        if (response.data.user.userType === "pharmacist") {
          navigate("/dashboard");
        } else {
          navigate("/");
        }
      }
    } catch (error) {
      setError(
        error.response?.data?.message || "Login failed. Please try again."
      );
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
        maxWidth={false}
        PaperProps={{
          sx: {
            width: "75vw",
            maxWidth: "1000px",
            height: "75vh",
            maxHeight: "600px",
            margin: "auto",
            borderRadius: 2,
            overflow: "hidden",
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
            height: "100%",
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

          {/* Left Section - Login Form (1/3 width) */}
          <Box
            sx={{
              width: { xs: "100%", md: "33.333%" },
              flex: { xs: "none", md: "0 0 33.333%" },
              height: "100%",
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
              bgcolor: "background.paper",
              overflow: "auto",
              px: 4,
              py: 4,
            }}
          >
            {/* Form Container */}
            <Box
              sx={{
                display: "flex",
                flexDirection: "column",
                width: "100%",
                maxWidth: 400,
                mx: "auto",
              }}
            >
              {/* Title */}
              <Typography
                component="h1"
                variant="h4"
                fontWeight={700}
                color="secondary"
                mb={4}
              >
                Log in
              </Typography>

              {/* Error Alert */}
              {error && (
                <Alert severity="error" sx={{ mb: 3 }}>
                  {error}
                </Alert>
              )}

              {/* Login Form */}
              <form onSubmit={handleSubmit}>
                <TextField
                  fullWidth
                  label="username/email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  sx={{ mb: 3 }}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Email sx={{ color: "primary.main" }} />
                      </InputAdornment>
                    ),
                  }}
                />

                <TextField
                  fullWidth
                  label="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  value={formData.password}
                  onChange={handleChange}
                  required
                  sx={{ mb: 3 }}
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

                <Button
                  fullWidth
                  type="submit"
                  variant="contained"
                  size="large"
                  disabled={loading}
                  sx={{
                    py: 1.5,
                    mb: 4,
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
                  {loading ? "Logging in..." : "Login"}
                </Button>
              </form>

              {/* Sign Up Link */}
              <Typography
                variant="body2"
                color="text.secondary"
                textAlign="center"
              >
                Don't have an account?{" "}
                <Link
                  component={RouterLink}
                  to="/register"
                  sx={{
                    color: "primary.main",
                    fontWeight: 700,
                    textDecoration: "underline",
                  }}
                >
                  Sign up
                </Link>
              </Typography>
            </Box>
          </Box>

          {/* Right Section - Image (2/3 width) */}
          <Box
            sx={{
              width: { xs: 0, md: "66.666%" },
              flex: { xs: "none", md: "0 0 66.666%" },
              height: "100%",
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

export default Login;
