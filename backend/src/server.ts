import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import requestRoutes from './routes/requests.js';
import reporteeRoutes from './routes/reportees.js';
import authRoutes from './routes/auth.js';
// Budget routes removed - using n8n webhook API instead

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  credentials: true
}));

app.use(express.json());

// Routes - matching n8n webhook structure
app.use('/webhook', requestRoutes);
app.use('/webhook', reporteeRoutes);
app.use('/webhook', authRoutes);
// Budget API removed - using n8n webhook API instead

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'Backend server is running' });
});

app.listen(PORT, () => {
  console.log(`🚀 Backend server running on port ${PORT}`);
  console.log(`📡 CORS enabled for: ${process.env.CORS_ORIGIN || 'http://localhost:5173'}`);
});

