import { Suspense } from "react";
import { Directory } from "@/components/public/PublicWebsite";

export default function Page() {
  return (
    <Suspense
      fallback={
        <div className="container section" role="status">
          Memuat direktori pengacara…
        </div>
      }
    >
      <Directory />
    </Suspense>
  );
}
