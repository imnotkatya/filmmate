import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";

function Sessions() {
  const location = useLocation();
  const [theaters, setTheaters] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [sessionDel, setSessionDel] = useState(null);
  const [seatsCount, setSeatsCount] = useState(0);

  const [theaterId, setTheaterId] = useState("");
  const [price, setPrice] = useState(0);
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [sessionDate, setSessionDate] = useState("");

  const movieData = location.state?.movieData;

  useEffect(() => {
    const fetchTheaters = async () => {
      try {
        const response = await fetch("http://localhost:5000/api/theaters");
        const data = await response.json();
        setTheaters(data.theaters);
      } catch (error) {
        console.error("Ошибка загрузки кинотеатров:", error);
      }
    };

    fetchTheaters();
    handleGetSessions();
  }, []);

  const handleGetSessions = async () => {
    try {
      const response = await fetch(`http://localhost:5000/api/sessions/${movieData.movie_id}`);
      if (response.ok) {
        const data = await response.json();
        setSessions(data);
      } else {
        console.error("Ошибка при загрузке сеансов:", response.status);
      }
    } catch (error) {
      console.error("Сетевая ошибка:", error);
    }
  };

  const handleFillInputs = (theater) => {
    setTheaterId(theater.theater_id);
  };

  // ...

const handleSaveSession = async () => {
  if (!theaterId || !sessionDate || !startTime || !endTime || !price || !seatsCount) {
    alert("Пожалуйста, заполните все поля.");
    return;
  }

  // Проверка: дата не в прошлом
  const today = new Date();
  const sessionDateObj = new Date(sessionDate);
  sessionDateObj.setHours(0, 0, 0, 0);
  today.setHours(0, 0, 0, 0);

  if (sessionDateObj < today) {
    alert("Нельзя добавить сеанс на прошедшую дату.");
    return;
  }

  // Проверка: время начала и конца
  if (endTime <= startTime) {
    alert("Время окончания должно быть позже времени начала.");
    return;
  }

  // Проверка на пересечение времени
  const isOverlapping = sessions.some((session) => {
    return (
      String(session.theater_id) === String(theaterId) &&
      session.session_date === sessionDate &&
      !(
        endTime <= session.start_time || 
        startTime >= session.end_time    
      )
    );
  });

  if (isOverlapping) {
    alert("В выбранном кинотеатре на эту дату уже есть сеанс с пересекающимся временем.");
    return;
  }

  const sessionData = {
    movie_id: movieData.movie_id,
    theater_id: theaterId,
    session_date: sessionDate,
    start_time: startTime,
    end_time: endTime,
    price: Number(price),
    seats_count: Number(seatsCount),
  };

  try {
    const response = await fetch("http://localhost:5000/api/add_session", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(sessionData),
    });

    if (response.ok) {
      await response.json();
      handleGetSessions();

      // Очистка полей
      setTheaterId("");
      setSessionDate("");
      setStartTime("");
      setEndTime("");
      setPrice(0);
      setSeatsCount(0);
    } else {
      console.error("Ошибка при создании сеанса:", response.status);
    }
  } catch (error) {
    console.error("Сетевая ошибка:", error);
  }
};

  const handleSessionDel = async () => {
    if (!sessionDel) {
      alert("Сначала выберите сеанс для удаления.");
      return;
    }

    try {
      const response = await fetch(`http://localhost:5000/api/sessions/${sessionDel}`, {
        method: "DELETE",
      });

      if (response.ok) {
        alert("Сеанс удалён.");
        setSessionDel(null);
        handleGetSessions();
      } else {
        const err = await response.json();
        alert(`Ошибка: ${err.message}`);
      }
    } catch (error) {
      console.error("Ошибка при удалении:", error);
      alert("Произошла ошибка при удалении сеанса.");
    }
  };

  if (!movieData) {
    return <p className="text-red-500">Нет данных о фильме. Вернитесь назад и выберите фильм снова.</p>;
  }

  return (
    <div className="p-4 space-y-4">
      <h1 className="text-2xl font-bold">Сеансы</h1>

      <table className="w-full border-collapse border border-gray-300">
        <thead className="bg-gray-100">
          <tr>
            <th className="border px-4 py-2">Кинотеатр ID</th>
            <th className="border px-4 py-2">Дата</th>
            <th className="border px-4 py-2">Начало</th>
            <th className="border px-4 py-2">Конец</th>
            <th className="border px-4 py-2">Цена (BYN)</th>
          </tr>
        </thead>
        <tbody>
          {sessions.map((session) => (
            <tr
              key={session.session_id}
              onClick={() => setSessionDel(session.session_id)}
              className={`cursor-pointer ${sessionDel === session.session_id ? "bg-blue-100" : ""}`}
            >
              <td className="border px-4 py-2">{session.theater_id}</td>
              <td className="border px-4 py-2">{session.session_date}</td>
              <td className="border px-4 py-2">{session.start_time.slice(0, 5)}</td>
              <td className="border px-4 py-2">{session.end_time.slice(0, 5)}</td>
              <td className="border px-4 py-2">{session.price}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <button
        onClick={handleSessionDel}
        className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
      >
        Удалить выбранный сеанс
      </button>

      <p className="text-lg">Фильм: <strong>{movieData.title}</strong></p>

      <p className="text-md">Выберите кинотеатр:</p>
      <div className="flex flex-col gap-2">
        {theaters.map((theater) => (
          <button
            key={theater.theater_id}
            onClick={() => handleFillInputs(theater)}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            {theater.name}
          </button>
        ))}
      </div>

      <div className="flex flex-col gap-2">
        <label>
          Дата сеанса:
          <input
            type="date"
            value={sessionDate}
            onChange={(e) => setSessionDate(e.target.value)}
            className="border p-1 rounded ml-2"
          />
        </label>

        <label>
          Начало:
          <input
            type="time"
            value={startTime}
            onChange={(e) => setStartTime(e.target.value)}
            className="border p-1 rounded ml-2"
          />
        </label>

        <label>
          Конец:
          <input
            type="time"
            value={endTime}
            onChange={(e) => setEndTime(e.target.value)}
            className="border p-1 rounded ml-2"
          />
        </label>

        <label>
          Кол-во мест:
          <input
            type="number"
            value={seatsCount}
            onChange={(e) => setSeatsCount(Number(e.target.value))}
            className="border p-1 rounded ml-2"
          />
        </label>

        <label>
          Цена:
          <input
            type="number"
            value={price}
            onChange={(e) => setPrice(Number(e.target.value))}
            className="border p-1 rounded ml-2"
          />
        </label>
      </div>

      <button
        onClick={handleSaveSession}
        className="mt-4 px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
      >
        Сохранить сеанс
      </button>
    </div>
  );
}

export default Sessions;
