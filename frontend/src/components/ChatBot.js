import React, { useState } from 'react';

const ChatBot = () => {
  const [mensaje, setMensaje] = useState('');
  const [conversacion, setConversacion] = useState([]);
  const [cargando, setCargando] = useState(false);

  const enviarMensaje = async () => {
    if (!mensaje.trim()) return;
    setConversacion([...conversacion, { de: 'usuario', texto: mensaje }]);
    setCargando(true);
    setMensaje('');
    try {
      const res = await fetch('/api/chatbot/preguntar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pregunta: mensaje })
      });
      const data = await res.json();
      setConversacion(conv => [...conv, { de: 'bot', texto: data.respuesta }]);
    } catch (e) {
      setConversacion(conv => [...conv, { de: 'bot', texto: 'Error de conexión.' }]);
    }
    setCargando(false);
  };

  return (
    <div style={{ border: '1px solid #ccc', borderRadius: 8, padding: 16, width: 350 }}>
      <div style={{ height: 200, overflowY: 'auto', marginBottom: 8 }}>
        {conversacion.map((msg, i) => (
          <div key={i} style={{ textAlign: msg.de === 'usuario' ? 'right' : 'left' }}>
            <b>{msg.de === 'usuario' ? 'Tú' : 'Bot'}:</b> {msg.texto}
          </div>
        ))}
        {cargando && <div><i>El bot está pensando...</i></div>}
      </div>
      <input
        value={mensaje}
        onChange={e => setMensaje(e.target.value)}
        onKeyDown={e => e.key === 'Enter' && enviarMensaje()}
        placeholder="Escribe tu pregunta..."
        style={{ width: '80%' }}
      />
      <button onClick={enviarMensaje} disabled={cargando}>Enviar</button>
    </div>
  );
};

export default ChatBot;
