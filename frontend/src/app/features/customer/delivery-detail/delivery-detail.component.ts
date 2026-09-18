import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { finalize } from 'rxjs';

import { PackageService } from '../../../core/services/package.service';
import { PackageDetailsView } from '../../../core/models/package.model';
import { StatusBadgeComponent } from '../../../shared/components/status-badge.component';
import { LoadingSpinnerComponent } from '../../../shared/components/loading-spinner.component';
import { ErrorStateComponent } from '../../../shared/components/error-state.component';

@Component({
  selector: 'dh-delivery-detail',
  standalone: true,
  imports: [CommonModule, RouterLink, StatusBadgeComponent, LoadingSpinnerComponent, ErrorStateComponent],
  templateUrl: './delivery-detail.component.html',
  styleUrl: './delivery-detail.component.scss',
})
export class DeliveryDetailComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly packageService = inject(PackageService);

  readonly loading = signal(true);
  readonly error = signal<string | null>(null);
  readonly details = signal<PackageDetailsView | null>(null);

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) return;

    this.loading.set(true);
    this.error.set(null);

    this.packageService
      .getById(id)
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (response) => this.details.set(response.data),
        error: () => this.error.set('Could not load this delivery. It may not exist, or you may not have access.'),
      });
  }
}
