const express = require("express");
const router = express.Router();
const { GoogleGenerativeAI } = require("@google/generative-ai");

// Initialize Google Generative AI
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const SYSTEM_PROMPT = `You are Wander AI, an expert AI travel assistant for Wanderlust — a premium travel and stay booking platform similar to Airbnb.

Your role is to:
- Help users find the best travel destinations and stays
- Give personalized property and destination recommendations based on preferences (budget, type of stay, activities, season)
- Provide travel tips, packing advice, and cultural insights
- Describe types of accommodations (mountains, castles, farms, glamping, boats, arctic domes, etc.)
- Suggest itineraries and things to do at destinations
- Answer questions about specific listings or property types
- Help users choose between destinations

Always be warm, enthusiastic about travel, knowledgeable, and concise. Use emojis occasionally to make responses feel friendly. Format responses with clear sections when listing multiple items. Focus on India and global destinations.

When asked about a specific property or listing, use the context provided to give relevant insights about that location, nearby attractions, best time to visit, and what to expect from that type of stay.`;

// GET - Render AI chat page
router.get("/", (req, res) => {
  res.render("ai.ejs", { currUser: req.user || null });
});

// POST - AI chat endpoint (streaming SSE)
router.post("/chat", async (req, res) => {
  const { messages } = req.body;

  if (!messages || !Array.isArray(messages)) {
    return res.status(400).json({ error: "Messages array is required" });
  }

  // Format messages for Gemini native SDK
  const history = messages.slice(0, -1).map((msg) => ({
    role: msg.role === "user" ? "user" : "model",
    parts: [{ text: msg.content }],
  }));
  const lastMessage = messages[messages.length - 1].content;

  // Set SSE headers immediately
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.flushHeaders();

  // Use only gemini-2.5-flash as requested
  const MODEL = "gemini-2.5-flash";

  try {
    console.log(`[Wander AI] Streaming with model: ${MODEL}`);
    const model = genAI.getGenerativeModel({
      model: MODEL,
      systemInstruction: SYSTEM_PROMPT,
    });

    const chat = model.startChat({ history });
    const streamResult = await chat.sendMessageStream(lastMessage);

    for await (const chunk of streamResult.stream) {
      const chunkText = chunk.text();
      if (chunkText) {
        res.write(`data: ${JSON.stringify({ text: chunkText })}\n\n`);
      }
    }
    res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
  } catch (err) {
    console.error(`[Wander AI] ${MODEL} error:`, err.message);
    const isQuota = err.message.includes("429") || err.message.includes("quota");
    const userMsg = isQuota
      ? "⚠️ The AI is currently busy or out of free quota. Please try again later."
      : "⚠️ AI service is unavailable. Please try again shortly.";
    res.write(`data: ${JSON.stringify({ error: userMsg })}\n\n`);
  } finally {
    res.end();
  }
});

module.exports = router;
