// src/app/(app)/dashboard/page.tsx
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import ProjectCard from '@/components/dashboard/ProjectCard'
import ProjectWizard from '@/components/dashboard/ProjectWizard'
import { OnboardingTour } from '@/components/onboarding/OnboardingTour'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth/login')
  }

  const { data: projects } = await supabase
    .from('projects')
    .select('*')
    .eq('user_id', user.id)
    .order('updated_at', { ascending: false })

  const { data: profile } = await supabase
    .from('profiles')
    .select('tier')
    .eq('id', user.id)
    .single()

  const tier = profile?.tier || 'free'
  const projectCount = projects?.length || 0

  return (
    <div className="container mx-auto py-8 px-4 relative">
      <OnboardingTour context="dashboard" />
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Your Projects</h1>
          <p className="text-muted-foreground mt-1">Manage and edit your bilingual books.</p>
        </div>
        <div data-tour="new-project">
          <ProjectWizard tier={tier} projectCount={projectCount} />
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" data-tour="dashboard-list">
        {projects?.map((project) => (
          <ProjectCard key={project.id} project={project} />
        ))}
        {projects?.length === 0 && (
          <div className="col-span-full flex flex-col items-center justify-center py-20 bg-muted/30 rounded-3xl border-2 border-dashed border-muted-foreground/20">
            <p className="text-muted-foreground mb-6 text-lg font-medium italic">You haven't created any projects yet.</p>
            <ProjectWizard tier={tier} projectCount={projectCount} />
          </div>
        )}
      </div>
    </div>
  )
}
