import { Hero } from '@/components/marketing/Hero'
import { FeatureGrid } from '@/components/marketing/FeatureGrid'
import { PricingTable } from '@/components/marketing/PricingTable'

export default async function LandingPage() {
  return (
    <div className="flex flex-col selection:bg-primary/20">
      <Hero />
      <div id="features">
        <FeatureGrid />
      </div>
      <PricingTable />
    </div>
  )
}
