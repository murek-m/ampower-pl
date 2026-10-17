# AMPOWER Smart Home & Energy — raport rozszerzenia sprzedażowego

2026-10-11. Repozytorium ampower-website, gałąź feat/smart-home-energy-mvp. **Wykonano rozszerzenie istniejącego MVP i testy lokalne. Nie uruchomiono usługi produkcyjnej.** Nie wykonano commit/stage, push, merge, deploymentu, publikacji na ampower.pl, konfiguracji płatnych kont ani rzeczywistych wysyłek do klientów lub właściciela.

## 1. Zmiany i status

| Część | Stan i granica odbioru |
| --- | --- |
| Publiczny silnik przedziałów, VAT, rabaty, minima, wspólne zasoby | Zaimplementowany i przetestowany, z kontrolą zatwierdzenia i dat. Kwoty w aktualnym katalogu wyłączone; posiadana centrala wymaga zatwierdzonego modelu, a radio może być wykorzystane ponownie. |
| Centralny katalog i bezpieczna projekcja publiczna | Gotowy szablon 24 modeli/ścieżek i 17 usług, eksporter i kontrola buildu. Brak aktualnych zatwierdzonych cen zakupowych AMPOWER. |
| UI: wariant/ilości/sprzęt klienta, warunki, sceny, wsparcie i widełki | Zintegrowany z istniejącymi 12 kategoriami i wyglądem AMPOWER. Widoki mobilne i aktualizacja sprawdzone w Chromium. |
| Formularz bez programu pocztowego | Zaimplementowany klient API, walidacja, błędy, identyfikator i ponowienia. Rzeczywisty zapis sprawdzony wyłącznie do lokalnego prototypu. Publiczna wysyłka wyłączona. |
| Przyjęcie zapytania i outbox | Lokalny prototyp Node, atomowy trwały zapis i limity; nie wdrożony backend dla GitHub Pages. |
| Szczegółowa kalkulacja, prywatny CLI, edycja i zatwierdzenie | Lokalny prototyp przetestowany. Dostęp przez konto i uprawnienia systemowe; brak publicznego panelu. |
| Oferta PDF z logo | Generator z bezpiecznego eksportu, 2-stronicowy przykład demonstracyjny sprawdzony wizualnie. Nie jest zatwierdzoną ofertą. |
| Powiadomienie kuba@ampower.pl | Adapter i retry przetestowane na atrapach; nie skonfigurowano dostawcy, domeny ani zweryfikowanego doręczenia. |
| Panel online z MFA/RBAC, D1, webhooki pocztowe i wysyłka klientowi | Propozycja architektury; nie przedstawiamy jako gotowych funkcji. |

Analiza przed implementacją objęła dokumenty etapów 1–6: brief/audyt, research, macierz kompatybilności, BOM, ekonomika, pakiety/abonament, UX/treści, implementacja i raporty QA. W dokumentach P01–P11 są cenami detalicznymi z 2026-10-10, a stawki AMPOWER z etapu 3 są hipotezami. Nie było zgody na finalny cennik. Obecne zlecenie autoryzuje rozszerzenie implementacji, ale nie zatwierdza żadnej z tych kwot.

Zastane zmiany w index.html i dokumentach wcześniejszych etapów zachowano. **W tym rozszerzeniu nie edytowano index.html ani kodu wcześniejszych kalkulatorów.** Zmieniono wyłącznie Smart Home, skrypty/testy, README i dodano backend oraz nowe dokumenty. Dotychczasowy generator szkicu pozostał jako podgląd/fallback, główny przycisk to „Wyślij zapytanie”. `npm run dev` serwuje teraz tylko publiczny dist.

Najważniejsze pliki: `smart-home-energy/pricing.js`, `price-book.js`, `model.js`, `app.js`, `inquiry-client.js`, `inquiry-config.js`; `backend/catalog.seed.json`, `catalog.js`, `internal-calculator.js`, `server.js`, `store.js`, `owner.js`, `offers.js`, `notifications.js`, `pdf_offer.py`; `scripts/export-prices.js`, `build.js`, `qa_sales.mjs`; testy `pricing.test.js` i `backend.test.js`.

## 2. Działanie kalkulatora

