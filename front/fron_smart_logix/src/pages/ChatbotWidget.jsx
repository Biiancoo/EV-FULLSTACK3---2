import { useState, useRef, useEffect } from "react";
import { askChatbot } from "../service/chatbotService";

function ChatbotWidget() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([
    { role: "bot", text: "Hola! Soy el asistente de SmartLogix. Puedo ayudarte con consultas sobre inventario, ordenes y envios.", source: "" }
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function handleSend(e) {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userText = input.trim();
    setMessages((prev) => [...prev, { role: "user", text: userText, source: "" }]);
    setInput("");
    setLoading(true);

    try {
      const resp = await askChatbot(userText);
      setMessages((prev) => [
        ...prev,
        { role: "bot", text: resp.answer, source: resp.source || "" }
      ]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        { role: "bot", text: "Lo siento, no pude procesar tu consulta en este momento. Intentalo mas tarde.", source: "ERROR" }
      ]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="chatbot-widget">
      {open && (
        <div className="chatbot-panel">
          <div className="chatbot-header">
            <span>Asistente SmartLogix</span>
            <button className="chatbot-close" onClick={() => setOpen(false)}>X</button>
          </div>
          <div className="chatbot-messages">
            {messages.map((msg, idx) => (
              <div key={idx} className={`chatbot-msg chatbot-msg--${msg.role}`}>
                <div className="chatbot-bubble">
                  {msg.text}
                  {msg.source && (
                    <span className={`chatbot-source chatbot-source--${msg.source.toLowerCase()}`}>
                      {msg.source === "GEMINI" ? "IA Gemini" : msg.source === "RULES" ? "Reglas locales" : msg.source}
                    </span>
                  )}
                </div>
              </div>
            ))}
            {loading && (
              <div className="chatbot-msg chatbot-msg--bot">
                <div className="chatbot-bubble chatbot-bubble--loading">
                  <span className="chatbot-typing">Escribiendo</span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
          <form className="chatbot-form" onSubmit={handleSend}>
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Escribe tu consulta..."
              disabled={loading}
            />
            <button type="submit" disabled={loading || !input.trim()}>
              Enviar
            </button>
          </form>
        </div>
      )}
      <button
        className="chatbot-toggle"
        onClick={() => setOpen(!open)}
        title={open ? "Cerrar chat" : "Abrir chat"}
      >
        {open ? "X" : "?"}
      </button>
    </div>
  );
}

export default ChatbotWidget;
