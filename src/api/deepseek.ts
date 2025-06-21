import axios from 'axios';

/**
 * 向后端代理请求 DeepSeek 回复
 */
export async function askDeepSeek(question: string): Promise<string> {
  try {
    const response = await axios.post('/api/deepseek', {
      message: question,
    });
    return response.data.result;
  } catch (error: any) {
    console.error('调用后端 /api/deepseek 失败：', error.response?.data || error.message);
    return '出错了，请稍后再试。';
  }
}
