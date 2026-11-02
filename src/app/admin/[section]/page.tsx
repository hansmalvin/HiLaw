import { Suspense } from "react";
import { notFound } from "next/navigation";
import { Dashboard } from "@/components/dashboard/Dashboard";

const sections = [
  "customers",
  "lawyers",
  "verification",
  "consultations",
  "transactions",
  "reports",
  "settings",
];

export function generateStaticParams() {
  return sections.map((section) => ({ section }));
}

async function Content({ params }: { params: Promise<{ section: string }> }) {
  const { section } = await params;
  if (!sections.includes(section)) notFound();

  return <Dashboard role="ADMIN" section={section} />;
}

// Reading params inside Suspense keeps navigation instant (Next.js cacheComponents).
export default function Page({
  params,
}: {
  params: Promise<{ section: string }>;
}) {
  return (
    <Suspense
      fallback={
        <div className="container section" role="status">
          Memuat dashboard…
        </div>
      }
    >
      <Content params={params} />
    </Suspense>
  );
}
