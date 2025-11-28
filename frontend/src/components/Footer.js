import React from 'react';
import { Box, Container, Grid, Typography, Link, IconButton } from '@mui/material';
import {
  Facebook,
  Instagram,
  Twitter,
  LinkedIn,
  Phone,
  Email,
} from '@mui/icons-material';

const Footer = () => {
  return (
    <Box
      component="footer"
      sx={{
        background: 'linear-gradient(135deg, #2f4f4f 0%, #1a3333 100%)',
        color: 'white',
        py: 5,
        px: 3,
        mt: 8,
      }}
    >
      <Container maxWidth="xl">
        <Grid container spacing={4}>
          {/* About Section */}
          <Grid item xs={12} md={4}>
            <Box
              sx={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 1.5,
                mb: 2,
                px: 1,
                py: 0.5,
                bgcolor: 'rgba(255,255,255,0.05)',
                borderRadius: 2,
                boxShadow: '0 6px 12px rgba(0,0,0,0.15)',
              }}
            >
              <Box
                component="img"
                src="/logo.png"
                alt="PharmaMap"
                sx={{ width: 56, height: 56, objectFit: 'contain' }}
                onError={(e) => {
                  e.target.style.display = 'none';
                }}
              />
            </Box>
            <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.8)', lineHeight: 1.8 }}>
              Your trusted platform for finding medications across Lebanon. We connect you with
              verified pharmacies to ensure you get what you need, when you need it.
            </Typography>
          </Grid>

          {/* Contact Section */}
          <Grid item xs={12} md={4}>
            <Typography variant="h6" sx={{ mb: 2, color: '#4ecdc4', fontWeight: 700 }}>
              Contact Us
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
              <Phone sx={{ mr: 1, fontSize: 18 }} />
              <Link
                href="tel:+96181234444"
                sx={{ color: '#4ecdc4', textDecoration: 'none', '&:hover': { color: '#6ee7df' } }}
              >
                +961 81 234 444
              </Link>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <Email sx={{ mr: 1, fontSize: 18 }} />
              <Link
                href="mailto:info@pharmamap.com"
                sx={{ color: '#4ecdc4', textDecoration: 'none', '&:hover': { color: '#6ee7df' } }}
              >
                info@pharmamap.com
              </Link>
            </Box>
          </Grid>

          {/* Social Media Section */}
          <Grid item xs={12} md={4}>
            <Typography variant="h6" sx={{ mb: 2, color: '#4ecdc4', fontWeight: 700 }}>
              Follow Us
            </Typography>
            <Box sx={{ display: 'flex', gap: 1.5 }}>
              <IconButton
                component="a"
                href="https://www.facebook.com"
                target="_blank"
                sx={{
                  bgcolor: 'rgba(255,255,255,0.1)',
                  color: 'white',
                  '&:hover': {
                    bgcolor: '#4ecdc4',
                    transform: 'translateY(-3px)',
                  },
                  transition: 'all 0.3s',
                }}
              >
                <Facebook />
              </IconButton>
              <IconButton
                component="a"
                href="https://www.instagram.com"
                target="_blank"
                sx={{
                  bgcolor: 'rgba(255,255,255,0.1)',
                  color: 'white',
                  '&:hover': {
                    bgcolor: '#4ecdc4',
                    transform: 'translateY(-3px)',
                  },
                  transition: 'all 0.3s',
                }}
              >
                <Instagram />
              </IconButton>
              <IconButton
                component="a"
                href="https://twitter.com"
                target="_blank"
                sx={{
                  bgcolor: 'rgba(255,255,255,0.1)',
                  color: 'white',
                  '&:hover': {
                    bgcolor: '#4ecdc4',
                    transform: 'translateY(-3px)',
                  },
                  transition: 'all 0.3s',
                }}
              >
                <Twitter />
              </IconButton>
              <IconButton
                component="a"
                href="https://www.linkedin.com"
                target="_blank"
                sx={{
                  bgcolor: 'rgba(255,255,255,0.1)',
                  color: 'white',
                  '&:hover': {
                    bgcolor: '#4ecdc4',
                    transform: 'translateY(-3px)',
                  },
                  transition: 'all 0.3s',
                }}
              >
                <LinkedIn />
              </IconButton>
            </Box>
          </Grid>
        </Grid>

        {/* Copyright */}
        <Box
          sx={{
            mt: 4,
            pt: 3,
            borderTop: '1px solid rgba(255,255,255,0.1)',
            textAlign: 'center',
          }}
        >
          <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.6)' }}>
            &copy; 2025 PharmaMap. All rights reserved. | Developed by Michel Geha & Edmond Cham
          </Typography>
        </Box>
      </Container>
    </Box>
  );
};

export default Footer;


