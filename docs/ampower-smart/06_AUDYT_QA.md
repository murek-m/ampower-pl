# AMPOWER Smart Home & Energy — końcowy audyt QA

Etap 6/6 · 2026-10-11 (Europe/Warsaw). **Audyt lokalny zakończony; publikacja nadal wstrzymana.**
Gałąź: `feat/smart-home-energy-mvp`. Baza: `2f9be19a61c52aed390a53a2a1b5bd67a049ea69`.
Zmiany pozostają niezatwierdzone w Git; nie wykonano stage, commit, push, deployu,
edycji serwera produkcyjnego ani wysyłki prawdziwego zgłoszenia.

## Podstawa i zakres

Przeczytano [04_UX_SPEC.md](../../../docs/ampower-smart/04_UX_SPEC.md),
[05_IMPLEMENTACJA.md](05_IMPLEMENTACJA.md), rzeczywisty diff `README.md` i
`index.html` względem HEAD oraz zawartość nowych plików `smart-home-energy/`,
testów i narzędzi. Sam `git diff` nie obejmuje nowych, nieśledzonych plików.
Uwzględniono [logikę cen](../../../docs/ampower-smart/03_CENNIK_LOGIKA.md).
Właściwe repo jest w `ampower-website`, a nie w pustym nadrzędnym repo domowym.

Dodatkowy przegląd uwzględnia brief i plan, aktualny [audyt źródeł etapu 1](../../01_AUDYT.md),
[research techniczny](../../../docs/ampower-smart/02_TECH_RESEARCH.md),
[macierz kompatybilności](../../../docs/ampower-smart/02_KOMPATYBILNOSC.md),
[BOM](../../../docs/ampower-smart/02_BOM_CENY.md),
[rynek](../../../docs/ampower-smart/03_RYNEK_KONKURENCJA.md),
[ofertę](../../../docs/ampower-smart/03_OFERTA_PAKIETY.md) i
[teksty UX](../../../docs/ampower-smart/04_TRESCI_STRONY.md).
To ponowny audyt lokalnego kodu i osobny zestaw scenariuszy, bez ponownej
weryfikacji aktualności cen dostawców ani konfiguracji produkcji.

Testowano lokalny artefakt `dist/` przez HTTP na `127.0.0.1:4173` i źródła w Node.
Przegląd wizualny oraz odtworzenie błędu modeli: przeglądarka Codex.
Automatyczne e2e: **Chromium 155.0.8059.40**, Playwright z dostarczonego środowiska.
Rozmiar ekranu 390×844 jest emulacją układu, **nie testem iPhone ani Safari**.
Nie uruchomiono Safari: dostęp do aplikacji natywnych był zablokowany blokadą Maca.
Przeglądarki WebKit/Firefox dla Playwright nie były zainstalowane.

E2e dopuszcza wyłącznie lokalny origin i metody GET/HEAD. Blokuje ruch zewnętrzny;
nie klika `mailto:`, `sms:` ani `tel:`. Dane próbne używają `example.invalid`.
Próba XSS dotyczy wyłącznie własnego formularza lokalnego. Nie badano aktywnie produkcji.

## Naprawy wykonane w aktualnym branchu

