Page image: https://cdn.prod.website-files.com/63ad8937fc88fa5c8c8b9b96/690dbedafd703ed359efe4b7_irem%20yaaz%C4%B1%202.png

Dört Zeka, Bir PRD: Farklı Yapay Zeka Araçları ile PRD Deneyleri

November 7, 2025

Dört Zeka, Bir PRD: Farklı Yapay Zeka Araçları ile PRD Deneyleri

ChatGPT mi, Claude mu, Gemini mi, Cursor mu? PRD yazımında hangisi öne çıkıyor, test ettik.

Önceki yazımızda, yapay zekanın PRD yazım süreçlerini nasıl dönüştürdüğünü ve bu süreçte verimliliği artırmak için nasıl kullanılabileceğini incelemiştik. Bu kez bir adım ileri gidiyoruz: birlikte bir PRD hazırlıyor ve farklı yapay zeka araçlarını karşılaştırıyoruz.

PRD yazımında birçok yapay zeka aracı kullanılmaktadır. Basitçe bu ürünleri/özellikleri iki temel kategoriye ayırabiliriz.

- Yapay Zeka Araçları:

- ChatGPT
- Claude (Anthropic)
- Gemini (Google)
- Cursor
- Perplexity.ai
- Özellik Olarak Yapay Zeka Araçları:

- Notion AI
- Coda AI
- Confluence AI (Atlassian)
- Productboard AI

Biz bu yazımızda ChatGPT, Gemini, Claude ve Cursor araçlarını ve performanslarını kıyaslıyor olacağız ama önceliğimiz düzgün, içeriğe değinen basit bir prompt hazırlamak.

İlk olarak PRD’mizi test edeceğimiz bir özellik, yeni fikir üzerine düşünelim.

Bu basitçe ifade etmek gerekirse tarihi binaları ve yapıları bir harita üzerinde görebileceğimiz ve bilgilerini öğrenebileceğimiz bir mobil uygulama olsun. Adına da “ Buildo” diyelim. Prompt’u da ChatGPT’den hazırlatalım.

### Prompt

You are an experienced Product Manager.

Write a comprehensive, structured, and actionable PRD (Product Requirements Document) for the following app idea.

App Name: Buildo

App Idea:

Buildo is a mobile application that allows users to explore historical buildings and architectural landmarks through an interactive map.

Users can discover nearby sites, learn about their history, architecture, and cultural significance, and access related images and stories.

Context:

- The goal is to make cultural heritage and architectural history more accessible and engaging through location-based discovery.
- The app targets both locals and tourists who are curious about the buildings and history around them.
- The MVP focuses on interactive exploration, accurate information, and a smooth user experience.
- The PRD will be shared with design, development, and content teams.

Write the PRD with the following structure:

#### 1. Overview

- Summarize Buildo’s purpose and main value proposition in one paragraph.
- Explain what problem it solves and why it matters now.

#### 2. Problem Statement

- Describe the existing gap in discovering and learning about historical or architectural landmarks.
- Mention user pain points: scattered information, unreliable sources, lack of engaging tools.

#### 3. Goal & Success Metrics

- Define what success looks like for the MVP.
- Include measurable KPIs such as number of buildings viewed, time spent per session, user retention, and repeat visits.

#### 4. Target Users & Personas

- Identify main user segments: cultural tourists, local residents, students, and architecture enthusiasts.
- Provide 1–2 concise personas with motivations and primary use cases.

#### 5. User Stories

- Use the format “As a [type of user], I want to [action], so that I can [outcome].”
- Include 4–6 representative user stories (e.g., exploring nearby sites, saving favorites, searching by city).

#### 6. Feature Scope

- In Scope: interactive map view, location-based building pins, building info pages, search & filters, favorites.
- Out of Scope: AR navigation, ticketing, user-generated content (future versions).

#### 7. User Flow

- Outline the user journey step by step: open app → enable location → explore map → tap on a building → read details → save as favorite.
- Present clearly with bullet points.

#### 8. Acceptance Criteria

- Define testable conditions for each core function (map loading time, accuracy of building info, filter responsiveness).

#### 9. Dependencies & Risks

- Mention external data dependencies (map APIs, cultural heritage databases, government open data).
- Highlight risks such as data licensing, accuracy, and scalability.

#### 10. Analytics & Tracking Plan

- Suggest key events to track (e.g., map interactions, search queries, info page views, favorites added).
- Include metrics that indicate engagement and product-market fit.

#### 11. Non-Functional Requirements

- Include performance, accessibility, offline support, localization, and responsive design

#### 12. Future Opportunities

- Suggest future expansion ideas: AR-based exploration, guided walking tours, multi-language support, or integration with cultural institutions.

Style & Output Requirements:

- Use a professional and concise tone suitable for internal product documentation.
- Structure the PRD with headings, bullet points, and clear sub-sections.
- Avoid generic phrasing; include realistic and actionable details.
- The final output should be ready to share with the product, design, and engineering teams.

### Değerlendirme Kriterleri

Çıkarılan PRDleri kıyaslayabilmek için birlikte objektif değerlendirme kategorilerimizi çıkaralım.

Bunlar:

- Tutarlılık: PRD’nin bölümleri ne kadar net ve PRD’de ne kapsamda ve ne kadar yer alıyor, net bir şekilde ifade edilmiş bunu irdeleyeceğiz.
- Derinlik & Detay: PRD’de ne kadar detaya inilmiş bunu değerlendireceğiz.
- Okunabilirlik & Format: Belge ne kadar okunabilir, format uygun mu bunu inceleyeceğiz.
- Ürün Stratejisine Hakimiyet & Yorum: PRD sadece iş listesi olarak mı değerlendirilmiş yoksa ürün stratejisi ile paralellik taşıyor mu bunu irdeleyeceğiz.
- Teknik & Analitik Olgunluk: Teknik detaya ne kadar girilmiş, yol gösterecek şekilde ele alınmış mı bunu değerlendireceğiz.

