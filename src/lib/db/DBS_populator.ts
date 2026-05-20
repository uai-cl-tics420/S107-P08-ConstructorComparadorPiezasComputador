import { MongoClient } from 'mongodb';
import { Pool } from 'pg';
import * as userManager from './DBS_userManager';
import * as componentManager from './DBS_componentAndPricesManager';

// Database connection configuration
const mongoUrl = `mongodb://${process.env.MONGO_USER}:${process.env.MONGO_PASSWORD}@${process.env.MONGO_HOST}:${process.env.MONGO_PORT}/${process.env.MONGO_DB}?authSource=admin`;
const pgConfig = {
  user: process.env.POSTGRES_USER,
  password: process.env.POSTGRES_PASSWORD,
  host: process.env.POSTGRES_HOST,
  port: parseInt(process.env.POSTGRES_PORT!),
  database: process.env.POSTGRES_DB,
};

async function populate() {
  // Inserts template data into the database system
  const mongoClient = new MongoClient(mongoUrl);
  const pgPool = new Pool(pgConfig);

  try {
    await mongoClient.connect();
    const db = mongoClient.db(process.env.MONGO_DB);
    console.log('Iniciando Población de Datos...');

    const templateUsers = [
      // Template users
      { email: 'template1@example.com', password: 'Password123!', name: 'Templte User 1' },
      { email: 'template2@example.com', password: 'Password123!', name: 'Templte User 2' },
      { email: 'template3@example.com', password: 'Password123!', name: 'Templte User 3' },
    ];

    for (const u of templateUsers) {
      try {
        const exists = await db.collection('users').findOne({ email: u.email });
        if (!exists) {
          const res = await userManager.registerUser(u);
          if (res.success) console.log(`[SUCCESS] Usuario creado: ${u.email}`);
          else console.error(`[ERROR] Error registrando ${u.email}: ${res.error}`);
        } else {
          console.warn(`[WARN] El usuario ${u.email} ya existe. Omitiendo...`);
        }
      } catch (e) {
        console.error(`[ERROR] Error inesperado con usuario ${u.email}:`, e);
      }
    }

    const templateBrands = ['NVIDIA', 'AMD', 'Intel', 'Corsair', 'MSI']; // Template brands
    for (const b of templateBrands) {
      try {
        const resId = await componentManager.getBrandID(db, b);
        if (!resId.success) {
          const res = await componentManager.createBrand(db, b);
          if (res.success) console.log(`[SUCCESS] Marca creada: ${b}`);
          else console.error(`[ERROR] Error creando marca ${b}: ${res.error}`);
        } else {
          console.warn(`[WARN] La marca ${b} ya existe. Omitiendo...`);
        }
      } catch (e) {
        console.error(`[ERROR] Error inesperado con marca ${b}:`, e);
      }
    }

    const templateTypes = ['CPU', 'GPU', 'RAM', 'Motherboard', 'Storage']; // Template component types
    for (const t of templateTypes) {
      try {
        const resId = await componentManager.getComponentTypeID(db, t);
        if (!resId.success) {
          const res = await componentManager.createComponentType(db, t);
          if (res.success) console.log(`[SUCCESS] Tipo creado: ${t}`);
          else console.error(`[ERROR] Error creando tipo ${t}: ${res.error}`);
        } else {
          console.warn(`[WARN] El tipo ${t} ya existe. Omitiendo...`);
        }
      } catch (e) {
        console.error(`[ERROR] Error inesperado con tipo ${t}:`, e);
      }
    }

    const templateVendors = ['Amazon', 'Newegg', 'PC Factory', 'SP Digital']; // Template vendors
    for (const v of templateVendors) {
      try {
        const resId = await componentManager.getVendorID(db, v);
        if (!resId.success) {
          const res = await componentManager.createVendor(db, v);
          if (res.success) console.log(`[SUCCESS] Vendedor creado: ${v}`);
          else console.error(`[ERROR] Error creando vendedor ${v}: ${res.error}`);
        } else {
          console.warn(`[WARN] El vendedor ${v} ya existe. Omitiendo...`);
        }
      } catch (e) {
        console.error(`[ERROR] Error inesperado con vendedor ${v}:`, e);
      }
    }

    // Types IDs for component insertion
    const cpuType = (await componentManager.getComponentTypeID(db, 'CPU')).id;
    const gpuType = (await componentManager.getComponentTypeID(db, 'GPU')).id;
    const ramType = (await componentManager.getComponentTypeID(db, 'RAM')).id;

    // Brand IDs for component insertion
    const intelBrand = (await componentManager.getBrandID(db, 'Intel')).id;
    const nvidiaBrand = (await componentManager.getBrandID(db, 'NVIDIA')).id;
    const corsairBrand = (await componentManager.getBrandID(db, 'Corsair')).id;

    const templateComponents = [
      {
        type_id: cpuType!,
        brand_id: intelBrand!,
        name_model: 'Core i9-13900K',
        specs: { sockets: 'LGA1700', cores: 24, threads: 32, base_clock: '3.0 GHz' },
        requirements: { chipset: 'Z790', cooling: 'Liquid 360mm recommended' },
      },
      {
        type_id: gpuType!,
        brand_id: nvidiaBrand!,
        name_model: 'GeForce RTX 4080 Super',
        specs: { vram: '16GB GDDR6X', slots: 3, length: '310mm' },
        requirements: { psu: '750W', power_connector: '1x 16-pin (12VHPWR)' },
      },
      {
        type_id: ramType!,
        brand_id: corsairBrand!,
        name_model: 'Vengeance RGB DDR5 32GB (2x16GB)',
        specs: { speed: '6000MT/s', latencies: 'CL30', color: 'Black' },
        requirements: { platform: 'DDR5', profile: 'Intel XMP 3.0' },
      },
    ];

    for (const c of templateComponents) {
      try {
        if (!c.type_id || !c.brand_id) {
          console.error(`[ERROR] Error: IDs faltantes para ${c.name_model}. Omitiendo.`);
          continue;
        }

        // 1. Obtener o crear el ID del componente
        let component_id: string;
        const resId = await componentManager.getComponentID(db, c.name_model);

        if (!resId.success) {
          const res = await componentManager.createComponent(db, pgPool, c);
          if (res.success) {
            console.log(`[SUCCESS] Componente creado: ${c.name_model}`);
            component_id = res.component_id!;
          } else {
            console.error(`[ERROR] Error creando componente ${c.name_model}: ${res.error}`);
            continue;
          }
        } else {
          console.warn(`[WARN] El componente ${c.name_model} ya existe. Procediendo con precios...`);
          component_id = resId.id!; // Nota: Asegúrate que getComponentID devuelva 'id' o 'component_id' según tu interfaz
        }

        // 2. Insertar 3 precios de ejemplo (de menor a mayor)
        // Obtenemos todos los vendors disponibles para asignar precios
        const vendors = ['Amazon', 'Newegg', 'PC Factory'];
        const basePrice = c.name_model.includes('i9') ? 500000 : c.name_model.includes('RTX') ? 1200000 : 150000;

        for (let i = 0; i < vendors.length; i++) {
          const vendorName = vendors[i]!; // Forzamos que no es undefined
          try {
            const vendorRes = await componentManager.getVendorID(db, vendorName);
            if (vendorRes.success && vendorRes.id) {
              const increment = i * 5000; // Incremento para que vayan de menor a mayor
              const priceData = {
                component_id: component_id,
                vendor_id: vendorRes.id,
                price: basePrice + increment + 10000, // Precio normal
                discount_price: basePrice + increment, // Precio oferta (menor al normal)
              };

              const priceRes = await componentManager.createPrice(pgPool, priceData);
              if (priceRes.success) {
                console.log(
                  `   [SUCCESS] Precio registrado en ${vendorName}: $${priceData.discount_price} (Oferta) / $${priceData.price} (Normal)`,
                );
              }
            }
          } catch (priceErr) {
            console.error(`   [ERROR] Error insertando precio para ${vendors[i]}:`, priceErr);
          }
        }
      } catch (e) {
        console.error(`[ERROR] Error inesperado con componente/precios ${c.name_model}:`, e);
      }
    }

    console.log('Pobación de datos finalizada.');
  } catch (error) {
    console.error('Error durante la población:', error);
  } finally {
    await mongoClient.close();
    await pgPool.end();
  }
}

// Ejecutar si se llama directamente
if (require.main === module) {
  try {
    await populate();
    process.exit(0); // Éxito
  } catch (err) {
    console.error(err);
    process.exit(1); // Error
  }
}

export { populate };
