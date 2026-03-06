import { Router } from 'express';
import { categoryController } from '../controllers/category.controller';
import { asyncHandler } from '../utils/async-handler';

const router = Router();

router.get(
  '/',
  asyncHandler(categoryController.findAll.bind(categoryController)),
);

router.get(
  '/:id',
  asyncHandler(categoryController.findById.bind(categoryController)),
);

router.post(
  '/',
  asyncHandler(categoryController.create.bind(categoryController)),
);

router.patch(
  '/:id',
  asyncHandler(categoryController.update.bind(categoryController)),
);

router.delete(
  '/:id',
  asyncHandler(categoryController.delete.bind(categoryController)),
);

export default router;
