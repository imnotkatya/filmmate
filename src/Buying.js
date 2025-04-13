import { useState } from "react";
import { useStripe, useElements, CardElement } from "@stripe/react-stripe-js";
import { useNavigate, useLocation } from "react-router-dom";

function Buying() {
  const stripe = useStripe();
  const elements = useElements();
  const location = useLocation();

  const navigate = useNavigate();
const {purchaseData}=location.state||{};
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!stripe || !elements) {
      return; // Страйп или элементы еще не загружены
    }
console.log(purchaseData);
    setIsProcessing(true);

    const amountInCents = purchaseData.price * 100; // Переводим в копейки

    try {
      // 1. Запрос на создание payment intent
      const response = await fetch("http://localhost:5000/api/create-payment-intent", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ amount: amountInCents }),
      });

      const { clientSecret } = await response.json(); // Получаем clientSecret от сервера

      // 2. Завершаем оплату с использованием clientSecret
      const { error, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
        payment_method: {
          card: elements.getElement(CardElement),
        },
      });

      if (error) {
        setError(error.message);
      } else if (paymentIntent.status === "succeeded") {
        alert("Платеж успешно завершен!");
        setSuccess(true); // Устанавливаем флаг успеха

        try {
            // Обновление статуса мест в таблице билетов
            await fetch('http://localhost:5000/api/update-ticket-status', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                seats: purchaseData.seat_number, // Передаем все выбранные билеты
              }),
            });
      
            // Сохранение купленных билетов в таблицу
            const response = await fetch('http://localhost:5000/api/purchase', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify(purchaseData),
            });
      
            if (response.ok) {
              alert('Покупка прошла успешно!');
              navigate("/confirmation"); 
             // Перенаправление на страницу подтверждения
            } else {
              alert('Произошла ошибка при покупке. Попробуйте снова.');
            }
          } catch (error) {
            console.error('Ошибка при оформлении покупки:', error.message);
            alert('Произошла ошибка. Попробуйте снова.');
          }
       // Перенаправляем на страницу подтверждения
      }
    } catch (err) {
      setError("Произошла ошибка при обработке платежа.");
    }
    await fetch('http://localhost:5000/api/send-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: purchaseData.email, // обязательно должно быть в объекте purchaseData
          subject: 'Подтверждение покупки билета',
          text: `Спасибо за покупку!
          
      Вы приобрели билет(ы) на фильм "${purchaseData.movieTitle}" на ${purchaseData.date} в ${purchaseData.time}.
      Места: ${purchaseData.seat_number}.
      Цена: ${purchaseData.price} руб.`,
        }),
      });
      
    setIsProcessing(false);
  };

  

  return (
    <div className="buying-container">
      <h2>Оплата</h2>
      <p>Общая сумма: {purchaseData.price} руб.</p>

      <form onSubmit={handleSubmit}>
        <CardElement />
        <button type="submit" disabled={isProcessing || !stripe}>
          {isProcessing ? "Обработка..." : "Оплатить"}
        </button>
      </form>

      {error && <div className="error">{error}</div>}
    </div>
  );
}

export default Buying;