Klient wybiera kategorię, liczbę punktów, wariant sprzętu, wykorzystanie istniejącego/nowego sprzętu, wspólny system, sposób realizacji, centralę, infrastrukturę, złożoność i automatyzacje. Nieznane szczegóły nie blokują zgłoszenia. Model nieznany, brak liczby, niekwalifikowana funkcja, nieznany dojazd lub niezatwierdzona/wygasła cena powodują **„Wymaga indywidualnej wyceny” dla całego zakresu**, bez sumy udającej pełną cenę.

Dla kompletnego, zatwierdzonego wariantu wynik to „Szacunkowy koszt instalacji: X zł – Y zł”. Aktualizuje się po każdej zmianie formularza. Sprzęt, prace instalacyjne i konfiguracja są oddzielnymi grupami; dojazd/wysyłka są uwzględnione, gdy dotyczą zakresu i są znane. Abonamenty i zewnętrzne usługi pozostają poza sumą. Istniejący sprzęt nie jest odsprzedawany ponownie. Minima dla uruchomienia i rozbudowy są odrębne.

Widełki wynikają z jawnie zatwierdzonych przedziałów jednostkowych, nie ze sztucznej precyzji lub ±25%. Netto przeliczamy na grosze, VAT zaokrąglamy per wiersz, następnie sumujemy brutto. Dopiero granice wyniku zaokrąglamy na zewnątrz (domyślny krok 100 zł). Podział prezentowany klientowi jest orientacyjny i zaokrąglony. Nieznany VAT nie jest domyślnie zastępowany 8%.

Jedna centrala i wymagane radio są liczone raz. Instancja Shelly używana do świateł i rolet ma jedną integrację, a niezależne bramki — osobne. PV i magazyn mogą mieć wspólną integrację; wspólny punkt jest możliwy dopiero po zatwierdzeniu właściwego wariantu. Dwie gałęzie monitoringu/alarmu i instalacje mieszane pozostają indywidualne, jeśli brakuje rozdzielenia urządzeń i funkcji. Sterowanie magazynem oraz dynamiczna regulacja EV zawsze wymagają osobnej oceny/pilotażu. Zdalny wariant z nowymi modułami wymagającymi montażu na miejscu nie jest wyceniany jako komplet zdalny.

Publiczna informacja: „Przedstawiona kwota jest szacunkiem. Ostateczną wycenę przygotujemy po sprawdzeniu konfiguracji i warunków technicznych instalacji.”

## 3. Urządzenia i usługi z cenami

Poniższe ceny są **wyłącznie zapisami historycznych cen detalicznych brutto z 2026-10-10**, bez ponownej weryfikacji sprzedawców podczas rozszerzenia. Nie są zatwierdzonymi kwotami sprzedaży AMPOWER ani aktualnymi cenami zakupu netto. Zakup netto/sprzedaż w katalogu operacyjnym pozostają null. Dokładne źródła i ograniczenia dostępności zapisano w szablonie i [wcześniejszym BOM](../../../docs/ampower-smart/02_BOM_CENY.md).

