require('dotenv').config({ path: '.env.local' });
const { GoogleGenerativeAI } = require('@google/generative-ai');

async function testModels() {
  try {
    console.log("Using API Key:", process.env.VITE_GEMINI_API_KEY);
    const genAI = new GoogleGenerativeAI(process.env.VITE_GEMINI_API_KEY);
    
    console.log("Fetching models...");
    // The SDK does not expose listModels directly easily? Wait, it doesn't.
    // Let's use fetch directly.
    const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${process.env.VITE_GEMINI_API_KEY}`;
    const response = await fetch(url);
    const json = await response.json();
    
    if (json.error) {
      console.error("Google Error:", json.error);
    } else {
      const modelNames = json.models.map(m => m.name);
      console.log("Available models:");
      console.log(modelNames.join("\n"));
    }
  } catch (error) {
    console.error("Fetch error:", error);
  }
}

testModels();
