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
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Alert,
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
import { medicationAPI, pharmacyAPI, inventoryAPI, orderAPI } from '../services/api';

const PharmacyDashboard = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [pharmacy, setPharmacy] = useState(null);
  const [inventoryItems, setInventoryItems] = useState([]);
  const [allItems, setAllItems] = useState([]);
  const [orders, setOrders] = useState([]);
  const [filteredInventory, setFilteredInventory] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedInventory, setSelectedInventory] = useState(null);
  const [formData, setFormData] = useState({
    itemId: '',
    quantity: '',
    price: '',
    lowStockThreshold: 10,
    isAvailable: true,
  });

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      const userData = JSON.parse(storedUser);
      if (userData.userType !== 'pharmacist') {
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
    const filtered = inventoryItems.filter((inv) => {
      const itemName = inv.item?.name || '';
      return itemName.toLowerCase().includes(searchQuery.toLowerCase());
    });
    setFilteredInventory(filtered);
  }, [searchQuery, inventoryItems]);

  const fetchPharmacyData = async (userId) => {
    try {
      const pharmaciesResponse = await pharmacyAPI.getAll({});
      const userPharmacy = pharmaciesResponse.data.pharmacies.find(
        p => (p.owner?._id || p.owner) === userId
      );

      if (userPharmacy) {
        setPharmacy(userPharmacy);
        await Promise.all([
          fetchInventory(userPharmacy._id),
          fetchAllItems(),
          fetchOrders(userPharmacy._id),
        ]);
      }
    } catch (error) {
      console.error('Error fetching pharmacy data:', error);
    }
  };

  const fetchInventory = async (pharmacyId) => {
    try {
      // Workaround: Use medications API with city filter to get inventory
      if (pharmacy?.address?.city) {
        const response = await medicationAPI.getAll({
          city: pharmacy.address.city,
        });

        const pharmacyInventory = [];
        response.data.results?.forEach((result) => {
          result.inventory?.forEach((inv) => {
            if ((inv.pharmacy?._id || inv.pharmacy) === pharmacyId) {
              pharmacyInventory.push({
                ...inv,
                item: result.item,
              });
            }
          });
        });

        setInventoryItems(pharmacyInventory);
      }
    } catch (error) {
      console.error('Error fetching inventory:', error);
    }
  };

  const fetchAllItems = async () => {
    try {
      const response = await medicationAPI.getAll({});
      const items = response.data.results?.map(r => r.item).filter(Boolean) || [];
      setAllItems(items);
    } catch (error) {
      console.error('Error fetching items:', error);
    }
  };

  const fetchOrders = async (pharmacyId) => {
    try {
      const response = await orderAPI.getAll({ pharmacyId });
      setOrders(response.data.orders || []);
    } catch (error) {
      console.error('Error fetching orders:', error);
    }
  };

  const handleOpenDialog = (inventoryItem = null) => {
    if (inventoryItem) {
      setSelectedInventory(inventoryItem);
      setFormData({
        itemId: inventoryItem.item?._id || inventoryItem.item || '',
        quantity: inventoryItem.quantity || '',
        price: inventoryItem.price || '',
        lowStockThreshold: inventoryItem.lowStockThreshold || 10,
        isAvailable: inventoryItem.isAvailable !== false,
      });
    } else {
      setSelectedInventory(null);
      setFormData({
        itemId: '',
        quantity: '',
        price: '',
        lowStockThreshold: 10,
        isAvailable: true,
      });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setSelectedInventory(null);
  };

  const handleSubmit = async () => {
    if (!pharmacy?._id) {
      alert('Pharmacy not found');
      return;
    }

    if (!formData.itemId || !formData.price || formData.quantity === '') {
      alert('Please fill in all required fields');
      return;
    }

    try {
      if (selectedInventory) {
        // Update inventory
        await inventoryAPI.update(selectedInventory._id, {
          quantity: parseInt(formData.quantity),
          price: parseFloat(formData.price),
          lowStockThreshold: parseInt(formData.lowStockThreshold),
          isAvailable: formData.isAvailable,
        });
        alert('Inventory updated successfully!');
      } else {
        // Create new inventory entry
        await inventoryAPI.add({
          pharmacy: pharmacy._id,
          item: formData.itemId,
          quantity: parseInt(formData.quantity),
          price: parseFloat(formData.price),
          lowStockThreshold: parseInt(formData.lowStockThreshold),
          isAvailable: formData.isAvailable,
        });
        alert('Inventory item added successfully!');
      }
      handleCloseDialog();
      await fetchInventory(pharmacy._id);
    } catch (error) {
      console.error('Error saving inventory:', error);
      const errorMsg = error.response?.data?.message || 'Failed to save inventory';
      alert(errorMsg);
    }
  };

  const handleDelete = async (inventoryId) => {
    if (window.confirm('Are you sure you want to delete this inventory item?')) {
      try {
        await inventoryAPI.delete(inventoryId);
        alert('Inventory item deleted successfully!');
        await fetchInventory(pharmacy._id);
      } catch (error) {
        console.error('Error deleting inventory:', error);
        alert('Failed to delete inventory item');
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
    totalProducts: inventoryItems.length,
    ordersThisMonth: orders.filter(o => {
      const orderDate = new Date(o.createdAt);
      const now = new Date();
      return orderDate.getMonth() === now.getMonth() && orderDate.getFullYear() === now.getFullYear();
    }).length,
    lowStockItems: inventoryItems.filter(inv => inv.stockStatus === 'low-stock').length,
    outOfStock: inventoryItems.filter(inv => inv.stockStatus === 'out-of-stock').length,
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

          <Grid item xs={12} md={9.5}>
            <Box sx={{ mb: 4 }}>
              <Typography variant="h4" fontWeight={700} color="secondary" mb={0.5}>
                Dashboard Overview
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Welcome back! Here's what's happening with your pharmacy today.
              </Typography>
            </Box>

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
                  </CardContent>
                </Card>
              </Grid>
            </Grid>

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
                    Add Inventory Item
                  </Button>
                </Box>

                <TextField
                  fullWidth
                  placeholder="Search inventory..."
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

                {filteredInventory.length === 0 ? (
                  <Alert severity="info">No inventory items found. Add your first item!</Alert>
                ) : (
                  <TableContainer>
                    <Table>
                      <TableHead>
                        <TableRow sx={{ bgcolor: '#f8f9fa' }}>
                          <TableCell><strong>Item Name</strong></TableCell>
                          <TableCell><strong>Category</strong></TableCell>
                          <TableCell><strong>Price</strong></TableCell>
                          <TableCell><strong>Quantity</strong></TableCell>
                          <TableCell><strong>Status</strong></TableCell>
                          <TableCell align="center"><strong>Actions</strong></TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {filteredInventory.map((inv) => (
                          <TableRow
                            key={inv._id}
                            sx={{ '&:hover': { bgcolor: '#f8f9fa' } }}
                          >
                            <TableCell><strong>{inv.item?.name || 'Unknown'}</strong></TableCell>
                            <TableCell>{inv.item?.category || 'N/A'}</TableCell>
                            <TableCell>${inv.price?.toFixed(2) || '0.00'}</TableCell>
                            <TableCell>{inv.quantity || 0} units</TableCell>
                            <TableCell>
                              <Chip
                                label={inv.stockStatus === 'in-stock' ? 'In Stock' : inv.stockStatus === 'low-stock' ? 'Low Stock' : 'Out of Stock'}
                                size="small"
                                sx={{ ...getStockStatusColor(inv.stockStatus), fontWeight: 600 }}
                              />
                            </TableCell>
                            <TableCell align="center">
                              <IconButton
                                size="small"
                                onClick={() => handleOpenDialog(inv)}
                                sx={{ bgcolor: '#e3f2fd', color: '#1976d2', mr: 1 }}
                              >
                                <Edit fontSize="small" />
                              </IconButton>
                              <IconButton
                                size="small"
                                onClick={() => handleDelete(inv._id)}
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
                )}
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Container>

      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>
          {selectedInventory ? 'Edit Inventory Item' : 'Add New Inventory Item'}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <FormControl fullWidth required>
                <InputLabel>Select Item</InputLabel>
                <Select
                  value={formData.itemId}
                  onChange={(e) => setFormData({ ...formData, itemId: e.target.value })}
                  label="Select Item"
                  disabled={!!selectedInventory}
                >
                  {allItems.map((item) => (
                    <MenuItem key={item._id} value={item._id}>
                      {item.name} - {item.category}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              {!selectedInventory && allItems.length === 0 && (
                <Alert severity="info" sx={{ mt: 1 }}>
                  No items available. Items must be created first via the medications API.
                </Alert>
              )}
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Price"
                type="number"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                required
                inputProps={{ step: '0.01', min: '0' }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Quantity"
                type="number"
                value={formData.quantity}
                onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                required
                inputProps={{ min: '0' }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Low Stock Threshold"
                type="number"
                value={formData.lowStockThreshold}
                onChange={(e) => setFormData({ ...formData, lowStockThreshold: e.target.value })}
                inputProps={{ min: '0' }}
                helperText="Alert when stock falls below this number"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Availability</InputLabel>
                <Select
                  value={formData.isAvailable}
                  onChange={(e) => setFormData({ ...formData, isAvailable: e.target.value })}
                  label="Availability"
                >
                  <MenuItem value={true}>Available</MenuItem>
                  <MenuItem value={false}>Unavailable</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button
            onClick={handleSubmit}
            variant="contained"
            disabled={!formData.itemId || !formData.price || formData.quantity === ''}
            sx={{
              background: 'linear-gradient(135deg, #4ecdc4 0%, #44a9a3 100%)',
            }}
          >
            {selectedInventory ? 'Update' : 'Add'} Inventory
          </Button>
        </DialogActions>
      </Dialog>

      <Footer />
    </Box>
  );
};

export default PharmacyDashboard;
