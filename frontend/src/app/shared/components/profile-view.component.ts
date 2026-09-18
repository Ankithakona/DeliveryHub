import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';

import { AuthService } from '../../core/services/auth.service';
import { StatusBadgeComponent } from './status-badge.component';

@Component({
  selector: 'dh-profile-view',
  standalone: true,
  imports: [CommonModule, StatusBadgeComponent],
  template: `
    <div class="page-header">
      <div>
        <h1>Profile</h1>
        <p class="subtitle">Your account details on file with DeliveryHub.</p>
      </div>
    </div>

    <div class="card profile-card">
      <div class="profile-row">
        <span class="profile-label">Full name</span>
        <span class="profile-value">{{ auth.currentUser()?.fullName }}</span>
      </div>
      <div class="profile-row">
        <span class="profile-label">Email</span>
        <span class="profile-value">{{ auth.currentUser()?.email }}</span>
      </div>
      <div class="profile-row">
        <span class="profile-label">Phone</span>
        <span class="profile-value">{{ auth.currentUser()?.phone }}</span>
      </div>
      <div class="profile-row">
        <span class="profile-label">Role</span>
        <span class="profile-value">{{ auth.currentUser()?.role }}</span>
      </div>
      <div class="profile-row">
        <span class="profile-label">Account status</span>
        <dh-status-badge [status]="auth.currentUser()?.isActive ? 'ACTIVE' : 'INACTIVE'"></dh-status-badge>
      </div>
    </div>

    <p class="edit-note">
      Profile edits are managed by an administrator. There is currently no self-service
      profile update endpoint exposed to your account role.
    </p>
  `,
  styles: [`
    .profile-card { max-width: 480px; display: flex; flex-direction: column; gap: var(--space-4); }
    .profile-row { display: flex; align-items: center; justify-content: space-between; padding-bottom: var(--space-3); border-bottom: 1px solid var(--color-border); }
    .profile-row:last-child { border-bottom: none; padding-bottom: 0; }
    .profile-label { color: var(--color-text-secondary); font-size: 13px; }
    .profile-value { font-weight: 600; font-size: 13.5px; }
    .edit-note { margin-top: var(--space-4); color: var(--color-muted); font-size: 12.5px; max-width: 480px; }
  `],
})
export class ProfileViewComponent {
  readonly auth = inject(AuthService);
}
