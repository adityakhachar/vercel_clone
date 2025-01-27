import express from "express";
import cors from "cors";
import fetch from "node-fetch";
import dotenv from "dotenv";
import AWS from "aws-sdk";
import simpleGit from "simple-git"; // To interact with Git repositories
import fs from "fs"; // For file operations
import path from "path";
import mime from "mime-types";
import { fileURLToPath } from "url";
import { dirname } from "path";

// Define __filename and __dirname for ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config();

const app = express();

// Enable CORS and handle JSON body parsing
app.use(cors());
app.use(express.json());

// --- GitHub API endpoint ---
app.post("/api/github", async (req, res) => {
  const { token, username, repository } = req.body;

  // Validate inputs
  if (!token || !username || !repository) {
    return res.status(400).json({ error: "Token, username, and repository are required." });
  }

  try {
    // Debug: Log the provided GitHub credentials (excluding token)
    console.log("GitHub credentials received:");
    console.log(`Username: ${username}`);
    console.log(`Repository: ${repository}`);
    console.log(`Token: ${token ? "Provided" : "Not Provided"}`);

    const apiUrl = `https://api.github.com/repos/${username}/${repository}`;
    
    // GitHub API request to check if the credentials are valid
    const response = await fetch(apiUrl, {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/vnd.github.v3+json",
      },
    });

    if (response.status === 401) {
      return res.status(401).json({ error: "Invalid GitHub token or access denied." });
    }

    if (!response.ok) {
      throw new Error(`Failed to fetch repository: ${response.statusText} (HTTP ${response.status})`);
    }

    const data = await response.json();
    res.status(200).json({
      message: "GitHub connection validated successfully.",
      repositoryData: data,
    });
  } catch (error) {
    console.error("Error during GitHub API request:", error.message);
    res.status(500).json({ error: error.message });
  }
});

// --- AWS Credentials Validation Endpoint ---
app.post("/api/aws", async (req, res) => {
  const { accessKeyId, secretAccessKey, region } = req.body;

  // Validate the required fields
  if (!accessKeyId || !secretAccessKey || !region) {
    return res.status(400).json({ error: "Access Key, Secret Key, and Region are required." });
  }

  try {
    // Debug: Log AWS credentials (except secretAccessKey)
    console.log("AWS credentials received:");
    console.log(`Access Key: ${accessKeyId}`);
    console.log(`Region: ${region}`);

    AWS.config.update({
      accessKeyId,
      secretAccessKey,
      region,
    });

    const s3 = new AWS.S3();

    // Attempt to list S3 buckets
    s3.listBuckets((err, data) => {
      if (err) {
        return res.status(500).json({ error: "AWS Connection Failed.", details: err.message });
      }

      res.status(200).json({
        message: "AWS credentials validated successfully.",
        buckets: data.Buckets,
      });
    });
  } catch (error) {
    console.error("Error during AWS credentials validation:", error.message);
    res.status(500).json({ error: error.message });
  }
});

// --- API Endpoint to Validate Credentials, Clone Repo, and Deploy ---
app.post("/api/validate-and-deploy", async (req, res) => {
  const { gitUrl, branch, bucketName, accessKeyId, secretAccessKey, region } = req.body;

  // Check if all required fields are present
  if (!gitUrl || !branch || !bucketName || !accessKeyId || !secretAccessKey || !region) {
    return res.status(400).json({ error: "All fields are required." });
  }

  try {
    // Debug: Log both AWS and GitHub Credentials
    console.log("Deployment credentials received:");
    console.log(`GitHub URL: ${gitUrl}`);
    console.log(`Branch: ${branch}`);
    console.log(`Bucket Name: ${bucketName}`);
    console.log(`AWS Access Key: ${accessKeyId}`);
    console.log(`AWS Region: ${region}`);

    // Validate AWS credentials
    AWS.config.update({
      accessKeyId,
      secretAccessKey,
      region,
    });

    const s3 = new AWS.S3();

    // Create a directory to clone the GitHub repo into
    const tempDir = path.join(__dirname, "repo");
    if (fs.existsSync(tempDir)) {
      fs.rmdirSync(tempDir, { recursive: true }); // Clean up existing directory
    }
    fs.mkdirSync(tempDir); // Create fresh directory

    // Clone the GitHub repository using simple-git
    const git = simpleGit();
    console.log(`Cloning ${gitUrl} branch ${branch} into ${tempDir}...`);
    await git.clone(gitUrl, tempDir, ["--branch", branch]);

    // Upload files from the cloned repository to S3
    const files = fs.readdirSync(tempDir);
    for (let file of files) {
      const filePath = path.join(tempDir, file);

      // Check if it's a file or directory
      const stats = fs.statSync(filePath);
      if (stats.isDirectory()) {
        // Skip directories
        continue;
      }

      const fileStream = fs.createReadStream(filePath);
      const fileMimeType = mime.lookup(filePath) || "application/octet-stream";

      const params = {
        Bucket: bucketName,
        Key: file,
        Body: fileStream,
        ContentType: fileMimeType,
      };

      await s3.upload(params).promise();
      console.log(`Uploaded ${file} to S3`);
    }

    // Clean up the cloned repository directory after the upload
    fs.rmdirSync(tempDir, { recursive: true });

    res.status(200).json({
      message: "GitHub repo cloned and deployed to AWS S3 successfully!",
    });
  } catch (error) {
    console.error("Error during deployment:", error.message);
    res.status(500).json({ error: error.message });
  }
});

// Start the server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
