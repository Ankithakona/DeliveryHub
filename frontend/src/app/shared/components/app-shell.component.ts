import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';

import { AuthService } from '../../core/services/auth.service';
import { IconComponent } from './icon.component';
import { NavItem } from './nav-item.model';
import { ToastContainerComponent } from './toast-container.component';

const CUSTOMER_NAV: NavItem[] = [
  { label: 'Dashboard', path: '/customer/dashboard', icon: 'dashboard' },
  { label: 'Create Delivery', path: '/customer/create-delivery', icon: 'plus' },
  { label: 'My Deliveries', path: '/customer/deliveries', icon: 'package' },
  { label: 'Profile', path: '/customer/profile', icon: 'user' },
];

const AGENT_NAV: NavItem[] = [
  { label: 'Dashboard', path: '/agent/dashboard', icon: 'dashboard' },
  { label: 'Profile', path: '/agent/profile', icon: 'user' },
];

const ADMIN_NAV: NavItem[] = [
  { label: 'Dashboard', path: '/admin/dashboard', icon: 'dashboard' },
  { label: 'Agents', path: '/admin/agents', icon: 'truck' },
  { label: 'Packages', path: '/admin/packages', icon: 'package' },
  { label: 'Bookings', path: '/admin/bookings', icon: 'booking' },
  { label: 'Deliveries', path: '/admin/deliveries', icon: 'truck' },
  { label: 'Assignments', path: '/admin/assignments', icon: 'assignment' },
  { label: 'Services', path: '/admin/services', icon: 'services' },
  { label: 'Locations', path: '/admin/locations', icon: 'location' },
  { label: 'Users', path: '/admin/users', icon: 'users' },
  { label: 'Rewards & Penalties', path: '/admin/rewards', icon: 'reward' },
  { label: 'History', path: '/admin/history', icon: 'history' },
];

