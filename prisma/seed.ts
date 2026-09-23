import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

/**
 * 示例数据：3 个分类 + 8 个商品（英法双语，价格为加分整数）。
 * 用 upsert 实现，可重复运行，不会产生重复数据。
 */
const categories = [
  {
    slug: "3d-prints",
    nameEn: "3D-Printed Home Goods",
    nameFr: "Articles maison imprimés en 3D",
    descEn: "Planters, organizers, hooks and décor — printed to order.",
    descFr: "Jardinières, organisateurs, crochets et déco — imprimés sur commande.",
    sortOrder: 1,
  },
  {
    slug: "acrylic-diy",
    nameEn: "Acrylic DIY",
    nameFr: "Acrylique DIY",
    descEn: "Cabinet doors, display cases and custom-cut panels.",
    descFr: "Portes d'armoire, vitrines et panneaux découpés sur mesure.",
    sortOrder: 2,
  },
  {
    slug: "small-goods",
    nameEn: "Small Goods",
    nameFr: "Petits articles",
    descEn: "Everyday clever things, gifts and gadgets.",
    descFr: "Petites choses astucieuses du quotidien, cadeaux et gadgets.",
    sortOrder: 3,
  },
];

const products = [
  {
    slug: "hexagon-wall-planter",
    categorySlug: "3d-prints",
    nameEn: "Hexagon wall planter",
    nameFr: "Jardinière murale hexagonale",
    descEn: "Modular hexagon planter, prints in PLA. 12 cm wide.",
    descFr: "Jardinière hexagonale modulaire, imprimée en PLA. 12 cm de large.",
    priceCents: 2499,
    stockQty: 20,
    isFeatured: true,
  },
  {
    slug: "acrylic-display-case",
    categorySlug: "acrylic-diy",
    nameEn: "Acrylic display case",
    nameFr: "Vitrine en acrylique",
    descEn: "Crystal-clear 3 mm acrylic case, 20 × 20 × 30 cm.",
    descFr: "Vitrine en acrylique transparent 3 mm, 20 × 20 × 30 cm.",
    priceCents: 3999,
    stockQty: 12,
    isFeatured: true,
  },
  {
    slug: "cable-organizer-set",
    categorySlug: "3d-prints",
    nameEn: "Cable organizer set",
    nameFr: "Ensemble organiseur de câbles",
    descEn: "Set of 6 clips and 2 under-desk trays.",
    descFr: "Ensemble de 6 pinces et 2 plateaux sous-bureau.",
    priceCents: 1299,
    stockQty: 50,
    isFeatured: true,
  },
  {
    slug: "mini-drawer-box",
    categorySlug: "small-goods",
    nameEn: "Mini drawer box",
    nameFr: "Mini boîte à tiroirs",
    descEn: "4-drawer mini organizer for desk bits and bobs.",
    descFr: "Mini organisateur à 4 tiroirs pour le bureau.",
    priceCents: 1899,
    stockQty: 30,
    isFeatured: true,
  },
  {
    slug: "honeycomb-wall-shelf",
    categorySlug: "3d-prints",
    nameEn: "Honeycomb wall shelf",
    nameFr: "Étagère murale alvéolée",
    descEn: "Interlocking honeycomb shelves, expand as you like.",
    descFr: "Étagères alvéolées emboîtables, extensibles à volonté.",
    priceCents: 3499,
    stockQty: 15,
    isFeatured: false,
  },
  {
    slug: "acrylic-cabinet-door",
    categorySlug: "acrylic-diy",
    nameEn: "Custom acrylic cabinet door",
    nameFr: "Porte d'armoire en acrylique sur mesure",
    descEn: "Made-to-measure 4.5 mm acrylic door for IKEA-style cabinets.",
    descFr: "Porte en acrylique 4,5 mm sur mesure, pour armoires de type IKEA.",
    priceCents: 5999,
    stockQty: 8,
    isFeatured: false,
  },
  {
    slug: "desk-headphone-stand",
    categorySlug: "3d-prints",
    nameEn: "Desk headphone stand",
    nameFr: "Support de casque pour bureau",
    descEn: "Sturdy printed stand with cable groove.",
    descFr: "Support imprimé robuste avec rainure pour câble.",
    priceCents: 2799,
    stockQty: 25,
    isFeatured: false,
  },
  {
    slug: "seed-starter-tray",
    categorySlug: "small-goods",
    nameEn: "Seed starter tray",
    nameFr: "Plateau de semis",
    descEn: "12-cell starter tray for windowsill gardening.",
    descFr: "Plateau de 12 alvéoles pour le jardinage au rebord de fenêtre.",
    priceCents: 1599,
    stockQty: 40,
    isFeatured: false,
  },
];

async function main() {
  for (const c of categories) {
    await prisma.category.upsert({
      where: { slug: c.slug },
      update: { ...c },
      create: { ...c },
    });
  }

  for (const p of products) {
    const category = await prisma.category.findUnique({
      where: { slug: p.categorySlug },
    });
    const { categorySlug, ...data } = p;
    const product = await prisma.product.upsert({
      where: { slug: p.slug },
      update: { ...data, categoryId: category?.id ?? null },
      create: { ...data, categoryId: category?.id ?? null },
    });
    // 记录初始库存（幂等：先清掉该商品的 "seed" 记录再写）
    await prisma.inventoryLog.deleteMany({
      where: { productId: product.id, reason: "seed" },
    });
    await prisma.inventoryLog.create({
      data: {
        productId: product.id,
        change: p.stockQty,
        reason: "seed",
      },
    });
  }

  console.log("Seed done: 3 categories, 8 products.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
