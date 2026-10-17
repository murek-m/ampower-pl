# AMPOWER Smart Home & Energy — audyt etapu 1/6

Data: 2026-10-10. Zakres: audyt źródeł, odczyt konfiguracji GitHub i dokumentacja. Bez implementacji, push, deployu ani wysyłania leadów.

## 1. Tożsamość repozytorium i stan Git

- Dostęp GitHub CLI oraz połączonego narzędzia GitHub potwierdza konto `Ampower-pl`. Repo strony znajduje się u innego właściciela: [murek-m/ampower-pl](https://github.com/murek-m/ampower-pl). Jest publiczne i dostępne dla konta użytkownika. Potwierdzenie to opis repozytorium, [README.md](README.md) oraz [CNAME](CNAME), nie domysł na podstawie domeny.
- Lokalna kopia: `/Users/jb/Ampower Smart Home/ampower-website`. To osobne repozytorium Git; wcześniejszy problem z nadrzędnym root `/Users/jb` nie dotyczy operacji wykonywanych wewnątrz tej kopii.
- Sklonowana gałąź `main`, tracking `origin/main`, commit `2f9be19a61c52aed390a53a2a1b5bd67a049ea69` z 2026-09-28, „Add AmPower favicon”. Przed dokumentacją: czyste drzewo robocze, brak lokalnych zmian do nadpisania.
- Widoczne gałęzie zdalne: `main`, `audit/website-improvements`, `nawadnianie`. Dla obu dodatkowych gałęzi odczyt `git diff --name-only main...origin/<gałąź>` nie zwrócił plików. Nie przełączano ani nie modyfikowano gałęzi. Przed późniejszą implementacją ponownie sprawdzić ich stan i otwarte prace.
- Nie wykonano stage, commit, push ani modyfikacji GitHuba. Dodane dokumenty pozostają lokalne i nieśledzone. Dawne dokumenty w katalogu nadrzędnym `docs/ampower-smart/` zachowano jako zapis pierwszego, ograniczonego audytu; aktualnym kompletem są dokumenty w tym repozytorium.

## 2. Rzeczywista struktura i technologie

Stan śledzonych plików na audytowanym commicie:

```text
ampower-website/
├── index.html      # cała strona: treść, CSS, zasoby i JS
├── favicon.svg
├── CNAME           # domena ampower.pl
└── README.md       # opis i publikacja
```

Nie ma `AGENTS.md`, `package.json`, lockfile, frameworka, CMS, backendu, katalogu komponentów, konfiguracji bundlera, plików `.env`, skryptów testowych ani własnych workflow w `.github/`. Nie instalowano zależności.

Stack: HTML5 (`lang="pl"`), CSS w `<style>` i zwykły JavaScript w `<script>`. `index.html` ma 1817 linii i 1 968 684 bajty (~1,97 MB przed kompresją). Osadzono 14 obrazów JPEG i 6 zasobów fontów WOFF2. Fonty: Archivo, IBM Plex Sans, IBM Plex Mono (`index.html:50`). Ikony SVG są inline, favicon jest osobnym plikiem.

README opisuje brak zewnętrznych zależności; należy doprecyzować to w przyszłości: zasoby wizualne są osadzone, lecz `index.html:17` ładuje zewnętrzny skrypt Google Analytics. Nie ma fetch/XHR, iframe, API aplikacji ani runtime Node po stronie produkcyjnej.

## 3. Hosting, deployment i ograniczenia publikacji

Źródła: `README.md:8`, `CNAME:1` oraz odczyty GitHub API `repos/murek-m/ampower-pl/pages`, `pages/builds/latest`, `actions/workflows`.

- Hosting: GitHub Pages, `build_type=legacy`, źródło `main`, katalog `/`, custom domain `ampower.pl`, HTTPS wymuszony. Status Pages: `built`.
- Ostatni udany build: commit taki sam jak lokalny HEAD; utworzony 2026-09-28 17:40:13 UTC, zakończony 17:41:07 UTC, bez zgłoszonego błędu. Potwierdza to konfigurację i ostatni build; nie wykonano niezależnego sprawdzenia DNS ani działania strony w przeglądarce.
- API pokazuje jeden aktywny systemowy workflow `pages-build-deployment` (`dynamic/pages/pages-build-deployment`). Nie jest to własny plik workflow w repozytorium.
- README wskazuje, że push do `main` publikuje stronę. Zakaz push jest zatem także ochroną przed niezamierzonym deployem. Fragment instrukcji publikacji w README nie jest zgodą na jego wykonanie.
- Brak konfiguracji środowiska staging i backendu formularzy w repozytorium. Nie traktować podglądu na `main` jako bezpiecznego stagingu.
- Zawartość repozytorium jest publiczna; pliki dokumentacyjne w źródle Pages mogą być dostępne lub renderowane po przyszłej publikacji. Nie umieszczać w nich poufnej strategii, danych klientów ani sekretów. Aktualnie dokumenty są wyłącznie lokalne. Sposób wyłączenia dokumentów z publikowanego artefaktu wymaga osobnej decyzji przed deployem.

## 4. Nawigacja, style i ponowne użycie

Nawigacja `index.html:854`: siedem linków do sekcji strony głównej: Usługi (`#uslugi`), Klimatyzacja, Nawadnianie, Realizacje, Wycena (`#kalkulator`), O firmie, Kontakt. Nie ma routera aplikacyjnego ani dropdownu usług. Logo prowadzi do `#top`, obok menu jest CTA telefonu. Stopka `index.html:1393` zawiera logo i dane firmy, bez dodatkowego menu.

Menu mobilne: przycisk z `aria-controls` i `aria-expanded` (`index.html:874`), przełączanie `.is-open` i zamykanie po kliknięciu linku (`index.html:1405`). Breakpoint 880 px (`index.html:796`). Dodanie długiej ósmej etykiety wymaga sprawdzenia szerokości menu powyżej tego progu; nie zakładać, że obecny układ pomieści ją bez zmian.

System wizualny jest dostępny jako CSS, nie komponenty frameworka:

| Element | Lokalizacja i zastosowanie |
| --- | --- |
| Kolory i wariant ciemny | `index.html:99` — zmienne `--volt`, `--panel`, `--bg`, `--ink`; preferencja systemowa i selektory `data-theme` |
| Typografia | `index.html:147`, `:163`, `:170` — body, `.display`, `.mono`, `.eyebrow` |
| Kontener | `index.html:194` — `.wrap`, maksimum 1100 px |
| Header/menu/brand | `index.html:197`, `:854` |
| Przyciski, sekcje i karty | Istniejące `.btn`, `.btn-volt`, `.btn-ghost`, `.section`, `.section-head`, `.card` w bloku CSS `index.html:49` |
| Kalkulator | CSS `index.html:627` — zachować bez zmian i nie używać jako zależności nowej usługi |
| Dostępność | `index.html:161` — focus; `:790` — reduced motion; `:1298` — wynik kalkulatora `aria-live` |

## 5. Kalkulator — inwentaryzacja i granice

Istnieje **jeden kalkulator wyceny z czterema modułami**, a nie cztery osobne trasy. UI: `index.html:1147`; globalny obiekt `CENNIK`: `:1437`; logika: `:1511`. Ceny to widełki w PLN, wynik zaokrąglany do 50 zł (`:1517`). Treść określa wycenę jako orientacyjną (`:1307`); komentarze stawek nie są dowodem bieżących cen rynkowych i w tym audycie ich nie weryfikowano.

| Moduł | Pola i logika |
| --- | --- |
| Elektryka | Zakres prac, liczba punktów, rozdzielnica; stawka za punkt + rozdzielnica (`:1158`, `:1567`) |
| Klimatyzacja | Pomieszczenia, moc, sprzęt/montaż, trasa; split/multi-split, podział na agregaty dla >6 pomieszczeń i dopłata za trasę (`:1190`, `:1590`) |
| Monitoring | Kamery, nowa/rozbudowa, sprzęt/montaż; pierwsza i kolejne kamery, rejestrator dla nowej instalacji (`:1228`, `:1640`) |
| Nawadnianie | Trawnik, linia kroplująca, Wi-Fi, źródło wody; baza + progi powierzchni i dodatki (`:1258`, `:1672`) |

Alarmy mają odsyłacz do wyceny indywidualnej (`:1295`); nie są modułem kalkulatora. Brak kalkulatora Smart Home, PV, magazynu energii czy EV. Nie dodawać tych zakresów do `CENNIK`.

Wyniki aktualizują się na `input/change` (`:1772`); wpisy liczbowe mają ograniczenie min/max (`:1546`). UI renderuje tekst przez `textContent` (`:1733`). CTA tworzą `sms:` i `mailto:` z zakodowaną treścią wyceny (`:1741`), bez wysyłania do backendu i bez zapisu wyceny w localStorage. Otwarcie CTA nie dowodzi, że użytkownik wysłał wiadomość.

Potwierdzony przypadek brzegowy: 0 m² i 0 m linii z wybranym Wi-Fi nadal daje wycenę samego dodatku 800–1000 zł. To obserwacja do decyzji właściciela w osobnym zakresie, nie poprawka tego projektu. Istniejący kalkulator pozostaje nietknięty.

## 6. Leady, dane i analityka

W kodzie nie ma `<form>`, endpointu przyjmującego dane, bazy danych ani CRM. Lead powstaje przez kontakt telefoniczny, SMS lub e-mail (`index.html:1362`); kalkulator przygotowuje wiadomość w aplikacji użytkownika. Nie ma formularza, który można po prostu ponownie wykorzystać.

Przepływy:

- Wycena → stan DOM w przeglądarce → link SMS/e-mail → zewnętrzna aplikacja użytkownika → wysłanie przez użytkownika → telefon/skrzynka firmy. Treść może trafić do szkiców i historii aplikacji komunikacyjnej; repo nie opisuje tych zasad.
- Analityka → zewnętrzny skrypt Google → konfiguracja GA4 i zdarzenie `contact_click` z parametrem `method` (`index.html:1786`). Własny event przekazuje rodzaj kanału, nie treść wyceny. Automatyczny pomiar GA4 i retencja dostawcy nie zostały zweryfikowane w panelu GA4.
- localStorage przechowuje wyłącznie widoczną w kodzie preferencję `ampower-analytics-consent` (`:1782`, `:1797`), bez terminu wygaśnięcia zdefiniowanego w aplikacji. Nie znaleziono sessionStorage ani IndexedDB.

**Wysokie ryzyko do rozstrzygnięcia przed kopiowaniem analityki na nową stronę:** komentarz `index.html:16` mówi o pomiarze po zgodzie, ale konfiguracja `:22` ma `analytics_storage: 'granted'`. Baner jest ukryty przez CSS `:768` i JS `:1806`; brak zapisanej preferencji uruchamia pomiar (`:1807`). Nawet zapisana odmowa nie jest ustawiana jako `denied` przy ponownym ładowaniu w widocznym kodzie — domyślne `granted` pozostaje. Przyciski odmowy istnieją w HTML, lecz interfejs ich nie pokazuje. To potwierdzona niespójność techniczna; nie kopiować tego mechanizmu wprost. Nie naprawiano go w etapie 1.

Nie znaleziono polityki prywatności, linku do niej ani informacji o retencji danych kontaktowych. Nie można ustalić dostawcy poczty, właścicieli dostępu, backupów, okresu przechowywania, procesu usuwania czy ewentualnego CRM na podstawie repo. GitHub Pages nie stanowi istniejącego backendu dla nowego formularza; taki formularz wymagałby osobnego zatwierdzonego kanału obsługi.

Minimalny zakres ewentualnego leada do uzgodnienia: sposób realizacji, miejscowość/region, ogólny zakres urządzeń, preferowany kontakt. Nie zbierać haseł, adresów dostępu do instalacji, tokenów Home Assistant, dokumentacji zabezpieczeń ani szczegółowych schematów domu w formularzu marketingowym. Dostęp serwisowy organizować oddzielnie. Ostateczny zestaw pól, informacje dla użytkownika i retencję zatwierdza właściciel procesu przed implementacją; audyt nie stanowi opinii prawnej.

Skan bieżących czterech plików pod kątem wybranych formatów tokenów GitHub, kluczy AWS i kluczy prywatnych nie wykazał dopasowań. Nie jest to pełny audyt historii ani gwarancja braku sekretów. Nie kopiowano tokenów ani danych klientów. Identyfikator pomiaru GA4 nie jest sekretem dostępowym; dokumentacja nie powiela jego wartości.

## 7. SEO, dostępność i wydajność

- `index.html:2` — język polski; `:5` viewport; `:7` title; `:8` description; `:9` canonical; `:10` Open Graph z typem, locale, URL, tytułem i opisem.
- `index.html:31` — poprawny składniowo JSON-LD `LocalBusiness` z danymi firmy i obszarem działania. Dla nowej usługi zaplanować własny title/description/canonical/og:url, a ewentualne dane `Service` oprzeć na zaakceptowanej ofercie.
- Brak `og:image`, Twitter Cards, sitemap.xml i robots.txt w repo. Brak meta robots oznacza brak jawnego ograniczenia indeksowania w HTML, nie błąd sam w sobie. Serwerowe nagłówki i stan indeksu wyszukiwarki nie były sprawdzane.
- Statyczna treść nie wymaga JS do odczytu oferty. Znaleziono jeden H1, 14/14 obrazów z `alt`, poprawne odsyłacze do sekcji i etykiety wszystkich 18 kontrolek kalkulatora; brak duplikatów ID.
- Wszystkie zdjęcia są osadzone; żadne nie ma `loading="lazy"`. Rozmiar HTML zwiększa koszt pierwszego pobrania i duplikowania strony. Nie przeprowadzone pomiary transferu, Core Web Vitals, kontrastu ani pełne testy czytnika ekranowego. Dostępność rzeczywista wymaga sprawdzenia w przeglądarce.

## 8. Weryfikacja wykonana w etapie 1

Brak skryptów testowych i buildu w projekcie. Wykonano doraźne kontrole bez dodawania narzędzi do repo:

1. Parser HTML: brak duplikatów ID, brak zerwanych lokalnych fragmentów, H1=1, brak kontrolek bez etykiet i obrazów bez alt.
2. JSON-LD: parsowanie poprawne. Trzy wykonywalne bloki inline JS: `node --check` zakończony powodzeniem.
3. Oryginalny kod kalkulatora uruchomiono w izolowanym Node VM z uproszczonym DOM, bez analityki i sieci. Wyniki:

| Scenariusz | Wynik |
| --- | --- |
| Brak wyboru | — |
| Elektryka: 12 punktów nowej instalacji, bez rozdzielnicy | 1 700–2 400 zł |
| Klimatyzacja: 1 pomieszczenie, 3,5 kW, komplet, 5 m | 4 050–6 150 zł |
| Klimatyzacja: 7 pomieszczeń, 3,5 kW, komplet, 5 m | 22 100–37 050 zł |
| Monitoring: 4 kamery, nowa instalacja, komplet | 3 350–5 400 zł |
| Nawadnianie: 300 m², bez dodatków | 7 900–9 500 zł |
| Nawadnianie: 0 m² i 0 m kropli, bez dodatków | — |
| Nawadnianie: 0 m² i 0 m kropli + Wi-Fi | 800–1 000 zł |
| Elektryka: wpisane 1000 punktów | Ograniczenie do 999; 139 850–199 800 zł |

To kontrola logiki i braku wyjątków w tych scenariuszach, nie pełny test przeglądarkowy ani potwierdzenie rynkowej poprawności cennika. Nie wykonano kliknięć kontaktowych, nie wysłano SMS/e-maila, nie uruchomiono serwera, aplikacji, instalacji zależności ani procesu deployu.

## 9. Najbezpieczniejsza architektura nowej podstrony

**Rekomendacja: nowy plik `smart-home-energy/index.html` i adres `/smart-home-energy/`, zgodnie ze statycznym hostingiem katalogowym.** Taki katalog nie istnieje i nie koliduje z aktualnymi plikami. Brak powodu do wprowadzania SPA, frameworka lub backendu do V1.

Proponowane późniejsze zmiany, po osobnym zleceniu implementacji:

1. Nowa statyczna strona: oferta, kompatybilność, dwa modele realizacji, pakiet startowy + moduły/robocizna + opcjonalny serwis, przykłady prostych automatyzacji, FAQ, CTA do konsultacji. AI/kryptowaluty jedynie w rozwoju, bez obietnic zysku.
2. Podpięcie: dopisać link „Smart Home & Energy” w `.nav-links` w `index.html:861`, np. po „Usługi”. Ten sam kontener obsługuje desktop/mobile. Sprawdzić szerokość ósmego linku przy 881–1100 px; nie przebudowywać menu ani nie zmieniać kalkulatora bez potrzeby. Ewentualny link/karta w `#uslugi` to dodatkowa decyzja etapu 2.
3. Na podstronie logo kierować do `/`; linki do istniejących sekcji zapisać jako `/#uslugi`, `/#kalkulator`, `/#kontakt` itd. Samo `#kontakt` musi oznaczać rzeczywiście istniejącą sekcję nowej strony. Dla własnego linku użyć `aria-current="page"`.
4. Ponownie użyć wzorców HTML i wybranych stylów: kolory, fonty, `.wrap`, typografia, przyciski, header, układy sekcji, kontakt, stopka, reduced motion i menu mobilne. Ponieważ nie ma wspólnego modułu, najmniej ryzykowne na start jest użycie ich w nowym pliku bez refaktoryzacji strony głównej. Nowe selektory ograniczyć do nowej strony.
5. Nie kopiować całego ~2 MB pliku: pominąć fotografie niezwiązane z usługą, sekcję kalkulatora, `CENNIK`, skrypt kalkulatora i wadliwy mechanizm analityki. Wspólne assets/CSS można wydzielić później jako osobną zmianę po ocenie regresji; nie jest to warunek podstrony.
6. CTA V1: istniejące `tel:`, `sms:` i `mailto:` z tematem nowej usługi lub przejście do `/#kontakt`. Użytkownik sam wysyła wiadomość. Nie obiecywać automatycznej rejestracji leada. Jeśli właściciel wybierze formularz, najpierw zaprojektować odbiorcę, backend/dostawcę, ochronę przed spamem, retencję i błędy.
7. SEO: własne metadane, canonical i OG URL; favicon `/favicon.svg`; rozważyć sitemap obejmującą stronę główną i nową usługę. Nie publikować tych zmian w etapie 1.

Przepływ: **strona usługi → kontakt → kwalifikacja i kompatybilność → wycena → montaż lub gotowa centralka → opcjonalny serwis**. Strona marketingowa nie łączy się z Home Assistant klientów. Zdalne wdrożenia, dostęp, backupy, aktualizacje i odzyskanie sterowania wymagają oddzielnych uzgodnień usługi.

## 10. Ryzyka i wejście do etapu 2

| Priorytet | Ryzyko | Działanie przed dalszym wdrożeniem |
| --- | --- | --- |
| Wysoki | Push do `main` uruchamia publikację | Zachować zakaz push/deploy; ustalić sposób lokalnego przeglądu i przyszłego odbioru |
| Wysoki | Domyślnie aktywna analityka i ukryta zgoda | Nie kopiować mechanizmu; uzgodnić model pomiaru i osobny zakres korekty |
| Wysoki | Brak opisanej retencji/prywatności dla kontaktu | Ustalić odpowiedzialnego, przechowywanie, dostęp, czas retencji i treści informacyjne |
| Wysoki | Publiczne repo/Pages i publikowalna dokumentacja | Wyłącznie niesekretne dokumenty; ustalić docelowe miejsce wewnętrznych danych przed publikacją |
| Średni | Ósmy długi link może nie mieścić się w menu | Sprawdzić desktop, mobile, klawiaturę; minimalna lokalna korekta po osobnym zleceniu |
| Średni | Monolityczne style i skrypty bez testów regresji | Nowy plik, brak refaktoryzacji kalkulatora; przed/po sprawdzić jego scenariusze |
| Średni | Duży HTML i duplikowanie osadzonych assets | Reużyć selektywnie; budżet zasobów nowej strony ustalić w specyfikacji |
| Średni | Brak gwarancji kompatybilności i warunków serwisu | Zatwierdzić listę integracji V1, wariant zdalny, odpowiedzialność i granice wsparcia |

Etap 2 wymaga decyzji o finalnej trasie i treści, obszarze montażu i wysyłki centralki, warunkach kompatybilności, kwotach lub zasadach indywidualnej wyceny, opcjonalnym serwisie, CTA i danych leadów. Obecna strona podaje Dolny Śląsk, lecz nie przesądza zasięgu nowej usługi. Uzgodnić analitykę, sposób podglądu i przyszłe publikowanie dokumentów; ponownie sprawdzić stan Git i prace na GitHubie przed implementacją.

Referencje: [00_BRIEF.md](00_BRIEF.md), [PLAN_ETAPOW.md](PLAN_ETAPOW.md). Odwołania `index.html:N` oznaczają linię w audytowanym commicie.
