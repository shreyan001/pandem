import { notFound } from "next/navigation";
import { ENRICHED_PRODUCTS } from "@pandem/shared";
import { AccessClient } from "./AccessClient";

export default async function AccessPage({
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

  return <AccessClient slug={slug} />;
}
