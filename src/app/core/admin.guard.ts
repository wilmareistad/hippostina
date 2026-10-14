import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from './auth.service';

/** Sends anyone who is not the admin to the login page. */
export const adminGuard: CanActivateFn = async () => {
  // inject() must be called before the first await.
  const auth = inject(AuthService);
  const router = inject(Router);
  return (await auth.isAdmin()) ? true : router.createUrlTree(['/admin/login']);
};
