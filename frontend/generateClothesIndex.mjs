

import fs from "fs";
import path from "path";

const baseDir = "./assets/clothes"; // index.js buraya oluşturulacak
const outputFile = path.join(baseDir, "index.js");
const imageExtensions = [".jpg", ".jpeg", ".png"];

function getImagesFromType(type) {
  const typeDir = path.join(baseDir, type);
  if (!fs.existsSync(typeDir)) return {};

  const categories = fs.readdirSync(typeDir).filter((f) =>
    fs.statSync(path.join(typeDir, f)).isDirectory()
  );

  const result = {};

  categories.forEach((category) => {
    const catDir = path.join(typeDir, category);
    const files = fs.readdirSync(catDir).filter((f) =>
      imageExtensions.includes(path.extname(f).toLowerCase())
    );

    result[category] = files.map(
      (file) => `require("./${type}/${category}/${file}")`
    );
  });

  return result;
}

// train ve test altındaki kategorileri birleştir
const trainImages = getImagesFromType("train");
const testImages = getImagesFromType("test");

// tüm kategoreleri birleştir
const allCategories = { ...trainImages, ...testImages };

const content =
  "// Bu dosya otomatik oluşturuldu\n\nexport const clothes = {\n" +
  Object.entries(allCategories)
    .map(([cat, imgs]) => `  "${cat}": [\n    ${imgs.join(",\n    ")}\n  ]`)
    .join(",\n") +
  "\n};\n";

fs.writeFileSync(outputFile, content);
console.log("✅ assets/clothes/index.js başarıyla oluşturuldu!");