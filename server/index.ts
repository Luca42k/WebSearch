import express from 'express';
import cors from 'cors';
import axios from 'axios';
import dotenv from 'dotenv';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { HttpsProxyAgent } from 'https-proxy-agent';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';

// 使用 createRequire 加载 CommonJS 模块
const requireCJS = createRequire(import.meta.url);
const pdfParse: typeof import('pdf-parse') = requireCJS('pdf-parse');

// ESM 环境下定义 __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// 环境变量
const OPENAI_API_KEY = process.env.OPENAI_API_KEY!;
const OPENAI_API_URL = process.env.OPENAI_API_URL!;
const CHATGPT_PROXY = process.env.CHATGPT_PROXY;
const DEEPSEEK_API_URL = process.env.DEEPSEEK_API_URL!;
const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY!;

// ChatGPT 代理 Agent
const chatAgent = CHATGPT_PROXY ? new HttpsProxyAgent(CHATGPT_PROXY) : undefined;

// === ChatGPT 路由 ===
app.post('/api/chat', async (req, res) => {
  const { message, model } = req.body;
  try {
    const response = await axios.post(
      OPENAI_API_URL,
      {
        model: model || 'gpt-4o',
        messages: [
          { role: 'system', content: 'You are a helpful assistant.' },
          { role: 'user', content: message }
        ],
        stream: false
      },
      {
        headers: {
          Authorization: `Bearer ${OPENAI_API_KEY}`,
          'Content-Type': 'application/json'
        },
        httpsAgent: chatAgent
      }
    );
    res.json({ result: response.data.choices[0].message.content });
  } catch (err: any) {
    console.error('OpenAI /api/chat Error:', err.response?.data || err.message);
    res.status(500).json({ error: '调用 OpenAI /api/chat 失败' });
  }
});

// === DeepSeek 路由 ===
app.post('/api/deepseek', async (req, res) => {
  const { message } = req.body;
  try {
    const response = await axios.post(
      DEEPSEEK_API_URL,
      {
        model: 'deepseek-chat',
        messages: [
          { role: 'system', content: 'You are DeepSeek, a focused QA assistant.' },
          { role: 'user', content: message }
        ],
        stream: false
      },
      {
        headers: {
          Authorization: `Bearer ${DEEPSEEK_API_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );
    res.json({ result: response.data.choices[0].message.content });
  } catch (err: any) {
    console.error('DeepSeek API Error:', err.response?.data || err.message);
    res.status(500).json({ error: '调用 DeepSeek API 失败' });
  }
});

// === 上传目录配置 ===
const uploadDir = path.resolve(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir);

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadDir),
  filename: (_req, file, cb) => {
    const timestamp = Date.now();
    const safeName = file.originalname.replace(/[^a-zA-Z0-9.\-]/g, '_');
    cb(null, `${timestamp}_${safeName}`);
  }
});
const upload = multer({ storage, fileFilter: (_req, file, cb) => {
  if (file.mimetype === 'application/pdf') cb(null, true);
  else cb(new Error('只支持 PDF 文件'));
}});
app.use('/uploads', express.static(uploadDir));
app.post('/api/upload', upload.single('pdf'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: '未接收到 PDF 文件' });
  res.json({ filename: req.file.filename, path: `/uploads/${req.file.filename}` });
});

// === 解析并问答 PDF 路由 ===
app.post('/api/parse-pdf', async (req, res) => {
  const { filename, question, model } = req.body as {
    filename: string;
    question: string;
    model: 'gpt' | 'deepseek';
  };
  try {
    // 解析 PDF
    const filePath = path.resolve(uploadDir, filename);
    const dataBuffer = fs.readFileSync(filePath);
    const pdfData = await pdfParse(dataBuffer);
    const text = pdfData.text;

    // 构建消息
    const messages = [
      { role: 'system', content: model === 'deepseek'
          ? 'You are DeepSeek, a PDF analysis assistant.'
          : 'You are a PDF analysis assistant.' },
      { role: 'user', content: `文档内容：\n${text}\n\n请回答：${question}` }
    ];

    // 选择 API
    const apiUrl   = model === 'deepseek' ? DEEPSEEK_API_URL   : OPENAI_API_URL;
    const apiKey   = model === 'deepseek' ? DEEPSEEK_API_KEY   : OPENAI_API_KEY;
    const agent    = model === 'deepseek' ? undefined           : chatAgent;
    const headers  = { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' };

    const aiResp = await axios.post(
      apiUrl,
      { model: model === 'deepseek' ? 'deepseek-chat' : 'gpt-4o', messages, stream: false },
      { headers, httpsAgent: agent }
    );
    res.json({ result: aiResp.data.choices[0].message.content });
  } catch (err: any) {
    console.error('Parse PDF Error:', err);
    res.status(500).json({ error: 'PDF 解析或 AI 调用失败' });
  }
});

// 启动服务
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`Server is running on http://localhost:${PORT}`));