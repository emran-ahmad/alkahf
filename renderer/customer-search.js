import { allCustomers, renderCustomerList } from './customer-loader.js';

let currentSearchQuery = '';

// Calculate Levenshtein distance for fuzzy matching
function levenshteinDistance(str1, str2) {
  const len1 = str1.length;
  const len2 = str2.length;
  const matrix = [];

  for (let i = 0; i <= len1; i++) {
    matrix[i] = [i];
  }

  for (let j = 0; j <= len2; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= len1; i++) {
    for (let j = 1; j <= len2; j++) {
      const cost = str1[i - 1] === str2[j - 1] ? 0 : 1;
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1,
        matrix[i][j - 1] + 1,
        matrix[i - 1][j - 1] + cost
      );
    }
  }

  return matrix[len1][len2];
}

// Fuzzy match function
function fuzzyMatch(text, query) {
  text = text.toLowerCase();
  query = query.toLowerCase();
  
  // Remove spaces for comparison
  const textNoSpaces = text.replace(/\s+/g, '');
  const queryNoSpaces = query.replace(/\s+/g, '');
  
  // Exact match
  if (text.includes(query)) return { match: true, score: 100 };
  if (textNoSpaces.includes(queryNoSpaces)) return { match: true, score: 95 };
  
  // Check if query is substring with typos
  const distance = levenshteinDistance(queryNoSpaces, textNoSpaces);
  const maxLength = Math.max(queryNoSpaces.length, textNoSpaces.length);
  const similarity = 1 - (distance / maxLength);
  
  // Allow up to 2 character differences
  const threshold = query.length > 5 ? 0.75 : 0.80;
  
  if (similarity >= threshold) {
    return { match: true, score: similarity * 90 };
  }
  
  // Check if all query characters exist in text (different order)
  let matchCount = 0;
  for (const char of queryNoSpaces) {
    if (textNoSpaces.includes(char)) matchCount++;
  }
  
  if (matchCount / queryNoSpaces.length > 0.8) {
    return { match: true, score: 70 };
  }
  
  return { match: false, score: 0 };
}

// Highlight matching text in a string
function highlightText(text, query) {
  if (!query || !text) return text;
  
  const textLower = text.toLowerCase();
  const queryLower = query.toLowerCase();
  
  // Try exact match first
  const exactIndex = textLower.indexOf(queryLower);
  if (exactIndex !== -1) {
    const before = text.substring(0, exactIndex);
    const match = text.substring(exactIndex, exactIndex + query.length);
    const after = text.substring(exactIndex + query.length);
    return `${before}<span class="search-highlight">${match}</span>${after}`;
  }
  
  // Try without spaces
  const queryNoSpaces = queryLower.replace(/\s+/g, '');
  const textNoSpaces = textLower.replace(/\s+/g, '');
  const noSpaceIndex = textNoSpaces.indexOf(queryNoSpaces);
  
  if (noSpaceIndex !== -1) {
    // Find the corresponding position in original text with spaces
    let charCount = 0;
    let startPos = 0;
    let endPos = 0;
    
    for (let i = 0; i < text.length; i++) {
      if (text[i] !== ' ') {
        if (charCount === noSpaceIndex) startPos = i;
        if (charCount === noSpaceIndex + queryNoSpaces.length - 1) {
          endPos = i + 1;
          break;
        }
        charCount++;
      }
    }
    
    if (endPos > startPos) {
      const before = text.substring(0, startPos);
      const match = text.substring(startPos, endPos);
      const after = text.substring(endPos);
      return `${before}<span class="search-highlight">${match}</span>${after}`;
    }
  }
  
  // For fuzzy matches, try to highlight matching characters
  let result = '';
  let queryChars = queryNoSpaces.split('');
  let queryIndex = 0;
  
  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    const charLower = char.toLowerCase();
    
    if (queryIndex < queryChars.length && charLower === queryChars[queryIndex]) {
      result += `<span class="search-highlight">${char}</span>`;
      queryIndex++;
    } else {
      result += char;
    }
  }
  
  // Only return highlighted version if we matched most characters
  if (queryIndex >= queryChars.length * 0.7) {
    return result;
  }
  
  return text;
}

function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function applyFilters() {
  const query = document.getElementById("search").value.trim().toLowerCase();
  currentSearchQuery = query;
  
  // Show/hide clear button
  const clearBtn = document.getElementById('clearSearch');
  if (clearBtn) {
    clearBtn.style.display = query ? 'flex' : 'none';
  }
  
  // Filter by search query only
  if (!query) {
    renderCustomerList(allCustomers);
    return;
  }

  const exactIDMatches = [];
  const fuzzyMatches = [];

  allCustomers.forEach(c => {
    // Check exact ID match
    const idExact = Number(query) === Number(c.uniqueID);
    if (idExact) {
      exactIDMatches.push({ customer: c, score: 100 });
      return;
    }
    
    // Fuzzy match on name
    const nameResult = fuzzyMatch(c.name, query);
    
    // Fuzzy match on phone (allow missing digits)
    const phoneResult = c.phone.includes(query) ? { match: true, score: 90 } : { match: false, score: 0 };
    
    // ID partial match
    const idPartial = c.uniqueID.toString().includes(query);
    
    if (nameResult.match) {
      fuzzyMatches.push({ customer: c, score: nameResult.score });
    } else if (phoneResult.match) {
      fuzzyMatches.push({ customer: c, score: phoneResult.score });
    } else if (idPartial) {
      fuzzyMatches.push({ customer: c, score: 85 });
    }
  });

  // Sort fuzzy matches by score
  fuzzyMatches.sort((a, b) => b.score - a.score);
  
  const finalResults = [
    ...exactIDMatches.map(m => m.customer),
    ...fuzzyMatches.map(m => m.customer)
  ];
  
  // Render with highlighting
  renderCustomerListWithHighlight(finalResults, query);
}

// Enhanced render function with highlighting
function renderCustomerListWithHighlight(customers, query) {
  const list = document.getElementById('customerList');
  list.innerHTML = '';
  
  if (customers.length === 0) {
    list.innerHTML = '<p>No customers found.</p>';
    return;
  }

  customers.forEach(c => {
    const div = document.createElement('div');
    div.classList.add('customer-item');
    div.dataset.id = c.uniqueID;

    const badge = document.createElement('span');
    badge.classList.add('customer-badge');
    badge.innerHTML = query ? highlightText(c.uniqueID.toString(), query) : c.uniqueID;

    const details = document.createElement('span');
    const highlightedName = query ? highlightText(c.name, query) : c.name;
    const highlightedPhone = query ? highlightText(c.phone, query) : c.phone;
    details.innerHTML = `${highlightedName} (${highlightedPhone})`;

    div.appendChild(badge);
    div.appendChild(details);

    div.addEventListener('click', () => {
      window.location.href = `./screens/customer-details.html?id=${c.uniqueID}`;
    });

    list.appendChild(div);
  });
}

// Initialize event listeners when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  // Search input handler
  const searchInput = document.getElementById("search");
  if (searchInput) {
    searchInput.addEventListener("input", applyFilters);
  }

  // Clear search button
  const clearBtn = document.getElementById('clearSearch');
  if (clearBtn) {
    clearBtn.addEventListener('click', () => {
      if (searchInput) {
        searchInput.value = '';
        searchInput.focus();
      }
      clearBtn.style.display = 'none';
      applyFilters();
    });
  }

});
