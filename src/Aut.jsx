import { useState } from "react";
import { useNavigate } from "react-router-dom";
import left from './assets/arrow-left.svg';

function Auth() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [nickname, setNickname] = useState(""); // Никнейм
  const [error, setError] = useState(null);
  const [isRegister, setIsRegister] = useState(false); // Переключение между регистрацией и входом
  const [loading, setLoading] = useState(false); // Состояние загрузки
  const [isRegistered, setIsRegistered] = useState(false); // Состояние успешной регистрации
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const userData = {
      email,
      password,
      nickname: isRegister ? nickname : undefined, // Только при регистрации передаем nickname
      role: "user",
    };

    try {
      let response;
      if (isRegister) {
        // Отправка данных для регистрации
        response = await fetch("http://localhost:5000/api/register", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(userData),
        });
      } else {
        // Отправка данных для входа
        response = await fetch("http://localhost:5000/api/login", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(userData),
        });
      }

      const data = await response.json();

      if (response.ok) {
        if (isRegister) {
          // Если регистрация успешна, переключаем на форму входа
          setIsRegister(false);
          setIsRegistered(true); // Отмечаем, что регистрация прошла успешно
          setError('Регистрация успешна, теперь войдите в систему');
        } else {
          // Если вход успешен
          if (data.userProfile && data.userProfile.user_id) {
            // Сохранение данных пользователя
            localStorage.setItem("user", JSON.stringify(data.userProfile));
            navigate(`/profile/${data.userProfile.user_id}`);
          } else {
            setError('Ошибка: user_id не найден в ответе');
          }
        }
      } else {
        setError(data.message || "Произошла ошибка");
      }
    } catch (err) {
      console.error("Ошибка при подключении к серверу:", err);
      setError("Ошибка при подключении к серверу...");
    } finally {
      setLoading(false); // Завершаем состояние загрузки
    }
  };

  return (
    <div style={containerStyle}>
      {/* Стрелка слева */}
      <img 
        src={left} 
        onClick={() => navigate("/")} 
        style={backButtonStyle} 
        alt="Back" 
      />

      <h2 style={headerStyle}>{isRegister ? "Регистрация" : "Вход"}</h2>

      <form onSubmit={handleSubmit} style={formStyle}>
        {isRegister && !isRegistered && (
          <>
            <label style={labelStyle}>Никнейм:</label>
            <input 
              type="text" 
              value={nickname} 
              onChange={(e) => setNickname(e.target.value)} 
              required 
              style={inputStyle}
            />
          </>
        )}

        <label style={labelStyle}>Email:</label>
        <input 
          type="email" 
          value={email} 
          onChange={(e) => setEmail(e.target.value)} 
          required 
          style={inputStyle}
        />

        <label style={labelStyle}>Пароль:</label>
        <input 
          type="password" 
          value={password} 
          onChange={(e) => setPassword(e.target.value)} 
          required 
          style={inputStyle}
        />

        {error && <p style={{ color: "red" }}>{error}</p>}
        {loading && <p style={{ color: "blue" }}>Загрузка...</p>} {/* Индикатор загрузки */}

        <button type="submit" style={buttonStyle} disabled={loading}> {/* Отключаем кнопку во время загрузки */}
          {isRegister ? "Зарегистрироваться" : "Войти"}
        </button>
      </form>

      {!isRegister && isRegistered && (
        <div>
          <p>Регистрация прошла успешно! Пожалуйста, войдите в систему, используя вашу почту и пароль.</p>
        </div>
      )}

      <button 
        onClick={() => {
          setIsRegister(!isRegister);
          setError(null); // Сброс ошибки при переключении режима
        }} 
        style={{ ...buttonStyle, backgroundColor: "#007bff", marginTop: "10px" }}
      >
        {isRegister ? "Уже есть аккаунт? Войти" : "Нет аккаунта? Зарегистрироваться"}
      </button>
    </div>
  );
}

const containerStyle = {
  textAlign: "center",
  fontFamily: "Arial",
  marginTop: "50px",
  maxWidth: "500px",
  margin: "0 auto"
};

const backButtonStyle = {
  cursor: "pointer",
  position: "absolute", // Добавлено для позиционирования
  left: "20px", // Стрелка теперь будет с левой стороны
  top: "20px", // Отступ сверху
};

const headerStyle = {
  fontSize: "40px",
  marginBottom: "20px"
};

const formStyle = {
  display: "inline-block",
  textAlign: "left",
  width: "100%"
};

const labelStyle = {
  fontSize: "18px",
  display: "block",
  marginBottom: "5px",
};

const inputStyle = {
  display: "block",
  width: "100%",
  padding: "12px",
  margin: "10px 0",
  borderRadius: "5px",
  border: "1px solid #ccc",
  fontSize: "16px",
};

const buttonStyle = {
  padding: "12px 20px",
  fontSize: "16px",
  cursor: "pointer",
  borderRadius: "5px",
  border: "none",
  backgroundColor: "#28a745",
  color: "#fff",
  marginTop: "10px",
  width: "100%",
  transition: "background-color 0.3s",
};

buttonStyle[":hover"] = {
  backgroundColor: "#218838"
};

export default Auth;
