import React, { useState } from "react";
import { Navigate } from "react-router-dom";
import { Box, TextField, Button, Typography, Grid, Paper } from "@mui/material";
import { setTempStorage } from "./tempStorage";

const GitHubForm = () => {
  const [formData, setFormData] = useState({
    token: "",
    username: "",
    repository: "",
  });
  const [redirectToAWSForm, setRedirectToAWSForm] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prevData) => ({ ...prevData, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage("");

    try {
      const response = await fetch("http://localhost:5000/api/github", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();
      if (response.ok) {
        setTempStorage("githubData", formData);
        alert("GitHub repository verified successfully!");
        setRedirectToAWSForm(true);
      } else {
        setErrorMessage(data.message || "GitHub repository verification failed.");
      }
    } catch (error) {
      console.error("Error occurred:", error);
      setErrorMessage("An error occurred while verifying the repository.");
    } finally {
      setIsLoading(false);
    }
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
        <Typography variant="h5" align="center" sx={{ mb: 3, fontWeight: "bold", color: "#1976d2" }}>
          GitHub Repository Checker
        </Typography>
        <form onSubmit={handleSubmit}>
          <Grid container spacing={2}>
            {["token", "username", "repository"].map((field) => (
              <Grid item xs={12} key={field}>
                <TextField
                  fullWidth
                  label={
                    field === "token"
                      ? "GitHub Token"
                      : field === "username"
                      ? "GitHub Username"
                      : "Repository Name"
                  }
                  variant="outlined"
                  name={field}
                  value={formData[field]}
                  onChange={handleChange}
                  required
                />
              </Grid>
            ))}
            {errorMessage && (
              <Grid item xs={12}>
                <Typography variant="body2" color="error" align="center">
                  {errorMessage}
                </Typography>
              </Grid>
            )}
            <Grid item xs={12}>
              <Button
                fullWidth
                type="submit"
                variant="contained"
                sx={{ bgcolor: "#1976d2", color: "#fff", fontWeight: "bold" }}
                disabled={isLoading}
              >
                {isLoading ? "Checking..." : "Check Repository"}
              </Button>
            </Grid>
          </Grid>
        </form>
      </Paper>
    </Box>
  );
};

export default GitHubForm;
