import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { finalize } from 'rxjs';

import { AgentService } from '../../../core/services/agent.service';
import { AgentView } from '../../../core/models/agent.model';
import { AGENT_STATUSES, VEHICLE_TYPES } from '../../../core/models/enums.model';
import { ErrorResponse } from '../../../core/models/api-response.model';
import { LoadingSpinnerComponent } from '../../../shared/components/loading-spinner.component';
import { StatusBadgeComponent } from '../../../shared/components/status-badge.component';
import { ToastService } from '../../../shared/components/toast.service';

@Component({
  selector: 'dh-admin-agent-detail',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink, LoadingSpinnerComponent, StatusBadgeComponent],
  templateUrl: './agent-detail.component.html',
  styleUrl: './agent-detail.component.scss',
})
export class AdminAgentDetailComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly agentService = inject(AgentService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly toast = inject(ToastService);

  readonly vehicleTypes = VEHICLE_TYPES;
  readonly statuses = AGENT_STATUSES;
  readonly isNew = signal(true);
  readonly agentId = signal<string | null>(null);
  readonly loading = signal(true);
  readonly saving = signal(false);
  readonly errorMessage = signal<string | null>(null);
  readonly agent = signal<AgentView | null>(null);

  readonly form = this.fb.nonNullable.group({
    userId: ['', [Validators.required]],
    agentCode: ['', [Validators.required]],
    vehicleType: ['BIKE', [Validators.required]],
    status: ['OFFLINE', [Validators.required]],
  });

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id || id === 'new') {
      this.isNew.set(true);
      this.loading.set(false);
      return;
    }

    this.isNew.set(false);
    this.agentId.set(id);
    this.load(id);
  }

  load(id: string): void {
    this.loading.set(true);
    this.agentService
      .getById(id)
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (response) => {
          this.agent.set(response.data.agent);
          this.form.patchValue({
            userId: response.data.agent.user.id,
            agentCode: response.data.agent.agentCode,
            vehicleType: response.data.agent.vehicleType,
            status: response.data.agent.status,
          });
        },
        error: () => this.errorMessage.set('Could not load this agent.'),
      });
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const value = this.form.getRawValue();
    this.errorMessage.set(null);
    this.saving.set(true);

    const request$ = this.isNew()
      ? this.agentService.create(value as any)
      : this.agentService.update(this.agentId()!, value as any);

    request$.pipe(finalize(() => this.saving.set(false))).subscribe({
      next: () => {
        this.toast.show(this.isNew() ? 'Agent created.' : 'Agent updated.', 'success');
        this.router.navigate(['/admin/agents']);
      },
      error: (error: HttpErrorResponse) => {
        const body = error.error as ErrorResponse | undefined;
        this.errorMessage.set(body?.message ?? 'Could not save this agent.');
      },
    });
  }

  changeStatus(status: string): void {
    if (this.isNew() || !this.agentId()) return;
    this.agentService.updateStatus(this.agentId()!, status as any).subscribe({
      next: (response) => {
        this.agent.set(response.data.agent);
        this.toast.show('Agent status updated.', 'success');
      },
      error: (error: HttpErrorResponse) => {
        const body = error.error as ErrorResponse | undefined;
        this.toast.show(body?.message ?? 'Could not update status.', 'error');
      },
    });
  }
}