Bu kategoriler benim ilk fazda, değerlendirmemiz kapsamında anlamlı ve kritik bulduğum noktalar. Eğer farklı değerlendirme kategorileriniz varsa aynı değerlendirmeyi sizler de bu kategorileri dahil ederek yapabilirsiniz.

PRD taslağımız için vereceğimiz prompt ve değerlendirme kategorilerimiz hazır. İlk önce, en çok bilinen aracımız, OpenAI’ın ChatGPT’si ile işe başlayalım.

### ChatGPT

ChatGPT’nin Plus paketine sahip olduğum için “ChatGPT 5” modelini kullandım. Link üzerinden ChatGPT’nin yanıtını inceleyebilirsiniz.

ChatGPT’nin PRD’si klasik bir ürün yöneticisinin “başlangıç taslağı” gibi. Net, kolay okunur, sade bir yapıya sahip ama pratik uygulama derinliği açısından sınırlı.

- Tüm başlıklar yerinde ve yapısal olarak net.
- Okuması kolay, anlaşılır.
- Kapsam sınırlı, geliştirilebilir bir taslak formatında.
- Kullanıcı hikayelerine sade ve anlaşılır bir formatta yer verilmiş.

- Teknik detay yeterli değil. Performans, API veya sistem bağımlılıkları gibi konular ele alınmamış.
- Yalnızca eventler tanımlanmış. Metrik veya funnellara yer verilmemiş.
- Risklere yüzeysel yer verilmiş.

### Cursor

Cursor’ın “Pro” paketine sahibim. Link üzerinden Cursor’ın yanıtını inceleyebilirsiniz.

Cursor prototiplerde olduğu kadar PRDlerde de oldukça başarılı. Verdiğimiz başlıklar fazlasıyla detaylı bir biçimde açıklanmış, irdelenmiş.

- Analitik kısmına oldukça detaylı yer verilmiş.
- Risk, bağımlılık ve teknik kapsam oldukça detaylı.
- Başlıklar ürün geliştirme ekibindekilerin anlayabileceği şekilde net.
- Probleme yaklaşımda kullanıcı perspektifi ve problemleri güçlü bir şekilde ele alınmış
- Personalar detaylı bir şekilde ele alınmış.

- Çok uzun ve bu okunabilirliği bir noktada azaltıyor.
- “Neden”den çok “nasıl”a odaklanılmış. Verdiğimiz problem detayının az olmasının etkisi olabilir.
- Format teknik dokümantasyon şeklinde yazılmış.
- Yönetim ve diğer paydaşların anlaması daha zor.

### Gemini

Gemini’ın ücretli “Pro” paketine sahibim. “2.5 Flash” modelini kullanarak PRD yazdırdım. Link üzerinden Gemini’nin yanıtını inceleyebilirsiniz.

Gemini’nin PRD’si hafif, profesyonel ve net. Ancak derinlik açısından Cursor’un çok gerisinde. Yönetici özetine benzer bir PRD çıktısı verilmiş.

- Okuması oldukça kolay, ana bölümler yerinde.
- Hedefler net bir şekilde verilmiş.
- Dili sade ve anlaşılabilir.
- Persona anlatımı kısa ve sade, yeterli seviyede detaylandırılmış.

- Kabul şartları sınırlı ve detaylı değil.
- ChatGPT’de olduğu gibi yalnızca eventler tanımlanmış. Metrik veya funnellara yer verilmemiş.
- Risk ve bağımlılıklar çok temel seviyede.
- Teknik altyapıya dair herhangi bir detay verilmemiş.

### Claude

Claude AI’ın ücretsiz hesabına sahibim. “Sonnet 4.5” modelini kullanarak PRD çıktısı ürettim. Link üzerinden Claude’ın yanıtını inceleyebilirsiniz.

Claude’un PRD’si en “insan anlatımı güçlü” ve stratejik yönü kuvvetli belge. Gerçek kullanıcı hikâyeleri, şehirler, örnek senaryolarla desteklenmiş. Aynı zamanda teknik gereksinimler iyi tanımlı.

- Akışlar net bir şekilde adım adım anlatılmış.
- Kabul şartları detaylı ve ölçütlere yer verilmiş.
- Risk analizi yeterli seviyede.
- Teknik kapsam da detaylandırılmaya çalışılmış.
- Stratejik olarak güçlü bir dili var. Vizyonu net anlatıyor.
- Teknik ve hikaye arasında güçlü bir köprü kurulmuş.

- Metin uzun. Okunabilirliği güç.
- Hedefler Cursor gibi detaylı değil, kavramsal seviyede kalmış.
- Yönetim ve paydaşlar için fazla detaylı bir PRD.

### Sonuç

Bu değerlendirmemize göre en güçlü PRD aracı olarak Cursor öne çıkıyor. Çünkü Cursor, bir ürün fikrini yalnızca tanımlamakla kalmıyor, doğrudan uygulamaya dönüştürülebilecek bir teknik ve detaylı plan haline de getiriyor. PRD yapısındaki ayrıntı düzeyi (özellikle Acceptance Criteria, Dependencies & Risks, ve Analytics Plan bölümlerindeki netlik) gerçek bir ürün ekibinin geliştirme sürecinde neredeyse hiçbir belirsizlik bırakmıyor. Her satır, “nasıl yapılır” sorusuna yanıt veriyor.

Ben, yapay zeka aracı kullanarak PRD oluştururken belgelerin uzun ve detaylı olmasını tercih ediyorum. Çünkü uzun olduğunda, ekibim için hangi noktaların kısaltılabileceğini daha net görebiliyor ve PRD’yi sadeleştirip daha okunabilir hale getirebiliyorum. Aynı zamanda, daha önce düşünmediğim konular hakkında fikir edinerek olası sürprizleri en aza indirme şansı buluyorum.

