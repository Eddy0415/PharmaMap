import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
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
} from '@mui/material';
import {
  Search as SearchIcon,
  AccountCircle,
  Person,
  PersonAdd,
  Dashboard as DashboardIcon,
  Logout,
} from '@mui/icons-material';

const Header = ({ user, onLogout }) => {
  const navigate = useNavigate();
  const [anchorEl, setAnchorEl] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  const handleMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery)}`);
    }
  };

  const handleLogout = () => {
    handleMenuClose();
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    if (onLogout) onLogout();
    navigate('/');
  };

  return (
    <AppBar 
      component="header"
      position="sticky" 
      sx={{ 
        background: 'linear-gradient(135deg, #2f4f4f 0%, #1a3333 100%)',
        boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
      }}
    >
      <Container maxWidth="xl">
        <Toolbar component="nav" sx={{ py: 1 }}>
          {/* Logo */}
          <Box 
            component="a"
            href="/"
            onClick={(e) => { e.preventDefault(); navigate('/'); }}
            aria-label="PharmaMap Home"
            sx={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: 1.5, 
              cursor: 'pointer',
              mr: 4,
              textDecoration: 'none'
            }}
          >
            <Box
              sx={{
                width: 50,
                height: 50,
                borderRadius: '12px',
                bgcolor: 'white',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 4px 8px rgba(0,0,0,0.2)'
              }}
            >
              <Box
                component="img"
                src="/logo.png"
                alt="PharmaMap"
                sx={{ width: 40, height: 40 }}
                onError={(e) => {
                  e.target.style.display = 'none';
                  e.target.parentElement.innerHTML = '<span style="font-size: 24px; font-weight: bold; color: #4ecdc4;">PM</span>';
                }}
              />
            </Box>
            <Box
              sx={{
                fontSize: 22,
                fontWeight: 700,
                color: 'white',
                letterSpacing: 0.5
              }}
            >
              PharmaMap
            </Box>
          </Box>

          {/* Search Bar */}
          <Box 
            component="form" 
            onSubmit={handleSearch}
            role="search"
            aria-label="Search medications and pharmacies"
            sx={{ flexGrow: 1, maxWidth: 600, mx: 3 }}
          >
            <TextField
              fullWidth
              size="small"
              placeholder="Search for medications, pharmacies..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              inputProps={{ 'aria-label': 'Search' }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon sx={{ color: '#4ecdc4' }} />
                  </InputAdornment>
                ),
                sx: {
                  bgcolor: 'white',
                  borderRadius: '25px',
                  '& fieldset': { border: 'none' },
                  '&:hover': {
                    boxShadow: '0 4px 16px rgba(78, 205, 196, 0.3)'
                  }
                }
              }}
            />
          </Box>

          {/* User Menu */}
          {user ? (
            <Box>
              <IconButton
                onClick={handleMenuOpen}
                sx={{ 
                  color: 'white',
                  '&:hover': { bgcolor: 'rgba(255,255,255,0.1)' }
                }}
              >
                <Avatar 
                  sx={{ 
                    bgcolor: '#4ecdc4',
                    width: 40,
                    height: 40
                  }}
                >
                  {user.firstName?.[0]}{user.lastName?.[0]}
                </Avatar>
              </IconButton>
              <Menu
                anchorEl={anchorEl}
                open={Boolean(anchorEl)}
                onClose={handleMenuClose}
                PaperProps={{
                  sx: {
                    mt: 1.5,
                    borderRadius: 3,
                    minWidth: 180
                  }
                }}
              >
                {user.accountType === 'pharmacy' ? (
                  <MenuItem onClick={() => { handleMenuClose(); navigate('/dashboard'); }}>
                    <DashboardIcon sx={{ mr: 1 }} /> Dashboard
                  </MenuItem>
                ) : (
                  <MenuItem onClick={() => { handleMenuClose(); navigate('/profile'); }}>
                    <Person sx={{ mr: 1 }} /> My Profile
                  </MenuItem>
                )}
                <MenuItem onClick={handleLogout}>
                  <Logout sx={{ mr: 1 }} /> Logout
                </MenuItem>
              </Menu>
            </Box>
          ) : (
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button
                variant="outlined"
                startIcon={<Person />}
                onClick={() => navigate('/login')}
                sx={{
                  color: 'white',
                  borderColor: 'rgba(255,255,255,0.3)',
                  borderRadius: '25px',
                  '&:hover': {
                    borderColor: 'rgba(255,255,255,0.5)',
                    bgcolor: 'rgba(255,255,255,0.1)'
                  }
                }}
              >
                Login
              </Button>
              <Button
                variant="outlined"
                startIcon={<PersonAdd />}
                onClick={() => navigate('/register')}
                sx={{
                  color: 'white',
                  borderColor: 'rgba(255,255,255,0.3)',
                  borderRadius: '25px',
                  '&:hover': {
                    borderColor: 'rgba(255,255,255,0.5)',
                    bgcolor: 'rgba(255,255,255,0.1)'
                  }
                }}
              >
                Register
              </Button>
            </Box>
          )}
        </Toolbar>
      </Container>
    </AppBar>
  );
};

export default Header;

