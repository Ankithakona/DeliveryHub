import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { finalize } from 'rxjs';

import { PackageService } from '../../../core/services/package.service';
import { AuthService } from '../../../core/services/auth.service';
import { PackageView } from '../../../core/models/package.model';
import { StatCardComponent } from '../../../shared/components/stat-card.component';
import { StatusBadgeComponent } from '../../../shared/components/status-badge.component';
import { LoadingSpinnerComponent } from '../../../shared/components/loading-spinner.component';
import { EmptyStateComponent } from '../../../shared/components/empty-state.component';
import { ErrorStateComponent } from '../../../shared/components/error-state.component';

@Component({
  selector: 'dh-customer-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    StatCardComponent,
    StatusBadgeComponent,
    LoadingSpinnerComponent,
    EmptyStateComponent,
    ErrorStateComponent,
  ],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss',
})
export class CustomerDashboardComponent implements OnInit {
  private readonly packageService = inject(PackageService);
  readonly auth = inject(AuthService);

  readonly loading = signal(true);
  readonly error = signal<string | null>(null);
  readonly packages = signal<PackageView[]>([]);

  readonly activeCount = signal(0);
  readonly deliveredCount = signal(0);
  readonly pendingCount = signal(0);

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.error.set(null);

    this.packageService
      .listMine({ limit: 100 })
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (response) => {
          const items = response.data.packages;
          this.packages.set(items.slice(0, 5));
          this.activeCount.set(
            items.filter((p) => !['DELIVERED', 'CANCELLED', 'FAILED'].includes(p.status)).length,
          );
          this.deliveredCount.set(items.filter((p) => p.status === 'DELIVERED').length);
          this.pendingCount.set(items.filter((p) => p.status === 'PENDING').length);
        },
        error: () => this.error.set('Could not load your deliveries.'),
      });
  }
}
