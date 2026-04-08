import dotenv from "dotenv";
dotenv.config();
import express from "express";
import cors from "cors";
import fs from "fs";
import path from "path";
import { GoogleGenerativeAI } from "@google/generative-ai";

const app = express();

// 1. Basic Middleware
app.use(cors());
app.use(express.json());

// 2. Pre-load Knowledge Base (Done once when the function wakes up)
let knowledgeBaseText = "";
try {
    const kbPath = path.join(process.cwd(), "KnowledgeBase.json");
    if (fs.existsSync(kbPath)) {
        const rawData = fs.readFileSync(kbPath, "utf-8");
        const parsedData = JSON.parse(rawData);
        knowledgeBaseText = parsedData.knowledge
            .map(item => `Topic: ${item.topic}\nContent: ${item.content}`)
            .join("\n\n");
        console.log("✅ Knowledge Base loaded successfully.");
    } else {
        console.error("❌ KnowledgeBase.json not found at:", kbPath);
    }
} catch (err) {
    console.error("❌ Error processing KnowledgeBase.json:", err.message);
}

// 3. The Chat Route
app.post("/api/chat", async (req, res) => {
    // Check if API Key is present in the terminal logs
    console.log("Incoming request. API Key present:", !!process.env.GEMINI_API_KEY);

    try {
        const { message } = req.body;
        if (!message) return res.status(400).json({ error: "No message provided" });

        if (!process.env.GEMINI_API_KEY) {
            throw new Error("GEMINI_API_KEY is missing from environment variables.");
        }

// Inside app.post
// Inside your app.post in server.js
        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
        const model = genAI.getGenerativeModel({ 
            model: "gemini-1.5-latest",
        },)

        // Build the system prompt dynamically
        const systemPrompt = `
            You are the official SICM AI Assistant for Santa Isabel College of Manila (located in Ermita, Manila).
            
            STRICT RULES:
            1. Use ONLY the following Knowledge Base to answer questions.
            2. If the answer isn't in the Knowledge Base, politely say you don't have that info and refer them to admissions@santaisabel.edu.ph.
            3. Never suggest other locations or schools.
            4. Be professional and call the students 'Isabelans'.

            KNOWLEDGE BASE:
            ${knowledgeBaseText}

            User Question: ${message}
        `;

        // Generate content
        const result = await model.generateContent(systemPrompt);
        const response = await result.response;
        const text = response.text();
        
        // Send back the reply
        res.json({ reply: text });

    } catch (error) {
        // Detailed error logging for your VS Code terminal
        console.error("--- DEBUG ERROR START ---");
        console.error("Message:", error.message);
        if (error.response) console.error("Response Data:", error.response.data);
        console.error("--- DEBUG ERROR END ---");

        // Friendly error for the Isabelan user
        let errorMessage = "The assistant is busy. Please try again.";
        if (error.message.includes("429")) errorMessage = "System busy (Rate limit). Please wait 1 minute.";
        
        res.status(500).json({ error: errorMessage });
    }
});

// 4. Export for Vercel
export default app;