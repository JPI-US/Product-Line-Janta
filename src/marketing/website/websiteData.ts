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
  brandAria: "Janta Power — home",
  brandHref: "/",
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
  sub:
    "Janta Power builds vertically scaling, sun-tracking 3D solar towers for commercial, industrial, and utility projects where land is at a premium.",
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
      value: "34%",
      prefix: "Up to",
      label: "Capacity Factor",
    },
  ],
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
  title: "Power your land without giving it all away.",
  body: "Janta Power delivers fast-deploying solar systems designed to save acres.",
  savingsCta: "Schedule a Consultation",
  /* External Calendly booker (opens in a new tab). */
  savingsHref: "https://calendly.com/jantapower/connect",
  image: "/marketing/roi-hero.png",
  imageAlt: "Solar towers in a field beside a vegetable garden at golden hour",
} as const;

export const CONTACT_PAGE_COPY = {
  eyebrow: "Get in touch",
  title: "Contact us",
  lede:
    "Tell us about your site or project. We'll follow up by email within one business day.",
  quizTitle: "See your savings",
  quizBody:
    "Answer a few quick questions and we'll estimate project size, land usage, and lifetime savings for your project.",
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

export const YIELD_COMPARE_COPY = {
  title: "Traditional Solar vs. Janta Towers",
  description: "500 kW · Dallas, TX",
  janta: {
    image: "/marketing/value-aerial-solar.png",
    imageAlt: "Aerial view of Janta solar arrays in a green field",
    imagePosition: "50% center",
    /* Rest: zoomed in so the towers read large. Hover eases to 1.0, which in a
       4:3 cover frame is exactly 4x3 towers (the max the crop can reveal). */
    imageScale: 1.28,
  },
  fixed: {
    image: "/marketing/yield-traditional-solar.jpg",
    imageAlt: "Aerial view of traditional fixed-tilt solar panels in a green field",
    imagePosition: "center center",
    imageScale: 1.22,
  },
  metrics: {
    annual: "Annual output",
    land: "Site footprint",
  },
  scale: {
    heading: "The same power.",
    /* Cycles under the static line — same nameplate power, but less land AND more
       yield. `*word*` marks the words that get the gradient highlight. */
    headingAccentPhrases: [
      "A *fraction* of the *land*.",
      "*More energy*.",
      "*Higher capacity factor*.",
    ],
    lede: "Slide the project size and watch the footprint diverge.  Traditional solar sprawls while Janta stays compact.",
    traditionalLabel: "Traditional",
    jantaLabel: "Janta",
    acresUnit: "acres",
    ctaLabel: "See what your site could save",
  },
  /* 1:1 comparison plates — same project on both sides, so the spec repeats. */
  plates: {
    spec: "500 kW · Dallas, TX",
    traditionalName: "Traditional Solar Array",
    jantaName: "Janta Power Towers",
  },
} as const;

export const POWER_PROFILE_COPY = {
  lede: "Single 5.6 kW tower. Dual peak power output curve.",
} as const;

export const SPECS_LITE_COPY = {
  title: "Built for real-world sites",
  lead: "Structural ratings and power flexibility at a glance.",
  image: "/marketing/specs-real-world-sites.png",
  imageAlt: "Janta solar towers on an urban plaza with a city skyline behind",
  imagePosition: "center 42%",
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
      id: "c3",
      name: "C3",
      logo: "/marketing/partners/c3-white.png",
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
    "Janta's vertically scaling solar technology delivers the lowest energy cost on the market, alongside 4-tier resilience, cutting edge software, and uncomparable energy density.",
  items: [
    {
      id: "density",
      tag: "Density",
      metric: "500",
      metricUnit: "kW / acre",
      title: "Power density per acre",
      detail:
        "More power from the same footprint, without giving up operational land.",
      image: "/marketing/value-field-towers.jpg",
      imageAlt: "Three Janta solar towers on a grassy hillside under a cloudy sky",
      imagePosition: "center 48%",
      imageScale: 1.2,
    },
    {
      id: "lcoe",
      tag: "Economics",
      metric: "$0.05",
      metricUnit: "/ kWh",
      title: "Average U.S. LCOE",
      detail:
        "Project-lifetime energy that undercuts flat arrays, with costs that stay predictable.",
      image: "/marketing/value-dsr-campus.png",
      imageAlt: "Janta DSR solar tower on a commercial campus",
      imagePosition: "52% center",
      imageScale: 1.32,
    },
    {
      id: "resilience",
      tag: "Resilience",
      metric: "4-Tier",
      metricUnit: "Resilience",
      title: "Plug & play backup power",
      detail:
        "Layered backup power that installs fast and keeps critical loads running when the grid drops.",
      image: "/marketing/roi-hero.png",
      imageAlt: "Solar towers in a field beside a vegetable garden at golden hour",
      imagePosition: "28% 42%",
      imageScale: 1.12,
    },
  ],
  stats: [
    {
      id: "density",
      metric: "500",
      metricUnit: "kW / acre",
      title: "Power density per acre",
    },
    {
      id: "lcoe",
      metric: "$0.05",
      metricUnit: "/ kWh",
      title: "Average U.S. LCOE",
    },
    {
      id: "resilience",
      metric: "4-Tier",
      metricUnit: "Resilience",
      title: "Plug & play backup power",
    },
  ],
} as const;

export const SOFTWARE_SHOWCASE_COPY = {
  title: "One Dashboard, Every Tower",
  body: "Monitor output, health, and performance across your fleet in real time.",
  cta: "Contact us",
  ctaHref: "/contact",
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
  description:
    "Industries and sites where land, uptime, and power density matter most.",
  panels: [
    {
      id: "manufacturing",
      title: "Manufacturing",
      body: "Maximize megawatts per acre on active factory sites, without sacrificing roofs, yards, or uptime.",
      image: applicationsPhoto("photo-1727870752423-4d51d5b500c7"),
      imageAlt: "Modern manufacturing plant exterior",
      imagePosition: "center 50%",
    },
    {
      id: "logistics",
      title: "Logistics",
      body: "High-density power for distribution hubs on tight footprints. Truck lanes and staging yards stay clear.",
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
      body: "Local, high-output power for fast chargers and fleet depots. Scale charging without sprawling ground arrays.",
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
      hoverCta: "Get in touch",
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
      href: "/contact",
    },
    {
      id: "utility",
      acronym: "LFM",
      title: "Tower",
      tags: ["5.6 kW", "Azimuthal tracking", "Utility-scale"],
      hoverCta: "Get in touch",
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
      href: "/contact",
    },
  ],
} as const;

export const FOOTER_COPY = {
  brand: "Janta Power",
  blurb:
    "Three-dimensional solar for campuses, commercial sites, and utility-scale deployments.",
  exploreTitle: "Explore",
  exploreLinks: [
    { label: "Home", href: "/" },
    { label: "Careers", href: "/careers" },
    { label: "Contact", href: "/contact" },
    { label: "Savings quiz", href: "/quiz" },
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
  contactEmail: "info@jantaus.com",
  contactPhone: "(469) 694-3818",
  contactPhoneTel: "+14696943818",
  copyright: "© 2026 Janta Power, Inc. All rights reserved.",
  location: "2265 Monitor St, Dallas TX, 75207",
} as const;
