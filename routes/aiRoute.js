// import express from 'express';
// import { ObjectId } from 'mongodb';
// import { getCollection } from '../config/db.js';

// const router = express.Router();





// // AI Route
// router.post('/aiFetch', async (req, res) => {
//     try {
//         const { prompt } = req.body;

//         const response = await ai.models.generateContent({
//             model: 'gemini-2.5-flash',
//             contents: [{ role: "user", parts: [{ text: prompt }] }],
//         });

//         // Send the AI response text back to the React client
//         res.json({ text: response.text });
//     } catch (error) {
//         console.error("Gemini API Error:", error);
//         res.status(500).json({ error: 'Failed to generate content' });
//     }
// });

// export default router;