import { Link } from "wouter";
import { Upload, Zap, Shield, Cloud, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
// import heroImage from "@assets/generated_images/futuristic_cloud_storage_hero.png";
import syncIcon from "@assets/generated_images/auto_sync_feature_icon.png";
import securityIcon from "@assets/generated_images/security_feature_icon.png";
import speedIcon from "@assets/generated_images/fast_upload_feature_icon.png";

export default function Home() {
  return (
    <div className="min-h-screen bg-background">
      <header className="fixed top-0 left-0 right-0 z-50 border-b border-border/40 backdrop-blur-xl bg-background/80">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-2">
              <Cloud className="h-8 w-8 text-primary" />
              <span className="text-xl font-heading font-bold">CloudVault</span>
            </div>
            <nav className="hidden md:flex items-center gap-8">
              <a href="#features" className="text-sm font-medium hover-elevate px-3 py-2 rounded-lg transition-colors" data-testid="link-nav-features">
                Features
              </a>
              <a href="#pricing" className="text-sm font-medium hover-elevate px-3 py-2 rounded-lg transition-colors" data-testid="link-nav-pricing">
                Pricing
              </a>
              <a href="#about" className="text-sm font-medium hover-elevate px-3 py-2 rounded-lg transition-colors" data-testid="link-nav-about">
                About
              </a>
            </nav>
            <Link href="/dashboard">
              <Button data-testid="button-get-started">
                Get Started
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
        <div 
          className="absolute inset-0 bg-cover bg-center"
          style={{ 
            backgroundImage: `url(${heroImage})`,
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-background/95 via-background/85 to-background/95" />
        
        <div className="relative z-10 max-w-7xl mx-auto px-6 lg:px-8 py-32 text-center">
          <div className="space-y-8">
            <h1 className="text-5xl md:text-7xl font-heading font-bold tracking-tight text-foreground">
              Your Photos,
              <br />
              <span className="bg-gradient-to-r from-primary via-chart-2 to-chart-3 bg-clip-text text-transparent">
                Everywhere You Go
              </span>
            </h1>
            <p className="text-xl md:text-2xl text-muted-foreground max-w-3xl mx-auto font-medium">
              Experience the future of cloud storage. Upload, sync, and access your memories instantly with military-grade security.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
              <Link href="/dashboard">
                <Button size="lg" className="text-lg px-8 backdrop-blur-sm" data-testid="button-hero-start">
                  <Upload className="mr-2 h-5 w-5" />
                  Start Uploading Free
                </Button>
              </Link>
              <a href="#features">
                <Button 
                  size="lg" 
                  variant="outline" 
                  className="text-lg px-8 backdrop-blur-md bg-background/40"
                  data-testid="button-hero-learn"
                >
                  Learn More
                </Button>
              </a>
            </div>
            <div className="flex items-center justify-center gap-12 pt-8 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-primary animate-pulse" />
                <span>Free Forever Plan</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-primary animate-pulse" />
                <span>No Credit Card</span>
              </div>
              <div className="hidden sm:flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-primary animate-pulse" />
                <span>Unlimited Uploads</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="features" className="py-24 bg-card/30">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="text-center space-y-4 mb-16">
            <h2 className="text-4xl md:text-5xl font-heading font-bold">
              Powerful Features
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Everything you need to manage your photo library in the cloud
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <Card className="relative overflow-hidden border-2 hover-elevate transition-all duration-300" data-testid="card-feature-sync">
              <CardContent className="p-8 space-y-4">
                <div className="relative h-24 w-24 mx-auto">
                  <img 
                    src={syncIcon} 
                    alt="Auto Sync" 
                    className="w-full h-full object-contain"
                  />
                </div>
                <h3 className="text-2xl font-heading font-semibold text-center">
                  Auto-Sync Magic
                </h3>
                <p className="text-muted-foreground text-center leading-relaxed">
                  Your photos automatically sync across all devices in real-time. Never lose a moment.
                </p>
              </CardContent>
            </Card>

            <Card className="relative overflow-hidden border-2 hover-elevate transition-all duration-300" data-testid="card-feature-security">
              <CardContent className="p-8 space-y-4">
                <div className="relative h-24 w-24 mx-auto">
                  <img 
                    src={securityIcon} 
                    alt="Security" 
                    className="w-full h-full object-contain"
                  />
                </div>
                <h3 className="text-2xl font-heading font-semibold text-center">
                  Military-Grade Security
                </h3>
                <p className="text-muted-foreground text-center leading-relaxed">
                  End-to-end encryption ensures your photos stay private and secure, always.
                </p>
              </CardContent>
            </Card>

            <Card className="relative overflow-hidden border-2 hover-elevate transition-all duration-300" data-testid="card-feature-speed">
              <CardContent className="p-8 space-y-4">
                <div className="relative h-24 w-24 mx-auto">
                  <img 
                    src={speedIcon} 
                    alt="Lightning Fast" 
                    className="w-full h-full object-contain"
                  />
                </div>
                <h3 className="text-2xl font-heading font-semibold text-center">
                  Lightning Fast
                </h3>
                <p className="text-muted-foreground text-center leading-relaxed">
                  Experience blazing fast uploads and instant access to all your photos.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      <section className="py-24">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            <div className="space-y-2" data-testid="stat-users">
              <div className="text-5xl font-heading font-bold text-primary">
                1M+
              </div>
              <div className="text-muted-foreground font-medium">Happy Users</div>
            </div>
            <div className="space-y-2" data-testid="stat-photos">
              <div className="text-5xl font-heading font-bold text-primary">
                500M+
              </div>
              <div className="text-muted-foreground font-medium">Photos Stored</div>
            </div>
            <div className="space-y-2" data-testid="stat-countries">
              <div className="text-5xl font-heading font-bold text-primary">
                150+
              </div>
              <div className="text-muted-foreground font-medium">Countries</div>
            </div>
            <div className="space-y-2" data-testid="stat-uptime">
              <div className="text-5xl font-heading font-bold text-primary">
                99.9%
              </div>
              <div className="text-muted-foreground font-medium">Uptime</div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-24 bg-gradient-to-br from-primary/10 via-chart-2/10 to-chart-3/10">
        <div className="max-w-4xl mx-auto px-6 lg:px-8 text-center space-y-8">
          <h2 className="text-4xl md:text-5xl font-heading font-bold">
            Ready to Experience the Future?
          </h2>
          <p className="text-xl text-muted-foreground">
            Join millions of users who trust CloudVault with their precious memories
          </p>
          <Link href="/dashboard">
            <Button size="lg" className="text-lg px-12" data-testid="button-cta-start">
              <Upload className="mr-2 h-5 w-5" />
              Start Now - It's Free
            </Button>
          </Link>
          <div className="flex items-center justify-center gap-6 pt-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <Shield className="h-4 w-4" />
              <span>SSL Secured</span>
            </div>
            <div className="flex items-center gap-2">
              <Zap className="h-4 w-4" />
              <span>99.9% Uptime</span>
            </div>
            <div className="flex items-center gap-2">
              <Cloud className="h-4 w-4" />
              <span>Global CDN</span>
            </div>
          </div>
        </div>
      </section>

      <footer className="border-t border-border py-12 bg-card/20">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-8">
            <div className="col-span-2 md:col-span-1 space-y-4">
              <div className="flex items-center gap-2">
                <Cloud className="h-6 w-6 text-primary" />
                <span className="text-lg font-heading font-bold">CloudVault</span>
              </div>
              <p className="text-sm text-muted-foreground">
                The future of cloud storage for your precious memories.
              </p>
            </div>
            <div className="space-y-4">
              <h4 className="font-semibold">Product</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="#features" className="hover-elevate px-2 py-1 rounded transition-colors" data-testid="link-footer-features">Features</a></li>
                <li><a href="#pricing" className="hover-elevate px-2 py-1 rounded transition-colors" data-testid="link-footer-pricing">Pricing</a></li>
                <li><a href="#" className="hover-elevate px-2 py-1 rounded transition-colors" data-testid="link-footer-security">Security</a></li>
              </ul>
            </div>
            <div className="space-y-4">
              <h4 className="font-semibold">Company</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="#about" className="hover-elevate px-2 py-1 rounded transition-colors" data-testid="link-footer-about">About</a></li>
                <li><a href="#" className="hover-elevate px-2 py-1 rounded transition-colors" data-testid="link-footer-blog">Blog</a></li>
                <li><a href="#" className="hover-elevate px-2 py-1 rounded transition-colors" data-testid="link-footer-careers">Careers</a></li>
              </ul>
            </div>
            <div className="space-y-4">
              <h4 className="font-semibold">Legal</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="#" className="hover-elevate px-2 py-1 rounded transition-colors" data-testid="link-footer-privacy">Privacy</a></li>
                <li><a href="#" className="hover-elevate px-2 py-1 rounded transition-colors" data-testid="link-footer-terms">Terms</a></li>
                <li><a href="#" className="hover-elevate px-2 py-1 rounded transition-colors" data-testid="link-footer-cookie">Cookie Policy</a></li>
              </ul>
            </div>
          </div>
          <div className="pt-8 border-t border-border text-center text-sm text-muted-foreground">
            <p>&copy; 2024 CloudVault. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
