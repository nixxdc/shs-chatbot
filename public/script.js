import dotenv from "dotenv";
dotenv.config();
import express from "express";
import cors from "cors";
import fs from "fs";
import path from "path";
import { GoogleGenerativeAI } from "@google/generative-ai";

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// 1. Load Knowledge Base
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

// 2. Initialize Gemini
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ 
    model: "gemini-1.5-flash", 
    systemInstruction: `
        You are the official SICM AI Assistant for Santa Isabel College of Manila.
        
        STRICT RULES:
        1. Use ONLY the following Knowledge Base to answer questions.
        2. If the answer isn't in the Knowledge Base, politely say you don't have that specific info and refer them to admissions@santaisabel.edu.ph.
        3. Never suggest other schools or locations like Brazil or Argentina. You are in Ermita, Manila.
        4. Be helpful, professional, and call the students 'Isabelans'.

        KNOWLEDGE BASE:
        ${knowledgeBaseText}
    `
});

// 3. Chat Route
app.post("/api/chat", async (req, res) => {
    try {
        const { message } = req.body;
        if (!message) return res.status(400).json({ error: "No message provided" });

        const result = await model.generateContent(message);
        const response = await result.response;
        
        res.json({ reply: response.text() });

    } catch (error) {
        console.error("DEBUG ERROR:", error.message);
        // Handle Gemini Rate Limits (Free Tier)
        if (error.message.includes("429")) {
            return res.status(429).json({ error: "The assistant is busy. Please try again in a minute." });
        }
        res.status(500).json({ error: "Internal Server Error" });
    }
});

// Export for Vercel
export default app;