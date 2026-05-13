import { Router } from 'express'
import * as biclooController from './bicloo.controller.js'

/**
 * @swagger
 * tags:
 *   name: Transport
 *   description: Données transport en commun et vélos Bicloo
 */

/**
 * @swagger
 * /api/transport/bicloo-stations:
 *   get:
 *     summary: Liste les stations Bicloo avec leur disponibilité
 *     description: >
 *       Retourne les stations de vélos en libre-service Bicloo (Nantes Métropole)
 *       avec le nombre de vélos disponibles et de places libres.
 *       Si DEMO_MODE=true, lit les données depuis demo-data/stations-bicloo.json.
 *       Sinon, agrège station_information et station_status depuis l'API GBFS
 *       de transport.data.gouv.fr.
 *     tags: [Transport]
 *     responses:
 *       200:
 *         description: Liste des stations
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 stations:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                         example: "bicloo-001"
 *                       name:
 *                         type: string
 *                         example: "Commerce"
 *                       coordinates:
 *                         type: object
 *                         properties:
 *                           lat:
 *                             type: number
 *                             example: 47.2134
 *                           lng:
 *                             type: number
 *                             example: -1.5541
 *                       availableBikes:
 *                         type: integer
 *                         example: 8
 *                       availableDocks:
 *                         type: integer
 *                         example: 4
 *                       totalDocks:
 *                         type: integer
 *                         example: 12
 *       502:
 *         description: API GBFS indisponible
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
const router = Router()

router.get('/bicloo-stations', biclooController.getBiclooStations)

export default router
