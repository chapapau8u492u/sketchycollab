
const mongoose = require('mongoose');

const connectDB = async () => {
    try {
        const conn = await mongoose.connect(process.env.MONGODB_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
            serverSelectionTimeoutMS: 5000, // Timeout after 5s instead of 30s
            socketTimeoutMS: 45000, // Close sockets after 45s of inactivity
            retryWrites: true,
            retryReads: true,
        });
        console.log(`MongoDB Connected: ${conn.connection.host}`);
    } catch (error) {
        console.error('Error connecting to MongoDB:', error);
        // Don't exit process, just log the error
        console.log('MongoDB connection failed. Will retry on next request.');
    }
};

// Add a handler for MongoDB connection errors to prevent app crashes
mongoose.connection.on('error', (err) => {
    console.error('MongoDB connection error:', err);
});

// Add reconnection logic
mongoose.connection.on('disconnected', () => {
    console.log('MongoDB disconnected. Attempting to reconnect...');
    setTimeout(connectDB, 5000); // Try to reconnect after 5 seconds
});

module.exports = connectDB;
