// resume-genie-backend/resumeGenerator.js
const PDFDocument = require('pdfkit');
const { Configuration, OpenAIApi } = require('openai');

// Initialize OpenAI (configure environment variable OPENAI_API_KEY on host)
const configuration = new Configuration({ apiKey: process.env.OPENAI_API_KEY });
const openai = new OpenAIApi(configuration);

async function generateResume(data) {
  // Generate content via AI
  const prompt = `Create a professional resume for a candidate with the following details:\nName: ${data.name}\nExperience: ${data.experience}\nEducation: ${data.education}\nSkills: ${data.skills}`;
  const aiResponse = await openai.createCompletion({
    model: 'text-davinci-003',
    prompt,
    max_tokens: 500
  });
  const content = aiResponse.data.choices[0].text;

  // Create PDF in memory
  const doc = new PDFDocument();
  const buffers = [];
  doc.on('data', buffers.push.bind(buffers));
  doc.on('end', () => {});

  doc.fontSize(20).text(data.name, { underline: true });
  doc.moveDown();
  doc.fontSize(12).text(content);
  doc.end();

  return Buffer.concat(buffers);
}

module.exports = { generateResume };  