| Problem | Znaczenie | Naprawa i weryfikacja |
| --- | --- | --- |
| Strona główna ładowała GA4 z domyślnym `analytics_storage: granted`, przy ukrytym wyborze preferencji | Istotny problem prywatności, odziedziczony sprzed MVP | Usunięto loader, automatyczną zgodę, pomiar kontaktu i martwy panel. Lokalnie obie strony działają bez analityki. Test źródła i ponowne e2e; produkcji nie zmieniano |
| Model wspólnej centrali rolet pozostawał po zmianie na osobne sterowniki, pod nową etykietą | Zapytanie mogło błędnie opisać urządzenia i podstawę przyszłej oferty | Zmiana sposobu sterowania usuwa wcześniej wpisany model sterowania, również w pozostałych kategoriach. Ponowne podanie modelu jest opcjonalne. Odtworzono błąd w UI, sprawdzono poprawkę oraz e2e |
| Niepełna para UTF-16 powodowała `URIError` podczas kodowania `mailto:` | Przygotowanie szkicu mogło się przerwać bez użytecznego wyniku | Pełny podgląd i kopiowanie pozostają dostępne, link bez poprawnego URI jest ukryty. Dodano test regresji; wiadomość nie jest obcinana |
| Focus w ciemnej sekcji kontaktu w motywie jasnym miał kontrast około 2,72:1 | Niedostateczna widoczność nawigacji klawiaturą | Jasny outline: około 12,03:1 na panelu. Test palety i rzeczywistego stanu `:focus-visible` w obu motywach |
| Pole podglądu wiadomości miało tekst 14 px | Niezgodność z wymogiem 16 px dla pól; ryzyko powiększenia przy focusie na iOS | Zwiększono do 16 px; potwierdzono computed style w e2e. Zachowania iOS nie zweryfikowano |
| Stary kalkulator nazywał otwarcie szkicu „Wyślij” | Niejasna różnica między przygotowaniem a dostarczeniem | CTA „Przygotuj…” i wyjaśnienie samodzielnej wysyłki. Odbiorcy, URI, ceny i obliczenia zachowane |
| Zmiana konfiguracji podczas asynchronicznego kopiowania kończyła się zwykłym statusem sukcesu starej wersji | Ryzyko wysłania nieaktualnej konfiguracji | Dodano kontrolę wersji. Sukces starej kopii jest nazwany wprost; odmowa po zmianie nie zaznacza pustego/ukrytego podglądu. Oba przebiegi sprawdzone z opóźnionym schowkiem |
| Większy tekst powodował około 48 px przepełnienia na nowej stronie przy 390 px | Problem czytelności i reflow | Siatka mobilna uwzględnia rozmiar tekstu i przechodzi do jednej kolumny; długie nagłówki/etykiety mogą się zawijać. Ponowne e2e z tekstem 200% przez CSS |
| Sekcja kontaktu starej strony przepełniała szerokość o około 6 px przy 320 px / treści 305 px | Odziedziczony błąd układu | Ograniczono minimalną szerokość elementów siatki i umożliwiono zawijanie tekstu. Potwierdzono 305/305 px w przeglądarce Codex i regresję kalkulatora w Chromium |

Ponadto dodano [skrypt e2e](../../scripts/qa_e2e.mjs), polecenie `test:e2e`, kontrolę
składni `.mjs` i instrukcję w README. Skorygowano błędny fixture starego testu:
rzeczywista wartość sterownika podstawowego to `podst`, nie `podstawowy`.
To poprawka testu, nie zmiana kalkulatora.

Drugi zestaw to [qa_additional.mjs](../../scripts/qa_additional.mjs), polecenie
`test:e2e:additional` i [additional.test.js](../../tests/additional.test.js).
Lista 12 kategorii w dodatkowym teście jest zapisana na podstawie UX, bez importowania
jej z implementacji. Dodano `npm run preview`, serwujące wyłącznie `dist/` na loopbacku,
oraz instrukcję podglądu na telefonie w README. Nie dodano zależności runtime.

## Zgodność z etapami 1–5 — dodatkowy przegląd

