const express = require('express');
const { createServer } = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const { v4: uuidv4 } = require('uuid');

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: { origin: "http://localhost:5173" }
});

const PORT = 5001;

// --- In-Memory "Database" ---
const committees = {}; // Stores committee data by ID
// (NEW) A lookup table to find a committee's ID from its slug
const slugToIdMap = {};

app.use(cors());
app.use(express.json());


// --- (NEW) Helper function to create a URL-friendly slug ---
const slugify = (str) => {
  return str
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '') // Remove non-word chars
    .replace(/[\s_-]+/g, '-') // Replace spaces with a single hyphen
    .replace(/^-+|-+$/g, ''); // Remove leading/trailing hyphens
};


// --- (UPDATED) POST to create a new committee ---
app.post('/api/committees', (req, res) => {
  const { name } = req.body; // Get the name from the request
  if (!name || name.trim() === '') {
    return res.status(400).json({ message: 'Committee name is required.' });
  }

  const id = uuidv4();
  const slug = slugify(name);

  // Check if the slug already exists to prevent duplicate URLs
  if (slugToIdMap[slug]) {
    return res.status(409).json({ message: 'A committee with this name already exists. Please choose a different name.' });
  }

  const newCommittee = {
    id: id,
    name: name, // Store the original name
    slug: slug, // Store the URL-friendly slug
    currentBid: 0,
    highestBidder: 'None',
    bidHistory: [],
    createdAt: new Date(),
  };
  
  committees[id] = newCommittee;
  slugToIdMap[slug] = id; // Add to our lookup table

  console.log('New committee created:', newCommittee);
  // Return the new slug so the frontend can build the link
  res.status(201).json({ slug: slug });
});


// --- (NEW) GET a specific committee's details by its SLUG ---
app.get('/api/committees/slug/:slug', (req, res) => {
    const { slug } = req.params;
    const committeeId = slugToIdMap[slug];
    const committee = committees[committeeId];

    if (committee) {
        res.status(200).json(committee);
    } else {
        res.status(404).json({ message: 'Committee not found' });
    }
});


// (We've removed the old /api/committees/:committeeId endpoint as it's replaced by the slug version)
// (We've also removed the participant registration endpoints for simplicity as per your last request)


// Socket.IO logic remains the same, as it correctly uses the unique ID
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
    committee.currentBid = bidAmount;
    committee.highestBidder = name;
    committee.bidHistory.push({ name: name, amount: bidAmount, time: new Date() });
    io.to(committeeId).emit('bid_updated', committee);
  });
  socket.on('disconnect', () => console.log(`User ${socket.id} disconnected`));
});


httpServer.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});