// server.js
const express = require('express');
const { MovieSession, Movie, Theater, sequelize } = require('./db'); // Импортируем модели

// Создаем экземпляр Express
const app = express();

// Middleware для обработки JSON
app.use(express.json());

// Проверка соединения с базой данных
sequelize.authenticate()
  .then(() => {
    console.log('Соединение с базой данных успешно установлено');
  })
  .catch(err => {
    console.error('Не удалось подключиться к базе данных:', err);
  });

// Получение всех сеансов для фильма по его ID
app.get('/movie/:movieId', async (req, res) => {
  const { movieId } = req.params; // Получаем ID фильма из URL

  try {
    // Находим фильм по ID
    const movie = await Movie.findOne({
      where: { id: movieId },
    });

    if (!movie) {
      return res.status(404).send('Фильм не найден');
    }

    // Находим все сеансы для этого фильма
    const sessions = await MovieSession.findAll({
      where: { movie_id: movieId },
      include: [
        {
          model: Theater, // Включаем информацию о театре
          required: true,
        }
      ]
    });

    // Формируем ответ с информацией о фильме и сеансах
    const result = {
      movie: movie,
      sessions: sessions,
    };

    console.log('Информация о фильме и сеансах:', result);

    res.json(result); // Отправляем результат в формате JSON
  } catch (error) {
    console.error('Ошибка при получении фильма и сеансов:', error);
    res.status(500).send('Ошибка сервера');
  }
});

// Запуск сервера
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Сервер запущен на порту ${PORT}`);
});
