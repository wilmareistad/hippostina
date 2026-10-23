import { Component, computed, DestroyRef, inject, OnInit, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { Painting } from '../../core/painting';
import { PaintingService } from '../../core/painting.service';
import { formatPrice } from '../../core/price';

/** Public product page (/painting/:id): one available painting. No buy button yet (sprint 3). */
@Component({
  selector: 'app-painting-page',
  imports: [RouterLink],
  templateUrl: './painting-page.html',
  styleUrl: './painting-page.scss',
})
export class PaintingPage implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly destroyRef = inject(DestroyRef);
  private readonly paintingService = inject(PaintingService);

  protected readonly painting = signal<Painting | null>(null);
  protected readonly loading = signal(true);
  /** True when the painting is missing, not available, the id is invalid or loading failed. */
  protected readonly notFound = signal(false);

  protected readonly imageUrl = computed(() => {
    const path = this.painting()?.image_path;
    return path ? this.paintingService.imageUrl(path) : null;
  });
  protected readonly price = computed(() => {
    const painting = this.painting();
    return painting ? formatPrice(painting.price_ore) : '';
  });
  protected readonly size = computed(() => {
    const painting = this.painting();
    return painting?.width_cm && painting.height_cm
      ? `${painting.width_cm} × ${painting.height_cm} cm`
      : null;
  });

  // paramMap emits again if the id in the URL changes while this component stays on screen.
  ngOnInit(): void {
    this.route.paramMap
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((params) => void this.load(params.get('id')));
  }

  private async load(id: string | null): Promise<void> {
    this.loading.set(true);
    this.notFound.set(false);
    this.painting.set(null);
    try {
      const painting = id ? await this.paintingService.getAvailable(id) : null;
      // Ignore the answer if the user has already moved on to another painting.
      if (id !== this.route.snapshot.paramMap.get('id')) return;
      this.painting.set(painting);
      this.notFound.set(painting === null);
    } catch {
      // An invalid uuid makes Postgres return an error. Show the same message as "not found".
      if (id !== this.route.snapshot.paramMap.get('id')) return;
      this.notFound.set(true);
    } finally {
      if (id === this.route.snapshot.paramMap.get('id')) this.loading.set(false);
    }
  }
}
