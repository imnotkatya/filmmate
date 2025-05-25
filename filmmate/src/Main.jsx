import React, { useContext, useEffect, useState } from 'react';
import './Main.css';
import { assets } from './assets/assets';
import { Context } from './context/Context';
import { useNavigate } from 'react-router-dom';

// API данные
const API_KEY = '60e0c7335b9b55e2cead9ef258b571ae';
const BASE_URL = 'https://api.themoviedb.org/3';
const IMAGE_BASE_URL = 'https://image.tmdb.org/t/p/w500';

// Функция для поиска фильма по названию через API TMDb
const findMovieIdByTitle = async (title) => {
  try {
    const response = await fetch(`${BASE_URL}/search/movie?api_key=${API_KEY}&query=${encodeURIComponent(title)}`);
    const data = await response.json();
    if (data.results && data.results.length > 0) {
      return data.results[0].id;
    }
    return null;
  } catch (error) {
    console.error('Error fetching movie data:', error);
    return null;
  }
};

const Main = () => {
  const {
    onSent,
    recentPrompt,
    showResult,
    loading,
    resultData,
    input,
    setInput,
    messages,
    setMessages
  } = useContext(Context);

  const [linkedResultData, setLinkedResultData] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const processResultData = async () => {
      if (resultData) {
        const updatedResult = await Promise.all(
          resultData.split('"').map(async (part, index) => {
            if (index % 2 === 1) {
              const movieId = await findMovieIdByTitle(part);
              if (movieId) {
                return `<a href="/movie/${movieId}">${part}</a>`;
              }
            }
            return part;
          })
        );
        setLinkedResultData(updatedResult.join(''));
      }
    };

    processResultData();
  }, [resultData]);

  return (
    <div className="main">
      <div className="main-container">
  

        {showResult ? (
          <div className="result">
            <div className="result-title">
              <img src={assets.user_icon} alt="User Icon" />
              <p>{recentPrompt}</p>
            </div>
            <div className="result-data">
              {loading ? (
                <div className="loader">
                  <hr />
                  <hr />
                  <hr />
                </div>
              ) : (
                <>
                  <img src={assets.gemini_icon} 
                  alt="Gemini Icon" />
                  <p dangerouslySetInnerHTML={{ __html: linkedResultData }}></p>
                </>
              )}
            </div>
          </div>
        ) : null}

        <div className="main-bottom">
          <div className="search-box">
          <input
  type="text"
  onChange={(e) => setInput(e.target.value)}
  value={input}
  style={{color:"black"}} 
  placeholder="Enter a prompt here"
  onKeyDown={(e) => {
    if (e.key === "Enter") {
      onSent();
    }
  }}
/>

            <div>
              <img onClick={onSent} style={{backgroundColor:"whitesmoke"}} src={assets.send_icon} alt="Send Icon" />
            </div>
          </div>
          <p className="info">answer might not be accurate</p>
        </div>
      </div>
    </div>
  );
};

export default Main;
