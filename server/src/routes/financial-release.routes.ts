import { Router } from 'express';
import { financialReleaseController } from '../controllers/financial-release.controller.js';
import { asyncHandler } from '../utils/async-handler.js';

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
router.get('/', asyncHandler(financialReleaseController.findAll.bind(financialReleaseController)));

/**
 * @swagger
 * /financial-release/by-type:
 *   get:
 *     summary: Find financial releases by type, month, and year
 *     tags: [Financial Release]
 *     parameters:
 *       - in: query
 *         name: type
 *         required: true
 *         schema:
 *           type: string
 *           enum: [R, E]
 *         description: Type of release (R=Receipt, E=Expense)
 *       - in: query
 *         name: month
 *         required: true
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 12
 *         description: Month (1-12)
 *       - in: query
 *         name: year
 *         required: true
 *         schema:
 *           type: integer
 *         description: Year
 *     responses:
 *       200:
 *         description: List of financial releases matching the criteria
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/FinancialRelease'
 *       400:
 *         description: Invalid query parameters
 */
router.get('/by-type', asyncHandler(financialReleaseController.findByType.bind(financialReleaseController)));

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
 *         description: Financial release ID
 *     responses:
 *       200:
 *         description: Financial release found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/FinancialRelease'
 *       404:
 *         description: Financial release not found
 */
router.get('/:id', asyncHandler(financialReleaseController.findById.bind(financialReleaseController)));

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
 *             $ref: '#/components/schemas/FinancialReleaseInput'
 *     responses:
 *       201:
 *         description: Financial release created
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/FinancialRelease'
 *       400:
 *         description: Validation error
 */
router.post('/', asyncHandler(financialReleaseController.create.bind(financialReleaseController)));

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
 *         description: Financial release ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/FinancialReleaseInput'
 *     responses:
 *       200:
 *         description: Financial release updated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/FinancialRelease'
 *       404:
 *         description: Financial release not found
 *       400:
 *         description: Validation error
 */
router.patch('/:id', asyncHandler(financialReleaseController.update.bind(financialReleaseController)));

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
 *         description: Financial release ID
 *     responses:
 *       204:
 *         description: Financial release deleted
 */
router.delete('/:id', asyncHandler(financialReleaseController.delete.bind(financialReleaseController)));

export default router;
