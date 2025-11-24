import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  IconButton,
  Chip,
} from '@mui/material';
import {
  ArrowBackIos,
  ArrowForwardIos,
  Spa,
  Favorite,
  LocalPharmacy,
  PanTool,
  Bloodtype,
  Masks,
  AcUnit,
  HealthAndSafety,
  Elderly,
  ShieldMoon,
} from '@mui/icons-material';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { pharmacyAPI, medicationAPI } from '../services/api';

const carouselSlides = [
  {
    image: 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=1200&h=450&fit=crop',
    title: 'Find Your Medication Instantly',
    description: 'Check availability across multiple pharmacies in Lebanon'
  },
  {
    image: 'https://images.unsplash.com/photo-1587854692152-cbe660dbde88?w=1200&h=450&fit=crop',
    title: 'Trusted Pharmacy Network',
    description: 'Connected with hundreds of verified pharmacies'
  },
  {
    image: 'https://images.unsplash.com/photo-1631549916768-4119b2e5f926?w=1200&h=450&fit=crop',
    title: 'Save Time & Money',
    description: 'Compare prices and find the nearest available pharmacy'
  }
];

const categories = [
  { name: 'Derma Products', icon: Spa },
  { name: 'Cardiac Care', icon: Favorite },
  { name: 'Stomach Care', icon: LocalPharmacy },
  { name: 'Pain Relief', icon: PanTool },
  { name: 'Liver Care', icon: Bloodtype },
  { name: 'Oral Care', icon: Masks },
  { name: 'Respiratory', icon: AcUnit },
  { name: 'Sexual Health', icon: HealthAndSafety },
  { name: 'Elderly Care', icon: Elderly },
  { name: 'Cold & Immunity', icon: ShieldMoon },
];

