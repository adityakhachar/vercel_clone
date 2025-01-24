import React, { useState } from "react";
import AWS from "aws-sdk";
import { TextField, Button, Box, Typography } from "@mui/material";

const BucketSetup = () => {
  const [awsAccessKeyId, setAwsAccessKeyId] = useState("");
  const [awsSecretAccessKey, setAwsSecretAccessKey] = useState("");
  const [bucketName, setBucketName] = useState("");
  const [region, setRegion] = useState("us-east-1"); // Default region
  const [feedback, setFeedback] = useState("");

  const handleSetup = async (e) => {
    e.preventDefault();

    if (!awsAccessKeyId || !awsSecretAccessKey || !bucketName) {
      setFeedback("All fields are required!");
      return;
    }

    // Configure AWS credentials
    AWS.config.update({
      accessKeyId: awsAccessKeyId,
      secretAccessKey: awsSecretAccessKey,
      region: region,
    });

    const s3 = new AWS.S3();

    try {
      // Create the bucket
      const params = { Bucket: bucketName };
      await s3.createBucket(params).promise();
      setFeedback(`Bucket "${bucketName}" created successfully!`);
    } catch (err) {
      console.error("Error creating bucket:", err);
      setFeedback(
        `Error creating bucket: ${err.message}. Please verify your credentials and permissions.`
      );
    }
  };

  return (
    <Box sx={{ p: 3, maxWidth: "500px", margin: "auto", textAlign: "center" }}>
      <Typography variant="h4" gutterBottom>
        AWS S3 Bucket Setup
      </Typography>

      <form onSubmit={handleSetup}>
        <TextField
          label="AWS Access Key ID"
          fullWidth
          margin="normal"
          value={awsAccessKeyId}
          onChange={(e) => setAwsAccessKeyId(e.target.value)}
          required
        />
        <TextField
          label="AWS Secret Access Key"
          type="password"
          fullWidth
          margin="normal"
          value={awsSecretAccessKey}
          onChange={(e) => setAwsSecretAccessKey(e.target.value)}
          required
        />
        <TextField
          label="Bucket Name"
          fullWidth
          margin="normal"
          value={bucketName}
          onChange={(e) => setBucketName(e.target.value)}
          required
        />
        <TextField
          label="Region"
          fullWidth
          margin="normal"
          value={region}
          onChange={(e) => setRegion(e.target.value)}
          helperText="Default: us-east-1"
        />
        <Button variant="contained" color="primary" type="submit" fullWidth sx={{ mt: 2 }}>
          Create Bucket
        </Button>
      </form>

      {feedback && (
        <Typography variant="subtitle1" color="secondary" sx={{ mt: 2 }}>
          {feedback}
        </Typography>
      )}
    </Box>
  );
};

export default BucketSetup;
