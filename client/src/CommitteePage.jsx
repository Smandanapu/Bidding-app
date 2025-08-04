import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { io } from 'socket.io-client';

const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5001';

function CommitteePage() {
  const { committeeSlug } = useParams();
  const [committee, setCommittee] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [bidAmount, setBidAmount] = useState('');

  // (NEW) State to hold our single, persistent socket connection
  const [socket, setSocket] = useState(null);

  // --- Effect 1: For fetching initial data (no change here) ---
  useEffect(() => {
    setIsLoading(true);
    fetch(`${apiUrl}/api/committees/slug/${committeeSlug}`)
      .then(res => res.json())
      .then(data => {
        if (data.message) setCommittee(null);
        else setCommittee(data);
      })
      .catch(err => {
        console.error("Error fetching committee data:", err);
        setCommittee(null);
      })
      .finally(() => setIsLoading(false));
  }, [committeeSlug]);

  // --- (UPDATED) Effect 2: Manages the single socket connection's lifecycle ---
  useEffect(() => {
    // Do nothing if we haven't loaded the committee data yet
    if (!committee) return;

    // Create the new socket connection
    const newSocket = io(apiUrl);
    
    // Save the socket instance to state so we can use it elsewhere
    setSocket(newSocket);

    // Join the committee's room using its real ID
    newSocket.emit('join_committee', committee.id);

    // Set up the listener for updates
    newSocket.on('bid_updated', (updatedCommittee) => {
      setCommittee(updatedCommittee);
    });

    // The cleanup function: This is crucial. It runs when the component unmounts.
    return () => {
      newSocket.disconnect();
    };
  }, [committee]); // This effect runs only when the 'committee' object is first loaded


  // --- (UPDATED) handlePlaceBid now uses the socket from state ---
  const handlePlaceBid = () => {
    const currentHighestBid = committee.currentBid;
    const newBidAmount = parseInt(bidAmount, 10);
    if (isNaN(newBidAmount) || newBidAmount <= currentHighestBid || (newBidAmount - currentHighestBid) % 5 !== 0) {
      alert("Invalid bid amount. Must be a higher value and in a $5 increment.");
      return;
    }
    const bidderName = prompt("Please confirm your name to place a bid:");
    if (!bidderName) return;

    // --- Critical Change ---
    // Check if the socket connection exists in our state before trying to use it.
    if (socket) {
      // Use the ONE existing socket to EMIT the event.
      socket.emit('new_bid', {
        committeeId: committee.id,
        name: bidderName,
        amount: newBidAmount,
      });
    } else {
      console.error("Socket not connected. Cannot place bid.");
    }
    
    setBidAmount('');
  };


  if (isLoading) return <div className="page-container"><h2>Loading...</h2></div>;
  if (!committee) return <div className="page-container"><h2>Committee Not Found</h2><p>The link may be incorrect.</p></div>;

  // The JSX for rendering the page does not need any changes.
  return (
    <div className="page-container">
      <h1>Jai Ganesha Maha prasadam Laddu Bidding</h1>
      <h2 style={{ color: '#aaa', marginTop: '-15px' }}>{committee.name}</h2>
      <div style={{ background: 'white', color: '#282c34', padding: '20px', borderRadius: '8px', marginTop: '20px', width: '100%', maxWidth: '600px' }}>
        <h3>Current Highest Bid</h3>
        <p style={{ fontSize: '48px', margin: '10px 0', color: '#61dafb' }}>${committee.currentBid}</p>
        <p>by <strong>{committee.highestBidder}</strong></p>
      </div>
      <div style={{ marginTop: '20px' }}>
        <input type="number" placeholder="$" step="5" value={bidAmount} onChange={(e) => setBidAmount(e.target.value)} style={{ padding: '10px', fontSize: '24px', width: '120px', textAlign: 'center', borderRadius: '8px' }} />
        <button onClick={handlePlaceBid} className="create-button" style={{ padding: '15px 20px', fontSize: '18px', marginLeft: '10px' }}>Place Bid</button>
      </div>
      <div style={{ textAlign: 'left', width: '100%', maxWidth: '600px', marginTop: '40px' }}>
        <h3>Bid History</h3>
        <ul style={{ listStyle: 'none', padding: '10px', background: '#f0f0f0', borderRadius: '8px', maxHeight: '400px', overflowY: 'auto' }}>
          {committee.bidHistory.length === 0 ? (
            <p style={{ color: '#555', textAlign: 'center' }}>No bids have been placed yet.</p>
          ) : (
            committee.bidHistory.slice().reverse().map((bid, index) => (
              <li key={index} style={{ background: 'white', color: 'black', padding: '8px 12px', margin: '5px 0', borderRadius: '4px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span><strong>{bid.name}</strong> placed a bid of</span>
                <span style={{ fontWeight: 'bold', fontSize: '1.1em' }}>${bid.amount}</span>
              </li>
            ))
          )}
        </ul>
      </div>
    </div>
  );
}

export default CommitteePage;