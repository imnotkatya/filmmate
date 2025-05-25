import { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import './MovieDetails.css';
import left from './assets/arrow-left.svg';
import right from './assets/arrow-right.svg';

const API_KEY = "60e0c7335b9b55e2cead9ef258b571ae";
const BASE_URL = "https://api.themoviedb.org/3";
const IMAGE_BASE_URL = "https://image.tmdb.org/t/p/w500";

function MovieDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [movie, setMovie] = useState(null);
  const [trailer, setTrailer] = useState(null);
  const [sessions, setSessions] = useState([]);
  const [loadingMovie, setLoadingMovie] = useState(true);
  const [admin, setAdmin] = useState(false);
  const [watchUrl, setWatchUrl] = useState("");
  const [newWatchUrl, setNewWatchUrl] = useState("");
  const trailerRef = useRef(null);
  const actorsCarouselRef = useRef(null);

  const handleSessions = async (movie) => {
    const movieData = {
      movie_id: movie.id,
      title: movie.title,
      genre: movie.genres?.map(g => g.id).join(", "), 
      rating: movie.vote_average,
      duration: movie.runtime || 0, 
    };

    try {
      const response = await fetch("http://localhost:5000/api/add_movie", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(movieData),
      });

      navigate("/sessions", { state: { movieData } });
      await response.json();
    } catch (error) {
      console.error("Ошибка при добавлении фильма:", error);
      alert("Ошибка при добавлении фильма: " + error.message);
    }
  };
  const handleBuyTickets = () => {
    navigate(`/buy-tickets/${id}`);
  };

  const fetchWatchUrl = async () => {
    try {
      const response = await fetch(`http://localhost:5000/api/watch_url/${id}`);
      if (!response.ok) return;
      const data = await response.json();
      if (data?.url) {
        setWatchUrl(data.url);
      }
    } catch (error) {
      console.error("Ошибка при загрузке ссылки:", error);
    }
  };

  const saveWatchUrl = async () => {
    try {
      const response = await fetch(`http://localhost:5000/api/watch_url/${id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: newWatchUrl }),
      });

      if (response.ok) {
        setWatchUrl(newWatchUrl);
        setNewWatchUrl("");
        alert("Ссылка успешно сохранена");
      } else {
        alert("Ошибка при сохранении ссылки");
      }
    } catch (error) {
      console.error("Ошибка сохранения:", error);
    }
  };

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
        }

        const isAdminStored = localStorage.getItem("isAdmin");
        if (isAdminStored === "true") {
          setAdmin(true);
        }

        await fetchWatchUrl();
      } catch (error) {
        console.error("Ошибка загрузки:", error);
      } finally {
        setLoadingMovie(false);
      }
    }

    fetchMovieDetails();
  }, [id]);

  const scrollCarousel = (direction) => {
    const container = actorsCarouselRef.current;
    const scrollAmount = direction === "left" ? -container.offsetWidth : container.offsetWidth;
    container.scrollBy({ left: scrollAmount, behavior: "smooth" });
  };

  if (loadingMovie) {
    return <div className="text-center text-lg font-semibold">Загрузка фильма...</div>;
  }

  if (!movie) {
    return <div className="text-center text-lg font-semibold">Не удалось загрузить фильм.</div>;
  }

  return (
    <div className="container">
      <div className="det-movie-card">
        <div className="det-movie-content">
          {/* Информация о фильме */}
          <div className="det-movie-header">
            <div className="det-movie-image">
              <img src={`${IMAGE_BASE_URL}${movie.poster_path}`} alt={movie.title} />
            </div>
            <div className="det-movie-info">
              <h1>{movie.title}</h1>
              <p className="res">{movie.genres?.map(g => g.name).join(", ")}</p>
              <p className="name">Рейтинг: </p>
              <p className="res">{movie.vote_average}</p>
              <p className="name">Дата выпуска: </p>
              <p className="res">{movie.release_date}</p>
            </div>
          </div>

          <p className="det-text-lg det-font-semibold">{movie.overview}</p>

          {/* Актёры */}
          {movie.credits?.cast && (
            <div className="det-actors">
              <h3>Актёрский состав</h3>
              <div className="det-carousel-wrapper">
                <button className="carousel-button left" onClick={() => scrollCarousel("left")}>
                  <img src={left} alt="Left" />
                </button>
                <div className="det-actors-carousel" ref={actorsCarouselRef}>
                  {movie.credits.cast.slice(0, 10).map(actor => (
                    <div className="det-actor" key={actor.id}>
                      <img
                        src={actor.profile_path
                          ? `https://image.tmdb.org/t/p/w185${actor.profile_path}`
                          : "https://via.placeholder.com/80x80?text=No+Photo"}
                        alt={actor.name}
                        className="det-actor-img"
                      />
                      <span className="det-actor-name">{actor.name}</span>
                    </div>
                  ))}
                </div>
                <button className="carousel-button right" onClick={() => scrollCarousel("right")}>
                  <img src={right} alt="Right" />
                </button>
              </div>
            </div>
          )}

          {/* Трейлер */}
          {trailer && (
            <>
              <h2>Трейлер</h2>
              <div className="det-movie-trailer" ref={trailerRef}>
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
            </>
          )}

          {/* Ссылка на просмотр */}
          {watchUrl && (
            <a href={watchUrl} target="_blank" rel="noopener noreferrer" className="det-watch-btn">
              Смотреть онлайн
            </a>
          )}

          {/* Админская форма */}
          {admin && (
            <div className="det-admin-watch-url">
              <input 
                type="text" 
                placeholder="Введите ссылку на онлайн-платформу" 
                value={newWatchUrl}
                onChange={(e) => setNewWatchUrl(e.target.value)}
                className="det-url-input"
              />
              <button onClick={saveWatchUrl} className="det-save-url-btn">
                Сохранить ссылку
              </button>
            </div>
          )}

          {sessions.length > 0 && (
            <button className="det-buy-tickets-btn" onClick={handleBuyTickets}>
              Купить билеты
            </button>
          )}

          {admin && (
            <button onClick={() => handleSessions(movie)} className="det-admin-btn">
              Управление сеансами
            </button>
          )}

          {sessions.length === 0 && !admin && (
            <p className="det-no-sessions">Сеансы не доступны</p>
          )}

          <button onClick={() => navigate(`/`)} className="det-back-btn">
            Назад
          </button>
        </div>
      </div>
    </div>
  );
}

export default MovieDetails;
