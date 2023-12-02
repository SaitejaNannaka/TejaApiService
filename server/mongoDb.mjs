// mongoDb.js
import { MongoClient } from 'mongodb';

const uri = 'mongodb+srv://nannakasaiteja:teja6rC3MFuKG7g7uj4d@saitejanannaka.fqbbn5o.mongodb.net/';
const client = new MongoClient(uri);

async function connectToMongoDB() {
    try {
        await client.connect();
        console.log('Connected to MongoDB Atlas');
    } catch (error) {
        console.error('Error connecting to MongoDB', error);
    }
}

async function insertApiRequestResponse(requestType, endpoint, headers, requestBody, response) {
    try {
        if (!client.isConnected()) {
            await connectToMongoDB();
        }

        const database = client.db('API_Automation_TestCases');
        const collection = database.collection('Test_Runs_TestCases');

        const timestamp = new Date();

        const apiLog = {
            requestType,
            endpoint,
            headers: JSON.parse(headers),
            requestBody: JSON.parse(requestBody),
            response,
            timestamp,
        };

        const result = await collection.insertOne(apiLog);
        console.log(`Inserted ${result.insertedCount} document into the collection`);
    } catch (error) {
        console.error('Error inserting document', error);
    }
}

export { connectToMongoDB, insertApiRequestResponse };
