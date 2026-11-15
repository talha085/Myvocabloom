/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface GuideResponseData {
  answer: string;
  suggestions: string[];
  shortcutAction?: string;
}

export const GUIDE_SYSTEM_INSTRUCTION = `Sen "VocabBloom AI Destek" asistanısın.
Kullanıcılara VocaBloom Academy web platformunun elverişli ve doğru kullanımı konusunda yardımcı olursun.

AŞAĞIDAKİ 4 KURALA KESİNLİKLE VE İSTİSNASIZ UYMALISIN:
1. SADECE bu siteyi nasıl kullanacakları konusunda yanıt ver (Menüler, sekmeler, butonlar, öğrenci kaydı, sınavlar, bahçe, kelime kartları, öğretmen ve yönetici araçları).
2. DİL ÖĞRENME, GRAMER VEYA DİL GELİŞİMİ GİBİ PROFESYONELLİK GEREKTİREN KONULARDA: Kullanıcıya kısaca bir dil uzmanına veya öğretmenine danışmasını öner. (Örn: "Dil öğrenimi profesyonellik gerektiren bir süreçtir; bu konuda bir dil uzmanına veya öğretmeninize danışmanızı öneririm. Sitede kelime pratiği yapmak için Kartlar veya Quiz modülünü kullanabilirsiniz.")
3. SİTE KULLANIMI DIŞINDAKİ BAŞKA TÜM KONULARDA (hava durumu, günlük sohbet, siyaset, genel kültür, kod vb.) KİBARCA YALNIZCA ŞU CÜMLEYİ KULLAN:
   "Ben sadece sitenin elverişli kullanımı konularında size yardımcı olabilirim."
4. KISA VE TÜRKÇE YANIT VER. Yanıtlar net, kısa ve doğrudan olsun.

SİTE KULLANIM ÖZETİ:
- Giriş & Şifre: Sağ üstteki "Giriş Yap" veya "Şifre Değiştir" butonu. Demo şifre: 123456.
- Öğrenci Kaydı: "Öğrenci Kaydı (Sınıf Kodu İle)" butonu ile öğretmenin verdiği kod (örn: ENG-A1-SELIN) girilerek yapılır. Öğretmen onaylayana kadar hesap beklemede kalır.
- VocaBloom Bahçem: Öğrenilen kelimelerle büyüyen ağaç, çiçekler, XP ve rozetler.
- Kelime Kartları: Çift taraflı kartlar, telaffuz dinleme, "Öğrendim" / "Tekrar Et" butonları.
- Eşleştirme Oyunu: 6 kelimeyi Türkçe karşılıklarıyla eşleştirme pratiği.
- CEFR & Quiz: 5 soruluk test (çoktan seçmeli, dinleme, cümle tamamlama).
- Seviye Atlama Sınavı: 10 soruluk test. %70+ başarıyla bir üst CEFR seviyesine terfi edilir.
- AI ile Bağlamsal Paragraf: 5-10 kelime seçilerek 50-60 kelimelik anlamlı paragraf üretimi.
- Öğretmen Paneli: Sınıf kodu paylaşımı, bekleyen öğrencileri onaylama/reddetme, müfredat kelimeleri ekleme, öğrenci aktiviteleri ve duyurular.
- Yönetici Paneli: Sınıf ağacı, öğretmen atama, sınıflar arası öğrenci transferi ve okul geneli duyurular.

YÖNLENDİRME ANAHTARI (shortcutAction):
Eğer yanıt doğrudan belirli bir site özelliğine gitmeyi gerektiriyorsa "shortcutAction" alanına sadece şunlardan uygun olan birini yaz, yoksa boş bırak (""):
navigate_exam, navigate_flashcards, navigate_quiz, navigate_matching, navigate_garden, navigate_ai_story, navigate_explorer, navigate_learned, open_register, open_login, change_password`;

/**
 * Intelligent local fallback strictly enforcing user's rules:
 * - Only site usage questions answered.
 * - Out of scope: "Ben sadece sitenin elverişli kullanımı konularında size yardımcı olabilirim."
 * - Short & Turkish responses.
 * - Professional language learning questions: suggest consulting an expert.
 */
