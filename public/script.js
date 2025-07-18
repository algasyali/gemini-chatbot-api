document.addEventListener('DOMContentLoaded', () => {
    const chatForm = document.getElementById('chat-form');
    const userInput = document.getElementById('user-input');
    const chatBox = document.getElementById('chat-box');

    chatForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const userMessage = userInput.value.trim();
        if (!userMessage) {
            return;
        }

        // Display user's message
        appendMessage('You', userMessage);
        userInput.value = '';

        // Display a thinking indicator
        const thinkingIndicator = appendMessage('Gemini', 'Thinking...');

        try {
            // Abort the request if it takes longer than 30 seconds
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 30000);

            const response = await fetch('/api/chat', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ message: userMessage }),
                signal: controller.signal, // Pass the abort signal to fetch
            });

            // Clear the timeout if the request completes in time
            clearTimeout(timeoutId);

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.error || 'An error occurred.');
            }

            const data = await response.json();
            
            // Update the thinking indicator with the actual reply
            thinkingIndicator.querySelector('.message-text').textContent = data.reply;

        } catch (error) {
            console.error('Error:', error);
            let errorMessage = error.message;
            if (error.name === 'AbortError') {
                // Provide a more user-friendly message for timeouts
                errorMessage = 'The request timed out as the server took too long to respond.';
            }
            thinkingIndicator.querySelector('.message-text').textContent = `Sorry, I encountered an error: ${errorMessage}`;
            thinkingIndicator.classList.add('error');
        }
    });

    function appendMessage(sender, message) {
        const messageElement = document.createElement('div');
        messageElement.classList.add('message', `${sender.toLowerCase()}-message`);
        
        const senderElement = document.createElement('strong');
        senderElement.textContent = `${sender}: `;
        
        const messageTextElement = document.createElement('span');
        messageTextElement.classList.add('message-text');
        messageTextElement.textContent = message;

        messageElement.appendChild(senderElement);
        messageElement.appendChild(messageTextElement);
        
        chatBox.appendChild(messageElement);
        chatBox.scrollTop = chatBox.scrollHeight; // Auto-scroll to the bottom
        return messageElement;
    }
});