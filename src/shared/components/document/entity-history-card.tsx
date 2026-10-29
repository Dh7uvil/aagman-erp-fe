"use client";

import { Expand, FileText, ImageIcon, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";

import { jobsApi } from "@/modules/inventory/jobs/api";
import type { EntityHistoryEntry, Job } from "@/modules/inventory/jobs/schemas";
import {
  formatAuditValue,
  humanizeAuditField,
} from "@/modules/users-management/audit-logs/audit-log-format";
import { DataTableEmpty, DataTableError } from "@/shared/components/data-table/states";
import { Avatar, AvatarFallback } from "@/shared/components/ui/avatar";
import { Badge, StatusBadge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { Dialog, DialogContent, DialogTitle } from "@/shared/components/ui/dialog";
import { Skeleton } from "@/shared/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/shared/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/shared/components/ui/table";
import { cn } from "@/shared/lib/cn";
import { formatDate, formatDateTime, initials, titleCase } from "@/shared/lib/format";

const DETAIL_CARD_CLASS =
  "bg-muted/30 border-border mt-2 rounded-md border px-3 py-2.5 text-sm shadow-sm";

const HISTORY_TAB_TRIGGER_CLASS =
  "data-[state=active]:border-primary rounded-none border-0 border-b-2 border-transparent px-3 py-2 shadow-none data-[state=active]:bg-transparent data-[state=active]:shadow-none";

function historyDaySummary(count: number, noun: string): string {
  return count === 1 ? `1 ${noun}` : `${count} ${noun}s`;
}

function attachmentSlotLabel(slot: string | null | undefined): string {
  if (slot === "job_image") {
    return "Job image";
  }
  if (slot === "challan") {
    return "Challan";
  }
  return slot ? titleCase(slot.replace(/_/g, " ")) : "Attachment";
}

function isImageFileName(name: string): boolean {
  return /\.(jpe?g|png|webp)$/i.test(name);
}

function isPdfFileName(name: string): boolean {
  return /\.pdf$/i.test(name);
}

function resolveJobAttachmentUrl(
  jobId: string | undefined,
  entry: EntityHistoryEntry,
  job: Job | null | undefined,
): string | null {
  if (!jobId) {
    return null;
  }
  if (entry.storage_key) {
    return jobsApi.historyAttachmentUrl(jobId, entry.id);
  }
  if (entry.attachment_deleted) {
    return null;
  }
  const slot = entry.attachment_slot;
  if (!job || !slot || !entry.summary) {
    return null;
  }
  if (slot !== "job_image" && slot !== "challan") {
    return null;
  }
  const meta = slot === "job_image" ? job.job_image : job.challan;
  if (meta?.filename === entry.summary) {
    return jobsApi.fileUrl(jobId, slot);
  }
  return null;
}

function ChangeValue({ value, className }: { value: unknown; className?: string }) {
  const formatted = formatAuditValue(value);

  if (formatted.kind === "empty") {
    return <span className={cn("text-sm", className)}>—</span>;
  }

  if (formatted.kind === "list") {
    return (
      <ul className={cn("flex flex-col gap-0.5 text-sm break-all", className)}>
        {formatted.items.map((item, index) => (
          <li key={index}>{item}</li>
        ))}
      </ul>
    );
  }

  if (formatted.kind === "json") {
    return (
      <pre className={cn("font-mono text-xs break-all whitespace-pre-wrap", className)}>
        {formatted.text}
      </pre>
    );
  }

  return <span className={cn("text-sm break-all", className)}>{formatted.text}</span>;
}

function historyActionVerb(action: string): string {
  switch (action.toUpperCase()) {
    case "CREATE":
      return "created this record";
    case "UPDATE":
      return "updated this record";
    case "DELETE":
      return "deleted this record";
    default:
      return titleCase(action.toLowerCase().replace(/_/g, " "));
  }
}

function actionBadgeVariant(action: string): "success" | "info" | "destructive" | "secondary" {
  switch (action.toUpperCase()) {
    case "CREATE":
      return "success";
    case "UPDATE":
      return "info";
    case "DELETE":
      return "destructive";
    default:
      return "secondary";
  }
}

function actorLabel(entry: EntityHistoryEntry): string {
  return entry.user?.name?.trim() || "System";
}

function actorInitials(entry: EntityHistoryEntry): string {
  const source = entry.user?.name?.trim() || "S";
  return initials(source) || source.slice(0, 1).toUpperCase();
}

function groupHistoryByDay(entries: EntityHistoryEntry[]): Array<{
  key: string;
  label: string;
  rows: EntityHistoryEntry[];
}> {
  const byDay = new Map<string, EntityHistoryEntry[]>();
  for (const entry of entries) {
    const key = entry.timestamp.slice(0, 10);
    const bucket = byDay.get(key);
    if (bucket) {
      bucket.push(entry);
    } else {
      byDay.set(key, [entry]);
    }
  }
  return [...byDay.entries()]
    .sort(([a], [b]) => b.localeCompare(a))
    .map(([key, rows]) => ({
      key,
      label: formatDate(key),
      rows: [...rows].sort((a, b) => b.timestamp.localeCompare(a.timestamp)),
    }));
}

function FieldChanges({ changes }: { changes: EntityHistoryEntry["changes"] }) {
  if (changes.length === 0) {
    return null;
  }
  return (
    <div className={cn(DETAIL_CARD_CLASS, "overflow-x-auto p-0")}>
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <TableHead className="w-[min(220px,22%)]">Field</TableHead>
            <TableHead className="w-[39%]">Before</TableHead>
            <TableHead className="w-[39%]">After</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {changes.map((change) => {
            const afterChanged = change.new_value !== null && change.new_value !== undefined;
            return (
              <TableRow key={change.field}>
                <TableCell className="align-top text-sm font-medium whitespace-normal">
                  {humanizeAuditField(change.field)}
                </TableCell>
                <TableCell className="text-muted-foreground align-top whitespace-normal">
                  <ChangeValue value={change.old_value} />
                </TableCell>
                <TableCell
                  className={cn(
                    "align-top whitespace-normal",
                    afterChanged && "bg-emerald-50/80 dark:bg-emerald-950/40",
                  )}
                >
                  <ChangeValue
                    value={change.new_value}
                    className={afterChanged ? "text-emerald-900 dark:text-emerald-300" : undefined}
                  />
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}

function HistoryTimelineItem({ entry }: { entry: EntityHistoryEntry }) {
  return (
    <li className="relative flex gap-3 pb-1">
      <Avatar className="size-8 shrink-0">
        <AvatarFallback className="text-xs">{actorInitials(entry)}</AvatarFallback>
      </Avatar>
      <div className="min-w-0 flex-1 pb-5">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div className="flex min-w-0 flex-wrap items-center gap-2">
            <p className="text-sm">
              <span className="font-medium">{actorLabel(entry)}</span>{" "}
              <span className="text-muted-foreground">{historyActionVerb(entry.action)}</span>
            </p>
            <Badge variant={actionBadgeVariant(entry.action)} className="shrink-0">
              {titleCase(entry.action.toLowerCase())}
            </Badge>
          </div>
          <time
            dateTime={entry.timestamp}
            className="text-muted-foreground shrink-0 text-xs tabular-nums"
          >
            {formatDateTime(entry.timestamp)}
          </time>
        </div>
        <FieldChanges changes={entry.changes} />
      </div>
    </li>
  );
}

function HistoryTimeline({ entries }: { entries: EntityHistoryEntry[] }) {
  const groups = groupHistoryByDay(entries);

  return (
    <div className="flex flex-col gap-8">
      {groups.map((group) => (
        <section key={group.key} aria-label={group.label}>
          <div className="mb-4 flex items-center gap-2">
            <span className="bg-foreground size-2 shrink-0 rounded-full" aria-hidden />
            <h3 className="text-sm font-semibold">{group.label}</h3>
            <p className="text-muted-foreground text-xs">
              {historyDaySummary(group.rows.length, "event")}
            </p>
          </div>
          <ol className="border-border relative ml-1 border-l pl-5">
            {group.rows.map((entry) => (
              <HistoryTimelineItem key={entry.id} entry={entry} />
            ))}
          </ol>
        </section>
      ))}
    </div>
  );
}

function AttachmentFilePreview({
  open,
  onOpenChange,
  filename,
  fileUrl,
  isImage,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  filename: string;
  fileUrl: string;
  isImage: boolean;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[96dvh] w-[96vw] max-w-[96vw] flex-col items-center justify-center gap-0 border-0 bg-black/95 p-2 shadow-2xl sm:max-w-[96vw] sm:p-4 [&>button]:text-white [&>button]:hover:bg-white/10">
        <DialogTitle className="sr-only">{filename} preview</DialogTitle>
        <p className="mb-3 max-w-full truncate px-2 text-center text-xs text-white/70">{filename}</p>
        {isImage ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={fileUrl} alt={filename} className="max-h-[85dvh] w-full object-contain" />
        ) : (
          <iframe src={fileUrl} title={filename} className="h-[85dvh] w-full rounded-sm bg-white" />
        )}
      </DialogContent>
    </Dialog>
  );
}

function AttachmentHistoryCard({
  entry,
  fileUrl,
}: {
  entry: EntityHistoryEntry;
  fileUrl: string | null;
}) {
  const [previewOpen, setPreviewOpen] = useState(false);
  const [imageFailed, setImageFailed] = useState(false);
  const filename = entry.summary ?? "Attachment";
  const isImage = isImageFileName(filename);
  const isPdf = isPdfFileName(filename);
  const removed = Boolean(entry.attachment_deleted);
  const canPreview = Boolean(fileUrl) && (isImage || isPdf);
  const showImageThumb = Boolean(fileUrl) && isImage && !imageFailed;

  function openPreview() {
    if (canPreview) {
      setPreviewOpen(true);
    }
  }

  return (
    <>
      <article className="border-border bg-card group flex flex-col overflow-hidden rounded-xl border shadow-sm transition-shadow hover:shadow-md">
        <div
          className={cn(
            "relative aspect-[5/3] w-full overflow-hidden",
            removed ? "bg-muted/40" : "bg-linear-to-b from-muted/60 to-muted/25",
          )}
        >
          {showImageThumb ? (
            <button
              type="button"
              className="focus-visible:ring-ring relative h-full w-full cursor-zoom-in focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
              onClick={openPreview}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={fileUrl!}
                alt=""
                className={cn(
                  "size-full object-contain p-1",
                  removed && "opacity-75 grayscale-[35%]",
                )}
                onError={() => setImageFailed(true)}
              />
              {removed ? (
                <span className="pointer-events-none absolute top-2 left-2">
                  <StatusBadge variant="destructive">Removed</StatusBadge>
                </span>
              ) : null}
              <div
                className={cn(
                  "pointer-events-none absolute inset-0 transition-colors",
                  removed ? "bg-muted/15" : "bg-black/0 group-hover:bg-black/25",
                )}
              />
              <span className="pointer-events-none absolute inset-0 flex items-center justify-center opacity-0 transition-opacity group-hover:opacity-100">
                <span className="bg-background/95 text-foreground inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium shadow-md">
                  <Expand className="size-3.5" aria-hidden />
                  View
                </span>
              </span>
            </button>
          ) : removed ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 p-4">
              <div className="bg-background/80 text-muted-foreground flex size-12 items-center justify-center rounded-full shadow-sm">
                <Trash2 className="size-5" aria-hidden />
              </div>
              <p className="text-muted-foreground text-xs font-medium">File removed</p>
            </div>
          ) : (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 p-4 text-center">
              <div className="bg-background/90 flex size-14 items-center justify-center rounded-xl shadow-sm">
                {isPdf ? (
                  <FileText className="text-muted-foreground size-7" aria-hidden />
                ) : isImage ? (
                  <ImageIcon className="text-muted-foreground size-7" aria-hidden />
                ) : (
                  <FileText className="text-muted-foreground size-7" aria-hidden />
                )}
              </div>
              {isPdf && canPreview ? (
                <Button type="button" variant="secondary" size="sm" onClick={openPreview}>
                  <Expand className="size-3.5" aria-hidden />
                  Open PDF
                </Button>
              ) : (
                <p className="text-muted-foreground max-w-full px-2 text-xs">
                  {fileUrl ? "Preview unavailable" : "No preview for this version"}
                </p>
              )}
            </div>
          )}
        </div>

        <div className="flex flex-col gap-2.5 border-t px-4 py-3">
          <div className="flex items-start justify-between gap-2">
            <p className="min-w-0 flex-1 truncate text-sm font-semibold" title={filename}>
              {filename}
            </p>
            {removed ? (
              <StatusBadge variant="destructive" className="shrink-0">
                Removed
              </StatusBadge>
            ) : (
              <StatusBadge variant="success" className="shrink-0">
                Uploaded
              </StatusBadge>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <Badge variant="info" className="font-normal">
              {attachmentSlotLabel(entry.attachment_slot)}
            </Badge>
            <span className="text-muted-foreground text-xs">
              {actorLabel(entry)} · {formatDateTime(entry.timestamp)}
            </span>
          </div>
        </div>
      </article>

      {canPreview && fileUrl ? (
        <AttachmentFilePreview
          open={previewOpen}
          onOpenChange={setPreviewOpen}
          filename={filename}
          fileUrl={fileUrl}
          isImage={isImage}
        />
      ) : null}
    </>
  );
}

function AttachmentsTimelineGrid({
  entries,
  jobId,
  job,
}: {
  entries: EntityHistoryEntry[];
  jobId?: string;
  job?: Job | null;
}) {
  const groups = groupHistoryByDay(entries);

  return (
    <div className="flex flex-col gap-8">
      {groups.map((group) => (
        <section key={group.key} aria-label={group.label}>
          <div className="mb-4 flex items-center gap-2">
            <span className="bg-foreground size-2 shrink-0 rounded-full" aria-hidden />
            <h3 className="text-sm font-semibold">{group.label}</h3>
            <p className="text-muted-foreground text-xs">
              {historyDaySummary(group.rows.length, "upload")}
            </p>
          </div>
          <div className="border-border ml-1 border-l pl-5">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {group.rows.map((entry) => (
                <AttachmentHistoryCard
                  key={entry.id}
                  entry={entry}
                  fileUrl={resolveJobAttachmentUrl(jobId, entry, job)}
                />
              ))}
            </div>
          </div>
        </section>
      ))}
    </div>
  );
}

function HistoryLoadingSkeleton() {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex gap-4 border-b pb-3">
        <Skeleton className="h-8 w-20" />
        <Skeleton className="h-8 w-24" />
      </div>
      <div className="ml-1 flex flex-col gap-5 border-l pl-5 pt-2">
        {[0, 1].map((key) => (
          <div key={key} className="flex gap-3">
            <Skeleton className="size-8 shrink-0 rounded-full" />
            <div className="flex flex-1 flex-col gap-2">
              <Skeleton className="h-4 w-3/4 max-w-xs" />
              <Skeleton className="h-20 w-full" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function EntityHistoryCard({
  title = "History",
  showTitle = true,
  entries,
  isLoading,
  isError,
  onRetry,
  className,
  jobId,
  job,
}: {
  title?: string;
  showTitle?: boolean;
  entries: EntityHistoryEntry[] | undefined;
  isLoading?: boolean;
  isError?: boolean;
  onRetry?: () => void;
  className?: string;
  /** When set, attachment previews resolve via job history file URLs. */
  jobId?: string;
  job?: Job | null;
}) {
  const activityEntries = useMemo(
    () => (entries ?? []).filter((entry) => entry.kind === "edit"),
    [entries],
  );
  const attachmentEntries = useMemo(
    () => (entries ?? []).filter((entry) => entry.kind === "attachment"),
    [entries],
  );
  const hasEntries = (entries?.length ?? 0) > 0;
  const [tab, setTab] = useState<"activity" | "attachments">("activity");

  return (
    <Card className={cn(className)}>
      {showTitle ? (
        <CardHeader>
          <CardTitle className="text-base">{title}</CardTitle>
        </CardHeader>
      ) : null}
      <CardContent className={cn("flex flex-col gap-4", !showTitle && "pt-6")}>
        {isLoading ? <HistoryLoadingSkeleton /> : null}
        {isError ? (
          <DataTableError message="Could not load history." onRetry={onRetry} />
        ) : null}
        {!isLoading && !isError && !hasEntries ? (
          <DataTableEmpty
            title="No history yet"
            message="Changes and file uploads for this record will appear here."
          />
        ) : null}
        {!isLoading && !isError && hasEntries && entries ? (
          <Tabs
            value={tab}
            onValueChange={(value) => setTab(value as "activity" | "attachments")}
          >
            <div className="border-b">
              <TabsList className="h-auto w-full justify-start rounded-none border-0 bg-transparent p-0 sm:w-auto">
                <TabsTrigger value="activity" className={HISTORY_TAB_TRIGGER_CLASS}>
                  Activity
                </TabsTrigger>
                <TabsTrigger value="attachments" className={HISTORY_TAB_TRIGGER_CLASS}>
                  Attachments
                </TabsTrigger>
              </TabsList>
            </div>
            <TabsContent value="activity" className="pt-4">
              {activityEntries.length > 0 ? (
                <HistoryTimeline entries={activityEntries} />
              ) : (
                <DataTableEmpty
                  title="No activity yet"
                  message="Field changes for this record will appear here."
                />
              )}
            </TabsContent>
            <TabsContent value="attachments" className="pt-4">
              {attachmentEntries.length > 0 ? (
                <AttachmentsTimelineGrid
                  entries={attachmentEntries}
                  jobId={jobId}
                  job={job}
                />
              ) : (
                <DataTableEmpty
                  title="No attachments yet"
                  message="Job image and challan uploads will appear here."
                />
              )}
            </TabsContent>
          </Tabs>
        ) : null}
      </CardContent>
    </Card>
  );
}
