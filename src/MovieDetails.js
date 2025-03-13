import { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";

const API_KEY = "60e0c7335b9b55e2cead9ef258b571ae";
const BASE_URL = "https://api.themoviedb.org/3";
const IMAGE_BASE_URL = "https://image.tmdb.org/t/p/w500";

function MovieDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [movie, setMovie] = useState(null);
  const [trailer, setTrailer] = useState(null);
  const [sessions, setSessions] = useState([]);
  const [allData, setAllData] = useState(null);
  const [loadingMovie, setLoadingMovie] = useState(true);
  const [loadingAllData, setLoadingAllData] = useState(true);
  
  const trailerRef = useRef(null);

  useEffect(() => {
    async function fetchMovieDetails() {
      setLoadingMovie(true);
      try {
        const response = await fetch(`${BASE_URL}/movie/${id}?api_key=${API_KEY}&language=ru&append_to_response=videos,credits`);
        const data = await response.json();
        setMovie(data);
        const trailerData = data.videos?.results?.find(video => video.type === "Trailer" && video.site === "YouTube");
        setTrailer(trailerData);

        const responseSessions = await fetch(`http://localhost:5000/api/sessions/${id}`);
        const movieSessions = await responseSessions.json();

        if (Array.isArray(movieSessions)) {
          setSessions(movieSessions);
        } else {
          console.error("Ошибка: sessions не является массивом");
        }
      } catch (error) {
        console.error("Ошибка загрузки:", error);
      } finally {
        setLoadingMovie(false);
      }
    }

    fetchMovieDetails();
  }, [id]);

  useEffect(() => {
    async function fetchAllData() {
      setLoadingAllData(true);
      try {
        const response = await fetch("http://localhost:5000/api/all-tables");
        if (!response.ok) {
          throw new Error("Ошибка загрузки данных: " + response.statusText);
        }
        const data = await response.json();
        setAllData(data);
      } catch (error) {
        console.error("Ошибка парсинга данных:", error);
      } finally {
        setLoadingAllData(false);
      }
    }

    fetchAllData();
  }, []);

  const scrollToTrailer = () => {
    trailerRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleBuyTickets = () => {
    navigate(`/buy-tickets/${id}`);
  };

  const isMovieInTheaters = () => {
    return sessions.length > 0; // Проверка на наличие сеансов
  };
  
  if (loadingMovie) {
    return <div className="text-center text-lg font-semibold">Загрузка фильма...</div>;
  }

  if (!movie) {
    return <div className="text-center text-lg font-semibold">Не удалось загрузить фильм.</div>;
  }

  return (
    <div className="flex flex-col items-center p-6 space-y-6 font-sans">
      <h1 className="text-4xl font-bold">{movie.title}</h1>
      <img 
        src={`${IMAGE_BASE_URL}${movie.poster_path}`} 
        alt={movie.title} 
        className="w-80 rounded-xl shadow-lg" 
      />
      <p className="text-lg text-gray-700 max-w-2xl text-center">{movie.overview}</p>

      {trailer && (
        <div className="mt-6">
          <h2 className="text-xl font-semibold">Трейлер</h2>
          <div ref={trailerRef}>
            <iframe 
              width="560" 
              height="315" 
              src={`https://www.youtube.com/embed/${trailer.key}`} 
              title="YouTube video player" 
              frameBorder="0" 
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
              allowFullScreen
            ></iframe>
          </div>
        </div>
      )}

      {isMovieInTheaters() ? (
        <button 
          className="mt-6 bg-blue-500 text-white px-4 py-2 rounded-full hover:bg-blue-600"
          onClick={handleBuyTickets}
        >
          Купить билеты
        </button>
      ) : (
        <p className="mt-6 text-red-500 font-semibold">Собака плакает</p>
      )}
      
      {allData && (
        <div className="mt-12 w-full max-w-4xl">
          <h2 className="text-2xl font-semibold text-center mb-6">Данные всех таблиц</h2>
          <div className="space-y-8">
            <div>
              <h3 className="text-xl font-semibold">Фильмы</h3>
              <table className="min-w-full table-auto mt-4">
                <thead>
                  <tr>
                    <th className="px-4 py-2 border">ID</th>
                    <th className="px-4 py-2 border">Название</th>
                    <th className="px-4 py-2 border">Жанр</th>
                    <th className="px-4 py-2 border">Рейтинг</th>
                    <th className="px-4 py-2 border">Продолжительность</th>
                  </tr>
                </thead>
                <tbody>
                  {allData.movies.map(movie => (
                    <tr key={movie.movie_id}>
                      <td className="px-4 py-2 border">{movie.movie_id}</td>
                      <td className="px-4 py-2 border">{movie.title}</td>
                      <td className="px-4 py-2 border">{movie.genre}</td>
                      <td className="px-4 py-2 border">{movie.rating}</td>
                      <td className="px-4 py-2 border">{movie.duration}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            
            <div>
              <h3 className="text-xl font-semibold">Театры</h3>
              <table className="min-w-full table-auto mt-4">
                <thead>
                  <tr>
                    <th className="px-4 py-2 border">ID</th>
                    <th className="px-4 py-2 border">Название</th>
                    <th className="px-4 py-2 border">Локация</th>
                  </tr>
                </thead>
                <tbody>
                  {allData.theaters.map(theater => (
                    <tr key={theater.theater_id}>
                      <td className="px-4 py-2 border">{theater.theater_id}</td>
                      <td className="px-4 py-2 border">{theater.name}</td>
                      <td className="px-4 py-2 border">{theater.location}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default MovieDetails;
