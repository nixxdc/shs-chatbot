/**
 * SICM AI Assistant - Final Script
 * Match this with your Full-Screen HTML and CSS
 */

async function sendMessage() {
    // 1. Get Elements (Matched with your index.html IDs)
    const inputField = document.getElementById("userInput"); 
    const chatBox = document.getElementById("chatBox");
    const typingIndicator = document.getElementById("typing");

    if (!inputField || !chatBox) return;

    const message = inputField.value.trim();
    if (!message) return;

    // 2. Display User Message
    const userDiv = document.createElement("div");
    userDiv.className = "message user"; // Matches CSS '.message.user'
    userDiv.innerHTML = `<b>You:</b> ${escapeHTML(message)}`;
    
    // Insert before the typing indicator
    chatBox.insertBefore(userDiv, typingIndicator);

    // Clear and Scroll
    inputField.value = "";
    scrollToBottom();

    // 3. Show the built-in Typing Indicator
    typingIndicator.style.display = "block";
    scrollToBottom();

    try {
        // 4. Fetch from Node.js Backend
        const res = await fetch("http://localhost:3000/chat", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ message: message })
        });

        const data = await res.json();

        // Hide typing indicator
        typingIndicator.style.display = "none";

        if (!res.ok) throw new Error(data.reply || data.error || "Server error");

        // 5. Display Bot Response with Markdown Parsing
        const botDiv = document.createElement("div");
        botDiv.className = "message bot"; // Matches CSS '.message.bot'
        
        // Convert Gemini's Markdown to HTML
        const htmlContent = marked.parse(data.reply);
        
        botDiv.innerHTML = `<div class="message-content">${htmlContent}</div>`;
        chatBox.insertBefore(botDiv, typingIndicator);

    } catch (error) {
        typingIndicator.style.display = "none";
        
        const errorDiv = document.createElement("div");
        errorDiv.className = "message bot error"; 
        errorDiv.style.color = "red";
        errorDiv.innerHTML = `<b>System:</b> ${error.message}`;
        chatBox.insertBefore(errorDiv, typingIndicator);
    }

    scrollToBottom();
}

/** * HELPER FUNCTIONS 
 */

function scrollToBottom() {
    const chatBox = document.getElementById("chatBox");
    chatBox.scrollTop = chatBox.scrollHeight;
}

function escapeHTML(str) {
    return str.replace(/[&<>"']/g, m => ({
        '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    }[m]));
}

// Enter Key Listener (Updated to match ID 'userInput')
document.getElementById("userInput").addEventListener("keypress", function(event) {
    if (event.key === "Enter") {
        event.preventDefault();
        sendMessage();
    }
});

// Send Button Listener (If you kept the id 'sendBtn' in HTML)
document.getElementById("sendBtn").onclick = sendMessage;