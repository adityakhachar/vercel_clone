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

app.post("/api/github", async (req, res) => {
  const { token, username, repository } = req.body;

  // Validate inputs
  if (!token || !username || !repository) {
    console.log("Missing GitHub token, username, or repository in request.");
    return res.status(400).json({ error: "Token, username, and repository are required." });
  }

  try {
    const apiUrl = `https://api.github.com/repos/${username}/${repository}`;
    console.log("GitHub API URL:", apiUrl);

    // GitHub API request to check credentials
    const response = await fetch(apiUrl, {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/vnd.github.v3+json",
      },
    });

    // Log the response status
    console.log("GitHub API response status:", response.status);

    if (response.status === 401) {
      console.log("Invalid GitHub token or access denied.");
      return res.status(401).json({ error: "Invalid GitHub token or access denied." });
    }

    if (!response.ok) {
      console.log(
        `Failed to fetch repository (Status: ${response.status}). Status Text: ${response.statusText}`
      );
      throw new Error(
        `Failed to fetch repository: ${response.statusText} (HTTP ${response.status})`
      );
    }

    const data = await response.json();
    console.log("GitHub API response data:", JSON.stringify(data, null, 2));
    console.log("GitHub credentials validated successfully.");

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
    AWS.config.update({
      accessKeyId,
      secretAccessKey,
      region,
    });

    const s3 = new AWS.S3();
    console.log("Attempting to list S3 buckets with the provided credentials...");

    // Attempt to list S3 buckets
    s3.listBuckets((err, data) => {
      if (err) {
        console.error("AWS S3 listBuckets error:", err.message);
        return res.status(500).json({ error: "AWS Connection Failed.", details: err.message });
      }

      console.log("AWS S3 buckets retrieved:", data.Buckets);
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

app.post("/api/validate-and-deploy", async (req, res) => {
  const { gitUrl, branch, bucketName, accessKeyId, secretAccessKey, region } = req.body;

  // Check if all required fields are present
  if (!gitUrl || !branch || !bucketName || !accessKeyId || !secretAccessKey || !region) {
    return res.status(400).json({ error: "All fields are required." });
  }

  try {
    console.log("Received deployment request with the following parameters:");
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
    console.log("AWS S3 client initialized.");

    // Clone the GitHub repository
    const tempDir = path.join(__dirname, "repo");
    if (fs.existsSync(tempDir)) {
      console.log("Cleaning up existing temporary directory...");
      fs.rmdirSync(tempDir, { recursive: true }); // Clean up existing directory
    }
    fs.mkdirSync(tempDir); // Create fresh directory
    console.log("Temporary directory created:", tempDir);

    const git = simpleGit();
    console.log(`Cloning ${gitUrl} branch ${branch} into ${tempDir}...`);
    await git.clone(gitUrl, tempDir, ["--branch", branch]);

    // Create a .yaml file for GitHub Actions or any CI/CD pipeline
    const yamlFileContent = `
name: Deploy to AWS S3

on:
  push:
    branches:
      - ${branch}

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout repository
        uses: actions/checkout@v2
      - name: Install AWS CLI
        run: sudo apt-get install awscli
      - name: Configure AWS CLI
        run: aws configure set aws_access_key_id ${accessKeyId} && aws configure set aws_secret_access_key ${secretAccessKey} && aws configure set region ${region}
      - name: Deploy to S3
        run: |
          aws s3 sync ./ s3://${bucketName}/ --exact-timestamps --delete
    `;
    const yamlFilePath = path.join(tempDir, ".github", "workflows", "deploy.yaml");

    // Ensure directory structure exists for YAML file
    const dir = path.dirname(yamlFilePath);
    if (!fs.existsSync(dir)) {
      console.log("Creating directory structure for YAML file...");
      fs.mkdirSync(dir, { recursive: true });
    }

    // Write YAML file
    fs.writeFileSync(yamlFilePath, yamlFileContent);
    console.log("YAML file created at:", yamlFilePath);

    // Log files in the repository before git operations
    console.log("Files in repo directory:", fs.readdirSync(tempDir));

    // Commit and push the changes to GitHub
    console.log("Adding files to Git...");
    await git.add("./*");
    console.log("Committing changes...");
    const commitResult = await git.commit("Add GitHub Actions deployment YAML file.");
    console.log("Commit result:", commitResult);
    console.log("Pushing changes to GitHub...");
    await git.push("origin", branch);
    console.log("Changes pushed to GitHub.");

    res.status(200).json({
      message: "GitHub repo cloned, YAML deployed, and changes pushed to GitHub.",
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
