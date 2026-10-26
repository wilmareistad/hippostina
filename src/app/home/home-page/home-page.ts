import { ViewportScroller } from '@angular/common';
import { afterNextRender, Component, inject, Injector, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Router, RouterLink, Scroll } from '@angular/router';
import { filter } from 'rxjs';
import { ContactSection } from '../../contact/contact-section/contact-section';
import { Painting } from '../../core/painting';
import { PaintingService } from '../../core/painting.service';
import { PaintingCard } from '../../gallery/painting-card/painting-card';
import { HOME_CONTENT } from '../home-content';

/** Same as the id on <app-contact-section> in the template. */
const CONTACT_ANCHOR = 'kontakt';

/** Start page (/): hero, the latest paintings, then the contact section. */
@Component({
  selector: 'app-home-page',
  imports: [RouterLink, PaintingCard, ContactSection],
  templateUrl: './home-page.html',
  styleUrl: './home-page.scss',
})
export class HomePage {
  private readonly paintingService = inject(PaintingService);
  private readonly viewportScroller = inject(ViewportScroller);
  private readonly injector = inject(Injector);

  protected readonly content = HOME_CONTENT;
  protected readonly paintings = signal<Painting[]>([]);
  protected readonly loading = signal(true);
  protected readonly failed = signal(false);

  /** Done when the paintings have loaded (or failed), so the page has its final height. */
  private readonly loaded = this.loadPaintings();

  constructor() {
    // After each navigation the router sends a Scroll event with the fragment (#kontakt).
    inject(Router)
      .events.pipe(
        filter((event) => event instanceof Scroll),
        filter((event) => event.anchor === CONTACT_ANCHOR && event.position === null),
        takeUntilDestroyed(),
      )
      .subscribe(() => void this.scrollToContact());
  }

  private async loadPaintings(): Promise<void> {
    try {
      const available = await this.paintingService.listAvailable();
      this.paintings.set(available.slice(0, 3));
    } catch {
      this.failed.set(true);
    } finally {
      this.loading.set(false);
    }
  }

  /**
   * Scrolls smoothly to the contact section. Waits for the paintings first
   */
  private async scrollToContact(): Promise<void> {
    await this.loaded;
    // afterNextRender: wait until Angular has drawn the paintings, so the section is in its final place.
    afterNextRender(
      () => {
        const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
        this.viewportScroller.scrollToAnchor(CONTACT_ANCHOR, {
          behavior: reduceMotion ? 'instant' : 'smooth',
        });
      },
      { injector: this.injector },
    );
  }
}