| ID | Model / ścieżka | Kategoria | Historyczna cena detaliczna | Stan |
| --- | --- | --- | --- | --- |
| p01 | Home Assistant — Home Assistant Green; karta sklepu NC-GREEN-9703 | host | 999,00 zł brutto | Do aktualizacji i zatwierdzenia |
| p02 | Home Assistant — Home Assistant Connect ZBT-2 | radio | 249,00 zł brutto | Do aktualizacji i zatwierdzenia |
| p03 | SONOFF — SONOFF ZBDongle-E, USB Zigbee | radio | 89,90 zł brutto | Do aktualizacji i zatwierdzenia |
| p04 | Shelly — Shelly 1PM Mini Gen3, jedna sztuka | lights | 64,90 zł brutto | Do aktualizacji i zatwierdzenia |
| p05 | Shelly — Shelly 2PM Gen3, jedna sztuka | blinds | 159,00 zł brutto | Do aktualizacji i zatwierdzenia |
| p06 | SONOFF — SONOFF SNZB-02P | other | 49,90 zł brutto | Do aktualizacji i zatwierdzenia |
| p07 | Shelly — Shelly Pro 3EM 120 A, zestaw z trzema CT | other | 522,98 zł brutto | Do aktualizacji i zatwierdzenia |
| p08 | Shelly — Shelly Pro 4PM, cztery kanały DIN | lights | 410,00 zł brutto | Do aktualizacji i zatwierdzenia |
| p09 | QOOBE — QOOBE IN100 N100 / 12 GB / SSD 512 GB / Windows 11 Pro | host | 1899,00 zł brutto | Do aktualizacji i zatwierdzenia |
| p10 | CyberPower — CyberPower VP700ELCD-FR, 700 VA / 390 W | power | 389,00 zł brutto | Do aktualizacji i zatwierdzenia |
| p11 | Shelly — Shelly Pro 3EM-3CT63, wariant do 63 A | other | 459,00 zł brutto | Do aktualizacji i zatwierdzenia |
| hue-existing | Philips Hue — Istniejący Hue Bridge i światła | lights | Brak ceny / sprzęt klienta | Do aktualizacji i zatwierdzenia |
| somfy-existing | Somfy — Istniejąca TaHoma Switch / Overkiz | blinds | Brak ceny / sprzęt klienta | Do aktualizacji i zatwierdzenia |
| daikin-existing | Daikin — Istniejący adapter BRP069B41/B45 | ac | Brak ceny / sprzęt klienta | Do aktualizacji i zatwierdzenia |
| satel-existing | Satel — Istniejąca Integra + ETHM-1 Plus ≥2.00 | security | Brak ceny / sprzęt klienta | Do aktualizacji i zatwierdzenia |
| fronius-existing | Fronius — Istniejący Solar API, odczyt | pv | Brak ceny / sprzęt klienta | Do aktualizacji i zatwierdzenia |
| goodwe-existing | GoodWe — Istniejący zgodny falownik, odczyt | pv | Brak ceny / sprzęt klienta | Do aktualizacji i zatwierdzenia |
| mitsubishi-existing | Mitsubishi Electric — MELCloud Air-to-Water | heatPump | Brak ceny / sprzęt klienta | Do aktualizacji i zatwierdzenia |
| otgw-existing | OpenTherm Gateway — Istniejąca bramka OpenTherm | boiler | Brak ceny / sprzęt klienta | Do aktualizacji i zatwierdzenia |
| floor-existing | Dobór po audycie — Istniejący zgodny regulator stref | floor | Brak ceny / sprzęt klienta | Do aktualizacji i zatwierdzenia |
| storage-existing | Fronius / Victron — Odczyt zgodnego systemu magazynu | storage | Brak ceny / sprzęt klienta | Do aktualizacji i zatwierdzenia |
| ev-existing | go-e — Istniejąca zgodna ładowarka, odczyt | ev | Brak ceny / sprzęt klienta | Do aktualizacji i zatwierdzenia |
| gate-existing | Shelly — Istniejący dry contact + feedback bramy | gate | Brak ceny / sprzęt klienta | Do aktualizacji i zatwierdzenia |
| onvif-existing | ONVIF — Istniejąca kamera Profile S / H.264 | security | Brak ceny / sprzęt klienta | Do aktualizacji i zatwierdzenia |

P10: 389 zł było promocją na jedną sztukę; symulacje używają 439 zł zgodnie z etapem 3. Green/radio miały planowaną dostawę; 2PM i SNZB-02P były niedostępne. Wszystkie bieżące stany oznaczono do odświeżenia. Hue/Somfy/Daikin/Satel i pozostałe warianty `existing` opisują sprzęt klienta, **nie zakup kompletnego HVAC, alarmu, bram czy baterii**. Katalog „Inne” umożliwia zgłoszenie bez pozornego uniwersalnego produktu.

Ceny usług poniżej są **hipotezami etapu 3, netto**, nie aktualnym cennikiem:

