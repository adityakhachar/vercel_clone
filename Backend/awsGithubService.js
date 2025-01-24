const { exec } = require("child_process");
const path = require("path");
const fs = require("fs-extra");
const simpleGit = require("simple-git");
const { S3Client, PutObjectCommand } = require("@aws-sdk/client-s3");

const gitRepoDir = path.join(__dirname, "git-temp");
const s3 = new S3Client({ region: "your-region" }); // Specify your AWS region

async function cloneOrPullRepo(gitUrl, branch = "main") {
  const git = simpleGit();
  if (!fs.existsSync(gitRepoDir)) {
    console.log("Cloning repository...");
    await git.clone(gitUrl, gitRepoDir, ["--branch", branch]);
  } else {
    console.log("Pulling latest changes...");
    await git.cwd(gitRepoDir).pull();
  }
  return gitRepoDir;
}

async function syncToS3(bucketName, localDir) {
  const files = await fs.readdir(localDir);
  const s3BaseUrl = `https://${bucketName}.s3.amazonaws.com`;

  for (const file of files) {
    const filePath = path.join(localDir, file);
    const fileKey = path.basename(file); // S3 object key is the filename

    console.log(`Uploading ${file} to S3...`);

    const command = new PutObjectCommand({
      Bucket: bucketName,
      Key: fileKey,
      Body: fs.createReadStream(filePath),
    });

    await s3.send(command);
  }

  console.log("All files uploaded to S3.");
  return s3BaseUrl;
}

async function cloneAndDeploy({ gitUrl, branch, bucketName }) {
  try {
    console.log("Starting clone and deploy process...");
    const repoPath = await cloneOrPullRepo(gitUrl, branch);
    const staticFilesPath = path.join(repoPath, "static"); // Adjust to your structure
    if (!fs.existsSync(staticFilesPath)) {
      throw new Error("Static directory not found in repository.");
    }

    const s3Url = await syncToS3(bucketName, staticFilesPath);
    console.log("Deployment complete.");

    return { success: true, s3Url };
  } catch (error) {
    console.error("Error during deployment:", error.message);
    return { success: false, error: error.message };
  }
}

module.exports = { cloneAndDeploy };
