// Search UI Module: Handles search input binding, dropdown rendering, and click-outside dismissal.

/**
 * Renders the dropdown list of geographical search results.
 * Uses safe DOM APIs instead of innerHTML to prevent XSS.
 */
export const renderSearchResults = (results, onSelect) => {
    const searchResults = document.getElementById('search-results');
    const searchInput = document.getElementById('city-search');

    if (!results || results.length === 0) {
        searchResults.innerHTML = '';
        searchResults.classList.add('hidden');
        return;
    }

    // Clear old results safely
    searchResults.innerHTML = '';

    results.forEach((res, index) => {
        const item = document.createElement('div');
        item.className = 'search-result-item';
        item.dataset.index = index;

        const label = document.createElement('span');
        const strong = document.createElement('strong');
        strong.textContent = res.name;
        label.appendChild(strong);

        const suffix = (res.state ? `, ${res.state}` : '') + `, ${res.country}`;
        label.appendChild(document.createTextNode(suffix));

        item.appendChild(label);

        item.addEventListener('click', () => {
            searchInput.value = '';
            searchResults.classList.add('hidden');
            onSelect({ lat: res.lat, lon: res.lon, name: res.name, country: res.country });
        });

        searchResults.appendChild(item);
    });

    searchResults.classList.remove('hidden');
};

/**
 * Binds the main search input so main.js can perform debounced API calls.
 */
export const bindSearchInput = (onInput) => {
    const searchInput = document.getElementById('city-search');
    const searchResults = document.getElementById('search-results');

    searchInput.addEventListener('input', (e) => {
        onInput(e.target.value);
    });

    // Hide results if clicking outside
    document.addEventListener('click', (e) => {
        if (!searchInput.contains(e.target) && !searchResults.contains(e.target)) {
            searchResults.classList.add('hidden');
        }
    });
};
