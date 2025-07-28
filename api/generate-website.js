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
Return STRICTLY ONLY a JSON object with this EXACT structure:
{
  "htmlContent": "<!DOCTYPE html>...",
  "cssContent": "/* CSS */",
  "jsContent": "// JavaScript",
  "reactComponents": [],
  "reduxFiles": [],
  "projectStructure": "Description"
}

<-- CRITICAL RULES -->
1. NEVER include markdown syntax (no \`\`\`json)
2. NEVER add explanations before/after the JSON
3. ALWAYS escape special characters in strings
4. If unsure about content, return empty strings/arrays
5. If error occurs, return: { "error": "description" }
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
    // Validate request body
    if (!req.body || typeof req.body !== 'object') {
      return res.status(400).json({ error: 'Invalid request body' });
    }

    const { prompt } = req.body;
    
    // Validate prompt
    if (!prompt || typeof prompt !== 'string' || prompt.length > 1000) {
      return res.status(400).json({ 
        error: 'Prompt must be a string (max 1000 characters)' 
      });
    }

    const model = ai.getGenerativeModel({
      model: "gemini-1.5-flash",
      systemInstruction: ENHANCED_INSTRUCTIONS,
    });

    // Generate content with strict instructions
    const result = await model.generateContent({
      contents: [{
        role: 'user',
        parts: [{
          text: `Generate website code in EXACT required JSON format for: ${prompt}`
        }]
      }]
    });
    
    const response = result.response;
    const text = response.text();
    
    // More robust JSON extraction
    const jsonStart = Math.max(
      text.indexOf('{'),
      text.indexOf('[')
    );
    
    const jsonEnd = Math.max(
      text.lastIndexOf('}'),
      text.lastIndexOf(']')
    ) + 1;
    
    if (jsonStart === -1 || jsonEnd === 0) {
      throw new Error('No valid JSON found in response');
    }
    
    const jsonString = text.slice(jsonStart, jsonEnd);
    const parsedResponse = JSON.parse(jsonString);
    
    // Validate response structure
    if (parsedResponse.error) {
      return res.status(400).json(parsedResponse);
    }
    
    if (!parsedResponse.htmlContent) {
      throw new Error('Invalid response format from AI');
    }

    // Successful response
    return res.status(200).json({
      ...parsedResponse,
      projectId: uuidv4(),
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error("Generation error:", error);
    
    // More specific error handling
    const errorResponse = {
      error: "Website generation failed",
      details: error.message,
      type: error.name || "API_ERROR"
    };
    
    if (error instanceof SyntaxError) {
      errorResponse.type = "INVALID_JSON";
      errorResponse.details = "AI returned malformed response";
    }
    
    return res.status(500).json(errorResponse);
  }
};