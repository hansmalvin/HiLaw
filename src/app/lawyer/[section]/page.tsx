import { notFound } from "next/navigation";
import { Dashboard } from "@/components/dashboard/Dashboard";

const sections = [
  "dashboard",
  "requests",
  "active",
  "history",
  "earnings",
  "profile",
  "settings",
];

export function generateStaticParams() {
  return sections.map((section) => ({
    section,
  }));
}

export default async function Page({
  params,
}: {
  params: Promise<{
    section: string;
  }>;
}) {
  const { section } = await params;
  if (!sections.includes(section)) notFound();

  return <Dashboard role="LAWYER" section={section} />;
}
