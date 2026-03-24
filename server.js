import express from "express";
import cors from "cors"; // 1. Use ONLY this import
import dotenv from "dotenv";
import fs from "fs";
import { GoogleGenerativeAI } from "@google/generative-ai";

dotenv.config();

const app = express();

app.use(cors()); 
app.use(express.json());


let knowledgeBaseText = "";
try {
    const rawData = fs.readFileSync("./KnowledgeBase.json", "utf-8");
    const parsedData = JSON.parse(rawData);
    knowledgeBaseText = parsedData.knowledge
        .map(item => `Topic: ${item.topic}\nContent: ${item.content}`)
        .join("\n\n");
} catch (err) {
    console.error("❌ Error reading KnowledgeBase.json:", err.message);
}

// 4. Initialize Gemini
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const model = genAI.getGenerativeModel({ 
    model: "gemini-1.5-flash", // Use 1.5-flash as it's the most stable current version
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

// 5. Chat Route
app.post("/chat", async (req, res) => {
    try {
        const { message } = req.body;
        console.log("📩 Message from Isabelan:", message);

        if (!message) return res.status(400).json({ error: "No message provided" });

        const result = await model.generateContent(message);
        const response = await result.response;
        
        res.json({ reply: response.text() });

    } catch (error) {
        console.error("DEBUG ERROR:", error.message);
        res.status(500).json({ error: "The assistant is busy. Please try again." });
    }
});

// 6. Start Server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 SICM Server running on port ${PORT}`));