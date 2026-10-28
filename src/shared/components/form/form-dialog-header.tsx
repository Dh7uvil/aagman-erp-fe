import { RecordCode } from "@/shared/components/form/record-code";
import { DialogHeader, DialogTitle } from "@/shared/components/ui/dialog";

export function FormDialogHeader({
  title,
  entity,
  code,
}: {
  title: string;
  entity: string;
  code?: string | null;
}) {
  return (
    <DialogHeader className="flex flex-col items-start gap-2 space-y-0 pr-8 text-left sm:flex-row sm:items-center sm:justify-between">
      <DialogTitle>{title}</DialogTitle>
      <RecordCode entity={entity} code={code} />
    </DialogHeader>
  );
}
