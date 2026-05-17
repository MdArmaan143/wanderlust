require('dotenv').config();
const { generateText } = require('ai');
const { createGoogleGenerativeAI } = require('@ai-sdk/google');
const google = createGoogleGenerativeAI({ apiKey: process.env.GEMINI_API_KEY });
async function test() {
  try {
    const res = await generateText({
      model: google('gemini-2.5-flash', { thinkingConfig: { thinkingBudget: 0 } }),
      messages: [{role: 'user', content: 'Say hello in exactly 3 words'}]
    });
    console.log('generateText result:', res.text);
  } catch(e) {
    console.log('generateText error:', e.message);
  }
}
test();
