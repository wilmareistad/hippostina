import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../core/auth.service';
import { PaintingList } from '../painting-list/painting-list';

/** Admin start page. Painting CRUD and the order overview will live here. */
@Component({
  selector: 'app-dashboard',
  imports: [PaintingList],
  templateUrl: './dashboard.html',
})
export class Dashboard {
  private readonly router = inject(Router);
  protected readonly auth = inject(AuthService);

  protected async signOut(): Promise<void> {
    await this.auth.signOut();
    await this.router.navigateByUrl('/admin/login');
  }
}
