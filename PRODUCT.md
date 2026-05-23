# Product

## Register

product

## Users

Dallas-area Muslims who need to know iqama times at their local masjid. They open the app in the minutes before prayer — often standing outside the masjid, on the way there, or checking from home to time their departure. The use case is recurring and time-sensitive: they have 30 seconds to get the answer and close the app.

Secondary: community members who track multiple masjids or want to compare iqama times across the Dallas area.

## Product Purpose

IqamaTime aggregates iqama times from 10+ Dallas-area masjids into a single PWA, scraped daily. It shows the current and upcoming prayer's iqama times at each masjid, with a live countdown to adhan. Installed on the iPhone home screen, it functions as a lightweight, always-available reference.

Success: the user opens the app, reads the iqama time in under 5 seconds, and closes it with confidence in the data.

## Brand Personality

Grounded, clear, communal.

The app carries the weight of what it serves — daily prayer — without performing spirituality. It speaks like a knowledgeable neighbor, not a platform. Tone is factual, direct, and unhurried.

## Anti-references

- **Generic Muslim apps**: green crescent logos, decorative Arabic-font splashes, ornamental Islamic geometry used as filler. The design should feel specific to this community and these masjids, not broadly "Islamic-themed."
- **SaaS dashboard aesthetic**: card grids, hero metrics, startup gradients, "modern" product design clichés. This is a utility, not a product homepage.
- **Over-designed spiritual apps**: geometric patterns, ornate tilework, richly illustrated backgrounds. Decoration that obscures function.
- **Dark prayer-counter theater**: all-in dark mode with glowing accents and dramatic ambience. The app should feel like daylight and clarity, not a nocturnal ritual.

## Design Principles

1. **Data before decoration.** The iqama time is the content. Every visual element that doesn't help the user read it faster is suspect. Hierarchy flows from accuracy, not aesthetics.

2. **Communal precision.** This serves a specific community at specific masjids in a specific city. Design decisions should feel grounded in that specificity. Resist the reflex to make it feel generic or universal.

3. **Quiet presence.** The app opens, delivers what's needed, and stays out of the way. No onboarding theater, no engagement loops. It earns trust by being reliable and fast every single time.

4. **Reverence through restraint.** Spiritual weight comes from care and proportion, not from calligraphic decoration or atmospheric effects. What isn't there matters as much as what is.

5. **Native-quality on the home screen.** This is a PWA pinned to the iPhone home screen. It should be indistinguishable in polish from a first-party iOS app — not a website in an icon.

## Accessibility & Inclusion

WCAG AA as baseline. Reduced motion is already handled in `globals.css` via `prefers-reduced-motion`. Arabic text rendering uses Amiri/Scheherazade with correct RTL direction and generous line-height. No additional requirements locked in yet.
