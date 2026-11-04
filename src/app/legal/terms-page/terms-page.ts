import { Component } from '@angular/core';
import { CONTACT_CONTENT } from '../../contact/contact-content';
import { DraftNotice } from '../draft-notice/draft-notice';

/** Terms of purchase and right of withdrawal (/kopvillkor). Draft text until Stina has approved it. */
@Component({
  selector: 'app-terms-page',
  imports: [DraftNotice],
  templateUrl: './terms-page.html',
  styleUrl: '../legal-page.scss',
})
export class TermsPage {
  protected readonly email = CONTACT_CONTENT.email;
}
