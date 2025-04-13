const express = require("express");
const { Sequelize, DataTypes } = require("sequelize");
const cors = require("cors");
const bcrypt = require("bcrypt");
const nodemailer = require('nodemailer');
const bodyParser = require('body-parser');
const stripe = require("stripe")("sk_test_51RCNozFtMlrzCs5Y60kxjDHo5RCF8bh0yjVIyx347BnGQNEQOCpXnnM7euO78XvtxcRETgAgYkUcD0WERWO007cO00Iza3lZDG");

const app = express();
const port = 5000;
app.use(cors());
app.use(express.json());
app.use(bodyParser.json());
// Подключение к БД
const sequelize = new Sequelize("filmate", "postgres", "123", {
  host: "localhost",
  dialect: "postgres",
  port: 5433,
});


app.post('/api/send-email', async (req, res) => {
  const { email, subject, text } = req.body;

  try {
    const transporter = nodemailer.createTransport({
      host: "smtp.mail.ru",
      port: 465,
      secure: true, // true для 465, false для 587
      auth: {
        user: "beauty.cutie@mail.ru",
        pass: "sJgbLA6PS9s0stbwZd8m",
      },
    });

    await transporter.sendMail({
      from: '"Кинотеатр" <beauty.cutie@mail.ru>', // Имя и адрес отправителя
      to: email, // Кому отправляем
      subject: subject,
      text: text,
    });

    res.status(200).json({ message: "Письмо успешно отправлено" });
  } catch (error) {
    console.error("Ошибка при отправке письма:", error);
    res.status(500).json({ message: "Ошибка при отправке письма" });
  }
});


app.post("/api/create-payment-intent", async (req, res) => {
  try {
    const { amount } = req.body;
    console.log("Amount received:", amount);

    const paymentIntent = await stripe.paymentIntents.create({
      amount,
      currency: "usd",
    });

    res.status(200).send({
      clientSecret: paymentIntent.client_secret,
    });


    
  } catch (error) {
    console.error("Error creating payment intent:", error);
    res.status(500).send({ error: error.message });
  }
});



// Определение моделей
const Movie = sequelize.define("Movie", {
  movie_id: { type: DataTypes.INTEGER, primaryKey: true },
  title: { type: DataTypes.STRING },
  genre: { type: DataTypes.STRING },
  rating: { type: DataTypes.DECIMAL(3, 2) },
  duration: { type: DataTypes.INTEGER },
}, {
  tableName: "movies",
  timestamps: false,
});

// Определение моделей
const Playlist = sequelize.define("Playlist", {
  playlist_id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  name: { type: DataTypes.STRING, allowNull: false },
  user_id: { type: DataTypes.INTEGER, allowNull: false },
}, {
  tableName: "playlists",
  timestamps: false,
});

const Playlist_Movies = sequelize.define("Playlist_movies", {
  playlist_id: { 
    type: DataTypes.INTEGER, 
    primaryKey: true 
  },
  movie_id: { 
    type: DataTypes.INTEGER, 
    primaryKey: true 
  },
}, {
  tableName: "playlist_movies",
  timestamps: false,
});


const Theater = sequelize.define("Theater", {
  theater_id: { type: DataTypes.INTEGER, primaryKey: true,autoIncrement: true  },
  name: { type: DataTypes.STRING },
  location: { type: DataTypes.STRING },
}, {
  tableName: "theaters",
  timestamps: false,
});

const PurchasedTicket = sequelize.define("PurchasedTicket", {
  purchased_ticket_id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  ticket_id: { type: DataTypes.INTEGER, allowNull: false },
  user_email: { type: DataTypes.STRING, allowNull: false },  // Изменено на STRING для email
  purchase_time: { type: DataTypes.DATE, defaultValue: Sequelize.NOW },
}, {
  tableName: "purchasedtickets",
  timestamps: false,
});

