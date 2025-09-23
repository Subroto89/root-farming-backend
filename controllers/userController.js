let userCollection;

// ✅ Set DB collections
export function setCollections(db) {
  userCollection = db.collection('users');
}

// ✅ Add user
export async function addUser(req, res) {
  try {
    const userData = req.body;

    if (!userCollection) {
      return res.status(500).json({ error: "DB not initialized" });
    }

    const result = await userCollection.insertOne(userData);
    res.status(201).json({ message: "User added successfully", id: result.insertedId });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
}

// ✅ You can add more controller functions here (getUsers, updateUser, etc.)
