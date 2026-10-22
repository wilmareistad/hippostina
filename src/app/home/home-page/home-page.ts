import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { HOME_CONTENT } from '../home-content';

/** Start page (/): hero, then the latest paintings. */
@Component({
  selector: 'app-home-page',
  imports: [RouterLink],
  templateUrl: './home-page.html',
  styleUrl: './home-page.scss',
})
export class HomePage {
  protected readonly content = HOME_CONTENT;
}
