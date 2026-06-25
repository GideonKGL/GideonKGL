import { Router } from "express";
import { authenticate } from "../../middleware/auth.middleware";
import { validate } from "../../middleware/validate.middleware";
import * as deviceController from "./device.controller";
import { deviceParamsSchema, registerDeviceSchema, updateDeviceSchema } from "./device.validation";

export const deviceRoutes = Router();

deviceRoutes.use(authenticate);
deviceRoutes.post("/", validate({ body: registerDeviceSchema }), deviceController.registerDevice);
deviceRoutes.get("/", deviceController.listDevices);
deviceRoutes.patch("/:id", validate({ params: deviceParamsSchema, body: updateDeviceSchema }), deviceController.updateDevice);
deviceRoutes.delete("/:id", validate({ params: deviceParamsSchema }), deviceController.revokeDevice);
