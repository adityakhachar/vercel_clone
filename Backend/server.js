import express from "express";
import cors from "cors";
import fetch from "node-fetch";
import dotenv from "dotenv";
import AWS from "aws-sdk";
import simpleGit from "simple-git";  // To interact with Git repositories
import fs from "fs";  // For file operations
import path from "path";
import mime from "mime-types";

dotenv.config();

const app = express();

// Enable CORS and handle JSON body parsing
app.use(cors());
app.use(express.json());

// GitHub API Endpoint
app.post("/api/github", async (req, res) => {
  const { token, username, repository } = req.body;

  if (!token || !username || !repository) {
    return res.status(400).json({ error: "Token, username, and repository are required." });
  }

  try {
    const apiUrl = `https://api.github.com/repos/${username}/${repository}`;
    
    const response = await fetch(apiUrl, {
      headers: {
        Authorization: `Bearer ${token}`,
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
    res.status(500).json({ error: error.message });
  }
});

// AWS Credentials Validation Endpoint
app.post("/api/aws", async (req, res) => {
  const { accessKeyId, secretAccessKey, region } = req.body;

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
    res.status(500).json({ error: error.message });
  }
});

app.post("/api/validate-and-deploy", async (req, res) => {
  const { gitUrl, branch, bucketName } = req.body;

  if (!gitUrl || !bucketName) {
    return res.status(400).json({ success: false, message: "Missing required fields." });
  }

  try {
    // Step 1: Clone or Pull the GitHub repository
    const repoFolder = "./repo"; // Temporary directory for repo
    const git = simpleGit();

    if (fs.existsSync(repoFolder)) {
      // If repo exists, pull the latest code
      await git.cwd(repoFolder).pull();
    } else {
      // Clone the repository if it doesn't exist
      await git.clone(gitUrl, repoFolder);
    }

    // Checkout the desired branch
    await git.cwd(repoFolder).checkout(branch);

    // Step 2: Sync the static files to the S3 bucket
    const s3 = new AWS.S3();

    // Recursive file upload
    const uploadFiles = async (folder) => {
      const filePaths = [];

      const files = fs.readdirSync(folder);
      for (const file of files) {
        const filePath = path.join(folder, file);

        if (fs.statSync(filePath).isDirectory()) {
          filePaths.push(...(await uploadFiles(filePath)));
        } else {
          const fileKey = path.relative(repoFolder, filePath);
          const fileContent = fs.readFileSync(filePath);

          // Determine the correct ContentType
          const contentType = mime.lookup(filePath) || "application/octet-stream";

          const params = {
            Bucket: bucketName,
            Key: fileKey,
            Body: fileContent,
            ContentType: contentType, // Set the ContentType for the file
          };

          // Upload file to S3
          await s3.upload(params).promise();
          filePaths.push(fileKey);
        }
      }

      return filePaths;
    };

    // Upload files and capture their paths
    const uploadedFiles = await uploadFiles(repoFolder);

    // Generate S3 URLs for the uploaded files (index.html in this example)
    const indexFile = uploadedFiles.find((file) => file.endsWith("index.html"));
    const s3Url = indexFile
      ? `https://${bucketName}.s3.${process.env.AWS_REGION}.amazonaws.com/${indexFile}`
      : null;

    res.json({ success: true, s3Url, uploadedFiles });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});



// Start the server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
