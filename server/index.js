const express = require('express');
const { createServer } = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const { v4: uuidv4 } = require('uuid');

const app = express();
const httpServer = createServer(app);

const allowedOrigins = [
  "http://localhost:5173",
  "https://laddu-bidding-app.netlify.app"
];

const corsOptions = {
  origin: allowedOrigins
};

const io = new Server(httpServer, {
  cors: corsOptions
});

const PORT = 5001;
const committees = {};
const slugToIdMap = {};

app.use(cors(corsOptions));
app.use(express.json());

const slugify = (str) => {
  return str
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
};

app.post('/api/committees', (req, res) => {
  const { name } = req.body;
  if (!name || name.trim() === '') {
    return res.status(400).json({ message: 'Committee name is required.' });
  }
  const id = uuidv4();
  const slug = slugify(name);
  if (slugToIdMap[slug]) {
    return res.status(409).json({ message: 'A committee with this name already exists.' });
  }
  const newCommittee = {
    id, name, slug, currentBid: 0, highestBidder: 'None', bidHistory: [], createdAt: new Date(),
  };
  committees[id] = newCommittee;
  slugToIdMap[slug] = id;
  console.log('New committee created:', newCommittee);
  res.status(201).json({ slug: slug });
});

app.get('/api/committees/slug/:slug', (req, res) => {
  const { slug } = req.params;
  const committeeId = slugToIdMap[slug];
  const committee = committees[committeeId];
  if (committee) res.status(200).json(committee);
  else res.status(404).json({ message: 'Committee not found' });
});

io.on('connection', (socket) => {
  socket.on('join_committee', (committeeId) => {
    socket.join(committeeId);
    console.log(`Socket ${socket.id} joined room ${committeeId}`);
  });

  socket.on('new_bid', (data) => {
    const { committeeId, name, amount } = data;
    const bidAmount = parseInt(amount, 10);
    const committee = committees[committeeId];
    if (!committee || isNaN(bidAmount) || bidAmount <= committee.currentBid || (bidAmount - committee.currentBid) % 5 !== 0) return;
    
    // Update the committee state
    committee.currentBid = bidAmount;
    committee.highestBidder = name;
    committee.bidHistory.push({ name: name, amount: bidAmount, time: new Date() });

    // --- (NEW) Enforce the 2000 entry limit ---
    // If the history array is now longer than 2000...
    if (committee.bidHistory.length > 2000) {
      // ...replace it with a new array containing only the last 2000 elements.
      // The slice(-2000) method efficiently gets the last 2000 items.
      committee.bidHistory = committee.bidHistory.slice(-2000); 
    }
    // --- End of new logic ---
    
    io.to(committeeId).emit('bid_updated', committee);
  });
  
  socket.on('disconnect', () => console.log(`User ${socket.id} disconnected`));
});

httpServer.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});