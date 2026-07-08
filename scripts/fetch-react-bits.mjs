import fs from "fs";
import path from "path";

const names = [
  "FlowingMenu",
  "Aurora",
  "Iridescence",
  "GradientText",
  "DarkVeil",
  "TextType",
  "BorderGlow",
];
const base = "src/marketing/website/react-bits";

for (const name of names) {
  const url = `https://raw.githubusercontent.com/DavidHDev/react-bits/main/public/r/${name}-TS-CSS.json`;
  const res = await fetch(url);
  const json = await res.json();
  for (const file of json.files) {
    const dest = path.join(base, file.path);
    fs.mkdirSync(path.dirname(dest), { recursive: true });
    let content = file.content;
    if (name === "GradientText") {
      content = content.replace("from 'motion/react'", "from 'framer-motion'");
    }
    fs.writeFileSync(dest, content);
    console.log("wrote", dest);
  }
}
