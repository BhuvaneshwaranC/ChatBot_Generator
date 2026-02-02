import React, { useState } from 'react';
import { Send, Bot, Settings, Download, Eye, Code } from 'lucide-react';

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
        model: "llama-3.1-8b-instant",  // ← THIS FIXES 400 ERROR
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

      console.log('📤 Request payload:', JSON.stringify(payload, null, 2));

      const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${config.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)  // ✅ Clean JSON
      });

      console.log('📡 Status:', response.status);
      
      if (!response.ok) {
        const errorData = await response.text();
        console.error('❌ Error details:', errorData);
        throw new Error(`API ${response.status}: ${errorData.slice(0, 100)}`);
      }

      const data = await response.json();
      console.log('✅ Success:', data);
      
      const botResponse = data.choices[0].message.content;
      setChatHistory(prev => [...prev, { sender: 'bot', text: botResponse }]);
      
    } catch (error) {
      console.error('💥 Full error:', error);
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
    const code = `<!-- Chatbot Embed Code -->
<div id="custom-chatbot"></div>
<script>
  window.chatbotConfig = ${JSON.stringify(config, null, 2)};
</script>
<script src="https://yourcdn.com/chatbot.js"></script>
<style>
  #custom-chatbot {
    --primary-color: ${config.primaryColor};
  }
</style>`;
    setEmbedCode(code);
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

                <div className="flex gap-3">
                  <button
                    onClick={() => { generateEmbedCode(); alert('Embed code generated! Check below.'); }}
                    className="flex-1 bg-purple-600 text-white py-3 rounded-lg font-semibold hover:bg-purple-700 transition flex items-center justify-center gap-2"
                  >
                    <Code className="w-5 h-5" />
                    Get Embed Code
                  </button>
                  <button
                    onClick={downloadConfig}
                    className="flex-1 bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition flex items-center justify-center gap-2"
                  >
                    <Download className="w-5 h-5" />
                    Download Config
                  </button>
                </div>

                {embedCode && (
                  <div className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto">
                    <pre className="text-xs">{embedCode}</pre>
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