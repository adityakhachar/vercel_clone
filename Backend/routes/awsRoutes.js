// backend/routes/awsRoutes.js
// Example AWS Route
router.get("/", (req, res) => {
  res.json({ message: "AWS Routes are working!" });
});

module.exports = router;
// backend/routes/awsRoutes.js
const express = require("express");
const router = express.Router();

// Example AWS Route
router.get("/", (req, res) => {
  res.json({ message: "AWS Routes are working!" });
});

module.exports = router;
