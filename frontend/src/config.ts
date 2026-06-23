export const API_BASE =
  import.meta.env.VITE_API_BASE ||
  "https://smartserve-ai-restaurant-management.onrender.com/api";

console.log("VITE_API_BASE =", import.meta.env.VITE_API_BASE);
console.log("API_BASE is set to:", API_BASE);
