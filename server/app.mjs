// Import necessary modules
import express from 'express';
import bodyParser from 'body-parser';
import { connectToMongoDB, insertApiRequestResponse } from './mongoDb.mjs'; // Correct the path

// Create an Express app
const app = express();

// Middleware to parse JSON request bodies
app.use(bodyParser.json());

// Serve static files from the 'production' directory
app.use(express.static('production'));

// Connect to MongoDB when the server starts
connectToMongoDB();

// Define API routes here
// Example route for handling POST requests
app.post('/api/insertLog', async (req, res) => {
  // Your route handling code here
});

// Start the server
const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
