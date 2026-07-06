export type TowerOutput = {
  dailyKwh: string;
  monthlyKwh: string;
  annualKwh: string;
};

export type TowerProduct = {
  id: string;
  tabLabel: string;
  title: string;
  description: string;
  bullets: string[];
  output?: TowerOutput;
  imageUrl: string;
  /** Fine-tune `object-position` for tall or wide hero shots */
  imageObjectPosition?: string;
  comingSoon?: boolean;
};

export const towers: TowerProduct[] = [
  {
    id: "5kw",
    tabLabel: "DSR Tower",
    title: "DSR Tower",
    description:
      "A 5.4 kW tower built for commercial clients who care about sustainability, visibility, and brand presence. Customize side panel finishes alongside our first-of-its-kind tracking technology.",
    bullets: [
      "5.4 kW output sized for commercial visibility and yield",
      "Custom side panel designs for on-site branding",
      "First-of-its-kind dual-axis tracking technology",
    ],
    output: {
      dailyKwh: "28–36",
      monthlyKwh: "840–1,080",
      annualKwh: "10,000–13,000",
    },
    imageUrl: "/towers/5kw-tower.png",
    imageObjectPosition: "center 64%",
  },
  {
    id: "10kw",
    tabLabel: "LFM Tower",
    title: "LFM Tower",
    description:
      "Our flagship 5.6 kW tower built for scalability, affordability, and production, engineered to deploy fast, perform reliably, and scale across sites without compromising yield.",
    bullets: [
      "5.6 kW output sized for scalable, cost-effective deployment",
      "Flagship platform built for volume production and field reliability",
      "Dual-axis tracking tuned for consistent, site-ready performance",
    ],
    output: {
      dailyKwh: "30–38",
      monthlyKwh: "900–1,140",
      annualKwh: "10,800–13,700",
    },
    imageUrl:
      "https://images.unsplash.com/photo-1497435334941-8c899eebdce4?auto=format&fit=crop&w=1200&q=80",
  },
  {
    id: "1.5kw",
    tabLabel: "1.5KW Tower",
    title: "1.5KW Tower",
    description:
      "Compact entry tower for cabins, remote sites, and supplemental loads. Final hardware and software tuning in progress.",
    bullets: [
      "Smallest tower footprint in the lineup",
      "Ideal for off-grid starter systems",
      "Same control stack as larger towers",
    ],
    imageUrl:
      "https://images.unsplash.com/photo-1509391366360-2e959784a276?auto=format&fit=crop&w=1200&q=80",
    comingSoon: true,
  },
  {
    id: "8.5kw",
    tabLabel: "8.5KW Tower",
    title: "8.5KW Tower",
    description:
      "The middleweight performer, with more headroom than 5KW without stepping to full 10KW infrastructure. Perfect for growing electrification.",
    bullets: [
      "Optimized for heat pumps + EV charging stacks",
      "Field-swappable sensor pack",
      "Compatible with upcoming battery interface",
    ],
    imageUrl:
      "https://images.unsplash.com/photo-1545209463-e2976796e786?auto=format&fit=crop&w=1200&q=80",
    comingSoon: true,
  },
];
