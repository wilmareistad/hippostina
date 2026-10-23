import { Component, signal } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { LucideMenu, LucideX } from '@lucide/angular';

/** Public shell, header, page content and footer. Admin pages do not use it. */
@Component({
  selector: 'app-layout',
  imports: [RouterOutlet, RouterLink, RouterLinkActive, LucideMenu, LucideX],
  templateUrl: './layout.html',
  styleUrl: './layout.scss',
})
export class Layout {
  // A signal holds state that the template reacts to: when it changes, the view updates.
  protected readonly menuOpen = signal(false);
  protected readonly year = new Date().getFullYear();

  protected toggleMenu(): void {
    this.menuOpen.update((open) => !open);
  }

  protected closeMenu(): void {
    this.menuOpen.set(false);
  }
}
