import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';

// Pages
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Search from './pages/Search';
import PharmacyDetail from './pages/PharmacyDetail';
import UserProfile from './pages/UserProfile';
import PharmacyDashboard from './pages/PharmacyDashboard';
import CustomerHome from './pages/CustomerHome';
import About from './pages/About';

// Create theme
const theme = createTheme({
  palette: {
    primary: {
      main: '#4ecdc4',
      dark: '#44a9a3',
      light: '#6ee7df',
    },
    secondary: {
      main: '#2f4f4f',
      dark: '#1a3333',
    },
    background: {
      default: '#f5f5f5',
    },
  },
  typography: {
    fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
  },
  shape: {
    borderRadius: 12,
  },
});

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Router>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/search" element={<Search />} />
          <Route path="/pharmacy/:id" element={<PharmacyDetail />} />
          <Route path="/profile" element={<UserProfile />} />
          <Route path="/dashboard" element={<PharmacyDashboard />} />
          <Route path="/customer-home" element={<CustomerHome />} />
          <Route path="/about" element={<About />} />
        </Routes>
      </Router>
    </ThemeProvider>
  );
}

export default App;
