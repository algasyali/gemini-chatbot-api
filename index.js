const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const { // Import the specific error class for better handling
    GoogleGenerativeAIAbortError,
    GoogleGenerativeAI
} = require('@google/generative-ai');

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static('public'));

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({
    model: 'gemini-1.5-flash'
});

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});

app.post('/api/chat', async (req, res) => {
    const userMessage = req.body.message;
    if (!userMessage) {
        return res.status(400).json({
            error: 'No message provided'
        });

    }
    try {
        // Add a 20-second timeout to the API call to prevent it from hanging indefinitely.
        // This is shorter than the frontend's 30-second timeout.
        const result = await model.generateContent(userMessage, { requestOptions: { timeout: 20000 } });
        const response = result.response;
        const text = response.text();
        res.json({
            reply: text
        });
    } catch (error) {
        console.error('Error calling Gemini API:', error);
        // Specifically handle timeout errors from the Gemini SDK
        if (error instanceof GoogleGenerativeAIAbortError) {
            return res.status(504).json({ error: "Request to Gemini timed out. This might be due to an invalid API key or network issues." });
        }
        res.status(500).json({
            error: "An error occurred while processing your request."
        })
    }
});