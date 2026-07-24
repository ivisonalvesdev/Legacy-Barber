import { useEffect } from 'react'
import type { OpenAuthFn } from '../../types'
import { SiteBackground }       from '../ui/SiteBackground'
import { LandingNav }          from './LandingNav'
import { HeroSection }         from './HeroSection'
import { FeaturesSection }     from './FeaturesSection'
import { StatsSection }        from './StatsSection'
import { HowItWorksSection }   from './HowItWorksSection'
import { TestimonialsSection } from './TestimonialsSection'
import { PricingSection }      from './PricingSection'
import { CTASection }          from './CTASection'
import { LandingFooter }       from './LandingFooter'

interface LandingPageProps {
  onOpenAuth: OpenAuthFn
}

export function LandingPage({ onOpenAuth }: LandingPageProps) {
  useEffect(() => { window.scrollTo(0, 0) }, [])

  return (
    <div style={{ fontFamily: "'DM Sans', sans-serif", background: '#050505', minHeight: '100vh' }}>
      <SiteBackground />
      <LandingNav          onOpenAuth={onOpenAuth} />
      <HeroSection         onOpenAuth={onOpenAuth} />
      <FeaturesSection />
      <StatsSection />
      <HowItWorksSection />
      <TestimonialsSection />
      <PricingSection      onOpenAuth={onOpenAuth} />
      <CTASection          onOpenAuth={onOpenAuth} />
      <LandingFooter />
    </div>
  )
}
