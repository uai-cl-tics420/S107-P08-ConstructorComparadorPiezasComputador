import '@/lib/config'; // Validates env variables on app start
import { serve } from 'bun';
import { auth } from '@/lib/auth/auth';
import { getComponents, getComponentById, getBrands, getComponentTypes } from '@/lib/db/mongo';
import { getUserBuilds, createUserBuild, deleteUserBuild } from '@/lib/db/DBS_buildsManager';
import { getRecommendationsForBuild, getRecommendationsForComponent } from '@/lib/db/recommendationsManager';
import index from './index.html';
import { MongoClient } from 'mongodb';
import { Pool } from 'pg';

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
  port: parseInt(process.env.POSTGRES_PORT!),
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

    // GET /api/builds    — obtener builds del usuario autenticado
    // POST /api/builds   — guardar un nuevo build
    '/api/builds': {
      async GET(req) {
        let session;
        try {
          session = await auth.api.getSession({ headers: req.headers });
        } catch {
          return Response.json({ error: 'No autorizado' }, { status: 401 });
        }
        if (!session) return Response.json({ error: 'No autorizado' }, { status: 401 });
        const builds = await getUserBuilds(db, session.user.id);
        return Response.json(
          builds.map((b) => ({
            id: b._id,
            name: b.name,
            components: b.components,
            created_at: b.created_at.toISOString(),
          })),
        );
      },
      async POST(req) {
        let session;
        try {
          session = await auth.api.getSession({ headers: req.headers });
        } catch {
          return Response.json({ error: 'No autorizado' }, { status: 401 });
        }
        if (!session) return Response.json({ error: 'No autorizado' }, { status: 401 });
        const body = await req.json();
        const { name, components } = body;
        if (!name || !Array.isArray(components)) {
          return Response.json({ error: 'Datos inválidos' }, { status: 400 });
        }
        const build = await createUserBuild(db, session.user.id, name, components);
        return Response.json(
          {
            id: build._id,
            name: build.name,
            components: build.components,
            created_at: build.created_at.toISOString(),
          },
          { status: 201 },
        );
      },
    },

    // DELETE /api/builds/:id — eliminar un build del usuario
    '/api/builds/:id': {
      async DELETE(req) {
        let session;
        try {
          session = await auth.api.getSession({ headers: req.headers });
        } catch {
          return Response.json({ error: 'No autorizado' }, { status: 401 });
        }
        if (!session) return Response.json({ error: 'No autorizado' }, { status: 401 });
        const success = await deleteUserBuild(db, req.params.id, session.user.id);
        if (!success) return Response.json({ error: 'Build no encontrado' }, { status: 404 });
        return Response.json({ success: true });
      },
    },

    // POST /api/recommendations/build — recomendaciones para un build
    '/api/recommendations/build': {
      async POST(req) {
        try {
          const body = await req.json();
          const { components } = body;
          if (!Array.isArray(components)) {
            return Response.json({ error: 'Invalid components format' }, { status: 400 });
          }
          const recommendations = await getRecommendationsForBuild(components);
          return Response.json(recommendations);
        } catch (error) {
          console.error('Recommendation error:', error);
          return Response.json({ error: 'Failed to generate recommendations' }, { status: 500 });
        }
      },
    },

    // GET /api/recommendations/component/:id — recomendaciones para un componente
    '/api/recommendations/component/:id': {
      async GET(req) {
        try {
          const recommendations = await getRecommendationsForComponent(req.params.id);
          if (!recommendations) {
            return Response.json({ error: 'Component not found' }, { status: 404 });
          }
          return Response.json(recommendations);
        } catch (error) {
          console.error('Recommendation error:', error);
          return Response.json({ error: 'Failed to generate recommendations' }, { status: 500 });
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