Yine de bu, her zaman Cursor’ın benim için “en doğru araç” olduğu anlamına gelmiyor. Bazı ekipler için bu kadar detay, ilerlemeyi hızlandırmaktansa yavaşlatabilir. Örneğin Claude’un PRD’si daha hikayeci, vizyoner ve dengeleyici bir yaklaşım sunarken, Gemini’nin kısa ve sunum odaklı biçimi hızlı karar süreçlerinde daha uygun olabilir. ChatGPT’nin sade versiyonu ise fikirlerin ilk taslak aşamasında oldukça verimli kullanılabilir. Önemli olan, belgenin amacına ve ürün yöneticisi olan bizlere uygun bir şekilde yol göstermesi, işlerimizi kolaylaştırabilmesi ve daha efektif çalışabilmemizi sağlaması.

Tüm bu yazının özeti olarak aşağıdaki sonuca ulaşmak çok daha sağlıklı olacaktır:

“Cursor detaylı bir rehberlik yapıyor, Claude hikaye anlatıyor, Gemini özetliyor, ChatGPT ise başlatıyor.”

Bir sonraki yazımızda görüşmek üzere.

# Dört Zeka, Bir PRD: Farklı Yapay Zeka Araçları ile PRD Deneyleri

Güncellenme Tarihi: 

7.11.2025

Önceki yazımızda, yapay zekanın PRD yazım süreçlerini nasıl dönüştürdüğünü ve bu süreçte verimliliği artırmak için nasıl kullanılabileceğini incelemiştik. Bu kez bir adım ileri gidiyoruz: birlikte bir PRD hazırlıyor ve farklı yapay zeka araçlarını karşılaştırıyoruz.

PRD yazımında birçok yapay zeka aracı kullanılmaktadır. Basitçe bu ürünleri/özellikleri iki temel kategoriye ayırabiliriz.

- Yapay Zeka Araçları:

- ChatGPT
- Claude (Anthropic)
- Gemini (Google)
- Cursor
- Perplexity.ai
- Özellik Olarak Yapay Zeka Araçları:

- Notion AI
- Coda AI
- Confluence AI (Atlassian)
- Productboard AI

İlk olarak PRD’mizi test edeceğimiz bir özellik, yeni fikir üzerine düşünelim.

Bu basitçe ifade etmek gerekirse tarihi binaları ve yapıları bir harita üzerinde görebileceğimiz ve bilgilerini öğrenebileceğimiz bir mobil uygulama olsun. Adına da “ Buildo” diyelim. Prompt’u da ChatGPT’den hazırlatalım.

### Prompt

You are an experienced Product Manager.

Write a comprehensive, structured, and actionable PRD (Product Requirements Document) for the following app idea.

App Name: Buildo

App Idea:

Buildo is a mobile application that allows users to explore historical buildings and architectural landmarks through an interactive map.

Users can discover nearby sites, learn about their history, architecture, and cultural significance, and access related images and stories.

Context:

- The goal is to make cultural heritage and architectural history more accessible and engaging through location-based discovery.
- The app targets both locals and tourists who are curious about the buildings and history around them.
- The MVP focuses on interactive exploration, accurate information, and a smooth user experience.
- The PRD will be shared with design, development, and content teams.

Write the PRD with the following structure:

#### 1. Overview

- Summarize Buildo’s purpose and main value proposition in one paragraph.
- Explain what problem it solves and why it matters now.

#### 2. Problem Statement

- Describe the existing gap in discovering and learning about historical or architectural landmarks.
- Mention user pain points: scattered information, unreliable sources, lack of engaging tools.

#### 3. Goal & Success Metrics

- Define what success looks like for the MVP.
- Include measurable KPIs such as number of buildings viewed, time spent per session, user retention, and repeat visits.

#### 4. Target Users & Personas

- Identify main user segments: cultural tourists, local residents, students, and architecture enthusiasts.
- Provide 1–2 concise personas with motivations and primary use cases.

#### 5. User Stories

- Use the format “As a [type of user], I want to [action], so that I can [outcome].”
- Include 4–6 representative user stories (e.g., exploring nearby sites, saving favorites, searching by city).

#### 6. Feature Scope

- In Scope: interactive map view, location-based building pins, building info pages, search & filters, favorites.
- Out of Scope: AR navigation, ticketing, user-generated content (future versions).

#### 7. User Flow

- Outline the user journey step by step: open app → enable location → explore map → tap on a building → read details → save as favorite.
- Present clearly with bullet points.

#### 8. Acceptance Criteria

- Define testable conditions for each core function (map loading time, accuracy of building info, filter responsiveness).

#### 9. Dependencies & Risks

- Mention external data dependencies (map APIs, cultural heritage databases, government open data).
- Highlight risks such as data licensing, accuracy, and scalability.

#### 10. Analytics & Tracking Plan

- Suggest key events to track (e.g., map interactions, search queries, info page views, favorites added).
- Include metrics that indicate engagement and product-market fit.

#### 11. Non-Functional Requirements

- Include performance, accessibility, offline support, localization, and responsive design

#### 12. Future Opportunities

- Suggest future expansion ideas: AR-based exploration, guided walking tours, multi-language support, or integration with cultural institutions.

Style & Output Requirements:

- Use a professional and concise tone suitable for internal product documentation.
- Structure the PRD with headings, bullet points, and clear sub-sections.
- Avoid generic phrasing; include realistic and actionable details.
- The final output should be ready to share with the product, design, and engineering teams.

### Değerlendirme Kriterleri

Çıkarılan PRDleri kıyaslayabilmek için birlikte objektif değerlendirme kategorilerimizi çıkaralım.

Bunlar:

