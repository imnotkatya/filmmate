const express = require("express");
const { Sequelize, DataTypes } = require("sequelize");
const cors = require("cors");

const app = express();
const port = 5000;

// Подключение к БД
const sequelize = new Sequelize("filmate", "postgres", "123", {
  host: "localhost",
  dialect: "postgres",
  port: 5433,
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

const Theater = sequelize.define("Theater", {
  theater_id: { type: DataTypes.INTEGER, primaryKey: true },
  name: { type: DataTypes.STRING },
  location: { type: DataTypes.STRING },
}, {
  tableName: "theaters",
  timestamps: false,
});

const PurchasedTicket = sequelize.define("PurchasedTicket", {
    purchased_ticket_id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    ticket_id: { type: DataTypes.INTEGER, allowNull: false },
    user_email: { type: DataTypes.INTEGER, allowNull: false },
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
  password: { type: DataTypes.STRING, allowNull: false },
  _hash: { type: DataTypes.STRING },
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

// Модель PurchasedTicket (Купленные билеты)

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
// Обновление статуса мест после покупки билета
app.post("/api/purchase", async (req, res) => {
  const { session_id, seat_number, user_id, purchase_time, price, email } = req.body;

  try {
    // Создание билета
    const ticket = await Ticket.create({
      session_id,
      seat_number,
      user_id,
      purchase_time,
      price,
    });

    // Создание записи в таблице купленных билетов
    await PurchasedTicket.create({
      ticket_id: ticket.ticket_id,
      user_email: email,
      purchase_time,
    });

    // Обновление статуса места на "недоступно"
    await Seat.update(
      { is_available: false },
      { where: { session_id: session_id, seat_number: seat_number } }
    );

    res.status(200).json({ message: "Билет успешно куплен", ticket });
  } catch (error) {
    console.error("Ошибка при покупке билетов:", error);
    res.status(500).json({ error: "Ошибка при покупке билетов" });
  }
});

// Обновление статуса мест для сессии
app.post("/api/update-ticket-status", async (req, res) => {
  const { seats } = req.body;

  try {
    await Seat.update(
      { is_available: false },
      { where: { seat_id: seats } }
    );
    res.status(200).json({ message: "Статус мест обновлен" });
  } catch (error) {
    console.error("Ошибка обновления статуса мест:", error);
    res.status(500).json({ error: "Ошибка обновления статуса мест" });
  }
});


app.listen(port, () => console.log(`🚀 Сервер работает на http://localhost:${port}`)); 