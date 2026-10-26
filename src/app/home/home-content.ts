/** Texts for the start page, kept in one place so they are easy to change later. */
export const HOME_CONTENT = {
  hero: {
    eyebrow: 'VÄLKOMMEN',
    title: 'Hej, jag heter Stina!',
    paragraphs: [
      'Jag målar hästar och djur med rå kol, pigment och akryl på linneduk under namnet Hippostina. Måleriet är min stora passion vid sidan av vardagen.',
      'Varje målning växer fram organiskt på grov duk, inspirerad av hästens styrka, frihet och blick. Här samlar jag några av mina senaste tavlor som söker nya hem.',
    ],
    imageAlt: 'Stina målar i sin ateljé',
  },
  // Pickup only for now. Update when shipping is added (sprint 5, Should).
  info: 'Originalmålningar målade av Stina • Hämtas i Köping • Säker betalning online',
  latest: {
    eyebrow: 'TILL SALU',
    title: 'Mina senaste målningar',
    linkText: 'SE ALLA MÅLNINGAR',
  },
} as const;
