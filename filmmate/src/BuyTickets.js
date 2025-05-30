import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Buying from './Buying';
import "./BuyTickets.css";

function BuyTickets() {
  const navigate = useNavigate();
  const { movieId } = useParams();

  const [movies, setMovies] = useState([]);
  const [theaters, setTheaters] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [selectedTheater, setSelectedTheater] = useState(null);
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedSession, setSelectedSession] = useState(null);
  const [availableSeats, setAvailableSeats] = useState([]);
  const [selectedSeats, setSelectedSeats] = useState([]);
  const [userEmail, setUserEmail] = useState(localStorage.getItem("userEmail") || "");
  const [userId, setUserId] = useState(null);
  const [totalPrice, setTotalPrice] = useState(0);
  const [showPaymentForm, setShowPaymentForm] = useState(false);

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

        const filteredSessions = data.sessions.filter(session => session.movie_id === parseInt(movieId));
        if (filteredSessions.length > 0) {
          const first = filteredSessions[0];
          setSelectedSession(first.session_id);
          setSelectedDate(first.session_date);
          setSelectedTheater(first.theater_id);
          fetchSeats(first.session_id);
        }
      } catch (error) {
        console.error("Ошибка загрузки данных:", error.message);
      }
    };

    fetchData();
  }, [movieId]);

  const handleBuyTickets = async () => {
    if (selectedSeats.length === 0) {
      alert('Пожалуйста, выберите хотя бы одно место!');
      return;
    }

    if (!userId && !userEmail) {
      alert('Пожалуйста, введите вашу электронную почту!');
      return;
    }

    const session = sessions.find(s => s.session_id === selectedSession);

    const purchaseData = {
      session_id: selectedSession,
      seat_numbers: selectedSeats.map(seat => seat.seat_id),
      user_id: userId || 1,
      purchase_time: new Date().toISOString(),
      price: totalPrice,
      email: userEmail,
      movieId: movieId,
      start: session?.start_time,
      date: session?.session_date
    };

    navigate(`/buy-tickets/stripe/${movieId}`, { state: { purchaseData } });
  };

  const handleTheaterSelect = (theaterId) => {
    setSelectedTheater(theaterId);
    setSelectedDate(null);
    setSelectedSession(null);
    setAvailableSeats([]);
    setSelectedSeats([]);
  };

  const handleDateSelect = (date) => {
    setSelectedDate(date);
    setSelectedSession(null);
    setAvailableSeats([]);
    setSelectedSeats([]);
  };

  const handleTimeSelect = (sessionId) => {
    setSelectedSession(sessionId);
    fetchSeats(sessionId);
  };

  const fetchSeats = async (sessionId) => {
    try {
      const response = await fetch(`http://localhost:5000/api/seats/${sessionId}`);
      const data = await response.json();
      if (Array.isArray(data)) {
        setAvailableSeats(data);
      } else {
        console.error("Ошибка: данные мест не являются массивом.");
      }
    } catch (error) {
      console.error("Ошибка при получении мест:", error.message);
    }
  };

  const handleSeatClick = (seat) => {
    if (!seat.is_available) return;
    setSelectedSeats(prev => {
      const exists = prev.find(s => s.seat_id === seat.seat_id);
      return exists ? prev.filter(s => s.seat_id !== seat.seat_id) : [...prev, seat];
    });
  };

  const getAvailableDates = () => {
    return [...new Set(sessions
      .filter(s => s.theater_id === selectedTheater && s.movie_id === parseInt(movieId))
      .map(s => s.session_date))];
  };

  const getAvailableTimes = () => {
    return [...new Map(
      sessions
        .filter(s =>
          s.theater_id === selectedTheater &&
          s.session_date === selectedDate &&
          s.movie_id === parseInt(movieId))
        .map(s => [s.start_time, s]) // уникальные по времени
    ).values()];
  };

  return (
    <div className="container">
      <button onClick={() => navigate(`/movie/${movieId}`)}>Назад</button>
      <h1 className="title">Купить билеты на фильм</h1>

      <h2 className="section-title">Выберите кинотеатр</h2>
      <div className="button-group">
        {theaters
          .filter(t => sessions.some(s => s.theater_id === t.theater_id && s.movie_id === parseInt(movieId)))
          .map(theater => (
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
            {getAvailableDates().map(date => (
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
            {getAvailableTimes().map(session => (
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
    {availableSeats.every(seat => !seat.is_available) ? (
      <p className="no-seats-message">Все места уже заняты</p>
    ) : (
      <div className="seat-grid">
        {availableSeats.map(seat => (
          <button
            key={seat.seat_id}
            className={`seat-button ${!seat.is_available ? "unavailable" : ""} ${selectedSeats.some(s => s.seat_id === seat.seat_id) ? "selected" : ""}`}
            disabled={!seat.is_available}
            onClick={() => handleSeatClick(seat)}
          >
            {seat.seat_number}
          </button>
        ))}
      </div>
    )}
  </>
)}


      {selectedSeats.length > 0 && (
        <>
          <p>Общая стоимость: {totalPrice} руб.</p>
          <div className="buy-button-container">
  <button className="buy-button" onClick={handleBuyTickets}>Купить билеты</button>
</div>

        </>
      )}

      {showPaymentForm && <Buying />}
    </div>
  );
}

export default BuyTickets;
