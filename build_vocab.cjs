const fs = require('fs');
const path = require('path');

// Seed bases for 6 levels x 500 words = 3000 words
// We create comprehensive collections of real English vocabulary categorized by CEFR A1, A2, B1, B2, C1, C2

const a1Roots = [
  ["ability", "yetenek, beceri", "noun", "/əˈbɪl.ə.ti/", "the power or skill to do something", "She has the ability to speak three languages.", "Üç dil konuşma yeteneğine sahip."],
  ["about", "hakkında, yaklaşık", "adverb", "/əˈbaʊt/", "on the subject of; approximately", "Tell me about your favorite book.", "Bana en sevdiğin kitap hakkında anlat."],
  ["above", "üzerinde, yukarısında", "adverb", "/əˈbʌv/", "in a higher place than", "The clock hangs above the whiteboard.", "Saat beyaz tahtanın üzerinde asılı."],
  ["accept", "kabul etmek", "verb", "/əkˈsept/", "to agree to receive something", "He accepted the invitation happily.", "Daveti mutlulukla kabul etti."],
  ["across", "karşısında, bir uçtan diğerine", "adverb", "/əˈkrɒs/", "from one side to the other", "They walked across the park.", "Parkın bir ucundan diğerine yürüdüler."],
  ["action", "eylem, hareket", "noun", "/ˈæk.ʃən/", "the process of doing something", "Action speaks louder than words.", "Eylemler sözlerden daha etkilidir."],
  ["activity", "etkinlik, aktivite", "noun", "/ækˈtɪv.ə.ti/", "a thing that a person or group does", "Reading is a wonderful evening activity.", "Okumak harika bir akşam aktivitesidir."],
  ["actor", "erkek oyuncu, aktör", "noun", "/ˈæk.tər/", "a person who acts in plays or films", "He dreams of becoming a famous actor.", "Ünlü bir aktör olmayı hayal ediyor."],
  ["actress", "kadın oyuncu, aktris", "noun", "/ˈæk.trəs/", "a female actor", "The actress gave an inspiring performance.", "Aktris ilham verici bir performans sergiledi."],
  ["add", "eklemek, toplamak", "verb", "/æd/", "put something with another thing", "Add a little sugar to the tea.", "Çaya biraz şeker ekleyin."],
  ["address", "adres", "noun", "/əˈdres/", "the details of where a person lives", "Please write your home address here.", "Lütfen ev adresinizi buraya yazın."],
  ["adult", "yetişkin", "noun", "/ˈæd.ʌlt/", "a person who is fully grown", "Tickets are cheaper for children than adults.", "Biletler çocuklar için yetişkinlerden daha ucuz."],
  ["advice", "tavsiye, öğüt", "noun", "/ədˈvaɪs/", "guidance or recommendations offered", "She gave me valuable study advice.", "Bana değerli ders çalışma tavsiyeleri verdi."],
  ["afraid", "korkmuş, ürkmüş", "adjective", "/əˈfreɪd/", "feeling fear or anxiety", "Do not be afraid to make mistakes.", "Hata yapmaktan korkmayın."],
  ["after", "sonra, ardından", "adverb", "/ˈɑːf.tər/", "later in time than", "We will have dinner after the class.", "Dersten sonra akşam yemeği yiyeceğiz."],
  ["afternoon", "öğleden sonra", "noun", "/ˌɑːf.təˈnuːn/", "the time from noon until evening", "I usually study English in the afternoon.", "Öğleden sonraları genellikle İngilizce çalışırım."],
  ["again", "tekrar, yeniden", "adverb", "/əˈɡen/", "another time; once more", "Please listen to the audio again.", "Lütfen ses kaydını tekrar dinleyin."],
  ["age", "yaş, çağ", "noun", "/eɪdʒ/", "the length of time that a person has lived", "At the age of ten, she started chess.", "On yaşında satranca başladı."],
  ["agree", "aynı fikirde olmak", "verb", "/əˈɡriː/", "have the same opinion", "I completely agree with your idea.", "Fikrinize tamamen katılıyorum."],
  ["air", "hava", "noun", "/eər/", "the invisible gaseous substance around earth", "Fresh air helps you concentrate better.", "Temiz hava daha iyi odaklanmanıza yardımcı olur."],
  ["airport", "havalimanı", "noun", "/ˈeə.pɔːt/", "a complex where aircraft land and take off", "We arrived at the airport two hours early.", "Havalimanına iki saat erken vardık."],
  ["alarm", "alarm, uyarı", "noun", "/əˈlɑːm/", "a warning sound or device", "Set your morning alarm for seven o'clock.", "Sabah alarmınızı saat yediye kurun."],
  ["all", "tümü, hepsi", "adjective", "/ɔːl/", "the whole quantity or extent of", "All students passed the vocabulary test.", "Tüm öğrenciler kelime sınavını geçti."],
  ["allow", "izin vermek", "verb", "/əˈlaʊ/", "give the necessary permission to", "The school allows students to use the library.", "Okul öğrencilerin kütüphaneyi kullanmasına izin verir."],
  ["almost", "neredeyse, hemen hemen", "adverb", "/ˈɔːl.məʊst/", "not quite; nearly", "The lesson is almost finished.", "Ders neredeyse bitti."],
  ["alone", "yalnız, tek başına", "adjective", "/əˈləʊn/", "having no one else present", "He likes walking alone in the quiet park.", "Sessiz parkta yalnız yürümeyi sever."],
  ["along", "boyunca", "adverb", "/əˈlɒŋ/", "moving in a constant direction on", "They strolled along the river bank.", "Nehir kıyısı boyunca gezindiler."],
  ["already", "zaten, çoktan", "adverb", "/ɔːlˈred.i/", "before the time in question", "She has already finished her homework.", "Ödevini çoktan bitirdi."],
  ["also", "ayrıca, de/da", "adverb", "/ˈɔːl.səʊ/", "in addition; too", "He speaks French and also some German.", "Fransızca konuşuyor ve ayrıca biraz Almanca."],
  ["always", "her zaman, daima", "adverb", "/ˈɔːl.weɪz/", "at all times; on all occasions", "Always review words before going to sleep.", "Uyumadan önce daima kelimeleri gözden geçirin."]
];

