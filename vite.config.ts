import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [
    react(),
    {
      name: 'api-dev-middleware',
      configureServer(server) {
        server.middlewares.use(async (req, res, next) => {
          if (req.url?.startsWith('/api/products')) {
            try {
              const { getAllProductsData } = await server.ssrLoadModule('/netlify/functions/shared/collector.ts');
              const data = await getAllProductsData();
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify(data));
            } catch (err: any) {
              res.statusCode = 500;
              res.end(JSON.stringify({ error: err.message }));
            }
            return;
          }

          if (req.url?.startsWith('/api/refresh')) {
            try {
              const {
                runCollection,
                addWatchlistUrl,
                importManualProducts,
                getAllProductsData,
                ingestScrapedProducts
              } = await server.ssrLoadModule('/netlify/functions/shared/collector.ts');

              let body = '';
              req.on('data', chunk => { body += chunk; });
              req.on('end', async () => {
                try {
                  const parsed = body ? JSON.parse(body) : {};

                  // 1. External webhook ingest
                  if ((parsed.retailer && Array.isArray(parsed.products)) || parsed.action === 'webhook_ingest') {
                    const retailer = parsed.retailer === 'Costco' ? 'Costco' : 'CVS';
                    const status = await ingestScrapedProducts(retailer, parsed.products, parsed.status);
                    res.setHeader('Content-Type', 'application/json');
                    res.end(JSON.stringify({ success: true, retailer, count: parsed.products ? parsed.products.length : 0, status }));
                    return;
                  }

                  // 2. Watchlist addition
                  if (parsed.action === 'add_watchlist' && parsed.url) {
                    const list = await addWatchlistUrl(parsed.url);
                    res.setHeader('Content-Type', 'application/json');
                    res.end(JSON.stringify({ success: true, watchlist: list }));
                    return;
                  }

                  // 3. Manual import / bookmarklet
                  if (parsed.action === 'import_products' && Array.isArray(parsed.products)) {
                    await importManualProducts(parsed.products);
                    const allData = await getAllProductsData();
                    res.setHeader('Content-Type', 'application/json');
                    res.end(JSON.stringify({ success: true, data: allData }));
                    return;
                  }

                  // 4. Default collection
                  const retailer = parsed.retailer === 'CVS' || parsed.retailer === 'Costco' ? parsed.retailer : 'all';
                  const status = await runCollection({ retailer });
                  res.setHeader('Content-Type', 'application/json');
                  res.end(JSON.stringify({ success: true, status }));
                } catch (e: any) {
                  res.statusCode = 500;
                  res.end(JSON.stringify({ error: e.message }));
                }
              });
            } catch (err: any) {
              res.statusCode = 500;
              res.end(JSON.stringify({ error: err.message }));
            }
            return;
          }

          next();
        });
      }
    }
  ],
  server: {
    port: 5173,
    host: true
  },
  build: {
    chunkSizeWarningLimit: 1200,
    rollupOptions: {
      output: {
        manualChunks: {
          'ag-grid': ['ag-grid-community', 'ag-grid-react'],
          'recharts': ['recharts'],
          'react-vendor': ['react', 'react-dom']
        }
      }
    }
  }
});