| Podstawa | Wynik porównania kodu i dokumentacji |
| --- | --- |
| Brief / plan | Osobna usługa i lokalna praca zachowane. Późniejsza specyfikacja UX włącza konfigurator, zastępując wcześniejsze domyślne wyłączenie. Aktualny zakaz publikacji zastępuje pierwotny plan publikowania w etapie 6 |
| Etap 1: źródła i architektura | Statyczna podstrona `/smart-home-energy/`, selektywne lokalne zasoby, trzy wejścia z głównej strony, brak frameworka/backendu. Cały blok dotychczasowych obliczeń niezmieniony. Wyłączenie analityki i poprawka starego kontaktu są jawnymi naprawami QA |
| Etap 2: kompatybilność / BOM | Kategorie i modele klienta nie oznaczają dopuszczenia integracji. Brak zakupu sprzętu, gwarancji BMS/EV, zastąpienia zabezpieczeń albo usług koparek/AI. BOM nie staje się publicznym cennikiem. Fizyczne próby modeli z macierzy pozostają niewykonane |
| Etap 3: oferta i ekonomika | START/STANDARD/PREMIUM opisują zakres bez hipotez limitów/cen. Zdalnie tylko po kwalifikacji działających urządzeń, bez nowych prac 230 V. Opieka, transport i usługi zewnętrzne osobno. Brak automatycznego pakietu, opłat za cele, gwarancji oszczędności i SLA |
| Etap 4: pytania i gałęzie | Wszystkie 12 kategorii, trzy cele, realizacja i dostęp osobno, liczby lub brak danych, rozłączne modele rolet, strefy ogrzewania, logger PV, wspólny system PV/magazynu, zakres alarm/CCTV i aktywny kontakt. Panele używają natywnego `details/summary` z semantyką rozwinięcia; nie dublują jej ręcznym ARIA |
| Etap 4: kanał i prywatność | Wybrany opisany wariant szkicu e-maila, z pełnym podglądem i kopiowaniem. Stany przyjęcia/timeoutu/antyspamu kanału HTTPS nie dotyczą tej implementacji i nie są pozorowane. Brak pełnej informacji po odbiorze poczty nadal blokuje publikację |
| Etap 4: odbiór UX/SEO | Wykonane kontrole rozdzielczości, tekstu, kontrastu, klawiatury i metadanych. Nadal brak fizycznego iPhone/Safari, czytników, rzeczywistego zoomu, badania pięciu osób, grafiki OG i sitemap do indeksacji |
| Etap 5: implementacja i wyniki | Ponownie uruchomiono istniejące testy, dodano nowe i poprawiono wykryte błędy. Raport etapu 5 pozostaje historycznym zapisem 88 testów i ówczesnych ograniczeń; aktualne wyniki są w niniejszym raporcie |

Nie wykryto nieuzgodnionego publicznego cennika ani obietnicy zgodności urządzeń.
Zgodność lokalnej implementacji nie oznacza zatwierdzenia usługi operacyjnej;
lista decyzji i brakujących odbiorów poniżej pozostaje obowiązująca.

## Zaliczone

