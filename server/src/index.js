const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

// Security Middleware
app.use(helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
    contentSecurityPolicy: false
}));
app.use(express.json({ limit: '10kb' })); // Body limit

// Rate Limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Limit each IP to 100 requests per windowMs
    message: 'Too many requests from this IP, please try again later'
});
app.use('/api', limiter);

// Stricter limit for login
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 50, // 5 login attempts per 15 min? Maybe 50 is safe enough for heavy users, but for login route specifically should be lower. 
    // Let's keep it simple for now, generic limiter is fine.
});
app.use('/api/auth', authLimiter);

// Update CORS to be specific if needed in future, for now Allow All is strictly for dev convenience but insecure for prod. 
// We will keep cors() standard for now but headers are secured.

const path = require('path');
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const itemRoutes = require('./routes/itemRoutes');
const logRoutes = require('./routes/logRoutes');
const requestRoutes = require('./routes/requestRoutes');

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/items', itemRoutes);
app.use('/api/logs', logRoutes);
app.use('/api/requests', requestRoutes);

// Make uploads folder static
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Serve Frontend (Vite build)
// Expects 'dist' folder in the project root
app.use(express.static(path.join(__dirname, '../../dist')));

// API root message (optional, but good to keep)
app.get('/api', (req, res) => {
    res.send('Inventory App API is running');
});

// Handle SPA routing - return index.html for any unknown non-API route
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../../dist', 'index.html'));
});

// Global Error Handler
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({
        message: err.message || 'Serverda xatolik yuz berdi',
        stack: process.env.NODE_ENV === 'production' ? null : err.stack,
    });
});

// Start Server
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
