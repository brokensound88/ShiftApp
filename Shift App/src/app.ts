// src/app.ts

import express from 'express';
import { Request, Response } from 'express';
import { Shift } from './types';

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());

// Sample data
let shifts: Shift[] = [];

// Routes
app.get('/shifts', (req: Request, res: Response) => {
    res.json(shifts);
});

app.post('/shifts', (req: Request, res: Response) => {
    const newShift: Shift = req.body;
    shifts.push(newShift);
    res.status(201).json(newShift);
});

// Start the server
app.listen(PORT, () => {
    console.log(`Shift App is running on http://localhost:${PORT}`);
});