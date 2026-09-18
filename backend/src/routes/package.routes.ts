import { Router } from "express";

import { PackageController } from "../controllers/package.controller";
import { authenticate } from "../middleware/authenticate";
import { requireRole } from "../middleware/authorize";

const controller = new PackageController();
const router = Router();

router.post(
  "/",
  authenticate,
  requireRole("CUSTOMER"),
  (request, response, next) =>
    controller.create(request, response, next),
);
router.get(
  "/my",
  authenticate,
  requireRole("CUSTOMER"),
  (request, response, next) =>
    controller.listMine(request, response, next),
);
router.get(
  "/assigned",
  authenticate,
  requireRole("AGENT"),
  (request, response, next) =>
    controller.listAssigned(request, response, next),
);
router.get(
  "/",
  authenticate,
  requireRole("ADMIN"),
  (request, response, next) =>
    controller.listAll(request, response, next),
);
router.post(
  "/:id/assign",
  authenticate,
  requireRole("ADMIN"),
  (request, response, next) =>
    controller.retryAssignment(request, response, next),
);
router.get(
  "/:id/assignment",
  authenticate,
  (request, response, next) =>
    controller.assignment(request, response, next),
);
router.get(
  "/:id",
  authenticate,
  (request, response, next) =>
    controller.getById(request, response, next),
);

export default router;
