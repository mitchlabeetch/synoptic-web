import Link from 'next/link'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'

interface Project {
  id: string
  title: string
  description?: string
  source_lang: string
  target_lang: string
  updated_at: string
}

export default function ProjectCard({ project }: { project: Project }) {
  return (
    <Link href={`/editor/${project.id}`}>
      <Card className="hover:border-primary transition-colors cursor-pointer h-full">
        <CardHeader>
          <CardTitle className="line-clamp-1">{project.title}</CardTitle>
          <CardDescription>
            {project.source_lang.toUpperCase()} → {project.target_lang.toUpperCase()}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground line-clamp-2">
            {project.description || 'No description provided.'}
          </p>
          <div className="mt-4 text-xs text-muted-foreground">
            Last updated: {new Date(project.updated_at).toLocaleDateString()}
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}
