const UUID_PATTERN = '^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-5][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}$';

const baseSchema = {
  bsonType: 'object',
  required: ['_id', 'name'],
  properties: {
    _id: { bsonType: 'string', pattern: UUID_PATTERN, description: 'UUID v1-v5 string' },
    name: { bsonType: 'string', minLength: 1, maxLength: 120 },
  },
  additionalProperties: false,
};

['brands', 'component_types', 'vendors'].forEach((coll) => {
  db.createCollection(coll, { validator: { $jsonSchema: baseSchema } });
  db[coll].createIndex({ name: 1 }, { unique: true });
});

db.createCollection('components', {
  validator: {
    $jsonSchema: {
      bsonType: 'object',
      required: ['_id', 'type_id', 'name_model', 'specs', 'requirements', 'created_at', 'updated_at'],
      properties: {
        _id: { bsonType: 'string', pattern: UUID_PATTERN, description: 'UUID v1-v5' },
        type_id: { bsonType: 'string', pattern: UUID_PATTERN },
        brand_id: { bsonType: ['string', 'null'], pattern: UUID_PATTERN },
        name_model: { bsonType: 'string', minLength: 1, maxLength: 160 },
        specs: { bsonType: 'object' },
        requirements: { bsonType: 'object' },
        created_at: { bsonType: 'date' },
        updated_at: { bsonType: 'date' },
      },
      additionalProperties: false,
    },
  },
});
db.components.createIndex({ name_model: 1 }, { unique: true });
db.components.createIndex({ type_id: 1, updated_at: -1 });
db.components.createIndex({ brand_id: 1, updated_at: -1 });
db.components.createIndex({ updated_at: -1 });

db.createCollection('builds', {
  validator: {
    $jsonSchema: {
      bsonType: 'object',
      required: ['_id', 'user_id', 'components', 'created_at', 'updated_at'],
      properties: {
        _id: { bsonType: 'string', pattern: UUID_PATTERN },
        user_id: { bsonType: 'objectId' },
        components: {
          bsonType: 'array',
          minItems: 1,
          items: {
            bsonType: 'object',
            required: ['component_id', 'quantity'],
            properties: {
              component_id: { bsonType: 'string', pattern: UUID_PATTERN },
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
