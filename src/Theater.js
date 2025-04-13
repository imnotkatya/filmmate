import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";

function Theater()
{
    const [theaters, setTheaters] = useState([]);
useEffect(()=>
{
    async function fetchTheaters() {
        try {
          const response = await fetch("http://localhost:5000/api/theaters");
          const data = await response.json();
          console.log(data.theaters);
          setTheaters(data.theaters);
        } catch (error) {
          console.error("Ошибка:", error);
        }
      }
      
      fetchTheaters();
      

})






    return(
    <>
   <h1>Кинотеатры</h1>
<table>
  <thead>
    <tr>
    <th>ID</th>
      <th>Название</th>
      <th>Локация</th>
    </tr>
  </thead>
  <tbody>
    {theaters.map((theater) => (
      <tr key={theater.id}>
          <td>{theater.theater_id}</td>
        <td>{theater.name}</td>
        <td>{theater.location}</td>
      </tr>
    ))}
  </tbody>
</table>

    </>
    )

}
export default Theater;