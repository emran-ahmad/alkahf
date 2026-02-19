import { loadCustomers } from './customer-loader.js';
import './customer-search.js';
import './backup.js';
import './navigation.js';

// Load customers on app start
document.addEventListener('DOMContentLoaded', () => {
  loadCustomers();
});

// Enable arrow key scroll navigation for the customer list
document.addEventListener("keydown", (e) => {
  const activeElement = document.activeElement;

  // Don’t scroll while typing in search input
  if (activeElement && activeElement.tagName === "INPUT") return;

  const list = document.getElementById("customerList");
  if (!list) return;

  const scrollStep = 100; // pixels to scroll per key press

  switch (e.key) {
    case "ArrowUp":
      e.preventDefault();
      list.scrollBy({ top: -scrollStep, behavior: "smooth" });
      break;
    case "ArrowDown":
      e.preventDefault();
      list.scrollBy({ top: scrollStep, behavior: "smooth" });
      break;
  }
});
