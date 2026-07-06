const JANTAGM_IMG =
  "https://images.squarespace-cdn.com/content/v1/5e8618a2cd1f6c5ba81a3384";

function img(path: string, width = 1600) {
  return `${JANTAGM_IMG}/${path}?format=${width}w`;
}

export const ROOTS_COPY = {
  hero: {
    title: "Janta",
    tagline: ["Born in Gambia,", "built for the world."],
    image: "/marketing/roots/roots-hero.png",
    imageAlt: "Mountain lake landscape at golden hour",
  },
  beginnings: {
    title: "Where Janta began",
    body:
      "Founder Mohammed Njie grew up in rural Gambia, where unreliable energy is almost commonplace in everyday life. Seeing these struggles, he reimagined solar the way trees grow, upward and not outward, creating three-dimensional solar technology that delivers more energy from less land, so affordable power can reach the people who need it most.",
    image: "/marketing/roots/roots-beginnings.png",
    imageAlt: "Mohammed Njie presenting Janta Power",
  },
  gallery: {
    images: [
      {
        id: "firewood",
        src: img("1599492500658-O8Y9LUZXKYBNY6GUFE4D/Journey+to+fetch+firewood+arial+view+55.JPG"),
        alt: "The walk for firewood near Tintinto",
        fit: "wide",
      },
      {
        id: "school",
        src: img("1594611082079-QKA758VD2UDC792J05XR/Tintinto+School+arial+view+26.JPG"),
        alt: "Tintinto Primary and Secondary School",
        fit: "landscape",
      },
      {
        id: "gathering",
        src: img("1595128698014-APXGKMEOBF4SVG5AAJKO/pic+23.png"),
        alt: "Community gathering in The Gambia",
        fit: "landscape",
      },
      {
        id: "carrying",
        src: img("1599492618146-6Y6DTXJPPKO2D4XN62MB/DSCN0054.JPG"),
        alt: "Carrying firewood home",
        fit: "portrait",
      },
      {
        id: "village",
        src: img("1595128739380-KSSXN5YSVWBB199DV64I/pic+6.png"),
        alt: "Village life in rural Gambia",
        fit: "portrait",
      },
      {
        id: "daily",
        src: img("1595128912726-Q1R8PZP92G9PNQWOA1LL/pic+5.png"),
        alt: "Daily life in a Gambian village",
        fit: "wide",
      },
      {
        id: "children",
        src: img("1595129107134-J35Y0QLV4GBKY6TLWV13/pic+21.png"),
        alt: "Village children",
        fit: "portrait",
      },
      {
        id: "celebration",
        src: img("1595129104603-QH8XQNWY553S2744I615/pic+13.png"),
        alt: "Community celebration",
        fit: "landscape",
      },
      {
        id: "destination",
        src: img("1599495654739-OX1OP597SX6P1YAR5I69/Journey+to+fetch+firewood+2.jpg"),
        alt: "Women cooking with gathered firewood in Tintinto village",
        fit: "landscape",
      },
    ],
    columns: [
      ["firewood", "destination"],
      ["school", "daily"],
      ["village"],
      ["gathering", "carrying", "celebration", "children"],
    ],
  },
  gambia: {
    title: "The Gambia",
    body:
      "Known as the smiling coast of Africa, The Gambia is a diverse, multi-lingual society of about 2.4 million people, the smallest country on mainland Africa. Village life is rich with community and tradition, yet many rural families still gather firewood before sunset, walk long distances for water, and send children to schools that have gone years without reliable power.",
    spotlight: {
      title: "Let there be light!",
      body:
        "For the first time, Tintinto school now has access to electricity from the use of Solar PV. The school was founded in 2009 and has had to operate without any electricity. In addition to having lights, the library now can have computers for both students and teachers. This opens up so many possibilities for the school, and we anticipate an imminent transition towards digitized education.",
      image: img(
        "1599504864034-LI79UKT18L8JY2X6UCJG/PHOTO-2020-06-14-18-18-29+v.jpg",
      ),
      imageAlt: "Tintinto school library with lights and bookshelves",
    },
  },
  founder: {
    name: "Mohammed Njie",
    role: "Founder",
    image: "/marketing/roots/mohamed-og.png",
    imageAlt: "Mohammed Njie, founder of Janta Energy",
    quote:
      "There's a lot of things children wouldn't necessarily be able to learn, just because they don't have electricity. When it gets dark: that's it, everybody has to go home. Reliable, sustainable, clean energy could change that.",
  },
  film: {
    src: "/marketing/roots/roots-highlight.mp4",
    poster: "/marketing/roots/roots-highlight-poster.jpg",
  },
  cta: {
    title: "How we solve it",
    body:
      "Communities like Tintinto need dense, dependable power without clearing land or waiting years for grid expansion. Janta's three-dimensional solar generates more energy from a smaller footprint, bringing reliable energy to remote schools, villages, and communities that can't afford to stay in the dark.",
    image: "/marketing/roots/roots-solar-field.png",
    imageAlt: "Janta three-dimensional solar arrays in a rural field",
  },
} as const;
