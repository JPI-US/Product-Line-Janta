/** Brand palette — aligned with product line / DSR pages (:root + tower-3d) */

export const BRAND = {
  highlight: "#ffbf14",
  cta: "#ffbf14",
  ctaHover: "#d9a612",
  ctaWash: "rgba(255, 191, 20, 0.12)",
  accent: "#6ba0e3",
  accentMuted: "#7fa3cf",
  inkDisplay: "#1a2332",
  ink: "#333c4e",
  inkSoft: "#5a6478",
  muted: "#5a6478",
  page: "#faf8f5",
  pageBg: "#f2eee8",
  surface: "#ffffff",
  border: "rgba(58, 46, 34, 0.1)",
} as const;

/** Hero / page shell background — matches --web-page */
export const WEBSITE_PAGE_BG = BRAND.page;

/** Brand sky blue — logo accent + vision hero sky */
export const JANTA_BRAND_SKY = "#64A2D8";

export const NAV_COPY = {
  brand: "Janta Power",
  home: "Home",
  roots: "Janta",
  rootsHref: "/roots",
  careers: "Careers",
  careersHref: "/careers",
  products: "Products",
  contact: "Contact",
  contactHref: "/contact",
  cta: "Contact Us",
  ctaHref: "/contact",
} as const;

export const HERO_COPY = {
  eyebrow: "Janta Power",
  title: ["More MW.", "Less Land."],
  sub: "Three-dimensional solar that doesn't\nspare acres or energy.",
  statsContext: "Compared to traditional solar",
  stats: [
    {
      value: "50%",
      label: "More Energy",
    },
    {
      value: "3X",
      label: "Power/Unit Area",
    },
    {
      value: "32%",
      label: "Capacity Factor",
    },
  ],
} as const;

/** Photo comparison — Janta tower vs traditional fixed-tilt solar (500 kW · Dallas). */
export const YIELD_COMPARE_COPY = {
  title: "Traditional Solar vs. Janta Towers",
  description: "500 kW · Dallas, TX",
  janta: {
    image: "/marketing/yield-janta-tower.png",
    imageAlt: "Janta Power solar tower render against a blue sky",
    imagePosition: "center center",
  },
  fixed: {
    image: "/marketing/yield-traditional-solar.png",
    imageAlt: "Traditional fixed-tilt solar panels at golden hour",
    imagePosition: "center 42%",
  },
  metrics: {
    annual: "Annual output",
    land: "Site footprint",
  },
} as const;

export const VISION_EYEBROW = "Our Vision";

export const VISION_STATEMENT_LINES = [
  "Creating a world where energy is",
  "a fundamental human right.",
] as const;

export const VISION_STATEMENT = VISION_STATEMENT_LINES.join(" ");

export const VISION_HERO_IMAGE = "/marketing/vision-banner.png";

/** Blue → white gradient — matches vision / ROI reference */
export const WEBSITE_SKY_GRADIENT = {
  top: "#3a84dc",
  mid: "#6aacf0",
  bottom: WEBSITE_PAGE_BG,
} as const;

export const ROI_COPY = {
  title: "Save Millions Annually",
  body: "Answer a few quick questions and we'll estimate tower count, land use, and lifetime savings for your project.",
  savingsCta: "Contact us",
  savingsHref: "/contact",
  image: "/marketing/roi-hero.png",
  imageAlt: "Solar towers in a field beside a vegetable garden at golden hour",
} as const;

export const CONTACT_PAGE_COPY = {
  eyebrow: "Get in touch",
  title: "Contact us",
  lede:
    "Tell us about your site or project. We'll follow up by email within one business day.",
  quizEyebrow: "Savings estimate",
  quizTitle: "See your savings",
  quizBody:
    "Answer a few quick questions and we'll estimate tower count, land use, and lifetime savings for your project.",
  quizCta: "Start savings quiz",
  quizHref: "/quiz",
} as const;

export const COMPARE_COPY = {
  title: "Compare.",
  subtitle: "Less land. Lower rates. Faster payback.",
  cta: "Read more",
  ctaHref: "#web-cta-band",
} as const;

