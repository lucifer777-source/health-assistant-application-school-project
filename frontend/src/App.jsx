import { useState, useEffect } from "react";
import "./App.css";

import Login from "./Login";
import Register from "./Register";

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(
    !!localStorage.getItem("token")
  );

  const [showRegister, setShowRegister] = useState(false);

  if (!isLoggedIn) {
    if (showRegister) {
      return (
        <div className="auth-container">
          <Register
            onRegister={() => {
              setShowRegister(false);
            }}
          />

          <p>Already have an account?</p>

          <button onClick={() => setShowRegister(false)}>
            Login
          </button>
        </div>
      );
    }

    return (
      <div className="auth-container">
        <Login
          onLogin={() => {
            setIsLoggedIn(true);
          }}
        />

        <p>Don't have an account?</p>

        <button onClick={() => setShowRegister(true)}>
          Register
        </button>
      </div>
    );
  }

  return (
    <Chatbot
      onLogout={() => {
        localStorage.removeItem("token");
        localStorage.removeItem("username");
        setIsLoggedIn(false);
      }}
    />
  );
}


// =================================
// CHATBOT
// =================================

function Chatbot({ onLogout }) {
  const [message, setMessage] = useState("");

  const [messages, setMessages] = useState([
    {
      sender: "bot",
      text: "Hello! I am your Health Assistant. How can I help you?"
    }
  ]);

  const [isTyping, setIsTyping] = useState(false);
  const [activePage, setActivePage] = useState("dashboard");

  useEffect(() => {
    async function loadHistory() {
      const token = localStorage.getItem("token");

      try {
        const response = await fetch(
          "http://127.0.0.1:5000/history",
          {
            headers: {
              Authorization: `Bearer ${token}`
            }
          }
        );

        if (response.status === 401) {
          onLogout();
          return;
        }

        const data = await response.json();

        if (data.length > 0) {
          setMessages(data);
        }
      } catch (error) {
        console.error("History error:", error);
      }
    }

    loadHistory();
  }, []);

  async function typeMessage(text) {
    let currentText = "";

    setMessages(prev => [
      ...prev,
      {
        sender: "bot",
        text: ""
      }
    ]);

    for (let i = 0; i < text.length; i++) {
      currentText += text[i];

      setMessages(prev => {
        const updated = [...prev];

        updated[updated.length - 1] = {
          sender: "bot",
          text: currentText
        };

        return updated;
      });

      await new Promise(resolve =>
        setTimeout(resolve, 30)
      );
    }
  }

  async function sendMessage() {
    if (message.trim() === "") {
      return;
    }

    const token = localStorage.getItem("token");

    const userMessage = {
      sender: "user",
      text: message
    };

    setMessages(prev => [
      ...prev,
      userMessage
    ]);

    const currentMessage = message;

    setMessage("");
    setIsTyping(true);

    try {
      const response = await fetch(
        "http://127.0.0.1:5000/chat",
        {
          method: "POST",

          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`
          },

          body: JSON.stringify({
            message: currentMessage
          })
        }
      );

      if (response.status === 401) {
        onLogout();
        return;
      }

      const data = await response.json();

      setIsTyping(false);

      await typeMessage(data.reply);

    } catch (error) {
      console.error("Chat error:", error);

      setIsTyping(false);
    }
  }

  const username =
    localStorage.getItem("username") || "User";

  return (
    <div className="health-app">

      {/* SIDEBAR */}

      <aside className="sidebar">

        <div className="logo">
          <div className="logo-icon">🩺</div>

          <div>
            <h2>Health</h2>
            <span>Assistant</span>
          </div>
        </div>

        <nav className="sidebar-nav">

         <button
  className={`nav-item ${
    activePage === "dashboard" ? "active" : ""
  }`}
  onClick={() => setActivePage("dashboard")}
>
  <span>🏠</span>
  Dashboard
</button>

          <button
  className={`nav-item ${
    activePage === "assistant" ? "active" : ""
  }`}
  onClick={() => setActivePage("assistant")}
>
  <span>💬</span>
  AI Assistant
</button>
<button
  className={`nav-item ${
    activePage === "symptoms" ? "active" : ""
  }`}
  onClick={() => setActivePage("symptoms")}
>
  <span>🔍</span>
  Symptom Checker
</button>

          <button
  className={`nav-item ${
    activePage === "history" ? "active" : ""
  }`}
  onClick={() => setActivePage("history")}
>
  <span>📋</span>
  Health History
</button>

        </nav>

        <div className="sidebar-bottom">

          <button
  className={`nav-item ${
    activePage === "settings" ? "active" : ""
  }`}
  onClick={() => setActivePage("settings")}
>
  <span>⚙️</span>
  Settings
</button>

          <button className="nav-item">
            <span>👤</span>
            Profile
          </button>

          <button
            className="nav-item logout"
            onClick={onLogout}
          >
            <span>🚪</span>
            Logout
          </button>

        </div>

      </aside>


      {/* MAIN CONTENT */}

      <main className="main-content">

  {activePage === "dashboard" && (
    <>
      <header className="topbar">

          <div>
            <p className="welcome-small">
              Health Dashboard
            </p>

            <h1>
              Good evening, {username} 👋
            </h1>
          </div>

          <div className="profile-circle">
            {username.charAt(0).toUpperCase()}
          </div>

        </header>


        <section className="hero">

          <div>

            <span className="hero-label">
              🩺 YOUR PERSONAL HEALTH ASSISTANT
            </span>

            <h2>
              How can I help you today?
            </h2>

            <p>
              Ask questions about symptoms, health,
              nutrition, or general wellness.
            </p>

          </div>

        </section>
        


        {/* QUICK ACTIONS */}

        <section className="quick-actions">

          <div className="section-title">
            <h3>Quick Actions</h3>
          </div>

          <div className="action-grid">

            <button
  className="action-card"
  onClick={() => setActivePage("symptoms")}
>
  <div className="action-icon">🔍</div>
  <div>
    <strong>Check Symptoms</strong>
    <p>Understand your symptoms</p>
  </div>
</button>

            <button
  className="action-card"
  onClick={() => setActivePage("nutrition")}
>
  <div className="action-icon">🥗</div>
  <div>
    <strong>Health & Nutrition</strong>
    <p>Get healthy lifestyle advice</p>
  </div>
</button>

            <button
  className="action-card"
  onClick={() => setActivePage("history")}
>
  <div className="action-icon">📋</div>
  <div>
    <strong>Health History</strong>
    <p>Review your conversations</p>
  </div>
</button>

          </div>

        </section>


        {/* CHAT */}

        <section className="chat-section">

          <div className="chat-header">

            <div className="assistant-info">

              <div className="assistant-avatar">
                🩺
              </div>

              <div>
                <strong>Health Assistant</strong>
                <span>
                  ● Online
                </span>
              </div>

            </div>

          </div>


          <div className="chat-messages">

            {messages.map((msg, index) => (

              <div
                key={index}
                className={
                  msg.sender === "user"
                    ? "chat-message user-message"
                    : "chat-message bot-message"
                }
              >

                {msg.sender === "bot" && (
                  <div className="message-avatar">
                    🩺
                  </div>
                )}

                <div className="message-bubble">
                  {msg.text}
                </div>

              </div>

            ))}

            {isTyping && (
              <div className="chat-message bot-message">

                <div className="message-avatar">
                  🩺
                </div>

                <div className="message-bubble typing">
                  <span></span>
                  <span></span>
                  <span></span>
                </div>

              </div>
            )}

          </div>


          <div className="chat-input-area">

            <input
              type="text"
              value={message}
              placeholder="Ask your health question..."
              onChange={(e) =>
                setMessage(e.target.value)
              }
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  sendMessage();
                }
              }}
            />

            <button
              className="send-button"
              onClick={sendMessage}
            >
              ➤
            </button>

          </div>

          <p className="medical-note">
            ⚠️ Health Assistant provides general information
            and is not a substitute for professional medical advice.
          </p>

                </section>
    </>
  )}

  {activePage === "assistant" && (
    <section className="assistant-page">

      <div className="topbar">
        <div>
          <p className="welcome-small">
            AI Health Assistant
          </p>

          <h1>
            Ask me anything about your health
          </h1>
        </div>

        <div className="profile-circle">
          {username.charAt(0).toUpperCase()}
        </div>
      </div>

      <section className="chat-section">

        <div className="chat-header">

          <div className="assistant-info">

            <div className="assistant-avatar">
              🩺
            </div>

            <div>
              <strong>Health Assistant</strong>

              <span>
                ● Online
              </span>
            </div>

          </div>

        </div>


        <div className="chat-messages">

          {messages.map((msg, index) => (

            <div
              key={index}
              className={
                msg.sender === "user"
                  ? "chat-message user-message"
                  : "chat-message bot-message"
              }
            >

              {msg.sender === "bot" && (
                <div className="message-avatar">
                  🩺
                </div>
              )}

              <div className="message-bubble">
                {msg.text}
              </div>

            </div>

          ))}


          {isTyping && (
            <div className="chat-message bot-message">

              <div className="message-avatar">
                🩺
              </div>

              <div className="message-bubble typing">
                <span></span>
                <span></span>
                <span></span>
              </div>

            </div>
          )}

        </div>


        <div className="chat-input-area">

          <input
            type="text"
            value={message}
            placeholder="Ask your health question..."
            onChange={(e) =>
              setMessage(e.target.value)
            }
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                sendMessage();
              }
            }}
          />

          <button
            className="send-button"
            onClick={sendMessage}
          >
            ➤
          </button>

        </div>

        <p className="medical-note">
          ⚠️ Health Assistant provides general information
          and is not a substitute for professional medical advice.
        </p>

      </section>

    </section>
  )}
  {activePage === "symptoms" && (
  <SymptomChecker />
)}

{activePage === "history" && (
  <HealthHistory messages={messages} />
)}

{activePage === "nutrition" && (
  <NutritionPage />
)}

{activePage === "settings" && (
  <Settings />
)}

</main>

    </div>
  );
}
function SymptomChecker() {
  const [selectedSymptoms, setSelectedSymptoms] = useState([]);
  const [result, setResult] = useState(null);

  const symptoms = [
    "Headache",
    "Fever",
    "Cough",
    "Sore throat",
    "Runny nose",
    "Nausea",
    "Dizziness",
    "Fatigue",
    "Stomach pain",
    "Back pain",
    "Chest pain",
    "Shortness of breath"
  ];

  function toggleSymptom(symptom) {
    setSelectedSymptoms(prev => {
      if (prev.includes(symptom)) {
        return prev.filter(item => item !== symptom);
      }

      return [...prev, symptom];
    });

    setResult(null);
  }

  function checkSymptoms() {
    if (selectedSymptoms.length === 0) {
      setResult({
        type: "warning",
        title: "Select at least one symptom",
        text: "Please select the symptoms you are experiencing."
      });

      return;
    }

    const emergencySymptoms = [
      "Chest pain",
      "Shortness of breath"
    ];

    const hasEmergencySymptom =
      selectedSymptoms.some(symptom =>
        emergencySymptoms.includes(symptom)
      );

    if (hasEmergencySymptom) {
      setResult({
        type: "urgent",
        title: "Seek medical attention",
        text:
          "Some of the symptoms you selected can sometimes require urgent medical evaluation. If your symptoms are severe, sudden, or getting worse, seek appropriate medical care."
      });

      return;
    }

    setResult({
      type: "normal",
      title: "Symptoms recorded",
      text:
        "Your selected symptoms have been recorded. This checker does not diagnose medical conditions. A healthcare professional can provide an accurate evaluation."
    });
  }

  return (
    <section className="symptom-page">

      <div className="topbar">

        <div>
          <p className="welcome-small">
            HEALTH TOOLS
          </p>

          <h1>
            Symptom Checker
          </h1>
        </div>

      </div>


      <div className="symptom-intro">

        <div className="symptom-intro-icon">
          🔍
        </div>

        <div>
          <h2>
            What are you experiencing?
          </h2>

          <p>
            Select the symptoms you are currently
            experiencing. We'll help you organize the
            information for better understanding.
          </p>
        </div>

      </div>


      <div className="symptom-card">

        <h3>
          Select your symptoms
        </h3>

        <p className="symptom-subtitle">
          Choose all that apply.
        </p>


        <div className="symptom-grid">

          {symptoms.map(symptom => (

            <button
              key={symptom}
              className={
                selectedSymptoms.includes(symptom)
                  ? "symptom-button selected"
                  : "symptom-button"
              }
              onClick={() =>
                toggleSymptom(symptom)
              }
            >

              {selectedSymptoms.includes(symptom)
                ? "✓"
                : "+"}

              <span>
                {symptom}
              </span>

            </button>

          ))}

        </div>


        {selectedSymptoms.length > 0 && (

          <div className="selected-section">

            <h4>
              Selected symptoms
            </h4>

            <div className="selected-list">

              {selectedSymptoms.map(symptom => (

                <span
                  key={symptom}
                  className="selected-tag"
                >
                  {symptom}

                  <button
                    onClick={() =>
                      toggleSymptom(symptom)
                    }
                  >
                    ×
                  </button>

                </span>

              ))}

            </div>

          </div>

        )}


        <button
          className="check-symptoms-button"
          onClick={checkSymptoms}
        >
          Check Symptoms
          <span>→</span>
        </button>


        {result && (

          <div
            className={`symptom-result ${result.type}`}
          >

            <h3>
              {result.title}
            </h3>

            <p>
              {result.text}
            </p>

          </div>

        )}

      </div>


      <div className="symptom-disclaimer">

        ⚠️ <strong>Important:</strong> This tool is for
        general health information only and does not
        provide a medical diagnosis. If you are
        experiencing severe or concerning symptoms,
        contact a qualified healthcare professional.

      </div>

    </section>
  );
}

function NutritionPage() {
  return (
    <section className="nutrition-page">

      <div className="topbar">
        <div>
          <p className="welcome-small">
            HEALTH & WELLNESS
          </p>

          <h1>
            Health & Nutrition
          </h1>
        </div>
      </div>

      <div className="nutrition-intro">
        <div className="nutrition-intro-icon">
          🥗
        </div>

        <div>
          <h2>
            Take care of your health
          </h2>

          <p>
            Learn about nutrition, healthy eating,
            hydration, exercise, and everyday wellness.
          </p>
        </div>
      </div>

      <div className="nutrition-grid">

        <div className="nutrition-card">
          <div className="nutrition-icon">🥦</div>
          <h3>Healthy Eating</h3>
          <p>
            Learn about balanced meals and nutritious
            food choices.
          </p>
        </div>

        <div className="nutrition-card">
          <div className="nutrition-icon">💧</div>
          <h3>Hydration</h3>
          <p>
            Understand the importance of staying
            properly hydrated.
          </p>
        </div>

        <div className="nutrition-card">
          <div className="nutrition-icon">🏃</div>
          <h3>Exercise</h3>
          <p>
            Discover simple ways to stay active
            and maintain fitness.
          </p>
        </div>

        <div className="nutrition-card">
          <div className="nutrition-icon">😴</div>
          <h3>Sleep & Recovery</h3>
          <p>
            Learn how sleep and recovery support
            overall wellness.
          </p>
        </div>

      </div>

    </section>
  );
}
function HealthHistory({ messages }) {
  return (
    <section className="history-page">

      <div className="topbar">
        <div>
          <p className="welcome-small">
            YOUR HEALTH RECORD
          </p>

          <h1>
            Health History
          </h1>
        </div>
      </div>

      <div className="history-intro">
        <div className="history-intro-icon">
          📋
        </div>

        <div>
          <h2>
            Your conversations
          </h2>

          <p>
            Review your previous conversations
            with Health Assistant.
          </p>
        </div>
      </div>

      <div className="history-card">

        {messages.length === 0 ? (
          <div className="empty-history">
            <div>📭</div>
            <h3>No health history yet</h3>
            <p>
              Your conversations with Health Assistant
              will appear here.
            </p>
          </div>
        ) : (

          <div className="history-list">

            {messages.map((msg, index) => (

              <div
                key={index}
                className={`history-item ${
                  msg.sender === "user"
                    ? "history-user"
                    : "history-bot"
                }`}
              >

                <div className="history-icon">
                  {msg.sender === "user"
                    ? "👤"
                    : "🩺"}
                </div>

                <div className="history-content">

                  <strong>
                    {msg.sender === "user"
                      ? "You"
                      : "Health Assistant"}
                  </strong>

                  <p>
                    {msg.text}
                  </p>

                </div>

              </div>

            ))}

          </div>

        )}

      </div>

    </section>
  );
}

function Settings() {
  const [darkMode, setDarkMode] = useState(false);
  const [notifications, setNotifications] = useState(true);
  const [typingAnimation, setTypingAnimation] = useState(true);

  return (
    <section className="settings-page">

      <div className="topbar">
        <div>
          <p className="welcome-small">
            APPLICATION SETTINGS
          </p>

          <h1>
            Settings
          </h1>
        </div>
      </div>


      <div className="settings-container">

        {/* APPEARANCE */}

        <div className="settings-card">

          <h2>Appearance</h2>

          <div className="setting-row">

            <div>
              <strong>🌙 Dark Mode</strong>

              <p>
                Switch between light and dark themes.
              </p>
            </div>

            <button
              className={`toggle ${
                darkMode ? "toggle-active" : ""
              }`}
              onClick={() =>
                setDarkMode(!darkMode)
              }
            >
              <span></span>
            </button>

          </div>

        </div>


        {/* NOTIFICATIONS */}

        <div className="settings-card">

          <h2>Preferences</h2>

          <div className="setting-row">

            <div>
              <strong>🔔 Notifications</strong>

              <p>
                Receive health reminders and updates.
              </p>
            </div>

            <button
              className={`toggle ${
                notifications ? "toggle-active" : ""
              }`}
              onClick={() =>
                setNotifications(!notifications)
              }
            >
              <span></span>
            </button>

          </div>


          <div className="setting-row">

            <div>
              <strong>💬 Typing Animation</strong>

              <p>
                Show the assistant typing animation.
              </p>
            </div>

            <button
              className={`toggle ${
                typingAnimation
                  ? "toggle-active"
                  : ""
              }`}
              onClick={() =>
                setTypingAnimation(
                  !typingAnimation
                )
              }
            >
              <span></span>
            </button>

          </div>

        </div>


        {/* DATA */}

        <div className="settings-card danger-card">

          <h2>Data Management</h2>

          <div className="setting-row">

            <div>
              <strong>🗑️ Clear Chat History</strong>

              <p>
                Permanently remove all your
                conversation history.
              </p>
            </div>

            <button className="danger-button">
              Clear History
            </button>

          </div>

        </div>

      </div>

    </section>
  );
}

export default App;
