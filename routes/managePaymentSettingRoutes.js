import express from "express";
import { ObjectId } from "mongodb";
import { getCollection } from "../config/db.js";

const router = express.Router();

// ------------------ ADD BANK ACCOUNT ------------------
router.post("/bank-accounts", async (req, res) => {
  try {
    const { holderName, branchName, routerId, accountNumber } = req.body;

    if (!holderName || !accountNumber) {
      return res.status(400).send({ message: "Missing required fields" });
    }

    const paymentCollection = await getCollection("bankAccounts");
    const result = await paymentCollection.insertOne({
      holderName,
      branchName,
      routerId,
      accountNumber,
      isActive: false,
      createdAt: new Date(),
    });

    res.send(result);
  } catch (error) {
    console.error("Error adding bank account:", error);
    res.status(500).send({ message: "Failed to add bank account" });
  }
});

// ------------------ GET ALL BANK ACCOUNTS ------------------
router.get("/bank-accounts", async (req, res) => {
  try {
    const paymentCollection = await getCollection("bankAccounts");
    const accounts = await paymentCollection.find().toArray();
    res.send(accounts);
  } catch (error) {
    console.error("Error fetching bank accounts:", error);
    res.status(500).send({ message: "Failed to fetch bank accounts" });
  }
});

// ------------------ GET SINGLE BANK ACCOUNT BY ID ------------------
router.get("/bank-accounts/:id", async (req, res) => {
  try {
    const paymentCollection = await getCollection("bankAccounts");
    const account = await paymentCollection.findOne({
      _id: new ObjectId(req.params.id),
    });

    if (!account) {
      return res.status(404).send({ message: "Bank account not found" });
    }

    res.send(account);
  } catch (error) {
    console.error("Error fetching bank account:", error);
    res.status(500).send({ message: "Failed to fetch bank account" });
  }
});

// ------------------ UPDATE BANK ACCOUNT STATUS (Activate/Deactivate) ------------------
router.patch("/bank-accounts/:id", async (req, res) => {
  try {
    const { isActive } = req.body;
    const paymentCollection = await getCollection("bankAccounts");

    const result = await paymentCollection.updateOne(
      { _id: new ObjectId(req.params.id) },
      { $set: { isActive } }
    );

    res.send(result);
  } catch (error) {
    console.error("Error updating bank account status:", error);
    res.status(500).send({ message: "Failed to update bank account status" });
  }
});

// ------------------ DELETE BANK ACCOUNT ------------------
router.delete("/bank-accounts/:id", async (req, res) => {
  try {
    const paymentCollection = await getCollection("bankAccounts");
    const result = await paymentCollection.deleteOne({
      _id: new ObjectId(req.params.id),
    });

    res.send(result);
  } catch (error) {
    console.error("Error deleting bank account:", error);
    res.status(500).send({ message: "Failed to delete bank account" });
  }
});

export default router;
