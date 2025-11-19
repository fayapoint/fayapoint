"use client";

import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, Bot, ArrowRight, Sparkles, TrendingUp, Users, Zap, Target, BarChart3, Brain, Rocket, Shield, Clock, DollarSign, Star } from 'lucide-react';
import Link from "next/link";
import { useTranslations } from "next-intl";

export default function AIConsultingPage() {
  const t = useTranslations("Home.Services.ai-consulting");

  const services = [
    {
      icon: Brain,
      title: "AI Strategy Development",
      description: "Custom roadmap aligned with your business goals and industry requirements"
    },
    {
      icon: Zap,
      title: "Tool Selection & Implementation",
      description: "Choose and deploy the right AI tools that deliver measurable ROI"
    },
    {
      icon: Users,
      title: "Team Training & Workshops",
      description: "Empower your team with hands-on AI skills and best practices"
    },
    {
      icon: Bot,
      title: "Custom AI Agent Development",
      description: "Build intelligent agents tailored to your specific workflows"
    },
    {
      icon: Target,
      title: "Process Optimization",
      description: "Identify and automate bottlenecks for maximum efficiency gains"
    },
    {
      icon: Shield,
      title: "Security & Compliance",
      description: "Ensure your AI implementation meets industry standards and regulations"
    }
  ];

  const benefits = [
    {
      icon: TrendingUp,
      stat: "40%",
      label: "Average Productivity Increase"
    },
    {
      icon: Clock,
      stat: "15hrs",
      label: "Saved Per Employee/Week"
    },
    {
      icon: DollarSign,
      stat: "3-6mo",
      label: "Typical ROI Timeline"
    },
    {
      icon: Users,
      stat: "100+",
      label: "Companies Transformed"
    }
  ];

  const process = [
    {
      step: "01",
      title: "Discovery Call",
      description: "We analyze your current operations and identify AI opportunities"
    },
    {
      step: "02",
      title: "Strategy Design",
      description: "Custom AI roadmap with clear milestones and expected outcomes"
    },
    {
      step: "03",
      title: "Implementation",
      description: "Deploy solutions with hands-on support and team training"
    },
    {
      step: "04",
      title: "Optimization",
      description: "Continuous monitoring and refinement for maximum impact"
    }
  ];

  const testimonials = [
    {
      quote: "The AI implementation reduced our response time by 60% and our team is more productive than ever.",
      author: "Sarah Chen",
      role: "CEO, TechFlow",
      rating: 5
    },
    {
      quote: "From strategy to execution, they made AI accessible and practical for our business.",
      author: "Marcus Rodriguez",
      role: "Operations Director",
      rating: 5
    }
  ];

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Header />
      <main>
        {/* Hero Section */}
      <section className="relative pt-32 pb-20 px-4 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5 pointer-events-none" />
        
        <div className="container mx-auto max-w-6xl relative">
          <div className="text-center max-w-4xl mx-auto">
            <Badge className="mb-6 px-4 py-2 text-sm font-medium" variant="secondary">
              <Sparkles className="w-4 h-4 mr-2 inline" />
              Transform Your Business with AI
            </Badge>
            
            <h1 className="text-5xl md:text-7xl font-bold mb-6 text-balance leading-tight">
              {t("title")}
            </h1>
            
            <p className="text-xl md:text-2xl text-muted-foreground mb-8 text-pretty max-w-3xl mx-auto leading-relaxed">
              {t("description")}
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Link href="/agendar-consultoria">
                <Button size="lg" className="text-lg px-8 py-6 group">
                  Book Free Consultation
                  <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
              <Button size="lg" variant="outline" className="text-lg px-8 py-6">
                View Case Studies
              </Button>
            </div>
            
            <div className="mt-12 flex flex-wrap justify-center gap-8 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-500" />
                <span>No long-term contracts</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-500" />
                <span>Results in 30 days</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-500" />
                <span>Money-back guarantee</span>
              </div>
            </div>
          </div>
        </div>
      </section>

        {/* Stats Section */}
      <section className="py-16 px-4 bg-muted/30">
        <div className="container mx-auto max-w-6xl">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {benefits.map((benefit, i) => (
              <div key={i} className="text-center">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-primary/10 text-primary mb-4">
                  <benefit.icon className="w-6 h-6" />
                </div>
                <div className="text-3xl md:text-4xl font-bold mb-2">{benefit.stat}</div>
                <div className="text-sm text-muted-foreground">{benefit.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

        {/* Services Grid */}
      <section className="py-20 px-4">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-bold mb-4 text-balance">
              Comprehensive AI Solutions
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto text-pretty">
              End-to-end AI consulting services designed to accelerate your digital transformation
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {services.map((service, i) => (
              <Card key={i} className="p-6 hover:shadow-lg transition-shadow border-border bg-card">
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                  <service.icon className="w-6 h-6 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-3">{service.title}</h3>
                <p className="text-muted-foreground leading-relaxed">{service.description}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

        {/* Process Section */}
      <section className="py-20 px-4 bg-muted/30">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-bold mb-4 text-balance">
              Our Proven Process
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto text-pretty">
              A systematic approach to AI transformation that delivers results
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {process.map((item, i) => (
              <div key={i} className="relative">
                <div className="text-6xl font-bold text-primary/10 mb-4">{item.step}</div>
                <h3 className="text-xl font-semibold mb-3">{item.title}</h3>
                <p className="text-muted-foreground leading-relaxed">{item.description}</p>
                {i < process.length - 1 && (
                  <ArrowRight className="hidden lg:block absolute top-8 -right-4 w-8 h-8 text-muted-foreground/30" />
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

        {/* Testimonials */}
      <section className="py-20 px-4">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-bold mb-4 text-balance">
              Trusted by Industry Leaders
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto text-pretty">
              See how we&rsquo;ve helped businesses like yours achieve AI success
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 gap-8">
            {testimonials.map((testimonial, i) => (
              <Card key={i} className="p-8 border-border bg-card">
                <div className="flex gap-1 mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>
                <p className="text-lg mb-6 leading-relaxed text-pretty">&quot;{testimonial.quote}&quot;</p>
                <div>
                  <div className="font-semibold">{testimonial.author}</div>
                  <div className="text-sm text-muted-foreground">{testimonial.role}</div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>

        {/* Pricing/Packages */}
      <section className="py-20 px-4 bg-muted/30">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-bold mb-4 text-balance">
              Flexible Engagement Models
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto text-pretty">
              Choose the package that fits your needs and budget
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            <Card className="p-8 border-border bg-card">
              <div className="text-sm font-semibold text-primary mb-2">STARTER</div>
              <h3 className="text-2xl font-bold mb-4">AI Assessment</h3>
              <p className="text-muted-foreground mb-6 leading-relaxed">
                Perfect for businesses exploring AI opportunities
              </p>
              <ul className="space-y-3 mb-8">
                {["Initial consultation", "Opportunity analysis", "Strategic recommendations", "Implementation roadmap"].map((item, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                    <span className="text-sm">{item}</span>
                  </li>
                ))}
              </ul>
              <Link href="/agendar-consultoria">
                <Button variant="outline" className="w-full">
                  Get Started
                </Button>
              </Link>
            </Card>

            <Card className="p-8 border-primary shadow-lg relative bg-card">
              <Badge className="absolute -top-3 left-1/2 -translate-x-1/2">
                Most Popular
              </Badge>
              <div className="text-sm font-semibold text-primary mb-2">PROFESSIONAL</div>
              <h3 className="text-2xl font-bold mb-4">Full Implementation</h3>
              <p className="text-muted-foreground mb-6 leading-relaxed">
                Complete AI transformation with ongoing support
              </p>
              <ul className="space-y-3 mb-8">
                {["Everything in Starter", "Custom AI development", "Team training", "3 months support", "Performance monitoring"].map((item, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                    <span className="text-sm">{item}</span>
                  </li>
                ))}
              </ul>
              <Link href="/agendar-consultoria">
                <Button className="w-full">
                  Get Started
                </Button>
              </Link>
            </Card>

            <Card className="p-8 border-border bg-card">
              <div className="text-sm font-semibold text-primary mb-2">ENTERPRISE</div>
              <h3 className="text-2xl font-bold mb-4">Strategic Partnership</h3>
              <p className="text-muted-foreground mb-6 leading-relaxed">
                Long-term AI innovation and competitive advantage
              </p>
              <ul className="space-y-3 mb-8">
                {["Everything in Professional", "Dedicated AI team", "Priority support", "Quarterly strategy reviews", "Custom integrations"].map((item, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                    <span className="text-sm">{item}</span>
                  </li>
                ))}
              </ul>
              <Link href="/agendar-consultoria">
                <Button variant="outline" className="w-full">
                  Contact Sales
                </Button>
              </Link>
            </Card>
          </div>
        </div>
      </section>

        {/* Final CTA */}
      <section className="py-20 px-4">
        <div className="container mx-auto max-w-4xl">
          <Card className="p-12 text-center bg-gradient-to-br from-primary/10 via-primary/5 to-transparent border-primary/20">
            <Rocket className="w-16 h-16 mx-auto mb-6 text-primary" />
            <h2 className="text-3xl md:text-4xl font-bold mb-4 text-balance">
              Ready to Transform Your Business?
            </h2>
            <p className="text-xl text-muted-foreground mb-8 text-pretty max-w-2xl mx-auto">
              Book a free consultation and discover how AI can revolutionize your operations
            </p>
            <Link href="/agendar-consultoria">
              <Button size="lg" className="text-lg px-8 py-6 group">
                Schedule Free Consultation
                <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
            <p className="text-sm text-muted-foreground mt-6">
              No credit card required • 30-minute strategy session • Actionable insights guaranteed
            </p>
          </Card>
        </div>
      </section>
      </main>
      <Footer />
    </div>
  );
}