export const ROI_COMPARE = {
  traditional: {
    label: "Flat arrays",
    land: "7 acres / MW",
    rate: "$0.12/kWh",
    payback: "~10 yr",
  },
  janta: {
    label: "Janta",
    land: "2 acres / MW",
    rate: "$0.05/kWh",
    payback: "~5 yr",
  },
} as const;

export const PARTNERS_COPY = {
  items: [
    {
      id: "munich",
      name: "Munich Airport",
      logo: "/marketing/partners/munich-airport-white.png",
    },
    {
      id: "greentown",
      name: "Greentown Labs",
      logo: "/marketing/partners/greentown-labs-white.png",
    },
    {
      id: "aena",
      name: "Aena",
      logo: "/marketing/partners/aena-white.png",
    },
    {
      id: "pv-magazine",
      name: "PV Magazine",
      logo: "/marketing/partners/pv-magazine-white.png",
    },
    {
      id: "fifa",
      name: "FIFA",
      logo: "/marketing/partners/fifa-white.png",
    },
    {
      id: "dfw",
      name: "DFW Airport",
      logo: "/marketing/partners/dfw-airport-white.png",
    },
    {
      id: "dallas-innovates",
      name: "Dallas Innovates",
      logo: "/marketing/partners/dallas-innovates-white.png",
    },
  ],
} as const;

export const BENEFITS_COPY = {
  title: "More Power, More Energy,",
  titleEmphasis: "Less Space.",
  items: [
    {
      id: "density",
      end: 3,
      suffix: "×",
      label: "Power / unit area",
    },
    {
      id: "energy",
      end: 50,
      prefix: "+",
      suffix: "%",
      label: "More energy",
    },
    {
      id: "capacity",
      end: 32,
      suffix: "%",
      label: "Capacity factor",
    },
    {
      id: "roi",
      end: 2,
      suffix: "×",
      label: "Annual ROI",
    },
  ],
} as const;

export const VALUE_COPY = {
  title: "Bringing You",
  titleEmphasisWords: [
    "More Power",
    "More Energy",
    "Higher ROI",
    "Fast Installation",
    "Land Savings",
  ] as const,
  body:
    "Janta's solar technology delivers the lowest energy cost in the market, alongside 4-tier resilience, and energy density.",
  items: [
    {
      id: "density",
      tag: "Density",
      metric: "500",
      metricUnit: "kW / acre",
      title: "Power density per acre",
      detail:
        "More power from the same footprint, without giving up operational land.",
      image: "/marketing/value-dsr-campus.png",
      imageAlt: "Janta DSR solar tower on a commercial campus",
      imagePosition: "52% center",
      imageScale: 1.32,
    },
    {
      id: "lcoe",
      tag: "Economics",
      metric: "$0.05",
      metricUnit: "/ kWh",
      title: "Levelized cost of energy",
      detail:
        "Project-lifetime energy that undercuts flat arrays, with costs that stay predictable.",
      image: "/marketing/value-aerial-solar.png",
      imageAlt: "Aerial view of Janta solar arrays in a green field",
      imagePosition: "50% center",
      imageScale: 1.18,
    },
    {
      id: "uptime",
      tag: "Reliability",
      metric: "99%",
      metricUnit: "uptime",
      title: "Target fleet availability",
      detail:
        "Azimuthal tracking and live monitoring keep output steady when the load cannot wait.",
      image: "/marketing/vision-banner.png",
      imageAlt: "Three Janta solar towers in a green field",
      imagePosition: "center 42%",
    },
  ],
} as const;

export const SOFTWARE_SHOWCASE_COPY = {
  title: "One Dashboard, Every Tower",
  body: "Monitor output, health, and performance across your fleet in real time.",
  cta: "Learn More",
  ctaHref: "#web-cta-band",
  poster: "/marketing/software-dashboard-hero.png",
  imageAlt:
    "Janta Power dashboard showing system status, energy output, climate, and environmental impact",
} as const;