| ID | Usługa | Historyczny punkt odniesienia | Status |
| --- | --- | --- | --- |
| base | Konfiguracja centrali | 1080,00 zł netto/jedn, | Brak aktualnej zatwierdzonej kwoty |
| expansion | Rozbudowa istniejącego HA | Zakres/godziny do określenia | Brak aktualnej zatwierdzonej kwoty |
| integration | Integracja systemu | Zakres/godziny do określenia | Brak aktualnej zatwierdzonej kwoty |
| point | Konfiguracja punktu | 45,00 zł netto/jedn, | Brak aktualnej zatwierdzonej kwoty |
| install-light | Montaż obwodu światła | 112,50 zł netto/jedn, | Brak aktualnej zatwierdzonej kwoty |
| install-blind | Montaż i kalibracja rolety | 150,00 zł netto/jedn, | Brak aktualnej zatwierdzonej kwoty |
| install-meter | Montaż licznika | 225,00 zł netto/jedn, | Brak aktualnej zatwierdzonej kwoty |
| simple | Automatyzacja prosta | 90,00 zł netto/jedn, | Brak aktualnej zatwierdzonej kwoty |
| advanced | Automatyzacja zaawansowana | Zakres/godziny do określenia | Brak aktualnej zatwierdzonej kwoty |
| diagnostics | Diagnostyka | Zakres/godziny do określenia | Brak aktualnej zatwierdzonej kwoty |
| remote | Dodatkowe uruchomienie zdalne | Zakres/godziny do określenia | Brak aktualnej zatwierdzonej kwoty |
| support-basic | Wsparcie podstawowe jednorazowe | Zakres/godziny do określenia | Brak aktualnej zatwierdzonej kwoty |
| support-extended | Wsparcie rozszerzone jednorazowe | Zakres/godziny do określenia | Brak aktualnej zatwierdzonej kwoty |
| complex | Dodatkowa złożona integracja | Zakres/godziny do określenia | Brak aktualnej zatwierdzonej kwoty |
| travel | Dojazd | Zakres/godziny do określenia | Brak aktualnej zatwierdzonej kwoty |
| materials | Materiały dodatkowe | Zakres/godziny do określenia | Brak aktualnej zatwierdzonej kwoty |
| shipping | Wysyłka i opakowanie | Zakres/godziny do określenia | Brak aktualnej zatwierdzonej kwoty |

Dodatkowe historyczne założenia: konfiguracja 180 zł/h; montaż 150 zł/h; znana integracja 1–2 h, HVAC 2–4 h, energia 4–8 h; scena zaawansowana 1,5–3 h; dojazd 1,50 zł/km + 150 zł/h. Zakresy nie są automatycznie wpisane jako zatwierdzone kwoty.

## 4. Ceny wymagające zatwierdzenia

**Wszystkie 24 pozycje katalogu i wszystkie 17 usług**, stawki VAT/warunki odliczeń, reguły rabatów, minima, strefy dojazdu, granice przedziałów, czasy, koszty własne oraz rezerwa wymagają potwierdzenia. Na dziś nie ma ani jednej aktualnej zatwierdzonej ceny publicznej Smart Home. Braku ceny nie pokazujemy jako 0 zł. Zatwierdzenie obejmuje operatora, datę, źródło, okres ważności i wersję. Brak fizycznego pilota nie został zastąpiony zmianą statusu katalogu.

## 5. Koszty wewnętrzne i zasady marży

Wewnętrzny kosztorys zawiera sprzęt, materiały, roboczogodziny, koszt montażu/konfiguracji, czas i koszt dojazdu, dodatkowe koszty, rezerwę oraz przydział kosztów stałych/pozyskania. Nieznany koszt daje niekompletny wynik z listą braków. Każde zgłoszenie zapisuje konfigurację i roboczy kosztorys; przy nieznanych wariantach właściciel musi uzupełnić dobór, czas i ceny. Nie generujemy fikcyjnej rentowności z niezatwierdzonego BOM.

`C bezpośrednie = sprzęt + materiały + robocizna + konfiguracja + dojazd + koszty dodatkowe + rezerwa`

`Z pokrycia = P netto − C bezpośrednie`

`Marża % = Z pokrycia / P netto × 100`

`Narzut % = Z pokrycia / C bezpośrednie × 100`

`Wynik po uwzględnionych kosztach = P netto − C bezpośrednie − przydzielone koszty stałe/pozyskania`

Rezerwa modelowana jest jako procent kosztu własnego pracy, nie kolejnym narzutem na sprzęt. Historyczne 15% narzutu materiałów daje 13,04% marży samej odsprzedaży. Historyczny próg 30% marży pokrycia jest do kalibracji. Wynik jest przed podatkiem dochodowym; nie nazywamy go zyskiem netto firmy. Korekty właściciela są jawne w prywatnym audycie; niski próg lub niedodatni wynik po kosztach wymaga świadomego wyjątku z uzasadnieniem.

