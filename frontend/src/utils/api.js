// Dirección base de la API.
// En desarrollo es "/api" y Vite la redirige al backend (proxy en vite.config.js).
// Para publicar, definir VITE_API_URL al compilar, por ejemplo: VITE_API_URL=https://api.misitio.cl/api
export const API_URL = import.meta.env.VITE_API_URL || '/api'