export const MEDIA_COPY = {
  title: "In the Media",
  articles: [
    {
      id: "pv-magazine",
      outlet: "PV Magazine USA",
      logo: "/marketing/partners/pv-magazine.svg",
      logoAlt: "PV Magazine USA",
      headline: [
        "3D solar tower raises capacity 50%",
        "and triples solar surface area",
      ],
      href: "https://pv-magazine-usa.com/2025/10/24/3d-solar-tower-increases-capacity-factor-50-triples-solar-surface-area/",
      date: "Oct 2025",
    },
    {
      id: "dallas-innovates",
      outlet: "Dallas Innovates",
      logo: "/marketing/partners/dallas-innovates.png",
      logoAlt: "Dallas Innovates",
      headline: [
        "Dallas 3D solar developer",
        "raises $5.5M seed round",
      ],
      href: "https://dallasinnovates.com/dallas-based-3d-solar-tower-developer-janta-power-raises-5-5m-seed-round/",
      date: "Oct 2025",
    },
    {
      id: "d3-third-derivative",
      outlet: "D3",
      logo: "/marketing/partners/d3-third-derivative.png",
      logoAlt: "Third Derivative",
      headline: [
        "High-density solar deployment",
        "for space-constrained sites",
      ],
      href: "https://www.third-derivative.org/portfolio/janta-power",
      date: "2025",
    },
    {
      id: "inside-climate-news",
      outlet: "Inside Climate News",
      logo: "/marketing/partners/inside-climate-news.svg",
      logoAlt: "Inside Climate News",
      headline: [
        "Dallas startup raises $5.5M",
        "to build vertical solar towers",
      ],
      href: "https://insideclimatenews.org/news/22102025/dallas-startup-3d-solar-towers/",
      date: "Oct 2025",
    },
  ],
} as const;

/** High-res 16:9 crops for the applications accordion */
const APPLICATIONS_IMG =
  "auto=format&fit=crop&w=960&h=540&q=80";

function applicationsPhoto(id: string) {
  return `https://images.unsplash.com/${id}?${APPLICATIONS_IMG}`;
}

export const APPLICATIONS_COPY = {
  title: "Where Janta",
  titleAccent: "Shines",
  panels: [
    {
      id: "manufacturing",
      title: "Manufacturing",
      body: "Maximize megawatts per acre on active factory sites — without sacrificing roofs, yards, or uptime.",
      image: applicationsPhoto("photo-1727870752423-4d51d5b500c7"),
      imageAlt: "Modern manufacturing plant exterior",
      imagePosition: "center 50%",
    },
    {
      id: "logistics",
      title: "Logistics",
      body: "High-density power for distribution hubs on tight footprints — keep truck lanes and staging yards clear.",
      image: applicationsPhoto("photo-1586528116311-ad8dd3c8310d"),
      imageAlt: "Logistics and distribution facilities",
      imagePosition: "center 55%",
    },
    {
      id: "data-centers",
      title: "Data Centers",
      body: "Reliable, dense power beside uptime-critical facilities. More MW in less space, closer to the load.",
      image: applicationsPhoto("photo-1558494949-ef010cbdcc31"),
      imageAlt: "Rows of servers in a modern data center facility",
      imagePosition: "center 40%",
    },
    {
      id: "ev-charging",
      title: "EV Charging",
      body: "Local, high-output power for fast chargers and fleet depots — scale charging without sprawling ground arrays.",
      image: "/marketing/ev-charging.jpg",
      imageAlt: "Electric vehicle charging stations in a parking lot",
      imagePosition: "center 50%",
    },
    {
      id: "aviation",
      title: "Aviation",
      body: "More generation where land cannot sprawl. Airport-grade density built for sites that never stop running.",
      image: applicationsPhoto("photo-1683971336619-d445cbec0276"),
      imageAlt: "Commercial airplane on an airport runway",
      imagePosition: "center 45%",
    },
    {
      id: "agriculture",
      title: "Agriculture",
      body: "Add solar without taking fields out of production. More energy per acre while ground stays open for crops and equipment.",
      image: applicationsPhoto("photo-1560493676-04071c5f467b"),
      imageAlt: "Aerial view of green farmland and crop fields",
      imagePosition: "center 42%",
    },
  ],
} as const;

