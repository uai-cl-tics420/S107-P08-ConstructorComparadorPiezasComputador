import '@/lib/config'; // Validates env variables on app start
import { serve } from 'bun';
import { auth } from '@/lib/db/auth';
import { getComponents, getComponentById, getBrands, getComponentTypes } from '@/lib/db/mongo';
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
        const search = url.searchParams.get('search') ?? '';
        const typeId = url.searchParams.get('type_id');
        const brandId = url.searchParams.get('brand_id');
        const result = await getComponents(search || undefined, typeId || undefined, brandId || undefined);
        return Response.json(result);
      },
    },

    // GET /api/components/:id
    '/api/components/:id': async (req) => {
      const component = await getComponentById(req.params.id);
      if (!component) return Response.json({ error: 'Component not found' }, { status: 404 });
      return Response.json(component);
    },

    // GET /api/component-types
    '/api/component-types': {
      async GET() {
        return Response.json(await getComponentTypes());
      },
    },

    // GET /api/brands
    '/api/brands': {
      async GET() {
        return Response.json(await getBrands());
      },
    },
  },

  development: process.env.NODE_ENV !== 'production' && {
    hmr: true,
    console: true,
  },
});

console.log(`🚀 Server running at ${server.url}`);
