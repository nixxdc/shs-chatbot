import dotenv from "dotenv";
dotenv.config();
import express from "express";
import cors from "cors";
import fs from "fs";
import path from "path"; // 1. Add this
import { GoogleGenerativeAI } from "@google/generative-ai";

const app = express();

app.use(cors());
app.use(express.json());

// 2. Use path.join for the Knowledge Base
let knowledgeBaseText = "";
try {
    const kbPath = path.join(process.cwd(), "KnowledgeBase.json"); 
    const rawData = fs.readFileSync(kbPath, "utf-8");
    const parsedData = JSON.parse(rawData);
    knowledgeBaseText = parsedData.knowledge
        .map(item => `Topic: ${item.topic}\nContent: ${item.content}`)
        .join("\n\n");
} catch (err) {
    console.error("❌ Error reading KnowledgeBase.json:", err.message);
}

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ 
    model: "gemini-1.5-flash",
    systemInstruction: `
        You are the official SICM AI Assistant for Santa Isabel College of Manila.
        ... (rest of your instructions) ...
        KNOWLEDGE BASE:
        ${knowledgeBaseText}
    `
});

app.post("/api/chat", async (req, res) => { // 3. Recommended: Change route to /api/chat
    try {
        const { message } = req.body;
        if (!message) return res.status(400).json({ error: "No message provided" });

        const result = await model.generateContent(message);
        const response = await result.response;
        res.json({ reply: response.text() });
    } catch (error) {
        console.error("DEBUG ERROR:", error.message);
        res.status(500).json({ error: "The assistant is busy. Please try again." });
    }
});

// 4. IMPORTANT: Export for Vercel and remove app.listen
export default app;