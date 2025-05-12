function SearchBar({ searchQuery, setSearchQuery, minRating, setMinRating, sortBy, setSortBy, onChange }) {
  return (
    <div style={{ marginBottom: "20px" }}>
      <input
        type="text"
        placeholder="Поиск по названию"
        value={searchQuery}
        onChange={(e) => {
          const value = e.target.value;
          setSearchQuery(value);

          if (onChange) {
            if (value === "") {
              onChange(false);
            } else {
              onChange(true);
            }
          }
        }}
        style={{
          backgroundColor: "white",
          border: "none",
          borderRadius: "8px",
          color: "black",
          marginTop: "10px",
          padding: "10px 14px",
          boxShadow: "0 1px 3px rgba(0, 0, 0, 0.1)",
          outline: "none",
          fontSize: "14px",
          width: "100%"
        }}
      />
    </div>
  );
}


export default SearchBar;
