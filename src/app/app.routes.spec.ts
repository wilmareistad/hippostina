import { routes } from './app.routes';
import { adminGuard } from './core/admin.guard';

describe('admin routes', () => {
  const admin = routes.find((route) => route.path === 'admin');

  it('guards every page under /admin, each time the admin moves between them', () => {
    expect(admin?.canActivateChild).toEqual([adminGuard]);
    expect(admin?.children?.map((child) => child.path)).toEqual([
      '',
      'ordrar',
      'tavlor/ny',
      'tavlor/:id',
    ]);
  });

  it('keeps the login page outside the guard', () => {
    const shop = routes.find((route) => route.path === '');

    expect(shop?.canActivateChild).toBeUndefined();
    expect(shop?.children?.some((child) => child.path === 'admin/logga-in')).toBe(true);
  });
});

describe('legal routes', () => {
  const shop = routes.find((route) => route.path === '');

  it.each(['kopvillkor', 'integritetspolicy'])(
    'has /%s in the shop layout, open to every visitor',
    (path) => {
      const page = shop?.children?.find((child) => child.path === path);

      expect(page?.loadComponent).toBeDefined();
      expect(page?.canActivate).toBeUndefined();
    },
  );
});
