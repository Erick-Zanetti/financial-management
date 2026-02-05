import { Router } from 'express';
import { financialReleaseController } from '../controllers/financial-release.controller';
import { asyncHandler } from '../utils/async-handler';

const router = Router();

/**
 * @swagger
 * /financial-release:
 *   get:
 *     summary: Find all financial releases
 *     tags: [Financial Release]
 *     responses:
 *       200:
 *         description: List of all financial releases
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/FinancialRelease'
 */
router.get(
  '/',
  asyncHandler(financialReleaseController.findAll.bind(financialReleaseController)),
);

/**
 * @swagger
 * /financial-release/by-type:
 *   get:
 *     summary: Find releases by type, month, and year
 *     tags: [Financial Release]
 *     parameters:
 *       - in: query
 *         name: type
 *         required: true
 *         schema:
 *           type: string
 *           enum: [R, E]
 *       - in: query
 *         name: month
 *         required: true
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 12
 *       - in: query
 *         name: year
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Filtered list of financial releases
 */
router.get(
  '/by-type',
  asyncHandler(financialReleaseController.findByType.bind(financialReleaseController)),
);

/**
 * @swagger
 * /financial-release/{id}:
 *   get:
 *     summary: Find financial release by ID
 *     tags: [Financial Release]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Financial release found
 *       404:
 *         description: Not found
 */
router.get(
  '/:id',
  asyncHandler(financialReleaseController.findById.bind(financialReleaseController)),
);

/**
 * @swagger
 * /financial-release:
 *   post:
 *     summary: Create a new financial release
 *     tags: [Financial Release]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/FinancialRelease'
 *     responses:
 *       200:
 *         description: Financial release created
 */
router.post(
  '/',
  asyncHandler(financialReleaseController.create.bind(financialReleaseController)),
);

/**
 * @swagger
 * /financial-release/{id}:
 *   patch:
 *     summary: Update a financial release
 *     tags: [Financial Release]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/FinancialRelease'
 *     responses:
 *       200:
 *         description: Financial release updated
 *       404:
 *         description: Not found
 */
router.patch(
  '/:id',
  asyncHandler(financialReleaseController.update.bind(financialReleaseController)),
);

/**
 * @swagger
 * /financial-release/{id}:
 *   delete:
 *     summary: Delete a financial release
 *     tags: [Financial Release]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Financial release deleted
 *       404:
 *         description: Not found
 */
router.delete(
  '/:id',
  asyncHandler(financialReleaseController.delete.bind(financialReleaseController)),
);

export default router;
