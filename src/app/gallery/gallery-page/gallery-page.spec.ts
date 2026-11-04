import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { Painting } from '../../core/painting';
import { PaintingService } from '../../core/painting.service';
import { GalleryPage } from './gallery-page';

const PAINTING = { id: '1', title: 'Hästar i dimma', price_ore: 250000, image_path: null } as Painting;

describe('GalleryPage', () => {
  it('toggles between the feed and the grid', async () => {
    await TestBed.configureTestingModule({
      imports: [GalleryPage],
      providers: [
        provideRouter([]),
        { provide: PaintingService, useValue: { listAvailable: async () => [PAINTING] } },
      ],
    }).compileComponents();

    const fixture = TestBed.createComponent(GalleryPage);
    await fixture.whenStable();
    fixture.detectChanges();

    const el: HTMLElement = fixture.nativeElement;
    const list = el.querySelector('ul.grid') as HTMLElement;
    const button = el.querySelector('.view-toggle') as HTMLButtonElement;
    expect(list.classList.contains('compact')).toBe(false);
    expect(button.getAttribute('aria-label')).toBe('Visa som rutnät');

    button.click();
    fixture.detectChanges();
    expect(list.classList.contains('compact')).toBe(true);
    expect(button.getAttribute('aria-label')).toBe('Visa som flöde');
  });
});
