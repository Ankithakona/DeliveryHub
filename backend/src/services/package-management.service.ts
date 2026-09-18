import { randomUUID } from "node:crypto";
import { ObjectId, type Filter } from "mongodb";

import {
  DELIVERY_STATUSES,
  PACKAGE_TYPES,
  type DeliveryStatus,
  type PackageType,
} from "../models/enums";
import {
  type LocationSnapshot,
  type Timestamped,
} from "../models/common";
import { type PackageDocument } from "../models/package";
import { type BookingDocument } from "../models/booking";
import { type DeliveryDocument } from "../models/delivery";
import { type DeliveryHistoryDocument } from "../models/delivery-history";
import { type NotificationDocument } from "../models/notification";
import { type UserDocument, toPublicUser } from "../models/user";
import { AgentRepository } from "../repositories/agent.repository";
import { BookingRepository } from "../repositories/booking.repository";
import { DeliveryHistoryRepository } from "../repositories/delivery-history.repository";
import { DeliveryRepository } from "../repositories/delivery.repository";
import { LocationRepository } from "../repositories/location.repository";
import { NotificationRepository } from "../repositories/notification.repository";
import { PackageRepository } from "../repositories/package.repository";
import { ServiceRepository } from "../repositories/service.repository";
import { UserRepository } from "../repositories/user.repository";
import { type AuthenticatedUser } from "../middleware/authenticate";
import { AppError } from "../middleware/error-handler";
import { AgentGraphService } from "./agent-graph.service";
import {
  type AssignmentResult,
  AssignmentService,
} from "./assignment.service";
import {
  getEnumValue,
  getInputObject,
  getNumber,
  getObjectId,
  getOptionalString,
  getRequiredString,
} from "../utils/management-validation";

interface PackageRepositories {
  agents: AgentRepository;
  bookings: BookingRepository;
  deliveries: DeliveryRepository;
  histories: DeliveryHistoryRepository;
  locations: LocationRepository;
  notifications: NotificationRepository;
  packages: PackageRepository;
  services: ServiceRepository;
  users: UserRepository;
}

interface PackageQuery {
  status?: DeliveryStatus;
  agentId?: ObjectId;
  customerId?: ObjectId;
  serviceId?: ObjectId;
  fromDate?: Date;
  toDate?: Date;
  page: number;
  limit: number;
}

