// City Ribbon Module: Renders the horizontal strip of saved city preview chips.
// Uses safe DOM APIs instead of innerHTML to prevent XSS.

import { getIconForCondition } from './icons.js';

/**
 * Renders the horizontal ribbon of saved cities.
 * @param {Array} citiesData - Array of { city, state }
 * @param {number} activeIndex
 * @param {Function} onCityClick
 * @param {Function} onCityRemove
 */
export const renderCityPreviews = (citiesData, activeIndex, onCityClick, onCityRemove) => {
    const savedCitiesList = document.getElementById('saved-cities-list');

    // Clear old content
    savedCitiesList.innerHTML = '';

    citiesData.forEach((data, index) => {
        const chip = document.createElement('div');
        chip.className = `city-preview${index === activeIndex ? ' active' : ''}`;
        chip.dataset.index = index;

        // Icon container
        const iconWrap = document.createElement('div');
        iconWrap.style.cssText = 'width: 24px; height: 24px;';
        if (data.state) {
            iconWrap.innerHTML = getIconForCondition(data.state.rawCondition); // SVG is internal, safe
        }
        chip.appendChild(iconWrap);

        // Temperature
        const tempSpan = document.createElement('span');
        tempSpan.className = 'city-preview-temp';
        tempSpan.textContent = data.state && data.state.temperature !== null
            ? `${Math.round(data.state.temperature)}°`
            : '--°';
        chip.appendChild(tempSpan);

        // City name (sanitized via textContent)
        const nameSpan = document.createElement('span');
        nameSpan.textContent = data.city.name;
        chip.appendChild(nameSpan);

        // Remove button
        const removeBtn = document.createElement('div');
        removeBtn.className = 'city-preview-remove';
        removeBtn.dataset.index = index;
        removeBtn.title = 'Remove city';
        removeBtn.textContent = '×';
        removeBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            onCityRemove(index);
        });
        chip.appendChild(removeBtn);

        // Click to switch city
        chip.addEventListener('click', () => {
            if (index !== activeIndex) onCityClick(index);
        });

        savedCitiesList.appendChild(chip);
    });
};
