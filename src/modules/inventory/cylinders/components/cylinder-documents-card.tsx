"use client";

import type { Cylinder } from "@/modules/inventory/cylinders/schemas";
import { CylinderFileSlots } from "@/modules/inventory/cylinders/components/cylinder-file-slots";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card";

export function CylinderDocumentsCard({ cylinder }: { cylinder: Cylinder }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Documents</CardTitle>
      </CardHeader>
      <CardContent>
        <CylinderFileSlots cylinder={cylinder} />
      </CardContent>
    </Card>
  );
}
