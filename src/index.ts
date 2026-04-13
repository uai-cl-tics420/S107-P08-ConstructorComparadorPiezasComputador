import '@/lib/config'; // Validates env variables on app start
import { serve } from 'bun';
import { auth } from '@/lib/db/auth';
import { components, brands, componentTypes } from './data/mock';
import index from './index.html';

const server = serve({
  routes: {
    // BetterAuth routes
    '/api/auth/*': auth.handler,

    // Serve index.html for all unmatched routes.
    '/*': index,

    // GET /api/components?search=&type_id=&brand_id=
    '/api/components': {
      async GET(req) {
        const url = new URL(req.url);
        const search = url.searchParams.get('search')?.toLowerCase() ?? '';
        const typeId = url.searchParams.get('type_id');
        const brandId = url.searchParams.get('brand_id');

        let result = components;

        if (search) {
          result = result.filter(
            (c) =>
              c.name.toLowerCase().includes(search) ||
              c.model.toLowerCase().includes(search) ||
              c.brand_name.toLowerCase().includes(search),
          );
        }

        if (typeId) {
          result = result.filter((c) => c.type_id === parseInt(typeId));
        }

        if (brandId) {
          result = result.filter((c) => c.brand_id === parseInt(brandId));
        }

        return Response.json(result);
      },
    },

    // GET /api/components/:id
    '/api/components/:id': async (req) => {
      const id = parseInt(req.params.id);
      const component = components.find((c) => c.id === id);

      if (!component) {
        return Response.json({ error: 'Component not found' }, { status: 404 });
      }

      return Response.json(component);
    },

    // GET /api/component-types
    '/api/component-types': {
      async GET() {
        return Response.json(componentTypes);
      },
    },

    // GET /api/brands
    '/api/brands': {
      async GET() {
        return Response.json(brands);
      },
    },
  },

  development: process.env.NODE_ENV !== 'production' && {
    hmr: true,
    console: true,
  },
});

console.log(`🚀 Server running at ${server.url}`);
