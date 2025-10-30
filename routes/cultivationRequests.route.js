const express = require("express");
const router = express.Router();
const { verifyJWT } = require("../middleware/verifyJWT");
const CultivationRequest = require("../models/cultivationRequest.model");

// Get all cultivation requests for the current farmer
router.get("/cultivation-requests", verifyJWT, async (req, res) => {
   try {
      const requests = await CultivationRequest.find({ farmerId: req.user.uid })
         .populate("instructionId")
         .populate("fieldId")
         .sort("-createdAt");
      res.json(requests);
   } catch (error) {
      res.status(500).json({ error: error.message });
   }
});

// Get cultivation request by ID
router.get("/cultivation-requests/:id", verifyJWT, async (req, res) => {
   try {
      const request = await CultivationRequest.findOne({
         _id: req.params.id,
         farmerId: req.user.uid,
      })
         .populate("instructionId")
         .populate("fieldId");

      if (!request) {
         return res
            .status(404)
            .json({ error: "Cultivation request not found" });
      }
      res.json(request);
   } catch (error) {
      res.status(500).json({ error: error.message });
   }
});

// Create new cultivation request
router.post("/cultivation-requests", verifyJWT, async (req, res) => {
   try {
      const request = new CultivationRequest({
         ...req.body,
         farmerId: req.user.uid,
      });
      await request.save();
      res.status(201).json(request);
   } catch (error) {
      res.status(400).json({ error: error.message });
   }
});

// Update cultivation request progress
router.put(
   "/cultivation-requests/:id/progress",
   verifyJWT,
   async (req, res) => {
      try {
         const { currentPhase, completedTasks } = req.body;
         const request = await CultivationRequest.findOneAndUpdate(
            { _id: req.params.id, farmerId: req.user.uid },
            {
               "progress.currentPhase": currentPhase,
               "progress.completedTasks": completedTasks,
               ...(req.body.status && { status: req.body.status }),
               ...(req.body.actualEndDate && {
                  actualEndDate: req.body.actualEndDate,
               }),
            },
            { new: true }
         );

         if (!request) {
            return res
               .status(404)
               .json({ error: "Cultivation request not found" });
         }
         res.json(request);
      } catch (error) {
         res.status(400).json({ error: error.message });
      }
   }
);

// Cancel cultivation request
router.put("/cultivation-requests/:id/cancel", verifyJWT, async (req, res) => {
   try {
      const request = await CultivationRequest.findOneAndUpdate(
         { _id: req.params.id, farmerId: req.user.uid },
         { status: "cancelled" },
         { new: true }
      );

      if (!request) {
         return res
            .status(404)
            .json({ error: "Cultivation request not found" });
      }
      res.json(request);
   } catch (error) {
      res.status(400).json({ error: error.message });
   }
});

export default router;
