import fs from "fs";
import path from "path";

const baseDir = "./assets/clothing"; // index.js buraya oluşturulacak
const outputFile = path.join(baseDir, "index.js");
const imageExtensions = [".jpg", ".jpeg", ".png"];
const MAX_IMAGES_PER_CATEGORY = 200; // Limit images per category to avoid bundler issues

function getImagesFromType(type, maxPerCategory = Infinity) {
  const typeDir = path.join(baseDir, type);
  if (!fs.existsSync(typeDir)) return {};

  const categories = fs.readdirSync(typeDir).filter((f) =>
    fs.statSync(path.join(typeDir, f)).isDirectory()
  );

  const result = {};

  categories.forEach((category) => {
    const catDir = path.join(typeDir, category);
    let files = fs.readdirSync(catDir).filter((f) =>
      imageExtensions.includes(path.extname(f).toLowerCase())
    );
    
    // Sort files for consistent ordering, then limit
    files.sort();
    if (files.length > maxPerCategory) {
      files = files.slice(0, maxPerCategory);
    }

    // Normalize category names: convert t-shirt to t-shirt, keep others as-is
    const normalizedCategory = category;
    
    if (!result[normalizedCategory]) {
      result[normalizedCategory] = [];
    }

    // Add all images from this type/category combination
    files.forEach((file) => {
      result[normalizedCategory].push(`require("./${type}/${category}/${file}")`);
    });
  });

  return result;
}

// Use only train set for now (largest set) to avoid bundler issues
// You can add test and validation if needed, but limit total images
const trainImages = getImagesFromType("train", MAX_IMAGES_PER_CATEGORY);
const testImages = getImagesFromType("test", 50); // Limit test set
const validationImages = getImagesFromType("validation", 50); // Limit validation set

// Tüm kategorileri birleştir (aynı kategorideki tüm görselleri birleştir)
const allCategories = { ...trainImages };

// Test ve validation görsellerini de ekle (limited)
Object.keys(testImages).forEach((category) => {
  if (!allCategories[category]) {
    allCategories[category] = [];
  }
  // Limit total per category
  const currentCount = allCategories[category].length;
  const toAdd = testImages[category].slice(0, Math.max(0, MAX_IMAGES_PER_CATEGORY - currentCount));
  allCategories[category] = allCategories[category].concat(toAdd);
});

Object.keys(validationImages).forEach((category) => {
  if (!allCategories[category]) {
    allCategories[category] = [];
  }
  // Limit total per category
  const currentCount = allCategories[category].length;
  const toAdd = validationImages[category].slice(0, Math.max(0, MAX_IMAGES_PER_CATEGORY - currentCount));
  allCategories[category] = allCategories[category].concat(toAdd);
});

// Dosya içeriğini oluştur
const content =
  "// Bu dosya otomatik oluşturuldu\n\nexport const clothes = {\n" +
  Object.entries(allCategories)
    .map(([cat, imgs]) => `  "${cat}": [\n    ${imgs.join(",\n    ")}\n  ]`)
    .join(",\n") +
  "\n};\n";

fs.writeFileSync(outputFile, content);
console.log("✅ assets/clothing/index.js başarıyla oluşturuldu!");
console.log(`📦 Toplam ${Object.keys(allCategories).length} kategori oluşturuldu.`);
Object.keys(allCategories).forEach((cat) => {
  console.log(`   - ${cat}: ${allCategories[cat].length} görsel`);
});

