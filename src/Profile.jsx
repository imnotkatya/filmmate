import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";

function Profile() {
  const { userId } = useParams();
  const [profile, setProfile] = useState(null);
  const [admin, setAdmin] = useState(false);
  const [playlists, setPlaylists] = useState([]);
  const [playlistMovies, setPlaylistMovies] = useState({});
  const [loadingMovies, setLoadingMovies] = useState({});
  const navigate = useNavigate();
  localStorage.setItem("isAdmin", "true");


  const handleCinemaAdd = async () => {

    navigate("/theater")
    // const name = prompt("Введите название кинотеатра:");
    // const location = prompt("Введите место кинотеатра:");
    // if (!name || !location) {
    //   alert("Название и место не должны быть пустыми.");
    //   return;
    // }
  
    // const theater_data = {  location ,name};
  
    // try {
    //   console.log(theater_data);
    //   const response = await fetch("http://localhost:5000/api/add_theater", {
    //     method: "POST",
    //     headers: {
    //       "Content-Type": "application/json",
    //     },
    //     body: JSON.stringify(theater_data),
    //   });
  
    //   if (!response.ok) {
    //     throw new Error(`Ошибка: ${response.status} ${response.statusText}`);
    //   }
  
    //   const data = await response.json();
    //   alert(`Кинотеатр "${data.name}" успешно добавлен!`);
    // } catch (error) {
    //   console.error("Ошибка при добавлении кинотеатра:", error);
    //   alert("Произошла ошибка при добавлении кинотеатра.");
    // }
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
    if (password === "6666" ) {
      setAdmin(true);
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
        setPlaylistMovies((prev) => ({ ...prev, [playlistId]: data }));
      } else {
        console.error("Ошибка загрузки фильмов для плейлиста:", data.message);
      }
    } catch (error) {
      console.error("Ошибка при получении фильмов для плейлиста:", error);
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
      console.log("Плейлист создан:", data);
      setPlaylists((prev) => [...prev, data]);

      alert(`Плейлист "${name}" создан!`);
    } catch (error) {
      console.error("Ошибка при создании плейлиста:", error);
      alert("Ошибка при создании плейлиста");
    }
  };

  if (!profile) return <div>Ошибка загрузки профиля</div>;

  return (
    <div>
      {!admin && (
        <button onClick={handleAdminEnter}>Iam admin btw</button>
      )}

      {admin && (
        <>
          <h1>Admin Mode</h1>
          <button onClick={handleCinemaAdd}>добавить кинотеатр</button>
          <button onClick={() => alert("Управление фильмами")}>Управление фильмами</button>
          <button onClick={() => alert("Управление плейлистами")}>Управление плейлистами</button>
          <button onClick={() => alert("Просмотр логов системы")}>Просмотр логов</button>
        </>
      )}

      <h1>Профиль пользователя</h1>
      <p>Имя: {profile.username}</p>
      <p>Email: {profile.email}</p>
      <p>Роль: {profile.role}</p>
      <button onClick={handleLogout}>Выйти из аккаунта</button>
      <button onClick={() => navigate("/")}>На главную</button>
      <button onClick={handlePlayListCreation}>Создать плейлист</button>

      <h2>Мои плейлисты</h2>
      {playlists.length > 0 ? (
        <ul>
          {playlists.map((playlist) => (
            <li key={playlist.playlist_id}>
              <h3>{playlist.name}</h3>
              {!playlistMovies[playlist.playlist_id] && !loadingMovies[playlist.playlist_id] && (
                <button onClick={() => fetchMoviesForPlaylist(playlist.playlist_id)}>
                  Загрузить фильмы
                </button>
              )}
              {loadingMovies[playlist.playlist_id] && <p>Загрузка...</p>}
              {playlistMovies[playlist.playlist_id] && playlistMovies[playlist.playlist_id].length > 0 ? (
                <ul>
                  {playlistMovies[playlist.playlist_id].map((movie) => (
                    <li key={movie.movie_id}>
                      {movie.title} ({movie.releaseYear}) - {movie.genre}
                    </li>
                  ))}
                </ul>
              ) : (
                <p>Плейлист пуст.</p>
              )}
            </li>
          ))}
        </ul>
      ) : (
        <p>У вас пока нет плейлистов.</p>
      )}
    </div>
  );
}

export default Profile;
