const express = require("express");
const { Sequelize, DataTypes } = require("sequelize");
const cors = require("cors");
const bcrypt = require("bcrypt");
const { Pool } = require('pg');
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



const pool = new Pool({
  user: 'postgres',          // твой юзер
  host: 'localhost',         // или адрес сервера
  database: 'filmate', // имя базы
  password: '123', // пароль
  port: 5433,                // порт PostgreSQL
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
app.delete("/api/theaters/delete_theater/:theater_id",async(req,res)=>
{
  const id = parseInt(req.params.theater_id);
  try{
    const deleteTheater=await Theater.destroy(
      {
        where:{theater_id:id},
      }
    )
    res.status(200).json({ message: "Кинотеатр успешно удалён." });
  }
  catch(error)
  {
    console.error("Ошибка при удалении:", error);
    res.status(500).json({ message: "Ошибка сервера при удалении кинотеатра." });
  }
})

app.delete("/api/sessions/:session_id", async (req, res) => {
  const id = parseInt(req.params.session_id);
  try {
    const deleted = await Session.destroy({
      where: { session_id: id },
    });

    if (deleted) {
      res.status(200).json({ message: "Сеанс успешно удалён." });
    } else {
      res.status(404).json({ message: "Сеанс не найден." });
    }
  } catch (error) {
    console.error("Ошибка при удалении:", error);
    res.status(500).json({ message: "Ошибка сервера при удалении сеанса." });
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


const MovieLink = sequelize.define('MovieLink', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  movie_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  url: {
    type: DataTypes.TEXT,
    allowNull: false,
  }
}, {
  tableName: "movie_links",
  timestamps: false,
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
  session_id: { type: DataTypes.INTEGER, primaryKey: true ,autoIncrement: true},
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

// Связи между Movie и MovieLink
Movie.hasMany(MovieLink, { foreignKey: "movie_id" });
MovieLink.belongsTo(Movie, { foreignKey: "movie_id" });

// Связь между PurchasedTicket и User
// User.hasMany(PurchasedTicket, { foreignKey: "user_id" });
// PurchasedTicket.belongsTo(User, { foreignKey: "user_id" });

// Связь между Playlist и User
User.hasMany(Playlist, { foreignKey: "user_id" });
Playlist.belongsTo(User, { foreignKey: "user_id" });

// Связь между Playlist и Movie через Playlist_Movies
Playlist.hasMany(Playlist_Movies, { foreignKey: "playlist_id" });
Movie.hasMany(Playlist_Movies, { foreignKey: "movie_id" });

Playlist_Movies.belongsTo(Playlist, { foreignKey: "playlist_id" });
Playlist_Movies.belongsTo(Movie, { foreignKey: "movie_id" });

// Если предполагается, что покупка билетов также связана с PurchasedTicket
// Session.hasMany(PurchasedTicket, { foreignKey: "session_id" });
// PurchasedTicket.belongsTo(Session, { foreignKey: "session_id" });
Session.belongsTo(Theater, { foreignKey: 'theater_id' });
Theater.hasMany(Session, { foreignKey: 'theater_id' });

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

app.delete("/api/playlists_del/:playlistId", async (req, res) => {
  const { playlistId } = req.params;

  try {
    // Удалить сначала зависимости, если есть (например, фильмы из плейлиста)
    await pool.query("DELETE FROM playlist_movies WHERE playlist_id = $1", [playlistId]);

    // Затем сам плейлист
    const result = await pool.query("DELETE FROM playlists WHERE playlist_id = $1 RETURNING *", [playlistId]);

    if (result.rowCount === 0) {
      return res.status(404).json({ message: "Плейлист не найден" });
    }

    res.json({ message: "Плейлист удалён", deleted: result.rows[0] });
  } catch (error) {
    console.error("Ошибка при удалении плейлиста:", error);
    res.status(500).json({ message: "Ошибка сервера при удалении плейлиста" });
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
  const { session_id, seat_numbers, user_id, purchase_time, price, email } = req.body;

  if (!Array.isArray(seat_numbers) || seat_numbers.length === 0) {
    return res.status(400).json({ message: "Нет выбранных мест." });
  }

  try {
    for (const seat_number of seat_numbers) {
      const purchase = await Ticket.create({
        session_id,
        seat_number,
        user_id,
        purchase_time,
        price,
      });
      await Seat.update(
        { is_available: false },
        {
          where: {
            seat_id: seat_number,
          },
        }
      );
      await PurchasedTicket.create({
        ticket_id: purchase.ticket_id,
        user_email: email,
        purchase_time,
      });
    
  
    }

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
app.post("/api/add_movie", async (req, res) => {
  const { movie_id, title, genre, rating, duration } = req.body;
  try {
    // Check if the movie already exists in the database
    const result = await pool.query("SELECT * FROM movies WHERE movie_id = $1", [movie_id]);

    if (result.rows.length > 0) {
      // If the movie exists, return a 409 conflict status
      return res.status(409).json({ message: "The movie already exists in the database." });
    }

    // If the movie doesn't exist, insert it into the database
    await pool.query(
      "INSERT INTO movies (movie_id, title, genre, rating, duration) VALUES ($1, $2, $3, $4, $5)",
      [movie_id, title, genre, rating, duration]
    );
    res.status(201).json({ message: "The movie was successfully added." });
  } catch (error) {
    console.error("Error adding movie:", error);
    res.status(500).json({ message: "Error adding movie." });
  }
});
app.post("/api/add_session", async (req, res) => {
  const { movie_id, theater_id, session_date, start_time, end_time, price,seats_count } = req.body;

  try {
    // 1. Добавляем сеанс и получаем его ID
    const sessionResult = await pool.query(
      "INSERT INTO sessions (movie_id, theater_id, session_date, start_time, end_time, price) VALUES ($1, $2, $3, $4, $5, $6) RETURNING session_id",
      [movie_id, theater_id, session_date, start_time, end_time, price]
    );

    const sessionId = sessionResult.rows[0].session_id;

    // 2. Добавляем 5 свободных мест
    const seatInserts = [];
    for (let i = 1; i <= seats_count; i++) {
      seatInserts.push(pool.query(
        "INSERT INTO seats (session_id, seat_number, is_available) VALUES ($1, $2, $3)",
        [sessionId, i, true]
      ));
    }

    await Promise.all(seatInserts); // Ждем, пока все места добавятся

    res.status(201).json({ message: "Сеанс и места успешно добавлены." });
  } catch (error) {
    console.error("Ошибка при добавлении сеанса:", error);
    res.status(500).json({ message: "Ошибка при добавлении сеанса." });
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
app.get('/api/watch_url/:id', async (req, res) => {
  const movieId = parseInt(req.params.id);  // Получаем ID фильма из URL

  try {
    // Получаем ссылку на фильм из таблицы movie_links
    const result = await pool.query(
      'SELECT url FROM movie_links WHERE movie_id = $1',
      [movieId]
    );

    // Если ссылка найдена, отправляем ее в ответе
    if (result.rows.length > 0) {
      res.json({ url: result.rows[0].url });
    } else {
      // Если ссылка не найдена, отправляем 404 ошибку
      res.status(404).json({ message: "Ссылка не найдена" });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Ошибка сервера" });
  }
});
app.get('/api/watch_url_all', async (req, res) => {
  try {
    // Получаем все movie_id из таблицы movie_links
    const result = await pool.query('SELECT movie_id FROM movie_links');

    // Возвращаем только массив ID фильмов
    const movieIds = result.rows.map(row => row.movie_id);

    res.json({ movieIds }); // Удобный JSON: { movieIds: [1, 2, 3, ...] }
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Ошибка сервера" });
  }
});

app.post('/api/watch_url/:id', async (req, res) => {
  const movieId = parseInt(req.params.id);  // Получаем ID фильма из URL
  const { url } = req.body;  // Извлекаем новый URL из тела запроса

  try {
    // Вставляем новый URL в таблицу movie_links
    const result = await pool.query(
      'INSERT INTO movie_links (movie_id, url) VALUES ($1, $2) RETURNING *',
      [movieId, url]
    );

    // Успешный ответ с добавленной ссылкой
    res.json({ message: "Ссылка добавлена", movie_link: result.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Ошибка сервера" });
  }
});

app.post('/api/movies', async (req, res) => {
  const { movie_id, title, genre, rating, duration } = req.body;

  try {
    const existing = await pool.query('SELECT 1 FROM movies WHERE movie_id = $1', [movie_id]);

    if (existing.rowCount === 0) {
      await pool.query(
        'INSERT INTO movies (movie_id, title, genre, rating, duration) VALUES ($1, $2, $3, $4, $5)',
        [movie_id, title, genre, rating, duration]
      );
    }

    res.status(200).send('OK');
  } catch (error) {
    console.error('Ошибка при добавлении фильма:', error);
    res.status(500).send('Ошибка сервера');
  }
});



app.put('/api/theaters/:theater_id', async (req, res) => {
  const theaterId = parseInt(req.params.theater_id);
  const { name, location } = req.body;

  try {
    const result = await pool.query(
      'UPDATE theaters SET name = $1, location = $2 WHERE theater_id = $3 RETURNING *',
      [name, location, theaterId]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ message: "Кинотеатр не найден" });
    }

    res.json({ message: "Кинотеатр обновлён", theater: result.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Ошибка сервера" });
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



app.get('/api/sessions/:movie_id', async (req, res) => {
  const movie_id = Number(req.params.movie_id);

  try {
    const sessions = await Session.findAll({
      where: { movie_id }
    });

    res.json(sessions);
  } catch (error) {
    console.error('Ошибка при получении сеансов:', error);
    res.status(500).json({ message: 'Ошибка при получении сеансов' });
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
