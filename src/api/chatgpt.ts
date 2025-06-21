import axios from 'axios';

/**
 * 向后端代理请求 ChatGPT 回复
 */
export async function askChatGPT(question: string): Promise<string> {
  try {
    const response = await axios.post('/api/chat', {
      message: question,
      model: 'gpt-4o', 
    });
    return response.data.result;
  } catch (error: any) {
    console.error('调用后端 /api/chat 失败：', error.response?.data || error.message);
    return '出错了，请稍后再试。';
  }
}
