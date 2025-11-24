import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  Grid,
  TextField,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Chip,
  InputAdornment,
  Paper,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
} from '@mui/material';
import {
  Dashboard,
  Inventory,
  ShoppingCart,
  TrendingUp,
  Settings,
  Logout,
  Add,
  Edit,
  Delete,
  Search as SearchIcon,
  Warning,
  Cancel,
  Notifications,
} from '@mui/icons-material';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { medicationAPI, pharmacyAPI } from '../services/api';

const PharmacyDashboard = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [pharmacy, setPharmacy] = useState(null);
  const [medications, setMedications] = useState([]);
  const [filteredMedications, setFilteredMedications] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedMedication, setSelectedMedication] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    category: '',
    price: '',
    stock: '',
    dosage: '',
    form: 'Tablet',
  });

  useEffect(() => {
    // Load user from localStorage
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      const userData = JSON.parse(storedUser);
      if (userData.accountType !== 'pharmacy') {
        navigate('/');
        return;
      }
      setUser(userData);
      fetchPharmacyData(userData.id);
    } else {
      navigate('/login');
    }
  }, [navigate]);

  useEffect(() => {
    const filtered = medications.filter((med) =>
      med.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
    setFilteredMedications(filtered);
  }, [searchQuery, medications]);

  const fetchPharmacyData = async (userId) => {
    try {
      // Fetch pharmacy by owner
      const pharmaciesResponse = await pharmacyAPI.getAll({});
      const userPharmacy = pharmaciesResponse.data.pharmacies.find(
        p => p.owner._id === userId || p.owner === userId
      );

      if (userPharmacy) {
        setPharmacy(userPharmacy);
        fetchMedications(userPharmacy._id);
      }
    } catch (error) {
      console.error('Error fetching pharmacy data:', error);
    }
  };

  const fetchMedications = async (pharmacyId) => {
    try {
      const response = await pharmacyAPI.getMedications(pharmacyId);
      setMedications(response.data.medications || []);
    } catch (error) {
      console.error('Error fetching medications:', error);
    }
  };

  const handleOpenDialog = (medication = null) => {
    if (medication) {
      setSelectedMedication(medication);
      setFormData({
        name: medication.name,
        category: medication.category,
        price: medication.price,
        stock: medication.stock,
        dosage: medication.dosage || '',
        form: medication.form || 'Tablet',
      });
    } else {
      setSelectedMedication(null);
      setFormData({
        name: '',
        category: 'Pain Relief',
        price: '',
        stock: '',
        dosage: '',
        form: 'Tablet',
      });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setSelectedMedication(null);
  };

  const handleSubmit = async () => {
    try {
      if (selectedMedication) {
        // Update medication
        await medicationAPI.update(selectedMedication._id, {
          ...formData,
          pharmacy: pharmacy._id,
        });
        alert('Medication updated successfully!');
      } else {
        // Create medication
        await medicationAPI.create({
          ...formData,
          pharmacy: pharmacy._id,
        });
        alert('Medication added successfully!');
      }
      handleCloseDialog();
      fetchMedications(pharmacy._id);
    } catch (error) {
      console.error('Error saving medication:', error);
      alert('Failed to save medication');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this medication?')) {
      try {
        await medicationAPI.delete(id);
        alert('Medication deleted successfully!');
        fetchMedications(pharmacy._id);
      } catch (error) {
        console.error('Error deleting medication:', error);
        alert('Failed to delete medication');
      }
    }
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

  const stats = {
    totalProducts: medications.length,
    ordersThisMonth: 156,
    lowStockItems: medications.filter(m => m.stockStatus === 'low-stock').length,
    outOfStock: medications.filter(m => m.stockStatus === 'out-of-stock').length,
  };

  if (!user || !pharmacy) {
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

  return (
    <Box component="main" sx={{ bgcolor: 'background.default', minHeight: '100vh' }}>
      <Header user={user} />

      <Container component="section" maxWidth="xl" sx={{ py: 5 }}>
        <Grid container spacing={4}>
          {/* Sidebar */}
          <Grid item xs={12} md={2.5}>
            <Card sx={{ position: 'sticky', top: 90 }}>
              <CardContent>
                <List>
                  <ListItem
                    button
                    selected
                    sx={{
                      borderRadius: 2,
                      mb: 1,
                      '&.Mui-selected': {
                        background: 'linear-gradient(135deg, #4ecdc4 0%, #44a9a3 100%)',
                        color: 'white',
                        '& .MuiListItemIcon-root': { color: 'white' },
                      },
                    }}
                  >
                    <ListItemIcon><Dashboard /></ListItemIcon>
                    <ListItemText primary="Dashboard" />
                  </ListItem>
                  <ListItem
                    button
                    sx={{ borderRadius: 2, mb: 1 }}
                  >
                    <ListItemIcon><Inventory /></ListItemIcon>
                    <ListItemText primary="Inventory" />
                  </ListItem>
                  <ListItem
                    button
                    sx={{ borderRadius: 2, mb: 1 }}
                  >
                    <ListItemIcon><ShoppingCart /></ListItemIcon>
                    <ListItemText primary="Orders" />
                  </ListItem>
                  <ListItem
                    button
                    sx={{ borderRadius: 2, mb: 1 }}
                  >
                    <ListItemIcon><TrendingUp /></ListItemIcon>
                    <ListItemText primary="Analytics" />
                  </ListItem>
                  <ListItem
                    button
                    sx={{ borderRadius: 2, mb: 1 }}
                  >
                    <ListItemIcon><Settings /></ListItemIcon>
                    <ListItemText primary="Settings" />
                  </ListItem>
                  <ListItem
                    button
                    sx={{ borderRadius: 2 }}
                    onClick={() => {
                      localStorage.removeItem('token');
                      localStorage.removeItem('user');
                      navigate('/');
                    }}
                  >
                    <ListItemIcon><Logout /></ListItemIcon>
                    <ListItemText primary="Logout" />
                  </ListItem>
                </List>
              </CardContent>
            </Card>
          </Grid>

          {/* Main Content */}
          <Grid item xs={12} md={9.5}>
            <Box sx={{ mb: 4 }}>
              <Typography variant="h4" fontWeight={700} color="secondary" mb={0.5}>
                Dashboard Overview
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Welcome back! Here's what's happening with your pharmacy today.
              </Typography>
            </Box>

            {/* Stats Grid */}
            <Grid container spacing={3} mb={4}>
              <Grid item xs={12} sm={6} md={3}>
                <Card sx={{ transition: 'all 0.3s', '&:hover': { transform: 'translateY(-5px)', boxShadow: '0 6px 24px rgba(0,0,0,0.12)' } }}>
                  <CardContent>
                    <Box
                      sx={{
                        width: 50,
                        height: 50,
                        borderRadius: 3,
                        background: 'linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#1976d2',
                        mb: 2,
                      }}
                    >
                      <Inventory sx={{ fontSize: 28 }} />
                    </Box>
                    <Typography variant="h4" fontWeight={700} color="secondary" mb={1}>
                      {stats.totalProducts}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Total Products
                    </Typography>
                    <Typography variant="caption" sx={{ color: '#388e3c' }}>
                      ↑ 12 new this week
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>

              <Grid item xs={12} sm={6} md={3}>
                <Card sx={{ transition: 'all 0.3s', '&:hover': { transform: 'translateY(-5px)', boxShadow: '0 6px 24px rgba(0,0,0,0.12)' } }}>
                  <CardContent>
                    <Box
                      sx={{
                        width: 50,
                        height: 50,
                        borderRadius: 3,
                        background: 'linear-gradient(135deg, #e8f5e9 0%, #c8e6c9 100%)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#388e3c',
                        mb: 2,
                      }}
                    >
                      <ShoppingCart sx={{ fontSize: 28 }} />
                    </Box>
                    <Typography variant="h4" fontWeight={700} color="secondary" mb={1}>
                      {stats.ordersThisMonth}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Orders This Month
                    </Typography>
                    <Typography variant="caption" sx={{ color: '#388e3c' }}>
                      ↑ +23% from last month
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>

              <Grid item xs={12} sm={6} md={3}>
                <Card sx={{ transition: 'all 0.3s', '&:hover': { transform: 'translateY(-5px)', boxShadow: '0 6px 24px rgba(0,0,0,0.12)' } }}>
                  <CardContent>
                    <Box
                      sx={{
                        width: 50,
                        height: 50,
                        borderRadius: 3,
                        background: 'linear-gradient(135deg, #fff3e0 0%, #ffe0b2 100%)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#f57c00',
                        mb: 2,
                      }}
                    >
                      <Warning sx={{ fontSize: 28 }} />
                    </Box>
                    <Typography variant="h4" fontWeight={700} color="secondary" mb={1}>
                      {stats.lowStockItems}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Low Stock Items
                    </Typography>
                    <Typography variant="caption" sx={{ color: '#d32f2f' }}>
                      Requires attention
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>

              <Grid item xs={12} sm={6} md={3}>
                <Card sx={{ transition: 'all 0.3s', '&:hover': { transform: 'translateY(-5px)', boxShadow: '0 6px 24px rgba(0,0,0,0.12)' } }}>
                  <CardContent>
                    <Box
                      sx={{
                        width: 50,
                        height: 50,
                        borderRadius: 3,
                        background: 'linear-gradient(135deg, #ffebee 0%, #ffcdd2 100%)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#d32f2f',
                        mb: 2,
                      }}
                    >
                      <Cancel sx={{ fontSize: 28 }} />
                    </Box>
                    <Typography variant="h4" fontWeight={700} color="secondary" mb={1}>
                      {stats.outOfStock}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Out of Stock
                    </Typography>
                    <Typography variant="caption" sx={{ color: '#d32f2f' }}>
                      Restock needed
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>

            {/* Inventory Management */}
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                  <Typography variant="h5" fontWeight={700}>
                    Inventory Management
                  </Typography>
                  <Button
                    variant="contained"
                    startIcon={<Add />}
                    onClick={() => handleOpenDialog()}
                    sx={{
                      background: 'linear-gradient(135deg, #4ecdc4 0%, #44a9a3 100%)',
                    }}
                  >
                    Add Medication
                  </Button>
                </Box>

                <TextField
                  fullWidth
                  placeholder="Search medications..."
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

                <TableContainer>
                  <Table>
                    <TableHead>
                      <TableRow sx={{ bgcolor: '#f8f9fa' }}>
                        <TableCell><strong>Medication Name</strong></TableCell>
                        <TableCell><strong>Category</strong></TableCell>
                        <TableCell><strong>Price</strong></TableCell>
                        <TableCell><strong>Stock</strong></TableCell>
                        <TableCell><strong>Status</strong></TableCell>
                        <TableCell align="center"><strong>Actions</strong></TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {filteredMedications.map((med) => (
                        <TableRow
                          key={med._id}
                          sx={{ '&:hover': { bgcolor: '#f8f9fa' } }}
                        >
                          <TableCell><strong>{med.name}</strong></TableCell>
                          <TableCell>{med.category}</TableCell>
                          <TableCell>{med.price} LBP</TableCell>
                          <TableCell>{med.stock} units</TableCell>
                          <TableCell>
                            <Chip
                              label={med.stockStatus === 'in-stock' ? 'In Stock' : med.stockStatus === 'low-stock' ? 'Low Stock' : 'Out of Stock'}
                              size="small"
                              sx={{ ...getStockStatusColor(med.stockStatus), fontWeight: 600 }}
                            />
                          </TableCell>
                          <TableCell align="center">
                            <IconButton
                              size="small"
                              onClick={() => handleOpenDialog(med)}
                              sx={{ bgcolor: '#e3f2fd', color: '#1976d2', mr: 1 }}
                            >
                              <Edit fontSize="small" />
                            </IconButton>
                            <IconButton
                              size="small"
                              onClick={() => handleDelete(med._id)}
                              sx={{ bgcolor: '#ffebee', color: '#d32f2f' }}
                            >
                              <Delete fontSize="small" />
                            </IconButton>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Container>

      {/* Add/Edit Dialog */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>
          {selectedMedication ? 'Edit Medication' : 'Add New Medication'}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Medication Name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                select
                label="Category"
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                required
                SelectProps={{ native: true }}
              >
                <option value="Pain Relief">Pain Relief</option>
                <option value="Antibiotics">Antibiotics</option>
                <option value="Respiratory">Respiratory</option>
                <option value="Cardiac Care">Cardiac Care</option>
                <option value="Stomach Care">Stomach Care</option>
                <option value="Other">Other</option>
              </TextField>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                select
                label="Form"
                value={formData.form}
                onChange={(e) => setFormData({ ...formData, form: e.target.value })}
                SelectProps={{ native: true }}
              >
                <option value="Tablet">Tablet</option>
                <option value="Capsule">Capsule</option>
                <option value="Syrup">Syrup</option>
                <option value="Injection">Injection</option>
                <option value="Cream">Cream</option>
                <option value="Inhaler">Inhaler</option>
                <option value="Other">Other</option>
              </TextField>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Price (LBP)"
                type="number"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Stock Quantity"
                type="number"
                value={formData.stock}
                onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                required
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Dosage (optional)"
                value={formData.dosage}
                onChange={(e) => setFormData({ ...formData, dosage: e.target.value })}
                placeholder="e.g., 500mg"
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button
            onClick={handleSubmit}
            variant="contained"
            sx={{
              background: 'linear-gradient(135deg, #4ecdc4 0%, #44a9a3 100%)',
            }}
          >
            Save Medication
          </Button>
        </DialogActions>
      </Dialog>

      <Footer />
    </Box>
  );
};

export default PharmacyDashboard;

