require('dotenv').config();
const { GoogleGenerativeAI } = require('@google/generative-ai');
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

async function test() {
  const models = ['gemini-2.5-pro', 'gemini-2.5-flash', 'gemini-2.0-flash'];
  for (let m of models) {
    try {
      console.log('Testing', m);
      const model = genAI.getGenerativeModel({ model: m });
      const result = await model.generateContentStream('Say hello in exactly 5 words');
      let out = '';
      for await (const chunk of result.stream) {
        out += chunk.text();
      }
      console.log('Result length:', out.length, 'Output:', out);
    } catch(e) {
      console.log('Error:', e.message.substring(0,200));
    }
  }
}
test();
