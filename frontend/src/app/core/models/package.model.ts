import { BookingStatus, DeliveryStatus, PackageType } from './enums.model';
import { LocationSnapshot } from './location.model';

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
  scheduledDate: string;
  status: DeliveryStatus;
  assignedAgentId: string | null;
  assignmentScore?: number;
  assignmentDistanceKm?: number;
  assignmentEstimatedMinutes?: number;
  assignmentReason?: string;
  assignedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface BookingView {
  id: string;
  bookingNumber: string;
  packageId: string;
  customerId: string;
  agentId: string;
  serviceId: string;
  bookingDate: string;
  scheduledDate: string;
  status: BookingStatus;
  confirmationCode: string;
  cancellationReason: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface DeliveryView {
  id: string;
  packageId: string;
  bookingId: string;
  agentId: string;
  currentStatus: DeliveryStatus;
  pickupTime: string | null;
  estimatedDeliveryTime: string | null;
  actualDeliveryTime: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface HistoryView {
  id: string;
  packageId: string;
  bookingId: string | null;
  agentId: string | null;
  status: DeliveryStatus;
  remarks: string;
  timestamp: string;
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
  assignedAt: string | null;
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

export interface CreatePackagePayload {
  packageType: PackageType;
  description: string;
  weight: number;
  sourceLocation: LocationSnapshot;
  destinationLocation: LocationSnapshot;
  serviceId: string;
  scheduledDate: string;
}

export interface PackageListQuery {
  status?: DeliveryStatus;
  agentId?: string;
  customerId?: string;
  serviceId?: string;
  fromDate?: string;
  toDate?: string;
  page?: number;
  limit?: number;
}
