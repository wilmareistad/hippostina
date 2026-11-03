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
