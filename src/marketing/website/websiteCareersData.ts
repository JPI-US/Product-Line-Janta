const CAREERS_HERO_IMAGE = {
  image: "/marketing/careers-hero.jpg",
  imageAvif: "/marketing/careers-hero.avif",
  imageWebp: "/marketing/careers-hero.webp",
  imageAlt:
    "Janta DSR solar tower on a grassy hillside beside a modern glass building under a clear sky",
} as const;

const CAREERS_ROLE_IMAGE = {
  image: "/marketing/careers-role.jpg",
  imageAvif: "/marketing/careers-role.avif",
  imageWebp: "/marketing/careers-role.webp",
  imageAlt:
    "Supply chain professional reviewing a tablet on a warehouse floor",
} as const;

export const CAREERS_COPY = {
  hero: {
    title: "Join the Power Behind the Future",
    subtitle:
      "Be part of a team building the next generation of energy: bold, innovative, and made to scale.",
    ...CAREERS_HERO_IMAGE,
  },
  positions: {
    title: "Open position",
    items: [
      {
        id: "supply-chain-leader",
        title: "Supply Chain Leader",
        tags: ["Dallas, TX", "Hybrid", "Full-time", "$50-$60 / hr"] as const,
        description:
          "Drive supply chain and sourcing strategy to safely scale new technology from design to deployment across cross-functional teams.",
        applyHref:
          "https://www.indeed.com/job/supply-chain-leader-ae7f7f059498fe09",
        applyLabel: "Learn more",
        ...CAREERS_ROLE_IMAGE,
      },
    ],
  },
} as const;
