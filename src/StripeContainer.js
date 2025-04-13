import React from "react";
import { Elements } from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";

import Buying from "./Buying";
const PUBLIC_KEY = "pk_test_51RCNozFtMlrzCs5YgGGFMwytUq3aVxmCuHNmRIG617w2NZSqX3mKjpkIyYXHvJxVm6Gem9d1mlrSU46L4QglcF1200egqLoHqO"; // вставь свой тестовый ключ
const stripePromise = loadStripe(PUBLIC_KEY);

export default function StripeContainer() {
    return (
      <Elements stripe={stripePromise}>
        <Buying />
      </Elements>
    );
  }
  