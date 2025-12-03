import React, { useState, useEffect } from "react";
import { Card, CardContent, Box, Typography, IconButton } from "@mui/material";
import LocalPharmacy from "@mui/icons-material/LocalPharmacy";
import Favorite from "@mui/icons-material/Favorite";
import FavoriteBorder from "@mui/icons-material/FavoriteBorder";
import TrendingUp from "@mui/icons-material/TrendingUp";

const CardItem = ({ 
  item, 
  onClick, 
  onFavoriteToggle, 
  isFavorite: initialIsFavorite, 
  showFavorite = true,
  extraContent = null,
  sx = {}
}) => {
  const [isFavorite, setIsFavorite] = useState(initialIsFavorite || false);

  useEffect(() => {
    setIsFavorite(initialIsFavorite || false);
  }, [initialIsFavorite]);

  const handleFavoriteClick = (e) => {
    e.stopPropagation();
    const newFavoriteState = !isFavorite;
    setIsFavorite(newFavoriteState);
    if (onFavoriteToggle) {
      onFavoriteToggle(item, newFavoriteState);
    }
  };

  const itemName = item?.name || item?.item?.name || "Unknown";
  const itemCategory = item?.category || item?.item?.category || "General";
  const itemImageUrl = item?.imageUrl || item?.item?.imageUrl;
  
  // Get search count (prioritize currentMonthSearchCount, then searchCount)
  const monthlyCount = item?.currentMonthSearchCount !== undefined 
    ? item.currentMonthSearchCount 
    : item?.item?.currentMonthSearchCount !== undefined
    ? item.item.currentMonthSearchCount
    : item?.searchCount !== undefined
    ? item.searchCount
    : item?.item?.searchCount !== undefined
    ? item.item.searchCount
    : null;
  
  // Format search count
  const formatted = monthlyCount !== null && monthlyCount !== undefined
    ? monthlyCount >= 1000
      ? `+${(monthlyCount / 1000).toFixed(monthlyCount % 1000 === 0 ? 0 : 1)}k`
      : `+${monthlyCount}`
    : null;

  return (
    <Card
      sx={{
        height: 280,
        cursor: "pointer",
        border: "2px solid transparent",
        transition: "0.3s",
        display: "flex",
        flexDirection: "column",
        position: "relative",
        "&:hover": {
          transform: "translateY(-5px)",
          boxShadow: "0 8px 24px rgba(0,0,0,0.12)",
          borderColor: "primary.main",
        },
        ...sx,
      }}
      onClick={onClick}
    >
      {showFavorite && (
        <IconButton
          size="small"
          onClick={handleFavoriteClick}
          sx={{
            position: "absolute",
            top: 8,
            right: 8,
            zIndex: 1,
            bgcolor: "rgba(255, 255, 255, 0.9)",
            color: isFavorite ? "error.main" : "text.secondary",
            "&:hover": {
              bgcolor: isFavorite ? "error.main" : "rgba(244, 67, 54, 0.1)",
              color: isFavorite ? "white" : "error.main",
            },
            transition: "all 0.3s",
          }}
        >
          {isFavorite ? <Favorite fontSize="small" /> : <FavoriteBorder fontSize="small" />}
        </IconButton>
      )}
      <Box
        sx={{
          height: 150,
          background: itemImageUrl
            ? "transparent"
            : "linear-gradient(135deg, #e0f7fa 0%, #b2ebf2 100%)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          overflow: "hidden",
          position: "relative",
        }}
      >
        {itemImageUrl ? (
          <img
            src={itemImageUrl}
            alt={itemName}
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
            }}
            onError={(e) => {
              // Fallback to icon if image fails to load
              e.target.style.display = "none";
              e.target.nextSibling.style.display = "flex";
            }}
          />
        ) : null}
        <Box
          sx={{
            display: itemImageUrl ? "none" : "flex",
            alignItems: "center",
            justifyContent: "center",
            width: "100%",
            height: "100%",
          }}
        >
          <LocalPharmacy sx={{ fontSize: 64, color: "primary.main" }} />
        </Box>
      </Box>

      <CardContent sx={{ display: "flex", flexDirection: "column" }}>
        <Typography variant="h6" fontWeight={600} color="secondary" mb={1}>
          {itemName}
        </Typography>

        <Typography
          variant="body2"
          color="text.secondary"
          display="flex"
          gap={0.5}
        >
          <LocalPharmacy fontSize="small" sx={{ color: "primary.main" }} />
          {itemCategory}
        </Typography>

        {formatted && (
          <Typography
            variant="body2"
            color="primary.main"
            fontWeight={600}
            display="flex"
            alignItems="center"
            gap={0.5}
            sx={{ mt: 1 }}
          >
            <TrendingUp fontSize="small" />
            {formatted} searches last month
          </Typography>
        )}

        {extraContent && (
          <Box sx={{ mt: 1 }}>
            {extraContent}
          </Box>
        )}
      </CardContent>
    </Card>
  );
};

export default CardItem;

