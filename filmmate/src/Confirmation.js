import React from 'react';
import { useNavigate } from "react-router-dom";

function Confirmation() {
  const navigate = useNavigate();

  return (
    <div style={styles.container}>
      <h1 style={styles.title}>Спасибо за покупку!</h1>
      <p style={styles.message}>Ваши билеты успешно куплены. Мы отправили их на ваш email.</p>
      <button style={styles.button} onClick={() => navigate("/")}>
        На главную
      </button>
    </div>
  );
}

const styles = {
  container: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    minHeight: "100vh",
    padding: "40px",
  
    color: "#f5f5f5",
    textAlign: "center",
  },
  title: {
    fontSize: "48px",
    marginBottom: "20px",
  },
  message: {
    fontSize: "20px",
    marginBottom: "40px",
    maxWidth: "600px",
  },
  button: {
    padding: "16px 32px",
    fontSize: "18px",
    backgroundColor: "#ff9800",
    color: "#fff",
    border: "none",
    borderRadius: "10px",
    cursor: "pointer",
    transition: "background-color 0.3s ease, transform 0.2s ease",
  },
};

export default Confirmation;
