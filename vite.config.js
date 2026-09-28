import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

const inlineCssPlugin = () => ({
  name: 'inline-critical-css',
  apply: 'build',
  transformIndexHtml: {
    order: 'post',
    handler(html, ctx) {
      const bundle = ctx.bundle || {};
      for (const chunk of Object.values(bundle)) {
        const name = Array.isArray(chunk.names) ? chunk.names[0] : chunk['fileName'];
        if (chunk.type === 'asset' && name && name.endsWith('.css')) {
          return html.replace(/<link rel="stylesheet"[^>]*>/, `<style>${chunk.source}</style>`);
        }
      }
      return html;
    }
  }
})

export default defineConfig({
  plugins: [react(), inlineCssPlugin()],
  build: {
    outDir: 'dist',
    chunkSizeWarningLimit: 600,
    rollupOptions: {
      input: {
        main: 'index.html',
        tonyCmsPortal: 'tony-cms-portal.html'
      },
      output: {
        manualChunks(id) {
          if (/node_modules[\\/](react|react-dom|scheduler)[\\/]/.test(id)) return 'vendor';
        },
        entryFileNames: 'assets/[name]-[hash].js',
        chunkFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash].[ext]'
      }
    }
  },
  server: { port: 5190, hmr: false }
})