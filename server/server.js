const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
const { testConnection } = require('./config/database');

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../.env') });

// Create Express app
const app = express();

// Middleware
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/users', require('./routes/users'));
app.use('/api/reports', require('./routes/reports'));
app.use('/api/master-data', require('./routes/masterData'));

// Health check endpoint
app.get('/api/health', async (req, res) => {
  try {
    // Test database connection for health check
    const dbConnected = await testConnection();

    res.json({
      success: true,
      message: 'Server is running',
      database: dbConnected ? 'connected' : 'disconnected',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development'
    });
  } catch (error) {
    res.json({
      success: true,
      message: 'Server is running',
      database: 'disconnected',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development'
    });
  }
});

// Serve static files from React build (for production)
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../client/dist')));

  // Handle React routing - send all non-API requests to React app
  app.use((req, res, next) => {
    // Skip API routes
    if (req.path.startsWith('/api')) {
      return next();
    }
    // For all other routes, serve the React app
    res.sendFile(path.join(__dirname, '../client/dist/index.html'));
  });
} else {
  // Development root endpoint
  app.get('/', (req, res) => {
    res.json({
      success: true,
      message: 'Valve Test Suite API',
      version: '1.0.0',
      endpoints: {
        health: '/api/health',
        auth: '/api/auth',
        users: '/api/users',
        reports: '/api/reports',
        masterData: '/api/master-data'
      }
    });
  });
}

// 404 handler
app.use((req, res) => {
  res.status(404).json({ 
    success: false, 
    message: 'Endpoint not found' 
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({ 
    success: false, 
    message: err.message || 'Internal server error' 
  });
});

// Start server
const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    // Test database connection (non-blocking)
    const dbConnected = await testConnection();

    // Start listening regardless of database connection
    app.listen(PORT, () => {
      console.log(`\n🚀 Server is running on port ${PORT}`);
      console.log(`📍 API URL: http://localhost:${PORT}`);
      console.log(`🔗 Client URL: ${process.env.CLIENT_URL || 'http://localhost:5173'}`);
      console.log(`💾 Database: ${dbConnected ? 'Connected' : 'Disconnected'}`);
      console.log(`\n✅ Server started successfully!\n`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();

