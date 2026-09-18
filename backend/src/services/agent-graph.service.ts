import {
  type AgentGraphCandidate,
  AgentGraphRepository,
} from "../repositories/neo4j/agent-graph.repository";

export interface AgentGraphLocation {
  locationId: string;
  name: string;
  city: string;
  /** State/UT of the location — required for state-based eligibility matching. */
  state: string;
  latitude?: number;
  longitude?: number;
}

export interface AgentGraphServiceNode {
  serviceId: string;
  serviceCode: string;
}

export interface AgentGraphSyncInput {
  agentId: string;
  agentName: string;
  servedLocationIds?: string[];
  availableLocationIds?: string[];
  offeredServiceIds?: string[];
  servedLocations?: AgentGraphLocation[];
  availableLocations?: AgentGraphLocation[];
  offeredServices?: AgentGraphServiceNode[];
}

export class AgentGraphService {
  constructor(private readonly repository: AgentGraphRepository) {}

  async syncAgent(input: AgentGraphSyncInput): Promise<void> {
    await this.repository.upsertAgent(input.agentId, input.agentName);

    const servedLocations   = input.servedLocations   ?? [];
    const availableLocations = input.availableLocations ?? [];
    const offeredServices   = input.offeredServices   ?? [];
    const servedLocationIds = [
      ...(input.servedLocationIds   ?? []),
      ...servedLocations.map((l) => l.locationId),
    ];
    const availableLocationIds = [
      ...(input.availableLocationIds ?? []),
      ...availableLocations.map((l) => l.locationId),
    ];
    const offeredServiceIds = [
      ...(input.offeredServiceIds ?? []),
      ...offeredServices.map((s) => s.serviceId),
    ];

    // Upsert all location and service nodes (now includes state + coords).
    await Promise.all([
      ...[...servedLocations, ...availableLocations].map((location) =>
        this.repository.upsertLocation(
          location.locationId,
          location.name,
          location.city,
          location.state,
          location.latitude,
          location.longitude,
        ),
      ),
      ...offeredServices.map((service) =>
        this.repository.upsertService(service.serviceId, service.serviceCode),
      ),
    ]);

    await Promise.all(
      [...new Set(servedLocationIds)].map((locationId) =>
        this.repository.linkAgentToLocation(input.agentId, locationId),
      ),
    );

    await Promise.all(
      [...new Set(availableLocationIds)].map((locationId) =>
        this.repository.linkAgentToLocation(
          input.agentId,
          locationId,
          "AVAILABLE_IN",
        ),
      ),
    );

    await Promise.all(
      [...new Set(offeredServiceIds)].map((serviceId) =>
        this.repository.linkAgentToService(input.agentId, serviceId),
      ),
    );
  }

  async syncLocation(location: AgentGraphLocation): Promise<void> {
    await this.repository.upsertLocation(
      location.locationId,
      location.name,
      location.city,
      location.state,
      location.latitude,
      location.longitude,
    );
  }

  async syncService(service: AgentGraphServiceNode): Promise<void> {
    await this.repository.upsertService(
      service.serviceId,
      service.serviceCode,
    );
  }

  /** Legacy exact-locationId query — still available for admin/retry flows. */
  async findEligibleAgents(
    sourceLocationId: string,
    destinationLocationId: string,
    serviceId: string,
  ): Promise<AgentGraphCandidate[]> {
    return this.repository.findEligibleAgents(
      sourceLocationId,
      destinationLocationId,
      serviceId,
    );
  }

  /**
   * Primary assignment query.  Matches agents by state so any valid Indian
   * location can be served without pre-seeding the exact city in the DB.
   */
  async findEligibleAgentsByState(
    sourceState: string,
    destinationState: string,
    serviceId: string,
  ): Promise<AgentGraphCandidate[]> {
    return this.repository.findEligibleAgentsByState(
      sourceState,
      destinationState,
      serviceId,
    );
  }
}