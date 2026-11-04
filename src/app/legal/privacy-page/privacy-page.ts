import { Component } from '@angular/core';
import { CONTACT_CONTENT } from '../../contact/contact-content';
import { DraftNotice } from '../draft-notice/draft-notice';

/** Privacy policy (/integritetspolicy). Draft text until Stina has approved it. */
@Component({
  selector: 'app-privacy-page',
  imports: [DraftNotice],
  templateUrl: './privacy-page.html',
  styleUrl: '../legal-page.scss',
})
export class PrivacyPage {
  protected readonly email = CONTACT_CONTENT.email;
}
