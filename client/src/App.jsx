import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import './App.css';
import HomePage from './HomePage';
import CommitteePage from './CommitteePage';

function App() {
  return (
    <Router>
      {/* The main-content div will now handle the centering */}
      <main className="main-content">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/committee/:committeeSlug" element={<CommitteePage />} />
        </Routes>
      </main>

      {/* Footer is outside the main content to stick to the bottom */}
      <footer className="footer">
        Developed by: Sateesh Mandanapu
      </footer>
    </Router>
  );
}

export default App;