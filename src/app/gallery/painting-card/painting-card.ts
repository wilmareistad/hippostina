import { Component, inject, input, computed } from '@angular/core';
import { Painting } from '../../core/painting';
import { PaintingService } from '../../core/painting.service';
import { formatPrice } from '../../core/price';
import { RouterLink } from '@angular/router';

/** One painting in the gallery grid: image, title and price. */
@Component({
  selector: 'app-painting-card',
  imports: [RouterLink],
  templateUrl: './painting-card.html',
  styleUrl: './painting-card.scss',
})
export class PaintingCard {
    painting = input.required<Painting>();

  private readonly paintingService = inject(PaintingService);
  
protected imageUrl = computed(() => {
  const path = this.painting().image_path;
  return path ? this.paintingService.imageUrl(path) : null;
});
protected price = computed(() => formatPrice(this.painting().price_ore));
}