@Component({
  selector: 'dh-app-shell',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive, IconComponent, ToastContainerComponent],
  template: `
    <div class="shell" [class.sidebar-open]="sidebarOpen()">
      <aside class="sidebar">
        <div class="brand">
          <span class="brand-mark">DH</span>
          <span class="brand-name">DeliveryHub</span>
        </div>
        <nav class="nav">
          @for (item of navItems(); track item.path) {
            <a
              [routerLink]="item.path"
              routerLinkActive="active"
              class="nav-link"
              (click)="closeSidebar()"
            >
              <dh-icon [name]="item.icon"></dh-icon>
              <span>{{ item.label }}</span>
            </a>
          }
        </nav>
        <div class="sidebar-footer">
          <button type="button" class="nav-link logout" (click)="logout()">
            <dh-icon name="user"></dh-icon>
            <span>Logout</span>
          </button>
        </div>
      </aside>

      <div class="backdrop" (click)="closeSidebar()"></div>

      <div class="main">
        <header class="topbar">
          <button type="button" class="menu-toggle" (click)="toggleSidebar()" aria-label="Toggle navigation">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
              <path d="M4 6h16M4 12h16M4 18h16"/>
            </svg>
          </button>
          <div class="topbar-title">DeliveryHub</div>
          <div class="topbar-actions">
            <button type="button" class="icon-btn" aria-label="Notifications" title="Notifications">
              <dh-icon name="bell"></dh-icon>
            </button>
            <div class="user-menu">
              <div class="avatar" aria-hidden="true">{{ initials() }}</div>
              <div class="user-info">
                <span class="user-name">{{ auth.currentUser()?.fullName }}</span>
                <span class="user-role">{{ auth.currentUser()?.role }}</span>
              </div>
            </div>
          </div>
        </header>
        <main class="content">
          <router-outlet></router-outlet>
        </main>
      </div>
    </div>
  `,
  styles: [`
    .shell {
      display: grid;
      grid-template-columns: var(--sidebar-width) 1fr;
      min-height: 100vh;
    }
    .sidebar {
      background: var(--color-primary);
      color: #fff;
      display: flex;
      flex-direction: column;
      padding: var(--space-5) var(--space-3);
      position: sticky;
      top: 0;
      height: 100vh;
      overflow-y: auto;
    }
    .brand {
      display: flex;
      align-items: center;
      gap: var(--space-3);
      padding: var(--space-2) var(--space-3) var(--space-6);
    }
    .brand-mark {
      width: 32px;
      height: 32px;
      border-radius: var(--radius-sm);
      background: rgba(255,255,255,0.14);
      display: flex;
      align-items: center;
      justify-content: center;
      font-family: var(--font-display);
      font-weight: 700;
      font-size: 13px;
    }
    .brand-name {
      font-family: var(--font-display);
      font-weight: 700;
      font-size: 16px;
    }
    .nav { display: flex; flex-direction: column; gap: 2px; flex: 1; }
    .nav-link {
      display: flex;
      align-items: center;
      gap: var(--space-3);
      padding: 10px 12px;
      border-radius: var(--radius-sm);
      color: rgba(255,255,255,0.78);
      font-size: 13.5px;
      font-weight: 500;
      border: none;
      background: none;
      cursor: pointer;
      text-align: left;
      width: 100%;
    }
    .nav-link:hover { background: rgba(255,255,255,0.08); color: #fff; text-decoration: none; }
    .nav-link.active { background: rgba(255,255,255,0.16); color: #fff; }
    .sidebar-footer { margin-top: var(--space-4); border-top: 1px solid rgba(255,255,255,0.14); padding-top: var(--space-3); }

    .main { display: flex; flex-direction: column; min-width: 0; }
    .topbar {
      height: var(--topbar-height);
      display: flex;
      align-items: center;
      gap: var(--space-4);
      padding: 0 var(--space-6);
      background: var(--color-surface);
      border-bottom: 1px solid var(--color-border);
      position: sticky;
      top: 0;
      z-index: 10;
    }
    .menu-toggle {
      display: none;
      background: none;
      border: none;
      color: var(--color-text);
      cursor: pointer;
      padding: 4px;
    }
    .topbar-title {
      font-family: var(--font-display);
      font-weight: 700;
      font-size: 15px;
      display: none;
    }
    .topbar-actions { display: flex; align-items: center; gap: var(--space-4); margin-left: auto; }
    .icon-btn {
      background: none;
      border: 1px solid var(--color-border);
      border-radius: var(--radius-sm);
      color: var(--color-text-secondary);
      width: 36px;
      height: 36px;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
    }
    .icon-btn:hover { background: var(--color-background); }
    .user-menu { display: flex; align-items: center; gap: var(--space-3); }
    .avatar {
      width: 34px;
      height: 34px;
      border-radius: 50%;
      background: var(--color-primary-soft);
      color: var(--color-primary);
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 700;
      font-size: 13px;
    }
    .user-info { display: flex; flex-direction: column; line-height: 1.25; }
    .user-name { font-size: 13.5px; font-weight: 600; }
    .user-role { font-size: 11.5px; color: var(--color-muted); text-transform: capitalize; }

    .content { padding: var(--space-6); flex: 1; }
    .backdrop { display: none; }

    @media (max-width: 900px) {
      .shell { grid-template-columns: 1fr; }
      .sidebar {
        position: fixed;
        left: 0;
        top: 0;
        width: 260px;
        transform: translateX(-100%);
        transition: transform 0.2s ease;
        z-index: 30;
      }
      .sidebar-open .sidebar { transform: translateX(0); }
      .backdrop {
        display: none;
        position: fixed;
        inset: 0;
        background: rgba(20,24,33,0.4);
        z-index: 20;
      }
      .sidebar-open .backdrop { display: block; }
      .menu-toggle { display: flex; }
      .topbar-title { display: block; }
      .user-info { display: none; }
      .content { padding: var(--space-4); }
    }
  `],
})
export class AppShellComponent {
  readonly auth = inject(AuthService);
  readonly sidebarOpen = signal(false);

  readonly navItems = computed<NavItem[]>(() => {
    switch (this.auth.role()) {
      case 'CUSTOMER':
        return CUSTOMER_NAV;
      case 'AGENT':
        return AGENT_NAV;
      case 'ADMIN':
        return ADMIN_NAV;
      default:
        return [];
    }
  });

  readonly initials = computed(() => {
    const name = this.auth.currentUser()?.fullName ?? '';
    return name
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join('');
  });

  toggleSidebar(): void {
    this.sidebarOpen.update((open) => !open);
  }

  closeSidebar(): void {
    this.sidebarOpen.set(false);
  }

  logout(): void {
    this.auth.logout();
    window.location.href = '/login';
  }
}
