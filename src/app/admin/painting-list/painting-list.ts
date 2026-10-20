import { Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Painting, PaintingStatus } from '../../core/painting';
import { PaintingService } from '../../core/painting.service';
import { formatPrice } from '../../core/price';

/** status tabs and labels. */
const STATUS_LABELS: Record<PaintingStatus, string> = {
  available: 'Till salu',
  reserved: 'Reserverade',
  sold: 'Sålda',
  archived: 'Arkiverade',
};

/** Admin list of all paintings with a tab per status, so sold ones are out of the way. */
@Component({
  selector: 'app-painting-list',
  imports: [RouterLink],
  templateUrl: './painting-list.html',
  styleUrl: './painting-list.scss',
})
export class PaintingList {
  private readonly paintingService = inject(PaintingService);

  protected readonly tabs = (Object.keys(STATUS_LABELS) as PaintingStatus[]).map((status) => ({
    status,
    label: STATUS_LABELS[status],
  }));
  protected readonly paintings = signal<Painting[]>([]);
  protected readonly selectedStatus = signal<PaintingStatus>('available');
  protected readonly loading = signal(true);
  protected readonly error = signal<string | null>(null);

  /** Recalculated automatically when "paintings" or "selectedStatus" change. */
  protected readonly visiblePaintings = computed(() =>
    this.paintings().filter((painting) => painting.status === this.selectedStatus()),
  );

  constructor() {
    void this.load();
  }

  protected countFor(status: PaintingStatus): number {
    return this.paintings().filter((painting) => painting.status === status).length;
  }

  protected price(painting: Painting): string {
    return formatPrice(painting.price_ore);
  }

  protected imageUrl(painting: Painting): string | null {
    return painting.image_path ? this.paintingService.imageUrl(painting.image_path) : null;
  }

  protected size(painting: Painting): string | null {
    if (painting.width_cm && painting.height_cm) {
      return `${painting.width_cm} × ${painting.height_cm} cm`;
    }
    return null;
  }

  private async load(): Promise<void> {
    try {
      this.paintings.set(await this.paintingService.list());
    } catch (error) {
      console.error(error);
      this.error.set('Kunde inte hämta tavlorna. Försök igen.');
    } finally {
      this.loading.set(false);
    }
  }
}