- Tutarlılık: PRD’nin bölümleri ne kadar net ve PRD’de ne kapsamda ve ne kadar yer alıyor, net bir şekilde ifade edilmiş bunu irdeleyeceğiz.
- Derinlik & Detay: PRD’de ne kadar detaya inilmiş bunu değerlendireceğiz.
- Okunabilirlik & Format: Belge ne kadar okunabilir, format uygun mu bunu inceleyeceğiz.
- Ürün Stratejisine Hakimiyet & Yorum: PRD sadece iş listesi olarak mı değerlendirilmiş yoksa ürün stratejisi ile paralellik taşıyor mu bunu irdeleyeceğiz.
- Teknik & Analitik Olgunluk: Teknik detaya ne kadar girilmiş, yol gösterecek şekilde ele alınmış mı bunu değerlendireceğiz.

Bu kategoriler benim ilk fazda, değerlendirmemiz kapsamında anlamlı ve kritik bulduğum noktalar. Eğer farklı değerlendirme kategorileriniz varsa aynı değerlendirmeyi sizler de bu kategorileri dahil ederek yapabilirsiniz.

PRD taslağımız için vereceğimiz prompt ve değerlendirme kategorilerimiz hazır. İlk önce, en çok bilinen aracımız, OpenAI’ın ChatGPT’si ile işe başlayalım.

### ChatGPT

ChatGPT’nin Plus paketine sahip olduğum için “ChatGPT 5” modelini kullandım. Link üzerinden ChatGPT’nin yanıtını inceleyebilirsiniz.

ChatGPT’nin PRD’si klasik bir ürün yöneticisinin “başlangıç taslağı” gibi. Net, kolay okunur, sade bir yapıya sahip ama pratik uygulama derinliği açısından sınırlı.

- Tüm başlıklar yerinde ve yapısal olarak net.
- Okuması kolay, anlaşılır.
- Kapsam sınırlı, geliştirilebilir bir taslak formatında.
- Kullanıcı hikayelerine sade ve anlaşılır bir formatta yer verilmiş.

- Teknik detay yeterli değil. Performans, API veya sistem bağımlılıkları gibi konular ele alınmamış.
- Yalnızca eventler tanımlanmış. Metrik veya funnellara yer verilmemiş.
- Risklere yüzeysel yer verilmiş.

### Cursor

Cursor’ın “Pro” paketine sahibim. Link üzerinden Cursor’ın yanıtını inceleyebilirsiniz.

Cursor prototiplerde olduğu kadar PRDlerde de oldukça başarılı. Verdiğimiz başlıklar fazlasıyla detaylı bir biçimde açıklanmış, irdelenmiş.

- Analitik kısmına oldukça detaylı yer verilmiş.
- Risk, bağımlılık ve teknik kapsam oldukça detaylı.
- Başlıklar ürün geliştirme ekibindekilerin anlayabileceği şekilde net.
- Probleme yaklaşımda kullanıcı perspektifi ve problemleri güçlü bir şekilde ele alınmış
- Personalar detaylı bir şekilde ele alınmış.

- Çok uzun ve bu okunabilirliği bir noktada azaltıyor.
- “Neden”den çok “nasıl”a odaklanılmış. Verdiğimiz problem detayının az olmasının etkisi olabilir.
- Format teknik dokümantasyon şeklinde yazılmış.
- Yönetim ve diğer paydaşların anlaması daha zor.

### Gemini

Gemini’ın ücretli “Pro” paketine sahibim. “2.5 Flash” modelini kullanarak PRD yazdırdım. Link üzerinden Gemini’nin yanıtını inceleyebilirsiniz.

Gemini’nin PRD’si hafif, profesyonel ve net. Ancak derinlik açısından Cursor’un çok gerisinde. Yönetici özetine benzer bir PRD çıktısı verilmiş.

- Okuması oldukça kolay, ana bölümler yerinde.
- Hedefler net bir şekilde verilmiş.
- Dili sade ve anlaşılabilir.
- Persona anlatımı kısa ve sade, yeterli seviyede detaylandırılmış.

- Kabul şartları sınırlı ve detaylı değil.
- ChatGPT’de olduğu gibi yalnızca eventler tanımlanmış. Metrik veya funnellara yer verilmemiş.
- Risk ve bağımlılıklar çok temel seviyede.
- Teknik altyapıya dair herhangi bir detay verilmemiş.

### Claude

Claude AI’ın ücretsiz hesabına sahibim. “Sonnet 4.5” modelini kullanarak PRD çıktısı ürettim. Link üzerinden Claude’ın yanıtını inceleyebilirsiniz.

Claude’un PRD’si en “insan anlatımı güçlü” ve stratejik yönü kuvvetli belge. Gerçek kullanıcı hikâyeleri, şehirler, örnek senaryolarla desteklenmiş. Aynı zamanda teknik gereksinimler iyi tanımlı.

- Akışlar net bir şekilde adım adım anlatılmış.
- Kabul şartları detaylı ve ölçütlere yer verilmiş.
- Risk analizi yeterli seviyede.
- Teknik kapsam da detaylandırılmaya çalışılmış.
- Stratejik olarak güçlü bir dili var. Vizyonu net anlatıyor.
- Teknik ve hikaye arasında güçlü bir köprü kurulmuş.

- Metin uzun. Okunabilirliği güç.
- Hedefler Cursor gibi detaylı değil, kavramsal seviyede kalmış.
- Yönetim ve paydaşlar için fazla detaylı bir PRD.

### Sonuç

Bu değerlendirmemize göre en güçlü PRD aracı olarak Cursor öne çıkıyor. Çünkü Cursor, bir ürün fikrini yalnızca tanımlamakla kalmıyor, doğrudan uygulamaya dönüştürülebilecek bir teknik ve detaylı plan haline de getiriyor. PRD yapısındaki ayrıntı düzeyi (özellikle Acceptance Criteria, Dependencies & Risks, ve Analytics Plan bölümlerindeki netlik) gerçek bir ürün ekibinin geliştirme sürecinde neredeyse hiçbir belirsizlik bırakmıyor. Her satır, “nasıl yapılır” sorusuna yanıt veriyor.

