import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { forkJoin, finalize } from 'rxjs';

import { PackageService } from '../../../core/services/package.service';
import { AgentService } from '../../../core/services/agent.service';
import { UserService } from '../../../core/services/user.service';
import { StatCardComponent } from '../../../shared/components/stat-card.component';
import { StatusBadgeComponent } from '../../../shared/components/status-badge.component';
import { LoadingSpinnerComponent } from '../../../shared/components/loading-spinner.component';
import { ErrorStateComponent } from '../../../shared/components/error-state.component';
import { EmptyStateComponent } from '../../../shared/components/empty-state.component';
import { PackageView } from '../../../core/models/package.model';

@Component({
  selector: 'dh-admin-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    StatCardComponent,
    StatusBadgeComponent,
    LoadingSpinnerComponent,
    ErrorStateComponent,
    EmptyStateComponent,
  ],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss',
})
export class AdminDashboardComponent implements OnInit {
  private readonly packageService = inject(PackageService);
  private readonly agentService = inject(AgentService);
  private readonly userService = inject(UserService);

  readonly loading = signal(true);
  readonly error = signal<string | null>(null);

  readonly totalUsers = signal(0);
  readonly totalAgents = signal(0);
  readonly agentsAvailable = signal(0);
  readonly totalPackages = signal(0);
  readonly pendingPackages = signal(0);
  readonly recentPackages = signal<PackageView[]>([]);

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.error.set(null);

    forkJoin({
      users: this.userService.list(),
      agents: this.agentService.list(),
      packages: this.packageService.listAll({ limit: 100 }),
    })
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: ({ users, agents, packages }) => {
          this.totalUsers.set(users.data.users.length);
          this.totalAgents.set(agents.data.agents.length);
          this.agentsAvailable.set(agents.data.agents.filter((a) => a.status === 'AVAILABLE').length);
          this.totalPackages.set(packages.data.pagination.total);
          this.pendingPackages.set(packages.data.packages.filter((p) => p.status === 'PENDING').length);
          this.recentPackages.set(packages.data.packages.slice(0, 6));
        },
        error: () => this.error.set('Could not load dashboard data.'),
      });
  }
}
