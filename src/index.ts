import '@/lib/config'; // Validates env variables on app start
import { serve } from 'bun';
import { auth } from '@/lib/auth/auth';
import { getComponents, getComponentById, getBrands, getComponentTypes } from '@/lib/db/mongo';
import index from './index.html';
import { MongoClient } from 'mongodb';
import { Pool } from 'pg';
import { processAuthTask } from '@/lib/auth/Login_Signon';

// Initialize MongoDB connection
const mongoURL = `mongodb://${process.env.MONGO_USER}:${process.env.MONGO_PASSWORD}@${process.env.MONGO_HOST}:${process.env.MONGO_PORT}/${process.env.MONGO_DB}?authSource=admin`;
const mongoClient = new MongoClient(mongoURL);
await mongoClient.connect();
const db = mongoClient.db(process.env.MONGO_DB);

// Initialize PostgreSQL connection pool
const pgPool = new Pool({
  user: process.env.POSTGRES_USER,
  password: process.env.POSTGRES_PASSWORD,
  host: process.env.POSTGRES_HOST,
  port: parseInt(process.env.POSTGRES_PORT || '5432'),
  database: process.env.POSTGRES_DB,
});

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

    '/api/login': {
      async POST(req) {
        try {
          const body = await req.json();
          const { task, payload } = body;

          if (!task) {
            return Response.json({ error: 'Falta el campo task' }, { status: 400 });
          }

          const result = await processAuthTask(task, payload);

          return Response.json(result, {
            status: result.success ? 200 : 401,
          });
        } catch (e) {
          return Response.json({ error: 'Invalid request' }, { status: 400 });
        }
      },
    },
  },

  development: process.env.NODE_ENV !== 'production' && {
    hmr: true,
    console: true,
  },
});

console.log(`🚀 Server running at ${server.url}`);
