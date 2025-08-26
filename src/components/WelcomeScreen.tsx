import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Upload, 
  FileText, 
  Zap, 
  Eye, 
  Download,
  Github,
  ArrowRight
} from 'lucide-react';
import heroImage from '@/assets/viewer-hero.jpg';

interface WelcomeScreenProps {
  onGetStarted: () => void;
}

export const WelcomeScreen = ({ onGetStarted }: WelcomeScreenProps) => {
  const features = [
    {
      icon: Eye,
      title: 'عرض تفاعلي ثلاثي الأبعاد',
      description: 'استكشف النماذج بحرية مع أدوات تحكم متقدمة'
    },
    {
      icon: Zap,
      title: 'أداء عالي',
      description: 'محرك عرض محسّن لنماذج معقدة'
    },
    {
      icon: FileText,
      title: 'دعم ملفات MEF',
      description: 'يدعم ملفات IGI2 الأصلية وصيغ أخرى'
    },
    {
      icon: Download,
      title: 'تصدير متقدم',
      description: 'احفظ النماذج بصيغ مختلفة'
    }
  ];

  return (
    <div className="h-full flex items-center justify-center p-8">
      <div className="max-w-6xl w-full">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Left Side - Content */}
          <div className="space-y-8">
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <Badge variant="secondary" className="bg-primary/20 text-primary border-primary/30">
                  الإصدار 1.0.0
                </Badge>
                <Badge variant="outline" className="border-accent/30 text-accent">
                  مجاني ومفتوح المصدر
                </Badge>
              </div>
              
              <h1 className="text-4xl lg:text-5xl font-bold leading-tight">
                <span className="bg-gradient-to-r from-primary to-primary-glow bg-clip-text text-transparent">
                  عارض نماذج IGI2
                </span>
                <br />
                <span className="text-2xl lg:text-3xl text-muted-foreground">
                  أداة احترافية لملفات MEF
                </span>
              </h1>
              
              <p className="text-lg text-muted-foreground leading-relaxed">
                استكشف وحلل النماذج الثلاثية الأبعاد من لعبة Project IGI 2: Covert Strike. 
                أداة متقدمة مع عارض تفاعلي وإمكانيات تصدير شاملة.
              </p>
            </div>

            {/* Features */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {features.map((feature, index) => {
                const IconComponent = feature.icon;
                return (
                  <div
                    key={index}
                    className="p-4 bg-viewer-panel/50 border border-border/30 rounded-lg backdrop-blur-sm"
                  >
                    <div className="flex items-start gap-3">
                      <div className="p-2 bg-primary/20 rounded-lg">
                        <IconComponent className="h-4 w-4 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-medium text-sm mb-1">{feature.title}</h3>
                        <p className="text-xs text-muted-foreground leading-relaxed">
                          {feature.description}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-4">
              <Button
                onClick={onGetStarted}
                size="lg"
                className="bg-gradient-primary hover:opacity-90 text-white shadow-glow"
              >
                <Upload className="h-5 w-5 mr-2" />
                ابدأ الآن
                <ArrowRight className="h-4 w-4 mr-2" />
              </Button>
              
              <Button
                variant="outline"
                size="lg"
                onClick={() => window.open('https://github.com/coreynguyen/cpp_igi2_mefview', '_blank')}
                className="border-border/50 bg-viewer-control/30 hover:bg-viewer-control"
              >
                <Github className="h-5 w-5 mr-2" />
                المشروع الأصلي
              </Button>
            </div>

            {/* Stats */}
            <div className="flex items-center gap-6 pt-4 border-t border-border/30">
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">MEF</div>
                <div className="text-xs text-muted-foreground">صيغة أساسية</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-accent">4+</div>
                <div className="text-xs text-muted-foreground">صيغ مدعومة</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-success">∞</div>
                <div className="text-xs text-muted-foreground">حجم النماذج</div>
              </div>
            </div>
          </div>

          {/* Right Side - Hero Image */}
          <div className="relative">
            <div className="relative overflow-hidden rounded-2xl bg-gradient-glow p-1">
              <div className="relative overflow-hidden rounded-xl bg-viewer-bg">
                <img
                  src={heroImage}
                  alt="عارض نماذج IGI2 - واجهة العرض الثلاثي"
                  className="w-full h-auto object-cover"
                />
                
                {/* Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-viewer-bg/80 via-transparent to-transparent" />
                
                {/* Floating Elements */}
                <div className="absolute top-4 right-4">
                  <Badge className="bg-success/20 text-success border-success/30 backdrop-blur-sm">
                    متاح الآن
                  </Badge>
                </div>
                
                <div className="absolute bottom-4 left-4">
                  <div className="bg-viewer-toolbar/90 backdrop-blur-sm rounded-lg p-3 border border-border/30">
                    <p className="text-xs text-muted-foreground mb-1">مثال:</p>
                    <p className="text-sm font-medium">soldier_model.mef</p>
                    <p className="text-xs text-primary">15,420 مثلث • 8,932 رأس</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Decorative Elements */}
            <div className="absolute -top-4 -right-4 w-24 h-24 bg-primary/20 rounded-full blur-2xl animate-pulse" />
            <div className="absolute -bottom-4 -left-4 w-32 h-32 bg-accent/20 rounded-full blur-2xl animate-pulse" style={{ animationDelay: '1s' }} />
          </div>
        </div>

        {/* Bottom Info */}
        <div className="mt-12 text-center">
          <p className="text-sm text-muted-foreground">
            مبني بحب للمجتمع العربي • مفتوح المصدر • مجاني للأبد
          </p>
        </div>
      </div>
    </div>
  );
};