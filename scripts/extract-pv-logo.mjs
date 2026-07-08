import fs from "fs";

const src = fs.readFileSync("tmp/pv-main.svg", "utf8");

function extractSymbol(id) {
  const m = src.match(new RegExp(`<symbol id="${id}"[^>]*>([\\s\\S]*?)</symbol>`));
  if (!m) throw new Error(`${id} not found`);
  return m[1].trim();
}

const iconBody = extractSymbol("pv-icon").replace(
  '<path d="M28.8889 0H0V26H28.8889V0Z"/>',
  '<path d="M28.8889 0H0V26H28.8889V0Z" fill="#2d8f4e"/>',
);

const wordmarkBody = extractSymbol("pv-logo-long").replace(
  /<path /,
  '<path fill="#3d4a5c" ',
);

const out = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 366 61" role="img" aria-label="PV Magazine">
  <g transform="translate(0, 17.5)">
    ${iconBody}
  </g>
  <g transform="translate(38, 0)">
    ${wordmarkBody}
  </g>
</svg>`;

fs.writeFileSync("public/marketing/partners/pv-magazine.svg", out);
console.log("wrote pv-magazine.svg");
