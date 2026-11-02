import { Suspense } from "react";
import { ManagedLawyerDetail } from "@/components/public/PublicWebsite";

async function Content({
  params,
}: {
  params: Promise<{
    id: string;
  }>;
}) {
  const { id } = await params;

  return <ManagedLawyerDetail id={id} />;
}

export default function Page({
  params,
}: {
  params: Promise<{
    id: string;
  }>;
}) {
  return (
    <Suspense
      fallback={
        <div className="container section" role="status">
          Memuat profil…
        </div>
      }
    >
      <Content params={params} />
    </Suspense>
  );
}