Ben, yapay zeka aracı kullanarak PRD oluştururken belgelerin uzun ve detaylı olmasını tercih ediyorum. Çünkü uzun olduğunda, ekibim için hangi noktaların kısaltılabileceğini daha net görebiliyor ve PRD’yi sadeleştirip daha okunabilir hale getirebiliyorum. Aynı zamanda, daha önce düşünmediğim konular hakkında fikir edinerek olası sürprizleri en aza indirme şansı buluyorum.

Yine de bu, her zaman Cursor’ın benim için “en doğru araç” olduğu anlamına gelmiyor. Bazı ekipler için bu kadar detay, ilerlemeyi hızlandırmaktansa yavaşlatabilir. Örneğin Claude’un PRD’si daha hikayeci, vizyoner ve dengeleyici bir yaklaşım sunarken, Gemini’nin kısa ve sunum odaklı biçimi hızlı karar süreçlerinde daha uygun olabilir. ChatGPT’nin sade versiyonu ise fikirlerin ilk taslak aşamasında oldukça verimli kullanılabilir. Önemli olan, belgenin amacına ve ürün yöneticisi olan bizlere uygun bir şekilde yol göstermesi, işlerimizi kolaylaştırabilmesi ve daha efektif çalışabilmemizi sağlaması.

Tüm bu yazının özeti olarak aşağıdaki sonuca ulaşmak çok daha sağlıklı olacaktır:

“Cursor detaylı bir rehberlik yapıyor, Claude hikaye anlatıyor, Gemini özetliyor, ChatGPT ise başlatıyor.”

Bir sonraki yazımızda görüşmek üzere.

#### Ürün Yöneticisinden Yapay Zeka Ürün Yöneticisine

Yapay zeka ürün geliştirme kurallarını değiştiriyor. Yeni nesil ürünlere liderlik etmeye hazır mısınız? Halihazırda bir Ürün Yöneticisiyseniz ya da bu alana adım atmak istiyorsanız, yapay zeka destekli ürünleri nasıl inşa edip yöneteceğinizi bilmek artık olmazsa olmaz. Bu 45 dakikalık ücretsiz webinarda, geleneksel bir PM’den AI odaklı ürün liderine nasıl dönüşebileceğinizi anlatacağız.

15 dakika

#### 2023 Web Tasarım Trendleri

Güncellenme Tarihi: 07/07/23 

Donec convallis magna non sem vulputate, et finibus massa commodo. Lorem ipsum dolor sit amet, consectetur.

Jenny Wilson

UX Designer @Hepsiburada

#### 2023 Web Tasarım Trendleri

Güncellenme Tarihi: 07/07/23 

Donec convallis magna non sem vulputate, et finibus massa commodo. Lorem ipsum dolor sit amet, consectetur.

Jenny Wilson

UX Designer @Hepsiburada

#### 2023 Web Tasarım Trendleri

Güncellenme Tarihi: 07/07/23 

Donec convallis magna non sem vulputate, et finibus massa commodo. Lorem ipsum dolor sit amet, consectetur.

UX Designer @Hepsiburada

17/8/2026

17/8/2026

Yapay zeka kullanımının yaygınlaşmasıyla birlikte asıl maliyet, modeller değil onları nasıl kullandığınız haline geliyor. Bu yazıda, token harcamalarını kontrol altında tutmanın neden kritik olduğunu, şirketlerin bu konuda yaşadığı gerçek örnekleri ve maliyeti düşürürken verimliliği artırmaya yardımcı olacak pratik token optimizasyonu stratejilerini ele alıyoruz.

#### Yapay Zeka Elçi Programı: Kurumlarda AI Adaptasyonunun Yeni Modeli

27/7/2026

Yapay zeka araçları her geçen gün değişirken, kurumlar için asıl mesele tek seferlik eğitimler vermek değil, sürekli öğrenen ekipler oluşturabilmek. Bu yazıda, standart AI eğitimlerinin neden yetersiz kaldığını, AI elçi programlarının nasıl çalıştığını ve Migros One örneği üzerinden kurumların yapay zeka adaptasyonunu sürdürülebilir hale getiren yaklaşımı inceliyoruz.

#### Alive'26 Ürün Günü: Hız Aldık, Ama Nereye Gidiyoruz ?

17/8/2026

AI artık ürün ekiplerinin çalışma biçimini değiştiriyor. Ancak organizasyonlar aynı hızda dönüşemediğinde, bir ekibin kazandığı verim diğer ekiplerde darboğaza dönüşebiliyor. Alive'26 Ürün Günü'nde öne çıkan konuşmalar, AI'ın yalnızca geliştirme süreçlerini değil; ekip yapısını, koordinasyonu ve ürün kültürünü nasıl yeniden şekillendirdiğini somut örneklerle ortaya koydu.

17/8/2026

Alive'26, bu yıl yalnızca yeni AI araçlarını değil, yapay zeka çağında tasarımın, ekiplerin ve ürün geliştirme süreçlerinin nasıl yeniden şekillendiğini konuştu. Konferansın en dikkat çeken oturumlarından öne çıkan içgörüleri, ortak temaları ve geleceğe dair en önemli çıkarımları bu yazıda derledik.

17/8/2026

Gelin, tasarımın ekranın ötesinde başlayan gerçek yolculuğunu birlikte keşfedelim. Müşteri ilişkilerinden revizyon yönetimine, iletişimden müzakereye uzanan bu yolculukta, mesleğin en değerli becerilerini birlikte inceleyelim.

#### Figma MCP ile Ne Yapılır? 7 Kullanım Senaryosu

#### PM'ler İçin MCP: Yapay Zekayı Gerçek Bir Takım Arkadaşına Dönüştüren Standart

Güncellenme Tarihi: 

16/7/2026

