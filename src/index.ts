import '@/lib/config'; // Validates env variables on app start
import { serve } from 'bun';
import { auth } from '@/lib/auth/auth';
import {
  getComponents,
  getComponentById,
  getBrands,
  getComponentTypes,
  getBuildsClient,
  createBuildClient,
  deleteBuildClient,
  getSharedBuildClient,
  createSharedBuildClient,
} from '@/lib/db/mongo';
import { getComponentCountByFilters, getInStockComponentIds } from '@/lib/db/postgres';
import { getRecommendationsForBuild, getRecommendationsForComponent } from '@/lib/db/recommendationsManager';
import { setUserPassword } from '@/lib/auth/serverRequests';
import index from './index.html';
import { MongoClient } from 'mongodb';
import { Pool } from 'pg';
import { logger } from '@/lib/logger';

// Initialize MongoDB connection
const mongoURL = `mongodb://${process.env.MONGO_USER}:${process.env.MONGO_PASSWORD}@${process.env.MONGO_HOST}:${process.env.MONGO_PORT}/${process.env.MONGO_DB}?authSource=admin`;
const mongoClient = new MongoClient(mongoURL);

try {
  await mongoClient.connect();
  logger.info('Conexión a MongoDB establecida (index)', { host: process.env.MONGO_HOST, db: process.env.MONGO_DB });
} catch (error) {
  logger.error('Fallo al conectar con MongoDB', { error: (error as Error).message });
  process.exit(1);
}

const db = mongoClient.db(process.env.MONGO_DB);

// Initialize PostgreSQL connection pool
const pgPool = new Pool({
  user: process.env.POSTGRES_USER,
  password: process.env.POSTGRES_PASSWORD,
  host: process.env.POSTGRES_HOST,
  port: parseInt(process.env.POSTGRES_PORT!),
  database: process.env.POSTGRES_DB,
});

pgPool.on('error', (err) => {
  logger.error('Error en el pool de PostgreSQL (index)', { error: err.message });
});

