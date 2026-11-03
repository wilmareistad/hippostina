import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { LucidePlus } from '@lucide/angular';
import { AuthService } from '../../core/auth.service';
import { PaintingList } from '../painting-list/painting-list';

/** Admin start page: painting CRUD. */
@Component({
  selector: 'app-dashboard',
  imports: [RouterLink, LucidePlus, PaintingList],
  templateUrl: './dashboard.html',
})
export class Dashboard {
  protected readonly auth = inject(AuthService);
}
