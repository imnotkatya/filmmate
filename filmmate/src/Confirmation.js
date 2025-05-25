import React from 'react';
import { useNavigate, useParams } from "react-router-dom";
function Confirmation() {
  const navigate = useNavigate();
  return (
    <div className="confirmation-container">
      <h1>Спасибо за покупку!</h1>
      <p>Ваши билеты успешно куплены. Мы отправили их на ваш email.</p>
      <button onClick={() => navigate("/")}>на главную</button>
    </div>
  );
}

export default Confirmation;
