import React from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Rating,
  TextField,
  Box,
  Typography,
} from "@mui/material";

const ReviewDialog = ({
  open,
  onClose,
  onSubmit,
  rating,
  comment,
  onRatingChange,
  onCommentChange,
}) => {
  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Write a Review</DialogTitle>
      <DialogContent>
        <Box sx={{ display: "flex", flexDirection: "column", gap: 2, mt: 1 }}>
          <Box>
            <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 0.5 }}>
              Your Rating
            </Typography>
            <Rating
              value={rating}
              onChange={(_, value) => onRatingChange(value)}
              precision={1}
              size="large"
            />
          </Box>
          <TextField
            label="Comment"
            multiline
            minRows={3}
            value={comment}
            onChange={(e) => onCommentChange?.(e.target.value)}
            placeholder="Share your experience..."
            fullWidth
          />
        </Box>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button
          onClick={onClose}
          sx={{ textTransform: "none", fontWeight: 600 }}
        >
          Cancel
        </Button>
        <Button
          variant="contained"
          onClick={() => onSubmit(rating, comment)}
          disabled={!rating}
          sx={{
            minWidth: 120,
            borderRadius: 999,
            px: 3,
            py: 1,
            backgroundColor: "#4ecdc4",
            color: "#ffffff",
            textTransform: "none",
            fontWeight: 700,
            "&:hover": { backgroundColor: "#3bb5ac" },
          }}
        >
          Submit
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ReviewDialog;
