import { useEffect, useState } from "react";
import run from "./run";

function AIResponseComponent() {
  const [response, setResponse] = useState([]);

  useEffect(() => {
    async function fetchAIResponse() {
      const result = await run("Посоветуй фильмы про приключения");
      setResponse(result); // result — это массив React-компонентов (ссылки)
    }
    fetchAIResponse();
  }, []);

  return (
    <div className="p-4">
      <h2 className="text-lg font-bold">Рекомендации:</h2>
      <div className="space-y-2">
        {response.length > 0 ? (
          response.map((link, index) => <div key={index}>{link}</div>)
        ) : (
          <p>Загрузка...</p>
        )}
      </div>
    </div>
  );
}

export default AIResponseComponent;
