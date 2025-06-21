import { useState } from 'react';
import { Input, Button, Space, Typography, Divider } from 'antd';

const { TextArea } = Input;
const { Text } = Typography;

function App() {
  const [inputValue, setInputValue] = useState('');
  const [outputLines, setOutputLines] = useState<string[]>([]);

  const handleSend = () => {
    const trimmed = inputValue.trim();
    if (trimmed === '') return;
    setOutputLines([...outputLines, trimmed]);
    setInputValue('');
  };

  const handleReset = () => {
    setOutputLines([]);
    setInputValue('');
  };

  return (
    <div
      style={{
        width: 600,
        padding: 20,
        backgroundColor: 'white',
        borderRadius: 8,
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
      }}
    >
      <Text strong>Output:</Text>
      <div
        style={{
          minHeight: 200,
          border: '1px solid #d9d9d9',
          borderRadius: 4,
          padding: 12,
          marginBottom: 20,
          whiteSpace: 'pre-wrap',
          backgroundColor: '#fafafa',
        }}
      >
        {outputLines.length === 0 ? (
          <Text type="secondary">No content yet</Text>
        ) : (
          outputLines.map((line, index) => (
            <div key={index}>
              <Text>{`${index + 1}. ${line}`}</Text>
            </div>
          ))
        )}
      </div>

      <Divider style={{ margin: '24px 0' }} />

      <Space.Compact style={{ width: '100%' }}>
        <Button onClick={handleReset}>reset</Button>
        <Input
          placeholder="Ask anything"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onPressEnter={handleSend}
        />
        <Button type="primary" onClick={handleSend}>
          send
        </Button>
      </Space.Compact>
    </div>
  );
}

export default App;
