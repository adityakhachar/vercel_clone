import React from "react";
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import GitHubForm from "./components/GitHubForm";
import AWSForm from "./components/AWSForm";


const App = () => {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<GitHubForm />} />
        <Route path="/awsform" element={<AWSForm />} />
      </Routes>
    </Router>
  );
};

export default App;
