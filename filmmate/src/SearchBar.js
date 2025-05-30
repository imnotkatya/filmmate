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
          padding: "12px 15px",
          width: "100%",
          maxWidth: "700px",
          margin: "8px 0",
          border: "2px solid #3d3d3d",
          borderRadius: "8px",
          fontSize: "16px",
          transition: "all 0.3s ease",
          backgroundColor: "white",
  color:"black"

        }}
      />
    </div>
  );
}


export default SearchBar;