export interface PackageView {
  id: string;
  trackingNumber: string;
  customerId: string;
  packageType: PackageType;
  description: string;
  weight: number;
  sourceLocation: LocationSnapshot;
  destinationLocation: LocationSnapshot;
  serviceId: string;
  scheduledDate: Date;
  status: DeliveryStatus;
  assignedAgentId: string | null;
  assignmentScore?: number;
  assignmentDistanceKm?: number;
  assignmentEstimatedMinutes?: number;
  assignmentReason?: string;
  assignedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface BookingView {
  id: string;
  bookingNumber: string;
  packageId: string;
  customerId: string;
  agentId: string;
  serviceId: string;
  bookingDate: Date;
  scheduledDate: Date;
  status: BookingDocument["status"];
  confirmationCode: string;
  cancellationReason: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface DeliveryView {
  id: string;
  packageId: string;
  bookingId: string;
  agentId: string;
  currentStatus: DeliveryDocument["currentStatus"];
  pickupTime: Date | null;
  estimatedDeliveryTime: Date | null;
  actualDeliveryTime: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface HistoryView {
  id: string;
  packageId: string;
  bookingId: string | null;
  agentId: string | null;
  status: DeliveryStatus;
  remarks: string;
  timestamp: Date;
  changedByUserId: string | null;
}

export interface AssignedAgentView {
  id: string;
  userId: string;
  name: string;
  agentCode: string;
  status: string;
  rating: number;
}

export interface AssignmentView {
  packageId: string;
  agentId: string | null;
  agentName: string | null;
  score: number | null;
  distanceKm: number | null;
  estimatedMinutes: number | null;
  reason: string | null;
  assignedAt: Date | null;
}

export interface PackageDetailsView {
  package: PackageView;
  assignment: AssignmentView;
  assignedAgent: AssignedAgentView | null;
  booking: BookingView | null;
  delivery: DeliveryView | null;
  history: HistoryView[];
}

export interface PackageListView {
  packages: PackageView[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface CreatePackageResult {
  package: PackageView;
  assignment: AssignmentView | null;
  booking: BookingView | null;
}

export interface AssignmentRetryResult {
  packageId: string;
  agentId: string | null;
  agentName: string | null;
  score: number | null;
  reason: string;
}

function toPackageView(packageDocument: PackageDocument): PackageView {
  return {
    id: packageDocument._id.toHexString(),
    trackingNumber: packageDocument.trackingNumber,
    customerId: packageDocument.customerId.toHexString(),
    packageType: packageDocument.packageType,
    description: packageDocument.description,
    weight: packageDocument.weight,
    sourceLocation: packageDocument.sourceLocation,
    destinationLocation: packageDocument.destinationLocation,
    serviceId: packageDocument.serviceId.toHexString(),
    scheduledDate: packageDocument.scheduledDate,
    status: packageDocument.status,
    assignedAgentId:
      packageDocument.assignedAgentId?.toHexString() ?? null,
    ...(packageDocument.assignmentScore === undefined
      ? {}
      : { assignmentScore: packageDocument.assignmentScore }),
    ...(packageDocument.assignmentDistanceKm === undefined
      ? {}
      : { assignmentDistanceKm: packageDocument.assignmentDistanceKm }),
    ...(packageDocument.assignmentEstimatedMinutes === undefined
      ? {}
      : {
          assignmentEstimatedMinutes:
            packageDocument.assignmentEstimatedMinutes,
        }),
    ...(packageDocument.assignmentReason === undefined
      ? {}
      : { assignmentReason: packageDocument.assignmentReason }),
    ...(packageDocument.assignedAt === undefined
      ? {}
      : { assignedAt: packageDocument.assignedAt }),
    createdAt: packageDocument.createdAt,
    updatedAt: packageDocument.updatedAt,
  };
}

function toBookingView(booking: BookingDocument): BookingView {
  return {
    id: booking._id.toHexString(),
    bookingNumber: booking.bookingNumber,
    packageId: booking.packageId.toHexString(),
    customerId: booking.customerId.toHexString(),
    agentId: booking.agentId.toHexString(),
    serviceId: booking.serviceId.toHexString(),
    bookingDate: booking.bookingDate,
    scheduledDate: booking.scheduledDate,
    status: booking.status,
    confirmationCode: booking.confirmationCode,
    cancellationReason: booking.cancellationReason,
    createdAt: booking.createdAt,
    updatedAt: booking.updatedAt,
  };
}

function toDeliveryView(delivery: DeliveryDocument): DeliveryView {
  return {
    id: delivery._id.toHexString(),
    packageId: delivery.packageId.toHexString(),
    bookingId: delivery.bookingId.toHexString(),
    agentId: delivery.agentId.toHexString(),
    currentStatus: delivery.currentStatus,
    pickupTime: delivery.pickupTime,
    estimatedDeliveryTime: delivery.estimatedDeliveryTime,
    actualDeliveryTime: delivery.actualDeliveryTime,
    createdAt: delivery.createdAt,
    updatedAt: delivery.updatedAt,
  };
}

function toHistoryView(history: DeliveryHistoryDocument): HistoryView {
  return {
    id: history._id.toHexString(),
    packageId: history.packageId.toHexString(),
    bookingId: history.bookingId?.toHexString() ?? null,
    agentId: history.agentId?.toHexString() ?? null,
    status: history.status,
    remarks: history.remarks,
    timestamp: history.timestamp,
    changedByUserId: history.changedByUserId?.toHexString() ?? null,
  };
}

function getQueryValue(value: unknown, fieldName: string): unknown {
  if (Array.isArray(value)) {
    throw new AppError(
      `${fieldName} must be provided once.`,
      400,
      "VALIDATION_ERROR",
    );
  }
  return value;
}

function getPositiveInteger(
  value: unknown,
  fieldName: string,
  fallback: number,
  maximum: number,
): number {
  const normalized = getQueryValue(value, fieldName);
  if (normalized === undefined) {
    return fallback;
  }
  if (
    typeof normalized !== "string" ||
    !/^\d+$/.test(normalized) ||
    Number(normalized) < 1 ||
    Number(normalized) > maximum
  ) {
    throw new AppError(
      `${fieldName} must be an integer between 1 and ${maximum}.`,
      400,
      "VALIDATION_ERROR",
    );
  }
  return Number(normalized);
}

function parseLocation(
  value: unknown,
  fieldName: string,
): LocationSnapshot {
  const location = getInputObject(value);
  return {
    address: getRequiredString(location.address, `${fieldName}.address`),
    city: getRequiredString(location.city, `${fieldName}.city`),
    state: getRequiredString(location.state, `${fieldName}.state`),
    postalCode: getRequiredString(
      location.postalCode,
      `${fieldName}.postalCode`,
    ),
    latitude: getNumber(
      location.latitude,
      `${fieldName}.latitude`,
      -90,
      90,
    ),
    longitude: getNumber(
      location.longitude,
      `${fieldName}.longitude`,
      -180,
      180,
    ),
  };
}

function parseScheduledDate(value: unknown): Date {
  if (typeof value !== "string" || value.trim() === "") {
    throw new AppError(
      "scheduledDate is required.",
      400,
      "VALIDATION_ERROR",
    );
  }
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    throw new AppError(
      "scheduledDate must be a valid date.",
      400,
      "VALIDATION_ERROR",
    );
  }
  return parsed;
}

function locationsAreIdentical(
  source: LocationSnapshot,
  destination: LocationSnapshot,
): boolean {
  return (
    source.address.toLowerCase() === destination.address.toLowerCase() &&
    source.city.toLowerCase() === destination.city.toLowerCase() &&
    source.state.toLowerCase() === destination.state.toLowerCase() &&
    source.postalCode === destination.postalCode &&
    source.latitude === destination.latitude &&
    source.longitude === destination.longitude
  );
}

export class PackageManagementService {
  constructor(
    private readonly getRepositories: () => PackageRepositories,
    private readonly getGraph: () => AgentGraphService,
  ) {}

  async create(
    customerIdValue: unknown,
    input: unknown,
  ): Promise<CreatePackageResult> {
    const customerId = getObjectId(customerIdValue, "Customer ID");
    const body = getInputObject(input);
    const packageType = getEnumValue(
      body.packageType,
      "packageType",
      PACKAGE_TYPES,
    );
    const description = getRequiredString(body.description, "description");
    const weight = getNumber(body.weight, "weight", Number.MIN_VALUE);
    const sourceLocation = parseLocation(
      body.sourceLocation,
      "sourceLocation",
    );
    const destinationLocation = parseLocation(
      body.destinationLocation,
      "destinationLocation",
    );
    if (locationsAreIdentical(sourceLocation, destinationLocation)) {
      throw new AppError(
        "sourceLocation and destinationLocation must be different.",
        400,
        "VALIDATION_ERROR",
      );
    }
    const serviceId = getObjectId(body.serviceId, "serviceId");
    const scheduledDate = parseScheduledDate(body.scheduledDate);
    const repositories = this.getRepositories();
    const customer = await repositories.users.findById(customerId);
    if (!customer || !customer.isActive || customer.role !== "CUSTOMER") {
      throw new AppError(
        "The authenticated customer account is not available.",
        403,
        "FORBIDDEN",
      );
    }

    const service = await repositories.services.findById(serviceId);
    if (!service) {
      throw new AppError("Service not found.", 404, "SERVICE_NOT_FOUND");
    }
    if (!service.isActive) {
      throw new AppError(
        "The selected service is inactive.",
        400,
        "SERVICE_INACTIVE",
      );
    }

    const assignmentService = this.createAssignmentService(repositories);
    const packageDocument = await repositories.packages.create({
      trackingNumber: await this.generateTrackingNumber(repositories),
      customerId,
      packageType,
      description,
      weight,
      sourceLocation,
      destinationLocation,
      serviceId,
      scheduledDate,
      status: "PENDING",
      assignedAgentId: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    let assignment: AssignmentResult | null;
    try {
      assignment = await assignmentService.findBestAgent(packageDocument);
    } catch (error) {
      await repositories.packages.deleteById(packageDocument._id);
      throw new AppError(
        "Automatic assignment is temporarily unavailable.",
        503,
        "ASSIGNMENT_UNAVAILABLE",
      );
    }

    if (!assignment) {
      const history = await repositories.histories.create({
        packageId: packageDocument._id,
        bookingId: null,
        agentId: null,
        status: "PENDING",
        remarks:
          "No delivery agents are currently available at this location.",
        timestamp: new Date(),
        changedByUserId: customerId,
      });
      return {
        package: toPackageView(packageDocument),
        assignment: {
          packageId: packageDocument._id.toHexString(),
          agentId: null,
          agentName: null,
          score: null,
          distanceKm: null,
          estimatedMinutes: null,
          reason: history.remarks,
          assignedAt: null,
        },
        booking: null,
      };
    }

    return this.completeAssignment(
      packageDocument,
      assignment,
      customer,
      repositories,
    );
  }

  async listMine(
    customerIdValue: unknown,
    queryInput: unknown,
  ): Promise<PackageListView> {
    const customerId = getObjectId(customerIdValue, "Customer ID");
    const query = this.parseQuery(queryInput, true);
    query.customerId = customerId;
    return this.listWithQuery(query);
  }

  async listAll(queryInput: unknown): Promise<PackageListView> {
    return this.listWithQuery(this.parseQuery(queryInput, false));
  }

  async listAssigned(
    agentUserIdValue: unknown,
    queryInput: unknown,
  ): Promise<PackageListView> {
    const agentUserId = getObjectId(agentUserIdValue, "Agent user ID");
    const repositories = this.getRepositories();
    const agent = await repositories.agents.findByUserId(agentUserId);
    if (!agent) {
      throw new AppError(
        "The authenticated agent profile is not available.",
        403,
        "FORBIDDEN",
      );
    }
    const query = this.parseQuery(queryInput, false);
    query.agentId = agent._id;
    return this.listWithQuery(query);
  }

  async getById(
    id: unknown,
    auth: AuthenticatedUser,
  ): Promise<PackageDetailsView> {
    const packageId = getObjectId(id, "Package ID");
    const repositories = this.getRepositories();
    const packageDocument = await repositories.packages.findById(packageId);
    if (!packageDocument) {
      throw new AppError("Package not found.", 404, "PACKAGE_NOT_FOUND");
    }
    await this.assertPackageAccess(packageDocument, auth, repositories);
    return this.getDetails(packageDocument, repositories);
  }

  async retryAssignment(
    id: unknown,
  ): Promise<AssignmentRetryResult> {
    const packageId = getObjectId(id, "Package ID");
    const repositories = this.getRepositories();
    const packageDocument = await repositories.packages.findById(packageId);
    if (!packageDocument) {
      throw new AppError("Package not found.", 404, "PACKAGE_NOT_FOUND");
    }
    if (packageDocument.assignedAgentId) {
      throw new AppError(
        "This package already has an assigned agent.",
        409,
        "PACKAGE_ALREADY_ASSIGNED",
      );
    }
    if (packageDocument.status !== "PENDING") {
      throw new AppError(
        "Only PENDING packages can be assigned.",
        400,
        "INVALID_PACKAGE_STATUS",
      );
    }

    const assignmentService = this.createAssignmentService(repositories);
    let assignment: AssignmentResult | null;
    try {
      assignment = await assignmentService.findBestAgent(packageDocument);
    } catch (_error) {
      throw new AppError(
        "Automatic assignment is temporarily unavailable.",
        503,
        "ASSIGNMENT_UNAVAILABLE",
      );
    }

    if (!assignment) {
      await repositories.histories.create({
        packageId: packageDocument._id,
        bookingId: null,
        agentId: null,
        status: "PENDING",
        remarks:
          "No delivery agents are currently available at this location.",
        timestamp: new Date(),
        changedByUserId: null,
      });
      return {
        packageId: packageDocument._id.toHexString(),
        agentId: null,
        agentName: null,
        score: null,
        reason: "No delivery agents are currently available at this location.",
      };
    }

    const customer = await repositories.users.findById(
      packageDocument.customerId,
    );
    if (!customer) {
      throw new AppError(
        "Package customer not found.",
        500,
        "DATA_INTEGRITY_ERROR",
      );
    }
    await this.completeAssignment(
      packageDocument,
      assignment,
      customer,
      repositories,
    );

    return {
      packageId: packageDocument._id.toHexString(),
      agentId: assignment.agent._id.toHexString(),
      agentName: assignment.user.fullName,
      score: assignment.score,
      reason: assignment.reason,
    };
  }

  async getAssignment(
    id: unknown,
    auth: AuthenticatedUser,
  ): Promise<AssignmentView> {
    const details = await this.getById(id, auth);
    return details.assignment;
  }

  private async listWithQuery(
    query: PackageQuery,
  ): Promise<PackageListView> {
    const repositories = this.getRepositories();
    const filter: Filter<PackageDocument> = {};
    if (query.status) filter.status = query.status;
    if (query.agentId) filter.assignedAgentId = query.agentId;
    if (query.customerId) filter.customerId = query.customerId;
    if (query.serviceId) filter.serviceId = query.serviceId;
    if (query.fromDate || query.toDate) {
      filter.scheduledDate = {
        ...(query.fromDate ? { $gte: query.fromDate } : {}),
        ...(query.toDate ? { $lte: query.toDate } : {}),
      };
    }

    const [packages, total] = await Promise.all([
      repositories.packages.findMany(filter, {
        sort: { createdAt: -1 },
        skip: (query.page - 1) * query.limit,
        limit: query.limit,
      }),
      repositories.packages.count(filter),
    ]);

    return {
      packages: packages.map(toPackageView),
      pagination: {
        page: query.page,
        limit: query.limit,
        total,
        totalPages: total === 0 ? 0 : Math.ceil(total / query.limit),
      },
    };
  }

  private parseQuery(
    input: unknown,
    customerQuery: boolean,
  ): PackageQuery {
    const query = getInputObject(input);
    const parsed: PackageQuery = {
      page: getPositiveInteger(query.page, "page", 1, 100000),
      limit: getPositiveInteger(query.limit, "limit", 20, 100),
    };

    if (query.status !== undefined) {
      parsed.status = getEnumValue(
        getQueryValue(query.status, "status"),
        "status",
        DELIVERY_STATUSES,
      );
    }

    if (!customerQuery && query.agentId !== undefined) {
      parsed.agentId = getObjectId(
        getQueryValue(query.agentId, "agentId"),
        "agentId",
      );
    }
    if (!customerQuery && query.customerId !== undefined) {
      parsed.customerId = getObjectId(
        getQueryValue(query.customerId, "customerId"),
        "customerId",
      );
    }
    if (!customerQuery && query.serviceId !== undefined) {
      parsed.serviceId = getObjectId(
        getQueryValue(query.serviceId, "serviceId"),
        "serviceId",
      );
    }

    if (!customerQuery) {
      const fromDate = this.parseOptionalQueryDate(
        query.fromDate,
        "fromDate",
      );
      const toDate = this.parseOptionalQueryDate(query.toDate, "toDate");
      parsed.fromDate = fromDate;
      parsed.toDate = toDate;
      if (fromDate && toDate && fromDate > toDate) {
        throw new AppError(
          "fromDate must be before toDate.",
          400,
          "VALIDATION_ERROR",
        );
      }
    }

    return parsed;
  }

  private parseOptionalQueryDate(
    value: unknown,
    fieldName: string,
  ): Date | undefined {
    const normalized = getQueryValue(value, fieldName);
    if (normalized === undefined) return undefined;
    if (typeof normalized !== "string") {
      throw new AppError(
        `${fieldName} must be a valid date.`,
        400,
        "VALIDATION_ERROR",
      );
    }
    const date = new Date(normalized);
    if (Number.isNaN(date.getTime())) {
      throw new AppError(
        `${fieldName} must be a valid date.`,
        400,
        "VALIDATION_ERROR",
      );
    }
    return date;
  }

  private async completeAssignment(
    packageDocument: PackageDocument,
    assignment: AssignmentResult,
    customer: UserDocument,
    repositories: PackageRepositories,
  ): Promise<CreatePackageResult> {
    const now = assignment.assignedAt;
    let booking: BookingDocument | null = null;
    let delivery: DeliveryDocument | null = null;
    let history: DeliveryHistoryDocument | null = null;
    let workloadUpdated = false;

    try {
      const bookingDate = now;
      booking = await repositories.bookings.create({
        bookingNumber: await this.generateBookingNumber(repositories),
        packageId: packageDocument._id,
        customerId: packageDocument.customerId,
        agentId: assignment.agent._id,
        serviceId: packageDocument.serviceId,
        bookingDate,
        scheduledDate: packageDocument.scheduledDate,
        status: "CONFIRMED",
        confirmationCode:
          await this.generateConfirmationCode(repositories),
        cancellationReason: null,
        createdAt: now,
        updatedAt: now,
      });

      delivery = await repositories.deliveries.create({
        packageId: packageDocument._id,
        bookingId: booking._id,
        agentId: assignment.agent._id,
        currentStatus: "AGENT_ASSIGNED",
        pickupTime: null,
        estimatedDeliveryTime: new Date(
          packageDocument.scheduledDate.getTime() +
            assignment.estimatedMinutes * 60 * 1000,
        ),
        actualDeliveryTime: null,
        otpHash: null,
        otpExpiresAt: null,
        createdAt: now,
        updatedAt: now,
      });

      history = await repositories.histories.create({
        packageId: packageDocument._id,
        bookingId: booking._id,
        agentId: assignment.agent._id,
        status: "AGENT_ASSIGNED",
        remarks: "An agent was automatically assigned.",
        timestamp: now,
        changedByUserId: customer._id,
      });

      const updatedAgent = await repositories.agents.updateById(
        assignment.agent._id,
        {
          $inc: { activeDeliveries: 1 },
          $set: { updatedAt: now },
        },
      );
      if (!updatedAgent) {
        throw new Error("Assigned agent could not be updated.");
      }
      workloadUpdated = true;

      const updatedPackage = await repositories.packages.updateById(
        packageDocument._id,
        {
          $set: {
            status: "AGENT_ASSIGNED",
            assignedAgentId: assignment.agent._id,
            assignmentScore: assignment.score,
            assignmentDistanceKm: assignment.distanceKm,
            assignmentEstimatedMinutes: assignment.estimatedMinutes,
            assignmentReason: assignment.reason,
            assignedAt: now,
            updatedAt: now,
          },
        },
      );
      if (!updatedPackage) {
        throw new Error("Assigned package could not be updated.");
      }

      await this.createNotifications(
        packageDocument,
        assignment,
        repositories.notifications,
      );

      return {
        package: toPackageView(updatedPackage),
        assignment: this.toAssignmentView(updatedPackage, assignment),
        booking: toBookingView(booking),
      };
    } catch (error) {
      if (workloadUpdated) {
        await repositories.agents
          .updateById(assignment.agent._id, {
            $inc: { activeDeliveries: -1 },
            $set: { updatedAt: new Date() },
          })
          .catch(() => undefined);
      }
      if (history) {
        await repositories.histories
          .deleteById(history._id)
          .catch(() => undefined);
      }
      if (delivery) {
        await repositories.deliveries
          .deleteById(delivery._id)
          .catch(() => undefined);
      }
      if (booking) {
        await repositories.bookings
          .deleteById(booking._id)
          .catch(() => undefined);
      }
      throw new AppError(
        "The delivery request could not be assigned consistently.",
        500,
        "ASSIGNMENT_WORKFLOW_FAILED",
      );
    }
  }

  private async createNotifications(
    packageDocument: PackageDocument,
    assignment: AssignmentResult,
    notifications: NotificationRepository,
  ): Promise<void> {
    const records: Omit<NotificationDocument, "_id">[] = [
      {
        userId: packageDocument.customerId,
        type: "BOOKING_CONFIRMED",
        title: "Delivery request created and agent assigned.",
        message: `Agent ${assignment.user.fullName} has been assigned to your delivery request.`,
        isRead: false,
        relatedId: packageDocument._id,
        createdAt: new Date(),
      },
      {
        userId: assignment.agent.userId,
        type: "AGENT_ASSIGNED",
        title: "New delivery assigned.",
        message: `You have been assigned delivery ${packageDocument.trackingNumber}.`,
        isRead: false,
        relatedId: packageDocument._id,
        createdAt: new Date(),
      },
    ];

    for (const record of records) {
      try {
        await notifications.create(record);
      } catch (error) {
        console.warn(
          `Notification creation failed: ${
            error instanceof Error ? error.message : String(error)
          }`,
        );
      }
    }
  }

  private async getDetails(
    packageDocument: PackageDocument,
    repositories: PackageRepositories,
  ): Promise<PackageDetailsView> {
    const [booking, delivery, history, assignedAgent] =
      await Promise.all([
        repositories.bookings.findByPackageId(packageDocument._id),
        repositories.deliveries.findByPackageId(packageDocument._id),
        repositories.histories.findByPackageId(packageDocument._id),
        this.getAssignedAgent(
          packageDocument.assignedAgentId,
          repositories,
        ),
      ]);

    return {
      package: toPackageView(packageDocument),
      assignment: this.toAssignmentView(
        packageDocument,
        undefined,
        assignedAgent?.name ?? null,
      ),
      assignedAgent,
      booking: booking ? toBookingView(booking) : null,
      delivery: delivery ? toDeliveryView(delivery) : null,
      history: history.map(toHistoryView),
    };
  }

  private toAssignmentView(
    packageDocument: PackageDocument,
    assignment?: AssignmentResult,
    assignedAgentName?: string | null,
  ): AssignmentView {
    return {
      packageId: packageDocument._id.toHexString(),
      agentId:
        packageDocument.assignedAgentId?.toHexString() ??
        assignment?.agent._id.toHexString() ??
        null,
      agentName:
        assignment?.user.fullName ??
        assignedAgentName ??
        null,
      score:
        packageDocument.assignmentScore ??
        assignment?.score ??
        null,
      distanceKm:
        packageDocument.assignmentDistanceKm ??
        assignment?.distanceKm ??
        null,
      estimatedMinutes:
        packageDocument.assignmentEstimatedMinutes ??
        assignment?.estimatedMinutes ??
        null,
      reason:
        packageDocument.assignmentReason ??
        assignment?.reason ??
        (packageDocument.status === "PENDING"
          ? "No agent is currently assigned."
          : null),
      assignedAt:
        packageDocument.assignedAt ??
        assignment?.assignedAt ??
        null,
    };
  }

  private async getAssignedAgent(
    agentId: ObjectId | null,
    repositories: PackageRepositories,
  ): Promise<AssignedAgentView | null> {
    if (!agentId) return null;
    const agent = await repositories.agents.findById(agentId);
    if (!agent) return null;
    const user = await repositories.users.findById(agent.userId);
    if (!user) return null;
    return {
      id: agent._id.toHexString(),
      userId: user._id.toHexString(),
      name: user.fullName,
      agentCode: agent.agentCode,
      status: agent.status,
      rating: agent.rating,
    };
  }

  private async assertPackageAccess(
    packageDocument: PackageDocument,
    auth: AuthenticatedUser,
    repositories: PackageRepositories,
  ): Promise<void> {
    if (auth.role === "ADMIN") return;
    const userId = getObjectId(auth.userId, "User ID");
    if (
      auth.role === "CUSTOMER" &&
      packageDocument.customerId.equals(userId)
    ) {
      return;
    }
    if (auth.role === "AGENT") {
      const agent = await repositories.agents.findByUserId(userId);
      if (
        agent &&
        packageDocument.assignedAgentId?.equals(agent._id)
      ) {
        return;
      }
    }
    throw new AppError(
      "You do not have permission to access this package.",
      403,
      "FORBIDDEN",
    );
  }

  private createAssignmentService(
    repositories: PackageRepositories,
  ): AssignmentService {
    try {
      return new AssignmentService(
        repositories.agents,
        repositories.locations,
        repositories.users,
        this.getGraph(),
      );
    } catch (_error) {
      throw new AppError(
        "Automatic assignment is temporarily unavailable.",
        503,
        "ASSIGNMENT_UNAVAILABLE",
      );
    }
  }

  private async generateTrackingNumber(
    repositories: PackageRepositories,
  ): Promise<string> {
    return this.generateUniqueIdentifier(
      "DLV",
      (value) => repositories.packages.findByTrackingNumber(value),
    );
  }

  private async generateBookingNumber(
    repositories: PackageRepositories,
  ): Promise<string> {
    return this.generateUniqueIdentifier(
      "BK",
      (value) => repositories.bookings.findByBookingNumber(value),
    );
  }

  private async generateConfirmationCode(
    repositories: PackageRepositories,
  ): Promise<string> {
    return this.generateUniqueIdentifier(
      "CNF",
      (value) => repositories.bookings.findByConfirmationCode(value),
    );
  }

  private async generateUniqueIdentifier(
    prefix: string,
    exists: (value: string) => Promise<unknown>,
  ): Promise<string> {
    for (let attempt = 0; attempt < 5; attempt += 1) {
      const year = new Date().getFullYear();
      const token = randomUUID().replace(/-/g, "");
      const numericSuffix = String(
        Number.parseInt(token.slice(0, 8), 16) % 100000,
      ).padStart(5, "0");
      const value =
        prefix === "CNF"
          ? `CNF${numericSuffix}`
          : `${prefix}-${year}-${numericSuffix}`;
      if (!(await exists(value))) {
        return value;
      }
    }
    throw new AppError(
      "A unique delivery identifier could not be generated.",
      500,
      "IDENTIFIER_GENERATION_FAILED",
    );
  }
}
