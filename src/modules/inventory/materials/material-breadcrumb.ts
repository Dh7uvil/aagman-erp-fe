import { formatMicronLabel, materialSizeLabel } from "@/modules/inventory/format";
import { materialRoutes } from "@/modules/inventory/materials/routes";
import type { Material, MaterialHistorySummary } from "@/modules/inventory/materials/schemas";
import type { BreadcrumbCrumb } from "@/shared/components/layout/breadcrumb";

export function materialSkuBreadcrumbCrumbs({
  materialId,
  productName,
  micronId,
  micronName,
  sizeLabel,
  linkProductAndMicron = true,
  linkSize = true,
}: {
  materialId: string;
  productName: string;
  micronId?: string;
  micronName: string;
  sizeLabel: string;
  /** When false, product and micron are text-only (current page is deeper). */
  linkProductAndMicron?: boolean;
  linkSize?: boolean;
}): BreadcrumbCrumb[] {
  const viewBase = materialRoutes.view(materialId);
  const micronHref =
    micronId != null && micronId !== ""
      ? `${viewBase}?micron=${encodeURIComponent(micronId)}`
      : viewBase;

  const crumbs: BreadcrumbCrumb[] = [
    {
      label: productName,
      href: linkProductAndMicron ? viewBase : undefined,
    },
  ];

  const micron = micronName.trim();
  if (micron) {
    crumbs.push({
      label: formatMicronLabel(micron),
      href: linkProductAndMicron ? micronHref : undefined,
    });
  }

  const size = sizeLabel.trim();
  if (size) {
    crumbs.push({
      label: size,
      href: linkSize ? viewBase : undefined,
    });
  }

  return crumbs;
}

export function materialHistoryBreadcrumbCrumbs(
  materialId: string,
  summary?: MaterialHistorySummary,
  material?: Material,
): BreadcrumbCrumb[] | null {
  const productName =
    summary?.product_name?.trim() || material?.product_name?.trim() || "";
  if (!productName) {
    return null;
  }

  const micronName = summary?.micron_name ?? material?.micron_name ?? "";
  const sizeLabel =
    summary?.size_label?.trim() ||
    (material ? materialSizeLabel(material) : "");

  return materialSkuBreadcrumbCrumbs({
    materialId,
    productName,
    micronId: material?.micron_id,
    micronName,
    sizeLabel,
    linkProductAndMicron: true,
    linkSize: true,
  });
}

export function materialViewBreadcrumbCrumbs(
  sku: Material,
  selectedMicronId: string,
  selectedMicronName: string,
): BreadcrumbCrumb[] {
  return materialSkuBreadcrumbCrumbs({
    materialId: sku.id,
    productName: sku.product_name,
    micronId: selectedMicronId || sku.micron_id,
    micronName: selectedMicronName || sku.micron_name,
    sizeLabel: materialSizeLabel(sku),
    linkProductAndMicron: true,
    linkSize: false,
  });
}

export function materialProductMicronBreadcrumbCrumbs(
  anchorMaterial: Material,
  selectedMicronId: string,
  selectedMicronName: string,
): BreadcrumbCrumb[] {
  return materialSkuBreadcrumbCrumbs({
    materialId: anchorMaterial.id,
    productName: anchorMaterial.product_name,
    micronId: selectedMicronId || anchorMaterial.micron_id,
    micronName: selectedMicronName || anchorMaterial.micron_name,
    sizeLabel: "",
    linkProductAndMicron: true,
    linkSize: false,
  });
}
