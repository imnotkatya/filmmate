import { Link } from "react-router-dom";
import { GoogleGenerativeAI } from "@google/generative-ai";

const API_KEY = "60e0c7335b9b55e2cead9ef258b571ae";
const BASE_URL = "https://api.themoviedb.org/3";
const IMAGE_BASE_URL = "https://image.tmdb.org/t/p/w500";

// Создаем экземпляр GoogleGenerativeAI
const genAI = new GoogleGenerativeAI("AIzaSyCxgxJWVtHxMduLwDy_FORA8-dr9r8a6Z0");
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

const generationConfig = {
  temperature: 0.7,
  topP: 0.95,
  topK: 40,
  maxOutputTokens: 512,
  responseMimeType: "text/plain",
};

async function fetchMovieData(movieTitle) {
  const url = `${BASE_URL}/search/movie?api_key=${API_KEY}&query=${encodeURIComponent(movieTitle)}`;
  try {
    const response = await fetch(url);
    const data = await response.json();
    if (data.results.length > 0) {
      const movie = data.results[0];
      return {
        title: movie.title,
        id: movie.id,
        image: movie.poster_path ? `${IMAGE_BASE_URL}${movie.poster_path}` : null,
      };
    }
  } catch (error) {
    console.error("Ошибка загрузки фильма:", error);
  }
  return null;
}

async function run(prompt) {
  const chatSession = model.startChat({ generationConfig, history: [] });
  const result = await chatSession.sendMessage(prompt);
  let responseText = await result.response.text();

  console.log("Исходный ответ:", responseText);

  // Ищем названия фильмов в кавычках "..."
  const movieTitles = responseText.match(/"([^"]+)"/g)?.map((m) => m.replace(/"/g, "")) || [];

  console.log("Найденные фильмы:", movieTitles);

  // Заменяем названия фильмов на ссылки
  for (const title of movieTitles) {
    const movieData = await fetchMovieData(title);
    if (movieData) {
      console.log(`Заменяем "${title}" на ссылку: /movie/${movieData.id}`);
      responseText = responseText.replace(
        `"${title}"`,
        `<Link to="/movie/${movieData.id}">${title}</Link>`
      );
    }
  }

  console.log("Обработанный ответ:", responseText);

  // Возвращаем отредактированный текст с ссылками
  return responseText;
}

export default run;
