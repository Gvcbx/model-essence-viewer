# عارض نماذج IGI2 MEF - IGI2 MEF Model Viewer

<div align="center">
  
  ![IGI2 MEF Viewer](src/assets/viewer-hero.jpg)
  
  [![License](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
  [![React](https://img.shields.io/badge/React-18.3.1-blue.svg)](https://reactjs.org/)
  [![Three.js](https://img.shields.io/badge/Three.js-Latest-green.svg)](https://threejs.org/)
  [![TypeScript](https://img.shields.io/badge/TypeScript-Latest-blue.svg)](https://www.typescriptlang.org/)

  **أداة احترافية لعرض وتحليل ملفات MEF من لعبة Project IGI 2: Covert Strike**
  
  *Professional tool for viewing and analyzing MEF files from Project IGI 2: Covert Strike*

</div>

## 🌟 المميزات الرئيسية | Key Features

### 🎮 عرض ثلاثي الأبعاد تفاعلي
- عارض ثلاثي الأبعاد متقدم مبني على **Three.js**
- أدوات تحكم تفاعلية (دوران، تكبير، تحريك)
- إضاءة ديناميكية مع خيارات متعددة
- شبكة مرجعية قابلة للتخصيص

### 📁 دعم الملفات المتقدم
- **دعم كامل لملفات MEF** من لعبة IGI2
- دعم صيغ إضافية: OBJ, FBX, GLTF, GLB
- سحب وإسقاط الملفات
- معاينة فورية للنماذج

### 📊 تحليل النماذج المفصل
- إحصائيات شاملة للنماذج
- عدد المثلثات والرؤوس
- معلومات المواد والخامات
- هيكل العظام للنماذج المتحركة

### 🎨 واجهة مستخدم عصرية
- تصميم سايبربانك مع ألوان زرقاء/فيروزية
- واجهة عربية كاملة
- تخطيط قابل للتخصيص
- وضع مظلم محسّن للعرض

### 📤 إمكانيات التصدير
- تصدير لصيغ مختلفة (OBJ, FBX, GLTF)
- حفظ لقطات شاشة
- تصدير بيانات JSON

## 🛠 التقنيات المستخدمة | Technologies Used

- **Frontend**: React 18.3.1 + TypeScript
- **3D Engine**: Three.js + React Three Fiber
- **UI Framework**: Tailwind CSS + shadcn/ui
- **Build Tool**: Vite
- **Deployment**: Lovable Platform

## 🚀 البدء السريع | Quick Start

### المتطلبات | Prerequisites
- Node.js 18+ 
- npm أو yarn

### التثبيت | Installation

```bash
# استنساخ المشروع
git clone <YOUR_GIT_URL>

# الانتقال لمجلد المشروع
cd model-essence-viewer

# تثبيت التبعيات
npm install

# تشغيل الخادم المحلي
npm run dev
```

### الاستخدام | Usage

1. **تحميل ملف MEF**: اسحب ملف MEF إلى منطقة التحميل
2. **استكشاف النموذج**: استخدم الماوس للتحكم في العرض
3. **تحليل البيانات**: اطلع على معلومات النموذج في اللوحة الجانبية
4. **التصدير**: احفظ النموذج بصيغة مختلفة

## 📁 هيكل المشروع | Project Structure

```
src/
├── components/           # المكونات الرئيسية
│   ├── ThreeDViewer.tsx # عارض ثلاثي الأبعاد
│   ├── FileUploader.tsx # مُحمِّل الملفات
│   ├── ModelInfoPanel.tsx # لوحة معلومات النموذج
│   ├── ViewerToolbar.tsx # شريط الأدوات
│   ├── WelcomeScreen.tsx # شاشة الترحيب
│   └── ui/              # مكونات واجهة المستخدم
├── pages/               # الصفحات
├── assets/             # الموارد والصور
└── lib/                # المكتبات المساعدة
```

## 🎮 حول لعبة IGI2 | About IGI2

Project IGI 2: Covert Strike هي لعبة حركة تكتيكية صدرت عام 2003. تستخدم اللعبة ملفات MEF (Model Exchange Format) لتخزين النماذج الثلاثية الأبعاد للشخصيات والأسلحة والمركبات.

## 🤝 المساهمة | Contributing

نرحب بالمساهمات! يرجى اتباع الخطوات التالية:

1. Fork المشروع
2. إنشاء فرع للميزة الجديدة (`git checkout -b feature/AmazingFeature`)
3. Commit التغييرات (`git commit -m 'Add some AmazingFeature'`)
4. Push للفرع (`git push origin feature/AmazingFeature`)
5. فتح Pull Request

## 📄 الترخيص | License

هذا المشروع مرخص تحت رخصة MIT. راجع ملف [LICENSE](LICENSE) للتفاصيل.

## 🔗 روابط مفيدة | Useful Links

- [المشروع الأصلي بـ C++](https://github.com/coreynguyen/cpp_igi2_mefview)
- [Three.js Documentation](https://threejs.org/docs/)
- [React Three Fiber](https://docs.pmnd.rs/react-three-fiber/)
- [IGI2 Modding Community](https://github.com/NEWME0/Project-IGI)

## 📞 الدعم | Support

إذا واجهت أي مشاكل أو لديك اقتراحات:
- افتح Issue جديد في GitHub
- تواصل عبر المجتمع
- راجع التوثيق

## 🌟 شكر خاص | Special Thanks

- **CoreyNguyen**: للمشروع الأصلي بـ C++
- **مجتمع IGI Modding**: للدعم والموارد
- **فريق React Three Fiber**: للمكتبة الرائعة

---

<div align="center">
  
  **بُني بحب للمجتمع العربي | Built with ❤️ for the Arabic Gaming Community**
  
  [![GitHub stars](https://img.shields.io/github/stars/your-username/model-essence-viewer?style=social)](https://github.com/your-username/model-essence-viewer)
  [![Twitter Follow](https://img.shields.io/twitter/follow/your-username?style=social)](https://twitter.com/your-username)
  
</div>