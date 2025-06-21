import express from 'express';
import cors from 'cors';
import axios from 'axios';
import dotenv from 'dotenv';
import { HttpsProxyAgent } from 'https-proxy-agent';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// 环境变量
const OPENAI_API_KEY = process.env.OPENAI_API_KEY!;
const OPENAI_API_URL = process.env.OPENAI_API_URL!;                // OpenAI 接口地址
const CHATGPT_PROXY = process.env.CHATGPT_PROXY;                   // 只用于 ChatGPT 的代理地址
const DEEPSEEK_API_URL = process.env.DEEPSEEK_API_URL!;            // DeepSeek 接口地址
const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY!;            // DeepSeek Key

// 针对 ChatGPT 专用的代理 Agent
const chatAgent = CHATGPT_PROXY ? new HttpsProxyAgent(CHATGPT_PROXY) : undefined;

// === ChatGPT 路由，使用专属代理 ===
app.post('/api/chat', async (req, res) => {
  const { message, model } = req.body;
  try {
    const response = await axios.post(
      OPENAI_API_URL,
      {
        model: model || 'gpt-4o',
        messages: [
          { role: 'system', content: 'You are a helpful assistant.' },
          { role: 'user', content: message },
        ],
        stream: false,
      },
      {
        headers: {
          Authorization: `Bearer ${OPENAI_API_KEY}`,
          'Content-Type': 'application/json',
        },
        httpsAgent: chatAgent,
      }
    );
    res.json({ result: response.data.choices[0].message.content });
  } catch (err: any) {
    console.error('OpenAI /api/chat Error:', err.response?.data || err.message);
    res.status(500).json({ error: '调用 OpenAI /api/chat 失败' });
  }
});

// === DeepSeek 路由，默认网络（无代理） ===
app.post('/api/deepseek', async (req, res) => {
  const { message } = req.body;
  try {
    const response = await axios.post(
      DEEPSEEK_API_URL,
      {
        model: 'deepseek-chat',
        messages: [
          { role: 'system', content: 'You are DeepSeek, a focused QA assistant.' },
          { role: 'user', content: message },
        ],
        stream: false,
      },
      {
        headers: {
          Authorization: `Bearer ${DEEPSEEK_API_KEY}`,
          'Content-Type': 'application/json',
        },
      }
    );
    res.json({ result: response.data.choices[0].message.content });
  } catch (err: any) {
    console.error('DeepSeek API Error:', err.response?.data || err.message);
    res.status(500).json({ error: '调用 DeepSeek API 失败' });
  }
});

const PORT = 3001;
app.listen(PORT, () => console.log(`Server is running on http://localhost:${PORT}`));
