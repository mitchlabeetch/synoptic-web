// src/app/(app)/dashboard/page.tsx
// PURPOSE: Dashboard page showing user's projects
// ACTION: Displays project list, saved templates, and creation wizard
// MECHANISM: Server component that fetches projects from PostgreSQL

import { redirect } from 'next/navigation';
import ProjectCard from '@/components/dashboard/ProjectCard';
import ProjectWizard from '@/components/dashboard/ProjectWizard';
import { OnboardingTour } from '@/components/onboarding/OnboardingTour';
import { getCurrentUser, getUserId } from '@/lib/auth/jwt';
import { getUserProjects, getUserProfile } from '@/lib/db/server';
import { DashboardClient, SavedTemplatesWrapper } from './DashboardClient';
import { EmptyProjectsState } from './EmptyProjectsState';

import { getTranslations } from 'next-intl/server';
import LocaleSwitcher from '@/components/ui/LocaleSwitcher';
import UserSettings from '@/components/dashboard/UserSettings';

export default async function DashboardPage() {
  const t = await getTranslations('Dashboard');
  const user = await getCurrentUser();

  if (!user) {
    redirect('/auth/login');
  }

  const userId = getUserId(user);
  const projects = await getUserProjects(userId);
  const profile = await getUserProfile(userId);

  const tier = profile?.tier || 'free';
  const projectCount = projects?.length || 0;

  return (
    <div className="container mx-auto py-8 px-4 relative">
      {/* Client-side library import handler */}
      <DashboardClient />
      
      <OnboardingTour context="dashboard" />
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{t('title')}</h1>
          <p className="text-muted-foreground mt-1">{t('subtitle')}</p>
        </div>
        <div className="flex items-center gap-4" data-tour="new-project">
          <LocaleSwitcher />
          <div className="h-6 w-px bg-border mx-1" />
          {profile && <UserSettings user={profile} />}
          <div className="h-6 w-px bg-border mx-1" />
          <ProjectWizard tier={tier} projectCount={projectCount} />
        </div>
      </div>
      
      {/* Saved Templates Section */}
      <div className="mb-8" data-tour="saved-templates">
        <SavedTemplatesWrapper />
      </div>
      
      {/* Projects Section */}
      <div className="mb-4">
        <h2 className="text-xl font-semibold">{t('yourProjects') || 'Your Projects'}</h2>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" data-tour="dashboard-list">
        {projects?.map((project) => (
          <ProjectCard key={project.id} project={project} />
        ))}
        {projects?.length === 0 && (
          <div className="col-span-full">
            <EmptyProjectsState />
          </div>
        )}
      </div>
    </div>
  );
}
