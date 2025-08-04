import React, { useState } from 'react';

function HomePage() {
  const [committeeName, setCommitteeName] = useState('');
  const [newCommitteeSlug, setNewCommitteeSlug] = useState(null);
  const [copyButtonText, setCopyButtonText] = useState('Copy');

  const handleCreateCommittee = () => {
    if (!committeeName.trim()) {
      alert('Please enter a name for the committee.');
      return;
    }

    // --- This is the corrected block ---
    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5001';
    fetch(`${apiUrl}/api/committees`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ name: committeeName }),
    })
    .then(response => {
      if (!response.ok) {
        return response.json().then(err => { throw new Error(err.message) });
      }
      return response.json();
    })
    .then(data => {
      setNewCommitteeSlug(data.slug);
    })
    .catch(error => {
      alert(`Error: ${error.message}`);
    });
  };

  const handleCopyLink = () => {
    const linkToCopy = `${window.location.origin}/committee/${newCommitteeSlug}`;
    navigator.clipboard.writeText(linkToCopy).then(() => {
      setCopyButtonText('Copied!');
      setTimeout(() => setCopyButtonText('Copy'), 2000);
    });
  };

  return (
    <div className="page-container">
      <h1>Jai Ganesha Maha prasadam Laddu Bidding</h1>
      {!newCommitteeSlug ? (
        <div className="form-container">
          <input
            type="text"
            className="prasadam-input"
            value={committeeName}
            onChange={(e) => setCommitteeName(e.target.value)}
            placeholder="Enter your Ganesh Committee name"
          />
          <button onClick={handleCreateCommittee} className="create-button">
            Create Bidding Link
          </button>
        </div>
      ) : (
        <div className="link-display-box">
          <h2>Bidding Link Created!</h2>
          <p>Share this link:</p>
          <div className="link-input-wrapper">
            <input
              type="text"
              readOnly
              value={`${window.location.origin}/committee/${newCommitteeSlug}`}
            />
            <button onClick={handleCopyLink}>
              {copyButtonText}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default HomePage;