// Helper to expand a list up to 500 items systematically using CEFR-standard vocabulary patterns
function buildLevelWords(level, seedList, vocabularyBank) {
  const result = [];
  const seen = new Set();

  // First insert real curated seeds
  for (const item of seedList) {
    if (!seen.has(item[0])) {
      seen.add(item[0]);
      result.push({
        id: `w-${level.toLowerCase()}-${result.length + 1}`,
        word: item[0],
        phonetic: item[3],
        partOfSpeech: item[2],
        level: level,
        meaningTr: item[1],
        definitionEn: item[4],
        exampleEn: item[5],
        exampleTr: item[6],
        collocations: [`${item[0]} with`, `practice ${item[0]}`],
        synonyms: []
      });
    }
  }

  // Next fill from vocabulary bank for that specific level
  for (const b of vocabularyBank) {
    if (result.length >= 500) break;
    const w = b.word.toLowerCase().trim();
    if (!seen.has(w)) {
      seen.add(w);
      result.push({
        id: `w-${level.toLowerCase()}-${result.length + 1}`,
        word: w,
        phonetic: b.phonetic || `/${w}/`,
        partOfSpeech: b.pos || 'noun',
        level: level,
        meaningTr: b.tr,
        definitionEn: b.en,
        exampleEn: b.exEn,
        exampleTr: b.exTr,
        collocations: b.colloc || [`${w} regularly`, `key ${w}`],
        synonyms: b.syn || []
      });
    }
  }

  return result;
}

console.log('Building 3000 CEFR words dataset...');
