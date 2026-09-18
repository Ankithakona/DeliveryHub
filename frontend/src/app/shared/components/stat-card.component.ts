import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'dh-stat-card',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="stat-card">
      <span class="stat-label">{{ label }}</span>
      <span class="stat-value">{{ value }}</span>
      @if (hint) { <span class="stat-hint">{{ hint }}</span> }
    </div>
  `,
  styles: [`
    .stat-card {
      display: flex;
      flex-direction: column;
      gap: var(--space-1);
      padding: var(--space-5);
      background: var(--color-surface);
      border: 1px solid var(--color-border);
      border-radius: var(--radius-md);
      box-shadow: var(--shadow-sm);
    }
    .stat-label {
      font-size: 12.5px;
      font-weight: 600;
      color: var(--color-text-secondary);
      text-transform: uppercase;
      letter-spacing: 0.03em;
    }
    .stat-value {
      font-family: var(--font-display);
      font-size: 26px;
      font-weight: 700;
      color: var(--color-text);
    }
    .stat-hint { font-size: 12.5px; color: var(--color-muted); }
  `],
})
export class StatCardComponent {
  @Input({ required: true }) label = '';
  @Input({ required: true }) value: string | number = '';
  @Input() hint = '';
}
