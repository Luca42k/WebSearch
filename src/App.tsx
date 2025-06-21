import { useState, useRef, useEffect } from 'react';
import { Input, Button, Typography, Divider, Radio, Space, Upload, message } from 'antd';
import { UploadOutlined } from '@ant-design/icons';
import axios from 'axios';
import { askChatGPT } from './api/chatgpt';
import { askDeepSeek } from './api/deepseek';

const { TextArea } = Input;
const { Title, Text } = Typography;

type Message = {
  role: 'user' | 'assistant';
  content: string;
};

export default function App() {
  const [inputValue, setInputValue] = useState('');
  const [history, setHistory] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [model, setModel] = useState<'gpt' | 'deepseek'>('gpt');
  const [lastPdf, setLastPdf] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [history]);

  const handleAsk = async () => {
    const question = inputValue.trim();
    if (!question) return;
    setHistory(prev => [...prev, { role: 'user', content: question }]);
    setInputValue('');
    setLoading(true);

    try {
      if (lastPdf) {
        // PDF analysis flow for both models
        const resp = await axios.post('/api/parse-pdf', {
          filename: lastPdf,
          question,
          model, // pass the current model: 'gpt' or 'deepseek'
        });
        setHistory(prev => [...prev, { role: 'assistant', content: resp.data.result }]);
        setLastPdf(null);
      } else {
        // Regular chat flow
        const answer =
          model === 'gpt'
            ? await askChatGPT(question)
            : await askDeepSeek(question);
        setHistory(prev => [...prev, { role: 'assistant', content: answer }]);
      }
    } catch (err: any) {
      console.error('Error handling ask:', err);
      setHistory(prev => [...prev, { role: 'assistant', content: '出错了，请稍后再试。' }]);
    }

    setLoading(false);
  };

  const handleReset = () => {
    setHistory([]);
    setInputValue('');
    setLastPdf(null);
  };

  return (
    <div style={{ maxWidth: 800, margin: '0 auto', padding: 24, display: 'flex', flexDirection: 'column', height: '90vh' }}>
      <Title level={2}>WebSearch Q&A Assistant</Title>

      {/* Model Switch */}
      <div style={{ marginBottom: 16 }}>
        <Radio.Group value={model} onChange={e => setModel(e.target.value)}>
          <Radio.Button value="gpt">GPT</Radio.Button>
          <Radio.Button value="deepseek">DeepSeek</Radio.Button>
        </Radio.Group>
      </div>

      {/* Upload PDF Button */}
      <Upload
        name="pdf"
        accept=".pdf"
        showUploadList={false}
        beforeUpload={file => {
          const isPdf = file.type === 'application/pdf';
          if (!isPdf) message.error('只能上传 PDF 文件');
          return isPdf;
        }}
        customRequest={async ({ file, onSuccess, onError }) => {
          const form = new FormData();
          form.append('pdf', file as Blob);
          try {
            const resp = await axios.post('/api/upload', form, {
              headers: { 'Content-Type': 'multipart/form-data' },
            });
            onSuccess && onSuccess(resp.data, file);
            message.success('上传成功：' + resp.data.filename);
            setLastPdf(resp.data.filename);
            setHistory(prev => [...prev, { role: 'assistant', content: `上传了PDF：${resp.data.filename}` }]);
          } catch (err: any) {
            onError && onError(err as Error);
            message.error('上传失败');
          }
        }}
      >
        <Button icon={<UploadOutlined />} style={{ marginBottom: 12 }}>
          上传 PDF
        </Button>
      </Upload>

      {/* Conversation History */}
      <div
        ref={containerRef}
        style={{ flex: 1, overflowY: 'auto', marginBottom: 16, background: '#f8f8f8', padding: 16, borderRadius: 8 }}
      >
        {history.length === 0 ? (
          <Text type="secondary">No conversation yet. Start by asking a question below.</Text>
        ) : (
          history.map((item, idx) => (
            <div key={idx} style={{ marginBottom: 12 }}>
              <Text strong>{item.role === 'user' ? 'You' : 'Assistant'}:</Text>
              <div style={{ marginTop: 4, whiteSpace: 'pre-wrap' }}>{item.content}</div>
            </div>
          ))
        )}
      </div>

      <Divider />

      {/* Input Area */}
      <div>
        <TextArea
          rows={2}
          value={inputValue}
          onChange={e => setInputValue(e.target.value)}
          placeholder="Type your question here..."
        />

        <Space style={{ marginTop: 12 }}>
          <Button type="primary" onClick={handleAsk} loading={loading}>
            Send
          </Button>
          <Button danger onClick={handleReset}>
            Reset
          </Button>
        </Space>
      </div>
    </div>
  );
}
