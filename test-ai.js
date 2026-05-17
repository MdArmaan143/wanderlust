require('dotenv').config();
const { streamText } = require('ai');
const { createGoogleGenerativeAI } = require('@ai-sdk/google');
const google = createGoogleGenerativeAI({ apiKey: process.env.GEMINI_API_KEY });
async function test() {
  const models = ['gemini-2.0-flash', 'gemini-2.0-flash-lite', 'gemini-1.5-flash-latest'];
  for (let m of models) {
    try {
      console.log('Testing', m);
      const res = await streamText({ model: google(m), messages: [{role: 'user', content: 'Say hello in 5 words'}] });
      let out = '';
      for await (const chunk of res.textStream) {
        out += chunk;
      }
      console.log('\nResult length:', out.length, 'Output:', out);
    } catch(e) { console.log('\nError:', e.message.substring(0,200)); }
  }
}
test();
