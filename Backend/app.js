// backend/app.js
const express = require("express");
const cors = require("cors");
// const awsRoutes = require("./routes/awsRoutes");
// const githubRoutes = require("./routes/githubRoutes");

require("dotenv").config();

const app = express();
app.use(cors());
app.use(express.json());

// Routes
// app.use("/api/aws", awsRoutes);
// app.use("/api/github", githubRoutes);
app.post("/api/aws/",(req,res)=>{
    const formData = req.body; // form data is sent in the body of the POST request
  console.log("Data received from frontend:", formData);
})
module.exports = app;
