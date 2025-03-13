import React from "react";
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import MovieList from "./MovieList";
import MovieDetails from "./MovieDetails";
import BuyTickets from "./BuyTickets";
function App() {
  return (
    <Router>
      <Routes>
        <Route path="/movie/:id" element={<MovieDetails />} /> {/* Страница с деталями фильма */}
        <Route path="/" element={<MovieList />} /> {/* Главная страница с фильмами */}
        <Route path="/buy-tickets/:movieId" element={<BuyTickets />} />
      </Routes>
    </Router>
  );
}

export default App;