| Obszar | Dowód / granica wyniku |
| --- | --- |
| Testy modelu, regresji i palet | **97/97 PASS**, 0 pominiętych, końcowy przebieg po dodatkowych poprawkach; wcześniejsze 91/91 zachowane i rozszerzone |
| E2e lokalne | **29/29 PASS**, 170 wyborów opcji; [surowy raport](qa/06_E2E_RESULTS.json). Każda kategoria osobno, wszystkie razem, wszystkie 7 niepustych kombinacji celów i istotne przejścia warunkowe. To nie wszystkie możliwe kombinacje całego formularza |
| Dodatkowe e2e | **13/13 PASS**, wszystkie **66 par kategorii**, nietypowy zestaw dziewięciu kategorii, zmiany podczas kopiowania, rzeczywiste Clipboard API i jego brak, URI e-maila, większy tekst, artefakt i pomiary; [surowy raport](qa/06_ADDITIONAL_RESULTS.json) |
| Kombinacje modelu | **85 995** wariantów: wszystkie 4095 niepustych zbiorów kategorii × 7 niepustych zbiorów celów × 3 realizacje, **z pustymi szczegółami**. Poprawny zakres/warunkowe dane, zawsze cena indywidualna i brak wersji cennika. Nie są to wszystkie kombinacje szczegółów urządzeń |
| Lint, build, diff | `npm run lint`, `npm run build`, `git diff --check`: PASS. Node 26.10.0, Python 3.9.6. Aplikacja i testy jednostkowe nie wymagają instalacji pakietów |
| Desktop/mobile nowej strony | 320, 360, 390, 768, 880, 881, 1024, 1100, 1201 i 1440 px: brak poziomego przewijania. Siatka 1/2/3 kolumn; menu zwinięte do 1200 px. Sprawdzono również menu strony głównej przy wąskich i szerokich viewportach |
| Rozszerzony układ | Wszystkie 12 paneli otwarte, 79 aktywnych pól i długie modele; dodatkowo treść 305 px, 844×390 w poziomie, 1024×600 i 1920×1080. Brak przepełnienia; widoczne pola minimum 44 px / tekst minimum 16 px. Tekst 200% przez CSS: reflow i focus błędu zaliczone; to nie test natywnego zoomu |
| Czytelność i kontrast | Jasny/ciemny motyw: po 221 próbek widocznego tekstu w e2e, także komunikaty błędów; najmniejsze zmierzone wartości około **5,91:1 / 8,13:1**. Testy palet obejmują obramowania i focus. Nie jest to certyfikacja WCAG ani kontrola każdej natywnej kontrolki |
| Klawiatura i semantyka | Checkbox Space, menu Escape i powrót fokusu, focus podsumowania błędów i szkicu, link błędu otwierający zwinięty panel. Etykiety, fieldset/legend, powiązania ARIA i krótkie statusy; reduced motion |
| Rolety | Centrala, osobne moduły, same przyciski, układ mieszany i brak danych. Model sterowania nie przechodzi między drogami; nieaktywne dane nie trafiają do szkicu. Jednostka: napęd, nie przycisk |
| Pozostałe kategorie | Wszystkie widoczne opcje statusu, połączenia, sterowania i funkcji. Monitoring/alarm: monitoring, alarm, oba, nie wiem. PV: logger tak/nie/nie wiem i jego ukrywanie. PV+magazyn: wspólny system tak/nie/nie wiem oraz odznaczenie PV |
| Lokalnie/zdalnie | Ukrywanie miejscowości i gotowości zdalnej, centrali Smart Home i jej modelu, zmiana kanału kontaktu. Zdalne prace instalacyjne i regulacja energii pozostają do kwalifikacji; „tak” przy Ethernet nie zatwierdza usługi |
| Brak danych i kompatybilność | Puste szczegóły i „nie wiem” nie blokują szkicu. Sama kategoria, marka, model wpisany przez klienta ani Wi-Fi nie zatwierdzają kompatybilności. Sterowanie magazynem/regulacja mocy EV wymagają odrębnych testów |
| Walidacja | Kategorie, cel i aktywny kontakt; liczby 1–999 lub brak, odrzucenie zera, ułamków, wartości ujemnych, notacji wykładniczej i 1000; limity tekstów. E-mail z „+” i długą domeną, telefon zagraniczny. Kontrola formatu nie sprawdza istnienia skrzynki/numeru |
| Wycena i jednostki | Wszystkie konfiguracje: **„Wycena indywidualna”**, `price: null`, brak zatwierdzonej wersji cennika. Nie opublikowano hipotez etapu 3, „0 zł”, cen „od”, stawek VAT ani gwarancji oszczędności. Podłogówka = strefa temperatury, klima = jednostka wewnętrzna, magazyn = system, EV = ładowarka |
| Podwójne opłaty | Cele nie są płatnymi pakietami; nie ma automatycznej sumy ani naliczania obu dróg rolet. PV i magazyn mogą opisywać wspólny system. Sprzęt, instalacja i konfiguracja są rozdzielone; transport, koszty zewnętrzne i opieka osobno. Deduplikacja w przyszłej kalkulacji kwot wymaga osobnej implementacji i testów |
| Status zapytania | Formularz wyłącznie przygotowuje szkic; brak stanu „przyjęte/wysłano”. Pełny tekst, ręczny adres, fallback długiego URI, unieważnienie szkicu po zmianie. Podwójne przygotowanie nie wysyła żadnego zgłoszenia |
| Kopiowanie | Pełna zgodność schowka i podglądu przy wszystkich 12 kategoriach, Unicode i długich uwagach w izolowanym Chromium. Osobno poprawny odczyt 1731 znaków w schowku sesji przeglądarki Codex. Opóźniony sukces i odmowa po edycji nie udają skopiowania aktualnej wersji; przycisk odblokowuje się |
| Scenariusze błędów | Odmowa schowka: komunikat, pełny podgląd, zaznaczenie tekstu i odblokowanie przycisku. Brak JS oraz awaria importu: oferta, FAQ i kontakt działają. Po utracie sieci po załadowaniu strony można nadal przygotować szkic |
| XSS i prywatność | Renderowanie przez `textContent`/`.value`, brak HTML z danych klienta; testowy znacznik nie uruchomił kodu. Parametry `mailto:` kodowane oddzielnie. Aktywne dane tylko w pamięci strony; brak kontaktu/uwag w URL, cookies i storage. Nowa strona nie wykonywała żądań zewnętrznych |
| Sekrety | Przegląd nowych źródeł i skan typowych wzorców kluczy: brak znalezisk. Nie ma klucza dostawcy ani endpointu. Nie jest to skan całej historii Git lub infrastruktury pocztowej |
| SEO lokalnego podglądu | Polskie `lang`, jeden H1, unikalny title/description, canonical i OG URL właściwej trasy, Service/BreadcrumbList, bez fikcyjnych Offer/cen/opinii. Linki i kotwice sprawdzone linterem; wejścia z menu/karty/stopki. `noindex, nofollow` zachowane celowo |
| Artefakt | `dist/` zawiera tylko publiczne zasoby z listy buildu; bez dokumentów, testów, narzędzi i kopii QA. Build nie zmienił źródła publikacji Pages |
| Granica podglądu | Lokalne odczyty `/docs/...`, `/package.json`, `/.git/config` i `/.qa-backups/` z serwera `dist/`: **404**. Żadnych prób na produkcji. Serwer źródeł `npm run dev` pozostaje związany z loopbackiem; dla telefonu stosować tylko `dist/` |

