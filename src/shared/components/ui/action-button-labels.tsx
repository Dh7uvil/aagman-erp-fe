import {
  ArrowRight,
  Check,
  ChevronLeft,
  FilterX,
  History,
  KeyRound,
  Pause,
  Pencil,
  Play,
  Plus,
  RotateCcw,
  Save,
  Trash2,
  UserX,
  X,
  type LucideIcon,
} from "lucide-react";
import type { ReactNode } from "react";

const iconClass = "size-4 shrink-0";

function ActionLabel({ icon: Icon, children }: { icon: LucideIcon; children: ReactNode }) {
  return (
    <>
      <Icon className={iconClass} aria-hidden />
      {children}
    </>
  );
}

export function BackLabel({ children = "Back" }: { children?: ReactNode }) {
  return <ActionLabel icon={ChevronLeft}>{children}</ActionLabel>;
}

export function CancelLabel({ children = "Cancel" }: { children?: ReactNode }) {
  return <ActionLabel icon={X}>{children}</ActionLabel>;
}

export function CloseLabel({ children = "Close" }: { children?: ReactNode }) {
  return <ActionLabel icon={X}>{children}</ActionLabel>;
}

export function EditLabel({ children = "Edit" }: { children?: ReactNode }) {
  return <ActionLabel icon={Pencil}>{children}</ActionLabel>;
}

export function ApplyLabel({ children = "Apply" }: { children?: ReactNode }) {
  return <ActionLabel icon={Check}>{children}</ActionLabel>;
}

export function PauseLabel({ children = "Pause" }: { children?: ReactNode }) {
  return <ActionLabel icon={Pause}>{children}</ActionLabel>;
}

export function ResumeLabel({ children = "Resume" }: { children?: ReactNode }) {
  return <ActionLabel icon={Play}>{children}</ActionLabel>;
}

export function HistoryLabel({ children = "History" }: { children?: ReactNode }) {
  return <ActionLabel icon={History}>{children}</ActionLabel>;
}

export function ClearFiltersLabel({ children = "Clear" }: { children?: ReactNode }) {
  return <ActionLabel icon={FilterX}>{children}</ActionLabel>;
}

export function ClearSortLabel({ children = "Clear sort" }: { children?: ReactNode }) {
  return <ActionLabel icon={RotateCcw}>{children}</ActionLabel>;
}

export function SubmitFormLabel({ children }: { children: ReactNode }) {
  const label = typeof children === "string" ? children.toLowerCase() : "";
  const Icon = label.includes("create") || label.includes("add") ? Plus : Save;
  return <ActionLabel icon={Icon}>{children}</ActionLabel>;
}

export function ConfirmLabel({ children }: { children: ReactNode }) {
  return <ActionLabel icon={Check}>{children}</ActionLabel>;
}

export function DeleteLabel({ children }: { children: ReactNode }) {
  return <ActionLabel icon={Trash2}>{children}</ActionLabel>;
}

export function ContinueLabel({ children = "Continue" }: { children?: ReactNode }) {
  return <ActionLabel icon={ArrowRight}>{children}</ActionLabel>;
}

export function DeactivateLabel({ children = "Deactivate" }: { children?: ReactNode }) {
  return <ActionLabel icon={UserX}>{children}</ActionLabel>;
}

export function ResetPasswordLabel({ children = "Reset Password" }: { children?: ReactNode }) {
  return <ActionLabel icon={KeyRound}>{children}</ActionLabel>;
}
