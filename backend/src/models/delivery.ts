import { ObjectId } from "mongodb";

import { type MongoDocument, type Timestamped } from "./common";
import { type DeliveryStatus } from "./enums";

export interface DeliveryDocument extends MongoDocument, Timestamped {
  packageId: ObjectId;
  bookingId: ObjectId;
  agentId: ObjectId;
  currentStatus: DeliveryStatus;
  pickupTime: Date | null;
  estimatedDeliveryTime: Date | null;
  actualDeliveryTime: Date | null;
  otpHash: string | null;
  otpExpiresAt: Date | null;
}