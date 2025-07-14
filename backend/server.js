    // server.js
    const express = require('express');
    const cors = require('cors');
    const app = express();
    const port = process.env.PORT || 3000; // Render will set process.env.PORT

    // Configure CORS
    // Configure CORS for local development and production
    const corsOptions = {
        origin: [
            'https://stunning-treacle-e760d9.netlify.app', 
            'http://localhost:5500', 
            'http://localhost:8000',
            'http://127.0.0.1:8000',
            'http://localhost:3000' // Allow same-origin requests
        ],
        methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
        credentials: true,
        optionsSuccessStatus: 204
    };
    app.use(cors(corsOptions));

    // Add logging middleware for debugging
    app.use((req, res, next) => {
        console.log(`${new Date().toISOString()} - ${req.method} ${req.url} - Origin: ${req.headers.origin}`);
        next();
    });

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
