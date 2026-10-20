import { Component, computed, ElementRef, inject, signal, viewChild } from '@angular/core';
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
  protected readonly busyId = signal<string | null>(null);
  protected readonly actionError = signal<string | null>(null);

  /** The painting the delete confirmation is about, or null when it is closed. */
  protected readonly paintingToDelete = signal<Painting | null>(null);
  /** The native <dialog> element in the template (#deleteDialog). */
  private readonly deleteDialog = viewChild.required<ElementRef<HTMLDialogElement>>('deleteDialog');

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

  /** Archive (soft delete). Only available paintings can be archived. */
  protected async archive(painting: Painting): Promise<void> {
    await this.runAction(painting, () => this.paintingService.archive(painting.id));
  }

  /** Undo an archive: the painting becomes available again. */
  protected async restore(painting: Painting): Promise<void> {
    await this.runAction(painting, () => this.paintingService.restore(painting.id));
  }

  /** Step 1 of a permanent delete: ask first, because it cannot be undone. */
  protected askDelete(painting: Painting): void {
    this.paintingToDelete.set(painting);
    this.deleteDialog().nativeElement.showModal();
  }

  protected cancelDelete(): void {
    this.deleteDialog().nativeElement.close();
    this.paintingToDelete.set(null);
  }

  /** Step 2: the admin confirmed. Only archived paintings without orders can be deleted. */
  protected async confirmDelete(): Promise<void> {
    const painting = this.paintingToDelete();
    this.cancelDelete();
    if (!painting) return;
    await this.runAction(
      painting,
      () => this.paintingService.deleteArchived(painting.id),
      `Kunde inte radera "${painting.title}". Har den en order går det inte. Listan har uppdaterats.`,
    );
  }

  /** Runs one action, then reloads the list so it matches the database. */
  private async runAction(
    painting: Painting,
    action: () => Promise<void>,
    failureMessage = `Kunde inte ändra "${painting.title}". Listan har uppdaterats.`,
  ): Promise<void> {
    if (this.busyId()) return; // one action at a time
    this.busyId.set(painting.id);
    this.actionError.set(null);
    try {
      await action();
    } catch (error) {
      // Also happens if the status changed meanwhile, for example a customer reserved it.
      console.error(error);
      this.actionError.set(failureMessage);
    }
    await this.load();
    this.busyId.set(null);
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
