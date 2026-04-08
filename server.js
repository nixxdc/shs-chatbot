import dotenv from "dotenv";
dotenv.config();
import express from "express";
import cors from "cors";
import fs from "fs";
import path from "path";
import { GoogleGenerativeAI } from "@google/generative-ai";

const app = express();
const __dirname = path.resolve();

// 1. Middleware
app.use(cors());
app.use(express.json());

// 2. Serve Static Files (Fixes "Cannot GET /")
// This tells Express to look into the 'public' folder for index.html, css, and js
app.use(express.static(path.join(__dirname, "public")));

// 3. Pre-load Knowledge Base
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

// 4. Chat Route
app.post("/api/chat", async (req, res) => {
    console.log("📩 Incoming request. API Key present:", !!process.env.GEMINI_API_KEY);

    try {
        const { message } = req.body;
        if (!message) return res.status(400).json({ error: "No message provided" });

        if (!process.env.GEMINI_API_KEY) {
            throw new Error("GEMINI_API_KEY is missing.");
        }

        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
        // Using the model version that worked for you locally
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

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

        const result = await model.generateContent(systemPrompt);
        const response = await result.response;
        res.json({ reply: response.text() });

    } catch (error) {
        console.error("--- DEBUG ERROR ---", error.message);
        res.status(500).json({ error: "The assistant is busy. Please try again." });
    }
});

// 5. Root Route (Fall-back to ensure index.html always loads)
app.get("*", (req, res) => {
    res.sendFile(path.join(__dirname, "public", "index.html"));
});

// Export for Vercel
export default app;