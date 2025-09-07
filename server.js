// server.js
const ENV = require('./config/env');
const connectDB = require('./config/db');
const app = require('./app');

// ---------------------------
// Connect to MongoDB
// ---------------------------
connectDB();

// ---------------------------
// Start Server
// ---------------------------
const PORT = ENV.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});
