import { Routes } from '@angular/router';
import { adminGuard } from './core/admin.guard';

export const routes: Routes = [
  // Public pages share header and footer from Layout. Child routes are shown in its <router-outlet>.
  {
    path: '',
    loadComponent: () => import('./layout/layout').then((m) => m.Layout),
    children: [
      {
        path: '',
        pathMatch: 'full',
        loadComponent: () => import('./home/home-page/home-page').then((m) => m.HomePage),
      },
      {
        path: 'malningar',
        loadComponent: () =>
          import('./gallery/gallery-page/gallery-page').then((m) => m.GalleryPage),
      },
      {
        path: 'malningar/:id',
        loadComponent: () =>
          import('./gallery/painting-page/painting-page').then((m) => m.PaintingPage),
      },
      // Stripe redirects here after checkout. The paths must match success_url and cancel_url
      // in the create-checkout Edge Function.
      {
        path: 'kop/tack',
        loadComponent: () =>
          import('./purchase/purchase-thanks/purchase-thanks').then((m) => m.PurchaseThanks),
      },
      {
        path: 'kop/avbrutet',
        loadComponent: () =>
          import('./purchase/purchase-cancelled/purchase-cancelled').then(
            (m) => m.PurchaseCancelled,
          ),
      },
    ],
  },
  // loadComponent: the admin code is only downloaded when someone opens these pages.
  {
    path: 'admin/login',
    loadComponent: () => import('./admin/login/login').then((m) => m.Login),
  },
  {
    path: 'admin',
    canActivate: [adminGuard],
    loadComponent: () => import('./admin/dashboard/dashboard').then((m) => m.Dashboard),
  },
  // 'new' is listed before ':id', otherwise ':id' would match the word "new".
  {
    path: 'admin/paintings/new',
    canActivate: [adminGuard],
    loadComponent: () => import('./admin/painting-form/painting-form').then((m) => m.PaintingForm),
  },
  {
    path: 'admin/paintings/:id',
    canActivate: [adminGuard],
    loadComponent: () => import('./admin/painting-form/painting-form').then((m) => m.PaintingForm),
  },
  // '**' matches every path that no route above matched, for example an old or misspelled link.
  // It must be last, because the router uses the first route that matches.
  { path: '**', redirectTo: '' },
];