MCP, yapay zeka araçlarını kullandığınız uygulamalarla tek bir standart üzerinden buluşturarak iş akışlarını hızlandırıyor. Bu yazıda PM'ler için gerçek kullanım senaryolarını, sağladığı zaman tasarrufunu ve nasıl başlayabileceğinizi keşfedeceksiniz.

#### Loop Engineering: AI ile Tek Tek Prompt Yazmayı Bırakıp Kendi Kendini Çalıştıran Sistemler Nasıl Kurulur?

Güncellenme Tarihi: 

16/7/2026

AI'ın asıl gücü tek seferlik prompt'larda değil, kendi kendini çalıştıran loop sistemlerinde ortaya çıkıyor. Bu yazıda, loop engineering yaklaşımının ne olduğunu, neden hızla yaygınlaştığını ve fırsatları kadar maliyetleri ile sınırlarını da ele alıyoruz.

#### Product Market Fit'in Gizli Gerçeği: Tek Bir PMF Yok, Her Segmentin Kendi PMF'i Var

Güncellenme Tarihi: 

16/7/2026

PMF tek bir hedef değil; talep, memnuniyet ve verimliliğin her müşteri segmentinde ayrı değerlendirilmesi gereken dinamik bir yapıdır. Bu yazıda, segment bazlı PMF yaklaşımının neden daha doğru kararlar sağladığını inceliyoruz.

Founder @ brick institute

#### Disiplinlerarası Dönüşüm: Kendi Uzmanlığını Yapay Zeka ile Ölçekleme Stratejileri 

Güncellenme Tarihi: 

16/7/2026

Sadece yazılımcılar için değil. Çiftçiden mali müşavire, dijital pazarlamacıdan danışmana yapay zekayla katma değerli iş üretmenin somut yolları bu rehberde.

#### Ürün Yönetiminde Operasyon: Planlama, Execution ve Release’i Doğru Tasarlamak

16/7/2026

Dijital dünyanın kapıları herkese açık mı? 1.3 milyar insan erişilebilir olmayan ürünler yüzünden dışarıda kalıyor. Erişilebilirliğin iş için neden kritik olduğunu keşfedin.

#### Sıfırdan AI Otomasyon Sistemi: İçerik Üretimden Sosyal Medyaya 

Güncellenme Tarihi: 

23/12/2025

AI burada yardımcı değil, ekip arkadaşı. Brick’te çalışan içerik otomasyon sistemine yakından bakıyoruz.

#### Agent Ürünlerin PM'liğini Yapmak

Güncellenme Tarihi: 

23/12/2025

Yapay zeka destekli agent’ların arkasındaki ürün yönetimi mantığını keşfedin.

#### Ürün Yöneticisinin Yapay Zeka ile Bir Günü

Güncellenme Tarihi: 

23/12/2025

Yapay zeka ile çalışan bir ürün yöneticisinin perde arkasına yakından bakıyoruz.

#### Yapay Zeka ile Hibrit Ürün Yönetimi: PM & AI Co-Founder Modeli

Güncellenme Tarihi: 

28/11/2025

Hibrit ürün yönetiminin yükselişini ve PM–AI Co-Founder modelinin pratik etkilerini bu yazıda keşfedin!

#### Tarayıcılar UX Testi Yapar Mı?

28/11/2025

Yapay zeka tarayıcıları UX testlerinde ne kadar işe yarıyor? Atlas, Comet ve Dia ile yapılan gerçek deneylerden kısa ama sağlam içgörüler.

#### Sıfırdan Ürüne: Yapay Zeka ile PRD’den Prototipe

21/11/2025

Bir fikri PRD’den prototipe taşımanın AI destekli yeni yolculuğunu bu yazıda keşfedin!

#### Sudan Ucuz AI Eğitimleri: Bir Brick Rehberi

28/11/2025

Yapay zeka dünyasında kaybolmak çok kolay ama doğru rehberle yolunuzu bulmak da bir o kadar kolay! İşte sizler için derlediğimiz ücretsiz yapay zeka eğitimleri.

#### Ürün Yöneticisinin Bir Günü: Toplantılardan PRD'ye Tam Rehber

10/11/2025

Ürün yöneticisinin bir günü nasıl geçer? Gerçek rutinlerine ve karar anlarına yakından bakıyoruz.

#### Yapay Zeka İle PRD Yazmak

7/11/2025

Bir fikirden PRD’ye giden yolu yapay zekayla hızlandırmak mümkün. Keşfetmeye hazır mısınız?

#### Bir UI Designer'ın Karar Alma Süreçleri

10/12/2025

Tasarımda sezgi mi, veri mi? Günlük kararların arkasındaki stratejiyi birlikte keşfedelim.

#### Ekip Gelişiminde Yapay Zeka Buluşmaları #1: Kurumsal Öğrenmede Yeni Dönem

31/10/2025

17 farklı şirketten L&D liderleriyle bir araya geldik. Ortak bir soruya odaklandık: Ekiplerimizi YZ çağına nasıl hazırlıyoruz?

#### Product Leadership Roundtable #2: Ürün Geliştirme Süreçlerinde Yapay Zekayı Benimseme

14/10/2025

Ürün liderleriyle bir araya geldik; yapay zekayı, deneyimleri ve dönüşümün gerçek hikayelerini konuştuk.

#### Aynı Prompt, Dört AI Tasarım Aracı: The Good, The Bad, The Ugly & More 

10/12/2025

Bir fikir, dört AI tasarım aracı. Tasarımda yapay zekayı test ettik, sonuçlar düşündüğünüzden daha eğlenceli.

#### Yapay Zeka ile Ürün Yaşam Döngüsü: Hızlanan Dünyada Ürün Yönetimi Rehberi

6/10/2025

Yapay zeka sadece süreçleri değil, ürün yöneticilerinin düşünme biçimini de değiştiriyor. Yeni kuralları öğrenmenin tam zamanı.

