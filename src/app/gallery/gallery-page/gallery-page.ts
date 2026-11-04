import { Component, inject, OnInit, signal } from '@angular/core';
import { LucideLayoutGrid, LucideSquare } from '@lucide/angular';
import { Painting } from '../../core/painting';
import { PaintingService } from '../../core/painting.service';
import { PaintingCard } from '../painting-card/painting-card';

/** Public gallery (/malningar): every available painting. */
@Component({
  selector: 'app-gallery-page',
  imports: [PaintingCard, LucideLayoutGrid, LucideSquare],
  templateUrl: './gallery-page.html',
  styleUrl: './gallery-page.scss',
})
export class GalleryPage implements OnInit {
  private readonly paintingService = inject(PaintingService);

  protected readonly compact = signal(false);
  protected readonly paintings = signal<Painting[]>([]);
  protected readonly loading = signal(true);
  protected readonly failed = signal(false);

  // ngOnInit runs once when the component is created, place to load data.
  async ngOnInit(): Promise<void> {
    try {
      this.paintings.set(await this.paintingService.listAvailable());
    } catch {
      this.failed.set(true);
    } finally {
      this.loading.set(false);
    }
  }
}
