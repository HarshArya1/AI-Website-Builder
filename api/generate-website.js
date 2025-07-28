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

<-- IMPORTANT RULES -->
1. ALWAYS return valid JSON - no additional text before or after
2. If you encounter an error, return: { "error": "description" }
3. Use double quotes for all JSON properties
4. Escape special characters properly
`;

export default async (req, res) => {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  // Handle OPTIONS request
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { prompt } = req.body;
    if (!prompt) {
      return res.status(400).json({ error: 'Prompt is required' });
    }

    const model = ai.getGenerativeModel({
      model: "gemini-1.5-flash",
      systemInstruction: ENHANCED_INSTRUCTIONS,
    });

    const result = await model.generateContent(`
      Generate website based on the following prompt:
      "${prompt}"
      
      IMPORTANT: Return ONLY valid JSON in the required format. No additional text.
    `);
    
    const response = result.response;
    const text = response.text();
    
    // Clean the response
    let cleanedText = text.trim();
    
    // Remove markdown code blocks
    if (cleanedText.startsWith('```json')) {
      cleanedText = cleanedText.slice(7);
    }
    if (cleanedText.endsWith('```')) {
      cleanedText = cleanedText.slice(0, -3);
    }
    
    // Parse the JSON response
    const parsedResponse = JSON.parse(cleanedText);
    
    // Return the successful response
    res.status(200).json({
      ...parsedResponse,
      projectId: uuidv4(),
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error("Generation error:", error);
    res.status(500).json({ 
      error: "Website generation failed", 
      details: error.message,
      type: "JSON_PARSE_ERROR"
    });
  }
};