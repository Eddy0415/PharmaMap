import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Container,
  Box,
  Typography,
  TextField,
  Button,
  Card,
  CardContent,
  Grid,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Chip,
  IconButton,
  InputAdornment,
} from '@mui/material';
import {
  Search as SearchIcon,
  LocalPharmacy,
  Phone,
  Schedule,
  Room,
  FilterList,
} from '@mui/icons-material';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { medicationAPI } from '../services/api';

const Search = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [user, setUser] = useState(null);
  const [searchQuery, setSearchQuery] = useState(searchParams.get('q') || '');
  const [sortBy, setSortBy] = useState('distance');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Load user from localStorage
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }

    // Perform search if query exists
    const query = searchParams.get('q') || searchParams.get('category');
    if (query) {
      setSearchQuery(query);
      performSearch(query);
    }
  }, [searchParams]);

  const performSearch = async (query) => {
    if (!query.trim()) return;

    setLoading(true);
    try {
      const response = await medicationAPI.search({ 
        query: query,
        sortBy 
      });
      setResults(response.data.results || []);
    } catch (error) {
      console.error('Search error:', error);
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery)}`);
      performSearch(searchQuery);
    }
  };

  const handleSortChange = (e) => {
    setSortBy(e.target.value);
    // Re-sort current results
    const sorted = [...results];
    switch (e.target.value) {
      case 'price-low':
        sorted.sort((a, b) => {
          const aPrice = a.medications[0]?.price || 0;
          const bPrice = b.medications[0]?.price || 0;
          return aPrice - bPrice;
        });
        break;
      case 'price-high':
        sorted.sort((a, b) => {
          const aPrice = a.medications[0]?.price || 0;
          const bPrice = b.medications[0]?.price || 0;
          return bPrice - aPrice;
        });
        break;
      case 'availability':
        sorted.sort((a, b) => {
          const statusOrder = { 'in-stock': 0, 'low-stock': 1, 'out-of-stock': 2 };
          const aStatus = a.medications[0]?.stockStatus || 'out-of-stock';
          const bStatus = b.medications[0]?.stockStatus || 'out-of-stock';
          return statusOrder[aStatus] - statusOrder[bStatus];
        });
        break;
      default:
        // distance sorting would require coordinates
        break;
    }
    setResults(sorted);
  };

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

  const getStockStatusText = (status) => {
    switch (status) {
      case 'in-stock':
        return 'In Stock';
      case 'low-stock':
        return 'Low Stock';
      case 'out-of-stock':
        return 'Out of Stock';
      default:
        return 'Unknown';
    }
  };

  return (
    <Box component="main" sx={{ bgcolor: 'background.default', minHeight: '100vh' }}>
      <Header user={user} />

      <Container component="section" maxWidth="xl" sx={{ py: 5 }}>
        {/* Search Header */}
        <Box component="header" sx={{ mb: 4 }}>
          <Box
            component="form"
            onSubmit={handleSearch}
            role="search"
            sx={{
              display: 'flex',
              gap: 2,
              mb: 3,
            }}
          >
            <TextField
              fullWidth
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search for medications..."
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon sx={{ color: 'primary.main' }} />
                  </InputAdornment>
                ),
                sx: {
                  bgcolor: 'white',
                  borderRadius: 3,
                },
              }}
            />
            <Button
              type="submit"
              variant="contained"
              size="large"
              startIcon={<SearchIcon />}
              sx={{
                px: 4,
                background: 'linear-gradient(135deg, #4ecdc4 0%, #44a9a3 100%)',
                whiteSpace: 'nowrap',
              }}
            >
              Search
            </Button>
          </Box>

          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
            <Box>
              <Typography component="h1" variant="h5" fontWeight={700} color="secondary" mb={0.5}>
                Search Results for "{searchQuery}"
              </Typography>
              <Typography component="p" variant="body2" color="text.secondary">
                Found {results.length} {results.length === 1 ? 'pharmacy' : 'pharmacies'} with this medication
              </Typography>
            </Box>

            <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
              <Button
                variant="outlined"
                startIcon={<FilterList />}
                sx={{
                  borderColor: '#e0e0e0',
                  color: 'text.primary',
                }}
              >
                Filters
              </Button>
              <FormControl sx={{ minWidth: 200 }}>
                <InputLabel>Sort by</InputLabel>
                <Select
                  value={sortBy}
                  onChange={handleSortChange}
                  label="Sort by"
                  sx={{ bgcolor: 'white' }}
                >
                  <MenuItem value="distance">Distance</MenuItem>
                  <MenuItem value="price-low">Price: Low to High</MenuItem>
                  <MenuItem value="price-high">Price: High to Low</MenuItem>
                  <MenuItem value="availability">Availability</MenuItem>
                </Select>
              </FormControl>
            </Box>
          </Box>
        </Box>

        {/* Results */}
        {loading ? (
          <Box sx={{ textAlign: 'center', py: 8 }}>
            <Typography variant="h6" color="text.secondary">
              Searching...
            </Typography>
          </Box>
        ) : results.length === 0 ? (
          <Card sx={{ p: 8, textAlign: 'center' }}>
            <SearchIcon sx={{ fontSize: 80, color: '#e0e0e0', mb: 2 }} />
            <Typography variant="h5" color="text.secondary" mb={1}>
              No Results Found
            </Typography>
            <Typography variant="body1" color="text.secondary" mb={3}>
              We couldn't find any pharmacies with this medication in stock.
            </Typography>
            <Button
              variant="contained"
              onClick={() => navigate('/')}
              sx={{
                background: 'linear-gradient(135deg, #4ecdc4 0%, #44a9a3 100%)',
              }}
            >
              Back to Home
            </Button>
          </Card>
        ) : (
          <Grid container spacing={3}>
            {results.map((result) => (
              <Grid item xs={12} key={result.pharmacy._id}>
                <Card
                  sx={{
                    transition: 'all 0.3s',
                    cursor: 'pointer',
                    '&:hover': {
                      transform: 'translateY(-4px)',
                      boxShadow: '0 6px 24px rgba(0,0,0,0.12)',
                    },
                  }}
                  onClick={() => navigate(`/pharmacy/${result.pharmacy._id}`)}
                >
                  <CardContent sx={{ p: 3 }}>
                    <Grid container spacing={3} alignItems="center">
                      {/* Pharmacy Logo */}
                      <Grid item>
                        <Box
                          sx={{
                            width: 100,
                            height: 100,
                            borderRadius: 3,
                            background: 'linear-gradient(135deg, #e0f7fa 0%, #b2ebf2 100%)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                        >
                          <LocalPharmacy sx={{ fontSize: 48, color: 'primary.main' }} />
                        </Box>
                      </Grid>

                      {/* Pharmacy Info */}
                      <Grid item xs>
                        <Typography variant="h5" fontWeight={700} color="secondary" mb={1}>
                          {result.pharmacy.name}
                        </Typography>
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mb: 1.5 }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, color: 'text.secondary' }}>
                            <Room fontSize="small" sx={{ color: 'primary.main' }} />
                            {result.pharmacy.address.street}, {result.pharmacy.address.city}
                          </Box>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, color: 'text.secondary' }}>
                            <Phone fontSize="small" sx={{ color: 'primary.main' }} />
                            {result.pharmacy.phone}
                          </Box>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, color: 'text.secondary' }}>
                            <Schedule fontSize="small" sx={{ color: 'primary.main' }} />
                            {result.pharmacy.is24Hours ? '24/7' : 'Limited Hours'}
                          </Box>
                        </Box>

                        {/* Medications List */}
                        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                          {result.medications.map((med) => (
                            <Chip
                              key={med._id}
                              label={`${med.name} - ${med.price} LBP`}
                              size="small"
                              sx={{
                                ...getStockStatusColor(med.stockStatus),
                                fontWeight: 600,
                              }}
                            />
                          ))}
                        </Box>
                      </Grid>

                      {/* Price and Actions */}
                      <Grid item sx={{ textAlign: 'right' }}>
                        <Typography variant="h4" fontWeight={700} color="primary.main" mb={1}>
                          {result.medications[0]?.price || 0} LBP
                        </Typography>
                        <Chip
                          label={getStockStatusText(result.medications[0]?.stockStatus)}
                          sx={{
                            ...getStockStatusColor(result.medications[0]?.stockStatus),
                            fontWeight: 600,
                            mb: 2,
                          }}
                        />
                        <Box sx={{ display: 'flex', gap: 1 }}>
                          <Button
                            variant="outlined"
                            size="small"
                            startIcon={<Room />}
                            onClick={(e) => {
                              e.stopPropagation();
                              alert(`Opening map for ${result.pharmacy.name}`);
                            }}
                          >
                            Map
                          </Button>
                          <Button
                            variant="contained"
                            size="small"
                            startIcon={<Phone />}
                            onClick={(e) => {
                              e.stopPropagation();
                              window.location.href = `tel:${result.pharmacy.phone}`;
                            }}
                            disabled={result.medications[0]?.stockStatus === 'out-of-stock'}
                            sx={{
                              background: 'linear-gradient(135deg, #4ecdc4 0%, #44a9a3 100%)',
                            }}
                          >
                            Call
                          </Button>
                        </Box>
                      </Grid>
                    </Grid>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        )}
      </Container>

      <Footer />
    </Box>
  );
};

export default Search;

