import { Routes } from '@angular/router';

import { authGuard } from './core/guards/auth.guard';
import { guestGuard } from './core/guards/guest.guard';
import { roleGuard } from './core/guards/role.guard';

export const appRoutes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'login' },

  {
    path: 'login',
    canActivate: [guestGuard],
    loadComponent: () => import('./features/auth/login/login.component').then((m) => m.LoginComponent),
  },
  {
    path: 'register',
    canActivate: [guestGuard],
    loadComponent: () => import('./features/auth/register/register.component').then((m) => m.RegisterComponent),
  },

  {
    path: '',
    canActivate: [authGuard],
    loadComponent: () => import('./shared/components/app-shell.component').then((m) => m.AppShellComponent),
    children: [
      // ---- Customer ----
      {
        path: 'customer',
        canActivate: [roleGuard(['CUSTOMER'])],
        children: [
          { path: '', pathMatch: 'full', redirectTo: 'dashboard' },
          {
            path: 'dashboard',
            loadComponent: () =>
              import('./features/customer/dashboard/dashboard.component').then((m) => m.CustomerDashboardComponent),
          },
          {
            path: 'create-delivery',
            loadComponent: () =>
              import('./features/customer/create-delivery/create-delivery.component').then(
                (m) => m.CreateDeliveryComponent,
              ),
          },
          {
            path: 'deliveries',
            loadComponent: () =>
              import('./features/customer/deliveries-list/deliveries-list.component').then(
                (m) => m.DeliveriesListComponent,
              ),
          },
          {
            path: 'deliveries/:id',
            loadComponent: () =>
              import('./features/customer/delivery-detail/delivery-detail.component').then(
                (m) => m.DeliveryDetailComponent,
              ),
          },
          {
            path: 'history',
            loadComponent: () =>
              import('./features/customer/deliveries-list/deliveries-list.component').then(
                (m) => m.DeliveriesListComponent,
              ),
          },
          {
            path: 'profile',
            loadComponent: () =>
              import('./shared/components/profile-view.component').then((m) => m.ProfileViewComponent),
          },
        ],
      },

      // ---- Agent ----
      {
        path: 'agent',
        canActivate: [roleGuard(['AGENT'])],
        children: [
          { path: '', pathMatch: 'full', redirectTo: 'dashboard' },
          {
            path: 'dashboard',
            loadComponent: () =>
              import('./features/agent/dashboard/dashboard.component').then((m) => m.AgentDashboardComponent),
          },
          {
            path: 'deliveries/:id',
            loadComponent: () =>
              import('./features/customer/delivery-detail/delivery-detail.component').then(
                (m) => m.DeliveryDetailComponent,
              ),
          },
          {
            path: 'profile',
            loadComponent: () =>
              import('./shared/components/profile-view.component').then((m) => m.ProfileViewComponent),
          },
        ],
      },

      // ---- Admin ----
      {
        path: 'admin',
        canActivate: [roleGuard(['ADMIN'])],
        children: [
          { path: '', pathMatch: 'full', redirectTo: 'dashboard' },
          {
            path: 'dashboard',
            loadComponent: () =>
              import('./features/admin/dashboard/dashboard.component').then((m) => m.AdminDashboardComponent),
          },
          {
            path: 'agents',
            loadComponent: () =>
              import('./features/admin/agents/agents.component').then((m) => m.AdminAgentsComponent),
          },
          {
            path: 'agents/new',
            loadComponent: () =>
              import('./features/admin/agent-detail/agent-detail.component').then(
                (m) => m.AdminAgentDetailComponent,
              ),
          },
          {
            path: 'agents/:id',
            loadComponent: () =>
              import('./features/admin/agent-detail/agent-detail.component').then(
                (m) => m.AdminAgentDetailComponent,
              ),
          },
          {
            path: 'packages',
            loadComponent: () =>
              import('./features/admin/packages/packages.component').then((m) => m.AdminPackagesComponent),
          },
          {
            path: 'packages/:id',
            loadComponent: () =>
              import('./features/customer/delivery-detail/delivery-detail.component').then(
                (m) => m.DeliveryDetailComponent,
              ),
          },
          {
            path: 'services',
            loadComponent: () =>
              import('./features/admin/services/services.component').then((m) => m.AdminServicesComponent),
          },
          {
            path: 'locations',
            loadComponent: () =>
              import('./features/admin/locations/locations.component').then((m) => m.AdminLocationsComponent),
          },
          {
            path: 'users',
            loadComponent: () =>
              import('./features/admin/users/users.component').then((m) => m.AdminUsersComponent),
          },
          {
            path: 'bookings',
            loadComponent: () =>
              import('./features/admin/unavailable/unavailable.component').then((m) => m.AdminUnavailableComponent),
            data: { title: 'Bookings', subtitle: 'Booking records created when a package is auto-assigned.' },
          },
          {
            path: 'deliveries',
            loadComponent: () =>
              import('./features/admin/unavailable/unavailable.component').then((m) => m.AdminUnavailableComponent),
            data: { title: 'Deliveries', subtitle: 'Delivery execution records for assigned packages.' },
          },
          {
            path: 'assignments',
            loadComponent: () =>
              import('./features/admin/unavailable/unavailable.component').then((m) => m.AdminUnavailableComponent),
            data: { title: 'Assignments', subtitle: 'Automatic agent assignment outcomes.' },
          },
          {
            path: 'rewards',
            loadComponent: () =>
              import('./features/admin/unavailable/unavailable.component').then((m) => m.AdminUnavailableComponent),
            data: {
              title: 'Rewards & Penalties',
              subtitle: 'Reward and penalty point adjustments for agents.',
              description:
                'The current backend has no rewards/penalties endpoint yet. Reward and penalty point totals per agent are visible today on each agent\'s Manage page.',
            },
          },
          {
            path: 'history',
            loadComponent: () =>
              import('./features/admin/unavailable/unavailable.component').then((m) => m.AdminUnavailableComponent),
            data: {
              title: 'History',
              subtitle: 'Full status-change history across all packages.',
              description:
                'The current backend has no system-wide history endpoint. Per-package status history is available today on each package\'s Details page.',
            },
          },
        ],
      },
    ],
  },

  { path: '**', redirectTo: 'login' },
];
