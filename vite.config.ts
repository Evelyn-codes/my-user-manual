import { defineConfig } from 'vite';
// Relative assets work at a domain root or inside a static-hosting subdirectory.
export default defineConfig({base:'./',build:{target:'es2020'}});