const server = serve({
  routes: {
    // BetterAuth routes
    '/api/auth/*': auth.handler,

    // Serve index.html for all unmatched routes.
    '/*': index,

    // GET /api/components?search=&type_id=&brand_id=
    '/api/components': {
      async POST(req) {
        const body = await req.json();
        const { search, typeId, brandId, minPrice, maxPrice, page, limit, sortBy, sortOrder } = body;

        logger.info('POST /api/components', { search, typeId, brandId, page, limit });

        const components = await getComponents(
          search || undefined,
          typeId || undefined,
          brandId || undefined,
          page,
          limit,
          sortBy,
          sortOrder as -1 | 1,
          minPrice,
          maxPrice,
        );

        const total = await getComponentCountByFilters(
          search || undefined,
          typeId || undefined,
          brandId || undefined,
          minPrice,
          maxPrice,
        );

        logger.info('Respuesta POST /api/components', { total, returned: components.length });
        return Response.json({ components, total });
      },
    },

    '/api/components/availability': {
      async POST(req) {
        const body = await req.json().catch(() => ({}));
        const ids: string[] = Array.isArray(body?.ids) ? body.ids.filter((x: unknown) => typeof x === 'string') : [];

        if (ids.length === 0) {
          logger.warn('POST /api/components/availability: lista de IDs vacía o inválida');
          return Response.json({ outOfStock: [] });
        }

        logger.info('POST /api/components/availability', { requestedIds: ids.length });
        const inStock = new Set(await getInStockComponentIds(ids));
        const outOfStock = ids.filter((id) => !inStock.has(id));

        if (outOfStock.length > 0) {
          logger.warn('Componentes sin stock encontrados', { outOfStock });
        }

        return Response.json({ outOfStock });
      },
    },

    '/api/components/:id': async (req) => {
      logger.info('GET /api/components/:id', { id: req.params.id });
      const component = await getComponentById(req.params.id);
      if (!component) {
        logger.warn('Componente no encontrado', { id: req.params.id });
        return Response.json({ error: 'Component not found' }, { status: 404 });
      }
      return Response.json(component);
    },

    '/api/component-types': {
      async GET() {
        logger.info('GET /api/component-types');
        return Response.json(await getComponentTypes());
      },
    },

    '/api/brands': {
      async GET() {
        logger.info('GET /api/brands');
        return Response.json(await getBrands());
      },
    },

    '/api/builds': {
      async GET(req) {
        let session;
        try {
          session = await auth.api.getSession({ headers: req.headers });
        } catch (error) {
          logger.error('Error al obtener sesión en GET /api/builds', { error: (error as Error).message });
          return Response.json({ error: 'No autorizado' }, { status: 401 });
        }
        if (!session) {
          logger.warn('GET /api/builds: solicitud sin sesión válida');
          return Response.json({ error: 'No autorizado' }, { status: 401 });
        }

        logger.info('GET /api/builds', { userId: session.user.id });
        return await getBuildsClient(session.user.id);
      },
      async POST(req) {
        let session;
        try {
          session = await auth.api.getSession({ headers: req.headers });
        } catch (error) {
          logger.error('Error al obtener sesión en POST /api/builds', { error: (error as Error).message });
          return Response.json({ error: 'No autorizado' }, { status: 401 });
        }
        if (!session) {
          logger.warn('POST /api/builds: solicitud sin sesión válida');
          return Response.json({ error: 'No autorizado' }, { status: 401 });
        }

        const body = await req.json();
        const { name, components } = body;

        if (!name || !Array.isArray(components)) {
          logger.warn('POST /api/builds: datos inválidos en el cuerpo', {
            name,
            hasComponents: Array.isArray(components),
          });
          return Response.json({ error: 'Datos inválidos' }, { status: 400 });
        }

        logger.info('POST /api/builds: creando build', { userId: session.user.id, name });
        return await createBuildClient(session.user.id, name, components);
      },
    },

    '/api/builds/:id': {
      async DELETE(req) {
        let session;
        try {
          session = await auth.api.getSession({ headers: req.headers });
        } catch (error) {
          logger.error('Error al obtener sesión en DELETE /api/builds/:id', { error: (error as Error).message });
          return Response.json({ error: 'No autorizado' }, { status: 401 });
        }
        if (!session) {
          logger.warn('DELETE /api/builds/:id: solicitud sin sesión válida', { buildId: req.params.id });
          return Response.json({ error: 'No autorizado' }, { status: 401 });
        }

        logger.info('DELETE /api/builds/:id', { buildId: req.params.id, userId: session.user.id });
        return await deleteBuildClient(req.params.id, session.user.id);
      },
    },

    '/api/shared-builds/:id': {
      async GET(req) {
        logger.info('GET /api/shared-builds/:id', { buildId: req.params.id });
        return await getSharedBuildClient(req.params.id);
      },
    },

    '/api/shared-builds': {
      async POST(req) {
        try {
          const body = await req.json();
          const { components, name } = body;

          if (!Array.isArray(components)) {
            logger.warn('POST /api/shared-builds: datos inválidos', { hasComponents: false });
            return Response.json({ error: 'Datos inválidos' }, { status: 400 });
          }

          logger.info('POST /api/shared-builds: creando build compartido', { name, componentCount: components.length });
          return await createSharedBuildClient(name || 'Shared Build', components);
        } catch (error) {
          logger.error('Error al crear build compartido', { error: (error as Error).message });
          return Response.json({ error: 'Failed to create shared build' }, { status: 500 });
        }
      },
    },

    '/api/recommendations/build': {
      async POST(req) {
        try {
          const body = await req.json();
          const { components } = body;

          if (!Array.isArray(components)) {
            logger.warn('POST /api/recommendations/build: formato de componentes inválido');
            return Response.json({ error: 'Invalid components format' }, { status: 400 });
          }

          logger.info('POST /api/recommendations/build', { componentCount: components.length });
          const recommendations = await getRecommendationsForBuild(components);
          return Response.json(recommendations);
        } catch (error) {
          logger.error('Error generando recomendaciones para build', { error: (error as Error).message });
          return Response.json({ error: 'Failed to generate recommendations' }, { status: 500 });
        }
      },
    },

    '/api/recommendations/component/:id': {
      async GET(req) {
        try {
          logger.info('GET /api/recommendations/component/:id', { componentId: req.params.id });
          const recommendations = await getRecommendationsForComponent(req.params.id);
          if (!recommendations) {
            logger.warn('Componente no encontrado al generar recomendaciones', { componentId: req.params.id });
            return Response.json({ error: 'Component not found' }, { status: 404 });
          }
          return Response.json(recommendations);
        } catch (error) {
          logger.error('Error generando recomendaciones para componente', {
            componentId: req.params.id,
            error: (error as Error).message,
          });
          return Response.json({ error: 'Failed to generate recommendations' }, { status: 500 });
        }
      },
    },

    '/api/users/set-password': {
      async POST(req) {
        const body = await req.json();
        logger.info('POST /api/users/set-password: solicitud recibida');
        return setUserPassword(body.newPassword, req.headers);
      },
    },
  },

  development: process.env.NODE_ENV !== 'production' && {
    hmr: true,
    console: true,
  },
});

logger.info(`🚀 Servidor iniciado`, { url: server.url, env: process.env.NODE_ENV ?? 'development' });
