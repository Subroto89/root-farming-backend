import express from "express";
import { ObjectId } from "mongodb";
import { getCollection } from "../config/db.js";

const router = express.Router();

// GET All Users --------------------------------------------------------------------
router.get("/", async (req, res) => {
  try {
    const userCollection = await getCollection("users");
    const users = await userCollection.find({}).toArray();
    res.status(200).json(users);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to fetch users" });
  }
});

// POST - Add a new user -------------------------------------------------------------
router.post("/save-user", async (req, res) => {
  try {
    const userData = req.body;
    const query = { userEmail: userData?.userEmail };
    const usersCollection = await getCollection("users");

    const alreadyUserExist = await usersCollection.findOne(query);
    if (alreadyUserExist) {
      await usersCollection.updateOne(query, {
        $set: { lastLoggedIn: new Date().toISOString() },
      });
      return res.status(200).send({ message: "User login time updated." });
    }

    userData.status =
      userData?.userRole === "customer"
        ? "customer"
        : `Request for ${userData.userRole} account`;
    userData.userRole = "customer";
    userData.createdAt = new Date().toISOString();
    userData.lastLoggedIn = new Date().toISOString();
    const result = await usersCollection.insertOne(userData);
    return res.status(201).send({
      message: "User created successfully.",
      insertedId: result.insertedId,
    });
  } catch (err) {
    console.log(err);
    res.status(500).send({ error: "Server error. Please try again later." });
  }
});

// Get Users Requesting for Farmer Account ------------------------------------
router.get("/get-farmers", async (req, res) => {
  try {
    const userCollection = await getCollection("users");
    const query = {
      $or: [
        { status: { $regex: /Request for Farmer account/i } },
        { userRole: "farmer" },
      ],
    };
    const farmers = await userCollection.find(query).toArray();
    res.status(200).json(farmers);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to fetch farmers" });
  }
});


router.get("/get-users-by-type", async (req, res) => {
    try {
        const userType = req.query.type;
        let query = {};
        let collectionName = ""; 

        // 1. Determine the query and collection based on the user type
        switch (userType) {
            case 'admin':
                // Finds only approved Admins
                query = { userRole: "Admin" };
                collectionName = "Admins";
                break;
                
            case 'farmer':
                // Finds approved Farmers OR users with pending Farmer requests
                query = {
                    $or: [
                        { status: { $regex: /Request for Farmer account/i } },
                        { userRole: {$regex: /Farmer/i} }
                    ]
                };
                collectionName = "Farmers/Farmer Requests";
                break;

            case 'seller':
                // Finds approved Sellers OR users with pending Seller requests
                query = {
                    $or: [
                        { status: { $regex: /Request for Seller account/i } },
                        { userRole: {$regex: /Seller/i} }
                    ]
                };
                collectionName = "Sellers/Seller Requests";
                break;
                
            case 'agri-specialist':
                // Finds approved Agri-Specialists OR users with pending Specialist requests
                query = {
                    $or: [
                        { status: { $regex: /Request for agri-specialist account/i } },
                        { userRole: {$regex: /Agri-Specialist/i}  }
                    ]
                };
                collectionName = "Agri-Specialists/Specialist Requests";
                break;

            case 'customer':
                // Finds all general Customers
                query = { userRole: {$regex: /Customer/i} };
                collectionName = "Customers";
                break;

            default:
                // Handle invalid or missing type parameter
                return res.status(400).json({ 
                    error: "Invalid or missing 'type' query parameter. Must be 'admin', 'farmer', 'seller', 'customer', or 'specialist'." 
                });
        }

        const userCollection = await getCollection("users");
        
        // 2. Execute the query
        const users = await userCollection.find(query).toArray();
        
        // 3. Return the results
        res.status(200).json(users);

    } catch (error) {
        console.error(`Error fetching users (${collectionName}):`, error);
        res.status(500).json({ error: "Failed to fetch user list due to a server error." });
    }
});


// Update Role
router.patch("/update-role/:email", async (req, res) => {
  try {
    const email = req.params.email;
    const { role } = req.body;
    const query = { userEmail: email };
    const updatedDoc = {
      $set: {
        userRole: role,
        status: "Verified",
      },
    };
    const userCollection = await getCollection("users");
    const result = await userCollection.updateOne(query, updatedDoc);
    res.status(200).json(result);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to update user role" });  
  }
});



// API for Getting User Role by Email ------------------------------------------------
 router.get("/get-user-role/:email", async (req, res) => {
      try {
        const email = req.params.email;
        if (!email) {
          return res.status(400).send({ message: "email is required" });
        }
        const userCollection = await getCollection("users");
        const user = await userCollection.findOne({ userEmail: email });

        if (!user) {
          return res.status(404).send({ message: "user not found!" });
        }

        res.send({ role: user?.userRole });
      } catch (error) {
        console.error("Error getting user role:", error);
        res.status(500).send({ message: "Failed to get role" });
      }
    });



    export default router;