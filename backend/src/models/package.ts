import { ObjectId } from "mongodb";

import {
  type LocationSnapshot,
  type MongoDocument,
  type Timestamped,
} from "./common";
import { type DeliveryStatus, type PackageType } from "./enums";

export interface PackageDocument extends MongoDocument, Timestamped {
  trackingNumber: string;
  customerId: ObjectId;
  packageType: PackageType;
  description: string;
  weight: number;
  sourceLocation: LocationSnapshot;
  destinationLocation: LocationSnapshot;
  serviceId: ObjectId;
  scheduledDate: Date;
  status: DeliveryStatus;
  assignedAgentId: ObjectId | null;
  assignmentScore?: number;
  assignmentDistanceKm?: number;
  assignmentEstimatedMinutes?: number;
  assignmentReason?: string;
  assignedAt?: Date;
}