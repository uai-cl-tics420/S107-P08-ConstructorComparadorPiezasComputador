const UUID_PATTERN = '^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-5][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}$'; // UUID pattern for input validation

db.createCollection('brands', {
  // collection for component brands
  validator: {
    $jsonSchema: {
      bsonType: 'object',
      required: ['_id', 'name'],
      properties: {
        _id: {
          // id with fixed pattern for value integrity
          bsonType: 'string',
          pattern: UUID_PATTERN,
          description: 'UUID v1-v5 string',
        },
        name: { bsonType: 'string', minLength: 1, maxLength: 120 },
      },
      additionalProperties: false,
    },
  },
});
db.brands.createIndex({ name: 1 }, { unique: true });

db.createCollection('component_types', {
  // collection for component types/categories
  validator: {
    $jsonSchema: {
      bsonType: 'object',
      required: ['_id', 'name'],
      properties: {
        _id: {
          // id with fixed pattern for value integrity
          bsonType: 'string',
          pattern: UUID_PATTERN,
          description: 'UUID v1-v5 string',
        },
        name: { bsonType: 'string', minLength: 1, maxLength: 120 },
      },
      additionalProperties: false,
    },
  },
});
db.component_types.createIndex({ name: 1 }, { unique: true });

db.createCollection('vendors', {
  // collection for component vendors (authors of component price listings)
  validator: {
    $jsonSchema: {
      bsonType: 'object',
      required: ['_id', 'name'],
      properties: {
        _id: {
          // id with fixed pattern for value integrity
          bsonType: 'string',
          pattern: UUID_PATTERN,
          description: 'UUID v1-v5 string',
        },
        name: { bsonType: 'string', minLength: 1, maxLength: 120 },
      },
      additionalProperties: false,
    },
  },
});
db.vendors.createIndex({ name: 1 }, { unique: true });

db.createCollection('components', {
  // collection for computer components, with flexible specs and requirements fields for variable attributes
  validator: {
    $jsonSchema: {
      bsonType: 'object',
      required: ['_id', 'type_id', 'name_model', 'specs', 'requirements', 'created_at', 'updated_at'],
      properties: {
        _id: {
          // id with fixed pattern for value integrity
          bsonType: 'string',
          pattern: UUID_PATTERN,
          description: 'UUID v1-v5; mirrored as component_id in SQL',
        },
        type_id: {
          // id correspondig to the types collection
          bsonType: 'string',
          pattern: UUID_PATTERN,
        },
        brand_id: {
          // id correspondig to the brands collection
          bsonType: ['string', 'null'],
          pattern: UUID_PATTERN,
        },
        name_model: { bsonType: 'string', minLength: 1, maxLength: 160 },
        specs: {
          bsonType: 'object',
          description: 'Component specifications', // for component descriptions
        },
        requirements: {
          bsonType: 'object',
          description: 'Component rquirements', // for compatibility checks
        },
        created_at: { bsonType: 'date' },
        updated_at: { bsonType: 'date' },
      },
      additionalProperties: false,
    },
  },
});
db.components.createIndex({ type_id: 1 });
db.components.createIndex({ brand_id: 1 });
db.components.createIndex({ name_model: 1 }, { unique: true });

db.createCollection('builds', {
  // collection for user builds
  validator: {
    $jsonSchema: {
      bsonType: 'object',
      required: ['_id', 'user_id', 'components', 'created_at', 'updated_at'],
      properties: {
        _id: {
          // id with fixed pattern for value integrity
          bsonType: 'string',
          pattern: UUID_PATTERN,
          description: 'UUID v1-v5 string',
        },
        user_id: {
          // id correspondig to the better auth users collection
          bsonType: 'objectId',
          description: 'ObjectId from better-auth users collection',
        },
        components: {
          bsonType: 'array',
          minItems: 1,
          items: {
            bsonType: 'object',
            required: ['component_id', 'quantity'],
            properties: {
              component_id: {
                // id correspondig to the components collection
                bsonType: 'string',
                pattern: UUID_PATTERN,
              },
              quantity: { bsonType: 'int', minimum: 1 },
            },
            additionalProperties: false,
          },
        },
        created_at: { bsonType: 'date' },
        updated_at: { bsonType: 'date' },
      },
      additionalProperties: false,
    },
  },
});
db.builds.createIndex({ user_id: 1, updated_at: -1 });
db.builds.createIndex({ 'components.component_id': 1 });

print('Mongo schema created successfully.');
