"use client";

import Link from "next/link";

import { cylinderReturnRoutes } from "@/modules/inventory/cylinder-returns/routes";
import { jobRoutes } from "@/modules/inventory/jobs/routes";
import type { RelatedDocumentRef } from "@/shared/components/document/schemas";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card";

function documentHref(doc: RelatedDocumentRef): string | null {
  if (doc.document_type === "job") {
    return jobRoutes.view(doc.document_id);
  }
  if (doc.document_type === "cylinder_return") {
    return cylinderReturnRoutes.view(doc.document_id);
  }
  return null;
}

export function RelatedDocumentsCard({ documents }: { documents: RelatedDocumentRef[] }) {
  if (documents.length === 0) {
    return null;
  }
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Related documents</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-2">
        {documents.map((doc) => {
          const href = documentHref(doc);
          const label = `${doc.document_number} (${doc.relationship})`;
          return href ? (
            <Link key={`${doc.document_type}-${doc.document_id}`} href={href} className="text-sm underline">
              {label}
            </Link>
          ) : (
            <span key={`${doc.document_type}-${doc.document_id}`} className="text-sm">
              {label}
            </span>
          );
        })}
      </CardContent>
    </Card>
  );
}
