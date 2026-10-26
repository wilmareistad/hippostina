import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter, withInMemoryScrolling } from '@angular/router';
import { routes } from './app.routes';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(
      routes,
      // scrollPositionRestoration, new pages start at the top, Back returns to the old position.
      // anchorScrolling stays off: the start page scrolls to #kontakt itself (smooth, after loading).
      withInMemoryScrolling({ scrollPositionRestoration: 'enabled' }),
    ),
  ],
};
