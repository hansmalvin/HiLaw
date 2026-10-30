import { notFound } from 'next/navigation';
import { Dashboard } from '@/components/dashboard/Dashboard';

const sections = ['dashboard', 'consultations', 'top-up', 'transactions', 'profile', 'settings'];

export function generateStaticParams() {
  return sections.map(section => ({
    section
  }));
}

export default async function Page({ params }: {
  params: Promise<{
    section: string
  }>
}) {
  const { section } = await params;
  if (!sections.includes(section))
    notFound();

  return <Dashboard
    role="CUSTOMER"
    section={section}
  />;
}