const Session = sequelize.define("Session", {
  session_id: { type: DataTypes.INTEGER, primaryKey: true },
  movie_id: { type: DataTypes.INTEGER },
  theater_id: { type: DataTypes.INTEGER },
  session_date: { type: DataTypes.DATE },
  start_time: { type: DataTypes.TIME },
  end_time: { type: DataTypes.TIME },
  price: { type: DataTypes.DECIMAL(5, 2) },
}, {
  tableName: "sessions",
  timestamps: false,
});

// Модель Seat
const Seat = sequelize.define("Seat", {
  seat_id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  session_id: { type: DataTypes.INTEGER, allowNull: false },
  seat_number: { type: DataTypes.INTEGER, allowNull: false },
  is_available: { type: DataTypes.BOOLEAN, defaultValue: true },
}, {
  tableName: "seats",
  timestamps: false,
});

// Модель User
const User = sequelize.define("User", {
  user_id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  username: { type: DataTypes.STRING, allowNull: false },
  email: { type: DataTypes.STRING, allowNull: false, unique: true },
  password_hash: { type: DataTypes.STRING, allowNull: false },
  role: { type: DataTypes.STRING },
}, {
  tableName: "users",
  timestamps: false,
});
// Модель Ticket
const Ticket = sequelize.define("Ticket", {
  ticket_id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  user_id: { type: DataTypes.INTEGER, allowNull: false },
  session_id: { type: DataTypes.INTEGER, allowNull: false },
  seat_number: { type: DataTypes.INTEGER, allowNull: false },
  purchase_time: { type: DataTypes.DATE, defaultValue: Sequelize.NOW },
  price: { type: DataTypes.DECIMAL(5, 2) },
}, {
  tableName: "tickets",
  timestamps: false,
});

Playlist.hasMany(Playlist_Movies, { foreignKey: "playlist_id" });
Movie.hasMany(Playlist_Movies, { foreignKey: "movie_id" });

Playlist_Movies.belongsTo(Playlist, { foreignKey: "playlist_id" });
Playlist_Movies.belongsTo(Movie, { foreignKey: "movie_id" });


// Установка связей
Movie.hasMany(Session, { foreignKey: "movie_id" });
Session.belongsTo(Movie, { foreignKey: "movie_id" });

Theater.hasMany(Session, { foreignKey: "theater_id" });
Session.belongsTo(Theater, { foreignKey: "theater_id" });

Session.hasMany(Seat, { foreignKey: "session_id" });
Seat.belongsTo(Session, { foreignKey: "session_id" });

User.hasMany(Ticket, { foreignKey: "user_id" });
Ticket.belongsTo(User, { foreignKey: "user_id" });

Session.hasMany(Ticket, { foreignKey: "session_id" });
Ticket.belongsTo(Session, { foreignKey: "session_id" });

// Подключение к БД
sequelize.authenticate()
  .then(() => console.log("✅ Подключение к базе данных успешно"))
  .catch(err => console.error("❌ Ошибка подключения:", err));

app.use(cors());
app.use(express.json());

// API: Получить все данные
app.get("/api/all-tables", async (req, res) => {
  try {
    const movies = await Movie.findAll();
    const sessions = await Session.findAll();
    const theaters = await Theater.findAll();
    const seats = await Seat.findAll();
    res.json({ movies, sessions, theaters, seats });
  } catch (error) {
    console.error("Ошибка при извлечении данных:", error);
    res.status(500).json({ message: "Ошибка при извлечении данных" });
  }
});

