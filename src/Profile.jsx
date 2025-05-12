import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import './Profile.css';
import left from './assets/arrow-left.svg';
import right from './assets/arrow-right.svg';

function Profile() {
  const { userId } = useParams();
  const [profile, setProfile] = useState(null);
  const [admin, setAdmin] = useState(false);
  const [playlists, setPlaylists] = useState([]);
  const [playlistMovies, setPlaylistMovies] = useState({});
  const [loadingMovies, setLoadingMovies] = useState({});
  const navigate = useNavigate();
  const API_KEY = "60e0c7335b9b55e2cead9ef258b571ae";
  const BASE_URL = "https://api.themoviedb.org/3";
  const IMAGE_BASE_URL = "https://image.tmdb.org/t/p/w500";

  const handleCinemaAdd = () => {
    navigate("/theater");
  };

  const fetchMovieDetails = async (movieId) => {
    try {
      const response = await fetch(`${BASE_URL}/movie/${movieId}?api_key=${API_KEY}`);
      const data = await response.json();
      if (response.ok) {
        return data;
      } else {
        console.error("Ошибка при загрузке фильма:", data.message);
      }
    } catch (error) {
      console.error("Ошибка при запросе API:", error);
    }
  };

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await fetch(`http://localhost:5000/api/profile/${userId}`);
        const data = await response.json();
        if (response.ok) {
          setProfile(data);
          localStorage.setItem("userId", userId);
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

    fetchProfile();
    fetchPlaylists();
  }, [userId]);

  const handleAdminEnter = () => {
    const password = prompt("Введите пароль администратора:");
    if (password === "6666") {
      setAdmin(true);
      localStorage.setItem("isAdmin", "true");
    } else {
      alert("Неверный пароль или у вас нет прав администратора.");
    }
  };

  useEffect(() => {
    const isAdminStored = localStorage.getItem("isAdmin");
    if (isAdminStored === "true") {
      setAdmin(true);
    }
  }, []);

  const fetchMoviesForPlaylist = async (playlistId) => {
    setLoadingMovies((prev) => ({ ...prev, [playlistId]: true }));
    try {
      const response = await fetch(`http://localhost:5000/api/playlist_movies/${playlistId}`);
      const data = await response.json();
      if (response.ok) {
        const movieDetails = await Promise.all(
          data.map(async (movie) => {
            const movieInfo = await fetchMovieDetails(movie.movie_id);
            return { ...movie, details: movieInfo };
          })
        );
        setPlaylistMovies((prev) => ({ ...prev, [playlistId]: movieDetails }));
      } else {
        console.error("Ошибка загрузки фильмов:", data.message);
      }
    } catch (error) {
      console.error("Ошибка запроса фильмов:", error);
    } finally {
      setLoadingMovies((prev) => ({ ...prev, [playlistId]: false }));
    }
  };

  useEffect(() => {
    playlists.forEach((playlist) => {
      if (!playlistMovies[playlist.playlist_id]) {
        fetchMoviesForPlaylist(playlist.playlist_id);
      }
    });
  }, [playlists, playlistMovies]);

  const handleLogout = () => {
    localStorage.removeItem("userId");
    localStorage.removeItem("userEmail");
    localStorage.removeItem("isAdmin");
    navigate("/");
  };

  const handlePlayListCreation = async () => {
    const name = prompt("Введите название плейлиста", "").trim();
    if (!name) return;

    const userData = { name, user_id: Number(userId) };

    try {
      const response = await fetch("http://localhost:5000/api/playlists", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(userData),
      });

      if (!response.ok) {
        throw new Error(`Ошибка: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      setPlaylists((prev) => [...prev, data]);
      fetchMoviesForPlaylist(data.playlist_id);
      alert(`Плейлист "${name}" создан!`);
    } catch (error) {
      console.error("Ошибка при создании плейлиста:", error);
      alert("Ошибка при создании плейлиста");
    }
  };

  const handlePlaylistDelete = async (playlistId) => {
    if (!window.confirm("Вы уверены, что хотите удалить этот плейлист?")) return;

    try {
      const response = await fetch(`http://localhost:5000/api/playlists_del/${playlistId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error(`Ошибка: ${response.status} ${response.statusText}`);
      }

      setPlaylists((prev) => prev.filter((playlist) => playlist.playlist_id !== playlistId));
      alert("Плейлист удален!");
    } catch (error) {
      console.error("Ошибка удаления плейлиста:", error);
      alert("Ошибка удаления плейлиста");
    }
  };

  const handleMovieDelete = async (playlistId, movieId) => {
    if (!window.confirm("Удалить фильм из плейлиста?")) return;

    try {
      const response = await fetch(`http://localhost:5000/api/playlist_movie_del/${playlistId}/${movieId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error(`Ошибка: ${response.status} ${response.statusText}`);
      }

      setPlaylistMovies((prev) => ({
        ...prev,
        [playlistId]: prev[playlistId].filter((movie) => movie.movie_id !== movieId),
      }));

      alert("Фильм удален!");
    } catch (error) {
      console.error("Ошибка удаления фильма:", error);
      alert("Ошибка удаления фильма");
    }
  };

  const scroll = (direction, playlistId) => {
    const container = document.getElementById(`carousel-${playlistId}`);
    if (direction === "left") {
      container.scrollBy({ left: -300, behavior: "smooth" });
    } else {
      container.scrollBy({ left: 300, behavior: "smooth" });
    }
  };

  if (!profile) return <div>Ошибка загрузки профиля</div>;

  return (
    <div className="profile-page">
      {!admin && (
        <button className="admin-button" onClick={handleAdminEnter}>Я администратор</button>
      )}

      {admin && (
        <div className="admin-panel">
          <h1>Режим администратора</h1>
          <button onClick={handleCinemaAdd}>Добавить кинотеатр</button>
        </div>
      )}

      <h1>Профиль пользователя</h1>
      <div className="user-info">
        <p>Имя: <span>{profile.username}</span></p>
        <p>Email: <span>{profile.email}</span></p>
       
      </div>

      <div className="profile-actions">
        <button onClick={handleLogout}>Выйти</button>
        <button onClick={() => navigate("/")}>На главную</button>
        <button onClick={handlePlayListCreation}>Создать плейлист</button>
      </div>

      <h2>Мои плейлисты</h2>
      {playlists.length > 0 ? (
        <ul className="playlist-list">
          {playlists.map((playlist) => (
            <li key={playlist.playlist_id} className="playlist-item">
              <h3>{playlist.name}</h3>
              <button className="delete-button" onClick={() => handlePlaylistDelete(playlist.playlist_id)}>Удалить плейлист</button>

              {loadingMovies[playlist.playlist_id] && <p>Загрузка фильмов...</p>}

              <div className="carousel-wrapper">
                <img src={left} className="scroll-button left" onClick={() => scroll("left", playlist.playlist_id)} alt="left" />
                <div className="carousel" id={`carousel-${playlist.playlist_id}`}>
                  {playlistMovies[playlist.playlist_id]?.map((movie) => (
                    <div key={movie.movie_id} className="movie-card">
                      <img
                        onClick={() => handleMovieDelete(playlist.playlist_id, movie.movie_id)}
                        src={`${IMAGE_BASE_URL}${movie.details?.poster_path}`}
                        alt={movie.details?.title}
                        className="movie-poster"
                      />
                      <p className="movie-title">{movie.details?.title}</p>
                    </div>
                  ))}
                </div>
                <img src={right} className="scroll-button right" onClick={() => scroll("right", playlist.playlist_id)} alt="right" />
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <p>Плейлистов нет.</p>
      )}
    </div>
  );
}

export default Profile;
