const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const db = require('./config/database');
const initCronJobs = require('./services/cronService');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware - CORS (Allow ALL for development)
app.use(cors({
    origin: true,
    credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve uploaded files
app.use('/uploads', express.static(path.join(__dirname, process.env.UPLOAD_DIR || 'uploads')));

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/sysadmin', require('./routes/sysadmin'));
app.use('/api/asset/credentials', require('./routes/assetCredentials'));
app.use('/api/asset/ip', require('./routes/assetIp'));
app.use('/api/asset', require('./routes/asset'));

// Health check
app.get('/api/health', (req, res) => {
    res.json({
        success: true,
        message: 'ReactAppV3 API is running',
        timestamp: new Date().toISOString()
    });
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: 'Route not found'
    });
});

// Error handler
app.use((err, req, res, next) => {
    console.error('Error:', err);
    res.status(err.status || 500).json({
        success: false,
        message: err.message || 'Internal server error'
    });
});

// Start server
async function startServer() {
    try {
        // Test database connection
        const dbConnected = await db.testConnection();

        if (!dbConnected) {
            console.error('❌ Failed to connect to database. Please check your database configuration.');
            console.log('💡 Run "npm run init-db" to initialize the database first.');
            process.exit(1);
        }

        app.listen(PORT, '0.0.0.0', () => {
            console.log('╔════════════════════════════════════════════════╗');
            console.log('║     ReactAppV3 Backend Server Started          ║');
            console.log('╚════════════════════════════════════════════════╝');
            console.log(`🚀 Server running on: http://localhost:${PORT}`);
            console.log(`🌐 Network: http://0.0.0.0:${PORT}`);
            console.log(`📊 Database: ${process.env.DB_NAME}`);
            console.log(`📁 Upload directory: ${process.env.UPLOAD_DIR || 'uploads'}`);
            console.log(`🔑 JWT expires in: ${process.env.JWT_EXPIRES_IN || '7d'}`);
            console.log('');
            console.log('📚 API Endpoints:');
            console.log(`   - Authentication: http://localhost:${PORT}/api/auth`);
            console.log(`   - Sysadmin: http://localhost:${PORT}/api/sysadmin`);
            console.log(`   - Asset Management: http://localhost:${PORT}/api/asset`);
            console.log('');
            console.log('✨ Ready to accept connections!');
            console.log('🌐 CORS: Allowing ALL origins (development mode)');

            // Initialize Cron Jobs
            initCronJobs();
        });
    } catch (error) {
        console.error('❌ Failed to start server:', error);
        process.exit(1);
    }
}

startServer();