app.get("/api/theaters", async (req, res) => {
  try {
   
    const theaters = await Theater.findAll();
   
    res.json({  theaters });
  } catch (error) {
    console.error("Ошибка при извлечении данных:", error);
    res.status(500).json({ message: "Ошибка при извлечении данных" });
  }
});
// API: Получить сеансы по фильму
app.get("/api/sessions/:movieId", async (req, res) => {
  const movieId = Number(req.params.movieId);
  console.log(`🔍 Запрос сеансов для movieId = ${movieId}`);

  if (isNaN(movieId)) {
    return res.status(400).json({ message: "Некорректный movieId" });
  }

  try {
    const sessions = await Session.findAll({
      where: { movie_id: movieId },
      include: [{ model: Theater, attributes: ["name", "location"] }],
    });

    if (sessions.length === 0) {
      return res.status(404).json({ message: "Сеансы не найдены" });
    }

    res.json(sessions);
  } catch (error) {
    console.error("Ошибка при извлечении сеансов:", error);
    res.status(500).json({ message: "Ошибка при извлечении сеансов" });
  }
});
app.get("/api/playlists/:user_id", async (req, res) => {
  try {
    const { user_id } = req.params;
    if (!user_id) {
      return res.status(400).json({ message: "Не указан user_id" });
    }

    const playlists = await Playlist.findAll({ where: { user_id } });

    res.json(playlists);
  } catch (error) {
    console.error("Ошибка при получении плейлистов:", error);
    res.status(500).json({ message: "Ошибка сервера" });
  }
});

// API: Получить места для сеанса
app.get("/api/seats/:sessionId", async (req, res) => {
  const sessionId = Number(req.params.sessionId);
  console.log(`🎟 Запрос мест для sessionId = ${sessionId}`);

  if (isNaN(sessionId)) {
    return res.status(400).json({ message: "Некорректный sessionId" });
  }

  try {
    const seats = await Seat.findAll({ where: { session_id: sessionId } });

    if (seats.length === 0) {
      return res.status(404).json({ message: "Места не найдены" });
    }

    res.json(seats);
  } catch (error) {
    console.error("Ошибка при извлечении мест:", error);
    res.status(500).json({ message: "Ошибка при извлечении мест" });
  }
});

// API: Купить билет
app.post("/api/purchase", async (req, res) => {
  const { session_id, seat_number, user_id, purchase_time, price, email } = req.body;

  try {
    // Создание записи о покупке
    const purchase = await Ticket.create({
      session_id,
      seat_number,
      user_id,
      purchase_time,
      price,
    });

    // Создание записи о покупательном билете
    await PurchasedTicket.create({
      ticket_id: purchase.ticket_id,
      user_email: email,
      purchase_time,
    });

    res.status(200).json({ message: "Покупка прошла успешно" });
  } catch (error) {
    console.error("Ошибка при оформлении покупки:", error.message);
    res.status(400).json({ message: "Ошибка при оформлении покупки" });
  }
});

// Регистрация нового пользователя
app.post("/api/update-ticket-status", async (req, res) => {
  const { seats } = req.body;
  try {
    // Обновление состояния мест в базе данных
    await Seat.update(
      { is_available: false },
      {
        where: {
          seat_id: seats,
        },
      }
    );
    res.status(200).json({ message: "Места обновлены" });
  } catch (error) {
    console.error("Ошибка при обновлении статуса билетов:", error.message);
    res.status(400).json({ message: "Ошибка при обновлении статуса билетов" });
  }
});

app.post("/api/add_theater", async (req, res) => {
  const { location, name } = req.body;
  try {
    const newTheater = await Theater.create({ name, location });
    res.status(201).json({ message: "Театр успешно добавлен", theater: newTheater });
  } catch (error) {
    console.error("Ошибка при добавлении театра:", error.message);
    res.status(500).json({ message: "Ошибка при добавлении театра", error: error.message });
  }
});
app.post("/api/playlists", async (req, res) => {
  const { user_id, name } = req.body;

  try {

    const playlist = await Playlist.create({ user_id, name });
    res.status(201).json({ message: "Плейлист создан", playlist });
  } catch (error) {
    console.error("Ошибка при создании плейлиста:", error);
    res.status(500).json({ message: "Ошибка при создании плейлиста" });
  }
});

