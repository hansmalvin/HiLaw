'use client';

import React from 'react';
import { useHiLaw } from '@/context/HiLawContext';
import ClientView from '@/components/ClientView';
import LawyerDashboardView from '@/components/LawyerDashboardView';
import AdminDashboardView from '@/components/AdminDashboardView';
import ConsultationWorkspace from '@/components/ConsultationWorkspace';

export default function HomePage() {
  const { role, isConsultationOpen } = useHiLaw();

  if (isConsultationOpen) {
    return <ConsultationWorkspace />;
  }

  if (role === 'LAWYER') {
    return <LawyerDashboardView />;
  }

  if (role === 'ADMIN') {
    return <AdminDashboardView />;
  }

  return <ClientView />;
}