export const SOLUTIONS_COPY = {
  title: "Tailored Solutions for Your Needs",
  cards: [
    {
      id: "designer",
      acronym: "DSR",
      title: "Tower",
      tags: ["5.4 kW", "Azimuthal tracking", "Custom body"],
      hoverCta: "Visit the 3D experience",
      bannerHeadline: "The DSR Tower.",
      bannerLines: [
        "5.4 kW azimuthal tracking.",
        "Custom enclosure built for your site.",
      ],
      image: "/marketing/dsr-tower.png",
      imageAlt: "Janta Power DSR solar tower installed beside a building on a sunny day",
      imagePosition: "center 58%",
      navImage: "/marketing/nav-renders/lfm-tower.png",
      navRenderAlt: "Janta DSR Tower",
      href: "/products/designer",
    },
    {
      id: "utility",
      acronym: "LFM",
      title: "Tower",
      tags: ["5.6 kW", "Azimuthal tracking", "Utility-scale"],
      hoverCta: "Visit the 3D experience",
      bannerHeadline: "The LFM Tower.",
      bannerLines: [
        "5.6 kW utility-scale output.",
        "Deploy more MW in less land.",
      ],
      image: "/marketing/lfm-tower.png",
      imageAlt: "LFM solar tower arrays deployed outdoors at a Dallas event",
      imagePosition: "center 58%",
      navImage: "/marketing/nav-renders/dsr-tower.png",
      navRenderAlt: "Janta LFM Tower",
      href: "/products/utility",
    },
  ],
} as const;

export const FOOTER_COPY = {
  brand: "Janta Power",
  blurb:
    "Three-dimensional solar for campuses, commercial sites, and utility-scale deployments.",
  exploreTitle: "Explore",
  exploreLinks: [
    { label: "Home", href: "/website" },
    { label: "Janta", href: "/roots" },
    { label: "Careers", href: "/careers" },
    { label: "Contact", href: "/contact" },
    { label: "Savings quiz", href: "/quiz" },
    { label: "DSR Tower", href: "/products/designer", acronym: "DSR", towerTitle: "Tower" },
    { label: "LFM Tower", href: "/products/utility", acronym: "LFM", towerTitle: "Tower" },
  ],
  pressTitle: "In the press",
  pressLinks: [
    { label: "D3 Accelerator Portfolio", href: "https://www.third-derivative.org/portfolio/janta-power" },
    { label: "Dallas Innovates", href: "https://dallasinnovates.com/dallas-based-3d-solar-tower-developer-janta-power-raises-5-5m-seed-round/" },
    { label: "Inside Climate News", href: "https://insideclimatenews.org/news/22102025/dallas-startup-3d-solar-towers/" },
    { label: "PV Magazine USA", href: "https://pv-magazine-usa.com/2025/10/24/3d-solar-tower-increases-capacity-factor-50-triples-solar-surface-area/" },
    {
      label: "Fox News",
      href: "https://www.foxnews.com/tech/texas-startup-raises-5-5m-revolutionary-solar-towers-produce-50-more-energy",
    },
    {
      label: "CleanTechnica",
      href: "https://cleantechnica.com/2025/10/13/texas-startup-aims-to-erect-solar-power-towers-here-there-everywhere/",
    },
  ],
  contactFormTitle: "Contact us",
  contactFormBlurb:
    "Tell us about your site or project. We'll follow up by email within one business day.",
  contactFormCta: "Send message",
  contactFormSuccess:
    "Thanks! Your email app should open with your message ready to send.",
  contactEmail: "hello@jantapower.com",
  contactPhone: "(469) 694-3818",
  contactPhoneTel: "+14696943818",
  copyright: "© 2026 Janta Power, Inc. All rights reserved.",
  location: "2265 Monitor St, Dallas TX, 75207",
} as const;

