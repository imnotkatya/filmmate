import { useState } from "react";
import { useStripe, useElements, CardElement } from "@stripe/react-stripe-js";
import { useNavigate, useLocation } from "react-router-dom";

const API_KEY = "60e0c7335b9b55e2cead9ef258b571ae";
const BASE_URL = "https://api.themoviedb.org/3";

function Buying() {
  const stripe = useStripe();
  const elements = useElements();
  const location = useLocation();
  const navigate = useNavigate();

  const { purchaseData } = location.state || {};
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!stripe || !elements) return;

    setIsProcessing(true);
    const amountInCents = purchaseData.price * 100;

    try {
      const response = await fetch("http://localhost:5000/api/create-payment-intent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: amountInCents }),
      });

      const { clientSecret } = await response.json();

      const { error, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
        payment_method: { card: elements.getElement(CardElement) },
      });

      if (error) {
        setError(error.message);
      } else if (paymentIntent.status === "succeeded") {
        alert("Платеж успешно завершен!");

        try {
          const movieRes = await fetch(
            `${BASE_URL}/movie/${purchaseData.movieId}?api_key=${API_KEY}&language=ru`
          );
          const movieDetails = await movieRes.json();

          await fetch("http://localhost:5000/api/update-ticket-status", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ seats: purchaseData.seat_numbers }),
          });
console.log(purchaseData);
          const saveRes = await fetch("http://localhost:5000/api/purchase", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(purchaseData),
          });

          // if (saveRes.ok) {
            await fetch("http://localhost:5000/api/send-email", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                email: purchaseData.email,
                subject: "Подтверждение покупки билета",
                text: `Спасибо за покупку!\n\nВы приобрели билет(ы) на фильм "${movieDetails.title}" (${movieDetails.release_date}).\nОписание: ${movieDetails.overview}\n\nДата: ${purchaseData.date}\nВремя: ${purchaseData.start}\nМеста: ${purchaseData.seat_numbers}\nОбщая сумма: ${purchaseData.price} руб.`,
              }),
            });

            navigate("/confirmation");
          // } else {
          //   alert("Произошла ошибка при покупке. Попробуйте снова.");
          // }
        } catch (err) {
          console.error("Ошибка при оформлении покупки:", err.message);
          alert("Произошла ошибка. Попробуйте снова.");
        }
      }
    } catch (err) {
      setError("Произошла ошибка при обработке платежа.");
    }

    setIsProcessing(false);
  };

  return (
    <div style={styles.container}>
      <h2 style={styles.title}>Оплата</h2>
      <p style={styles.price}>Общая сумма: {purchaseData.price} руб.</p>

      <form onSubmit={handleSubmit} style={styles.form}>
        <div style={styles.cardElementContainer}>
          <CardElement style={styles.cardElementStyle} />
        </div>
        <button
          type="submit"
          style={{
            ...styles.button,
            ...(isProcessing || !stripe ? styles.buttonDisabled : {}),
          }}
          disabled={isProcessing || !stripe}
        >
          {isProcessing ? "Обработка..." : "Оплатить"}
        </button>
      </form>

      {error && <div style={styles.error}>{error}</div>}
    </div>
  );
}

const styles = {
  container: {
    maxWidth: "500px",
    margin: "50px auto",
    padding: "30px",
    // dark purple card
    borderRadius: "12px",
    boxShadow: "0 8px 20px rgba(0, 0, 0, 0.3)",
    fontFamily: "Arial, sans-serif",
    textAlign: "center",
    color: "#f5f5f5", // light text
  },
  title: {
    fontSize: "28px",
    marginBottom: "20px",
    color: "#ffffff",
  },
  price: {
    fontSize: "20px",
    fontWeight: "bold",
    marginBottom: "20px",
    color: "#ffd700", // golden color for the price
  },
  form: {
    display: "flex",
    flexDirection: "column",
    gap: "20px",
    
  },
  cardElementContainer: {
    padding: "12px",
    border: "1px solid #555",
    borderRadius: "6px",
   
  },
  cardElementStyle: {
    base: {
      backgroundColor: "white",
      fontSize: "16px",
      color: "#ffffff", // white text for card inputs
      "::placeholder": {
        color: "#aaa", // light placeholder text
      },
    },
    invalid: {
      color: "#ff6b6b", // red for invalid input
    },
  },
  button: {
    backgroundColor: "#ff9800", // bright accent color
    color: "#fff",
    padding: "14px",
    fontSize: "16px",
    border: "none",
    borderRadius: "8px",
    cursor: "pointer",
    transition: "background-color 0.3s ease, transform 0.2s ease",
  },
  buttonDisabled: {
    backgroundColor: "#666",
    cursor: "not-allowed",
  },
  error: {
    marginTop: "20px",
    color: "#ff6b6b",
    fontWeight: "bold",
  },
};



export default Buying;