export function getGuideAgentFallback(message: string, _userRole: string = 'guest'): GuideResponseData {
  const q = message.toLowerCase().trim();

  // Rule 4: Language learning methodology or professional linguistics questions
  const isProfessionalLanguageQuestion =
    q.includes('nasıl ingilizce öğren') ||
    q.includes('hızlı ingilizce') ||
    q.includes('akıcı konuş') ||
    q.includes('dil nasıl öğren') ||
    q.includes('gramer tavsiye') ||
    q.includes('kitap öner') ||
    q.includes('öğrenme metodu') ||
    q.includes('tavsiye ver') && (q.includes('dil') || q.includes('ingilizce'));

  if (isProfessionalLanguageQuestion) {
    return {
      answer:
        'Dil öğrenimi kişiye özel ve profesyonellik gerektiren bir süreçtir; bu konuda bir dil uzmanına veya öğretmeninize danışmanızı öneririm. Sitemizdeki kelime pratiklerini yapmak için Kartlar veya Quiz modüllerini kullanabilirsiniz.',
      suggestions: [
        'Kelime Kartları nasıl kullanılır?',
        'CEFR & Quiz modülü nasıl çalışır?',
        'Seviye Atlama Sınavı nedir?',
      ],
      shortcutAction: 'navigate_flashcards',
    };
  }

  // Rule 1: Site usage - Student Registration & Class Code
  if (
    q.includes('kayıt') ||
    q.includes('kaydol') ||
    q.includes('sınıf kod') ||
    q.includes('üye ol')
  ) {
    return {
      answer: `**Öğrenci Kaydı:**
1. Ana sayfada **"Öğrenci Kaydı (Sınıf Kodu İle)"** butonuna tıklayın.
2. Bilgilerinizi ve öğretmeninizin verdiği **Sınıf Kodu**nu (örn. \`ENG-A1-SELIN\`) girin.
3. Kayıt sonrası öğretmeniniz onaylayana kadar bekleme ekranında kalırsınız.`,
      suggestions: [
        'Öğretmen başvurumu nasıl onaylar?',
        'Giriş için demo şifre nedir?',
      ],
      shortcutAction: 'open_register',
    };
  }

  // Rule 1: Site usage - Teacher Tools & Student Approval
  if (
    q.includes('öğretmen') ||
    q.includes('onay') ||
    q.includes('reddet') ||
    q.includes('müfredat') ||
    q.includes('öğrenci ekle')
  ) {
    return {
      answer: `**Öğretmen İşlemleri:**
- **Sınıf Kodu:** Panelin üstündeki kodu (örn. \`ENG-A1-SELIN\`) kopyalayıp öğrencilerinize iletin.
- **Öğrenci Onayı:** **"Bekleyen Başvurular"** sekmesinden tek tıkla onaylayabilir veya reddedebilirsiniz.
- **Kelime Ekleme:** **"Müfredat"** sekmesinden manuel veya **"AI ile 3 Kelime Üret"** butonuyla seviyenize uygun kelime ekleyebilirsiniz.`,
      suggestions: [
        'Öğrenci aktivitelerini nereden görürüm?',
        'Sınıfa duyuru nasıl gönderilir?',
      ],
      shortcutAction: 'open_login',
    };
  }

  // Rule 1: Site usage - Level Exam (Seviye Atlama Sınavı)
  if (
    q.includes('seviye atlama') ||
    q.includes('sınav') ||
    q.includes('level exam') ||
    q.includes('seviye geçiş') ||
    q.includes('terfi')
  ) {
    return {
      answer: `**Seviye Atlama Sınavı:**
Öğrenci panelindeki **"🏆 Sınav"** sekmesinden girilir. 10 soruluk testten en az %70 (7 doğru) aldığınızda seviyeniz (örn. A1 ➔ A2) otomatik olarak yükseltilir.`,
      suggestions: [
        'CEFR Quiz ile Sınav arasındaki fark nedir?',
        'AI ile Bağlamsal Paragraf nasıl oluşturulur?',
      ],
      shortcutAction: 'navigate_exam',
    };
  }

  // Rule 1: Site usage - AI Contextual Paragraph
  if (
    q.includes('paragraf') ||
    q.includes('hikaye') ||
    q.includes('ai okuma') ||
    q.includes('bağlamsal') ||
    q.includes('ai story')
  ) {
    return {
      answer: `**AI ile Bağlamsal Paragraf:**
Öğrenci panelindeki **"✨ AI Okuma"** sekmesine gidin. Öğrendiğiniz kelimelerden **5 ile 10 kelime** seçip butona basın. Yapay zekâ, bu kelimeleri içeren 50-60 kelimelik akıcı bir paragraf ve kelime analizi oluşturur.`,
      suggestions: [
        'Kaç kelime seçmem gerekir?',
        'Kelime Kartları nasıl kullanılır?',
      ],
      shortcutAction: 'navigate_ai_story',
    };
  }

  // Rule 1: Site usage - Garden, XP, Streak
  if (
    q.includes('bahçe') ||
    q.includes('garden') ||
    q.includes('xp') ||
    q.includes('streak') ||
    q.includes('rozet') ||
    q.includes('çiçek') ||
    q.includes('ağaç')
  ) {
    return {
      answer: `**VocaBloom Bahçem:**
Öğrenilen her kelimeyle bahçenizdeki ağaç büyür ve yeni çiçekler açar. Quizlerden ve oyunlardan XP kazanabilir, günlük giriş yaparak serinizi (streak) koruyabilirsiniz.`,
      suggestions: [
        'Kelime Kartları nasıl kullanılır?',
        'Eşleştirme Oyunu nasıl oynanır?',
      ],
      shortcutAction: 'navigate_garden',
    };
  }

  // Rule 1: Site usage - Flashcards
  if (
    q.includes('kart') ||
    q.includes('flashcard') ||
    q.includes('öğrendim')
  ) {
    return {
      answer: `**Kelime Kartları:**
Öğrenci panelindeki **"🗂️ Kartlar"** sekmesinden kartın üzerine tıklayarak Türkçe anlamını ve örnek cümlesini görebilir; **"Öğrendim"** veya **"Tekrar Et"** butonlarıyla listenizi güncelleyebilirsiniz.`,
      suggestions: [
        'Eşleştirme Oyunu nasıl oynanır?',
        'CEFR & Quiz nedir?',
      ],
      shortcutAction: 'navigate_flashcards',
    };
  }

  // Rule 1: Site usage - Matching Game
  if (
    q.includes('eşleştirme') ||
    q.includes('oyun') ||
    q.includes('matching')
  ) {
    return {
      answer: `**Eşleştirme Oyunu:**
**"🎮 Oyun"** sekmesinden 6 İngilizce kelime ile Türkçe karşılıklarını süreye karşı hatasız eşleştirerek ekstra XP kazanabilirsiniz.`,
      suggestions: [
        'Quiz nasıl çözülür?',
        'Seviye Atlama Sınavı nasıl çalışır?',
      ],
      shortcutAction: 'navigate_matching',
    };
  }

  // Rule 1: Site usage - Quiz
  if (
    q.includes('quiz') ||
    q.includes('test') ||
    q.includes('cümle tamamlama')
  ) {
    return {
      answer: `**CEFR & Quiz:**
**"📝 Quiz"** sekmesinde seviyenize uygun 5 soru çözebilirsiniz (kelime anlamı, sesli dinleme ve bağlamsal cümle tamamlama).`,
      suggestions: [
        'Seviye Atlama Sınavı nedir?',
        'Kelime Kartları nasıl kullanılır?',
      ],
      shortcutAction: 'navigate_quiz',
    };
  }

  // Rule 1: Site usage - Manager Tools & Transfers
  if (
    q.includes('yönetici') ||
    q.includes('transfer') ||
    q.includes('ağaç') ||
    q.includes('manager')
  ) {
    return {
      answer: `**Yönetici İşlemleri:**
Yönetici panelinde **"Sınıf Ağacı"** ile okul şemasını görebilir, **"Transfer Geçmişi"** sekmesinden öğrencileri sınıflar arası transfer edebilir ve yeni öğretmen atayabilirsiniz.`,
      suggestions: [
        'Yönetici giriş bilgileri nedir?',
        'Öğretmen seviyesi nasıl değiştirilir?',
      ],
      shortcutAction: 'open_login',
    };
  }

  // Rule 1: Site usage - Login & Password
  if (
    q.includes('şifre') ||
    q.includes('giriş') ||
    q.includes('hesap') ||
    q.includes('demo')
  ) {
    return {
      answer: `**Giriş & Şifre:**
Sağ üstteki **"Giriş Yap"** butonuyla giriş yapabilir, **"Şifre Değiştir"** butonuyla şifrenizi güncelleyebilirsiniz. Demo hesap şifreleri: \`123456\`.`,
      suggestions: [
        'Öğrenci olarak nasıl kayıt olurum?',
        'Öğretmen sınıf kodunu nereden paylaşır?',
      ],
      shortcutAction: 'open_login',
    };
  }

  // Rule 1: Site usage - General site overview
  if (
    q.includes('site') ||
    q.includes('vocabloom') ||
    q.includes('nasıl kullanılır') ||
    q.includes('ne işe yarar') ||
    q.includes('merhaba') ||
    q.includes('selam') ||
    q.includes('yardım')
  ) {
    return {
      answer: `**VocabBloom AI Destek'e Hoş Geldiniz!**
Bu platform CEFR seviyelerinde kelime öğrenimi sağlar. Öğrenciler kartlar, quizler, oyunlar ve sınavlarla pratik yapabilir; öğretmenler sınıflarını yönetebilir. Merak ettiğiniz site özelliğini sorabilirsiniz.`,
      suggestions: [
        'Öğrenci olarak nasıl kayıt olurum?',
        'Seviye Atlama Sınavı nasıl çalışır?',
        'AI ile Bağlamsal Paragraf nasıl oluşturulur?',
      ],
    };
  }

  // Rule 2: Strictly out of scope
  return {
    answer: 'Ben sadece sitenin elverişli kullanımı konularında size yardımcı olabilirim.',
    suggestions: [
      'Öğrenci olarak nasıl kayıt olurum?',
      'Seviye Atlama Sınavı nasıl çalışır?',
      'Kelime Kartları nasıl kullanılır?',
    ],
  };
}
