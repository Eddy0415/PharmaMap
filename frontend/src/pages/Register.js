import React, { useState } from 'react';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import {
  Container,
  Box,
  Paper,
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
} from '@mui/material';
import {
  Person,
  Email,
  Phone,
  Lock,
  Visibility,
  VisibilityOff,
  PersonAdd,
  LocalPharmacy,
  Business,
  LocationOn,
  Badge,
} from '@mui/icons-material';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { authAPI } from '../services/api';

const Register = () => {
  const navigate = useNavigate();
  const [accountType, setAccountType] = useState('customer');
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    pharmacyName: '',
    pharmacyAddress: '',
    city: '',
    license: '',
    terms: false,
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value, checked, type } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value,
    });
  };

  const handleAccountTypeChange = (event, newType) => {
    if (newType !== null) {
      setAccountType(newType);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Validation
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (formData.password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }

    if (!formData.terms) {
      setError('You must agree to the Terms of Service');
      return;
    }

    if (accountType === 'pharmacy') {
      if (!formData.pharmacyName || !formData.pharmacyAddress || !formData.city || !formData.license) {
        setError('Please fill in all pharmacy information');
        return;
      }
    }

    setLoading(true);

    try {
      const response = await authAPI.register({
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        phone: formData.phone,
        password: formData.password,
        accountType,
        ...(accountType === 'pharmacy' && {
          pharmacyName: formData.pharmacyName,
          pharmacyAddress: formData.pharmacyAddress,
          city: formData.city,
          license: formData.license,
        }),
      });

      if (response.data.success) {
        // Store token and user data
        localStorage.setItem('token', response.data.token);
        localStorage.setItem('user', JSON.stringify(response.data.user));

        // Redirect based on account type
        if (accountType === 'pharmacy') {
          navigate('/dashboard');
        } else {
          navigate('/');
        }
      }
    } catch (error) {
      setError(error.response?.data?.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box component="main" sx={{ bgcolor: 'background.default', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Header />

      <Box
        component="section"
        sx={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          py: 5,
        }}
      >
        <Container maxWidth="md">
          <Paper
            component="article"
            elevation={8}
            sx={{
              p: 5,
              borderRadius: 5,
            }}
          >
            {/* Header */}
            <Box component="header" sx={{ textAlign: 'center', mb: 4 }}>
              <Typography component="h1" variant="h4" fontWeight={700} color="secondary" mb={1}>
                Create Account
              </Typography>
              <Typography component="p" variant="body1" color="text.secondary">
                Join PharmaMap today
              </Typography>
            </Box>

            {/* Account Type Toggle */}
            <Box sx={{ display: 'flex', justifyContent: 'center', mb: 4 }}>
              <ToggleButtonGroup
                value={accountType}
                exclusive
                onChange={handleAccountTypeChange}
                sx={{ width: '100%', maxWidth: 500 }}
              >
                <ToggleButton
                  value="customer"
                  sx={{
                    flex: 1,
                    py: 2,
                    '&.Mui-selected': {
                      background: 'linear-gradient(135deg, #4ecdc4 0%, #44a9a3 100%)',
                      color: 'white',
                      '&:hover': {
                        background: 'linear-gradient(135deg, #44a9a3 0%, #3a8f8a 100%)',
                      },
                    },
                  }}
                >
                  <Person sx={{ mr: 1 }} />
                  Customer
                </ToggleButton>
                <ToggleButton
                  value="pharmacy"
                  sx={{
                    flex: 1,
                    py: 2,
                    '&.Mui-selected': {
                      background: 'linear-gradient(135deg, #4ecdc4 0%, #44a9a3 100%)',
                      color: 'white',
                      '&:hover': {
                        background: 'linear-gradient(135deg, #44a9a3 0%, #3a8f8a 100%)',
                      },
                    },
                  }}
                >
                  <LocalPharmacy sx={{ mr: 1 }} />
                  Pharmacy Owner
                </ToggleButton>
              </ToggleButtonGroup>
            </Box>

            {/* Error Alert */}
            {error && (
              <Alert severity="error" sx={{ mb: 3 }}>
                {error}
              </Alert>
            )}

            {/* Registration Form */}
            <form onSubmit={handleSubmit}>
              <Grid container spacing={2.5}>
                {/* Personal Information */}
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="First Name"
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleChange}
                    required
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <Person sx={{ color: 'primary.main' }} />
                        </InputAdornment>
                      ),
                    }}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Last Name"
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleChange}
                    required
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <Person sx={{ color: 'primary.main' }} />
                        </InputAdornment>
                      ),
                    }}
                  />
                </Grid>

                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Email Address"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <Email sx={{ color: 'primary.main' }} />
                        </InputAdornment>
                      ),
                    }}
                  />
                </Grid>

                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Phone Number"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    required
                    placeholder="+961 XX XXX XXX"
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <Phone sx={{ color: 'primary.main' }} />
                        </InputAdornment>
                      ),
                    }}
                  />
                </Grid>

                {/* Pharmacy Fields */}
                {accountType === 'pharmacy' && (
                  <>
                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        label="Pharmacy Name"
                        name="pharmacyName"
                        value={formData.pharmacyName}
                        onChange={handleChange}
                        required={accountType === 'pharmacy'}
                        InputProps={{
                          startAdornment: (
                            <InputAdornment position="start">
                              <Business sx={{ color: 'primary.main' }} />
                            </InputAdornment>
                          ),
                        }}
                      />
                    </Grid>

                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        label="Pharmacy Address"
                        name="pharmacyAddress"
                        value={formData.pharmacyAddress}
                        onChange={handleChange}
                        required={accountType === 'pharmacy'}
                        InputProps={{
                          startAdornment: (
                            <InputAdornment position="start">
                              <LocationOn sx={{ color: 'primary.main' }} />
                            </InputAdornment>
                          ),
                        }}
                      />
                    </Grid>

                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="City"
                        name="city"
                        value={formData.city}
                        onChange={handleChange}
                        required={accountType === 'pharmacy'}
                        InputProps={{
                          startAdornment: (
                            <InputAdornment position="start">
                              <LocationOn sx={{ color: 'primary.main' }} />
                            </InputAdornment>
                          ),
                        }}
                      />
                    </Grid>

                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="License Number"
                        name="license"
                        value={formData.license}
                        onChange={handleChange}
                        required={accountType === 'pharmacy'}
                        InputProps={{
                          startAdornment: (
                            <InputAdornment position="start">
                              <Badge sx={{ color: 'primary.main' }} />
                            </InputAdornment>
                          ),
                        }}
                      />
                    </Grid>
                  </>
                )}

                {/* Password Fields */}
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    value={formData.password}
                    onChange={handleChange}
                    required
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <Lock sx={{ color: 'primary.main' }} />
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
                </Grid>

                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Confirm Password"
                    name="confirmPassword"
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    required
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <Lock sx={{ color: 'primary.main' }} />
                        </InputAdornment>
                      ),
                      endAdornment: (
                        <InputAdornment position="end">
                          <IconButton
                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                            edge="end"
                          >
                            {showConfirmPassword ? <VisibilityOff /> : <Visibility />}
                          </IconButton>
                        </InputAdornment>
                      ),
                    }}
                  />
                </Grid>
              </Grid>

              {/* Terms Checkbox */}
              <FormControlLabel
                control={
                  <Checkbox
                    name="terms"
                    checked={formData.terms}
                    onChange={handleChange}
                    sx={{ color: 'primary.main' }}
                  />
                }
                label={
                  <Typography variant="body2" color="text.secondary">
                    I agree to the{' '}
                    <Link href="#" sx={{ color: 'primary.main', textDecoration: 'none' }}>
                      Terms of Service
                    </Link>{' '}
                    and{' '}
                    <Link href="#" sx={{ color: 'primary.main', textDecoration: 'none' }}>
                      Privacy Policy
                    </Link>
                  </Typography>
                }
                sx={{ mt: 2, mb: 3 }}
              />

              <Button
                fullWidth
                type="submit"
                variant="contained"
                size="large"
                disabled={loading}
                startIcon={<PersonAdd />}
                sx={{
                  py: 1.5,
                  background: 'linear-gradient(135deg, #4ecdc4 0%, #44a9a3 100%)',
                  fontSize: 16,
                  fontWeight: 700,
                  boxShadow: '0 4px 12px rgba(78, 205, 196, 0.3)',
                  '&:hover': {
                    transform: 'translateY(-2px)',
                    boxShadow: '0 6px 20px rgba(78, 205, 196, 0.4)',
                  },
                }}
              >
                {loading ? 'Creating Account...' : 'Create Account'}
              </Button>
            </form>

            {/* Login Link */}
            <Typography variant="body2" textAlign="center" color="text.secondary" mt={3}>
              Already have an account?{' '}
              <Link
                component={RouterLink}
                to="/login"
                sx={{ color: 'primary.main', fontWeight: 700, textDecoration: 'none' }}
              >
                Login Here
              </Link>
            </Typography>
          </Paper>
        </Container>
      </Box>

      <Footer />
    </Box>
  );
};

export default Register;

