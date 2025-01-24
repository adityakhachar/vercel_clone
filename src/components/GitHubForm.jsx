import React, { useState } from "react";
import { Navigate } from "react-router-dom";
import { Box, TextField, Button, Typography, Grid, Paper } from "@mui/material";

const GitHubForm = () => {
  const [formData, setFormData] = useState({
    token: "",
    username: "",
    repository: "",
  });
  const [redirectToAWSForm, setRedirectToAWSForm] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    console.log("Form Data Submitted:", formData);

    const apiUrl = "http://localhost:5000/api/github";

    fetch(apiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(formData),
    })
      .then((response) => response.json())
      .then((data) => {
        console.log("Response data:", data); // Debug the server response here.
        if (data.success) {
          alert("GitHub repository verified successfully!");
          setRedirectToAWSForm(true);
        } else {
          alert(data.message || "GitHub repository verification failed.");
        }
      })
      .catch((error) => {
        console.error("Error occurred:", error);
        alert("An error occurred while verifying the repository. Please try again.");
      });
  };

  if (redirectToAWSForm) {
    return <Navigate to="/awsform" />;
  }

  return (
    <Box
      sx={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        height: "100vh",
        bgcolor: "#f5f5f5",
      }}
    >
      <Paper
        elevation={3}
        sx={{
          padding: 4,
          borderRadius: 2,
          maxWidth: 400,
          width: "100%",
        }}
      >
        <Typography
          variant="h5"
          align="center"
          sx={{ mb: 3, fontWeight: "bold", color: "#1976d2" }}
        >
          GitHub Repository Checker
        </Typography>
        <form onSubmit={handleSubmit}>
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="GitHub Token"
                variant="outlined"
                name="token"
                value={formData.token}
                onChange={handleChange}
                required
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="GitHub Username"
                variant="outlined"
                name="username"
                value={formData.username}
                onChange={handleChange}
                required
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Repository Name"
                variant="outlined"
                name="repository"
                value={formData.repository}
                onChange={handleChange}
                required
              />
            </Grid>
            <Grid item xs={12}>
              <Button
                fullWidth
                type="submit"
                variant="contained"
                sx={{ bgcolor: "#1976d2", color: "#fff", fontWeight: "bold" }}
              >
                Check Repository
              </Button>
            </Grid>
          </Grid>
        </form>
      </Paper>
    </Box>
  );
};

export default GitHubForm;
