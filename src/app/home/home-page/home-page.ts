import { Component, inject, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Painting } from '../../core/painting';
import { PaintingService } from '../../core/painting.service';
import { PaintingCard } from '../../gallery/painting-card/painting-card';
import { HOME_CONTENT } from '../home-content';

/** Start page (/): hero, then the latest paintings. */
@Component({
  selector: 'app-home-page',
  imports: [RouterLink, PaintingCard],
  templateUrl: './home-page.html',
  styleUrl: './home-page.scss',
})
export class HomePage implements OnInit {
  private readonly paintingService = inject(PaintingService);

  protected readonly content = HOME_CONTENT;
  protected readonly paintings = signal<Painting[]>([]);
  protected readonly loading = signal(true);
  protected readonly failed = signal(false);

  async ngOnInit(): Promise<void> {
    try {
      const available = await this.paintingService.listAvailable();
      this.paintings.set(available.slice(0, 3));
    } catch {
      this.failed.set(true);
    } finally {
      this.loading.set(false);
    }
  }
}
