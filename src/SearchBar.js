function SearchBar({ searchQuery, setSearchQuery, minRating, setMinRating,sortBy ,setSortBy}) {
    return (
      <div style={{ marginBottom: "20px" }}>
        <input
          type="text"
          placeholder="Поиск по названию"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          style={{ padding: "10px", fontSize: "16px", borderRadius: "5px" }}
        />
        <label style={{ marginLeft: "10px" }}>
          Минимальный рейтинг:
          <input
            type="number"
            value={minRating}
            onChange={(e) => setMinRating(Number(e.target.value))}
            min="0"
            max="10"
            step="0.1"
            style={{ padding: "5px", fontSize: "16px", marginLeft: "10px" }}
          />
        </label>
        <div style={{ marginBottom: "20px" }}>
        <label>
          Сортировать по:
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            style={{ padding: "5px", fontSize: "16px", marginLeft: "10px" }}
          >
            <option value="popularity.desc">Популярности (по убыванию)</option>
            <option value="release_date.desc">Дате выпуска (по убыванию)</option>
            <option value="vote_average.desc">Рейтингу (по убыванию)</option>
          </select>
        </label>
      </div>


      </div>
    );
  }
  
  export default SearchBar;
  