import { Suspense } from 'react';
import { ConsultationDetail } from '@/components/customer/ConsultationDetail';

async function Content({ params }: {
  params: Promise<{
    id: string
  }>
}) {
  const { id } = await params;

  return <ConsultationDetail
    id={id}
  />;
}

export default function Page({ params }: {
  params: Promise<{
    id: string
  }>
}) {
  return <Suspense
    fallback={<div
      className="container section"
      role="status"
    >
      Memuat konsultasi…
    </div>}
  >
    <Content
      params={params}
    />
  </Suspense>;
}
