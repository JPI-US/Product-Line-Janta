/**
 * Deployment data + icon shared by the interactive globe (desktop, three.js)
 * and the static mobile version. Kept three-free so importing it never pulls
 * the three bundle onto mobile.
 */

export type Site = {
  name: string;
  country: string;
  status: "Live" | "Coming soon";
  icon: "airport" | "stadium" | "pin";
  lat: number;
  lon: number;
  text: string;
};

export const SITES: Site[] = [
  {
    name: "Dallas",
    country: "USA",
    status: "Live",
    icon: "airport",
    lat: 32.9,
    lon: -97.0,
    text: "DFW International Airport — solar towers powering one of the busiest airports in the US. Also deployed across FIFA World Cup fan zones.",
  },
  {
    name: "Houston",
    country: "USA",
    status: "Live",
    icon: "stadium",
    lat: 29.76,
    lon: -95.37,
    text: "FIFA World Cup fan zones — clean power for the world's biggest sporting event.",
  },
  {
    name: "Munich",
    country: "Germany",
    status: "Coming soon",
    icon: "pin",
    lat: 48.14,
    lon: 11.58,
    text: "Next deployment underway in the heart of Germany.",
  },
  {
    name: "Malaga",
    country: "Spain",
    status: "Coming soon",
    icon: "pin",
    lat: 36.72,
    lon: -4.42,
    text: "Upcoming installation on the Spanish coast.",
  },
];

export function Icon({ type }: { type: Site["icon"] }) {
  const common = {
    width: 22,
    height: 22,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.6,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
  };
  if (type === "airport")
    return (
      <svg {...common}>
        <path d="M2 14l20-6-2.5 8-5 1-3.5 4-1-4-8-3Z" />
      </svg>
    );
  if (type === "stadium")
    return (
      <svg {...common}>
        <ellipse cx="12" cy="10" rx="9" ry="4" />
        <path d="M3 10v4c0 2.2 4 4 9 4s9-1.8 9-4v-4" />
      </svg>
    );
  return (
    <svg {...common}>
      <path d="M12 21s7-5.5 7-11a7 7 0 0 0-14 0c0 5.5 7 11 7 11Z" />
      <circle cx="12" cy="10" r="2.5" />
    </svg>
  );
}
