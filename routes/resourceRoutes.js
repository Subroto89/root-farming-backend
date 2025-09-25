import express from "express";
import { getCollection } from "../config/db.js";

const router = express.Router();

// GET all resources
router.get("/", async (req, res) => {
   try {
      const resourcesCollection = await getCollection("resources");
      const resources = await resourcesCollection.find({}).toArray();
      res.status(200).json(resources);
   } catch (error) {
      console.error("Error fetching all resources:", error);
      res.status(500).json({ error: "Failed to fetch resources" });
   }
});

// GET resources expiring within next X days (default: 30)
router.get("/expiring", async (req, res) => {
   try {
      const days = parseInt(req.query.days) || 30;
      const today = new Date();

      const resourcesCollection = await getCollection("resources");

      const expiringResources = await resourcesCollection
         .aggregate([
            {
               $match: {
                  expiryDate: { $exists: true, $ne: null },
               },
            },
            {
               $addFields: {
                  expiryDate: {
                     $cond: [
                        { $eq: [{ $type: "$expiryDate" }, "string"] },
                        { $dateFromString: { dateString: "$expiryDate" } },
                        "$expiryDate",
                     ],
                  },
               },
            },
            {
               $addFields: {
                  daysUntilExpiry: {
                     $ceil: {
                        $divide: [
                           { $subtract: ["$expiryDate", today] },
                           1000 * 60 * 60 * 24,
                        ],
                     },
                  },
               },
            },
            {
               $match: {
                  daysUntilExpiry: { $lte: days },
               },
            },
            {
               $addFields: {
                  urgency: {
                     $switch: {
                        branches: [
                           {
                              case: { $lte: ["$daysUntilExpiry", 0] },
                              then: "expired",
                           },
                           {
                              case: { $lte: ["$daysUntilExpiry", 7] },
                              then: "critical",
                           },
                        ],
                        default: "warning",
                     },
                  },
               },
            },
            {
               $sort: { daysUntilExpiry: 1 },
            },
         ])
         .toArray();

      res.status(200).json(expiringResources);
   } catch (error) {
      console.error("Error fetching expiring resource:", error);
      res.status(500).json({ error: "Failed to fetch expiring resources" });
   }
});

export default router;