Regresja starego kalkulatora: blok `CENNIK` i cały jego skrypt są **bajtowo identyczne
z HEAD**. E2e potwierdza: elektryka 12 punktów 1700–2400 zł, split 4050–6150 zł,
4 kamery 3350–5400 zł, nawadnianie 300 m² 7900–9500 zł; razem 17000–23450 zł.
Node dodatkowo sprawdza 7 pomieszczeń, limit 999 punktów, brak zakresu i znany
przypadek dodatku Wi-Fi bez powierzchni. To potwierdzenie regresji, nie aktualności
rynkowej ani zatwierdzenia starego cennika. Stare kwoty są opisane jako końcowe;
komentarz danych określa je jako brutto. Nowa usługa nie podaje kwot netto/brutto.
Na stronie głównej nie ma osobnego formularza odbiorczego — kontakt to linki i kalkulator.

Pierwszy przebieg e2e: 26/27 PASS, błąd wyboru nieistniejącego `podstawowy` w teście.
Po poprawce fixture, naprawach i rozszerzeniu testów końcowy przebieg: 29/29 PASS.
Pierwszy dodatkowy przebieg: 12/13 PASS; rzeczywisty błąd reflow po powiększeniu tekstu.
Po naprawie końcowy dodatkowy przebieg: 13/13 PASS; ponownie także 29/29 bazowych e2e.

Podglądy do odbioru: [desktop](qa/06_DESKTOP.png), [mobile](qa/06_MOBILE.png),
[motyw ciemny](qa/06_DARK.png). Dane na obrazach są próbne.
Dodatkowe dowody: [pełny szkic mobile](qa/06_ADDITIONAL_MOBILE.png),
[większy tekst po poprawce](qa/06_LARGE_TEXT.png),
[większy tekst przed poprawką](qa/06_LARGE_TEXT_BEFORE.png).

### Wydajność — pomiar lokalny, bez wyniku Lighthouse lub terenowego CWV

Trzy nowe konteksty mobilnego Chromium, 390×844, DPR 3, cache wyłączony,
CPU ×4, ustawiona sieć 1,6 Mb/s pobierania / 0,75 Mb/s wysyłania i opóźnienie 150 ms.
Pomiar przez CDP i PerformanceObserver, od początku wejścia do sekundy po gotowości
fontów. Serwer jest lokalny; te ustawienia i krótka próba nie odtwarzają pełnej sieci
użytkownika. Nie uzyskano wyniku Lighthouse i nie mierzono INP w warunkach terenowych.

| Próba | LCP | CLS w badanym oknie | DOMContentLoaded | Transfer raportowany przez przeglądarkę |
| --- | ---: | ---: | ---: | ---: |
| 1 | 712 ms | 0 | 721 ms | 186 544 B |
| 2 | 708 ms | 0 | 716 ms | 186 544 B |
| 3 | 696 ms | 0 | 706 ms | 186 544 B |

Po 12 zasobów; w jednej próbie długie zadanie 52 ms. LCP/CLS mieszczą się w celach
UX w tych próbach. Nie uznajemy tego za gwarancję szybkości ani pełne zaliczenie CWV.
Strona główna pozostaje monolitem około 2 MB; nie wykonano jej optymalizacji zasobów.

## Niezaliczone