#### Eğitim Programlarında Sessiz Dönüşüm: Yapay Zeka ile Öğrenmeyi Yeniden Düşünmek

24/9/2025

Ekipleri yapay zekaya adapte etmenin sırrı: araçlardan çok davranış ve kültür dönüşümünde. Gelin bu yazıda birlikte keşfedelim!

#### Müşteri Deneyimi Tasarımında Yapay Zeka

23/9/2025

Hiper kişiselleştirme, proaktif deneyimler ve sürekli öğrenen sistemler… AI müşteri deneyimini nasıl dönüştürüyor? Bu yazıda keşfedelim.

#### Yapay Zeka Döneminde Kurumsal Eğitimlerin Başarısı Nasıl Ölçümlenir?

Güncellenme Tarihi: 

23/9/2025

#### Yapay Zeka ile Partnerlik Rehberi: Verimlilik İllüzyonundan Gerçek Başarıya

Güncellenme Tarihi: 

18/9/2025

Her gün çıkan yüzlerce AI aracında kaybolmadan verimlilik mümkün mü? Cevap bu rehberde.

#### LLM'ler Kendi Kafasına Göre Konuşmayı Ne Zaman Bırakacak?

Güncellenme Tarihi: 

10/9/2025

AI çok şey vaat ediyor, ama güven sorunu projeleri başlamadan bitiriyor. Peki çözüm ne? Bu yazıda keşfedelim.

#### Görsel Üretiminde Yapay Zeka 

10/9/2025

Bir fikri tek cümleyle görsele dönüştürmek mümkün mü? Gelin birlikte keşfedelim.

#### Yapay Zeka ile Görsel Üretiminde Öne Çıkan Araçlar

Güncellenme Tarihi: 

10/9/2025

Hayalinizdeki görsel, birkaç kelimeyle gerçeğe dönüşebilir. Peki bunu nasıl yapabilirsiniz? Bu yazıda keşfedin.

#### n8n ile RAG Üretimi: Yapay Zeka Artık Daha Odaklı

9/9/2025

Geleneksel chatbot’lar artık yeterli değil. n8n ile RAG sayesinde verilerinizi anlamlı yanıtlarla dönüştürmeyi keşfedin.

10/12/2025

Kartlar yeniden dağıtıldı: Yapay zekâ döneminde kazanan olmanın yollarını birlikte keşfedelim.

#### Deneyim Araştırmalarında Yapay Zeka

10/12/2025

Her gün yeni bir AI senaryosu… UX araştırmalarında bu değişim neleri beraberinde getiriyor? Bu yazıda keşfedin.

#### Yapay Zeka Çağında Tasarım Liderliği: Değişenler, Dönüşenler ve Yeni Görevler

Güncellenme Tarihi: 

2/7/2025

Yapay zeka süreçleri, rolleri ve vizyonu dönüştürürken tasarım liderinin yeni görevler nedir?

#### UX Araştırmasının Yatırım Getirisi Nedir? Nasıl Hesaplanır?

Güncellenme Tarihi: 

30/6/2025

UX Araştırmasının yatırım getirisini (ROI) hesaplayarak daha iyi deneyimlere ve büyümeye doğru seyrediyoruz!

#### Responsible AI - Sorumlu Yapay Zeka - İlkeleri ve Uygulamaları

Güncellenme Tarihi: 

26/6/2025

Sorumlu yapay zeka ilkeleri ve uygulamaları ile daha etik, hukuki, güvenli ve faydalı ürünler nasıl geliştirilir?

#### Kullanıcı Kabul Testi (User Acceptance Testing) ile Canlıya Doğru

24/6/2025

Kullanıcı kabul testi (user acceptance testing) hakkında detaylı bir öğrenim yolculuğuna çıkıyoruz!

#### Agentic AI ve AI Agents Nedir? Yeni Nesil Yapay Zeka ile Tanışıyoruz!

Güncellenme Tarihi: 

10/12/2025

Agentic AI ve AI Agents nedir? Nasıl çalışır? Günlük hayatta nerelerde karşımıza çıkar? Birlikte inceliyoruz.

#### Generative UI Nedir?: Yapay Zeka Arayüzlerinin Geleceğine Doğru

26/11/2025

Yapay zekanın geleceğindeki Generative UI nedir? Hem kullanıcılar, hem de tasarımcılar için önemini keşfediyoruz!

#### Vibe PM ile Yeni Nesil Ürün Yönetimi

17/6/2025

Vibe coding ile hayatımıza girmeye hazırlanan Vibe PM'lik nedir, Vibe PM kimdir?

#### Vibe Coding Dönemine Hazırlık Rehberi ve Adaptasyon Stratejileri

11/6/2025

Vibe coding yalnızca hız ve kolaylık değil, yeni bir dönemi de müjdeliyor. Bu içerikte Vibe Coding dönemine hazırlık için stratejiler sunuyoruz!

#### Müşteri Deneyiminin Yatırım Getirisi Nedir? Nasıl Hesaplanır?

3/6/2025

Müşteri deneyiminin yatırım getirisini gözler önüne sererek daha iyi deneyimler sunmanın zemini hazırlıyoruz!

#### Pretotyping Nedir? Pretotyping ile Doğru Ürün Fikri Nasıl Saptanır?

26/11/2025

Pretotyping (pretotipleme) nedir ve MVP ile prototipten ne yönleriyle ayrılır?

#### Yapay Zeka Ürünü Nasıl Geliştirilir? AI Ürün Keşif ve Planlama Şablonu

22/5/2025

Yapay zeka ürünü geliştirirken AI Canvas süreci nasıl destekler?

#### Product Backlog Nedir? Tüm Gerçekleri ve En Sürdürülebilir Stratejileriyle...

Product Backlog, ürüne dair her şeyin yer aldığı rehberdir. Bu içerikte backlog yönetimi için en doğru stratejileri ele alıyoruz.

