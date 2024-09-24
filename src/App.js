import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from './pages/home'; // Home page
import SignUpLogin from './pages/signuplogin';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<SignUpLogin />} /> {/* Root page */}
        <Route path="/home" element={<Home />} /> {/* Home page */}
      </Routes>
    </Router>
  );
}

export default App;
