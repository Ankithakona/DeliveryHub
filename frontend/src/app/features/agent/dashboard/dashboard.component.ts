import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { finalize } from 'rxjs';

import { AuthService } from '../../../core/services/auth.service';
import { PackageService } from '../../../core/services/package.service';
import { PackageView } from '../../../core/models/package.model';
import { EmptyStateComponent } from '../../../shared/components/empty-state.component';
import { StatusBadgeComponent } from '../../../shared/components/status-badge.component';
import { LoadingSpinnerComponent } from '../../../shared/components/loading-spinner.component';
import { ErrorStateComponent } from '../../../shared/components/error-state.component';

@Component({
  selector: 'dh-agent-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink, EmptyStateComponent, StatusBadgeComponent, LoadingSpinnerComponent, ErrorStateComponent],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss',
})
export class AgentDashboardComponent implements OnInit {
  readonly auth = inject(AuthService);
  private readonly packageService = inject(PackageService);
  private readonly router = inject(Router);

  readonly trackingId = signal('');
  readonly loading = signal(true);
  readonly error = signal<string | null>(null);
  readonly packages = signal<PackageView[]>([]);

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.error.set(null);
    this.packageService
      .listAssigned({ limit: 100 })
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (response) => this.packages.set(response.data.packages),
        error: () => this.error.set('Could not load your assigned deliveries.'),
      });
  }

  openDelivery(): void {
    const id = this.trackingId().trim();
    if (id) {
      this.router.navigate(['/agent/deliveries', id]);
    }
  }
}
