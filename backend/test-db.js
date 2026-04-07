require('dotenv').config();
const mongoose = require('mongoose');

const MONGO_URI = process.env.MONGO_URI;

console.log('--- MongoDB Connection Test ---');
console.log('Connecting to:', MONGO_URI.replace(/:([^:@]+)@/, ':****@')); // Hide password

mongoose
  .connect(MONGO_URI)
  .then(() => {
    console.log('✅ Success! MongoDB is reachable from this network.');
    process.exit(0);
  })
  .catch((err) => {
    console.error('❌ Failed to connect to MongoDB.');
    console.error('Error Code:', err.code);
    console.error('Error Name:', err.name);
    console.error('Error Message:', err.message);
    if (err.cause) {
      console.error('Cause:', err.cause.message);
    }
    console.log('\n--- Troubleshooting ---');
    console.log('1. Verify your IP address is whitelisted in MongoDB Atlas (Network Access tab).');
    console.log('2. Check if your network firewall or VPN is blocking port 27017.');
    console.log('3. Ensure your username and password in the connection string are correct.');
    process.exit(1);
  });
