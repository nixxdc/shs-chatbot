import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import fs from "fs";
import { GoogleGenerativeAI } from "@google/generative-ai";

dotenv.config();
const cors = require('cors');
const app = express();
app.use(cors());
app.use(express.json());


// 1. Read the entire Knowledge Base as a String
const rawData = fs.readFileSync("./KnowledgeBase.json", "utf-8");
const knowledgeBaseText = JSON.parse(rawData).knowledge
    .map(item => `Topic: ${item.topic}\nContent: ${item.content}`)
    .join("\n\n");

// 2. Initialize the model with the WHOLE Knowledge Base in the System Instruction
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const model = genAI.getGenerativeModel({ 
    model: "gemini-2.5-flash",
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

// 3. Simplified Chat Route (No more manual searching!)
app.post("/chat", async (req, res) => {
    try {
        const { message } = req.body;
        console.log("📩 Message from Isabelan:", message);

        // We just send the message. The AI already "knows" the whole JSON.
        const result = await model.generateContent(message);
        const response = await result.response;
        
        res.json({ reply: response.text() });

    } catch (error) {
        console.error("DEBUG ERROR:", error.message);
        res.status(500).json({ error: "The assistant is busy. Please try again." });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));