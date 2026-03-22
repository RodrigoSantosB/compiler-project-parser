/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        bg: "#09090b",
        surface: "#111827",
        card: "#1f2937",
        primary: "#8b5cf6",
        success: "#22c55e",
        danger: "#ef4444",
        terminal: "#0ea5e9",
        nonterminal: "#f59e0b"
      }
    }
  },
  plugins: []
};
