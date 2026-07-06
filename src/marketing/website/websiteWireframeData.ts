/** Landing page wireframe — section order and layout notes (post-vision) */

export type WireframeBlock = {
  id: string;
  label: string;
  hint?: string;
};

export type WireframeSection = {
  id: string;
  index: number;
  eyebrow: string;
  title: string;
  layout: string;
  blocks: WireframeBlock[];
};

export const LANDING_WIREFRAME_SECTIONS: WireframeSection[] = [
  {
    id: "gallery",
    index: 1,
    eyebrow: "Applications",
    title: "Where Janta fits",
    layout: "Horizontal scroll, 4–6 cards with image + label",
    blocks: [
      { id: "card-1", label: "Use case card", hint: "Warehouse" },
      { id: "card-2", label: "Use case card", hint: "Data center" },
      { id: "card-3", label: "Use case card", hint: "Retail" },
      { id: "card-4", label: "Use case card", hint: "Municipal" },
      { id: "card-5", label: "Use case card", hint: "Campus" },
    ],
  },
  {
    id: "trust",
    index: 2,
    eyebrow: "Trust",
    title: "Social proof strip",
    layout: "Logo row + optional quote",
    blocks: [
      { id: "logos", label: "Partner / customer logos", hint: "5–7 marks" },
      { id: "quote", label: "Pull quote (optional)", hint: "Single testimonial" },
    ],
  },
  {
    id: "cta",
    index: 3,
    eyebrow: "Get started",
    title: "Run the numbers on your site",
    layout: "Centered CTA, primary + secondary actions",
    blocks: [
      { id: "copy", label: "Headline + short body", hint: "ROI brief hook" },
      { id: "primary", label: "Primary button", hint: "Request ROI brief" },
      { id: "secondary", label: "Secondary button", hint: "Phone / contact" },
    ],
  },
  {
    id: "footer",
    index: 4,
    eyebrow: "Footer",
    title: "Site chrome",
    layout: "Logo, nav links, legal, contact",
    blocks: [
      { id: "brand", label: "Logo + tagline" },
      { id: "links", label: "Link columns", hint: "Product · Company · Legal" },
      { id: "legal", label: "Copyright row" },
    ],
  },
];
