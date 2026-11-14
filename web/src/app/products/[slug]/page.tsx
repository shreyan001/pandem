import { notFound } from "next/navigation";
import { ENRICHED_PRODUCTS } from "@pandem/shared";
import { ProductDetailClient } from "./ProductDetailClient";

export default async function ProductDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const product = ENRICHED_PRODUCTS.find(
    (p) => p.slug.toLowerCase() === slug.toLowerCase()
  );

  if (!product) {
    notFound();
  }

  return <ProductDetailClient product={product} />;
}
