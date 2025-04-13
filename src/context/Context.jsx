import React, { createContext, useState, useEffect } from "react";
import run from "../config/gemini";

export const Context = createContext();

const ContextProvider = (props) => {
  const [input, setInput] = useState("");
  const [recentPrompt, setRecentPrompt] = useState("");
  const [prevPrompt, setPrevPrompt] = useState([]);
  const [showResult, setShowResult] = useState(false);
  const [loading, setLoading] = useState(false);
  const [resultData, setResultData] = useState("");
  const [messages, setMessages] = useState([]);

  // Загружаем сообщения из localStorage при старте
  useEffect(() => {
    const savedMessages = localStorage.getItem("chatMessages");
    if (savedMessages) {
      setMessages(JSON.parse(savedMessages));
    } else {
      setMessages([{ sender: "AI", text: "Привет! Чем могу помочь?" }]);
    }
  }, []);

  // Сохраняем в localStorage
  useEffect(() => {
    localStorage.setItem("chatMessages", JSON.stringify(messages));
  }, [messages]);

  const onSent = async () => {
    if (!input.trim()) return;
 if (!input.trim()) return;

  if (!isMovieOrSeriesRelated(input)) {
    setMessages(prev => [...prev, { sender: "user", text: input }]);
    setMessages(prev => [...prev, { sender: "AI", text: "Извините, я могу отвечать только на вопросы, связанные с фильмами и сериалами." }]);
    setInput("");
    return;
  }
    const newUserMessage = { sender: "user", text: input };
    const updatedMessages = [...messages, newUserMessage];
    setMessages(updatedMessages);

    // Обновления UI
    setResultData("");
    setLoading(true);
    setShowResult(true);
    setRecentPrompt(input);
    setInput("");

    // Формируем весь контекст чата
    const fullPrompt = updatedMessages
      .map((msg) => `${msg.sender === "user" ? "Пользователь" : "ИИ"}: ${msg.text.replace(/<[^>]+>/g, '')}`)
      .join("\n");

    const response = await run(fullPrompt);
    if (!response) {
      setLoading(false);
      return;
    }

    // Обработка **жирного** и *переносов*
    let responseArray = response.split("**");
    let newArray = "";
    for (let i = 0; i < responseArray.length; i++) {
      if (i === 0 || i % 2 === 1) {
        newArray += responseArray[i];
      } else {
        newArray += "<b>" + responseArray[i] + "</b>";
      }
    }
    let formattedResponse = newArray.split("*").join("<br/>");

    setResultData(formattedResponse);
    setLoading(false);

    const newBotMessage = { sender: "AI", text: formattedResponse };
    setMessages((prev) => [...prev, newBotMessage]);
  };

  const contextValue = {
    prevPrompt,
    setPrevPrompt,
    onSent,
    setRecentPrompt,
    recentPrompt,
    showResult,
    loading,
    resultData,
    input,
    setInput,
    setResultData,
    messages,
    setMessages
  };
  const isMovieOrSeriesRelated = (text) => {
    const keywords = [
      "фильм", "сериал", "кино", "режиссёр", "актер", "актриса", "жанр", 
      "смотреть", "кинопоиск", "IMDB", "триллер", "комедия", "драма", 
      "ужасы", "рейтинг", "премьера", "сезон", "серия", "эпизод", "платформа",
      "Netflix", "HBO", "Amazon Prime", "Disney+", "мультфильм", "аниме"
    ];
  
    const lowerText = text.toLowerCase();
    return keywords.some(keyword => lowerText.includes(keyword));
  };
  
  return (
    <Context.Provider value={contextValue}>
      {props.children}
    </Context.Provider>
  );
};

export default ContextProvider;
