import { Routes } from '@angular/router';
import { adminGuard } from './core/admin.guard';
import { pendingCheckoutGuard } from './core/pending-checkout.guard';

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
        canActivate: [pendingCheckoutGuard],
        loadComponent: () =>
          import('./purchase/purchase-thanks/purchase-thanks').then((m) => m.PurchaseThanks),
      },
      {
        path: 'kop/avbrutet',
        canActivate: [pendingCheckoutGuard],
        loadComponent: () =>
          import('./purchase/purchase-cancelled/purchase-cancelled').then(
            (m) => m.PurchaseCancelled,
          ),
      },
      {
        path: 'kopvillkor',
        loadComponent: () => import('./legal/terms-page/terms-page').then((m) => m.TermsPage),
      },
      {
        path: 'integritetspolicy',
        loadComponent: () => import('./legal/privacy-page/privacy-page').then((m) => m.PrivacyPage),
      },
      // In the shop's layout, since the visitor is not logged in yet.
      {
        path: 'admin/logga-in',
        loadComponent: () => import('./admin/login/login').then((m) => m.Login),
      },
    ],
  },
  // loadComponent: the admin code is only downloaded when someone opens these pages.
  {
    path: 'admin',
    // canActivateChild: checked on every move between the pages below, not only the first one.
    canActivateChild: [adminGuard],
    loadComponent: () => import('./admin/admin-layout/admin-layout').then((m) => m.AdminLayout),
    children: [
      {
        path: '',
        pathMatch: 'full',
        loadComponent: () => import('./admin/dashboard/dashboard').then((m) => m.Dashboard),
      },
      {
        path: 'ordrar',
        loadComponent: () => import('./admin/order-list/order-list').then((m) => m.OrderList),
      },
      // 'ny' is listed before ':id', otherwise ':id' would match the word "ny".
      {
        path: 'tavlor/ny',
        loadComponent: () =>
          import('./admin/painting-form/painting-form').then((m) => m.PaintingForm),
      },
      {
        path: 'tavlor/:id',
        loadComponent: () =>
          import('./admin/painting-form/painting-form').then((m) => m.PaintingForm),
      },
    ],
  },
  // '**' matches every path that no route above matched, for example an old or misspelled link.
  // It must be last, because the router uses the first route that matches.
  { path: '**', redirectTo: '' },
];
