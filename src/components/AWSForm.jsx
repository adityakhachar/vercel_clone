import React, { useState, useEffect } from "react";
import { Box, TextField, Button, Typography, Grid, Paper } from "@mui/material";
const getTempStorage = (key) => {
  try {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : null;
  } catch (error) {
    console.error("Error reading from localStorage", error);
    return null;
  }
};
const AWSForm = () => {
  const [formData, setFormData] = useState({
    accessKeyId: "",
    secretAccessKey: "",
    region: "",
    gitUrl: "",
    branch: "",
    bucketName: "",
  });

  const githubData = getTempStorage("githubData");

  useEffect(() => {
    if (githubData) {
      setFormData((prevData) => ({
        ...prevData,
        gitUrl: `https://github.com/${githubData.username}/${githubData.repository}`,
        branch: "main",
      }));
    }
  }, [githubData]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log("Deploy Form Data Submitted:", formData);

    const apiUrl = "http://localhost:5000/api/validate-and-deploy";
  
    // POST request to the backend API
    fetch(apiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(formData),
    })
      .then((response) => response.json())
      .then((data) => {
        console.log("Response from server:", data);
  
        if (data.githubData && data.githubData.token) {
          // Safe destructuring
          const { token, username, repository } = data.githubData;
          alert("AWS and GitHub credentials validated, and data ready for deployment.");
  
          // Proceed with deployment logic here
        } else {
          alert("Error: Missing or invalid GitHub credentials.");
        }
        
        if (data.awsData) {
          alert("AWS Credentials Validated Successfully!");
          // Handle further navigation here, if needed.
        } else if (data.error) {
          alert(`Error: ${data.error}`);
        }
      })
      .catch((error) => {
        console.error("Error occurred:", error);
      });
  };

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
          AWS Deployment Form
        </Typography>
        <form onSubmit={handleSubmit}>
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Git URL"
                variant="outlined"
                name="gitUrl"
                value={formData.gitUrl}
                onChange={handleChange}
                required
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Branch"
                variant="outlined"
                name="branch"
                value={formData.branch}
                onChange={handleChange}
                required
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Bucket Name"
                variant="outlined"
                name="bucketName"
                value={formData.bucketName}
                onChange={handleChange}
                required
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Access Key ID"
                variant="outlined"
                name="accessKeyId"
                value={formData.accessKeyId}
                onChange={handleChange}
                required
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Secret Access Key"
                variant="outlined"
                name="secretAccessKey"
                type="password"
                value={formData.secretAccessKey}
                onChange={handleChange}
                required
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Region"
                variant="outlined"
                name="region"
                value={formData.region}
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
                Deploy to AWS
              </Button>
            </Grid>
          </Grid>
        </form>
      </Paper>
    </Box>
  );
};

export default AWSForm;