app.post("/api/playlist_movies", async (req, res) => {
  const { playlist_id, movie_id,title,rating,duration,genre} = req.body;

  try {
    // Проверка существования фильма в таблице movies
    let movie = await Movie.findOne({ where: { movie_id } });

    // Если фильма нет, добавляем его
    if (!movie) {
      console.log(`Фильм с ID ${movie_id} не найден, добавляем новый фильм`);

      // Пример данных для добавления фильма
      const newMovieData = {
        movie_id,
        title,
        rating,
        duration,
        genre
         // Название фильма можно заменить на реальное
        // Добавьте другие необходимые поля, такие как описание, жанр, год выпуска и т.д.
      };

      movie = await Movie.create(newMovieData); // Создаем новый фильм
    }

    // Добавление фильма в плейлист
    const playlistMovie = await Playlist_Movies.create({ playlist_id, movie_id });
    res.status(201).json({ message: "Фильм добавлен в плейлист", playlistMovie });
  } catch (error) {
    console.error("Ошибка при добавлении фильма в плейлист:", error);
    res.status(500).json({ message: "Ошибка при добавлении фильма в плейлист" });
  }
});


// Регистрация нового пользователя
// Регистрация нового пользователя
app.post("/api/register", async (req, res) => {
  const { email, password, nickname, role } = req.body;

  // Проверка, если пользователь с таким email уже существует
  const existingUser = await User.findOne({ where: { email } });
  if (existingUser) {
    return res.status(400).json({ message: "Пользователь с таким email уже существует" });
  }

  try {
    // Создание нового пользователя без хэширования пароля
    const user = await User.create({
      username: nickname, // Здесь никнейм
      email,
      password_hash: password, // Просто сохраняем пароль в открытом виде
      role: role, // Устанавливаем роль
    });

    // Возвращаем только user_id после успешной регистрации
    res.status(201).json({
      message: 'Пользователь успешно зарегистрирован',
      user_id: user.user_id,  // Передаем только user_id
    });
  } catch (error) {
    console.error("Ошибка при регистрации:", error);
    res.status(500).json({ message: "Ошибка при регистрации" });
  }
});

// Вход пользователя
// Вход пользователя
// Вход пользователя
// Вход пользователя
app.post("/api/login", async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ where: { email } });
  if (!user) {
    return res.status(400).json({ message: "Пользователь с таким email не найден" });
  }

  try {
    // Проверка пароля
    if (password !== user.password_hash) {
      return res.status(400).json({ message: "Неверный пароль" });
    }

    // Профиль пользователя
    const userProfile = {
      user_id: user.user_id,
      username: user.username,
      email: user.email,
      role: user.role,
    };

    res.status(200).json({ message: "Вход успешен", userProfile });
  } catch (error) {
    console.error("Ошибка при входе:", error);
    res.status(500).json({ message: "Ошибка при входе" });
  }
});





app.get('/api/profile/:userId', async (req, res) => {
  const userId = Number(req.params.userId);

  try {
    // Получение данных о пользователе по userId
    const user = await User.findByPk(userId);
    
    if (!user) {
      return res.status(404).json({ message: 'Пользователь не найден' });
    }

    res.json({
      user_id: user.user_id,
      username: user.username,
      email: user.email,
      role: user.role,
    });
  } catch (error) {
    console.error('Ошибка при получении профиля:', error);
    res.status(500).json({ message: 'Ошибка при получении профиля' });
  }
});


// API: Получить фильмы из плейлиста по ID плейлиста
app.get("/api/playlist_movies/:userId", async (req, res) => {
  const { userId } = req.params;  // Получаем playlist_id из параметров запроса

  try {
    // 1. Находим фильмы для данного плейлиста
    const playlistMovies = await Playlist_Movies.findAll({
      where: { playlist_id: userId },  // Используем playlist_id для поиска фильмов
      include: [{
        model: Movie,
        attributes: ["movie_id", "title", "genre", "rating", "duration"]
      }]
    });

    if (playlistMovies.length === 0) {
      return res.status(404).json({ message: "Фильмы в плейлисте не найдены" });
    }

    // Массив фильмов
    const movies = playlistMovies.map(pm => pm.Movie);

    // Отправляем только фильмы
    res.json(movies);
  } catch (error) {
    console.error("Ошибка при получении фильмов из плейлиста:", error);
    res.status(500).json({ message: "Ошибка сервера при получении фильмов" });
  }
});

// Эндпоинт для обновления данных профиля


app.listen(port, () => {
  console.log(`Сервер запущен на порту ${port}`);
});
