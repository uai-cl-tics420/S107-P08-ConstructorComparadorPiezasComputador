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
import { logger } from '@/lib/logger';
import { z } from 'zod';
import { textSchema, numericSchema, uuidSchema, buildComponentSchema } from './utils/inputValidations';
import { build } from 'esbuild';

async function requireSession(req: Request, endpointName: string) {
  try {
    const session = await auth.api.getSession({ headers: req.headers });
    if (!session) {
      logger.warn(`${endpointName}: solicitud sin sesión válida`);
      return null;
    }
    return session;
  } catch (error) {
    logger.error(`Error al obtener sesión en ${endpointName}`, { error: (error as Error).message });
    return null;
  }
}

const server = serve({
  routes: {
    // BetterAuth routes
    '/api/auth/*': auth.handler,

    // Serve index.html for all unmatched routes.
    '/*': index,

    // GET /api/components?search=&type_id=&brand_id=
    '/api/components': {
      async POST(req) {
        try {
          const body = await req.json();

          const inputSchema = z.object({
            search: textSchema.optional(),
            typeId: textSchema.optional(),
            brandId: textSchema.optional(),
            page: numericSchema.optional(),
            limit: numericSchema.optional(),
            sortBy: textSchema.optional(),
            sortOrder: numericSchema.optional(),
            minPrice: numericSchema.optional(),
            maxPrice: numericSchema.optional(),
          });

          const { search, typeId, brandId, minPrice, maxPrice, page, limit, sortBy, sortOrder } =
            inputSchema.parse(body);

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
        } catch (error) {
          logger.warn('POST /api/components: Parámetros de búsqueda no válidos', { error });
          return Response.json({ error: 'Input no válido' }, { status: 400 });
        }
      },
    },

    '/api/components/availability': {
      async POST(req) {
        try {
          const body = await req.json();

          const inputSchema = z.object({
            ids: z.array(uuidSchema).min(1, 'Lista vacía'),
          });

          const { ids } = inputSchema.parse(body);

          logger.info('POST /api/components/availability', { requestedIds: ids.length });

          const inStock = new Set(await getInStockComponentIds(ids));
          const outOfStock = ids.filter((id) => !inStock.has(id));

          if (outOfStock.length > 0) {
            logger.warn('Componentes sin stock encontrados', { outOfStock });
          }

          return Response.json({ outOfStock });
        } catch (error) {
          logger.warn('POST /api/components/availability: Lista de ids no válida', { error });
          return Response.json({ error: 'Input no válido' }, { status: 400 });
        }
      },
    },

    '/api/components/:id': async (req) => {
      try {
        const component_id = uuidSchema.parse(req.params.id);

        logger.info('GET /api/components/:id', { id: component_id });
        const component = await getComponentById(component_id);
        if (!component) {
          logger.warn('Componente no encontrado', { id: component_id });
          return Response.json({ error: 'Component not found' }, { status: 404 });
        }
        return Response.json(component);
      } catch (error) {
        logger.warn('GET /api/components/:id: id entregada no válida', { error });
        return Response.json({ error: 'Input no válido' }, { status: 400 });
      }
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
        const session = await requireSession(req, 'GET /api/builds');
        if (!session) return Response.json({ error: 'No autorizado' }, { status: 401 });

        logger.info('GET /api/builds', { userId: session.user.id });
        return await getBuildsClient(session.user.id);
      },
      async POST(req) {
        const session = await requireSession(req, 'POST /api/builds');
        if (!session) return Response.json({ error: 'No autorizado' }, { status: 401 });

        try {
          const body = await req.json();

          const inputSchema = z.object({
            name: textSchema,
            components: z.array(buildComponentSchema),
          });

          const { name, components } = inputSchema.parse(body);

          logger.info('POST /api/builds: creando build', { userId: session.user.id, name });
          return await createBuildClient(session.user.id, name, components);
        } catch (error) {
          logger.warn('POST /api/builds: Formato de input entregado no válido', { error });
          return Response.json({ error: 'Input no válido' }, { status: 400 });
        }
      },
    },

    '/api/builds/:id': {
      async DELETE(req) {
        const session = await requireSession(req, `DELETE /api/builds/:id (${req.params.id})`);
        if (!session) return Response.json({ error: 'No autorizado' }, { status: 401 });

        try {
          const build_id = uuidSchema.parse(req.params.id);

          logger.info('DELETE /api/builds/:id', { buildId: build_id, userId: session.user.id });
          return await deleteBuildClient(build_id, session.user.id);
        } catch (error) {
          logger.warn('DELETE /api/builds/:id: id entregada no válida', { error });
          return Response.json({ error: 'Input no válido' }, { status: 400 });
        }
      },
    },

    '/api/shared-builds/:id': {
      async GET(req) {
        try {
          const build_id = uuidSchema.parse(req.params.id);

          logger.info('GET /api/shared-builds/:id', { buildId: build_id });
          return await getSharedBuildClient(build_id);
        } catch (error) {
          logger.warn('GET /api/shared-builds/:id: id entregada no válida', { error });
          return Response.json({ error: 'Input no válido' }, { status: 400 });
        }
      },
    },

    '/api/shared-builds': {
      async POST(req) {
        try {
          const body = await req.json();

          const inputSchema = z.object({
            name: textSchema,
            components: z.array(buildComponentSchema),
          });

          const { name, components } = inputSchema.parse(body);

          logger.info('POST /api/shared-builds: creando build compartido', { name, componentCount: components.length });
          return await createSharedBuildClient(name || 'Shared Build', components);
        } catch (error) {
          logger.warn('POST /api/shared-builds: input entregado no válido', { error });
          return Response.json({ error: 'Input no válido' }, { status: 400 });
        }
      },
    },

    '/api/recommendations/build': {
      async POST(req) {
        try {
          const body = await req.json();

          const inputSchema = z.object({
            components: z.array(buildComponentSchema),
          });

          const { components } = inputSchema.parse(body);

          logger.info('POST /api/recommendations/build', { componentCount: components.length });
          const recommendations = await getRecommendationsForBuild(components);
          return Response.json(recommendations);
        } catch (error) {
          logger.warn('POST /api/recommendations/build: input entregado no válido', { error });
          return Response.json({ error: 'Input no válido' }, { status: 400 });
        }
      },
    },

    '/api/recommendations/component/:id': {
      async GET(req) {
        try {
          const component_id = uuidSchema.parse(req.params.id);

          logger.info('GET /api/recommendations/component/:id', { componentId: component_id });
          const recommendations = await getRecommendationsForComponent(component_id);
          if (!recommendations) {
            logger.warn('Componente no encontrado al generar recomendaciones', { componentId: component_id });
            return Response.json({ error: 'Component not found' }, { status: 404 });
          }
          return Response.json(recommendations);
        } catch (error) {
          logger.error('Error generando recomendaciones para componente', {
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
