import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import './BuyTickets.css';  // Подключаем стили

function BuyTickets() {
  const navigate = useNavigate();
  const { movieId } = useParams();  // Извлекаем movieId из URL
  const [movies, setMovies] = useState([]);
  const [theaters, setTheaters] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [selectedTheater, setSelectedTheater] = useState(null);
  const [selectedDate, setSelectedDate] = useState(null);
  const [availableSessions, setAvailableSessions] = useState([]);
  const [selectedSession, setSelectedSession] = useState(null);
  const [availableSeats, setAvailableSeats] = useState([]);
  const [selectedSeats, setSelectedSeats] = useState([]);  // Хранение выбранных мест
  const [userEmail, setUserEmail] = useState("");  // Состояние для email
  const [userId, setUserId] = useState(null);  // Состояние для ID пользователя
  const [emailConfirmed, setEmailConfirmed] = useState(false);  // Состояние подтверждения email
  const [totalPrice, setTotalPrice] = useState(0); // Для расчета общей стоимости

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch("http://localhost:5000/api/all-tables");
        const data = await response.json();
        setMovies(data.movies);
        setSessions(data.sessions);
        setTheaters(data.theaters);

        // Убедимся, что movieId в URL существует и что он есть в списке фильмов
        if (data.movies.some(movie => movie.movie_id === parseInt(movieId))) {
          const filteredSessions = data.sessions.filter(session => session.movie_id === parseInt(movieId));
          setAvailableSessions(filteredSessions);

          // Если сеансы есть, то выбираем первый
          if (filteredSessions.length > 0) {
            setSelectedSession(filteredSessions[0].session_id);
            setSelectedDate(filteredSessions[0].session_date);
            setSelectedTheater(filteredSessions[0].theater_id);
          }
        }
      } catch (error) {
        console.error("Ошибка загрузки данных:", error.message);
      }
    };

    fetchData();
  }, [movieId]);

  const updateAvailableSessions = (theaterId, date, allSessions) => {
    const filteredSessions = allSessions.filter(s => s.theater_id === theaterId && s.session_date === date && s.movie_id === parseInt(movieId));
    setAvailableSessions(filteredSessions);
    if (filteredSessions.length > 0) {
      setSelectedSession(filteredSessions[0].session_id);
      fetchSeats(filteredSessions[0].session_id);
    } else {
      setSelectedSession(null);
      setAvailableSeats([]);
    }
  };

  const handleTheaterSelect = (theaterId) => {
    setSelectedTheater(theaterId);
    updateAvailableSessions(theaterId, selectedDate, sessions);
  };

  const handleDateSelect = (date) => {
    setSelectedDate(date);
    updateAvailableSessions(selectedTheater, date, sessions);
  };

  const handleTimeSelect = (sessionId) => {
    setSelectedSession(sessionId);
    if (sessionId) fetchSeats(sessionId);  // Only fetch seats if sessionId is valid
  };

  const fetchSeats = async (sessionId) => {
    try {
      const response = await fetch(`http://localhost:5000/api/seats/${sessionId}`);
      const data = await response.json();
  
      // Выводим полученные данные для проверки
      console.log('Available seats data:', data);
  
      // Фильтрация мест по session_id
      if (Array.isArray(data)) {
        const filteredSeats = data.filter(seat => seat.session_id === sessionId);
        setAvailableSeats(filteredSeats);
      } else {
        console.error("Ошибка: данные не являются массивом.");
      }
    } catch (error) {
      console.error("Ошибка при получении мест:", error.message);
    }
  };
  const handleSeatClick = (seat) => {
    if (!seat.is_available) return;  // Prevent selecting unavailable seats
    const seatIndex = selectedSeats.findIndex(s => s.seat_id === seat.seat_id);
    if (seatIndex === -1) {
      setSelectedSeats([...selectedSeats, seat]);  // Add seat if not already selected
    } else {
      setSelectedSeats(selectedSeats.filter(s => s.seat_id !== seat.seat_id));  // Remove seat if already selected
    }
  };

  const updateTotalPrice = () => {
    const pricePerTicket = 12;  // Замените на актуальную цену
    setTotalPrice(selectedSeats.length * pricePerTicket);
  };

  const handleBuyTickets = async () => {
    if (selectedSeats.length === 0) {
      alert('Пожалуйста, выберите хотя бы одно место!');
      return;
    }
  
    // Проверяем, нужно ли запрашивать email для незарегистрированного пользователя
    if (!userId && !userEmail) {
      alert('Пожалуйста, введите вашу электронную почту!');
      return;
    }
  
    const purchaseData = {
      session_id: selectedSession,
      seat_number: selectedSeats.map(seat => seat.seat_id),  // Передаем только seat_id
      user_id: userId || 1,  // Если пользователь не зарегистрирован, передаем 1
      purchase_time: new Date().toISOString(),  // Текущее время
      price: totalPrice,  // Общая цена
      email: userEmail,  // Добавляем email
    };
  
    try {
      // Обновление статуса мест в таблице билетов
      await fetch('http://localhost:5000/api/update-ticket-status', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          seats: selectedSeats.map(seat => seat.seat_id), // Передаем все выбранные билеты
        }),
      });
  
      // Сохранение купленных билетов в таблицу
      const response = await fetch('http://localhost:5000/api/purchase', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(purchaseData),
      });
  
      if (response.ok) {
        alert('Покупка прошла успешно!');
        navigate('/confirmation');  // Перенаправление на страницу подтверждения
      } else {
        alert('Произошла ошибка при покупке. Попробуйте снова.');
      }
    } catch (error) {
      console.error('Ошибка при оформлении покупки:', error.message);
      alert('Произошла ошибка. Попробуйте снова.');
    }
  };

  const handleEmailConfirm = () => {
    if (!userEmail) {
      alert('Пожалуйста, введите свой email!');
      return;
    }
    
    // Простейшая проверка формата email
    const emailPattern = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,6}$/;
    if (!emailPattern.test(userEmail)) {
      alert('Пожалуйста, введите корректный email!');
      return;
    }

    setEmailConfirmed(true); // Подтверждаем email
  };

  return (
    <div className="container">
      <h1 className="title">Купить билеты на фильм</h1>

      {/* Выбор кинотеатра */}
      {theaters && (
        <div>
          <h2 className="section-title">Выберите кинотеатр</h2>
          <div className="button-group">
            {theaters.map((theater) => (
              <button
                key={theater.theater_id}
                onClick={() => handleTheaterSelect(theater.theater_id)}
                className={`button ${selectedTheater === theater.theater_id ? 'selected' : ''}`}
              >
                {theater.name}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Выбор даты */}
      {selectedTheater && (
        <div>
          <h2 className="section-title">Выберите дату</h2>
          <div className="button-group">
            {[...new Set(sessions.filter(s => s.theater_id === selectedTheater && s.movie_id === parseInt(movieId)).map(s => s.session_date))].map((date) => (
              <button
                key={date}
                onClick={() => handleDateSelect(date)}
                className={`button ${selectedDate === date ? 'selected' : ''}`}
              >
                {date}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Выбор времени */}
      {selectedDate && (
        <div>
          <h2 className="section-title">Выберите время</h2>
          <div className="button-group">
            {availableSessions.map((session) => (
              <button
                key={session.session_id}
                onClick={() => handleTimeSelect(session.session_id)}
                className={`button ${selectedSession === session.session_id ? 'selected' : ''}`}
              >
                {session.start_time} - {session.end_time}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Выбор мест */}
      {selectedSession && availableSeats.length > 0 && (
        <div>
          <h2 className="section-title">Выберите место</h2>
          <div className="seat-grid">
            {availableSeats.map((seat) => (
              <button
                key={seat.seat_id}
                className={`seat-button ${!seat.is_available ? 'disabled' : ''}`}
                disabled={!seat.is_available}
                onClick={() => handleSeatClick(seat)} // Обработчик клика на место
              >
                {seat.seat_number}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Выбранные билеты */}
      {selectedSeats.length > 0 && (
        <div>
          <h2 className="section-title">Выбранные билеты</h2>
          <ul>
            {selectedSeats.map((seat) => (
              <li key={seat.seat_id}>
                Место: {seat.seat_number}
              </li>
            ))}
          </ul>
          <p>Общая стоимость: {totalPrice} руб.</p>
        </div>
      )}

      {/* Ввод email для незарегистрированных пользователей */}
      {!userId && (
        <div>
          <h2 className="section-title">Введите ваш email</h2>
          <input
            type="email"
            placeholder="Email"
            value={userEmail}
            onChange={(e) => setUserEmail(e.target.value)}
            className="input"
          />
          {!emailConfirmed && (
            <button onClick={handleEmailConfirm} className="button">
              Подтвердить email
            </button>
          )}
        </div>
      )}

      {/* Подтверждение и покупка */}
      {emailConfirmed && (
        <button onClick={handleBuyTickets} className="button">
          Купить билеты
        </button>
      )}
    </div>
  );
}

export default BuyTickets;
