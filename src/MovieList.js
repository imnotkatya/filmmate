import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom"; // Заменили useHistory на useNavigate

const API_KEY = "60e0c7335b9b55e2cead9ef258b571ae"; // Используй свой ключ
const BASE_URL = "https://api.themoviedb.org/3";
const IMAGE_BASE_URL = "https://image.tmdb.org/t/p/w500";

function MovieList() {
  const [movies, setMovies] = useState([]);
  const [page, setPage] = useState(1);
  const navigate = useNavigate(); // Хук для перехода на другую страницу

  useEffect(() => {
    // Запрос к API с учетом текущей страницы
    fetch(`${BASE_URL}/movie/popular?api_key=${API_KEY}&language=ru&page=${page}`)
      .then(response => response.json())
      .then(data => {
        setMovies((prevMovies) => [...prevMovies, ...data.results]); // Добавляем новые фильмы к уже существующим
      })
      .catch(error => console.error("Ошибка загрузки:", error));
  }, [page]);

  const loadMoreMovies = () => {
    setPage((prevPage) => prevPage + 1); // Переход к следующей странице
  };

  const handleMovieClick = (id) => {
    navigate(`/movie/${id}`); // Переход на страницу с деталями фильма
  };

  return (
    <div style={{ textAlign: "center", fontFamily: "Arial" }}>
      <h1>Популярные фильмы</h1>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "20px" }}>
        {movies.map((movie) => (
          <div
            key={movie.id}
            style={{ padding: "10px", border: "1px solid #ddd", borderRadius: "10px", cursor: "pointer" }}
            onClick={() => handleMovieClick(movie.id)} // Обработчик клика
          >
            <h2 style={{ fontSize: "18px" }}>{movie.title}</h2>
            <img src={`${IMAGE_BASE_URL}${movie.poster_path}`} alt={movie.title} style={{ width: "100%", borderRadius: "10px" }} />
            <p>⭐ {movie.vote_average}</p>
          </div>
        ))}
      </div>
      <button
        onClick={loadMoreMovies}
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
        Загрузить больше
      </button>
    </div>
  );
}

export default MovieList;
