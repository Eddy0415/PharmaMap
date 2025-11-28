import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Box, Container, Typography, Grid, Card, CardContent, Divider, Button } from "@mui/material";
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

      <Footer />
    </Box>
  );
};

export default About;
