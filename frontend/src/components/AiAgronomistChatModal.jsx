import { useState, useRef, useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { advisoryService } from '../services/advisoryService';

const QUICK_QUESTIONS = [
  { text: 'የቡና ፍሬ በሽታ (CBD) መከላከያ መድሃኒት መጠን ስንት ነው?', lang: 'am', icon: '☕' },
  { text: 'የእንሰት ጎመሬ በሽታን በባህላዊ መንገድ እንዴት መከላከል እችላለሁ?', lang: 'am', icon: '🍌' },
  { text: 'የበቆሎ አባጨጓሬን በአመድና በሚጥሚጣ እንዴት ማጥፋት እችላለሁ?', lang: 'am', icon: '🌽' },
  { text: 'Dhukkuba Firi Bunnaa akkamitti to\'achuu danda\'ama?', lang: 'om', icon: '☕' },
  { text: 'Utta gomariyaa tamman baashshata xoqissidi naagiyoogi aybee?', lang: 'wot', icon: '🍌' },
  { text: 'What is the recommended NPS / Urea dosage per hectare for Wheat?', lang: 'en', icon: '🌾' },
];

export default function AiAgronomistChatModal() {
  const { lang } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const [chatLang, setChatLang] = useState(lang || 'am');
  const [messages, setMessages] = useState([
    {
      id: 'welcome',
      role: 'assistant',
      text: lang === 'am'
        ? 'ሰላም! ጤና ይስጥልኝ! 🌾 እኔ የ AgroGebeya Ethiopia 24/7 የሰብል ጤና እና የግብርና AI አማካሪ ነኝ። ስለ ቡና፣ እንሰት፣ በቆሎ፣ ስንዴ፣ ጤፍ፣ ዝንጅብል፣ ተባይና በሽታ መከላከያ ወይም ማዳበሪያ ማንኛውንም ጥያቄ ይጠይቁኝ!'
        : lang === 'om'
        ? 'Akkam jirtu! 🌾 Ani gorsaa fi ogeessa qonnaa fi eegumsa midhaanii AgroGebeya Ethiopia ti. Waa\'ee Buna, Qoccoo, Boqqolloo fi qorichoota ilbiisaa na gaafadhaa!'
        : lang === 'wot'
        ? 'Saro giddite! 🌾 Taani AgroGebeya Ethiopia goshshaa xalettiya qoran zoriya AI giyaagaa. Buuna, Utta, Badallaanenne qorata ubbakka oychite!'
        : lang === 'ti'
        ? 'ሰላም! 🌾 ኣነ ናይ AgroGebeya Ethiopia 24/7 ናይ ሕርሻን ምክልኻል ሕማም ሰብልን AI ኣማኻሪ እየ። ብዛዕባ ቡን፣ እንሰት፣ ስርናይን ካልኦትን ሕተቱኒ!'
        : 'Hello & Welcome! 🌾 I am your 24/7 AgroGebeya AI Agronomist & Plant Doctor. Ask me anything about crop diseases, organic remedies, MoA certified fungicides, or fertilizer schedules across Ethiopia!',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);
  const [inputValue, setInputValue] = useState('');
  const [loading, setLoading] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // Sync default chat language with global language context
  useEffect(() => {
    if (lang) setChatLang(lang);
  }, [lang]);

  // Scroll to bottom on new message
  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 150);
    }
  }, [isOpen]);

  const handleSendMessage = async (textToSend) => {
    const text = (textToSend || inputValue).trim();
    if (!text || loading) return;

    const userMsg = {
      id: `u-${Date.now()}`,
      role: 'user',
      text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!textToSend) setInputValue('');
    setLoading(true);

    try {
      // Build history for context
      const historyPayload = messages
        .filter((m) => m.id !== 'welcome')
        .map((m) => ({
          role: m.role === 'assistant' ? 'model' : 'user',
          text: m.text,
        }));

      const res = await advisoryService.chat({
        message: text,
        history: historyPayload,
        language: chatLang,
      });

      const botMsg = {
        id: `b-${Date.now()}`,
        role: 'assistant',
        text: res.reply,
        source: res.source,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setMessages((prev) => [...prev, botMsg]);
    } catch (err) {
      console.error('Chat error:', err);
      const errorMsg = {
        id: `err-${Date.now()}`,
        role: 'assistant',
        text: 'ይቅርታ፣ ጊዜያዊ የግንኙነት መቋረጥ አጋጥሟል። እባክዎ እንደገና ይሞክሩ ወይም በስልክዎ ወደ *8028# ደውለው ፈጣን የግብርና መረጃ ያግኙ።',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setLoading(false);
    }
  };

  // Text-To-Speech Read Aloud using Web Speech API
  const handleSpeakText = (text) => {
    if (!('speechSynthesis' in window)) {
      alert('Speech synthesis is not supported on your browser.');
      return;
    }

    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      return;
    }

    const cleanText = text.replace(/[*#_`]/g, '');
    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.rate = 0.95;
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    setIsSpeaking(true);
    window.speechSynthesis.speak(utterance);
  };

  return (
    <>
      {/* Floating Launcher Pill Button */}
      {!isOpen && (
        <button
          type="button"
          className="ai-agronomist-floating-launcher"
          onClick={() => setIsOpen(true)}
          aria-label="Open 24/7 AI Agronomist Chat"
        >
          <span className="launcher-pulse-dot"></span>
          <span className="launcher-avatar">🧑‍🌾</span>
          <div className="launcher-label-box">
            <strong>24/7 AI Agronomist</strong>
            <small>የሰብል ዶክተር &bull; Ask Anything</small>
          </div>
        </button>
      )}

      {/* Floating Chat Modal Drawer */}
      {isOpen && (
        <div className="ai-chat-drawer-container">
          <div className="ai-chat-window">
            {/* Header */}
            <div className="ai-chat-header">
              <div className="chat-header-info">
                <div className="chat-avatar-frame">
                  <span className="chat-avatar-icon">🧑‍🌾</span>
                  <span className="online-indicator"></span>
                </div>
                <div>
                  <h4>AgroGebeya AI Agronomist</h4>
                  <div className="chat-status-sub">
                    <span className="status-live-chip">🟢 LIVE CLOUD AI</span>
                    <small>&bull; Ethiopian Plant Pathology Specialist</small>
                  </div>
                </div>
              </div>

              <div className="chat-header-actions">
                {/* Language Select Pill */}
                <select
                  className="chat-lang-selector"
                  value={chatLang}
                  onChange={(e) => setChatLang(e.target.value)}
                  title="Choose Response Language"
                >
                  <option value="am">🇪🇹 አማርኛ</option>
                  <option value="om">🟢 Afaan Oromoo</option>
                  <option value="wot">🟡 ወላይታቱ</option>
                  <option value="ti">🔴 ትግርኛ</option>
                  <option value="en">🌐 English</option>
                </select>

                <button
                  type="button"
                  className="btn-chat-close"
                  onClick={() => setIsOpen(false)}
                  title="Close Chat"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Quick Question Chips */}
            <div className="ai-chat-quick-chips">
              <span>💡 Quick Prompts:</span>
              <div className="chips-scroll-row">
                {QUICK_QUESTIONS.map((q, idx) => (
                  <button
                    key={idx}
                    type="button"
                    className="quick-chip-btn"
                    onClick={() => handleSendMessage(q.text)}
                  >
                    <span>{q.icon}</span> {q.text}
                  </button>
                ))}
              </div>
            </div>

            {/* Messages Body */}
            <div className="ai-chat-messages-body">
              {messages.map((msg) => (
                <div key={msg.id} className={`chat-bubble-wrapper ${msg.role}`}>
                  {msg.role === 'assistant' && (
                    <div className="bubble-bot-avatar">🧑‍🌾</div>
                  )}

                  <div className={`chat-bubble ${msg.role}`}>
                    <div className="bubble-content">
                      {msg.text.split('\n').map((line, i) => {
                        if (!line.trim()) return <div key={i} className="msg-spacer"></div>;
                        // Handle bullet points
                        if (line.startsWith('* ') || line.startsWith('- ')) {
                          return (
                            <li key={i} className="bubble-list-item">
                              {line.substring(2)}
                            </li>
                          );
                        }
                        // Handle numbered list
                        if (/^\d+\.\s/.test(line)) {
                          return (
                            <div key={i} className="bubble-numbered-item">
                              {line}
                            </div>
                          );
                        }
                        return <p key={i}>{line}</p>;
                      })}
                    </div>

                    <div className="bubble-meta">
                      <span className="bubble-time">{msg.timestamp}</span>
                      {msg.role === 'assistant' && (
                        <button
                          type="button"
                          className="btn-tts-listen"
                          onClick={() => handleSpeakText(msg.text)}
                          title="Listen to this advisory aloud"
                        >
                          🔊 Listen
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}

              {loading && (
                <div className="chat-bubble-wrapper assistant">
                  <div className="bubble-bot-avatar">🧑‍🌾</div>
                  <div className="chat-bubble assistant loading-bubble">
                    <div className="typing-dots">
                      <span></span>
                      <span></span>
                      <span></span>
                    </div>
                    <small>Consulting Ethiopian pathology and research catalog...</small>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Input Bar */}
            <form
              className="ai-chat-input-bar"
              onSubmit={(e) => {
                e.preventDefault();
                handleSendMessage();
              }}
            >
              <input
                ref={inputRef}
                type="text"
                placeholder={
                  chatLang === 'am'
                    ? 'ስለ ሰብልዎ፣ ተባይ ወይም መድሃኒት ይጠይቁ...'
                    : chatLang === 'om'
                    ? 'Waa\'ee midhaanii fi qorichaa na gaafadhaa...'
                    : chatLang === 'wot'
                    ? 'Goshshaanenne qoran oychite...'
                    : chatLang === 'ti'
                    ? 'ብዛዕባ ሰብልን ሕማምን ሕተቱ...'
                    : 'Ask about crop diseases, dosage, or treatments...'
                }
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                disabled={loading}
              />
              <button
                type="submit"
                className="btn-chat-send"
                disabled={loading || !inputValue.trim()}
              >
                {loading ? '...' : '➤'}
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