To niespełnione kryteria uruchomienia lub obserwowane ograniczenia, a nie ukryte
błędy w końcowych wynikach testów automatycznych.

| Punkt | Waga / dalsze działanie |
| --- | --- |
| Brak pełnej informacji o przetwarzaniu wiadomości po ich otrzymaniu przez firmę; widoczny tekst podglądowy | **Blokuje publikację.** Dostarczyć i zatwierdzić dane administratora, podstawę, odbiorców/dostawcę poczty, retencję, prawa i transfery; zastąpić lokalny komunikat i zmienić wersję informacji o danych |
| Dotychczasowy sposób publikowania root `main` według dokumentacji nie wyklucza dokumentów wewnętrznych | **Blokuje bezpośredni push jako sposób uruchomienia.** Zatwierdzić i wdrożyć osobno publikowanie wyłącznie `dist/` albo równoważne wykluczenie. `noindex` nie zapewnia poufności |
| Stary dodatek Wi-Fi potrafi dać 800–1000 zł przy zerowej powierzchni nawadniania | Odziedziczona logika, zachowana w regresji. Właściciel powinien rozstrzygnąć, czy to dozwolona wycena samego doposażenia, czy wymaga zmiany osobnym zakresem |
| Brak grafiki OG i sitemap obejmującej nową usługę; podgląd ma noindex | Uzupełnić przy przygotowaniu do publicznej indeksacji. Nie blokuje technicznego działania lokalnego konfiguratora |

## Nieprzetestowane

- **Safari na macOS, fizyczny iPhone/iOS Safari, Android i aplikacje pocztowe/SMS.**
  Nie testowano klawiatury ekranowej, obrotu fizycznego urządzenia, zachowania linków
  pocztowych i limitów URI konkretnych aplikacji. Wąski Chromium nie zastępuje tych prób.
- VoiceOver/Safari i NVDA; rzeczywisty zoom przeglądarki 200%/400%, tekst powiększony
  przez ustawienia użytkownika, pełny audyt WCAG wszystkich stanów i strony głównej.
- Faktyczna wysyłka, odbiór i dostarczenie wiadomości — celowo niewykonane zgodnie
  z zakazem. Skopiowanie/otwarcie szkicu nie jest potwierdzeniem dostarczenia.
- Sukces zapisu, timeout po przyjęciu, idempotencja, walidacja serwerowa, antyspam i
  limity odbiornika HTTPS — odbiornik nie istnieje. Zmiana kanału na backend wymaga nowego QA.
- Fizyczna kompatybilność modeli, działanie scen, awarie centrali, zasilania i internetu
  w domu, bezpieczeństwo dostępu serwisowego. Strona nie jest dowodem zgodności urządzeń.
- Kwotowa kalkulacja Smart Home, deduplikacja płatnych pozycji, VAT, marża i wygasanie
  cennika po przyszłej akceptacji — taka ścieżka nie jest zaimplementowana.
- Core Web Vitals w warunkach użytkowników, INP, Lighthouse, pełne warunki słabego
  łącza, formalne badanie 5 osób i cel 30–60 sekund. Wykonano jedynie pomiar
  laboratoryjny LCP/CLS z ustawionym ograniczeniem sieci/CPU, opisany powyżej.
- Konfiguracja produkcyjnego hostingu, uprawnienia repo, HTTPS/nagłówki na produkcji,
  serwer poczty, kopie zapasowe firmy i całe historyczne repo. Nie edytowano produkcji.

## Wymagające mojej decyzji — właściciela AMPOWER

