
const mongoose = require('mongoose');

const connectDB = async () => {
    try {
        const conn = await mongoose.connect(process.env.MONGODB_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
            serverSelectionTimeoutMS: 5000, // Timeout after 5s instead of 30s
            socketTimeoutMS: 45000, // Close sockets after 45s of inactivity
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

module.exports = connectDB;
