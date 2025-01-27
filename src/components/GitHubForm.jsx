import React, { useState } from "react";
import { Navigate } from "react-router-dom";
import { Box, TextField, Button, Typography, Grid, Paper } from "@mui/material";

// Helper function to store data in local storage
const setTempStorage = (key, value) => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    console.log(`Data stored in localStorage: ${key} =`, value);
  } catch (error) {
    console.error("Error storing data in localStorage", error);
  }
};

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
    console.log(`Input changed: ${name} = ${value}`);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log("Form submitted with data:", formData);
    setIsLoading(true);
    setErrorMessage("");

    try {
      console.log("Sending API request...");
      const response = await fetch("http://localhost:5000/api/github", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      console.log("Response received:", response);
      const data = await response.json();
      console.log("Response JSON:", data);

      if (response.ok) {
        console.log("Repository verification successful.");

        // Store GitHub data in local storage
        setTempStorage("githubData", formData);

        alert("GitHub repository verified successfully!");
        setRedirectToAWSForm(true);
      } else {
        console.error("Verification failed with message:", data.message);
        setErrorMessage(data.message || "GitHub repository verification failed.");
      }
    } catch (error) {
      console.error("Error occurred:", error);
      setErrorMessage("An error occurred while verifying the repository.");
    } finally {
      console.log("Request completed.");
      setIsLoading(false);
    }
  };

  if (redirectToAWSForm) {
    console.log("Redirecting to AWS form...");
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
