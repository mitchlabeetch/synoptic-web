// src/app/(app)/dashboard/page.tsx
// PURPOSE: Dashboard page showing user's projects
// ACTION: Displays project list and creation wizard
// MECHANISM: Server component that fetches projects from PostgreSQL

import { redirect } from 'next/navigation';
import ProjectCard from '@/components/dashboard/ProjectCard';
import ProjectWizard from '@/components/dashboard/ProjectWizard';
import { OnboardingTour } from '@/components/onboarding/OnboardingTour';
import { getCurrentUser, getUserId } from '@/lib/auth/jwt';
import { getUserProjects, getUserProfile } from '@/lib/db/server';

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
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" data-tour="dashboard-list">
        {projects?.map((project) => (
          <ProjectCard key={project.id} project={project} />
        ))}
        {projects?.length === 0 && (
          <div className="col-span-full flex flex-col items-center justify-center py-20 bg-muted/30 rounded-3xl border-2 border-dashed border-muted-foreground/20">
            <p className="text-muted-foreground mb-6 text-lg font-medium italic">{t('emptyState')}</p>
            <ProjectWizard tier={tier} projectCount={projectCount} />
          </div>
        )}
      </div>
    </div>
  );
}
