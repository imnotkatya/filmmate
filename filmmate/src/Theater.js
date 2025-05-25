import { useEffect, useState } from "react";
import "/Users/ekaterina/Desktop/filmmate/filmmate/src/Theater.css";

function Theater() {
  const [name, setName] = useState("");
  const [theater_id, setTheaterId] = useState("");
  const [location, setLocation] = useState("");
  const [theaters, setTheaters] = useState([]);
  const [new_location, setNewLocation] = useState("");
  const [new_name, setNewName] = useState("");

  // 🔁 Общая функция для загрузки всех театров
  const fetchTheaters = async () => {
    try {
      const response = await fetch("http://localhost:5000/api/theaters");
      const data = await response.json();
      setTheaters(data.theaters);
    } catch (error) {
      console.error("Ошибка:", error);
    }
  };

  // Загружаем при первом рендере
  useEffect(() => {
    fetchTheaters();
  }, []);

  const handleFillInputs = (theater) => {
    setName(theater.name);
    setLocation(theater.location);
    setTheaterId(theater.theater_id);
  };

  const handleSaveChange = async () => {
    const dataToSave = {
      name,
      location,
    };

    try {
      const response = await fetch(`http://localhost:5000/api/theaters/${parseInt(theater_id)}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(dataToSave),
      });

      if (response.ok) {
        await fetchTheaters(); // 🔁 обновляем список
        alert("Данные успешно обновлены!");
      } else {
        alert("Ошибка при сохранении данных.");
      }
    } catch (error) {
      console.error("Ошибка при сохранении:", error);
      alert("Ошибка при сохранении данных.");
    }
  };

  const handleDelete = async () => {
    try {
      const response = await fetch(
        `http://localhost:5000/api/theaters/delete_theater/${parseInt(theater_id)}`,
        {
          method: "DELETE",
        }
      );
      if (response.ok) {
        await fetchTheaters(); // 🔁 обновляем список
        setName("");
        setLocation("");
        setTheaterId("");
        alert("Кинотеатр удален!");
      }
    } catch (error) {
      console.error("Ошибка при удалении:", error);
      alert("Ошибка при удалении кинотеатра.");
    }
  };

  const handleCinemaAdd = async () => {
    if (!new_name || !new_location) {
      alert("Название и место не должны быть пустыми.");
      return;
    }

    const theater_data = { name: new_name, location: new_location };

    try {
      const response = await fetch("http://localhost:5000/api/add_theater", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(theater_data),
      });

      if (!response.ok) {
        throw new Error(`Ошибка: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      alert(`Кинотеатр "${data.name}" успешно добавлен!`);
      await fetchTheaters(); // 🔁 обновляем список
      setNewName("");
      setNewLocation("");
    } catch (error) {
      console.error("Ошибка при добавлении кинотеатра:", error);
      alert("Произошла ошибка при добавлении кинотеатра.");
    }
  };

  return (
    <>
      <h1>Кинотеатры</h1>
      <table>
        <thead>
          <tr>
            <th>Название</th>
            <th>Локация</th>
          </tr>
        </thead>
        <tbody>
          {theaters.map((theater) => (
            <tr key={theater.theater_id} onClick={() => handleFillInputs(theater)}>
              <td>{theater.name}</td>
              <td>{theater.location}</td>
            </tr>
          ))}
        </tbody>
      </table>
<div className="crud">

<div className="one">
      <h1>Изменение / Удаление</h1>
      <h2>Название</h2>
      <input value={name || ""} onChange={(e) => setName(e.target.value)} />
      <h2>Локация</h2>
      <input value={location || ""} onChange={(e) => setLocation(e.target.value)} />
      <br />
      <button onClick={handleSaveChange}>Сохранить изменения</button>
      <button onClick={handleDelete}>Удалить</button>
      </div>
      <div className="two">
      <h1>Добавить кинотеатр</h1>
      <h2>Название</h2>
      <input value={new_name || ""} onChange={(e) => setNewName(e.target.value)} />
      <h2>Локация</h2>
      <input value={new_location || ""} onChange={(e) => setNewLocation(e.target.value)} />
      <br />
      <button onClick={handleCinemaAdd}>Добавить</button>
      </div>


      </div>
    </>
  );
}

export default Theater;
