import React, { useState } from 'react';
import { FiSearch } from 'react-icons/fi';

const EXAMPLE_PROMPTS = [
  'A laptop under ₹70,000 for coding with 16GB RAM and good battery life',
  'Lightweight laptop for college, budget ₹45,000',
  'Best laptop for video editing with a dedicated GPU',
  'Gaming laptop under ₹1,20,000 with RTX graphics',
];

/**
 * The natural-language AI search box. Used on the Home hero and the
 * dedicated AI Search page.
 */
const SearchBar = ({ onSearch, loading, initialValue = '', large = false }) => {
  const [value, setValue] = useState(initialValue);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!value.trim() || loading) return;
    onSearch(value.trim());
  };

  return (
    <div>
      <form className={`search-bar ${large ? 'search-bar-lg' : ''}`} onSubmit={handleSubmit}>
        <FiSearch className="search-bar-icon" />
        <input
          type="text"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder='Try: "A laptop under ₹70,000 for coding, 16GB RAM, good battery life"'
          aria-label="Describe what you're looking for"
        />
        <button type="submit" className="btn btn-primary" disabled={loading || !value.trim()}>
          {loading ? 'Searching…' : 'Find My Perfect Product'}
        </button>
      </form>

      <div className="search-examples">
        {EXAMPLE_PROMPTS.map((p) => (
          <button
            key={p}
            type="button"
            className="search-example-chip"
            onClick={() => {
              setValue(p);
              onSearch(p);
            }}
            disabled={loading}
          >
            {p}
          </button>
        ))}
      </div>
    </div>
  );
};

export default SearchBar;
