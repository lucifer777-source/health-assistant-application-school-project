
import { useState } from "react";

function Register({ onRegister }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const handleRegister = async (e) => {
    e.preventDefault();

    try {
      const response = await fetch(
        "http://127.0.0.1:5000/register",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            username: username,
            password: password,
          }),
        }
      );

      const data = await response.json();

      if (response.ok) {
        alert("Registration successful!");

        onRegister();
      } else {
        alert(data.error);
      }

    } catch (error) {
      console.error(error);
      alert("Could not connect to the server.");
    }
  };

  return (
    <div className="auth-container">

      <h1>🏥 Health Assistant</h1>

      <h2>Create Account</h2>

      <form onSubmit={handleRegister}>

        <input
          type="text"
          placeholder="Username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
        />

        <br />

        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        <br />

        <button type="submit">
          Register
        </button>

      </form>

    </div>
  );
}

export default Register;