VAT należy kwalifikować dla świadczenia i umowy; 8% nie wynika z samego mieszkalnego adresu. Silnik ma testy 23/8/0 i stawek mieszanych, ale nie podejmuje kwalifikacji podatkowej. Źródło sprawdzone 2026-10-11: [MF — stawki i limity VAT](https://www.podatki.gov.pl/podatki-firmowe/vat/stawki-i-limity).

Koszty własne, marża i zysk nie są importowane przez frontend, nie trafiają do dist ani odpowiedzi publicznego API. Przetestowano projekcję z dodatkowym sekretnym polem i wartością kontrolną oraz skan rzeczywistego artefaktu. Repo nie jest magazynem prawdziwych cen zakupowych ani danych klientów. Szablon prywatnej logiki zawiera wyłącznie wcześniejsze hipotezy.

## 6. Przykładowe wyceny START / STANDARD / PREMIUM

**Symulacje historyczne A1–A3, bez zatwierdzenia.** Nie są publicznym cennikiem, przedziałami klienta ani obietnicą realizacji. Sprzęt modelowano jako cena detaliczna/1,23, nie potwierdzony zakup AMPOWER; praca i marże pochodzą z założeń etapu 3. START uwzględnia modelowane minimum 4400 netto, zamiast bazowej sumy 4373,87 netto. Różnice groszowe względem starych tabel wynikają z liczenia groszy w poszczególnych wierszach.

| Pakiet | Koszt bezpośredni netto | Sprzedaż netto | Brutto przy 23% | Marża kwotowa | Marża % | Wynik po przydzielonych kosztach |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| START | 3 034,51 | 4 400,00 | 5 412,00 | 1 365,49 | 31,03% | 865,49 |
| STANDARD | 7 424,45 | 11 155,42 | 13 721,15 | 3 730,97 | 33,45% | 2 730,97 |
| PREMIUM | 14 228,67 | 21 025,06 | 25 860,80 | 6 796,39 | 32,33% | 4 996,39 |

START: 3 światła, 2 sensory, Green/radio/UPS, 2 proste sceny, 14 r-g wraz z podróżą. STANDARD: 8 świateł, 4 rolety, 4 sensory, 4 istniejące zakwalifikowane strefy HVAC, klimatyzacja i licznik, 42 r-g. PREMIUM: 12 świateł, 8 rolet, 6 sensorów, licznik i istniejące PV/magazyn/HVAC/EV po pilotażu, 74,25 r-g AMPOWER plus modelowany podwykonawca. Nie obejmują zakupu PV, baterii, pomp i ładowarek. Potrzeba nowych regulatorów lub przebudowy zmienia BOM.

Kod odtwarzający wyniki: `node backend/example-quotes.js`. Dane wewnętrzne: [PRZYKLADY.json](PRZYKLADY.json). Demonstracyjny PDF zapisano lokalnie jako `output/pdf/ampower-oferta-demonstracyjna.pdf`; ma oznaczenie podglądu, dwie strony, logo, klienta, zakres i cenę, bez kosztów własnych. Nie wysłano go nikomu.

## 7. Obsługa zapytań klientów

Formularz zbiera imię, e-mail, opcjonalny telefon, miejscowość, konfigurację, sposób realizacji i opcjonalne uwagi. Nie wymaga pełnego adresu, danych dostępowych ani konta. Walidacja jest po obu stronach; backend odrzuca obce pola, opcje, nadmiar danych, niezgodną wersję informacji o danych i pułapkę spamową. Ochrona obejmuje limit prób, limit 32 KiB, timeout, CORS, prywatny magazyn i adapter weryfikacji Turnstile hostname/action. CORS nie jest uwierzytelnieniem właściciela.

Po trwałym zapisie zapytania i zadania powiadomienia API zwraca accepted, UUID i datę. Bez zapisu nie ma sukcesu. Podwójne i równoczesne wysłanie tego samego żądania korzysta z idempotencji; utrata odpowiedzi po zapisie nie tworzy drugiego zgłoszenia po ponowieniu. Zmiana danych wymaga nowego klucza. Przeglądarka trzyma klucz tylko w pamięci, więc ponowienie **po odświeżeniu strony** nie ma gwarancji deduplikacji — ograniczenie wymagające decyzji przed produkcją. Nie zapisujemy kontaktów w localStorage/cookies/URL.

Kolejka ma stałego odbiorcę kuba@ampower.pl. Owner CLI umożliwia niezależne sprawdzenie zapisu i statusu. Provider-accepted nie oznacza doręczenia do skrzynki; produkcja potrzebuje podpisanych webhooków i monitoringu zwrotów. Po 23 h niepewnego wyniku adapter wymaga uzgodnienia statusu, zamiast ponawiać po oknie idempotencji dostawcy. Dokumentacja: [Resend — idempotencja 24 h](https://resend.com/docs/dashboard/emails/idempotency-keys), [Turnstile — weryfikacja na serwerze](https://developers.cloudflare.com/turnstile/get-started/server-side-validation/).

Informacja RODO zawiera administratora, cel, zakres minimalnych danych, proponowaną podstawę czynności przed umową, prawa i brak automatycznej wiążącej decyzji. Dostawcy, retencja, transfery i faktyczna podstawa wymagają finalizacji dla wybranej infrastruktury; wysyłka pozostaje wyłączona. Źródło praw: [RODO w EUR-Lex](https://eur-lex.europa.eu/legal-content/PL/TXT/?uri=CELEX:32016R0679). Potwierdzenie zapoznania się nie jest zgodą marketingową.

## 8. Zatwierdzanie ofert

1. Klient przygotowuje zakres i widzi szacunek albo status indywidualny.
2. Wysyła zgłoszenie do działającego odbiornika; numer potwierdza zapis.
3. AMPOWER otrzymuje konfigurację i roboczy kosztorys / listę braków.
4. Właściciel sprawdza modele i instalację, edytuje urządzenia, ilości, koszty, godziny, marżę i końcową cenę przez prywatny CLI.
5. System przelicza rentowność i przygotowuje bezpieczny podgląd dla klienta.
6. Właściciel zatwierdza konkretny numer wersji. Zatwierdzenie jest powiązane ze skrótem konfiguracji; edycja unieważnia je.
7. Dopiero zatwierdzona, aktualna i niezmieniona oferta może zostać wyeksportowana bez oznaczenia wersji roboczej.
8. PDF przygotowujemy lokalnie z eksportu klienta i sprawdzamy. Wysyłka klientowi jest odrębną decyzją właściciela; modułu wysyłania ofert nie uruchomiono ani nie zaimplementowano jako automatycznego procesu.

Lokalny CLI jest prototypem obsługi przez zaufane konto systemowe z prawami 0700/0600. Nie ma panelu HTTP. Docelowy panel wymaga MFA, sprawdzania JWT na backendzie, roli owner i audytu działań. Ukrywanie HTML nie jest zabezpieczeniem.

## 9. Wyniki testów i ograniczenia

| Kontrola | Wynik |
| --- | --- |
| npm test | 184/184 PASS, w tym 97 dotychczasowych i 87 nowych; brak pominiętych |
| Kategorie | Wszystkie 12: warianty syntetycznie zatwierdzone i niezatwierdzone; wszystkie 66 par w przeglądarce |
| Obliczenia | VAT 23/8/0 i mieszany, rabaty ilościowe, minima, rozbudowa, rezerwa, marża/narzut, korekty, dzielenie host/radio/instancji, odwrócone przedziały VAT i niedostępne ceny |
| Aktualność | Zmiana kwoty zmienia wynik; wygasła/future/pending pozycja lub katalog blokują przedział |
| Backend i formularz | Trwały zapis, restart magazynu, 4 równoczesne retry, konflikt klucza, walidacja, spam, błędny origin/metoda/JSON, limit prób, awaria dysku, brak publicznego odczytu/panelu |
| Prywatność | 0600, odrzucenie katalogu 0755, jawna projekcja z polem kontrolnym, skan dist i odpowiedzi API; brak prywatnych pól w eksporcie klienta |
| Oferty | CLI revise/approve/export, blokada niekompletnego/wygasłego/zmienionego dokumentu, wyjątek niskiej marży z uzasadnieniem |
| Poczta/Turnstile | Atrapy sukcesu/błędu, hostname/action, retry i limit okna idempotencji; zero prawdziwych wysyłek i żądań do dostawców podczas QA |
| Nowe e2e sprzedaży | 9/9 PASS; faktyczny zapis lokalny, utrata odpowiedzi po zapisie, 503/pozorny sukces, dynamiczne widełki i ilości |
| Regresje UI MVP | 29/29 PASS, 237 wyborów opcji; dodatkowe 13/13 PASS, 66 par i nietypowe połączenia |
| Responsywność | Chromium: 320–1440 px nowego zestawu, dodatkowo 305–1920 px wszystkich otwartych pól, poziomy telefon, ciemny motyw i tekst powiększony CSS |
| Wcześniejsze kalkulatory | Regresje elektryki, klimatyzacji, monitoringu, nawadniania; blok obliczeń nadal identyczny z bazą |
| Lint/build/diff | Składnia JS i Python, HTML/ARIA/etykiety, jawny build dist, git diff --check PASS |
| PDF | 2 strony, render PNG sprawdzony wizualnie, polskie znaki/cena/oznaczenie demo potwierdzone przez ekstrakcję, brak pól kosztowych |

Pierwszy dodatkowy test układu objął celowo niewidoczną pułapkę spamową i odrzucił jej wysokość. Poprawiono filtr pomiaru, aby obejmował dostępne dla klienta kontrolki; końcowy dodatkowy przebieg 13/13. Nie zmieniano wyglądu na podstawie tego fałszywego alarmu.

Dowody: [nowe e2e](qa/SALES_E2E_RESULTS.json), [regresje MVP](qa/regression/06_E2E_RESULTS.json), [dodatkowe QA](qa/regression/06_ADDITIONAL_RESULTS.json), lokalne PNG w katalogu qa. Dawne dowody etapu 6 zachowano; nowe wyniki są w osobnym katalogu.

Nie wykonano: rzeczywistego doręczenia poczty i webhooków, produkcyjnego Turnstile, logowania online/MFA, wieloprocesowej produkcyjnej bazy/limiterów, testu retencji/backupów, Safari/iPhone/VoiceOver/NVDA, rzeczywistego zoomu ani fizycznych testów urządzeń. Nie deklarujemy pełnej zgodności WCAG, dostępności produkcyjnej ani zatwierdzenia biznesowego.

## 10. Funkcje wymagające backendu i dalszej infrastruktury

Trwałe przyjęcie zgłoszeń internetowych, prywatny magazyn kosztów/danych, automatyczny outbox i jego retry, bezpieczny panel właściciela, audyt akceptacji, kontrola dostępu, retencja/usuwanie, backup/odtworzenie, podpisane webhooki, generowanie PDF w chmurze i kontrolowana wysyłka zatwierdzonej oferty. Prototyp Node używa blokady i atomowych plików z fsync oraz limitu w pamięci; jest związany z loopbackiem i nie nadaje się do opublikowania za reverse proxy.

Proponowana architektura: GitHub Pages + API Cloudflare Worker + D1 transakcyjnie zapisujące inquiry/idempotency/outbox, Turnstile i Resend; osobny owner panel za Access/MFA z rolą i JWT; PDF przez prywatny CLI albo oddzielną usługę. **To propozycja, nie wdrożony stos.** D1/limiter/worker/panel/webhooki nie są zaimplementowane przez samo przygotowanie prototypu Node. Dokładne granice w [ARCHITEKTURA.md](ARCHITEKTURA.md).

## 11. Porównanie usług i miesięczne koszty

Weryfikacja oficjalnych stron 2026-10-11, kwoty USD bez przeliczenia na PLN i bez gwarancji przyszłych limitów. **Faktycznie uruchomione nowe abonamenty: 0; nowe opłaty: 0.**

| Opcja | Koszt i limity | Bezpieczeństwo / ograniczenia |
| --- | --- | --- |
| Formspree Free / Personal / Professional | 0 USD: 50 zgłoszeń/mies., archiwum 30 dni; Personal 10 USD/mies. 200; Professional 20 USD/mies. 2000 | Szybki odbiornik i powiadomienia z panelem dostawcy. API/autoresponses w Professional. Dostawca przechowuje dane; wymaga oceny warunków/retencji/transferów. Nie zastępuje prywatnego kosztorysu i akceptacji oferty. [Plany](https://formspree.io/plans/), [limity](https://help.formspree.io/articles/account-management/account-limits). |
| Cloudflare Workers + D1 + Turnstile | Możliwe 0 USD w limitach: Worker 100 tys. żądań/dzień, 10 ms CPU; D1 5 mln odczytanych/100 tys. zapisanych wierszy/dzień i 5 GB; Turnstile Free | Większa kontrola katalogu, ról i procesu. Wymaga napisania i utrzymania produkcyjnego backendu, retencji/backupu i uzgodnienia umów/danych. PDF nie jest zadaniem na 10 ms CPU. [Workers](https://www.cloudflare.com/plans/developer-platform/), [D1](https://developers.cloudflare.com/d1/platform/pricing/), [Turnstile](https://developers.cloudflare.com/turnstile/plans/). |
| Workers Paid + Resend Free | Od 5 USD/mies. + ewentualne nadwyżki Workers/D1; Resend Free 3000 e-maili/mies., 100/dzień | Powiadomienie właściciela i późniejsza poczta wymagają weryfikacji domeny/odbioru i kontroli limitu. Free nie jest obietnicą bezpłatności przy każdym ruchu. [Resend](https://resend.com/pricing). |
| Workers Paid + Resend Pro | Od 25 USD/mies. przed nadwyżkami/dodatkami: Worker 5 + Resend Pro 20 | Opcja rozwojowa po akceptacji wydatku; Resend Pro 50 tys. e-maili/mies. Nie skonfigurowano. [Workers](https://www.cloudflare.com/plans/developer-platform/), [Resend](https://resend.com/pricing). |
| Lokalny prototyp na komputerze | Bez nowej opłaty usługowej; czas właściciela, energia i kopie nie zostały wycenione | Działa tylko lokalnie, bez dostępnego internetowego formularza i SLA. Jest narzędziem do odbioru projektu, nie hostingiem sprzedaży. |

Rekomenduję docelowy Worker/D1/Turnstile + usługę poczty, ponieważ pełny proces potrzebuje prywatnej bazy i właścicielskiego zatwierdzania. Formspree jest prostszą opcją samych leadów, lecz nie kończy tego procesu. Nie wybieramy ani nie aktywujemy płatnego wariantu bez zgody. Dane nie są automatycznie uznane za przechowywane wyłącznie w UE; lokalizacja, podpowierzenia i transfery wymagają sprawdzenia dla konkretnego konta.

## 12. Instrukcja zmieniania cen

Pełne kroki, pola, eksport, lokalny backend, komendy edycji/akceptacji i generowania PDF: [INSTRUKCJA.md](INSTRUKCJA.md). Operacyjny katalog i dane muszą być poza repo. Ceny aktualizuje się w prywatnym katalogu, jawne pola sprzedaży generuje `npm run prices:export`, potem testy i build. Nie edytujemy wygenerowanej projekcji ani nie zapisujemy cen zakupu w publicznym JS. Rabaty i minima są wersjonowanymi regułami, nie kolejnymi stałymi w kodzie UI.

## 13. Decyzje właściciela przed publikacją

1. Aktualne ceny zakupowe/sprzedaży, źródła, dostępność, czasy, wymagania modeli i granice widełek; akceptacja konkretnych pozycji i wersji.
2. Status VAT/odliczeń oraz kwalifikacja usług, minima i dopłat z księgowością; nie automatyczne 8% dla domów.
3. Rzeczywiste stawki własne, próg marży/narzutu, rezerwa, przydział kosztów stałych i polityka wyjątków/rabatów.
4. Zakres START/STANDARD/PREMIUM, urządzenia po pilotażu, granice wsparcia i realizacji zdalnej; abonamenty pozostają nieaktywne.
5. Obszar i koszt dojazdu, liczba wizyt, materiały i koszty wysyłki.
6. Wybór backendu/poczty/antyspamu, ewentualny budżet i dane kontraktowe dostawców; brak płatnej aktywacji bez zgody.
7. Dostawcy, retencja, prawa dostępu/usuwania/backupów i ewentualne transfery; finalna informacja RODO i jej wersja.
8. Tożsamość owner, MFA/uprawnienia/audyt i zasady przechowywania poufnego katalogu poza repozytorium.
9. Warunki/ważność oferty, umowy, zaliczki, format PDF i sposób ręcznej lub później kontrolowanej wysyłki.
10. Odbiór działającego backendu, faktyczny e-mail na kuba@ampower.pl, antyspam i obsługa niedoręczeń/limitów.
11. Pozostały odbiór Safari/telefonów/czytników i fizyczna kompatybilność reprezentatywnych zestawów.
12. Zmiana źródła Pages na wyłącznie dist. Obecne publikowanie root main może ujawnić backend/dokumentację; noindex nie zabezpiecza plików.
13. Osobne polecenie publikacji/deploymentu i plan rollbacku. Tego polecenia obecne zadanie nie zawiera.

Nie wymagano podjęcia tych decyzji w trakcie implementacji. Przygotowano konkretne pliki, prototyp i testy, a nie uruchomioną usługę z brakującymi zależnościami.
