import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import SearchBar from "./SearchBar";

const API_KEY = "60e0c7335b9b55e2cead9ef258b571ae";
const BASE_URL = "https://api.themoviedb.org/3";
const IMAGE_BASE_URL = "https://image.tmdb.org/t/p/w500";

function MovieList() {
  const [movies, setMovies] = useState([]);
  const [page, setPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedMovieId, setSelectedMovieId] = useState(null);
  const [minRating, setMinRating] = useState(0);
  const [playlistId, setPlaylistId] = useState(null);
  const [sortBy, setSortBy] = useState("popularity.desc");
  const [loading, setLoading] = useState(false);
  const [playlists, setPlaylists] = useState([]);
  const [showPlaylists, setShowPlaylists] = useState(false);

  const navigate = useNavigate();

  const isAuthenticated = !!localStorage.getItem("user");
  const userId = localStorage.getItem("userId");

  useEffect(() => {
    setMovies([]);
    setPage(1);
    fetchMovies(1);
  }, [searchQuery, minRating, sortBy]);

  useEffect(() => {
    if (page > 1) fetchMovies(page);
  }, [page]);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await fetch(`http://localhost:5000/api/profile/${userId}`);
        const data = await response.json();
        if (response.ok) {
          localStorage.setItem("userEmail", data.email);
        } else {
          console.error("Ошибка загрузки профиля:", data.message);
        }
      } catch (error) {
        console.error("Ошибка запроса профиля:", error);
      }
    };

    const fetchPlaylists = async () => {
      try {
        const response = await fetch(`http://localhost:5000/api/playlists/${userId}`);
        const data = await response.json();
        if (response.ok) {
          setPlaylists(data);
        } else {
          console.error("Ошибка загрузки плейлистов:", data.message);
        }
      } catch (error) {
        console.error("Ошибка запроса плейлистов:", error);
      }
    };

    if (userId) {
      fetchProfile();
      fetchPlaylists();
    }
  }, [userId]);

  const fetchMovies = async (currentPage) => {
    setLoading(true);
    const url = searchQuery
      ? `${BASE_URL}/search/movie?api_key=${API_KEY}&language=ru&page=${currentPage}&query=${searchQuery}`
      : `${BASE_URL}/movie/popular?api_key=${API_KEY}&language=ru&page=${currentPage}`;

    try {
      const response = await fetch(url);
      const data = await response.json();
      let filtered = data.results.filter((movie) => movie.vote_average >= minRating);

      if (!searchQuery && sortBy === "vote_average.desc") {
        filtered = filtered.sort((a, b) => b.vote_average - a.vote_average);
      }

      setMovies((prev) =>
        currentPage === 1 ? filtered : [...prev, ...filtered]
      );
    } catch (error) {
      console.error("Ошибка загрузки:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleMovieAddToPlayList = async (playlistId, movieId) => {
    // Найти фильм по movieId
    const movieDetails = movies.find((movie) => movie.id === movieId);
    
    if (!movieDetails) {
      alert("Фильм не найден!");
      return;
    }
  
    // Создание payload с дополнительными данными фильма
    const payload = {
      playlist_id: Number(playlistId),
      movie_id: Number(movieId),
      title: movieDetails.title,
      rating: movieDetails.vote_average,  // Рейтинг фильма
      // Извлекаем описание фильма
      duration:Number(0),  // Продолжительность фильма в минутах
      // Год выпуска
      genre: movieDetails.genre_ids.join(", "),  // Перечень жанров
    };
  
    try {
      console.log(payload);
      const response = await fetch("http://localhost:5000/api/playlist_movies", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });
  
      if (!response.ok) {
        throw new Error(`Ошибка: ${response.status}`);
      }
  
      const data = await response.json();
      alert(`Фильм добавлен в плейлист "${data.name}"!`);
    } catch (error) {
      console.error("Ошибка при добавлении фильма в плейлист:", error);
      alert("Ошибка при добавлении");
    }
  };
  

  const loadMoreMovies = () => setPage((prev) => prev + 1);
  const handleMovieClick = (id) => navigate(`/movie/${id}`);
  const addToPlaylist = (event, movieId) => {
    event.stopPropagation();
    setSelectedMovieId(movieId);
    setShowPlaylists(true);
  };
  const handleUserClick = () => {
    if (!userId) {
      navigate("/aut");
    } else navigate(isAuthenticated ? `/profile/${userId}` : "/aut");
  };
  const handlePlaylistClick = (playlistId) => {
    handleMovieAddToPlayList(playlistId, selectedMovieId);
    setShowPlaylists(false);
  };
  const closePlaylists = () => setShowPlaylists(false);

  return (
    <div style={{ textAlign: "center", fontFamily: "Arial" }}>
          <button
        onClick={handleUserClick}
        style={{
          marginTop: "20px",
          padding: "10px 20px",
          fontSize: "16px",
          cursor: "pointer",
          borderRadius: "5px",
          border: "none",
          backgroundColor: isAuthenticated ? "#28a745" : "#007bff",
          color: "#fff",
          marginLeft: "10px",
        }}
      >
        {(isAuthenticated && userId) ? "Профиль" : "Войти / Регистрация"}
      </button>

      <h1>Популярные фильмы</h1>

      <SearchBar
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        minRating={minRating}
        setMinRating={setMinRating}
        sortBy={sortBy}
        setSortBy={setSortBy}
      />

      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "20px" }}>
        {movies.map((movie) => (
          <div
            key={movie.id}
            onClick={() => handleMovieClick(movie.id)}
            style={{
              padding: "10px",
              border: "1px solid #ddd",
              borderRadius: "10px",
              cursor: "pointer",
            }}
          >
            <h2 style={{ fontSize: "18px" }}>{movie.title}</h2>
            <img
              src={`${IMAGE_BASE_URL}${movie.poster_path}`}
              alt={movie.title}
              style={{ width: "100%", borderRadius: "10px" }}
            />
            <p>⭐ {movie.vote_average}</p>
            <p>🔥 Популярность: {movie.popularity.toFixed(1)}</p>
            <button
              onClick={(e) => addToPlaylist(e, movie.id)}
              style={{
                marginTop: "10px",
                padding: "10px 20px",
                fontSize: "16px",
                cursor: "pointer",
                borderRadius: "5px",
                border: "none",
                backgroundColor: "#007bff",
                color: "#fff",
              }}
            >
              В плейлист
            </button>
          </div>
        ))}
      </div>

      <button
        onClick={loadMoreMovies}
        disabled={loading}
        style={{
          marginTop: "20px",
          padding: "10px 20px",
          fontSize: "16px",
          cursor: "pointer",
          borderRadius: "5px",
          border: "none",
          backgroundColor: "#007bff",
          color: "#fff",
        }}
      >
        {loading ? "Загрузка..." : "Загрузить больше"}
      </button>

      {showPlaylists && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0, 0, 0, 0.5)",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <div
            style={{
              backgroundColor: "#fff",
              padding: "20px",
              borderRadius: "10px",
              width: "80%",
              maxWidth: "500px",
              textAlign: "center",
            }}
          >
            <h3>Выберите плейлист</h3>
            {playlists.map((playlist) => (
              <button
                key={playlist.playlist_id}
                onClick={() => handlePlaylistClick(playlist.playlist_id)}
                style={{
                  padding: "10px 20px",
                  margin: "10px",
                  fontSize: "16px",
                  cursor: "pointer",
                  borderRadius: "5px",
                  border: "none",
                  backgroundColor: "#007bff",
                  color: "#fff",
                }}
              >
                {playlist.name}
              </button>
            ))}

            <button
              onClick={closePlaylists}
              style={{
                marginTop: "20px",
                padding: "10px 20px",
                fontSize: "16px",
                cursor: "pointer",
                borderRadius: "5px",
                border: "none",
                backgroundColor: "#dc3545",
                color: "#fff",
              }}
            >
              Закрыть
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default MovieList;
