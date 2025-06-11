import { useState, useEffect } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './App.css'
import { fetchMessages } from './api/fetchMessages';
import { requestNewQr } from './api/requestNewQr';
import { fetchAiConfig } from './api/fetchAiConfig';
import { saveAiConfig } from './api/saveAiConfig';

import io from "socket.io-client";
import { QRCodeCanvas } from "qrcode.react";

const socket = io("http://localhost:3001");

function App() {
  const [qr, setQr] = useState("");
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [sessionName, setSessionName] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMessages, setModalMessages] = useState<any[]>([]);
  const [whatsappModalOpen, setWhatsappModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'data' | 'ai'>('data');
  const [aiConfig, setAiConfig] = useState<any>(null);
  const [aiWelcomeMessage, setAiWelcomeMessage] = useState('');
  const [aiCustomPrompt, setAiCustomPrompt] = useState('');
  const [aiSaveStatus, setAiSaveStatus] = useState<string | null>(null);
  const [notifications, setNotifications] = useState<string[]>([]);

  useEffect(() => {
    socket.on("whatsapp-message", (message: any) => {
      fetchMessages()
        .then((json) => setData(json))
        .catch((err) => setError(err.message))
        .finally(() => setLoading(false));
      const lastMsg = message.messages && message.messages.length > 0 ? message.messages[message.messages.length - 1] : null;
      let notifText = 'Nuevo mensaje recibido de ' + message.phone;
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
      socket.off("whatsapp-message");
    };
  }, []);

  useEffect(() => {
    socket.on("whatsapp-qr", setQr);
    return () => {
      socket.off("whatsapp-qr", setQr);
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
  }, []);

  function handleShowMessages(messages: any[]) {
    setModalMessages(messages);
    setModalOpen(true);
  }

  function renderTable(obj: any) {
    if (Array.isArray(obj)) {
      if (obj.length === 0) return <p>No data</p>;
      return (
        <table border={1} style={{ marginBottom: 20 }}>
          <thead>
            <tr>
              {Object.keys(obj[0]).map((key) => (
                <th key={key}>{key}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {obj.map((row: any, idx: number) => {
              let lastMsg = '';
              if (Array.isArray(row.messages) && row.messages.length > 0) {
                const last = row.messages[row.messages.length - 1];
                lastMsg = typeof last === 'object' && last.body ? last.body : '';
              }
              return (
                <tr key={idx}>
                  {Object.entries(row).map(([key, val], i) => (
                    key === 'messages' ? null : (
                      <td key={i}>{typeof val === 'object' && val !== null ? JSON.stringify(val) : String(val)}</td>
                    )
                  ))}
                  <td style={{ minWidth: 200 }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', position: 'relative' }}>
                      <div style={{ width: '100%', wordBreak: 'break-word' }}>{lastMsg}</div>
                      {Array.isArray(row.messages) && row.messages.length > 0 && (
                        <button
                          onClick={() => handleShowMessages(row.messages)}
                          style={{
                            marginTop: 12, // Espacio extra entre mensaje y botón
                            alignSelf: 'flex-end',
                            padding: '4px 12px',
                            background: '#007bff',
                            color: '#fff',
                            border: 'none',
                            borderRadius: 6,
                            fontWeight: 'bold',
                            cursor: 'pointer',
                            fontSize: 12
                          }}
                        >
                          Ver mensajes ({row.messages.length})
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      );
    } else if (typeof obj === 'object' && obj !== null) {
      // If object, try to render each key as a table if value is array
      return Object.entries(obj).map(([key, value]) => (
        <div key={key} style={{ marginBottom: 30 }}>
          <h3>{key}</h3>
          {renderTable(value)}
        </div>
      ));
    } else {
      return <pre>{JSON.stringify(obj, null, 2)}</pre>;
    }
  }

  function Modal({ open, onClose, messages }: { open: boolean, onClose: () => void, messages: any[] }) {
    if (!open) return null;
    return (
      <div style={{
        position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
        background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
      }}>
        <div style={{ background: 'rgba(255, 255, 255, 0.87)', padding: 24, borderRadius: 8, minWidth: 300, maxWidth: 600 }}>
          <ul style={{ maxHeight: 400, overflowY: 'auto', listStyle: 'none', padding: 0 }}>
            {messages.map((msg, idx) => {
              const isOutbound = msg.direction === 'outbound' || msg.direction === 'outbound-api';
              const isInbound = msg.direction === 'inbound';
              return (
                <li
                  key={idx}
                  style={{
                    marginBottom: 8,
                    display: 'flex',
                    justifyContent: isOutbound ? 'flex-end' : isInbound ? 'flex-start' : 'center',
                  }}
                >
                  <span
                    style={{
                      background: isOutbound ? '#DCF8C6' : '#FFF',
                      color: '#222',
                      borderRadius: 16,
                      padding: '8px 16px',
                      maxWidth: 350,
                      wordBreak: 'break-word',
                      boxShadow: '0 1px 2px rgba(0,0,0,0.08)',
                      alignSelf: isOutbound ? 'flex-end' : 'flex-start',
                    }}
                  >
                    {typeof msg === 'object' ? String(msg.body) : String(msg)}
                  </span>
                </li>
              );
            })}
          </ul>
          <button onClick={onClose} style={{ marginTop: 16, padding: '8px 16px' }}>Cerrar</button>
        </div>
      </div>
    );
  }

  function WhatsappModal({ open, onClose }: { open: boolean, onClose: () => void }) {
    if (!open) return null;
    return (
      <div style={{
        position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
        background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
      }}>
        <div style={{ background: 'rgba(255, 255, 255, 0.87)', padding: 24, borderRadius: 8, minWidth: 350, maxWidth: 600 }}>
          <h2>Escanea este QR con WhatsApp:</h2>
          {qr && <QRCodeCanvas value={qr} size={256} />}
          <div style={{ margin: '16px 0' }}>
            <input
              type="text"
              placeholder="Nombre de la sesión"
              value={sessionName}
              onChange={e => setSessionName(e.target.value)}
              style={{ padding: '8px', marginRight: '8px' }}
            />
            <button
              onClick={async () => {
                setLoading(true);
                setError(null);
                try {
                  await requestNewQr(sessionName);
                } catch (err: any) {
                  setError(err.message);
                } finally {
                  setQr("");
                  setLoading(false);
                }
              }}
              style={{ padding: '8px 16px' }}
              disabled={!sessionName || loading}
            >
              Solicitar nuevo QR
            </button>
          </div>
          {loading && <p>Loading...</p>}
          {error && <p style={{ color: 'red' }}>Error: {error}</p>}
          <button onClick={onClose} style={{ marginTop: 16, padding: '8px 16px' }}>Cerrar</button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <aside style={{ width: 220, background: 'whitesmoke', color: 'black', padding: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>
        <h2 style={{ marginBottom: 32 }}>Menú</h2>
        <button onClick={() => setWhatsappModalOpen(true)} style={{ padding: '12px 16px', background: '#25D366', color: '#fff', border: 'none', borderRadius: 6, fontWeight: 'bold', cursor: 'pointer' }}>
          Whatsapp QR
        </button>
        <button onClick={() => setActiveTab('data')} style={{ padding: '12px 16px', background: activeTab === 'data' ? '#007bff' : '#eee', color: activeTab === 'data' ? '#fff' : '#222', border: 'none', borderRadius: 6, fontWeight: 'bold', cursor: 'pointer' }}>
          Backend Data Table
        </button>
        <button onClick={() => setActiveTab('ai')} style={{ padding: '12px 16px', background: activeTab === 'ai' ? '#007bff' : '#eee', color: activeTab === 'ai' ? '#fff' : '#222', border: 'none', borderRadius: 6, fontWeight: 'bold', cursor: 'pointer' }}>
          AI Config
        </button>
      </aside>
      <main style={{ flex: 1, padding: 24, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', width: '100vw', boxSizing: 'border-box' }}>
        <div style={{ width: '100%', maxWidth: activeTab === 'ai' ? 500 : 1200, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', margin: '0 auto' }}>
          {activeTab === 'data' && (
            <>
              <h1 style={{ textAlign: 'center', width: '100%' }}>Backend Data Table</h1>
              {loading && <p>Loading...</p>}
              {error && <p style={{ color: 'red' }}>Error: {error}</p>}
              <div style={{ width: '100%', maxWidth: 900, overflowX: 'auto', display: 'flex', justifyContent: 'center', margin: '0 auto' }}>{data && renderTable(data)}</div>
            </>
          )}
          {activeTab === 'ai' && (
            <div style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
              <h1 style={{ textAlign: 'center' }}>Configuración de AI</h1>
              <form
                onSubmit={async e => {
                  e.preventDefault();
                  setAiSaveStatus(null);
                  try {
                    await saveAiConfig(aiConfig);
                    setAiSaveStatus('Configuración guardada correctamente.');
                  } catch (err: any) {
                    setAiSaveStatus('Error al guardar la configuración.');
                  }
                }}
                style={{ width: '100%', maxWidth: 500, margin: '0 auto' }}
              >
                <div style={{ marginBottom: 16 }}>
                  <label style={{ display: 'block', marginBottom: 4, color: 'black'}}>Saludo</label>
                  <input
                    type="text"
                    value={aiConfig.welcomeMessage}
                    onChange={e => setAiWelcomeMessage(e.target.value)}
                    style={{ width: '100%', padding: 8, borderRadius: 4, border: '1px solid #ccc' }}
                    required
                  />
                </div>
                <div style={{ marginBottom: 16 }}>
                  <label style={{ display: 'block', marginBottom: 4, color: 'black' }}>Contexto</label>
                  <textarea
                    value={aiConfig.customPrompt}
                    onChange={e => setAiCustomPrompt(e.target.value)}
                    style={{ width: '100%', padding: 8, borderRadius: 4, border: '1px solid #ccc', minHeight: 80 }}
                    required
                  />
                </div>
                <button type="submit" style={{ padding: '8px 16px', background: '#007bff', color: '#fff', border: 'none', borderRadius: 6, fontWeight: 'bold', cursor: 'pointer', width: '100%' }}>
                  Guardar configuración
                </button>
                {aiSaveStatus && <p style={{ marginTop: 12, color: aiSaveStatus.startsWith('Error') ? 'red' : 'green', textAlign: 'center' }}>{aiSaveStatus}</p>}
              </form>
            </div>
          )}
        </div>
      </main>
      <WhatsappModal open={whatsappModalOpen} onClose={() => setWhatsappModalOpen(false)} />
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} messages={modalMessages} />
      {notifications.length > 0 && (
        <div style={{
          position: 'fixed',
          right: 24,
          bottom: 24,
          display: 'flex',
          flexDirection: 'column-reverse',
          gap: 12,
          zIndex: 2000
        }}>
          {notifications.map((notification, idx) => (
            <div key={idx} style={{
              background: '#222',
              color: '#fff',
              padding: '16px 24px',
              borderRadius: 8,
              boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
              fontWeight: 'bold',
              fontSize: 16,
              marginBottom: 0
            }}>
              {notification}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default App