#### Vibe Coding ile Ürün Geliştirirken Aklında Tutman Gereken 10 Ders

26/11/2025

Vibe coding nedir? Vibe coding ile başarılı bir ürün geliştirmek için nelerden ders almalıyız?

26/11/2025

Veri odaklılık nedir? Veri olgunluğu seviyeleri nedir? Veri odaklı kültür nasıl inşa edilir? Yanıtları içeriğimizde!

#### Product Cannibalisation (Ürün Yamyamlığı) Nedir, Nasıl Yönetilit?

Product cannibalisation, ürün yamyamlığı nedir? Her zaman bir sorun mudur? Fırsata nasıl çevrilir?

#### Data Driven Design (Veri Odaklı Tasarım) ile Başarı Elde Etmenin Sırları

26/11/2025

Data driven design, veri odaklı tasarım nedir ve hayata nasıl geçirilir?

#### Design Problem - Tasarım Problemi ile İnovasyona Adım Adım

26/11/2025

Design problem (tasarım problemi) nedir? Bu içerikte tasarım problemi ifadeleri üzerinde çalışacak ve onları nasıl çerçeveleyebileceğimizi göreceğiz.

Ürün başarısı adına aldığımız kararların nasıl valide edileceğine odaklanıyor, a/b testi, eye tracking, concierge testi ve konsept testine yakından bakıyoruz.

#### Lean Canvas (Yalın Kanvas) Oluşturma Rehberi

Güncellenme Tarihi: 

25/4/2025

Lean Canvas (Yalın Kanvas) nedir? Ürün fikirlerini test etmek için nasıl oluşturulur?

#### Yeni Pazar Keşfi: Blue Ocean Strategy (Mavi Okyanus Stratejisi) Nedir? 

Güncellenme Tarihi: 

21/4/2025

Ürün yöneticisinin yeni pazarlara yelken açma stratejisi "Blue Ocean Strategy" Nedir?

#### Accessibility Design (Erişilebilirlik Tasarımı) için En İyi Uygulamalar ve İpuçları

Güncellenme Tarihi: 

18/4/2025

Acessibility design (erişilebilirlik tasarımı) için en iyi uygulamalar ve ipuçları ile herkes için deneyim yaratıyoruz!

#### Ürün Yöneticileri için Pazar Araştırması Rehberi: Ne, Neden, Nasıl?

Güncellenme Tarihi: 

16/4/2025

Ürün yöneticileri için pazar araştırması neden önemlidir? Pazar araştırması ürün stratejisini nasıl etkiler?

#### ProductOps (Ürün Operasyonları) Hangi Temeller Üzerinde, Neden Yükselişte?

10/4/2025

ProductOps, yani ürün operasyonları nedir? Ürün yönetiminin yakın geleceğine, ürün operasyonlarına doğru yolculuğa çıkalım!

#### Senior Tasarımcılar için Karar Yönetimi Önemi ve İpuçları

8/4/2025

Senior tasarımcıların yapılacaklar listesinin en önemli maddelerinden biri olan karar yönetimi konusuna odaklanıyoruz.

#### Three Horizons - Üç Ufuk Çerçevesi ile Sürdürülebilir Büyüme ve İnovasyon

3/4/2025

Üç ufuk, üç anlayış... Three Horizons çerçevesini inceliyor ve sürdürülebilir büyüme ve inovasyonun resmini çiziyoruz.

#### Yapay Zeka Ürünleri için En İyi UX Tasarımı Pratikleri ve İpuçları

2/4/2025

Yapay zeka ürünleri için en iyi UX tasarımı uygulamaları, ipuçları ve dikkat edilmesi gerekem noktalar nelerdir?

#### Bir Ürünün Benimsenme Hikayesi: Product Adoption Nedir ve Nasıl Sağlanır?

27/3/2025

Ürün yöneticileri için en önemli performans göstergelerinden biri olan product adoption konusuna yakından bakıyoruz.

#### Desirability, Feasibility ve Viability: İnovasyonun 3 Şartı

25/3/2025

Desirability, Feasibility, Viability" yani "Arzu Edilebilirlik, Uygulanabilirlik ve Sürdürülebilirlik" çerçevesini ele alıyoruz.

#### Product-Channel Fit (Ürün-Kanal Uyumu) Nedir ve Nasıl Yakalanır?

24/3/2025

Doğru kanalla kullanıcı edinimi sanatı: Product Channel Fit (Ürün-Kanal Uyumu) nedir, nasıl yakalanır?

Tasarımda karar yorgunluğu nedir? Kullanıcılar üzerinde karar yorgunluğunun etkileri ve en iyi çözümler nelerdir?

19/3/2025

Ürün yöneticiliği bizlere hangi trendleri getiriyor? Gelecekte ürün yöneticileri için hangi beceriler önem kazanıyor?

#### Yapay Zeka ile UX Tasarımı Kariyeri Ne Yönde Evrilecek?

Yapay zeka sonrası UX tasarımcılarını nasıl bir kariyer yolu bekliyor? Hangi beceriler ve alanlar önem kazanacak?

17/3/2025

Sezgileri güçlü bir ürün yöneticisi olmaya var mısın? Ürün sezgisini, avantajları ve sağladıklarını inceledik! 

#### Tasarımcı ve Tasarım Ekipleri ile Etkili İletişim Kurma Yöntemleri

Tasarımcı olmayanlar, tasarımcı ve tasarım ekibi ile nasıl etkili ve verimli iletişim kurabilir?

13/3/2025

Sürdürülebilir tasarım prensiplerini inceliyor; daha çevre, toplum ve ekonomi dostu pratikleri inceliyoruz!

#### Ürün Analitiği: Verilerin Gücüyle Ürünün Başarısını Şekillendirmek

Güncellenme Tarihi: 

12/3/2025

Teşekkürler ! Başvurunuz Bize Ulaştı.