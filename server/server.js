const express = require('express');
const cors = require('cors');
const MongoClient = require('mongodb').MongoClient;
const path = require('path');
const app = express();
const PORT = process.env.PORT || 3000;
const MONGODB_URI = 'mongodb+srv://nannakasaiteja:teja6rC3MFuKG7g7uj4d@saitejanannaka.fqbbn5o.mongodb.net/';

app.use(express.json());
app.use(cors());

// Serve static files from the 'production' directory
app.use(express.static(path.join(__dir-name, 'production')));


const DATABASE_NAME = 'API_Service';

// Define collection names
const COLLECTION_NAMES = {
  'Api_Specified_Automated_TestCases': 'Api_Specified_Automated_TestCases',
  'Api_All_Automated_TestCases': 'Api_All_Automated_TestCases',
  'Api_Validation_Automated_TestCases': 'Api_Validation_Automated_TestCases',
  'Api_Validation_Automated_Multiple_TestCases':'Api_Validation_Automated_Multiple_TestCases'
};

// Function to connect to MongoDB
async function connectToMongoDB() {
  try {
    const client = new MongoClient(MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true });
    await client.connect();
    const db = client.db(DATABASE_NAME);
    return { client, db };
  } catch (error) {
    console.error('Error connecting to MongoDB:', error);
    throw error;
  }
}


// Handle all other routes by serving index.html (for SPA setups)
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'production', 'login.html'));
});


// Common logic for all collections
app.post('/api/storeApiRequest/:collectionName', async (req, res) => {
  try {
    const { collectionName } = req.params;

    if (!COLLECTION_NAMES[collectionName]) {
      res.status(404).json({ error: 'Collection not found' });
      return;
    }

    const { client, db } = await connectToMongoDB();

    const collection = db.collection(COLLECTION_NAMES[collectionName]);

    // Log the received request body to check if testCaseNumber and testCaseName are present
//    terminal data
//    console.log('Received request body:', req.body);

    // Assuming that the request's body contains the API request data
    const apiRequestData = req.body;

    // Extract testCaseNumber and testCaseName from the request body
    const { testCaseNumber, testCaseName, ...restOfData } = apiRequestData;

//    // Log testCaseNumber and testCaseName
//    console.log('Received testCaseNumber:', testCaseNumber);
//    console.log('Received testCaseName:', testCaseName);

    // Insert the API request data into the MongoDB collection
    const result = await collection.insertOne(apiRequestData);

    // Close the MongoDB client connection
    client.close();
    res.status(200).json({ message: `API request data stored successfully in ${collectionName}` });
  } catch (error) {
    console.error(`Error storing API request data in ${collectionName}:`, error);
    res.status(500).json({ error: 'Internal server error' });
  }
});
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});



app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});