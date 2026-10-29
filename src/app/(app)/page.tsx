import { DashboardGreeting } from "./dashboard-greeting";
import { DashboardScreen } from "@/modules/dashboard/components/dashboard-screen";
import { requireSession } from "@/shared/auth/guards";

export default async function DashboardPage() {
  const me = await requireSession();

  return (
    <>
      <DashboardGreeting name={me.name} />
      <DashboardScreen />
    </>
  );
}
