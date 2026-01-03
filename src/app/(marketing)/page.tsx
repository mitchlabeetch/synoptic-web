import { Hero } from '@/components/marketing/Hero'
import { FeatureGrid } from '@/components/marketing/FeatureGrid'
import { PricingTable } from '@/components/marketing/PricingTable'
import { SocialProof } from '@/components/marketing/SocialProof'
import { InteractiveDemo } from '@/components/marketing/InteractiveDemo'

export default async function LandingPage() {
  return (
    <div className="flex flex-col selection:bg-primary/20">
      <Hero />
      <SocialProof />
      <div id="features">
        <FeatureGrid />
      </div>
      <InteractiveDemo />
      <PricingTable />
    </div>
  )
}