const Home = () => {
  const navigate = useNavigate();
  const [currentSlide, setCurrentSlide] = useState(0);
  const [user, setUser] = useState(null);
  const [popularProducts, setPopularProducts] = useState([]);
  const [featuredPharmacies, setFeaturedPharmacies] = useState([]);

  useEffect(() => {
    // Load user from localStorage
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }

    // Fetch popular products
    fetchPopularProducts();
    
    // Fetch featured pharmacies
    fetchFeaturedPharmacies();

    // Auto-advance carousel
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % carouselSlides.length);
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  const fetchPopularProducts = async () => {
    try {
      const response = await medicationAPI.getPopular();
      setPopularProducts(response.data.medications.slice(0, 5));
    } catch (error) {
      console.error('Error fetching popular products:', error);
    }
  };

  const fetchFeaturedPharmacies = async () => {
    try {
      const response = await pharmacyAPI.getAll({ featured: true });
      setFeaturedPharmacies(response.data.pharmacies.slice(0, 5));
    } catch (error) {
      console.error('Error fetching featured pharmacies:', error);
    }
  };

  const handlePrevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + carouselSlides.length) % carouselSlides.length);
  };

  const handleNextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % carouselSlides.length);
  };

  const handleCategoryClick = (categoryName) => {
    navigate(`/search?category=${encodeURIComponent(categoryName)}`);
  };

  return (
    <Box component="main" sx={{ bgcolor: 'background.default', minHeight: '100vh' }}>
      <Header user={user} />

      <Container component="section" maxWidth="xl" sx={{ py: 5 }}>
        {/* Carousel Section */}
        <Box
          component="section"
          aria-label="Featured content carousel"
          sx={{
            position: 'relative',
            borderRadius: 5,
            overflow: 'hidden',
            height: 450,
            mb: 5,
            boxShadow: '0 8px 32px rgba(0,0,0,0.15)',
          }}
        >
          {carouselSlides.map((slide, index) => (
            <Box
              key={index}
              sx={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                opacity: currentSlide === index ? 1 : 0,
                transition: 'opacity 0.5s ease-in-out',
                backgroundImage: `url(${slide.image})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
              }}
            >
              <Box
                sx={{
                  position: 'absolute',
                  bottom: 0,
                  left: 0,
                  right: 0,
                  background: 'linear-gradient(to top, rgba(0,0,0,0.7) 0%, transparent 100%)',
                  p: 4,
                  color: 'white',
                }}
              >
                <Typography variant="h4" fontWeight={700} mb={1}>
                  {slide.title}
                </Typography>
                <Typography variant="body1" sx={{ opacity: 0.9 }}>
                  {slide.description}
                </Typography>
              </Box>
            </Box>
          ))}

          {/* Carousel Controls */}
          <IconButton
            onClick={handlePrevSlide}
            sx={{
              position: 'absolute',
              left: 20,
              top: '50%',
              transform: 'translateY(-50%)',
              bgcolor: 'rgba(255,255,255,0.9)',
              '&:hover': { bgcolor: 'white' },
            }}
          >
            <ArrowBackIos sx={{ ml: 1 }} />
          </IconButton>
          <IconButton
            onClick={handleNextSlide}
            sx={{
              position: 'absolute',
              right: 20,
              top: '50%',
              transform: 'translateY(-50%)',
              bgcolor: 'rgba(255,255,255,0.9)',
              '&:hover': { bgcolor: 'white' },
            }}
          >
            <ArrowForwardIos />
          </IconButton>

          {/* Indicators */}
          <Box
            sx={{
              position: 'absolute',
              bottom: 20,
              left: '50%',
              transform: 'translateX(-50%)',
              display: 'flex',
              gap: 1,
            }}
          >
            {carouselSlides.map((_, index) => (
              <Box
                key={index}
                onClick={() => setCurrentSlide(index)}
                sx={{
                  width: currentSlide === index ? 30 : 12,
                  height: 12,
                  borderRadius: 6,
                  bgcolor: currentSlide === index ? 'white' : 'rgba(255,255,255,0.5)',
                  cursor: 'pointer',
                  transition: 'all 0.3s',
                }}
              />
            ))}
          </Box>
        </Box>

        {/* Categories Section */}
        <Typography component="h2" variant="h4" fontWeight={700} color="secondary" mb={3} sx={{ position: 'relative', pl: 2 }}>
          <Box component="span" sx={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 5, bgcolor: 'primary.main', borderRadius: 1 }} />
          Browse by Categories
        </Typography>
        <Grid component="nav" aria-label="Medication categories" container spacing={2.5} mb={6}>
          {categories.map((category, index) => {
            const Icon = category.icon;
            return (
              <Grid item xs={6} sm={4} md={2.4} key={index}>
                <Card
                  onClick={() => handleCategoryClick(category.name)}
                  sx={{
                    p: 3,
                    textAlign: 'center',
                    cursor: 'pointer',
                    border: '3px solid #e0e0e0',
                    transition: 'all 0.3s',
                    '&:hover': {
                      background: 'linear-gradient(135deg, #4ecdc4 0%, #44a9a3 100%)',
                      borderColor: '#4ecdc4',
                      transform: 'translateY(-5px)',
                      boxShadow: '0 8px 24px rgba(78, 205, 196, 0.3)',
                      '& .MuiSvgIcon-root': { color: 'white' },
                      '& .MuiTypography-root': { color: 'white' },
                    },
                  }}
                >
                  <Icon sx={{ fontSize: 48, color: 'primary.main', mb: 1.5 }} />
                  <Typography variant="body1" fontWeight={600} color="secondary">
                    {category.name}
                  </Typography>
                </Card>
              </Grid>
            );
          })}
        </Grid>

        {/* Popular Products Section */}
        <Typography component="h2" variant="h4" fontWeight={700} color="secondary" mb={3} sx={{ position: 'relative', pl: 2 }}>
          <Box component="span" sx={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 5, bgcolor: 'primary.main', borderRadius: 1 }} />
          Popular Products
        </Typography>
        <Grid component="section" aria-label="Popular medications" container spacing={2.5} mb={6}>
          {popularProducts.map((product) => (
            <Grid item xs={12} sm={6} md={2.4} key={product._id}>
              <Card
                sx={{
                  height: '100%',
                  cursor: 'pointer',
                  transition: 'all 0.3s',
                  border: '2px solid transparent',
                  '&:hover': {
                    transform: 'translateY(-5px)',
                    boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
                    borderColor: 'primary.main',
                  },
                }}
                onClick={() => navigate(`/search?q=${product.name}`)}
              >
                <Box
                  sx={{
                    height: 150,
                    background: 'linear-gradient(135deg, #e0f7fa 0%, #b2ebf2 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <LocalPharmacy sx={{ fontSize: 64, color: 'primary.main' }} />
                </Box>
                <CardContent>
                  <Typography variant="h6" fontWeight={600} color="secondary" mb={1}>
                    {product.name}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" display="flex" alignItems="center" gap={0.5}>
                    <LocalPharmacy fontSize="small" sx={{ color: 'primary.main' }} />
                    {product.category}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>

        {/* Featured Pharmacies Section */}
        <Typography component="h2" variant="h4" fontWeight={700} color="secondary" mb={3} sx={{ position: 'relative', pl: 2 }}>
          <Box component="span" sx={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 5, bgcolor: 'primary.main', borderRadius: 1 }} />
          Featured Pharmacies
        </Typography>
        <Grid component="section" aria-label="Featured pharmacies" container spacing={2.5}>
          {featuredPharmacies.map((pharmacy) => (
            <Grid item xs={12} sm={6} md={2.4} key={pharmacy._id}>
              <Card
                sx={{
                  height: '100%',
                  cursor: 'pointer',
                  transition: 'all 0.3s',
                  border: '2px solid transparent',
                  '&:hover': {
                    transform: 'translateY(-5px)',
                    boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
                    borderColor: 'primary.main',
                  },
                }}
                onClick={() => navigate(`/pharmacy/${pharmacy._id}`)}
              >
                <Box
                  sx={{
                    height: 150,
                    background: 'linear-gradient(135deg, #e0f7fa 0%, #b2ebf2 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <LocalPharmacy sx={{ fontSize: 64, color: 'primary.main' }} />
                </Box>
                <CardContent>
                  <Typography variant="h6" fontWeight={600} color="secondary" mb={1}>
                    {pharmacy.name}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" mb={1}>
                    📍 {pharmacy.address.city}
                  </Typography>
                  <Chip
                    label={pharmacy.isOpen ? 'Open Now' : 'Closed'}
                    size="small"
                    sx={{
                      bgcolor: pharmacy.isOpen ? '#c8e6c9' : '#ffcdd2',
                      color: pharmacy.isOpen ? '#2e7d32' : '#c62828',
                      fontWeight: 600,
                    }}
                  />
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Container>

      <Footer />
    </Box>
  );
};

export default Home;

