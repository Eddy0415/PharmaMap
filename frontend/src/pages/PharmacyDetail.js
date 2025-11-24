import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Container,
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  Grid,
  TextField,
  Chip,
  IconButton,
  Rating,
  InputAdornment,
  Divider,
  Paper,
} from '@mui/material';
import {
  ArrowBack,
  LocalPharmacy,
  Phone,
  Room,
  Schedule,
  Star,
  Search as SearchIcon,
  Directions,
  Share,
  Favorite,
  FavoriteBorder,
} from '@mui/icons-material';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { pharmacyAPI } from '../services/api';

const PharmacyDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [pharmacy, setPharmacy] = useState(null);
  const [medications, setMedications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isFavorite, setIsFavorite] = useState(false);

  useEffect(() => {
    // Load user from localStorage
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }

    fetchPharmacyDetails();
  }, [id]);

  const fetchPharmacyDetails = async () => {
    setLoading(true);
    try {
      const response = await pharmacyAPI.getById(id);
      setPharmacy(response.data.pharmacy);
      setMedications(response.data.medications || []);
    } catch (error) {
      console.error('Error fetching pharmacy details:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredMedications = medications.filter((med) =>
    med.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getStockStatusColor = (status) => {
    switch (status) {
      case 'in-stock':
        return { bgcolor: '#c8e6c9', color: '#2e7d32' };
      case 'low-stock':
        return { bgcolor: '#fff9c4', color: '#f57f17' };
      case 'out-of-stock':
        return { bgcolor: '#ffcdd2', color: '#c62828' };
      default:
        return { bgcolor: '#e0e0e0', color: '#666' };
    }
  };

  if (loading) {
    return (
      <Box sx={{ bgcolor: 'background.default', minHeight: '100vh' }}>
        <Header user={user} />
        <Container maxWidth="xl" sx={{ py: 5 }}>
          <Typography>Loading...</Typography>
        </Container>
        <Footer />
      </Box>
    );
  }

  if (!pharmacy) {
    return (
      <Box sx={{ bgcolor: 'background.default', minHeight: '100vh' }}>
        <Header user={user} />
        <Container maxWidth="xl" sx={{ py: 5 }}>
          <Typography>Pharmacy not found</Typography>
        </Container>
        <Footer />
      </Box>
    );
  }

  return (
    <Box component="main" sx={{ bgcolor: 'background.default', minHeight: '100vh' }}>
      <Header user={user} />

      <Container component="article" maxWidth="xl" sx={{ py: 5 }}>
        {/* Back Button */}
        <Button
          startIcon={<ArrowBack />}
          onClick={() => navigate(-1)}
          sx={{ mb: 3, color: 'text.primary' }}
        >
          Back to Results
        </Button>

        {/* Pharmacy Hero */}
        <Card component="header" sx={{ mb: 4, p: 4 }}>
          <Grid container spacing={4} alignItems="flex-start">
            {/* Logo */}
            <Grid item>
              <Box
                component="figure"
                sx={{
                  width: 120,
                  height: 120,
                  borderRadius: 4,
                  background: 'linear-gradient(135deg, #e0f7fa 0%, #b2ebf2 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  m: 0,
                }}
              >
                <LocalPharmacy sx={{ fontSize: 64, color: 'primary.main' }} />
              </Box>
            </Grid>

            {/* Info */}
            <Grid item xs>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                <Typography component="h1" variant="h4" fontWeight={700} color="secondary">
                  {pharmacy.name}
                </Typography>
                <IconButton
                  onClick={() => setIsFavorite(!isFavorite)}
                  sx={{ color: 'error.main' }}
                >
                  {isFavorite ? <Favorite /> : <FavoriteBorder />}
                </IconButton>
              </Box>

              <Chip
                label={pharmacy.isOpen ? `Open Now • Closes at 10:00 PM` : 'Closed'}
                sx={{
                  bgcolor: pharmacy.isOpen ? '#c8e6c9' : '#ffcdd2',
                  color: pharmacy.isOpen ? '#2e7d32' : '#c62828',
                  fontWeight: 600,
                  mb: 2,
                }}
              />

              <Grid container spacing={3}>
                <Grid item xs={12} sm={6} md={3}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Room sx={{ color: 'primary.main' }} />
                    <Box>
                      <Typography variant="body2" fontWeight={600}>Location</Typography>
                      <Typography variant="body2" color="text.secondary">
                        {pharmacy.address.street}, {pharmacy.address.city}
                      </Typography>
                    </Box>
                  </Box>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Phone sx={{ color: 'primary.main' }} />
                    <Box>
                      <Typography variant="body2" fontWeight={600}>Phone</Typography>
                      <Typography variant="body2" color="text.secondary">
                        {pharmacy.phone}
                      </Typography>
                    </Box>
                  </Box>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Star sx={{ color: 'primary.main' }} />
                    <Box>
                      <Typography variant="body2" fontWeight={600}>Rating</Typography>
                      <Typography variant="body2" color="text.secondary">
                        {pharmacy.rating.toFixed(1)} ({pharmacy.reviewCount} reviews)
                      </Typography>
                    </Box>
                  </Box>
                </Grid>
              </Grid>
            </Grid>

            {/* Actions */}
            <Grid item>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                <Button
                  variant="contained"
                  startIcon={<Phone />}
                  onClick={() => window.location.href = `tel:${pharmacy.phone}`}
                  sx={{
                    background: 'linear-gradient(135deg, #4ecdc4 0%, #44a9a3 100%)',
                  }}
                >
                  Call Pharmacy
                </Button>
                <Button
                  variant="outlined"
                  startIcon={<Directions />}
                  onClick={() => alert('Opening directions')}
                >
                  Get Directions
                </Button>
                <Button
                  variant="outlined"
                  startIcon={<Share />}
                  onClick={() => alert('Share functionality')}
                >
                  Share
                </Button>
              </Box>
            </Grid>
          </Grid>
        </Card>

        <Grid container spacing={4}>
          {/* Main Content */}
          <Grid item xs={12} md={8}>
            {/* Medications */}
            <Card sx={{ mb: 4 }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <LocalPharmacy sx={{ mr: 1, color: 'primary.main' }} />
                  <Typography variant="h5" fontWeight={700}>
                    Available Medications
                  </Typography>
                </Box>

                <TextField
                  fullWidth
                  placeholder="Search in this pharmacy..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  sx={{ mb: 3 }}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <SearchIcon sx={{ color: 'primary.main' }} />
                      </InputAdornment>
                    ),
                  }}
                />

                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  {filteredMedications.map((med) => (
                    <Paper
                      key={med._id}
                      sx={{
                        p: 2,
                        border: '2px solid #f0f0f0',
                        transition: 'all 0.3s',
                        '&:hover': {
                          borderColor: 'primary.main',
                          bgcolor: '#f8fdfd',
                        },
                      }}
                    >
                      <Grid container spacing={2} alignItems="center">
                        <Grid item xs>
                          <Typography variant="h6" fontWeight={600} color="secondary">
                            {med.name}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            {med.category} • {med.dosage || 'N/A'}
                          </Typography>
                        </Grid>
                        <Grid item sx={{ textAlign: 'right' }}>
                          <Typography variant="h6" fontWeight={700} color="primary.main" mb={0.5}>
                            {med.price} LBP
                          </Typography>
                          <Chip
                            label={`Stock: ${med.stock} units`}
                            size="small"
                            sx={{ ...getStockStatusColor(med.stockStatus), fontWeight: 600 }}
                          />
                        </Grid>
                      </Grid>
                    </Paper>
                  ))}
                </Box>
              </CardContent>
            </Card>

            {/* Reviews */}
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                  <Star sx={{ mr: 1, color: 'primary.main' }} />
                  <Typography variant="h5" fontWeight={700}>
                    Reviews & Ratings
                  </Typography>
                </Box>

                <Box
                  sx={{
                    display: 'flex',
                    gap: 3,
                    p: 3,
                    bgcolor: '#f8f9fa',
                    borderRadius: 3,
                    mb: 3,
                  }}
                >
                  <Typography variant="h2" fontWeight={700} color="secondary">
                    {pharmacy.rating.toFixed(1)}
                  </Typography>
                  <Box>
                    <Rating value={pharmacy.rating} precision={0.1} readOnly size="large" />
                    <Typography variant="body2" color="text.secondary">
                      Based on {pharmacy.reviewCount} reviews
                    </Typography>
                  </Box>
                </Box>

                {pharmacy.reviews && pharmacy.reviews.slice(0, 3).map((review, index) => (
                  <Box key={index} sx={{ mb: 3, pb: 3, borderBottom: index < 2 ? '1px solid #e0e0e0' : 'none' }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                      <Box>
                        <Typography variant="subtitle1" fontWeight={600}>
                          {review.user?.firstName || 'Anonymous User'}
                        </Typography>
                        <Rating value={review.rating} readOnly size="small" />
                      </Box>
                      <Typography variant="caption" color="text.secondary">
                        {new Date(review.createdAt).toLocaleDateString()}
                      </Typography>
                    </Box>
                    <Typography variant="body2" color="text.secondary">
                      {review.comment}
                    </Typography>
                  </Box>
                ))}
              </CardContent>
            </Card>
          </Grid>

          {/* Sidebar */}
          <Grid item xs={12} md={4}>
            {/* Map */}
            <Card sx={{ mb: 3 }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Room sx={{ mr: 1, color: 'primary.main' }} />
                  <Typography variant="h6" fontWeight={700}>
                    Location
                  </Typography>
                </Box>
                <Box
                  sx={{
                    height: 250,
                    borderRadius: 3,
                    background: 'linear-gradient(135deg, #e0f7fa 0%, #b2ebf2 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    mb: 2,
                  }}
                >
                  <Room sx={{ fontSize: 64, color: 'primary.main' }} />
                </Box>
                <Button
                  fullWidth
                  variant="contained"
                  startIcon={<Directions />}
                  sx={{
                    background: 'linear-gradient(135deg, #4ecdc4 0%, #44a9a3 100%)',
                  }}
                >
                  Get Directions
                </Button>
              </CardContent>
            </Card>

            {/* Contact Information */}
            <Card sx={{ mb: 3 }}>
              <CardContent>
                <Typography variant="h6" fontWeight={700} mb={2}>
                  Contact Information
                </Typography>

                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <Box sx={{ display: 'flex', gap: 2, p: 2, bgcolor: '#f8f9fa', borderRadius: 2 }}>
                    <Box
                      sx={{
                        width: 40,
                        height: 40,
                        borderRadius: 2,
                        background: 'linear-gradient(135deg, #4ecdc4 0%, #44a9a3 100%)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'white',
                      }}
                    >
                      <Phone />
                    </Box>
                    <Box>
                      <Typography variant="body2" fontWeight={600}>Phone</Typography>
                      <Typography variant="body2" color="text.secondary">
                        {pharmacy.phone}
                      </Typography>
                    </Box>
                  </Box>

                  <Box sx={{ display: 'flex', gap: 2, p: 2, bgcolor: '#f8f9fa', borderRadius: 2 }}>
                    <Box
                      sx={{
                        width: 40,
                        height: 40,
                        borderRadius: 2,
                        background: 'linear-gradient(135deg, #4ecdc4 0%, #44a9a3 100%)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'white',
                      }}
                    >
                      <Room />
                    </Box>
                    <Box>
                      <Typography variant="body2" fontWeight={600}>Address</Typography>
                      <Typography variant="body2" color="text.secondary">
                        {pharmacy.address.street}<br />
                        {pharmacy.address.city}, Lebanon
                      </Typography>
                    </Box>
                  </Box>
                </Box>
              </CardContent>
            </Card>

            {/* Working Hours */}
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Schedule sx={{ mr: 1, color: 'primary.main' }} />
                  <Typography variant="h6" fontWeight={700}>
                    Working Hours
                  </Typography>
                </Box>

                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                  {pharmacy.workingHours && Object.entries(pharmacy.workingHours).map(([day, hours]) => (
                    <Box
                      key={day}
                      sx={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        p: 1.5,
                        bgcolor: '#f8f9fa',
                        borderRadius: 2,
                      }}
                    >
                      <Typography variant="body2" fontWeight={600} sx={{ textTransform: 'capitalize' }}>
                        {day}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {hours.open} - {hours.close}
                      </Typography>
                    </Box>
                  ))}
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Container>

      <Footer />
    </Box>
  );
};

export default PharmacyDetail;

