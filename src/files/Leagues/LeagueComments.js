import React, { useState } from "react";
import { Box, Button, TextField, Typography, Avatar, Paper } from "@mui/material";
import { styled } from "@mui/material/styles";

const CommentBox = styled(Paper)(({ theme }) => ({
  marginBottom: theme.spacing(2),
  padding: theme.spacing(2.5, 2),
  borderRadius: 12,
  background: 'linear-gradient(135deg, #fff 80%, #f3e6fa 100%)',
  boxShadow: '0 2px 8px rgba(123,104,238,0.07)',
  border: '1px solid #f0e6fa',
  display: 'flex',
  gap: theme.spacing(2),
  alignItems: 'flex-start',
}));

const Name = styled(Typography)(({ theme }) => ({
  fontWeight: 700,
  color: theme.palette.primary.main,
  fontSize: 15,
  marginRight: theme.spacing(1),
  display: 'inline',
}));

const DateText = styled('span')(({ theme }) => ({
  color: theme.palette.text.secondary,
  fontSize: 12,
  marginLeft: theme.spacing(0.5),
}));

const CommentText = styled(Typography)(({ theme }) => ({
  fontSize: 16,
  color: theme.palette.text.primary,
  marginTop: theme.spacing(0.5),
  whiteSpace: 'pre-line',
}));

export default function LeagueComments({ comments, onSubmit, isPlayer }) {
  const [comment, setComment] = useState("");
  const handleSubmit = (e) => {
    e.preventDefault();
    if (comment.trim()) {
      onSubmit(comment);
      setComment("");
      // Reload page after short delay to ensure backend update
      setTimeout(() => window.location.reload(), 400);
    }
  };
  return (
    <Box sx={{ mt: 4, mb: 2, maxWidth: 700, mx: 'auto' }}>
      <Typography variant="h6" sx={{ mb: 2, fontWeight: 700, color: 'primary.main', letterSpacing: 0.5 }}>
        Comments
      </Typography>
      {isPlayer && (
        <form onSubmit={handleSubmit} style={{ display: "flex", gap: 12, marginBottom: 24, alignItems: "flex-start" }}>
          <TextField
            value={comment}
            onChange={e => setComment(e.target.value)}
            placeholder="Leave a comment..."
            size="small"
            fullWidth
            multiline
            minRows={3}
            maxRows={8}
            sx={{
              background: '#fff',
              borderRadius: 2,
              boxShadow: '0 1px 4px rgba(123,104,238,0.04)',
              border: '1px solid #e0e0e0',
            }}
          />
          <Button type="submit" variant="contained" disabled={!comment} sx={{ height: 40, alignSelf: "flex-start", fontWeight: 700, borderRadius: 2 }}>
            Submit
          </Button>
        </form>
      )}
      <Box>
        {comments.length === 0 && (
          <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', mt: 2 }}>
            No comments yet.
          </Typography>
        )}
        {comments.map((c, i) => {
          // Remove seconds from time (e.g., 1/12/2026, 3:45:12 PM -> 1/12/2026, 3:45 PM)
          let dateDisplay = c.date;
          if (typeof dateDisplay === 'string') {
            dateDisplay = dateDisplay.replace(/:(\d{2})(?=\s*[AP]M)/, '');
          }
          return (
            <CommentBox key={i} elevation={0}>
              <Avatar sx={{ bgcolor: '#7B68EE', width: 36, height: 36, fontWeight: 700, fontSize: 18 }}>
                {c.playerName?.[0]?.toUpperCase() || '?'}
              </Avatar>
              <Box sx={{ flex: 1 }}>
                <Name component="span">{c.playerName}</Name>
                <DateText>({dateDisplay})</DateText>
                <CommentText>{c.comment}</CommentText>
              </Box>
            </CommentBox>
          );
        })}
      </Box>
    </Box>
  );
}
