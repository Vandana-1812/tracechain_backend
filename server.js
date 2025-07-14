    // server.js
    const express = require('express');
    const cors = require('cors');
    const app = express();
    const port = process.env.PORT || 3000; // Render will set process.env.PORT

    // Configure CORS
    // IMPORTANT: Replace 'https://your-netlify-app-url.netlify.app' with your actual Netlify URL.
    // For local development, you might add 'http://localhost:5000' or whatever port your frontend runs on.
    const corsOptions = {
        origin: ['https://stunning-treacle-e760d9.netlify.app', 'http://localhost:5500'], // Add your Netlify URL and Live Server URL
        methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
        credentials: true, // Allow cookies to be sent
        optionsSuccessStatus: 204
    };
    app.use(cors(corsOptions));

    // Middleware to parse JSON request bodies
    app.use(express.json());

    // --- Backend API Endpoints ---

    // Example: A simple GET endpoint
    app.get('/', (req, res) => {
        res.send('TraceChain Backend is running!');
    });

    // Example: An API endpoint to get a generic message
    app.get('/api/message', (req, res) => {
        res.json({ message: 'Hello from TraceChain Backend!', timestamp: new Date().toISOString() });
    });

    // Example: An API endpoint that takes data and responds
    app.post('/api/process-data', (req, res) => {
        const { inputData } = req.body;
        if (!inputData) {
            return res.status(400).json({ error: 'inputData is required' });
        }
        res.json({
            received: inputData,
            processed: `Backend processed: ${inputData.toUpperCase()}`,
            status: 'success'
        });
    });

    // Start the server
    app.listen(port, () => {
        console.log(`TraceChain Backend listening at http://localhost:${port}`);
    });
