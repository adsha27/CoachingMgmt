import { redirect } from "next/navigation";
import DemoClient from "./DemoClient";

export const dynamic = "force-dynamic";

export default function DemoPage() {
  if (process.env.DEMO_MODE !== "true") redirect("/");
  return <DemoClient />;
}
