import swaggerJsdoc from 'swagger-jsdoc'

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
          },
        },
      },
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
    },
  },
  apis: ['./src/server/modules/**/*.routes.ts'],
}

export const swaggerSpec = swaggerJsdoc(options)
