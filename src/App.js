import React from "react";
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import MovieList from "./MovieList";
import MovieDetails from "./MovieDetails";
import BuyTickets from "./BuyTickets";
import Main from "./Main";
import Aut from "./Aut";
import Profile from "./Profile";
import ContextProvider from "./context/Context";
import StripeContainer from "./StripeContainer";
import { Elements } from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";
import Confirmation from "./Confirmation";
import Theater from "./Theater";
import Sessions from "./Sessions";

const stripePromise = loadStripe('pk_test_51RCNozFtMlrzCs5YgGGFMwytUq3aVxmCuHNmRIG617w2NZSqX3mKjpkIyYXHvJxVm6Gem9d1mlrSU46L4QglcF1200egqLoHqO'); // Замените на ваш публичный ключ

function App() {
  return (
    <ContextProvider>
      <Router>
        <Routes>
          
          <Route path="/" element={<><MovieList /><Main /></>} />
          <Route path="/movie/:id" element={<MovieDetails />} />
          <Route path="/theater" element={<Theater />} />
          <Route path="/sessions" element={<Sessions />} />
          <Route path="/buy-tickets/:movieId" element={<><BuyTickets /></>} />
          <Route path="/aut" element={<Aut />} />
          
          {/* Оборачиваем Stripe-компонент в Elements */}
          <Route path="/buy-tickets/stripe/:movieId" element={
            <Elements stripe={stripePromise}>
              <StripeContainer />
            </Elements>
          } />
           <Route path="/confirmation" element={<Confirmation />} />
          <Route path="/profile/:userId" element={<Profile />} />
        </Routes>
      </Router>
    </ContextProvider>
  );
}

export default App;
