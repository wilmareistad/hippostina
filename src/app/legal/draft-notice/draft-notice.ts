import { Component } from '@angular/core';

/**
 * Shown on the legal pages until Stina has approved the texts. Remove it from a page when that
 * page is approved. <ng-content> shows whatever a page writes between the component's tags, so a
 * page can add its own sentence after the standard text.
 */
@Component({
  selector: 'app-draft-notice',
  template: `
    <aside class="notice" aria-label="Utkast">
      <p>
        <strong>Utkast.</strong> Texten har ännu inte godkänts av Stina. Uppgifter inom hakparentes
        kommer senare.
        <ng-content />
      </p>
    </aside>
  `,
  styles: `
    .notice {
      margin: 0 0 2rem;
      padding: 0.75rem 1rem;
      border-left: 4px solid var(--color-secondary);
      background: var(--secondary-bg-color);
      font-size: 0.875rem;
      line-height: 1.6;
    }

    p {
      margin: 0;
    }
  `,
})
export class DraftNotice {}
