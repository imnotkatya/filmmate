import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import SearchBar from "./SearchBar";
import "./MovieList.css";
import React, { useRef } from "react";
import logo from './assets/FILMATE.svg';
import user from './assets/user.svg';
import side from './assets/Group 2.svg';
import left from './assets/arrow-left.svg';
import right from './assets/arrow-right.svg';
const API_KEY = "60e0c7335b9b55e2cead9ef258b571ae";
const BASE_URL = "https://api.themoviedb.org/3";
const IMAGE_BASE_URL = "https://image.tmdb.org/t/p/w500";

function MovieList() {
  const [linkedMovieIds, setLinkedMovieIds] = useState([]);
  const [movies, setMovies] = useState([]);
  const [page, setPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedMovieId, setSelectedMovieId] = useState(null);
  const [minRating, setMinRating] = useState(0);
  const [playlistId, setPlaylistId] = useState(null);
  const [sortBy, setSortBy] = useState("popularity.desc");
  const [loading, setLoading] = useState(false);
  const [filt_search, setFilt_Search] = useState(false);
  const [playlists, setPlaylists] = useState([]);
  const [showPlaylists, setShowPlaylists] = useState(false);
  const isAdminStored = localStorage.getItem("isAdmin");
  const [watchUrl, setWatchUrl] = useState("");
  const navigate = useNavigate();

  const isAuthenticated = !!localStorage.getItem("user");
  const userId = localStorage.getItem("userId");
  const [index, setIndex] = useState(0);
  const carouselRef = useRef(null);

  const scroll = (direction) => {
    const { current } = carouselRef;
    const scrollAmount = 300;
    if (direction === "left") {
      current.scrollLeft -= scrollAmount;
    } else {
      current.scrollLeft += scrollAmount;
    }
  };
  useEffect(() => {
    fetch('http://localhost:5000/api/watch_url_all')
      .then((res) => res.json())
      .then((data) => setLinkedMovieIds(data.movieIds));
  }, []);
  useEffect(() => {
    const interval = setInterval(() => {
      setIndex((prev) => (prev + 1) % movies.length);
    }, 2000); // каждые 3 секунды
  
    return () => clearInterval(interval);
  }, [movies]);
  useEffect(() => {
    setMovies([]);
    setPage(1);
  
    const fetchMultiplePages = async () => {
      const totalPagesToFetch = 5;
      let allMovies = [];
  
      for (let i = 1; i <= totalPagesToFetch; i++) {
        const newMovies = await fetchMovies(i, true);
        allMovies = [...allMovies, ...newMovies];
      }
  
      setMovies(allMovies);
    };
  
    fetchMultiplePages();
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

    const fetchWatchUrl = async () => {
      try {
        const response = await fetch(`http://localhost:5000/api/watch_url_all`);
        if (!response.ok) return;
        const data = await response.json();
       
          setWatchUrl(data);
          console.log(watchUrl);
       
      } catch (error) {
        console.error("Ошибка при загрузке ссылки:", error);
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
      fetchWatchUrl();
    }
  }, [userId]);

  const fetchMovies = async (currentPage, returnOnly = false) => {
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
  
      if (returnOnly) return filtered;
  
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
  const handleMovieClick = async (id) => {
    try {
      const response = await fetch(`https://api.themoviedb.org/3/movie/${id}?api_key=60e0c7335b9b55e2cead9ef258b571ae`);
      const movie = await response.json();
  
      const movieData = {
        movie_id: movie.id,
        title: movie.title,
        genre: movie.genres?.map(g => g.name).join(", "), // Составляем строку с жанрами
        rating: movie.vote_average,
        duration: movie.runtime || 0
      };
  
      console.log(movieData); // Если нужно, можно вывести информацию о фильме в консоль
      
      // Отправка данных фильма на сервер
      const postResponse = await fetch('http://localhost:5000/api/movies', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(movieData), // Отправляем данные фильма
      });
  
      if (!postResponse.ok) {
        throw new Error('Не удалось добавить фильм');
      }
  
      // Навигация на страницу фильма
      navigate(`/movie/${id}`);
    } catch (error) {
      console.error('Error fetching movie data:', error);
    }
  };
  
  
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
    <div >

<div className="navbar">

<div className="logo">
<div class="dropdown">
 <img src={side} alt=" side" />
 <div class="dropdown-content">
  

 <div style={{ display: "flex", flexDirection: "column", gap: "20px", marginBottom: "20px" }}>
  <div style={{ display: "flex", flexDirection: "column", gap: "10px", color: "white" }}>
    <label style={{
      backgroundColor: "#332F69",
      padding: "10px 15px",
      borderRadius: "8px",
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center"
    }}>
      Минимальный рейтинг:
      <input
  type="number"
  value={minRating}
  onChange={(e) => {
    const newValue = Number(e.target.value);
    setMinRating(newValue);
    setFilt_Search(newValue !== 0);
  }}
  min="0"
  max="10"
  step="0.1"
  style={{
    padding: "8px",
    borderRadius: "5px",
    border: "none",
    outline: "none",
    backgroundColor: "#fff",
    color: "#000",
    width: "80px",
    marginLeft: "10px"
  }}
/>

    </label>
  </div>

  <div style={{ display: "flex", flexDirection: "column", gap: "10px", color: "white" }}>
    <label style={{ marginBottom: "5px" }}>Сортировать по:</label>
    <select
      value={sortBy}
      onChange={(e) => {setSortBy(e.target.value) ,  setFilt_Search(true)}}
      style={{
        backgroundColor: "#332F69",
        color: "white",
        padding: "10px 15px",
        border: "none",
        borderRadius: "8px",
        fontSize: "16px",
        cursor: "pointer",
        appearance: "none",
        WebkitAppearance: "none",
        MozAppearance: "none",
        backgroundImage: `url("data:image/svg+xml;utf8,<svg fill='white' height='24' viewBox='0 0 24 24' width='24' xmlns='http://www.w3.org/2000/svg'><path d='M7 10l5 5 5-5z'/></svg>")`,
        backgroundRepeat: "no-repeat",
        backgroundPosition: "right 10px center",
        backgroundSize: "16px 16px"
      }}
    >
      <option value="popularity.desc">Популярности (по убыванию)</option>
      <option value="release_date.desc">Дате выпуска (по убыванию)</option>
      <option value="vote_average.desc">Рейтингу (по убыванию)</option>
    </select>
  </div>


      </div>





  </div>
  </div>
  <div>
<img src={logo} alt="Filmate Logo" />
</div>
</div>
<div className="search">

<SearchBar
  searchQuery={searchQuery}
  setSearchQuery={setSearchQuery}
  minRating={minRating}
  setMinRating={setMinRating}
  sortBy={sortBy}
  setSortBy={setSortBy}
  onChange={(value) => setFilt_Search(value)}
/>


</div>
<div>
<div className="profile"
        onClick={handleUserClick}
        style={{border:"none"}}
>
        <img src={user} alt="Filmate Logo" />
        {/* {(isAuthenticated && userId) ? "Профиль" : "Войти / Регистрация"} */}
 </div>
 </div>
</div>
{!filt_search && (
  <>
  <div className="first_block"> 
    <div className="states">
      <a href="#new" style={{ textDecoration: "none" }}>НОВИНКИ</a>
      <br />
      <a href="#fav" style={{ textDecoration: "none" }}>ЛЮБИМЫЕ ФИЛЬМЫ</a>
      <br />
      <a href="#high" style={{ textDecoration: "none" }}>ПОСМОТРЕТЬ ОНЛАЙН</a>
    </div>

    <div style={{ display: "flex", justifyContent: "center" }}>
      {movies.length > 0 && (
        <img
          onClick={() => handleMovieClick(movies[index].id)}
          src={`${IMAGE_BASE_URL}${movies[index].poster_path}`}
          alt={movies[index].title}
          style={{
            width: "700px",
            height: "600px",
            objectFit: "cover", // исправил "fit" на "cover" — такого нет как "fit"
            alignItems: "left",
            marginLeft: "auto",
            marginTop: "50px",
            borderRadius: "10px",
            transition: "0.5s ease-in-out",
          }}
        />
      )}
    </div>
    
  </div>
  <div>
      <h2 id="new"
      >НОВИНКИ</h2>

      <div style={{ position: "relative", width: "100%" }}>
        <img
        src={left}
          onClick={() => scroll("left")}
          style={{
            position: "absolute",
            left: 0,
            top: "40%",
            zIndex: 1,
        background:"transparent",
            border: "none",
            fontSize: "24px",
            cursor: "pointer",
          }}
        />
          

        <div
          ref={carouselRef}
          style={{
            display: "flex",
            overflowX: "auto",
            scrollBehavior: "smooth",
            gap: "20px",
            padding: "20px 40px",
          }}
        >
          {movies
            .filter((movie) => movie.vote_average > 5) // если нужно условие по рейтингу
            .map((movie) => (
              <div key={movie.id} style={{ width  : "300px", flex: "0 0 auto" }}>
                <img
                 onClick={() => handleMovieClick(movie.id)}
                  src={`${IMAGE_BASE_URL}${movie.poster_path}`}
                  alt={movie.title}
                  style={{ width: "100%", borderRadius: "10px" }}
                />
                <p style={{ textAlign: "center" }}>{movie.title}</p>
              </div>
            ))}
        </div>

        <img
        src={right}
          onClick={() => scroll("right")}
          style={{
            position: "absolute",
            right: 0,
            top: "40%",
            zIndex: 1,
            background:"transparent",
            border: "none",
            fontSize: "24px",
            cursor: "pointer",
          }}
        />
     
      </div>





      
    </div>
    <div>
      <h2 id="fav"
      >ЛЮБИМЫЕ ФИЛЬМЫ</h2>

      <div style={{ position: "relative", width: "100%" }}>
        <img
        src={left}
          onClick={() => scroll("left")}
          style={{
            position: "absolute",
            left: 0,
            top: "40%",
            zIndex: 1,
        background:"transparent",
            border: "none",
            fontSize: "24px",
            cursor: "pointer",
          }}
        />
          

        <div
          ref={carouselRef}
          style={{
            display: "flex",
            overflowX: "auto",
            scrollBehavior: "smooth",
            gap: "20px",
            padding: "20px 40px",
          }}
        >
          {movies
            .filter((movie) => movie.popularity > 7.5) // если нужно условие по рейтингу
            .map((movie) => (
              <div key={movie.id} style={{ width  : "300px", flex: "0 0 auto" }}>
                <img
                 onClick={() => handleMovieClick(movie.id)}
                  src={`${IMAGE_BASE_URL}${movie.poster_path}`}
                  alt={movie.title}
                  style={{ width: "100%", borderRadius: "10px" }}
                />
                <p style={{ textAlign: "center" }}>{movie.title}</p>
              </div>
            ))}
        </div>

        <img
        src={right}
          onClick={() => scroll("right")}
          style={{
            position: "absolute",
            right: 0,
            top: "40%",
            zIndex: 1,
            background:"transparent",
            border: "none",
            fontSize: "24px",
            cursor: "pointer",
          }}
        />
     
      </div>
      </div>
      <div>
      <h2 id="high"
      >ПОСМОТРЕТЬ ОНЛАЙН</h2>

      <div style={{ position: "relative", width: "100%" }}>
        <img
        src={left}
          onClick={() => scroll("left")}
          style={{
            position: "absolute",
            left: 0,
            top: "40%",
            zIndex: 1,
        background:"transparent",
            border: "none",
            fontSize: "24px",
            cursor: "pointer",
          }}
        />
          

        <div
          ref={carouselRef}
          style={{
            display: "flex",
            overflowX: "auto",
            scrollBehavior: "smooth",
            gap: "20px",
            padding: "20px 40px",
          }}
        >
          {movies
  .filter((movie) => linkedMovieIds.includes(movie.id))
  .map((movie) => (
              <div key={movie.id} style={{ width  : "300px", flex: "0 0 auto" }}>
                <img
                 onClick={() => handleMovieClick(movie.id)}
                  src={`${IMAGE_BASE_URL}${movie.poster_path}`}
                  alt={movie.title}
                  style={{ width: "100%", borderRadius: "10px" }}
                />
                <p style={{ textAlign: "center" }}>{movie.title}</p>
              </div>
            ))}
        </div>

        <img
        src={right}
          onClick={() => scroll("right")}
          style={{
            position: "absolute",
            right: 0,
            top: "40%",
            zIndex: 1,
            background:"transparent",
            border: "none",
            fontSize: "24px",
            cursor: "pointer",
          }}
        />
     
      </div>
      </div>
  </>
)}






   
    
     


      <h1 className="main_h">ВЫБЕРИ ПОДХОДЯЩЕЕ</h1>

    

     <div
  style={{
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
    gap: "24px",
    padding: "20px",
  }}
>
  {movies.map((movie) => (
    <div
      key={movie.id}
      onClick={() => handleMovieClick(movie.id)}
      style={{
        padding: "15px",
        border: "1px solid #e0e0e0",
        borderRadius: "16px",
        boxShadow: "0 4px 12px rgba(0,0,0,0.05)",
        transition: "transform 0.2s, box-shadow 0.2s",
        cursor: "pointer",
     
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = "scale(1.02)";
        e.currentTarget.style.boxShadow = "0 6px 16px rgba(0,0,0,0.1)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = "scale(1)";
        e.currentTarget.style.boxShadow = "0 4px 12px rgba(0,0,0,0.05)";
      }}
    >
    
      <img
        src={`${IMAGE_BASE_URL}${movie.poster_path}`}
        alt={movie.title}
        style={{
          width: "100%",
          borderRadius: "12px",
          marginBottom: "12px",
        }}
      />
      <p style={{ margin: "4px 0", fontSize: "14px", color: "#ffff" }}>
        ⭐ {movie.vote_average}
      </p>
      <p style={{ margin: "4px 0", fontSize: "14px", color:  "#ffff" }}>
        🔥 Популярность: {movie.popularity.toFixed(1)}
      </p>
      <button
        onClick={(e) => addToPlaylist(e, movie.id)}
        style={{
          marginTop: "12px",
          padding: "8px 16px",
          fontSize: "14px",
          cursor: "pointer",
          borderRadius: "20px",
          border: "none",
          backgroundColor: "#ff69b4", // розоватый акцент
          color: "#fff",
          transition: "background-color 0.3s",
        }}
        onMouseOver={(e) => (e.currentTarget.style.backgroundColor = "#ff85c1")}
        onMouseOut={(e) => (e.currentTarget.style.backgroundColor = "#ff69b4")}
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
    display: "block", // важно!
    margin: "30px auto",
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
              backgroundColor: "#1A192B",
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
                  backgroundColor: "#ff69b4",
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
