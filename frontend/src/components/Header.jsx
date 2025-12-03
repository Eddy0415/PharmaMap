import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  AppBar,
  Toolbar,
  Box,
  TextField,
  Button,
  IconButton,
  Menu,
  MenuItem,
  Avatar,
  InputAdornment,
  Container,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import Person from "@mui/icons-material/Person";
import DashboardIcon from "@mui/icons-material/Dashboard";
import AdminPanelSettings from "@mui/icons-material/AdminPanelSettings";
import Logout from "@mui/icons-material/Logout";

const Header = ({
  user,
  onLogout,
  onScrollToCategories,
  onScrollToProducts,
}) => {
  const navigate = useNavigate();
  const [anchorEl, setAnchorEl] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const normalize = (u) => {
    if (!u) return null;
    const id = u.id || u._id || u.userId;
    return { ...u, id };
  };

  const [displayUser, setDisplayUser] = useState(() => {
    if (user) return normalize(user);
    const stored = localStorage.getItem("user");
    return stored ? normalize(JSON.parse(stored)) : null;
  });

  const handleMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  useEffect(() => {
    if (user) {
      setDisplayUser(normalize(user));
      return;
    }
    const stored = localStorage.getItem("user");
    setDisplayUser(stored ? normalize(JSON.parse(stored)) : null);
  }, [user]);

  useEffect(() => {
    const syncUser = () => {
      const stored = localStorage.getItem("user");
      setDisplayUser(stored ? normalize(JSON.parse(stored)) : null);
    };
    window.addEventListener("userUpdated", syncUser);
    window.addEventListener("storage", syncUser);
    return () => {
      window.removeEventListener("userUpdated", syncUser);
      window.removeEventListener("storage", syncUser);
    };
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery)}`);
    }
  };

  const handleLogout = () => {
    handleMenuClose();
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setDisplayUser(null);
    if (onLogout) onLogout();
    navigate("/");
  };

  const handleCategoriesClick = () => {
    if (onScrollToCategories) {
      onScrollToCategories();
      return;
    }
    navigate("/#categories");
  };

  const handleProductsClick = () => {
    if (onScrollToProducts) {
      onScrollToProducts();
      return;
    }
    navigate("/#products");
  };

  return (
    <AppBar
      component="header"
      position="sticky"
      sx={{
        background: "linear-gradient(135deg, #2f4f4f 0%, #1a3333 100%)",
        boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
      }}
    >
      <Container maxWidth="xl" sx={{ px: { xs: 1, sm: 2, md: 3 } }}>
        <Toolbar
          component="nav"
          sx={{
            py: { xs: 0.5, sm: 1 },
            display: "flex",
            justifyContent: "space-between",
            position: "relative",
            minHeight: { xs: 56, sm: 64 },
          }}
        >
          {/* Logo */}
          <Box
            component="a"
            href="/"
            onClick={(e) => {
              e.preventDefault();
              navigate("/");
            }}
            aria-label="PharmaMap Home"
            sx={{
              display: "flex",
              alignItems: "center",
              gap: { xs: 1, sm: 1.5 },
              cursor: "pointer",
              mr: { xs: 1, sm: 2, md: 4 },
              textDecoration: "none",
              zIndex: 1,
              flexShrink: 0,
            }}
          >
            <Box
              sx={{
                width: { xs: 40, sm: 50 },
                height: { xs: 40, sm: 50 },
                borderRadius: { xs: "8px", sm: "12px" },
                bgcolor: "white",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                boxShadow: "0 4px 8px rgba(0,0,0,0.2)",
              }}
            >
              <Box
                component="img"
                src="/logo.png"
                alt="PharmaMap"
                sx={{ width: { xs: 32, sm: 40 }, height: { xs: 32, sm: 40 } }}
                onError={(e) => {
                  e.target.style.display = "none";
                  e.target.parentElement.innerHTML =
                    '<span style="font-size: 24px; font-weight: bold; color: #4ecdc4;">PM</span>';
                }}
              />
            </Box>
            <Box
              sx={{
                fontSize: { xs: 18, sm: 20, md: 22 },
                fontWeight: 700,
                color: "white",
                letterSpacing: { xs: 0.3, sm: 0.5 },
                display: { xs: "none", sm: "block" },
                whiteSpace: "nowrap",
              }}
            >
              PharmaMap
            </Box>
          </Box>

          {/* Search Bar - Centered */}
          <Box
            component="form"
            onSubmit={handleSearch}
            role="search"
            aria-label="Search medications and pharmacies"
            sx={{
              position: "absolute",
              left: "50%",
              transform: "translateX(-50%)",
              width: {
                xs: "calc(100% - 160px)",
                sm: "250px",
                md: "290px",
                lg: "350px",
                xl: "410px",
              },
              maxWidth: { xs: "calc(100vw - 180px)", sm: "90%" },
              display: { xs: "none", sm: "block" },
              zIndex: 1,
              px: { xs: 0.5, sm: 0 },
              transition:
                "width 0.3s ease-in-out, max-width 0.3s ease-in-out, padding 0.3s ease-in-out",
            }}
          >
            <TextField
              fullWidth
              size="small"
              placeholder="Search for medications, pharmacies..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              inputProps={{
                "aria-label": "Search",
                sx: {
                  fontSize: { xs: "0.875rem", sm: "1rem" },
                  py: { xs: 0.75, sm: 1 },
                },
              }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon
                      sx={{
                        color: "#4ecdc4",
                        fontSize: { xs: "1.1rem", sm: "1.25rem" },
                      }}
                    />
                  </InputAdornment>
                ),
                sx: {
                  bgcolor: "white",
                  borderRadius: { xs: "20px", sm: "25px" },
                  "& fieldset": { border: "none" },
                  "&:hover": {
                    boxShadow: "0 4px 16px rgba(78, 205, 196, 0.3)",
                  },
                },
              }}
            />
          </Box>

          {/* User Menu / Sign In Button - Top Right */}
          <Box
            sx={{
              ml: "auto",
              display: "flex",
              alignItems: "center",
              gap: { xs: 0.75, sm: 1.25, md: 1.5 },
              zIndex: 1,
              flexShrink: 0,
            }}
          >
            {/* Mobile Search Icon */}
            <IconButton
              onClick={() => navigate("/search")}
              sx={{
                display: { xs: "flex", sm: "none" },
                color: "white",
                padding: { xs: 0.75, sm: 1 },
                "&:hover": { bgcolor: "rgba(255,255,255,0.1)" },
              }}
              aria-label="Search"
            >
              <SearchIcon sx={{ fontSize: { xs: "1.25rem", sm: "1.5rem" } }} />
            </IconButton>
            <Button
              variant="text"
              onClick={handleCategoriesClick}
              sx={{
                color: "white",
                px: { xs: 1, sm: 1.5 },
                py: { xs: 0.5, sm: 0.75 },
                fontSize: { xs: "0.85rem", sm: "0.95rem" },
                textTransform: "none",
                borderRadius: { xs: "18px", sm: "22px" },
                "&:hover": { bgcolor: "rgba(255,255,255,0.1)" },
              }}
            >
              Categories
            </Button>
            <Button
              variant="text"
              onClick={handleProductsClick}
              sx={{
                color: "white",
                px: { xs: 1, sm: 1.5 },
                py: { xs: 0.5, sm: 0.75 },
                fontSize: { xs: "0.85rem", sm: "0.95rem" },
                textTransform: "none",
                borderRadius: { xs: "18px", sm: "22px" },
                "&:hover": { bgcolor: "rgba(255,255,255,0.1)" },
              }}
            >
              Popular
            </Button>
            <Button
              variant="text"
              onClick={() => navigate("/about")}
              sx={{
                color: "white",
                px: { xs: 1, sm: 1.5 },
                py: { xs: 0.5, sm: 0.75 },
                fontSize: { xs: "0.85rem", sm: "0.95rem" },
                textTransform: "none",
                borderRadius: { xs: "18px", sm: "22px" },
                "&:hover": { bgcolor: "rgba(255,255,255,0.1)" },
              }}
            >
              About Us
            </Button>
            {displayUser ? (
              <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
                <IconButton
                  onClick={handleMenuOpen}
                  sx={{
                    color: "white",
                    padding: { xs: 0.5, sm: 1 },
                    "&:hover": { bgcolor: "rgba(255,255,255,0.1)" },
                  }}
                >
                  <Avatar
                    src={displayUser.avatarUrl || undefined}
                    sx={{
                      bgcolor: "#4ecdc4",
                      width: { xs: 32, sm: 40 },
                      height: { xs: 32, sm: 40 },
                      fontSize: { xs: "0.875rem", sm: "1rem" },
                    }}
                  >
                    {displayUser.firstName?.[0]}
                    {displayUser.lastName?.[0]}
                  </Avatar>
                </IconButton>
                <Menu
                  anchorEl={anchorEl}
                  open={Boolean(anchorEl)}
                  onClose={handleMenuClose}
                  PaperProps={{
                    sx: {
                      mt: 1.5,
                      borderRadius: { xs: 2, sm: 3 },
                      minWidth: { xs: 160, sm: 180 },
                      maxWidth: { xs: "90vw", sm: "none" },
                    },
                  }}
                >
                  <MenuItem
                    onClick={() => {
                      handleMenuClose();
                      navigate("/profile");
                    }}
                  >
                    <Person sx={{ mr: 1 }} /> My Profile
                  </MenuItem>
                  {displayUser.userType === "pharmacist" && (
                    <MenuItem
                      onClick={() => {
                        handleMenuClose();
                        navigate("/dashboard");
                      }}
                    >
                      <DashboardIcon sx={{ mr: 1 }} /> Dashboard
                    </MenuItem>
                  )}
                  {displayUser.userType === "admin" && (
                    <MenuItem
                      onClick={() => {
                        handleMenuClose();
                        navigate("/admin");
                      }}
                    >
                      <AdminPanelSettings sx={{ mr: 1 }} /> Admin
                    </MenuItem>
                  )}
                  <MenuItem onClick={handleLogout}>
                    <Logout sx={{ mr: 1 }} /> Logout
                  </MenuItem>
                </Menu>
              </Box>
            ) : (
              <Button
                variant="outlined"
                startIcon={
                  <Person sx={{ fontSize: { xs: "1.1rem", sm: "1.25rem" } }} />
                }
                onClick={() => navigate("/login")}
                sx={{
                  color: "white",
                  borderColor: "rgba(255,255,255,0.3)",
                  borderRadius: { xs: "20px", sm: "25px" },
                  fontSize: { xs: "0.8rem", sm: "0.9rem", md: "0.95rem" },
                  "&:hover": {
                    borderColor: "rgba(255,255,255,0.5)",
                    bgcolor: "rgba(255,255,255,0.1)",
                  },
                  minWidth: { xs: "auto", sm: 96, md: 104 },
                  px: { xs: 0.75, sm: 1.25, md: 1.5 },
                  py: { xs: 0.5, sm: 0.7 },
                }}
              >
                <Box
                  component="span"
                  sx={{
                    display: { xs: "none", sm: "inline" },
                  }}
                >
                  Sign In
                </Box>
              </Button>
            )}
          </Box>
        </Toolbar>
      </Container>
    </AppBar>
  );
};

export default Header;