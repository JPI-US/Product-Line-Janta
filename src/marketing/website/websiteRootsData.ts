/**
 * Roots ("Our Roots" / Gambia story) page copy — rebuilt from the Janta
 * Clean-Energy-Gambia prototype. All imagery is local under /marketing/roots/.
 */
export const ROOTS_COPY = {
  hero: {
    eyebrow: "Janta",
    tagline: ["Born in Gambia,", "built for the world."],
    image: "/marketing/roots/roots-hero.jpg",
    imageAlt: "Coastline in The Gambia at dawn",
  },
  origin: {
    title: "Where Janta began.",
    body:
      "Founder Mohammed Njie grew up in rural Gambia, where unreliable energy is almost commonplace in everyday life. Seeing these struggles firsthand, he reimagined solar the way trees grow — upward, not outward — delivering more energy from less land so affordable power can finally reach the people who need it most.",
    image: "/marketing/roots/roots-beginnings.jpg",
    imageAlt: "Founder Mohammed Njie presenting Janta Power",
  },
  stats: [
    { n: "2.4M", l: "People across The Gambia" },
    { n: "3D", l: "Vertical solar architecture" },
    { n: "+60%", l: "Energy per square meter" },
    { n: "1st", l: "Solar-powered school in Tintinto" },
  ],
  gallery: {
    title: "The smiling coast of Africa.",
    body:
      "A diverse, multi-lingual society of 2.4 million — the smallest country on mainland Africa. Village life is rich with community and tradition, yet many rural families still gather firewood before sunset and send children to schools that have gone years without reliable power.",
    items: [
      { src: "/marketing/roots/roots-hero.jpg", cap: "Coastline at dawn — Kombo" },
      { src: "/marketing/roots/roots-solar-field.jpg", cap: "Fields awaiting energy — rural Gambia" },
      { src: "/marketing/roots/roots-beginnings.jpg", cap: "Sharing the vision — Silicon Valley" },
      { src: "/marketing/roots/roots-highlight-poster.jpg", cap: "Village life — community and tradition" },
    ],
  },
  founder: {
    name: "Mohammed Njie",
    role: "Founder, Janta",
    image: "/marketing/roots/mohamed-founder.jpg",
    imageAlt: "Mohammed Njie, Founder of Janta",
    quote:
      "There's a lot of things children wouldn't necessarily be able to learn, just because they don't have electricity. When it gets dark, that's it — everybody has to go home. Reliable, clean energy could change that.",
  },
  firewood: {
    quote:
      "Fetching firewood is exhausting. Every time we come out of our houses, it requires a lot of effort to fetch the firewood.",
    attribution: "Fatou, resident of Tintinto village",
    poster: "/marketing/roots/roots-highlight-poster.jpg",
  },
  film: {
    /** Drop the reel at this path in public/ to enable playback; poster shows until then */
    src: "/marketing/roots/roots-highlight.mp4",
    poster: "/marketing/roots/roots-highlight-poster.jpg",
  },
  impact: {
    title: "Let there be light.",
    body:
      "Our pilot brings reliable, affordable 3D solar to the places that need it most — starting with a school that had gone 15 years without electricity.",
    image: "/marketing/roots/roots-solar-field.jpg",
    imageAlt: "Janta three-dimensional solar tower at Tintinto",
    columns: [
      {
        kicker: "The school",
        title: "Tintinto Lower Basic School",
        body:
          "Founded in 2009. Operated 15 years without electricity. For the first time, students have consistent light and the library can support computers.",
      },
      {
        kicker: "How we solve it",
        title: "3D solar, one tower at a time",
        body:
          "A single Janta tower generates more energy than a traditional flat array of comparable footprint — critical where land and grid access are scarce.",
      },
      {
        kicker: "What's next",
        title: "From one school to a region",
        body:
          "Tintinto is the first of many. We're scaling toward clinics, market halls, and homes across The Gambia and beyond.",
      },
    ],
  },
  cta: {
    title: "Power that reaches everyone.",
    body:
      "Partner with Janta to bring reliable, affordable 3D solar to your community, campus, or country.",
    primary: { label: "Get in touch", href: "/contact" },
    secondary: { label: "Learn more", href: "#roots-impact" },
  },
} as const;
