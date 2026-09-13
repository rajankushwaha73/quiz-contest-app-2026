require('dotenv').config();
const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const connectDB = require('./config/db');
const { notFound, errorHandler } = require('./middleware/error.middleware');

// Connect to MongoDB
connectDB();

const app = express();

// Core middleware
app.use(cors({ origin: process.env.CLIENT_URL || 'http://localhost:5173', credentials: true }));
app.use(express.json());
app.use(cookieParser());

const { getLeaderboardPreview } = require('./controllers/attempt.controller');

// Health check route - confirms server + env are wired correctly
app.get('/api/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Quiz Contest API is running',
    env: process.env.NODE_ENV,
  });
});

app.get('/api/leaderboard-preview', getLeaderboardPreview);

app.use('/api/auth', require('./routes/auth.routes'));
app.use('/api/student', require('./routes/student.routes'));
app.use('/api/teacher', require('./routes/teacher.routes'));
app.use('/api/admin', require('./routes/admin.routes'));

// Error handling (must be last)
app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
});
