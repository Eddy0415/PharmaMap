import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { 
  Box, 
  Container, 
  Typography, 
  Grid, 
  Card, 
  CardContent, 
  Divider, 
  Button,
  TextField,
  Paper
} from "@mui/material";
import LocalPharmacy from "@mui/icons-material/LocalPharmacy";
import Email from "@mui/icons-material/Email";
import Phone from "@mui/icons-material/Phone";
import Business from "@mui/icons-material/Business";
import Header from "../components/Header";
import Footer from "../components/Footer";

const About = () => {
  const [user, setUser] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
  }, []);

  return (
    <Box component="main" sx={{ bgcolor: "background.default", minHeight: "100vh" }}>
      <Header user={user} />

      <Box
        sx={{
          position: "relative",
          overflow: "hidden",
          py: { xs: 8, sm: 10 },
          background: "linear-gradient(135deg, #f0f7f7 0%, #e6f4f3 100%)",
        }}
      >
        <Container maxWidth="lg">
          <Box sx={{ maxWidth: 760, mb: 6 }}>
            <Typography variant="h3" fontWeight={800} color="secondary" gutterBottom>
              About PharmaMap
            </Typography>
            <Typography variant="h6" color="text.secondary">
              We connect people to trusted pharmacies, making it simple to find and reserve the medicine you need—fast.
            </Typography>
          </Box>

          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Card sx={{ height: "100%" }} elevation={0}>
                <CardContent sx={{ p: { xs: 3, sm: 4 } }}>
                  <Typography variant="overline" color="primary.main" fontWeight={700}>
                    Our Mission
                  </Typography>
                  <Typography variant="h5" fontWeight={700} color="secondary" gutterBottom>
                    Reliable access to care
                  </Typography>
                  <Typography color="text.secondary">
                    PharmaMap was built to reduce the friction of medication discovery. We verify pharmacies, surface live
                    availability, and let you reserve items before you arrive, so you spend less time searching and more
                    time getting better.
                  </Typography>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} md={6}>
              <Card sx={{ height: "100%" }} elevation={0}>
                <CardContent sx={{ p: { xs: 3, sm: 4 } }}>
                  <Typography variant="overline" color="primary.main" fontWeight={700}>
                    What we offer
                  </Typography>
                  <Typography variant="h5" fontWeight={700} color="secondary" gutterBottom>
                    A clearer path to your medication
                  </Typography>
                  <Typography color="text.secondary" paragraph>
                    - Quick search across participating pharmacies
                  </Typography>
                  <Typography color="text.secondary" paragraph>
                    - Reservation to pick up in person
                  </Typography>
                  <Typography color="text.secondary" paragraph>
                    - Guidance to nearby options when stock is limited
                  </Typography>
                  <Typography color="text.secondary">
                    Our goal is transparency: clear availability, clear pricing when provided, and a straightforward way
                    to get what you need.
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          <Divider sx={{ my: 6 }} />

          <Grid container spacing={3}>
            <Grid item xs={12} md={4}>
              <Typography variant="h4" fontWeight={800} color="secondary">
                24/7 Search
              </Typography>
              <Typography color="text.secondary">
                Find pharmacies and products any time, with real-time updates where provided.
              </Typography>
            </Grid>
            <Grid item xs={12} md={4}>
              <Typography variant="h4" fontWeight={800} color="secondary">
                Verified Partners
              </Typography>
              <Typography color="text.secondary">
                We collaborate with vetted pharmacies to keep quality at the center of every request.
              </Typography>
            </Grid>
            <Grid item xs={12} md={4}>
              <Typography variant="h4" fontWeight={800} color="secondary">
                Human Support
              </Typography>
              <Typography color="text.secondary">
                Need help? Our team is here to guide you to the nearest available option.
              </Typography>
            </Grid>
          </Grid>

          <Box
            sx={{
              mt: 6,
              display: "flex",
              flexWrap: "wrap",
              alignItems: "center",
              gap: 2,
              bgcolor: "white",
              borderRadius: 3,
              p: { xs: 3, sm: 4 },
              boxShadow: "0 12px 32px rgba(0,0,0,0.06)",
            }}
          >
            <Box sx={{ flex: "1 1 320px" }}>
              <Typography variant="h5" fontWeight={800} color="secondary" gutterBottom>
                Ready to search?
              </Typography>
              <Typography color="text.secondary">
                Start with a quick lookup and reserve your medication at a nearby pharmacy.
              </Typography>
            </Box>
            <Button
              variant="contained"
              color="primary"
              onClick={() => navigate("/search")}
              sx={{ px: 3, py: 1.25, borderRadius: 2, fontWeight: 700 }}
            >
              Go to search
            </Button>
          </Box>
        </Container>
      </Box>

      {/* Pharmacy Contact Section */}
      <Box
        sx={{
          py: { xs: 6, sm: 8 },
          bgcolor: "background.default",
        }}
      >
        <Container maxWidth="lg">
          <Box sx={{ textAlign: "center", mb: 6 }}>
            <Box
              sx={{
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                width: 80,
                height: 80,
                borderRadius: "50%",
                bgcolor: "primary.main",
                mb: 3,
              }}
            >
              <LocalPharmacy sx={{ fontSize: 40, color: "white" }} />
            </Box>
            <Typography variant="h3" fontWeight={800} color="secondary" gutterBottom>
              For Pharmacies
            </Typography>
            <Typography variant="h6" color="text.secondary" sx={{ maxWidth: 600, mx: "auto" }}>
              Join our network and reach more customers. Get listed, manage your inventory, and grow your business.
            </Typography>
          </Box>

          <Grid container spacing={4} sx={{ mb: 6 }}>
            <Grid item xs={12} md={4}>
              <Card
                sx={{
                  height: "100%",
                  textAlign: "center",
                  p: 3,
                  borderRadius: 3,
                  border: "2px solid",
                  borderColor: "divider",
                  transition: "all 0.3s",
                  "&:hover": {
                    borderColor: "primary.main",
                    boxShadow: "0 8px 24px rgba(0,0,0,0.1)",
                    transform: "translateY(-4px)",
                  },
                }}
              >
                <Business sx={{ fontSize: 48, color: "primary.main", mb: 2 }} />
                <Typography variant="h6" fontWeight={700} color="secondary" gutterBottom>
                  Get Listed
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Register your pharmacy and start reaching customers in your area. Simple onboarding process.
                </Typography>
              </Card>
            </Grid>
            <Grid item xs={12} md={4}>
              <Card
                sx={{
                  height: "100%",
                  textAlign: "center",
                  p: 3,
                  borderRadius: 3,
                  border: "2px solid",
                  borderColor: "divider",
                  transition: "all 0.3s",
                  "&:hover": {
                    borderColor: "primary.main",
                    boxShadow: "0 8px 24px rgba(0,0,0,0.1)",
                    transform: "translateY(-4px)",
                  },
                }}
              >
                <LocalPharmacy sx={{ fontSize: 48, color: "primary.main", mb: 2 }} />
                <Typography variant="h6" fontWeight={700} color="secondary" gutterBottom>
                  Manage Inventory
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Update your stock in real-time, set prices, and manage availability from your dashboard.
                </Typography>
              </Card>
            </Grid>
            <Grid item xs={12} md={4}>
              <Card
                sx={{
                  height: "100%",
                  textAlign: "center",
                  p: 3,
                  borderRadius: 3,
                  border: "2px solid",
                  borderColor: "divider",
                  transition: "all 0.3s",
                  "&:hover": {
                    borderColor: "primary.main",
                    boxShadow: "0 8px 24px rgba(0,0,0,0.1)",
                    transform: "translateY(-4px)",
                  },
                }}
              >
                <Typography
                  variant="h4"
                  fontWeight={800}
                  color="primary.main"
                  mb={2}
                  sx={{ fontSize: 48 }}
                >
                  +
                </Typography>
                <Typography variant="h6" fontWeight={700} color="secondary" gutterBottom>
                  Grow Your Business
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Increase visibility, receive reservations, and connect with customers looking for your products.
                </Typography>
              </Card>
            </Grid>
          </Grid>

          <Paper
            elevation={0}
            sx={{
              bgcolor: "primary.main",
              borderRadius: 4,
              p: { xs: 4, sm: 6 },
              color: "white",
            }}
          >
            <Grid container spacing={4} alignItems="center">
              <Grid item xs={12} md={7}>
                <Typography variant="h4" fontWeight={800} gutterBottom>
                  Interested in joining?
                </Typography>
                <Typography variant="body1" sx={{ opacity: 0.9, mb: 3 }}>
                  Contact us to learn more about how PharmaMap can help your pharmacy reach more customers and manage orders efficiently.
                </Typography>
                <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                    <Email sx={{ fontSize: 24 }} />
                    <Typography variant="body1" fontWeight={600}>
                      info@pharmamap.com
                    </Typography>
                  </Box>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                    <Phone sx={{ fontSize: 24 }} />
                    <Typography variant="body1" fontWeight={600}>
                      +961 1 234 567
                    </Typography>
                  </Box>
                </Box>
              </Grid>
              <Grid item xs={12} md={5}>
                <Box
                  sx={{
                    bgcolor: "white",
                    borderRadius: 3,
                    p: 3,
                    color: "text.primary",
                  }}
                >
                  <Typography variant="h6" fontWeight={700} color="secondary" gutterBottom>
                    Quick Contact
                  </Typography>
                  <Box sx={{ display: "flex", flexDirection: "column", gap: 2, mt: 2 }}>
                    <TextField
                      fullWidth
                      label="Pharmacy Name"
                      variant="outlined"
                      size="small"
                    />
                    <TextField
                      fullWidth
                      label="Your Email"
                      variant="outlined"
                      size="small"
                      type="email"
                    />
                    <TextField
                      fullWidth
                      label="Phone Number"
                      variant="outlined"
                      size="small"
                    />
                    <Button
                      variant="contained"
                      color="primary"
                      fullWidth
                      sx={{ mt: 1, py: 1.25, fontWeight: 700 }}
                    >
                      Send Inquiry
                    </Button>
                  </Box>
                </Box>
              </Grid>
            </Grid>
          </Paper>
        </Container>
      </Box>

      <Footer />
    </Box>
  );
};

export default About;