| Do zaakceptowania | Konkretny wariant do odbioru |
| --- | --- |
| Model kontaktu i odbiorca | V1 przygotowuje pełny e-mail na **kuba@ampower.pl**, do samodzielnego wysłania. Telefon jako preferencja kontaktu jest wpisany w e-mail. Brak automatycznej rejestracji zgłoszenia i gwarancji dostarczenia. Potwierdzić odbiorcę i osobę obsługującą skrzynkę |
| Prywatność | Dostarczyć kompletną informację o rzeczywistym przetwarzaniu poczty; zatwierdzić administratora/kontakt, podstawę, dostawcę, dostęp, retencję i pozostałe wymagane informacje. Nie dodano zgody marketingowej ani wymyślonych zasad retencji |
| Oferta i operacje | Zatwierdzić nazwy i zakresy START/STANDARD/PREMIUM, obszar montażu, warunki zestawu zdalnego, zasady kwalifikacji modeli/funkcji, pilotażu energii i wsparcia; wskazać, kto przeprowadza kwalifikację przed ofertą |
| Ceny | Zatwierdzić start z **wyceną indywidualną bez kwot**. Publiczny cennik nie jest warunkiem tego wariantu. Jeżeli mają być kwoty: osobno zatwierdzić wersję cennika, jednostki, zakres, VAT, transport, aktualność BOM i reguły deduplikacji oraz zlecić implementację/testy |
| Analityka | Zatwierdzić lokalną zmianę: obie strony bez opcjonalnego pomiaru. Ponowne włączenie wymaga oddzielnego mechanizmu preferencji i odbioru. Nie przywracać automatycznego granted ani ukrytego wyboru |
| Odbiór mobilny i dostępność | Zlecić/wykonać test fizycznego iPhone/Safari, Safari desktop oraz czytnika i zoomu. Ewentualne odroczenie konkretnego testu wymaga jawnej decyzji z opisem ograniczenia, nie oznaczenia go jako PASS |
| Dystrybucja i SEO | Potwierdzić `/smart-home-energy/`, publikowanie tylko publicznego artefaktu, późniejsze usunięcie noindex, sitemap/grafikę OG i osobne polecenie publikacji. Zatwierdzić plan rollbacku i osobę odpowiedzialną |
| Dotychczasowy kalkulator | Potwierdzić aktualność starego cennika/określenia „średnie ceny 2026” i zamierzony zakres Wi-Fi bez powierzchni. Audyt nie zatwierdza tych twierdzeń rynkowych |

## Krótka lista przed publikacją

- [ ] Zatwierdzić powyższy model kontaktu, odbiorcę, ofertę i brak publicznych kwot.
- [ ] Uzupełnić i zatwierdzić informację o danych; usunąć tekst o lokalnym podglądzie,
  zmienić `dataNoticeVersion`, ponownie sprawdzić treść szkicu.
- [ ] Wykonać odbiór Safari/iPhone, zoomu i czytnika oraz rozstrzygnąć pozostałe ograniczenia.
- [ ] Zatwierdzić brak analityki; jeśli ma wrócić, najpierw wdrożyć i sprawdzić preferencje.
- [ ] Ustalić publikowanie `dist/`, zweryfikować brak dokumentów/backupów w artefakcie,
  zapisać wersję wydania i ostatni poprawny artefakt, zachować CNAME i favicon.
- [ ] Przygotować docelowe indeksowanie/OG, ponownie uruchomić testy, lint i build;
  wydać **osobne polecenie publikacji**. Ten audyt nie stanowi takiego polecenia.

## Odtworzenie testów

Z katalogu repo, Node 20+ i Python 3:

```sh
npm test
npm run lint
npm run build
npm run preview
```

W drugim terminalu, z dostępnym Playwright/Chromium:

```sh
npm run test:e2e
npm run test:e2e:additional
```

W tym środowisku Playwright nie jest w lokalnym `node_modules`. Do e2e użyto
`AMPOWER_PLAYWRIGHT_MODULE=/Users/jb/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs`
oraz `AMPOWER_CHROME_PATH=/Applications/Google Chrome.app/Contents/MacOS/Google Chrome`.
Nie instalowano zależności ani nowych przeglądarek. Brak tych opcjonalnych narzędzi
nie uniemożliwia buildu ani działania strony; e2e zgłasza ich brak wprost.
Serwer QA jest lokalny i po audycie zostaje zatrzymany.

## Otwarcie podglądu na komputerze i telefonie

Na Macu, w terminalu:

```sh
cd '/Users/jb/Ampower Smart Home/ampower-website'
npm run build
npm run preview
```

Komputer: http://127.0.0.1:4173/smart-home-energy/ . Strona główna jest pod `/`.
Pozostaw terminal otwarty; po zmianach źródeł ponów build i odśwież stronę.

