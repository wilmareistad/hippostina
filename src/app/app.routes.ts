import { Routes } from '@angular/router';
import { adminGuard } from './core/admin.guard';

export const routes: Routes = [
  // Public pages share header and footer from Layout. Child routes are shown in its <router-outlet>.
  {
    path: '',
    loadComponent: () => import('./layout/layout').then((m) => m.Layout),
    children: [
      {
        path: 'malningar',
        loadComponent: () =>
          import('./gallery/gallery-page/gallery-page').then((m) => m.GalleryPage),
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
];
