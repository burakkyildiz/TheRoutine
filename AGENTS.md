<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# The Routine — Proje özeti

The Routine, günlük rutinleri işaretlemek için sade, koyu temalı ve mobil uyumlu bir web uygulaması. İlk sürüm yayında. Arayüz İngilizce; hesap, sunucu tarafında veri kaydı, analiz ve zorunlu ortam değişkeni yok.

- Canlı adres: [the-routine-daily.vercel.app](https://the-routine-daily.vercel.app)
- Kaynak: [burakkyildiz/TheRoutine](https://github.com/burakkyildiz/TheRoutine), `main` dalı. İlk MVP commit’i: `2bb36fd`.
- Belgeler: [kurulum ve kullanım](README.md), [ilk ürün kapsamı](docs/the-routine-prompt.md), [doğrulama kaydı](docs/verification.md).

## Yapılan işler

- Next.js App Router, TypeScript, Tailwind CSS, Lucide ikonları ve yerelde paketlenen Geist ile tek ekran oluşturuldu. Ekranda günün tarihi, ilerleme çubuğu ve tamamlanan rutin sayısı var.
- İlk açılışta `pray`, `train`, `eat`, `study`, `sleep`, `repeat` gösterilir. Kullanıcı rutin ekleyebilir, adını değiştirebilir, onay vererek silebilir ve tamamlandı işaretini açıp kapatabilir. Rutinlerin sırası korunur. Boş liste, sayfa yenilenince varsayılanlarla yeniden doldurulmaz.
- Yerel kayıt, gün değişimi, sekmeler arası güncelleme, erişilebilir diyaloglar ve depolama hatasından sonra tekrar kaydetme eklendi.
- MVP GitHub’a gönderildi; GitHub entegrasyonu kurularak Vercel’de `burakkyildiz/the-routine` projesi oluşturuldu. İlk üretim yayını `main` dalındaki `2bb36fd` commit’inden tamamlandı. Vercel’de Next.js, Node.js 24.x, `npm ci` ve `npm run build` kullanıldı.
- İlk adres `the-routine-two.vercel.app` idi. Yeni adres projeye eklenip doğrulandı; eski adres kaldırıldı. GitHub’daki **About → Website** bağlantısı da yeni adresle güncellendi.

## Veri ve gece yarısı davranışı

- Kayıt, tarayıcının `localStorage` alanında `the-routine:v1` anahtarında tutulur. Her maddenin sabit kimliği vardır. Kayıt tarayıcıya, cihaza ve site adresine özeldir; cihazlar veya adresler arasında kendiliğinden taşınmaz. Site verilerini silmek kayıtları kaldırır.
- Gece yarısı **yalnızca tamamlandı işaretleri** sıfırlanır. Eklenen rutinler, düzenlenen adlar ve sıralama korunur; silinen maddeler geri gelmez. Örneğin bugün `✓ kitap oku` olan madde yarın `○ kitap oku` olarak kalır.
- Tarih, cihazın yerel takvim günü üzerinden hesaplanır. Uygulama açıksa gece yarısı zamanlayıcısı çalışır; kapalıysa ilk açılışta tarih karşılaştırılır. Uyku veya arka plan sonrası odak ve görünürlük olayları da günü kontrol eder.
- Depolamaya yazılamazsa uygulama o oturumda bellekte çalışır ve yeniden kaydetme seçeneği gösterir. Bozuk kayıt için `the-routine:v1:recovery` anahtarı kullanılır. Eşzamanlı sekme yazımlarında son yazım geçerli olabilir.

## Dosyalar ve geliştirme

- `app/`: sayfa, yerleşim ve duyarlı stiller. `components/`: takip ekranı, rutin satırı ve diyaloglar.
- `lib/routine.ts`: veri şeması, doğrulama ve yerel tarih hesabı. `lib/routine-store.ts`: kayıt, zamanlayıcı ve sekmeler arası olaylar. `tests/`: bu davranışların regresyon testleri.
- Node.js 22.18+ gerekir; Node.js 24 önerilir. `npm ci` ile bağımlılıkları kur, `npm run dev` ile [yerel adresi](http://127.0.0.1:3000) aç. Kontroller: `npm test`, `npm run typecheck`, `npm run build`. Üretim çıktısını yerelde `npm start` ile aç.
- Üretim derlemesi Webpack kullanır. Bu seçim, ilk geliştirme ortamında Turbopack alt işleminin port açma kısıtına takılması nedeniyle yapıldı.
- İlk doğrulamada 16 test, TypeScript kontrolü ve üretim derlemesi geçti. Ekleme, düzenleme, silme, işaretleme ve yenileme sonrası kalıcılık tarayıcıda denendi. Mobil yerleşim 390 × 844 boyutunda kontrol edildi. Canlı yayın ve güncel adres HTTPS üzerinden doğrulandı.

## Çözülen iPhone erişim sorunu

iPhone’da uygulama Wi-Fi’de açılırken mobil veride açılmıyordu. Mobil veride başka bir `.vercel.app` sitesi de açılmadı; VPN ile uygulama açıldı. Kullanıcı, operatöründeki **Güvenli İnternet** filtresini kapatınca sorunun çözüldüğünü doğruladı. Bu olay için uygulama kodu veya Vercel ayarı değiştirilmedi. Wi-Fi için elle DNS ayarı, mobil veri bağlantısını etkilemez.

İlk sürümün kapsamı tamamlandı. Benzer rutin uygulamalarındaki özellikler gelecekte değerlendirilebilir; şu anda kararlaştırılmış bir ek özellik yok.
