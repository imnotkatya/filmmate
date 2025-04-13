import { useState } from "react";
import { useNavigate } from "react-router-dom";

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
    <div style={{ textAlign: "center", fontFamily: "Arial", marginTop: "50px" }}>
      <h2>{isRegister ? "Регистрация" : "Вход"}</h2>
      <button onClick={() => navigate("/")}>На главную</button>

      <form onSubmit={handleSubmit} style={{ display: "inline-block", textAlign: "left" }}>
        {isRegister && !isRegistered && (
          <>
            <label>Никнейм:</label>
            <input 
              type="text" 
              value={nickname} 
              onChange={(e) => setNickname(e.target.value)} 
              required 
              style={inputStyle}
            />
          </>
        )}

        <label>Email:</label>
        <input 
          type="email" 
          value={email} 
          onChange={(e) => setEmail(e.target.value)} 
          required 
          style={inputStyle}
        />

        <label>Пароль:</label>
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

const inputStyle = {
  display: "block",
  width: "250px",
  padding: "8px",
  margin: "10px 0",
  borderRadius: "5px",
  border: "1px solid #ccc"
};

const buttonStyle = {
  padding: "10px 20px",
  fontSize: "16px",
  cursor: "pointer",
  borderRadius: "5px",
  border: "none",
  backgroundColor: "#28a745",
  color: "#fff",
  marginTop: "10px",
  width: "100%"
};

export default Auth;
