async function sendMessage() {
    const inputField = document.getElementById("userInput"); 
    const chatBox = document.getElementById("chatBox");
    const typingIndicator = document.getElementById("typing");

    // Safety check to ensure HTML elements exist
    if (!inputField || !chatBox || !typingIndicator) return;

    const message = inputField.value.trim();
    if (!message) return;

    // 1. Display User Message in the Chat Box
    const userDiv = document.createElement("div");
    userDiv.className = "message user";
    userDiv.innerHTML = `<b>You:</b> ${escapeHTML(message)}`;
    chatBox.insertBefore(userDiv, typingIndicator);

    // Clear input and scroll down
    inputField.value = "";
    scrollToBottom();

    // 2. Show the "Typing..." Indicator
    typingIndicator.style.display = "block";
    scrollToBottom();

    try {
        // 3. Send Message to the Backend (server.js via Vercel Route)
        const res = await fetch("/api/chat", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ message: message })
        });

        const data = await res.json();

        // Hide typing indicator now that we have a response
        typingIndicator.style.display = "none";

        // Handle Rate Limiting (Free Tier)
        if (res.status === 429) {
            throw new Error("The assistant is a bit busy. Please wait a minute, Isabelan!");
        }

        if (!res.ok) {
            throw new Error(data.reply || data.error || "Something went wrong.");
        }

        // 4. Create Bot Message Bubble
        const botDiv = document.createElement("div");
        botDiv.className = "message bot"; 
        
        // Parse Markdown (using 'marked' library if you linked it in index.html)
        const htmlContent = typeof marked !== 'undefined' 
            ? marked.parse(data.reply) 
            : data.reply;
        
        botDiv.innerHTML = `<div class="message-content">${htmlContent}</div>`;
        chatBox.insertBefore(botDiv, typingIndicator);

    } catch (error) {
        typingIndicator.style.display = "none";
        
        // Display Error Message to User
        const errorDiv = document.createElement("div");
        errorDiv.className = "message bot error"; 
        errorDiv.style.color = "#d9534f"; // Soft red
        errorDiv.innerHTML = `<b>System:</b> ${error.message}`;
        chatBox.insertBefore(errorDiv, typingIndicator);
    }

    scrollToBottom();
}

/**
 * Helper to auto-scroll to the latest message
 */
function scrollToBottom() {
    const chatBox = document.getElementById("chatBox");
    if (chatBox) {
        chatBox.scrollTop = chatBox.scrollHeight;
    }
}

/**
 * Simple HTML Escaper for Security
 */
function escapeHTML(str) {
    return str.replace(/[&<>"']/g, m => ({
        '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    }[m]));
}

/**
 * Event Listeners - Runs once the page loads
 */
document.addEventListener("DOMContentLoaded", () => {
    const input = document.getElementById("userInput");
    const button = document.getElementById("sendBtn");

    // Allow "Enter" key to send message
    if (input) {
        input.addEventListener("keypress", (e) => {
            if (e.key === "Enter") {
                e.preventDefault();
                sendMessage();
            }
        });
    }

    // Connect Click Event to the Button
    if (button) {
        button.addEventListener("click", sendMessage);
    }
});