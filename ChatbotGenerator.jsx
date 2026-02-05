import React, { useState } from 'react';
import { Send, Bot, Settings, Download, Eye, Code, Copy, Check } from 'lucide-react';

const ChatbotGenerator = () => {
  const [step, setStep] = useState(1);
  const [config, setConfig] = useState({
    websiteType: 'portfolio',
    purpose: 'support',
    tone: 'friendly',
    companyName: '',
    chatbotName: '',
    websiteUrl: '',
    industry: '',
    primaryColor: '#007bff',
    features: [],
    apiKey: import.meta.env.VITE_GROQ_API_KEY || ''
  });
  const [chatHistory, setChatHistory] = useState([]);
  const [userInput, setUserInput] = useState('');
  const [showPreview, setShowPreview] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [embedCode, setEmbedCode] = useState('');
  const [copied, setCopied] = useState(false);

  const industries = ['Technology', 'Healthcare', 'E-commerce', 'Education', 'Finance', 'Real Estate', 'Hospitality', 'Other'];
  const features = [
    { id: 'appointment', label: 'Appointment Booking' },
    { id: 'faq', label: 'FAQ Answering' },
    { id: 'leadCapture', label: 'Lead Capture' },
    { id: 'productInfo', label: 'Product Information' },
    { id: 'liveChat', label: 'Live Chat Handoff' }
  ];

  const handleFeatureToggle = (featureId) => {
    setConfig(prev => ({
      ...prev,
      features: prev.features.includes(featureId)
        ? prev.features.filter(f => f !== featureId)
        : [...prev.features, featureId]
    }));
  };

  const generateChatbotPersonality = () => {
    const personalities = {
      portfolio: {
        support: "I help visitors learn about my owner's work and connect with them.",
        leads: "I help potential clients get in touch and schedule consultations.",
        faq: "I answer questions about services, experience, and availability."
      },
      ecommerce: {
        support: "I assist customers with orders, shipping, and product questions.",
        leads: "I help new customers discover products and special offers.",
        faq: "I provide information about products, policies, and store details."
      },
      business: {
        support: "I help clients with inquiries and support requests.",
        leads: "I qualify leads and schedule meetings with the sales team.",
        faq: "I answer common questions about our services and company."
      }
    };

    const toneModifiers = {
      friendly: "I communicate in a warm, approachable way with emojis when appropriate.",
      professional: "I maintain a polished, business-appropriate tone."
    };

    return {
      role: personalities[config.websiteType][config.purpose],
      tone: toneModifiers[config.tone]
    };
  };

  const generateWelcomeMessage = () => {
    const greeting = config.tone === 'friendly' ? '👋 Hi there!' : 'Hello!';
    
    const purposeMessages = {
      support: `${greeting} I'm here to help you. What can I assist you with today?`,
      leads: `${greeting} Welcome to ${config.companyName || 'our site'}! I'd love to learn how we can help you.`,
      faq: `${greeting} Have questions? I'm here to help! Feel free to ask me anything.`
    };

    return purposeMessages[config.purpose];
  };

  const handleAIResponse = async (userMessage) => {
    if (!config.apiKey?.trim()) {
      setChatHistory(prev => [...prev, { sender: 'bot', text: "❌ Add your Groq API key first!" }]);
      return;
    }

    setIsGenerating(true);
    
    try {
      const payload = {
        model: "llama-3.1-8b-instant",
        messages: [
          {
            role: "system",
            content: `You are a ${config.purpose} chatbot named "${config.chatbotName || 'Assistant'}" for a ${config.websiteType} website. Company: ${config.companyName || 'this company'}. Website: ${config.websiteUrl || 'N/A'}. Tone: ${config.tone}. Keep responses short (1-2 sentences).${config.tone === 'friendly' ? ' Use friendly emojis.' : ''}`
          },
          ...chatHistory.map(msg => ({
            role: msg.sender === 'user' ? 'user' : 'assistant',
            content: msg.text
          })),
          { role: "user", content: userMessage }
        ],
        max_tokens: 100,
        temperature: 0.7
      };

      const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${config.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const errorData = await response.text();
        throw new Error(`API ${response.status}: ${errorData.slice(0, 100)}`);
      }

      const data = await response.json();
      const botResponse = data.choices[0].message.content;
      setChatHistory(prev => [...prev, { sender: 'bot', text: botResponse }]);
      
    } catch (error) {
      console.error('Error:', error);
      setChatHistory(prev => [...prev, { 
        sender: 'bot', 
        text: `⚠️ Error: ${error.message}` 
      }]);
    }
    
    setIsGenerating(false);
  };

  const handleSendMessage = () => {
    if (!userInput.trim() || isGenerating) return;

    setChatHistory(prev => [...prev, { sender: 'user', text: userInput }]);
    handleAIResponse(userInput);
    setUserInput('');
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const initializeChat = () => {
    const welcomeMsg = generateWelcomeMessage();
    setChatHistory([{ sender: 'bot', text: welcomeMsg }]);
    setShowPreview(true);
  };

  const generateEmbedCode = () => {
    const welcomeMessage = generateWelcomeMessage();
    
    // Create a fully self-contained embed code
    const code = `<!-- AI Chatbot Widget - Paste this anywhere in your HTML -->
<div id="ai-chatbot-widget"></div>

<script>
(function() {
  // Configuration
  const config = {
    apiKey: '${config.apiKey}',
    companyName: '${config.companyName || 'Assistant'}',
    chatbotName: '${config.chatbotName || 'Bot'}',
    websiteUrl: '${config.websiteUrl || ''}',
    websiteType: '${config.websiteType}',
    purpose: '${config.purpose}',
    tone: '${config.tone}',
    primaryColor: '${config.primaryColor}',
    welcomeMessage: \`${welcomeMessage}\`
  };

  // Create widget HTML
  const widgetHTML = \`
    <style>
      #ai-chatbot-container { position: fixed; bottom: 20px; right: 20px; z-index: 9999; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; }
      #ai-chatbot-toggle { width: 60px; height: 60px; border-radius: 50%; background: \${config.primaryColor}; border: none; cursor: pointer; box-shadow: 0 4px 12px rgba(0,0,0,0.15); display: flex; align-items: center; justify-content: center; transition: transform 0.2s; }
      #ai-chatbot-toggle:hover { transform: scale(1.1); }
      #ai-chatbot-toggle svg { width: 30px; height: 30px; fill: white; }
      #ai-chatbot-window { display: none; position: absolute; bottom: 80px; right: 0; width: 380px; height: 550px; background: white; border-radius: 12px; box-shadow: 0 8px 32px rgba(0,0,0,0.2); flex-direction: column; overflow: hidden; }
      #ai-chatbot-window.active { display: flex; }
      #ai-chatbot-header { background: \${config.primaryColor}; color: white; padding: 16px; font-weight: 600; display: flex; justify-content: space-between; align-items: center; }
      #ai-chatbot-close { background: none; border: none; color: white; font-size: 24px; cursor: pointer; padding: 0; width: 30px; height: 30px; }
      #ai-chatbot-messages { flex: 1; overflow-y: auto; padding: 16px; background: #f7f7f7; }
      .ai-chatbot-message { margin-bottom: 12px; display: flex; }
      .ai-chatbot-message.user { justify-content: flex-end; }
      .ai-chatbot-message.bot { justify-content: flex-start; }
      .ai-chatbot-bubble { max-width: 75%; padding: 10px 14px; border-radius: 12px; font-size: 14px; line-height: 1.4; word-wrap: break-word; }
      .ai-chatbot-message.user .ai-chatbot-bubble { background: \${config.primaryColor}; color: white; border-bottom-right-radius: 4px; }
      .ai-chatbot-message.bot .ai-chatbot-bubble { background: white; color: #333; border: 1px solid #e0e0e0; border-bottom-left-radius: 4px; }
      .ai-chatbot-typing { display: flex; gap: 4px; padding: 10px; }
      .ai-chatbot-typing span { width: 8px; height: 8px; background: #999; border-radius: 50%; animation: typing 1.4s infinite; }
      .ai-chatbot-typing span:nth-child(2) { animation-delay: 0.2s; }
      .ai-chatbot-typing span:nth-child(3) { animation-delay: 0.4s; }
      @keyframes typing { 0%, 60%, 100% { transform: translateY(0); } 30% { transform: translateY(-10px); } }
      #ai-chatbot-input-area { padding: 12px; background: white; border-top: 1px solid #e0e0e0; display: flex; gap: 8px; }
      #ai-chatbot-input { flex: 1; padding: 10px 12px; border: 1px solid #ddd; border-radius: 20px; font-size: 14px; outline: none; }
      #ai-chatbot-input:focus { border-color: \${config.primaryColor}; }
      #ai-chatbot-send { background: \${config.primaryColor}; color: white; border: none; border-radius: 50%; width: 40px; height: 40px; cursor: pointer; display: flex; align-items: center; justify-content: center; }
      #ai-chatbot-send:disabled { opacity: 0.5; cursor: not-allowed; }
      #ai-chatbot-send svg { width: 20px; height: 20px; fill: white; }
    </style>
    
    <div id="ai-chatbot-container">
      <button id="ai-chatbot-toggle" aria-label="Open chatbot">
        <svg viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12c0 1.54.36 3.08 1.05 4.43L2 22l5.57-1.05C9.92 21.64 11.46 22 13 22c5.52 0 10-4.48 10-10S17.52 2 12 2zm0 18c-1.38 0-2.74-.35-3.93-1.01l-.28-.16-2.93.55.55-2.93-.16-.28C4.35 14.74 4 13.38 4 12c0-4.41 3.59-8 8-8s8 3.59 8 8-3.59 8-8 8z"/><circle cx="9" cy="12" r="1"/><circle cx="15" cy="12" r="1"/><path d="M8 14c0 1.66 1.79 3 4 3s4-1.34 4-3H8z"/></svg>
      </button>
      
      <div id="ai-chatbot-window">
        <div id="ai-chatbot-header">
          <span>\${config.companyName} Chat</span>
          <button id="ai-chatbot-close">&times;</button>
        </div>
        <div id="ai-chatbot-messages"></div>
        <div id="ai-chatbot-input-area">
          <input type="text" id="ai-chatbot-input" placeholder="Type your message..." />
          <button id="ai-chatbot-send" aria-label="Send message">
            <svg viewBox="0 0 24 24"><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/></svg>
          </button>
        </div>
      </div>
    </div>
  \`;

  // Insert widget into page
  document.getElementById('ai-chatbot-widget').innerHTML = widgetHTML;

  // Widget state
  let chatHistory = [];
  let isGenerating = false;

  // DOM elements
  const toggle = document.getElementById('ai-chatbot-toggle');
  const chatWindow = document.getElementById('ai-chatbot-window');
  const closeBtn = document.getElementById('ai-chatbot-close');
  const messagesDiv = document.getElementById('ai-chatbot-messages');
  const input = document.getElementById('ai-chatbot-input');
  const sendBtn = document.getElementById('ai-chatbot-send');

  // Toggle chat window
  toggle.addEventListener('click', () => {
    chatWindow.classList.toggle('active');
    if (chatWindow.classList.contains('active') && chatHistory.length === 0) {
      addMessage('bot', config.welcomeMessage);
    }
  });

  closeBtn.addEventListener('click', () => {
    chatWindow.classList.remove('active');
  });

  // Add message to chat
  function addMessage(sender, text) {
    chatHistory.push({ sender, text });
    const msgDiv = document.createElement('div');
    msgDiv.className = \`ai-chatbot-message \${sender}\`;
    msgDiv.innerHTML = \`<div class="ai-chatbot-bubble">\${text}</div>\`;
    messagesDiv.appendChild(msgDiv);
    messagesDiv.scrollTop = messagesDiv.scrollHeight;
  }

  // Show typing indicator
  function showTyping() {
    const typingDiv = document.createElement('div');
    typingDiv.className = 'ai-chatbot-message bot';
    typingDiv.id = 'typing-indicator';
    typingDiv.innerHTML = '<div class="ai-chatbot-bubble"><div class="ai-chatbot-typing"><span></span><span></span><span></span></div></div>';
    messagesDiv.appendChild(typingDiv);
    messagesDiv.scrollTop = messagesDiv.scrollHeight;
  }

  function hideTyping() {
    const typing = document.getElementById('typing-indicator');
    if (typing) typing.remove();
  }

  // Send message to AI
  async function sendMessage() {
    const message = input.value.trim();
    if (!message || isGenerating) return;

    addMessage('user', message);
    input.value = '';
    isGenerating = true;
    sendBtn.disabled = true;
    showTyping();

    try {
      const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': \`Bearer \${config.apiKey}\`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: 'llama-3.1-8b-instant',
          messages: [
            {
              role: 'system',
              content: \`You are a \${config.purpose} chatbot named "\${config.chatbotName}" for a \${config.websiteType} website. Company: \${config.companyName}. Tone: \${config.tone}. Keep responses short (1-2 sentences).\${config.tone === 'friendly' ? ' Use friendly emojis.' : ''}\`
            },
            ...chatHistory.map(msg => ({
              role: msg.sender === 'user' ? 'user' : 'assistant',
              content: msg.text
            }))
          ],
          max_tokens: 100,
          temperature: 0.7
        })
      });

      hideTyping();

      if (!response.ok) {
        throw new Error(\`API Error: \${response.status}\`);
      }

      const data = await response.json();
      const botReply = data.choices[0].message.content;
      addMessage('bot', botReply);

    } catch (error) {
      hideTyping();
      addMessage('bot', '⚠️ Sorry, I encountered an error. Please try again.');
      console.error('Chatbot error:', error);
    }

    isGenerating = false;
    sendBtn.disabled = false;
    input.focus();
  }

  // Event listeners
  sendBtn.addEventListener('click', sendMessage);
  input.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') sendMessage();
  });
})();
</script>`;

    setEmbedCode(code);
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(embedCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const downloadConfig = () => {
    const dataStr = JSON.stringify(config, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'chatbot-config.json';
    link.click();
  };

  const downloadHTML = () => {
    const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Chatbot Test Page</title>
</head>
<body>
  <h1>Test Page for Your Chatbot</h1>
  <p>The chatbot widget should appear in the bottom-right corner.</p>
  
  ${embedCode}
</body>
</html>`;

    const blob = new Blob([htmlContent], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'chatbot-test-page.html';
    link.click();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-2 flex items-center justify-center gap-3">
            <Bot className="w-10 h-10 text-blue-600" />
            AI Chatbot Generator
          </h1>
          <p className="text-gray-600">Create an intelligent chatbot tailored to your website needs</p>
        </div>

        <div className="flex justify-center mb-8">
          <div className="flex items-center gap-4">
            {[1, 2, 3].map(s => (
              <React.Fragment key={s}>
                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold ${
                  step >= s ? 'bg-blue-600 text-white' : 'bg-gray-300 text-gray-600'
                }`}>
                  {s}
                </div>
                {s < 3 && <div className={`w-16 h-1 ${step > s ? 'bg-blue-600' : 'bg-gray-300'}`} />}
              </React.Fragment>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-2xl font-semibold mb-6 flex items-center gap-2">
              <Settings className="w-6 h-6" />
              Configure Your Chatbot
            </h2>

            {step === 1 && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Company Name
                  </label>
                  <input
                    type="text"
                    value={config.companyName}
                    onChange={(e) => setConfig({...config, companyName: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter your company name"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Chatbot Name
                  </label>
                  <input
                    type="text"
                    value={config.chatbotName}
                    onChange={(e) => setConfig({...config, chatbotName: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="e.g., Alex, Support Bot, Assistant"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Website URL
                  </label>
                  <input
                    type="url"
                    value={config.websiteUrl}
                    onChange={(e) => setConfig({...config, websiteUrl: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="https://example.com"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Industry
                  </label>
                  <select
                    value={config.industry}
                    onChange={(e) => setConfig({...config, industry: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Select industry</option>
                    {industries.map(ind => (
                      <option key={ind} value={ind}>{ind}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Website Type
                  </label>
                  <select
                    value={config.websiteType}
                    onChange={(e) => setConfig({...config, websiteType: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="portfolio">Portfolio</option>
                    <option value="ecommerce">E-commerce</option>
                    <option value="business">Business</option>
                  </select>
                </div>

                <button
                  onClick={() => setStep(2)}
                  className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition"
                >
                  Next Step
                </button>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Primary Purpose
                  </label>
                  <select
                    value={config.purpose}
                    onChange={(e) => setConfig({...config, purpose: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="support">Customer Support</option>
                    <option value="leads">Lead Generation</option>
                    <option value="faq">FAQ Assistant</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Communication Tone
                  </label>
                  <select
                    value={config.tone}
                    onChange={(e) => setConfig({...config, tone: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="friendly">Friendly & Casual</option>
                    <option value="professional">Professional & Formal</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Features
                  </label>
                  <div className="space-y-2">
                    {features.map(feature => (
                      <label key={feature.id} className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={config.features.includes(feature.id)}
                          onChange={() => handleFeatureToggle(feature.id)}
                          className="w-4 h-4 text-blue-600 rounded"
                        />
                        <span className="text-gray-700">{feature.label}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => setStep(1)}
                    className="flex-1 bg-gray-300 text-gray-700 py-3 rounded-lg font-semibold hover:bg-gray-400 transition"
                  >
                    Back
                  </button>
                  <button
                    onClick={() => setStep(3)}
                    className="flex-1 bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition"
                  >
                    Next Step
                  </button>
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    🔑 Groq API Key (Required)
                  </label>
                  <input
                    type="password"
                    value={config.apiKey || ''}
                    onChange={(e) => setConfig({...config, apiKey: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="gsk_..."
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Get your free key at <a href="https://console.groq.com" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">console.groq.com</a>
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Primary Color
                  </label>
                  <div className="flex gap-3">
                    <input
                      type="color"
                      value={config.primaryColor}
                      onChange={(e) => setConfig({...config, primaryColor: e.target.value})}
                      className="w-16 h-10 rounded border-2 border-gray-300 cursor-pointer"
                    />
                    <input
                      type="text"
                      value={config.primaryColor}
                      onChange={(e) => setConfig({...config, primaryColor: e.target.value})}
                      className="flex-1 px-4 py-2 border border-gray-300 rounded-lg"
                    />
                  </div>
                </div>

                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="font-semibold mb-2">Configuration Summary</h3>
                  <div className="space-y-1 text-sm text-gray-700">
                    <p><strong>Company:</strong> {config.companyName || 'Not specified'}</p>
                    <p><strong>Chatbot Name:</strong> {config.chatbotName || 'Not specified'}</p>
                    <p><strong>Website URL:</strong> {config.websiteUrl || 'Not specified'}</p>
                    <p><strong>Industry:</strong> {config.industry || 'Not specified'}</p>
                    <p><strong>Type:</strong> {config.websiteType}</p>
                    <p><strong>Purpose:</strong> {config.purpose}</p>
                    <p><strong>Tone:</strong> {config.tone}</p>
                    <p><strong>Features:</strong> {config.features.length > 0 ? config.features.join(', ') : 'None'}</p>
                  </div>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => setStep(2)}
                    className="flex-1 bg-gray-300 text-gray-700 py-3 rounded-lg font-semibold hover:bg-gray-400 transition"
                  >
                    Back
                  </button>
                  <button
                    onClick={initializeChat}
                    className="flex-1 bg-green-600 text-white py-3 rounded-lg font-semibold hover:bg-green-700 transition flex items-center justify-center gap-2"
                  >
                    <Eye className="w-5 h-5" />
                    Test Chatbot
                  </button>
                </div>

                <div className="border-t pt-4 mt-4">
                  <h3 className="font-semibold mb-3 text-gray-800">📦 Export Options</h3>
                  <div className="space-y-3">
                    <button
                      onClick={() => { generateEmbedCode(); }}
                      className="w-full bg-purple-600 text-white py-3 rounded-lg font-semibold hover:bg-purple-700 transition flex items-center justify-center gap-2"
                    >
                      <Code className="w-5 h-5" />
                      Generate Embed Code
                    </button>
                    
                    {embedCode && (
                      <>
                        <button
                          onClick={copyToClipboard}
                          className="w-full bg-indigo-600 text-white py-3 rounded-lg font-semibold hover:bg-indigo-700 transition flex items-center justify-center gap-2"
                        >
                          {copied ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
                          {copied ? 'Copied!' : 'Copy Embed Code'}
                        </button>
                        
                        <button
                          onClick={downloadHTML}
                          className="w-full bg-green-600 text-white py-3 rounded-lg font-semibold hover:bg-green-700 transition flex items-center justify-center gap-2"
                        >
                          <Download className="w-5 h-5" />
                          Download Test HTML
                        </button>
                      </>
                    )}
                    
                    <button
                      onClick={downloadConfig}
                      className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition flex items-center justify-center gap-2"
                    >
                      <Download className="w-5 h-5" />
                      Download Config JSON
                    </button>
                  </div>
                </div>

                {embedCode && (
                  <div className="mt-4">
                    <h3 className="font-semibold mb-2 text-gray-800">Embed Code (Ready to Use)</h3>
                    <div className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto max-h-64 overflow-y-auto">
                      <pre className="text-xs">{embedCode}</pre>
                    </div>
                    <p className="text-sm text-gray-600 mt-2">
                      ✅ Copy this code and paste it anywhere in your website's HTML (just before the closing &lt;/body&gt; tag works best)
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="bg-white rounded-xl shadow-lg overflow-hidden flex flex-col h-[600px]">
            <div 
              className="p-4 text-white font-semibold flex items-center gap-2"
              style={{ backgroundColor: config.primaryColor }}
            >
              <Bot className="w-6 h-6" />
              {config.companyName || 'Your'} Chatbot Preview
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50">
              {!showPreview ? (
                <div className="h-full flex items-center justify-center text-gray-400">
                  <div className="text-center">
                    <Bot className="w-16 h-16 mx-auto mb-3 opacity-50" />
                    <p>Complete configuration to test your chatbot</p>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {chatHistory.map((msg, idx) => (
                    <div
                      key={idx}
                      className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-md px-4 py-3 rounded-lg break-words whitespace-pre-wrap ${
                          msg.sender === 'user'
                            ? 'bg-blue-600 text-white rounded-br-none'
                            : 'bg-gray-100 text-gray-900 border border-gray-300 rounded-bl-none'
                        }`}
                      >
                        <p className="text-sm leading-relaxed">{msg.text}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              {isGenerating && (
                <div className="flex justify-start">
                  <div className="bg-white text-gray-800 border border-gray-200 px-4 py-2 rounded-lg">
                    <div className="flex gap-1">
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {showPreview && (
              <div className="p-4 border-t border-gray-200 bg-white">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={userInput}
                    onChange={(e) => setUserInput(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Type your message..."
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    disabled={isGenerating}
                  />
                  <button
                    onClick={handleSendMessage}
                    disabled={isGenerating}
                    className="bg-blue-600 text-white p-2 rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
                    style={{ backgroundColor: config.primaryColor }}
                  >
                    <Send className="w-5 h-5" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatbotGenerator;