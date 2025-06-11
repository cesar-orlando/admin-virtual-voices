import { useState, useEffect } from 'react'
import './App.css'
import { fetchMessages } from './api/fetchMessages';
import { requestNewQr } from './api/requestNewQr';
import { fetchAiConfig } from './api/fetchAiConfig';
import { saveAiConfig } from './api/saveAiConfig';

import io from "socket.io-client";
import { ChatModal } from './components/ChatModal';
import { WhatsappTab } from './components/WhatsappTab';
import { Notifications } from './components/Notifications';
import { DataTableTab } from './components/DataTableTab';
import { AiConfigTab } from './components/AiConfigTab';
import { fetchSessions } from './api/fetchWhatsappSessions';
import { ThemeProvider, CssBaseline, createTheme } from '@mui/material';

const socket = io("http://localhost:3001");
const theme = createTheme();

function App() {
  const [qr, setQr] = useState("");
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [sessionName, setSessionName] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMessages, setModalMessages] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'data' | 'ai' | 'whatsapp'>('data');
  const [aiConfig, setAiConfig] = useState<any>(null);
  const [aiSaveStatus, setAiSaveStatus] = useState<string | null>(null);
  const [notifications, setNotifications] = useState<string[]>([]);
  const [sessions, setSessions] = useState<any>(null);

  useEffect(() => {
    socket.on(`whatsapp-message-test_company`, (message: any) => {
      fetchMessages()
        .then((json) => setData(json))
        .catch((err) => setError(err.message))
        .finally(() => setLoading(false));
      const lastMsg = message.messages && message.messages.length > 0 ? message.messages[message.messages.length - 1] : null;
      let notifText = 'Nuevo mensaje: ' + message.phone;
      if (lastMsg) {
        notifText += ': ';
        if (lastMsg.body) notifText += lastMsg.body;
        else notifText += '';
      }
      setNotifications(prev => {
        const next = [notifText, ...prev].slice(0, 5);
        return next;
      });
      setTimeout(() => {
        setNotifications(prev => prev.slice(0, prev.length - 1));
      }, 5000);
    });
    return () => {
      socket.off("whatsapp-message-test_company");
    };
  }, []);

  useEffect(() => {
    socket.on("whatsapp-qr-test_company", setQr);
    return () => {
      socket.off("whatsapp-qr-test_company", setQr);
    };
  }, []);

  useEffect(() => {
    fetchMessages()
      .then((json) => setData(json))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
    
    // Obtener configuración AI
    fetchAiConfig()
      .then((config) => {
        if (config) setAiConfig(config);
      })
      .catch(() => {/* Ignorar error si no hay config */});
  
    fetchSessions()
      .then((sessions) => setSessions(sessions))
      .catch((err) => setError(err.message));
    }, []);

  function handleShowMessages(messages: any[]) {
    setModalMessages(messages);
    setModalOpen(true);
  }

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <div style={{ display: 'flex', minHeight: '100vh' }}>
        <aside style={{ width: 220, background: 'whitesmoke', color: 'black', padding: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>
          <h2 style={{ marginBottom: 32 }}>Menú</h2>
          <button onClick={() => setActiveTab('data')} style={{ padding: '12px 16px', background: activeTab === 'data' ? '#007bff' : '#eee', color: activeTab === 'data' ? '#fff' : '#222', border: 'none', borderRadius: 6, fontWeight: 'bold', cursor: 'pointer' }}>
            Mensajes
          </button>
          <button onClick={() => setActiveTab('ai')} style={{ padding: '12px 16px', background: activeTab === 'ai' ? '#007bff' : '#eee', color: activeTab === 'ai' ? '#fff' : '#222', border: 'none', borderRadius: 6, fontWeight: 'bold', cursor: 'pointer' }}>
            AI Config
          </button>
          <button onClick={() => setActiveTab('whatsapp')} style={{ padding: '12px 16px', background: activeTab === 'whatsapp' ? '#007bff' : '#eee', color: activeTab === 'whatsapp' ? '#fff' : '#222', border: 'none', borderRadius: 6, fontWeight: 'bold', cursor: 'pointer' }}>
            Whatsapp QR
          </button>
        </aside>
        <main style={{ flex: 1, padding: 24, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', width: '100vw', boxSizing: 'border-box' }}>
          <div style={{ width: '100%', maxWidth: activeTab === 'ai' ? 500 : 1200, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', margin: '0 auto' }}>
            {activeTab === 'data' && (
              <DataTableTab
                loading={loading}
                error={error}
                data={data}
                onShowMessages={handleShowMessages}
              />
            )}
            {activeTab === 'ai' && (
              <AiConfigTab
                aiConfig={aiConfig}
                setAiConfig={setAiConfig}
                aiSaveStatus={aiSaveStatus}
                setAiSaveStatus={setAiSaveStatus}
                saveAiConfig={saveAiConfig}
              />
            )}
            {activeTab === 'whatsapp' && (
              <WhatsappTab
                qr={qr}
                sessionName={sessionName}
                setSessionName={setSessionName}
                loading={loading}
                setLoading={setLoading}
                error={error}
                setError={setError}
                requestNewQr={requestNewQr}
                setQr={setQr}
                sessions={sessions}
                setSessions={setSessions}
              />
            )}
          </div>
        </main>
        <ChatModal open={modalOpen} onClose={() => setModalOpen(false)} messages={modalMessages} />
        <Notifications notifications={notifications} />
      </div>
    </ThemeProvider>
  );
}

export default App
