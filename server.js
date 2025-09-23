// Load environment Veriables From .env File ----------------------------------------------------
require("dotenv").config();

// ----------------------------------------------------------------------------------------------
//    Initializing the Express Server - The Alloted Port For The Server Is 3000
// ----------------------------------------------------------------------------------------------
const express = require("express");
const { MongoClient, ServerApiVersion } = require('mongodb');



// ----------------------------------------------------------------------------------------------
// Inititalization of Express App and Other Global Configuaration
// ----------------------------------------------------------------------------------------------
const app = express();
const port = process.env.PORT || 3000;
const mongoUri = process.env.MONGODB_URI;













// -------------------------------------------------------------------------------------------------
// MongoDB Connection
// -------------------------------------------------------------------------------------------------

// Instantiate Mongo Client and Define Connection Option--------------------------------------------
const client = new MongoClient(mongoUri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});




// ---------------------------------------------------------------------------------------------------
// Assynchronous Function to Connect to MongoDB
// ---------------------------------------------------------------------------------------------------

async function run() {
  // Database Collections Creation----------------------------------------------------





    try{
        
    }
    catch(error){

    }
}
run();













// ---------------------------------------------------------------------------------------------------------------
//  Test API End Point To Confirm That The Server Can Be Accessed From The Client Side
// ---------------------------------------------------------------------------------------------------------------
app.get("/", (req, res) => {
  res.send("Root Farming Server Is Live!");
});

// ---------------------------------------------------------------------------------------------------------------
//  Server Listener. Start The Server And Listen Any Request. It Also Print The Server Side Console
// ---------------------------------------------------------------------------------------------------------------
app.listen(port, () => {
  console.log(`Hey Quantum Web, Root Farming Is Active on port - ${port}`);
});