Dla telefonu zatrzymaj ten serwer przez `Ctrl+C`. Telefon i Mac powinny mieć dostęp
do tej samej sieci domowej. Wi‑Fi na tym Macu to `en1`; podczas audytu odczyt
`ipconfig getifaddr en1` zwrócił **192.168.1.162**. Sprawdź IP ponownie, ponieważ może
się zmienić. Z katalogu repo uruchom, zastępując adres aktualnym wynikiem:

```sh
ipconfig getifaddr en1
python3 -m http.server 4173 --bind 192.168.1.162 --directory dist
```

Telefon i komputer: http://192.168.1.162:4173/smart-home-energy/ . Serwer w tym
wariancie nasłuchuje na podanym interfejsie LAN, więc nie używaj wtedy adresu loopback.
Przy połączeniu przewodowym odczytaj aktywny interfejs; szczegóły w [README](../../README.md).
W razie zajętego portu zatrzymaj własny wcześniejszy serwer albo zmień port, także w URL.
Sieć gościnna z izolacją lub firewall może blokować połączenie; ewentualnie dopuść
lokalny serwer w sieci domowej. Nie wykonano zmian firewalla, przekierowania routera,
publicznego tunelu ani uruchomienia serwera LAN w ramach tego audytu.

Na HTTP po IP schowek może być niedostępny: wtedy użyj pełnego podglądu i ręcznego
kopiowania. Ten wariant błędu sprawdzono przez brak Clipboard API; fizycznego telefonu
nie podłączono. Odbiór automatycznego schowka i aplikacji pocztowej na iOS przez
docelowe HTTPS nadal pozostaje niewykonany. Podgląd przez `file://` nie obsłuży modułów.
Po zakończeniu zatrzymaj serwer przez `Ctrl+C`. Udostępniaj tylko `dist/`, nigdy root repo.

## Rollback — instrukcja, niewykonana

**Przed przyszłą publikacją:** zapisać hash wydania, hash ostatniej poprawnej wersji,
konfigurację źródła Pages i kopię obu artefaktów. Bazowy commit tego zadania to
`2f9be19a61c52aed390a53a2a1b5bd67a049ea69`; przy późniejszym wydaniu używać faktycznej
ostatniej poprawnej wersji, bo baza może być już nieaktualna.

1. W razie problemu zatrzymać kolejną publikację i zabezpieczyć aktualny checkout,
   w tym nieśledzone pliki. Nie używać `git reset --hard` ani `git clean`.
2. Przy hostingu artefaktowym odtworzyć zachowany ostatni poprawny artefakt. Przy
   wydaniu zapisanym w Git przygotować oddzielną gałąź i odwrócić **wskazany commit
   wydania** przez `git revert <SHA_WYDANIA>`; zakres sprawdzić w diffie. Dla merge
   commita dobrać właściwego rodzica, bez automatycznego zgadywania.
3. Lokalnie sprawdzić obie strony, menu, ceny starego kalkulatora, kontakt, CNAME
   i brak dokumentów w artefakcie. Powrót do bazy sprzed QA może też przywrócić
   wadliwą analitykę — zachować jej wyłączenie w przygotowanym rollbacku.
4. Dopiero po osobnym poleceniu właściciela opublikować zatwierdzony rollback i
   zweryfikować dostępność. Nie ma bazy danych ani zgłoszeń do migracji/wycofania.

Do odtworzenia wyłącznie lokalnego stanu **sprzed poprawek QA** zachowano ignorowane
kopie `.qa-backups/2026-10-11-before-qa-fixes.tar.gz` (app/model/style/test) i
`.qa-backups/2026-10-11-home-before-qa-fixes.tar.gz` (index/README).
Stan przed dodatkowym przeglądem: `.qa-backups/2026-10-11-before-additional-audit.tar.gz`
(index, app, style, README, package i wcześniejszy raport QA).
Przed użyciem rozpakować je do osobnego katalogu i porównać pliki; nie nadpisywać
bieżącej pracy w ciemno. To kopie etapu 5, nie gotowe artefakty produkcyjnego rollbacku.

**Wniosek odbiorczy:** lokalna implementacja przechodzi wykonane testy po naprawach.
Udostępnienie klientom wymaga zamknięcia decyzji i blokad powyżej; Safari/iPhone
oraz rzeczywistego dostarczenia zapytania nie przedstawiamy jako przetestowanych.
