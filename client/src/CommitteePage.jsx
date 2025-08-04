import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { io } from 'socket.io-client';

function CommitteePage() {
  const { committeeSlug } = useParams();
  const [committee, setCommittee] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [bidAmount, setBidAmount] = useState('');

  useEffect(() => {
    setIsLoading(true);
    fetch(`http://localhost:5001/api/committees/slug/${committeeSlug}`)
      .then(res => res.json())
      .then(data => {
        if (data.message) setCommittee(null);
        else setCommittee(data);
      })
      .catch(err => setCommittee(null))
      .finally(() => setIsLoading(false));
  }, [committeeSlug]);

  useEffect(() => {
    if (!committee) return;
    const socket = io('http://localhost:5001');
    socket.emit('join_committee', committee.id);
    socket.on('bid_updated', (updatedCommittee) => setCommittee(updatedCommittee));
    return () => socket.disconnect();
  }, [committee]);

  const handlePlaceBid = () => {
    const currentHighestBid = committee.currentBid;
    const newBidAmount = parseInt(bidAmount, 10);
    if (isNaN(newBidAmount) || newBidAmount <= currentHighestBid || (newBidAmount - currentHighestBid) % 5 !== 0) {
      alert("Invalid bid amount. Must be a higher value and in a $5 increment.");
      return;
    }
    const bidderName = prompt("Please confirm your name to place a bid:");
    if (!bidderName) return;
    const socket = io('http://localhost:5001');
    socket.emit('new_bid', {
      committeeId: committee.id,
      name: bidderName,
      amount: newBidAmount,
    });
    setBidAmount('');
  };

  if (isLoading) return <div className="container"><h2>Loading...</h2></div>;
  if (!committee) return <div className="container"><h2>Committee Not Found</h2><p>The link may be incorrect.</p></div>;

  return (
    <div className="container" style={{ width: '90vw', maxWidth: '800px' }}>
      <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '30px' }}>
        <div style={{ textAlign: 'center' }}>
          {/* (UPDATED) Main and sub-titles */}
          <h1>Jai Ganesha Maha prasadam Laddu Bidding</h1>
          <h2 style={{ color: '#aaa', marginTop: '-15px' }}>{committee.name}</h2>

          <div style={{ background: 'white', color: '#282c34', padding: '20px', borderRadius: '8px', marginTop: '20px' }}>
            <h3>Current Highest Bid</h3>
            <p style={{ fontSize: '48px', margin: '10px 0', color: '#61dafb' }}>${committee.currentBid}</p>
            <p>by <strong>{committee.highestBidder}</strong></p>
          </div>
          <div style={{ marginTop: '20px' }}>
            <input type="number" placeholder="$" step="5" value={bidAmount} onChange={(e) => setBidAmount(e.target.value)} style={{ padding: '10px', fontSize: '24px', width: '120px', textAlign: 'center' }} />
            <button onClick={handlePlaceBid} style={{ padding: '15px 20px', fontSize: '18px', marginLeft: '10px' }}>Place Bid</button>
          </div>
        </div>
        <div style={{ textAlign: 'left' }}>
          <h3>Bid History</h3>
          <ul style={{ listStyle: 'none', padding: '10px', background: '#f0f0f0', borderRadius: '8px', maxHeight: '400px', overflowY: 'auto' }}>
            {committee.bidHistory.length === 0 ? (
              <p style={{color: '#555', textAlign: 'center'}}>No bids have been placed yet.</p>
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
    </div>
  );
}

export default CommitteePage;