import { useState } from 'react';
import { Input, Button, Typography, Divider, Radio, Space } from 'antd';
import { askChatGPT } from './api/chatgpt';
import { askDeepSeek } from './api/deepseek';

const { TextArea } = Input;
const { Title, Text } = Typography;

function App() {
  const [inputValue, setInputValue] = useState('');
  const [history, setHistory] = useState<{ role: 'user' | 'assistant'; content: string }[]>([]);
  const [loading, setLoading] = useState(false);
  const [model, setModel] = useState<'gpt' | 'deepseek'>('gpt');

  const handleAsk = async () => {
    const question = inputValue.trim();
    if (!question) return;

    setHistory((prev) => [...prev, { role: 'user', content: question }]);
    setInputValue('');
    setLoading(true);

    const answer =
      model === 'gpt'
        ? await askChatGPT(question)
        : await askDeepSeek(question);

    setHistory((prev) => [...prev, { role: 'assistant', content: answer }]);
    setLoading(false);
  };

  const handleReset = () => {
    setHistory([]);
    setInputValue('');
  };

  return (
    <div style={{ maxWidth: 800, margin: '0 auto', padding: 24, display: 'flex', flexDirection: 'column', height: '90vh' }}>
      <Title level={2}>WebSearch Q&A Assistant</Title>

      {/* Model Switch */}
      <div style={{ marginBottom: 16 }}>
        <Radio.Group
          value={model}
          onChange={(e) => setModel(e.target.value)}
        >
          <Radio.Button value="gpt">GPT</Radio.Button>
          <Radio.Button value="deepseek">DeepSeek</Radio.Button>
        </Radio.Group>
      </div>

      {/* Conversation History */}
      <div style={{ flex: 1, overflowY: 'auto', marginBottom: 16, background: '#f8f8f8', padding: 16, borderRadius: 8 }}>
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
          onChange={(e) => setInputValue(e.target.value)}
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

export default App;
