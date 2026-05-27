import swaggerJsdoc from 'swagger-jsdoc'
import { TRANSPORT_MODES } from '@shared/types/index.js'

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'UrbanFlow SmartRoute API',
      version: '0.1.0',
      description: 'API de mobilité urbaine multimodale — Nantes Métropole',
    },
    servers: [{ url: `http://localhost:${process.env.PORT ?? 3000}` }],
    components: {
      schemas: {
        AuthResponse: {
          type: 'object',
          properties: {
            accessToken: { type: 'string', description: 'JWT access token (15 min)' },
          },
        },
        Error: {
          type: 'object',
          properties: {
            error: { type: 'string' },
            details: { type: 'object', nullable: true },
          },
        },
        Coordinates: {
          type: 'object',
          required: ['lat', 'lng'],
          properties: {
            lat: { type: 'number', minimum: -90, maximum: 90, example: 47.218 },
            lng: { type: 'number', minimum: -180, maximum: 180, example: -1.553 },
          },
        },
        TransportMode: {
          type: 'string',
          enum: TRANSPORT_MODES,
          description: 'Mode de transport — walk/bike/scooter via OSRM, TC via Transitous',
        },
        JourneySegment: {
          type: 'object',
          properties: {
            mode: { $ref: '#/components/schemas/TransportMode' },
            from: { $ref: '#/components/schemas/Coordinates' },
            to: { $ref: '#/components/schemas/Coordinates' },
            distanceKm: { type: 'number', example: 2.4 },
            durationMin: { type: 'integer', example: 12 },
            co2g: {
              type: 'integer',
              description: 'Émissions CO2 en grammes (facteurs ADEME)',
              example: 261,
            },
            lineRef: { type: 'string', nullable: true, example: 'C2' },
            lineName: { type: 'string', nullable: true, example: 'C2 — Orvault Grand Val' },
            shape: {
              type: 'array',
              nullable: true,
              description: 'Tracé réel décodé depuis legGeometry (polyline Leaflet)',
              items: { $ref: '#/components/schemas/Coordinates' },
            },
          },
        },
        Journey: {
          type: 'object',
          properties: {
            id: { type: 'string', example: 'transitous-0' },
            label: {
              type: 'string',
              example: 'Bus + Tramway',
              description: 'Modes utilisés joints par " + "',
            },
            segments: { type: 'array', items: { $ref: '#/components/schemas/JourneySegment' } },
            totalDurationMin: { type: 'integer', example: 28 },
            totalDistanceKm: { type: 'number', example: 6.3 },
            totalCo2g: { type: 'integer', example: 437 },
            co2SavingG: {
              type: 'integer',
              description: 'Économie CO2 vs trajet voiture équivalent',
              example: 1158,
            },
            score: {
              type: 'integer',
              minimum: 0,
              maximum: 100,
              description: 'Score multicritères (durée × CO2 × confort)',
              example: 74,
            },
          },
        },
      },
      responses: {
        BadRequest: {
          description: 'Données invalides',
          content: {
            'application/json': { schema: { $ref: '#/components/schemas/Error' } },
          },
        },
        Unauthorized: {
          description: 'Token manquant ou invalide',
          content: {
            'application/json': { schema: { $ref: '#/components/schemas/Error' } },
          },
        },
        TooManyRequests: {
          description: 'Trop de requêtes — réessayez plus tard',
          content: {
            'application/json': { schema: { $ref: '#/components/schemas/Error' } },
          },
        },
        InternalError: {
          description: 'Erreur serveur interne',
          content: {
            'application/json': { schema: { $ref: '#/components/schemas/Error' } },
          },
        },
      },
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
        cookieAuth: {
          type: 'apiKey',
          in: 'cookie',
          name: 'refresh_token',
        },
      },
    },
  },
  apis: ['./src/server/modules/**/*.routes.ts'],
}

export const swaggerSpec = swaggerJsdoc(options)
