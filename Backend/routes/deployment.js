const express = require("express");
const { cloneAndDeploy } = require("../awsGithubService");
const router = express.Router();

router.post("/validate-and-deploy", async (req, res) => {
  const { gitUrl, branch, bucketName } = req.body;

  if (!gitUrl || !bucketName) {
    return res.status(400).json({ success: false, message: "Missing required fields." });
  }

  try {
    const result = await cloneAndDeploy({ gitUrl, branch, bucketName });
    if (result.success) {
      return res.json({ success: true, s3Url: result.s3Url });
    } else {
      throw new Error(result.error);
    }
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
