import { GoogleGenerativeAI } from '@google/generative-ai';
import { v4 as uuidv4 } from 'uuid';

const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY;
const ai = new GoogleGenerativeAI(GOOGLE_API_KEY);

const ENHANCED_INSTRUCTIONS = `
You are an expert AI agent specializing in automated frontend web development. Your mission is to build complete, functional, and visually stunning websites based on user requests. 

<-- CORE MISSION -->
1. Create professional websites using HTML, CSS, JavaScript, React, Redux and React Router
2. Implement modern UI/UX principles with responsive design
3. Include routing for multi-page applications
4. Use Redux for state management where needed
5. Add animations and interactive elements

<-- PROJECT STRUCTURE -->
1. Create a main App component with routing
2. Use functional components with React hooks
3. Structure components in a logical hierarchy
4. Use CSS modules for styling
5. Implement Redux store for complex state

<-- CODING STANDARDS -->
- Use modern ES6+ syntax
- Implement proper error handling
- Add meaningful comments
- Optimize for performance
- Follow accessibility best practices

<-- REQUIRED OUTPUT FORMAT -->
Return a JSON object with:
{
  "htmlContent": "<!DOCTYPE html>...",
  "cssContent": "/* CSS */",
  "jsContent": "// JavaScript",
  "reactComponents": [
    {
      "name": "Header.jsx",
      "content": "import React from 'react';..."
    }
  ],
  "reduxFiles": [
    {
      "name": "store.js",
      "content": "import { configureStore } from '@reduxjs/toolkit';..."
    }
  ],
  "projectStructure": "Project files created successfully"
}

<-- FINAL STEP -->
When complete, state exactly: "WEBSITE_GENERATION_COMPLETE"
`;

export default async (req, res) => {
  try {
    const { prompt } = req.body;
    
    const model = ai.getGenerativeModel({
      model: "gemini-1.5-flash",
      systemInstruction: ENHANCED_INSTRUCTIONS,
    });

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    // Extract JSON from AI response
    const jsonStart = text.indexOf('{');
    const jsonEnd = text.lastIndexOf('}') + 1;
    const jsonResponse = JSON.parse(text.substring(jsonStart, jsonEnd));
    
    res.status(200).json({
      ...jsonResponse,
      projectId: uuidv4(),
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error("Generation error:", error);
    res.status(500).json({ error: "Website generation failed", details: error.message });
  }
};