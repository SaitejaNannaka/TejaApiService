//// Server (app.js)
//const express = require('express');
//const { MongoClient } = require('mongodb');
//
//const app = express();
//const port = 3000;
//
//const mongoUri = 'mongodb+srv://nannakasaiteja:teja6rC3MFuKG7g7uj4d@saitejanannaka.fqbbn5o.mongodb.net/';
//
//app.get('/api/data', async (req, res) => {
//  try {
//    const client = new MongoClient(mongoUri, { useNewUrlParser: true, useUnifiedTopology: true });
//    await client.connect();
//
//    const db = client.db("API_Automation_TestCases");
//    const collection = db.collection('Test_Runs_TestCases');
//
//    const data = await collection.find({}).toArray();
//
//    res.json(data);
//  } catch (error) {
//    console.error('Error fetching data from MongoDB', error);
//    res.status(500).json({ error: 'Internal Server Error' });
//  }
//});
//
//app.listen(port, () => {
//  console.log(`Server is running on port ${port}`);
//});
