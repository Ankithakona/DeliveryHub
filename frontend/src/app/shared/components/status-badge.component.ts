import { Component, Input, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';

export type StatusTone = 'neutral' | 'info' | 'success' | 'warning' | 'error';

const DELIVERY_STATUS_TONES: Record<string, StatusTone> = {
  PENDING: 'neutral',
  AGENT_ASSIGNED: 'info',
  PICKED_UP: 'info',
  IN_TRANSIT: 'info',
  OUT_FOR_DELIVERY: 'info',
  DELIVERED: 'success',
  COMPLETED: 'success',
  CONFIRMED: 'success',
  CANCELLED: 'error',
  FAILED: 'error',
  RESCHEDULED: 'warning',
  AVAILABLE: 'success',
  BUSY: 'warning',
  OFFLINE: 'neutral',
  SUSPENDED: 'error',
  ACTIVE: 'success',
  INACTIVE: 'neutral',
};

/** Renders a status pill; color derived from the exact backend enum string, never guessed. */
@Component({
  selector: 'dh-status-badge',
  standalone: true,
  imports: [CommonModule],
  template: `<span class="badge" [class]="'tone-' + tone()">{{ label() }}</span>`,
  styles: [`
    .badge {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 3px 10px;
      border-radius: 999px;
      font-size: 12px;
      font-weight: 600;
      letter-spacing: 0.01em;
      white-space: nowrap;
    }
    .badge::before {
      content: '';
      width: 6px;
      height: 6px;
      border-radius: 50%;
      background: currentColor;
    }
    .tone-neutral { background: var(--color-background); color: var(--color-text-secondary); border: 1px solid var(--color-border); }
    .tone-info { background: var(--color-info-soft); color: var(--color-info); }
    .tone-success { background: var(--color-success-soft); color: var(--color-success); }
    .tone-warning { background: var(--color-warning-soft); color: var(--color-warning); }
    .tone-error { background: var(--color-error-soft); color: var(--color-error); }
  `],
})
export class StatusBadgeComponent {
  private readonly statusValue = signal<string>('');

  @Input({ required: true })
  set status(value: string) {
    this.statusValue.set(value ?? '');
  }

  readonly tone = computed<StatusTone>(() => DELIVERY_STATUS_TONES[this.statusValue()] ?? 'neutral');
  readonly label = computed(() =>
    this.statusValue()
      .split('_')
      .map((word) => word.charAt(0) + word.slice(1).toLowerCase())
      .join(' '),
  );
}
