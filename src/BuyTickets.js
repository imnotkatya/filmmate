import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Buying from './Buying'; // Импортируем компонент Buying
import "./BuyTickets.css";

function BuyTickets() {
  const navigate = useNavigate();
  const { movieId } = useParams();

  const [movies, setMovies] = useState([]);
  const [theaters, setTheaters] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [selectedTheater, setSelectedTheater] = useState(null);
  const [selectedDate, setSelectedDate] = useState(null);
  const [availableSessions, setAvailableSessions] = useState([]);
  const [selectedSession, setSelectedSession] = useState(null);
  const [availableSeats, setAvailableSeats] = useState([]);
  const [selectedSeats, setSelectedSeats] = useState([]);
  const [userEmail, setUserEmail] = useState(localStorage.getItem("userEmail") || "");
  const [userId, setUserId] = useState(null);
  const [totalPrice, setTotalPrice] = useState(0);
  const [showPaymentForm, setShowPaymentForm] = useState(false); // Новое состояние для отображения формы оплаты
  const { success } = location.state || {};
  const { purchaseData } = location.state || {};

  useEffect(() => {
    if (selectedSession) {
      const session = sessions.find(s => s.session_id === selectedSession);
      if (session) {
        setTotalPrice(selectedSeats.length * session.price);
      }
    }
  }, [selectedSeats, selectedSession, sessions]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch("http://localhost:5000/api/all-tables");
        const data = await response.json();
        setMovies(data.movies);
        setSessions(data.sessions);
        setTheaters(data.theaters);

        if (data.movies.some(movie => movie.movie_id === parseInt(movieId))) {
          const filteredSessions = data.sessions.filter(session => session.movie_id === parseInt(movieId));
          setAvailableSessions(filteredSessions);

          if (filteredSessions.length > 0) {
            const firstSession = filteredSessions[0];
            setSelectedSession(firstSession.session_id);
            setSelectedDate(firstSession.session_date);
            setSelectedTheater(firstSession.theater_id);
            fetchSeats(firstSession.session_id);
          }
        }
      } catch (error) {
        console.error("Ошибка загрузки данных:", error.message);
      }
    };

    fetchData();
  }, [movieId]);

  const updateAvailableSessions = (theaterId, date) => {
    const filteredSessions = sessions.filter(s => s.theater_id === theaterId && s.session_date === date && s.movie_id === parseInt(movieId));
    const uniqueSessions = Array.from(new Set(filteredSessions.map(s => s.start_time)))
      .map(time => filteredSessions.find(s => s.start_time === time));

    const sessionsWithAvailableSeats = uniqueSessions.filter(session => {
      return availableSeats.some(seat => seat.session_id === session.session_id && seat.is_available);
    });

    setAvailableSessions(sessionsWithAvailableSeats);
    if (sessionsWithAvailableSeats.length > 0) {
      setSelectedSession(sessionsWithAvailableSeats[0].session_id);
      fetchSeats(sessionsWithAvailableSeats[0].session_id);
    } else {
      setSelectedSession(null);
      setAvailableSeats([]);
    }
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
      seat_number: selectedSeats.map(seat => seat.seat_id)[0],  // Передаем только seat_id
      user_id: userId || 1,  // Если пользователь не зарегистрирован, передаем 1
      purchase_time: new Date().toISOString(),  // Текущее время
      price: totalPrice,  // Общая цена
      email: userEmail,  // Добавляем email
    };

    navigate(`/buy-tickets/stripe/${movieId}`, { state: { purchaseData } });
  };

  const handleTheaterSelect = (theaterId) => {
    setSelectedTheater(theaterId);
    updateAvailableSessions(theaterId, selectedDate);
  };

  const handleDateSelect = (date) => {
    setSelectedDate(date);
    updateAvailableSessions(selectedTheater, date);
  };

  const handleTimeSelect = (sessionId) => {
    setSelectedSession(sessionId);
    if (sessionId) fetchSeats(sessionId);
  };

  const fetchSeats = async (sessionId) => {
    try {
      const response = await fetch(`http://localhost:5000/api/seats/${sessionId}`);
      const data = await response.json();

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
    if (!seat.is_available) return;

    setSelectedSeats((prevSeats) => {
      const seatIndex = prevSeats.findIndex(s => s.seat_id === seat.seat_id);
      let newSeats = seatIndex === -1 ? [...prevSeats, seat] : prevSeats.filter(s => s.seat_id !== seat.seat_id);
      return newSeats;
    });
  };


  return (
    <div className="container">
      <button onClick={() => navigate(`/movie/${movieId}`)}>Назад</button>
      <h1 className="title">Купить билеты на фильм</h1>

      <h2 className="section-title">Выберите кинотеатр</h2>
      <div className="button-group">
        {theaters
          .filter(theater => sessions.some(session => session.theater_id === theater.theater_id && session.movie_id === parseInt(movieId)))
          .map((theater) => (
            <button
              key={theater.theater_id}
              className={`button ${selectedTheater === theater.theater_id ? "selected" : ""}`}
              onClick={() => handleTheaterSelect(theater.theater_id)}
            >
              {theater.name}
            </button>
          ))}
      </div>

      {selectedTheater && (
        <>
          <h2 className="section-title">Выберите дату</h2>
          <div className="button-group">
            {[...new Set(sessions.filter(s => s.theater_id === selectedTheater && availableSessions.some(session => session.session_id === s.session_id)).map(s => s.session_date))].map(date => (
              <button
                key={date}
                className={`button ${selectedDate === date ? "selected" : ""}`}
                onClick={() => handleDateSelect(date)}
              >
                {date}
              </button>
            ))}
          </div>
        </>
      )}

      {selectedDate && (
        <>
          <h2 className="section-title">Выберите время</h2>
          <div className="button-group">
            {availableSessions.map(session => (
              <button
                key={session.session_id}
                className={`button ${selectedSession === session.session_id ? "selected" : ""}`}
                onClick={() => handleTimeSelect(session.session_id)}
              >
                {session.start_time}
              </button>
            ))}
          </div>
        </>
      )}

      {selectedSession && availableSeats.length > 0 && (
        <>
          <h2 className="section-title">Выберите места</h2>
          <div className="seat-grid">
            {availableSeats.map(seat => (
              <button
                key={seat.seat_id}
                className={`seat-button ${selectedSeats.some(s => s.seat_id === seat.seat_id) ? "selected" : ""}`}
                disabled={!seat.is_available}
                onClick={() => handleSeatClick(seat)}
              >
                {seat.seat_number}
              </button>
            ))}
          </div>
        </>
      )}

      {selectedSeats.length > 0 && (
        <>
          <p>Общая стоимость: {totalPrice} руб.</p>
          <button onClick={() => { handleBuyTickets(); }}>Купить билеты</button>

        </>
      )}

      {showPaymentForm && (
        <Buying />
      )}
    </div>
  );
}

export default BuyTickets;
