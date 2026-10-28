# AUDYT SMART HOME & ENERGY — AMPOWER

**Data:** 27 października 2026 r. · **Tryb:** niezależny audyt, bez wdrażania poprawek.  
**Repozytorium:** `murek-m/ampower-pl` · **Produkcja:** https://ampower.pl/smart-home-energy/  
**Zakres:** Smart Home & Energy, konfigurator, lokalny PV Mining oraz bezpośrednio związane mechanizmy. Główna strona: wyłącznie wejście, nawigacja, identyfikacja i niezbędne kontrole regresji istniejących testów.

## CZĘŚĆ I — Podsumowanie dla właściciela projektu

### Werdykt

Smart Home & Energy ma spójną identyfikację AMPOWER, czytelną typografię i dobrze przygotowany mechanizm kwalifikowania potrzeb. W zwykłych rozmiarach ekranu działa stabilnie w Chromium i WebKit. Lokalny kod zawiera istotne zabezpieczenia przed utratą treści szkicu, błędami danych i ujawnieniem plików wewnętrznych. **Wersja produkcyjna jest jednak starsza od lokalnej i pomija część odpowiedzi klienta w przygotowywanej wiadomości.** Poprawka tego problemu już istnieje lokalnie; potrzebuje właściwego procesu weryfikacji i przyszłego wydania.

PV Mining jest rozbudowanym, odrębnym prototypem. Rozróżnia wartość BTC od gotówki, ujawnia ograniczenia, modeluje sezonowość, koszty alternatywne eksportu, magazyn i niepełne kosztorysy. Nie znaleziono podstaw do zarzutu, że obiecuje gwarantowany zysk. **Nie powinien jednak służyć do podejmowania decyzji inwestycyjnych na podstawie obecnego interfejsu:** potwierdzono rozbieżność między widocznymi ustawieniami a profilem używanym przez silnik, ciche podstawianie wartości domyślnych oraz niepełny fizyczny bilans poboru EMS. Wynik może wyglądać wiarygodnie, mimo że pochodzi z innego scenariusza niż wybrany przez użytkownika.

Raport zawiera **17 problemów: 0 P0, 2 P1, 12 P2 i 3 P3**. Liczba obejmuje usterki produktu, lukę modelu obliczeń, braki w ochronie procesu i drobne wykończenie. Status i zakres dowodu są podane osobno przy każdym problemie. Brak P0 oznacza brak potwierdzonego problemu tej klasy w wykonanych testach, a nie gwarancję bezpieczeństwa.

Najważniejsze działania dla przyszłego wdrożenia:

1. Zapewnić zgodność formularza, Workera, wyniku, eksportu i szkicu PV; zacząć od AUD-003 i AUD-004.
2. Zachować istniejące lokalne poprawki kompletności szkicu Smart Home i jego walidacji; objąć je aktualnymi testami przed przyszłą publikacją — AUD-001, AUD-002, AUD-013.
3. Uzgodnić brakujące dane i fizyczne rozliczenie energii EMS — AUD-005, AUD-008, AUD-009. Zmiany ekonomii wymagają ponownej kontroli baseline i NPV.
4. Usunąć zasłanianie fokusu i przepełnienie tekstu, ustabilizować ładowanie PV — AUD-010–AUD-012.
5. Dopiero po tych pracach rozważyć publiczne udostępnienie PV. Aktualne `noindex` i osobny build są właściwą granicą prototypu.

### Co dokładnie zostało zbadane

Nie przełączano gałęzi, nie resetowano zmian i nie pobierano nowych zależności. Katalog nadrzędny `/Users/jb/Ampower Smart Home` zawiera kilka checkoutów. Raport znajduje się w checkoutcie zawierającym rzeczywisty moduł PV:

| Wersja | Lokalizacja / identyfikator | Wniosek |
|---|---|---|
| Preferowana gałąź | `ampower-website`, `feat/smart-home-energy-mvp`, `0c6a56a6845c81a63b4bfd29bb326db8ee963dba` | Istnieje lokalnie i zdalnie. Porównanie GitHub potwierdziło identyczny zdalny tip. Jest starsza od wersji zawierającej PV. Checkout zawiera cudze niezacommitowane zmiany. |
| Główna kopia audytowana | `ampower-pv-mining`, `feat/pv-mining`, `175cf2933eb4bd1b2c8ab0625154e70d7210df95` | Dziesięć commitów ponad preferowaną gałęzią. Analizowano stan roboczy, łącznie ze zmianami istniejącymi przed audytem. Zdalne wyszukiwanie gałęzi nie wykazało `feat/pv-mining`. |
| Wersja publiczna | zdalne `main`, `06a79027bc8325526a261a32f7f390658639f948` | Publiczne HTML, app.js, model.js i consent.js porównano bajtowo z tą wersją. Nagłówek HTML wskazywał Last-Modified 22.10.2026. Nie oznacza to weryfikacji bajtowej każdego zasobu domeny. |
| Dodatkowa kopia | `ampower-murek-review` | Rozpoznana podczas inwentaryzacji; nie była podstawą końcowych testów. |

W chwili rozpoczęcia w audytowanym checkoutcie były zmienione `README.md`, `package.json`, `pv-mining/style.css`, a także nieśledzone `docs/NAPRAWY_AUDYTU_2026-10-27.md`, `docs/qa/` i `scripts/qa_audit_20261027.mjs`. Nie są to zmiany wykonane w tym audycie. Numery linii raportu odnoszą się do tego stanu roboczego; dla problemów produkcyjnych wskazano oddzielnie commit `06a7902`.

**Rzeczywista lokalizacja PV:** źródła `pv-mining/`, wejście `index.html`, warianty `simple.html` i `advanced.html`, współdzielone `app.js`, `engine.js`, `worker.js`, `session.js`, `data-loader.js`, `charts.js` oraz dane JSON. `npm run pv:build` tworzy `output/pv-mining-preview/`. Publiczny `npm run build` tworzy osobny `dist/` i nie publikuje PV. Nie zakładano publicznego URL `/pv-mining/`; brak takiej trasy nie został uznany za usterkę.

### Mocne strony i ryzyka jakościowe

Ocena wyglądu wynika także z renderowania i oględzin zrzutów: czerń, ciepłe jasne tło, żółty akcent, Archivo i IBM Plex tworzą rozpoznawalny system. Karty, pola i przyciski mają konsekwentną formę. Układ desktopowy PV czytelnie oddziela założenia od wyników, a mobile układa je w jedną kolumnę. Tabele szerokie mają własne przewijanie zamiast rozpychania całej strony.

Największym problemem prezentacji jest gęstość i długość ścieżki. Przy 390 px początkowy Smart Home ma około 16,4 tys. px wysokości; rozbudowanie formularza zwiększa wysiłek. Konfigurator pojawia się przed znaczną częścią objaśnienia oferty. Widok zaawansowany PV zawiera bardzo dużo tekstu drobnym stopniem pisma, a widok prosty nadal wymaga interpretacji „korzyści względem eksportu”. To konkretne możliwości poprawy konwersji, lecz bez badań z klientami nie stanowią dowodu spadku sprzedaży.

Nie pomylono opóźnionego obrazu z uszkodzonym zasobem: pełny screenshot wykonany bez przewinięcia może mieć pustą ramkę panelu Home Assistant. Po przewinięciu obraz `smart-panel.png` rzeczywiście się ładuje, ma 1835×937 px i poprawny `naturalWidth`. Potrzebuje raczej lepszego wariantu dla telefonu i optymalizacji niż naprawy nieistniejącego 404.

### Funkcje celowo nieukończone

- Wysyłka Smart Home do backendu jest wyłączona (`inquiry-config.json`: `enabled:false`, brak aktywnego endpointu). Działającą ścieżką jest przygotowanie wiadomości, kopiowanie i link do własnej poczty. Nie kwalifikowano tego jako uszkodzonej wysyłki.
- Cennik zawiera pozycje oczekujące na weryfikację. Brak wiążącej wyceny ma uzasadnienie; nie należy automatycznie aktywować cen, aby „naprawić” kalkulator.
- PV jest lokalnym prototypem z `noindex,nofollow`, historycznym snapshotem i niepotwierdzonymi pełnymi ofertami. Brak publicznego indeksowania jest zamierzony.
- Brak zwrotu przy niekompletnych kosztach, brak automatycznego zakupu ASIC i brak rzeczywistego sterowania koparką są poprawnym zachowaniem prototypu.

## CZĘŚĆ II — Wyniki testów

### Metoda, środowisko i znaczenie statusów

**PASS** — zdefiniowany przypadek wykonano i potwierdzono oczekiwany wynik. **FAIL** — odtworzono błąd lub stwierdzono konkretny brak w audytowanej konfiguracji. **NOT TESTED** — test niewykonany. **UNVERIFIED** — istnieje obserwacja lub ryzyko, ale brakuje dowodu do ostatecznego wniosku.

Testy wykonywano na kopii poza repozytorium, w katalogu tymczasowym `ampower-independent-audit-20261027-sig0kjl3`. Buildy i skrypty QA mogły zapisywać pliki wyłącznie w tej kopii. Manifest SHA-256 obejmujący 464 istniejące pliki oryginału służy końcowej kontroli integralności. Nie uruchamiano skryptów publikacji, odświeżania rynku ani rzeczywistych usług sprzedażowych.

- macOS, Node.js 26.10.0, istniejący Playwright i istniejące narzędzia QA; bez instalacji lub aktualizacji zależności projektu.
- Chromium: zainstalowany Chrome 156.0.8078.48 w trybie headless. WebKit: Playwright WebKit 26.5, headless. WebKit nie jest równoznaczny z testem na fizycznym iPhonie lub w natywnym Safari.
- Lokalny Smart Home: `http://127.0.0.1:49261/smart-home-energy/`; PV: port 49262 i rzeczywiste dokumenty `simple.html` / `advanced.html`. Odtworzoną wersję publiczną testowano osobno na porcie 49263.
- Do macierzy renderowania użyto wysokości 844 px dla mobile i 900 px dla desktop, reduced-motion, świeżych kontekstów i oczekiwania na fonty. Są to viewporty CSS, bez emulacji rzeczywistej wydajności urządzeń.
- W kontrolowanych testach przeglądarkowych blokowano zewnętrzne originy i wysyłkę formularzy. Wykorzystywano syntetyczne dane kontaktowe. Linki `mailto:` oceniano przez treść URI, bez otwierania programu pocztowego ani wysyłania.

### Macierz renderowania

Każda komórka obejmuje pierwsze renderowanie, liczbę H1, błędy wykonania JavaScript, załadowanie zadeklarowanych zasobów i poziome przepełnienie dokumentu. Nie oznacza przejścia każdej kombinacji danych na każdym rozmiarze. Zrzuty są w paczce dowodowej.

| Szerokość CSS | Smart lokalny Chromium / WebKit | PV simple Chromium / WebKit | PV advanced Chromium / WebKit | Smart produkcyjny Chromium / WebKit |
|---:|---|---|---|---|
| 375 | PASS / PASS | PASS / PASS | PASS / PASS | PASS / PASS |
| 390 | PASS / PASS | PASS / PASS | PASS / PASS | PASS / PASS |
| 430 | PASS / PASS | PASS / PASS | PASS / PASS | PASS / PASS |
| 1366 | PASS / PASS | PASS / PASS | PASS / PASS | PASS / PASS |
| 1440 | PASS / PASS | PASS / PASS | PASS / PASS | PASS / PASS |
| 1920 | PASS / PASS | PASS / PASS | PASS / PASS | PASS / PASS |

**Łącznie 36 lokalnych i 12 produkcyjnych konfiguracji.** Brak poziomego przepełnienia przy zwykłym tekście i brak wyjątków JS. Późniejsze pomiary wykazały odrębny problem tekstu 200% i favicon 404 w PV — podstawowa macierz nie jest pełnym audytem sieci. Produkcyjne żądanie skryptu Cloudflare Web Analytics zostało przechwycone i zablokowane; nie obserwowano skutecznego wysłania telemetrii.

### Istniejące testy i kontrole techniczne

| Test | Rezultat | Interpretacja / dowód |
|---|---|---|
| `npm run build` | PASS | Publiczny artefakt utworzony w kopii; `build.log`. |
| `npm run pv:build` | PASS | Osobny prototyp, bez backendu i dokumentacji; `pv-build.log`. |
| `npm run lint` | PASS w deklarowanym zakresie | 71 plików JS plus kontrole HTML; skrypt nie obejmuje całego PV — AUD-014. |
| `npm run release:check` | PASS | 74 dozwolone pliki, CSP i granica artefaktu; `release-check.log`. |
| `npm test` | Początkowo 328 PASS / 1 FAIL środowiskowy | Test legacy wymaga `git show HEAD:index.html`, a kopia celowo nie ma `.git`. Nie jest to błąd witryny. |
| Powtórzenie `tests/legacy.test.js` z read-only `GIT_DIR` oryginału | 20 PASS / 0 FAIL | Po usunięciu ograniczenia odczytu historii wszystkie 329 przypadków pierwotnego zestawu mają potwierdzone przejście; nie wykonywano ponownie całej grupy. Log początkowej porażki zachowano. |
| Istniejące `test:e2e` | 26 PASS / 3 FAIL | Nieaktualne selektory, błędne oczekiwanie miejscowości, nieskuteczny mock awarii modułu — AUD-013. |
| Istniejące `test:e2e:additional` | 12 PASS / 1 FAIL | Nieaktualny selektor linku błędu; pozostałe m.in. 66 par kategorii przechodzą. |
| Istniejące `test:e2e:consent` | 12 PASS / 0 FAIL | Lokalna logika zgód, odmowa, cofnięcie, GPC, brak storage, awaria skryptu, higiena danych kontaktu; Google był mockowany. |
| Zewnętrzny skan sekretów | PASS w ograniczonej próbce | Przejrzano 92 pliki źródeł/testów/JSON; trafienie wzorca było fixture testowym, bez ujawnienia wartości. Nie skanowano całej historii Git ani serwera produkcyjnego. |

Nie zsumowano mechanicznie wszystkich suite do jednego procentu jakości: testy częściowo powtarzają te same zachowania, a niektóre dotykają strony głównej poza szczegółowym zakresem tego audytu.

### Funkcje, walidacja i scenariusze awaryjne

| Obszar / przypadek | Przeglądarki i zakres | Status | Wniosek |
|---|---|---|---|
| Wybór 12 kategorii i ujawnianie pól | Chromium + WebKit, lokalnie | PASS | Dodatkowo istniejące E2E sprawdziło 237 opcji; 66 par kategorii w dodatkowym zestawie. |
| Wszystkie 14 pozycji FAQ | Oba silniki, lokalnie | PASS | Rozwijanie i treść; brak deklaracji audytu czytnikiem ekranu. |
| Cele, dane kontaktu, pola aktywne/ukryte | Oba silniki, lokalnie | PASS dla wykonanych przypadków | Szkic i walidacja działają; błędne dane kierują do pola; nie wysyłano formularzy. |
| Liczby integracji: puste, 0, −1, 1.5, 1,5, 1000, 1e2 | Własne oraz istniejące testy, lokalnie | PASS według kontraktu pola | Opcjonalne puste wartości oddzielono od błędnego formatu; nie wszystkie liczby mają identyczny dozwolony zakres. |
| Kompletność dodatkowych ustawień i miejscowości | Odtworzona produkcja kontra lokalny build | FAIL produkcja / PASS lokalnie | AUD-001. Test na kopii plików zgodnych z publicznymi; nie na wysyłce produkcyjnej. |
| Ujemna liczba dodatkowych scen | Odtworzona produkcja kontra lokalnie | FAIL produkcja / PASS lokalnie | AUD-002. |
| Kopiowanie, odmowa schowka, edycja szkicu i jego unieważnienie | Istniejące E2E + własne próby | PASS dla wykonanych przypadków | Tekst pozostaje dostępny; dane użytkownika nie są wykonywane jako HTML. |
| Smart bez JavaScript | Oba silniki | PASS | Oferta, FAQ i kontakt pozostają dostępne. |
| Awaria importu modułu Smart | Istniejące E2E | UNVERIFIED | Mock nie objął URL z query string — nie uznawać za pozytywny test fallbacku. |
| Nawigacja, kotwice, obraz panelu i Escape | Oba silniki / Chromium dla pełnego Tab | PASS z wyjątkiem kolejności Tab | Własne testy kotwic bez brakujących celów; AUD-016 dotyczy otwartego menu. |
| Kolejność klawiatury WebKit | Automatyzacja headless | NOT TESTED w pełnym zakresie | Początkowy test skip-link zatrzymał się na polityce tabulacji linków WebKit; nie dowodzi błędu aplikacji. |
| Tab przy otwartym banerze cookies | Chromium 390 i 1440 | FAIL | Zasłonięte komponenty — AUD-010. |
| Tekst 200%, normalny viewport | Oba silniki, 390 i 1440 | FAIL desktop | 1830 px dokumentu przy 1440 px; AUD-011. Native zoom nie był testowany. |
| PV: Instalacja / Mining / Ekonomia, strzałki zakładek | Oba silniki | PASS dla wykonanych przypadków | Zmiana panelu i stanu aria; nie jest to badanie VoiceOver. |
| PV: ujemne / skrajne dane i niekompletne koszty | Oba silniki + jednostki | PASS z wyjątkiem pustych założeń | Ujemne/niespójne dane blokują aktualny wynik; brak kosztów blokuje zwrot. Puste wymagane założenia: AUD-005. |
| PV: wybór modelu i eksport po edycji pola | Oba silniki | FAIL | Pierwsze kliknięcie bywa tracone — AUD-004. Powtórne pobranie działa. |
| PV: kosztorys, brak ROI, model aktywny, customSpec | Oba silniki + silnik | PASS dla mechaniki wyniku | Parametry działają w wyniku; szkic gubi ilość/specyfikację — AUD-006. |
| PV: pełny CSV, zapis i odtworzenie | Oba silniki | PASS udanego importu / UNVERIFIED powtarzalność WebKit | `probes.json` potwierdza import w obu silnikach. W późniejszej sekwencji WebKit zwrócił błąd I/O — ograniczenie opisane poniżej. |
| PV: CSV → preset → reload | Oba silniki | FAIL | Dwa wyniki dla tych samych pól, źródło eksportu sprzeczne — AUD-003. |
| PV: suwak, zwijanie parametrów, limit czterech modeli, brak modeli | Oba silniki, 390 px | PASS | Suwak synchronizuje 20 kWp; piąty model nie zostaje wybrany; bez modeli widoczny komunikat zamiast wyniku. |
| PV: błędny CSV, usuń import, usuń wszystkie kopie, reset i przejście advanced → simple | Chromium, 390 px | PASS dla wykonanej sekwencji | Błędny CSV odrzucony, import usunięty, pola aktywne; wszystkie kopie usunięte, reset przywraca 10 kWp; przejście działa. `final-controls.json`. |
| PV: powyższa sekwencja kasowania/resetu po błędnym CSV | WebKit | NOT TESTED do końca | Kolejny import zatrzymał się na błędzie I/O i timeout; nie uznawano dalszych kroków za PASS. |
| PV: nieprawidłowy dataset rynku | Oba silniki | PASS | Stan błędu i możliwość ponowienia zamiast wiarygodnie wyglądających zer. |
| PV: długi polski szkic / mailto | Oba silniki | FAIL osłona URI | AUD-007. Dostarczenie wiadomości przez klienta poczty: NOT TESTED. |
| Fizyczny bilans PV, SOC, straty, różne baterie | Niezależne testy silnika, 12 scenariuszy | PASS w badanym zakresie | Wyjątek dodatkowego EMS: AUD-008; profil przestępny: AUD-009. |
| Backend produkcyjny, CRM, Turnstile, powiadomienia | Nie uruchamiano | NOT TESTED | Funkcja wyłączona / poza bezpiecznym zakresem. Jednostkowe testy backendu nie dowodzą gotowości usługi produkcyjnej. |
| Fizyczne ASIC, falownik, licznik, magazyn, bilans faz | Brak sprzętu | NOT TESTED | Symulacja nie weryfikuje kompatybilności urządzeń ani bezpieczeństwa elektrycznego. |

Plik `functional.json` jest surowym logiem pomocniczego harnessu: jego `PASS` oznacza zakończenie funkcji pomiarowej bez wyjątku, a zapisane wartości nadal wymagają oceny. Przykładowo zapisuje niepoprawną długość mailto lub kolejność Tab mimo technicznego zakończenia próby. Wiążąca interpretacja znajduje się w tabeli powyżej i przy problemach. Pierwotne timeouty nie zostały ukryte; reprodukcje w `probes.json` rozdzielają błędy aplikacji od ograniczeń testu.

**Dodatkowe ograniczenie WebKit CSV.** W końcowym teście sekwencji „brak modeli → wybór modelu → błędny CSV → poprawny CSV” WebKit zgłaszał `The I/O read operation failed`; poprawny plik nie ujawnił przycisku usunięcia w limicie 25 s. Wcześniejsze niezależne `probes.json` potwierdzają udany import i obliczenia na tym samym przykładzie. Przyczyna błędu I/O (automatyzacja przekazania pliku, WebKit lub aplikacja) pozostaje **UNVERIFIED**. Nie przypisano bez dowodu kolejnej usterki do kodu. Przed wydaniem trzeba powtórzyć tę dokładną sekwencję przez rzeczywisty wybór pliku w Safari/WebKit. Zachowano końcowy log oraz wcześniejsze `final-controls-harness-*.json`; pierwszy timeout usuwania zaznaczeń był błędem dynamicznego selektora harnessu, poprawionym wyłącznie w skrypcie poza repozytorium.

### PV Mining — niezależna kontrola modelu

**Jednostki i wzór wydobycia.** W badanych obliczeniach zachowano `W / 1000 = kW`, `kW × h = kWh`, `TH/s × 10^12 = H/s`, a `W / (TH/s) = J/TH`. Hashprice jest opisany w BTC/PH/d, nie USD. W niezależnej próbie ze stałym hashratem 100 TH/s, mocą 1 kW, trudnością `10^12`, nagrodą 3,125 BTC, pełnym rokiem 8760 h oraz wyłączonymi opłatami/rozruchem: `100e12 × 3600 × 8760 × 3.125 / (1e12 × 2^32)` daje 2,294545993208885 BTC, identycznie jak silnik; energia 8760 kWh. To sztuczny oracle sprawdzający przeliczniki, nie prognoza rentowności. Samo wydobycie i wypłaty poola pozostają probabilistyczne; odniesienie techniczne: [Bitcoin Developer Guide — Mining](https://developer.bitcoin.org/devguide/mining.html).

**Profil PV i zużycie.** Dostarczony profil to Wrocław 2023, południe, 35°, straty 14%, 8760 godzin, 1026,76881 kWh na 1 kWp. Roczne zużycie domu 5000 kWh ma syntetyczny rozkład. Oznacza to model sezonowości, lecz nie rzeczywisty profil dowolnego gospodarstwa. Inna lokalizacja jawnie korzysta z profilu zastępczego; znana roczna nadwyżka nie odtwarza samodzielnie godzin autokonsumpcji. Parametry orientacji i pogody są opisane jako ograniczenia. CSV obejmuje pełny rok UTC, interwały 15/30/60 minut i kW albo kWh; analiza jednostkowa obejmuje spójność oraz luki czasu. Granica mocy na poziomie godzinowym nie dowodzi bezpiecznej pracy przy sekundowej zmienności chmur.

**Magazyn i baseline.** W dwunastu kombinacjach `none/existing/new × home/economic × gridLimit 0/3` sprawdzono roczny bilans energii i ograniczenia SOC. Największa reszta arytmetyczna bilansu wyniosła `3,78 × 10^-10 kWh`, zgodna z błędem zmiennoprzecinkowym. Nowy magazyn jest porównywany także ze scenariuszem bez magazynu; obecny magazyn nie jest automatycznie przypisywany w całości do kosztu miningu. Silnik uwzględnia sprawność cyklu, moc ładowania/rozładowania i koszt zużycia. Dodatkowy EMS pozostaje osobną, potwierdzoną luką bilansu — AUD-008.

**Rynek i aktualność.** Snapshot ma datę `2026-10-24T19:43:09Z`: BTC/PLN 316 113,6182, trudność 140 577 680 051 919,6, wysokość bloku 972 966 i opłaty średnie 0,01398418 BTC/blok. W dniu audytu ma około trzech dni. UI ujawnia datę i brak automatycznej aktualizacji. Potwierdzono odczyt tych danych z plików; nie potwierdzano, że nadal odzwierciedlają rynek w chwili późniejszego użycia raportu. Stare dane nie powinny być przedstawiane jako kurs na żywo.

**Energia i rozliczenie.** Miesięczne RCEm 2025 w danych odpowiadały opublikowanym wartościom PSE po korektach: 480,01; 442,02; 178,84; 163,19; 216,97; 136,30; 284,83; 214,68; 279,71; 330,27; 382,88; 466,08 zł/MWh. Przeliczenie do zł/kWh wymaga dzielenia przez 1000. Źródło: [PSE — rynkowa miesięczna cena energii](https://www.pse.pl/oire/rcem-rynkowa-miesieczna-cena-energii-elektrycznej). Model ma miesięczny ledger FIFO, okres dostępności depozytu, ograniczenie zwrotu i koszt alternatywny oddania energii. RCE w UI jest opisane jako uproszczony scenariusz; nie ma rzeczywistego szeregu cen godzinowych ani pełnej faktury. Zgodności całego modelu z konkretną umową prosumenta, podatkami i obowiązującą kwalifikacją prawną nie certyfikowano.

**ASIC i niepewność.** Katalog siedmiu modeli rozdziela TH/s, pobór z gniazda i J/TH. Ceny, chłodzenie, warunki importu i kompatybilność są oznaczone jako wymagające potwierdzenia. Własny pobór i hashrate zmieniają obliczenia; nie dowodzą istnienia stabilnego profilu firmware. Domyślnie model przyjmuje m.in. pool fee 2%, firmware fee 2,5%, dostępność hashowania 98%, dodatkowe chłodzenie 30 W, rozruch 9 minut, bufor startu 200 W i ograniczenia czasu pracy. Wpływ temperatury, rzeczywistego taktowania oraz trwałości urządzeń nie był mierzony. Domyślne zero importu dla ASIC jest istotne i nie powinno być niejawnie zmieniane.

**ROI i gotówka.** Silnik rozróżnia gromadzenie BTC, sprzedaż, NPV i gotówkowy zwrot, przyjmuje koniec życia ASIC i nie dodaje automatycznie wartości rezydualnej. Brak pełnego kosztorysu blokuje podawanie zwrotu. Domyślna projekcja używa 15% wzrostu trudności rocznie, stałej ceny BTC, pięciu lat pracy ASIC i dziesięciu lat analizy; są to założenia, nie prognozy. Po celowym przyjęciu dodatkowego budżetu 5000 zł, dla 10 kWp, domu 5000 kWh i S21 151 TH/s test uzyskał: PV 10 267,688 kWh, energia ASIC 1926,512 kWh, 721 h pracy, 0,00169712 BTC, roczna korzyść około 98,01 zł, CAPEX 11 590 zł, NPV około −12 967,21 zł, brak zwrotu. Prosty iloraz rocznej korzyści do CAPEX wynosi około 0,846%. Ten wynik potwierdza, że model potrafi pokazać nieopłacalność; jest zależny od wskazanych założeń i wykrytych luk.

Nie potwierdzono błędu polegającego na utożsamieniu kW z kWh, dodawaniu pełnej wartości magazynu do przychodu miningu ani gwarantowaniu zysku. Potwierdzone nieprawidłowości opisano w AUD-003–AUD-009 zamiast przypisywać aplikacji typowe błędy bez dowodów.

### Wydajność i Core Web Vitals

Lighthouse **13.5.0**, Chrome **156.0.8078.48**, uruchomienia 27.10.2026 około 15:37 UTC, zimna nawigacja. Mobile: viewport 412×823, DPR 1,75, symulacja RTT 150 ms i 1638,4 kb/s, CPU ×4. Desktop: 1440×900, DPR 1, RTT 40 ms, 10 240 kb/s, CPU ×1. Są to ustawienia symulacji Lighthouse; nie pomiar na fizycznym telefonie. UA mobile w raporcie Lighthouse wskazuje jego standardowy profil Moto G Power / Chrome 136; nie należy mylić go z rzeczywistą wersją uruchomionego Chrome. Lokalne pliki serwowano prostym HTTP bez produkcyjnego cache i kompresji. Zewnętrzną analitykę zablokowano. Pomiar strony publicznej obejmuje rzeczywisty HTTPS i inny artefakt.

| Strona / profil | Performance | Accessibility | Best Practices | SEO | LCP | CLS | TBT | Zarejestrowany transfer |
|---|---:|---:|---:|---:|---:|---:|---:|---:|
| Smart lokalny / mobile | 94 | 100 | 100 | 100 | 2,780 s | 0,000 | 0 ms | 685 435 B |
| Smart lokalny / desktop | 100 | 100 | 100 | 100 | 0,604 s | 0,000 | 0 ms | 685 435 B |
| PV simple / mobile | 73 | 100 | 96 | 50 | 4,054 s | 0,218 | 0 ms | 541 237 B |
| PV advanced / mobile | 92 | 100 | 96 | 50 | 2,404 s | 0,110 | 0 ms | 540 837 B |
| Smart publiczny / mobile | 94 | 100 | 100 | 100 | 2,425 s | 0,000 | 0 ms | 154 242 B |

Dwa dodatkowe, osobne powtórzenia PV simple dały Performance 73/73, LCP 4,054/4,054 s oraz CLS 0,223/0,218. Mediana trzech pomiarów: Performance 73, LCP około 4,054 s, CLS około 0,218. Potwierdzają przesunięcie stopki podczas montowania aplikacji i dodatkową zmianę geometrii fontów — AUD-012. Pliki `lh-*.html/json` zachowują pełne ustawienia i diagnostykę. Niewielki rozrzut w tych warunkach nie gwarantuje identycznych wyników u klientów.

Wynik SEO 50 dla PV wynika z zamierzonego `noindex` i braku metadescription w prywatnym prototypie; nie jest dowodem uszkodzonego SEO publicznej witryny. Best Practices 96 ma związek z favicon 404. Transfer publiczny i lokalny nie jest miarą regresji jeden do jednego: różnią się wersja, serwer, kompresja i moment ładowania zasobów.

**INP: NOT TESTED. TBT nie jest INP.** Brak terenowych p75 LCP/CLS/INP z CrUX/GSC. Próba odczytu przez dostępne narzędzie GSC Wizard zwróciła `payment_required`; nie aktywowano płatnej usługi ani próbnego planu. Wymagania „dobrych” CWV odnoszą się do 75. percentyla rzeczywistych wizyt: LCP ≤2,5 s, CLS ≤0,1, INP ≤200 ms; pojedynczy Lighthouse tego nie potwierdza. Źródło: [web.dev — Web Vitals](https://web.dev/articles/vitals).

Optymalizacja obrazu panelu to konkretna szansa: `smart-panel.png` ma 434 604 B, 1835×937 px, brak responsywnego `srcset`. Lighthouse oszacował do 388 KiB potencjalnej redukcji na mobile. To estymacja narzędzia, nie wykonana optymalizacja. Źródła fontów są lokalne; zależności ładowania CSS/fontów i niewykorzystany kod PV wymagają profilowania przed mechanicznym przenoszeniem wszystkiego do jednego bundla.

### SEO, dostępność, bezpieczeństwo i prywatność

| Obszar | Wynik i granica wniosku |
|---|---|
| Title, description, canonical Smart Home | PASS w analizowanych dokumentach. Canonical wskazuje właściwą podstronę; publiczny wariant nie ma przypadkowego noindex. |
| H1 i semantyka | Jeden H1 w każdym badanym widoku. Obecne landmarks, etykiety, nagłówki sekcji, FAQ na details/summary i tablist w PV. Ocena nie zastępuje pełnego testu z czytnikiem. |
| Sitemap, robots, dane strukturalne | Sprawdzono pobrane robots/sitemap oraz WebPage/Service/BreadcrumbList. Brak potwierdzonego błędu w tym zakresie. Nie sprawdzono faktycznego stanu indeksowania w koncie Search Console. |
| Linkowanie wewnętrzne | Wejście ze strony głównej i linki/kotwice Smart Home sprawdzone. Nie wykonano pełnego crawl całej domeny i wszystkich zewnętrznych ofert ASIC. |
| Axe WCAG 2/2.1/2.2 AA | 12 lokalnych skanów (375 i 1440, trzy widoki, dwa silniki), 4 publiczne (390/1440), 2 rozszerzone Smart Home: zero raportowanych violations. Wystąpiły `incomplete`, m.in. kontrast/ARIA, wymagające manualnej oceny. Nie jest to certyfikat WCAG. |
| Kontrast | Istniejące testy wyrenderowanego tekstu w dwóch motywach przechodzą. Nie uznano wszystkich stanów wykresów, tekstu na obrazach i `incomplete` axe za potwierdzone AA. |
| Fokus i powiększenie | Potwierdzone wyjątki AUD-010, AUD-011, AUD-016. Brak testu rzeczywistego VoiceOver/NVDA, systemowych wysokich kontrastów, natywnego text zoom i wszystkich gestów dotykowych. |
| XSS i treść użytkownika | Lokalny kontrolowany marker pozostał tekstem; stosowane escaping/textContent i kodowanie mailto. Nie wykryto skutecznej ścieżki XSS w badanych formularzach; nie przeprowadzano ataku na produkcję. |
| CSP | Lokalny build i kontrola hashy PASS; produkcja nie ma tej ochrony — AUD-015. CSP nie zastępuje walidacji. |
| Dane formularza i CSV | Smart Home przygotowuje treść lokalnie. PV przechowuje stan karty w sessionStorage, profil w IndexedDB z polityką 24 h od zapisu; czyszczenie wygasłych kopii następuje przy następnym otwarciu. To nie zdalne automatyczne usunięcie dokładnie po 24 h. |
| Zgoda i analityka | Lokalny moduł przeszedł 12 testów z mockiem. Publiczna wersja używa innego kodu i inicjuje zasób Cloudflare; żądanie zostało zablokowane. Nie ustalono całego zakresu danych, podstawy przetwarzania ani zgodności prawnej telemetrii; UNVERIFIED. |
| Backend i sekrety | Publiczny build nie zawiera źródeł backendu. Ograniczony skan sekretów bez rzeczywistego trafienia. CSRF, rate limiting, konfiguracja produkcyjnego serwera, uprawnienia panelu i ochrona sekretów poza repo: NOT TESTED. |
| Zależności | Brak runtime dependencies w package.json ogranicza powierzchnię łańcucha dostaw. Nie oznacza bezpieczeństwa wszystkich backendów i narzędzi QA. Narzędzia E2E zależą od środowiska — potrzebna powtarzalna konfiguracja QA. |

### Architektura — wynik analizy

Podział publicznego artefaktu, backendu i eksperymentu PV jest wartościowy. Logika Smart Home ma odrębny model i konfiguracje; PV ma oddzielony silnik, Worker i warstwę danych. Dzięki temu możliwe były niezależne testy wzoru wydobycia i bilansu bez przeglądarki. Worker ogranicza blokowanie głównego wątku.

Największe ryzyko dalszego rozwoju leży w sposobie synchronizacji. `pv-mining/app.js` ma około 54,5 kB w zaledwie 180 liniach, wiele długich szablonów HTML i współzależnych zmiennych: `raw`, `imported`, `activeModel`, `serial`, `csvSerial`, `dirty`, `lastResult`, `draftStale`. AUD-003 i AUD-004 są konkretnymi skutkami rozproszonych aktualizacji. Osobno waliduje się ograniczenia pól, normalizację silnika i dane sesji. Duże jednoliniowe funkcje utrudniają przegląd zmian oraz precyzyjne testy. Nie jest konieczna migracja frameworka; najpierw należy ustalić kontrakty i zabezpieczyć zachowanie testami.

## CZĘŚĆ III — Pełna lista problemów

Priorytety: **P0** krytyczny; **P1** wysoki; **P2** średni; **P3** niski. Kolejność poniżej jest według priorytetu, identyfikatory pozostają stabilne. Każdy punkt ma kategorię, lokalizację, reprodukcję, dowód, oczekiwany wynik, propozycję i kryteria odbioru. Ścieżki bez prefiksu odnoszą się do audytowanego checkoutu; nazwy JSON/PNG/log do [katalogu dowodów](/Users/jb/outputs/ampower-audyt-2026-10-27-niezalezny/evidence).

### AUD-001 — Produkcyjny szkic zapytania gubi ustawienia projektu i miejscowość

**Kategoria:** Funkcjonalność / kompletność zapytania  
**Priorytet:** P1  
**Status i zakres:** FAIL — wersja produkcyjna; lokalna poprawka działa.  
**Lokalizacja:** Produkcja `06a7902`: `smart-home-energy/model.js:110–144` (`buildInquiry`, `inquiryText`), `app.js:121` (`renderSummary`). Lokalny odpowiednik: `model.js:16–23,117–161`, `app.js:135`.

**Obecne zachowanie:** Formularz zbiera radio Zigbee, warunki instalacji, złożoność, liczby automatyzacji i wsparcie, lecz produkcyjny szkic nie przenosi tych pól. Dla realizacji zdalnej usuwa również wprowadzoną miejscowość. Firma otrzymuje niepełny zakres, chociaż użytkownik go podał.

**Odtworzenie:** Na izolowanej kopii produkcji wybierz Oświetlenie i cel „jedna aplikacja”; otwórz ustawienia domu; ustaw SONOFF ZBDongle-E, 3 proste i 2 zaawansowane automatyzacje, rozszerzone wsparcie, Wrocław i realizację zdalną; podaj syntetyczny e-mail; przygotuj podgląd wiadomości. Porównaj z polami.

**Dowód:** `production-comparison.json`: produkcyjna treść nie zawiera podanych ustawień ani Wrocławia; lokalna zawiera wszystkie. Bajty produkcyjnych HTML, app.js i model.js potwierdzono przez HTTPS jako identyczne z `origin/main`. Test interakcji wykonano lokalnie na tej kopii; niczego nie wysłano.

**Oczekiwane zachowanie:** Wiadomość i podsumowanie zawierają wszystkie aktywne, świadomie udzielone odpowiedzi.

**Rekomendacja naprawy:** Przenieść już istniejącą lokalną obsługę `PROJECT_FIELDS` i `projectLines` wraz z zachowaniem miejscowości do przyszłego artefaktu wydania. Nie naprawiać tego drugi raz w odrębnej implementacji. Nie publikować całego repozytorium.

**Kryteria akceptacji:** Test porównuje każde z sześciu pól projektu oraz miejscowość z podglądem i zdekodowanym `mailto.body`; obejmuje lokalnie, zdalnie i „nie wiem”. Po przyszłej publikacji kontrola wersji plików i test przygotowania szkicu bez wysyłki.

**Zależności:** AUD-002 i AUD-013; wydanie artefaktu dopiero po osobnym upoważnieniu do publikacji.

### AUD-003 — Zmiana przykładowej instalacji po CSV pozostawia stary profil w Workerze

**Kategoria:** PV Mining / integralność obliczeń  
**Priorytet:** P1  
**Status i zakres:** FAIL — Chromium i WebKit, lokalny PV.  
**Lokalizacja:** `pv-mining/app.js:45` (przyciski `data-preset`), `47,64–67,99–106`; `pv-mining/worker.js:2,11–12`.

**Obecne zachowanie:** Preset zeruje `imported` w głównym wątku, lecz nie przesyła `{type:"profile", imported:null}` do istniejącego Workera. Pola znowu są edytowalne, a silnik nadal używa CSV. Etykieta importu pozostaje aktywna. Eksport może deklarować PVGIS w `profileSource`, podczas gdy `results.source` pochodzi z CSV. Odświeżenie strony zmienia wynik dla tych samych widocznych ustawień.

**Odtworzenie:** W advanced pobierz i zaimportuj pełny przykład CSV. Poczekaj na wynik; wybierz S21 Pro i preset 20 kWp + 20 kWh. Zapisz produkcję i energię ASIC. Odśwież stronę bez zmiany pól.

**Dowód:** `probes.json`, oba silniki: przed odświeżeniem PV 10 268 kWh i ASIC 2627 kWh; po odświeżeniu PV 20 535 kWh i ASIC 5328 kWh. Pole PV pokazuje 20 i jest aktywne już przed odświeżeniem. `chromium-preset-summary.png`, `webkit-preset-summary.png`, eksporty `*-export-2.json`.

**Oczekiwane zachowanie:** Źródło profilu, obliczenia, stan formularza, komunikat i eksport muszą opisywać ten sam scenariusz.

**Rekomendacja naprawy:** Wydzielić jedną operację zmiany/usunięcia profilu: unieważnić import w toku, wyczyścić stan UI i zapis, przekazać nowy profil do Workera albo odtworzyć Worker, następnie obliczyć nową rewizję. Odrzucać opóźnione odpowiedzi CSV po wyborze presetu.

**Kryteria akceptacji:** Po CSV każdy preset daje ten sam wynik przed i po reload oraz po przejściu A/B; źródło wyniku i eksportu = simulation/PVGIS. Przypadek CSV wczytywany równocześnie z wyborem presetu nie przywraca starego importu.

**Zależności:** AUD-004; wspólna rewizja stanu głównego wątku, Workera i eksportu.

### AUD-002 — Produkcja akceptuje błędne liczby dodatkowych automatyzacji

**Kategoria:** Walidacja Smart Home  
**Priorytet:** P2  
**Status i zakres:** FAIL — produkcja; lokalny kod już odrzuca błędne dane.  
**Lokalizacja:** Produkcja `06a7902`: `smart-home-energy/model.js:73–90` (`validate`) i `170` (`validateSubmission`); lokalnie `model.js:12–15,100`.

**Obecne zachowanie:** Walidacja liczb scen istnieje tylko w ścieżce wysyłki backendowej, która jest wyłączona. Aktywne przygotowanie szkicu przyjmuje np. −1 lub ułamek bez oznaczenia błędu. Pola i tak wypadają z produkcyjnego szkicu, co maskuje problem.

**Odtworzenie:** W poprawnie wypełnionym szkicu rozwiń ustawienia domu, wpisz `-1` w proste automatyzacje, następnie „Przygotuj wiadomość”. Analogicznie 1.5 i tekst.

**Dowód:** `production-comparison.json`: `invalidScenes:null`, `errorVisible:false` dla produkcji; lokalnie `aria-invalid:true` i widoczne podsumowanie błędów. Statycznie produkcyjne `validateSubmission` nie jest wykonywane przy wyłączonym endpointcie.

**Oczekiwane zachowanie:** Jednakowa walidacja 0–999 w szkicu i w przyszłej wysyłce; puste pole jawnie oznacza brak wiedzy.

**Rekomendacja naprawy:** Włączyć do przyszłego wydania istniejący lokalny `parseScenes` używany przez `validate`. Zachować błędny wpis do korekty oraz odnośnik do konkretnego pola.

**Kryteria akceptacji:** Puste, 0, 1, 999 przechodzą; −1, ułamki, zapis wykładniczy i tekst są odrzucane; podgląd nie powstaje z błędną wartością. Zmiana liczby unieważnia wcześniejszy szkic.

**Zależności:** AUD-001; bez uruchamiania backendu ani cennika.

### AUD-004 — Pierwsze kliknięcie akcji po edycji liczby bywa pomijane

**Kategoria:** PV Mining / zdarzenia i UX  
**Priorytet:** P2  
**Status i zakres:** FAIL — Chromium i WebKit.  
**Lokalizacja:** `pv-mining/app.js:41–42,49,83,87,144` (`input`, `schedule`, obsługa porównania i eksportu).

**Obecne zachowanie:** To samo pole jest obsługiwane przez `input` i późniejsze `change` przy utracie fokusu. Drugie zdarzenie ponownie ustawia `dirty`, uruchamia obliczenia i wyłącza akcje przed obsłużeniem kliknięcia. Pierwszy wybór koparki lub pobranie analizy nie działa, choć wcześniej widniał gotowy wynik.

**Odtworzenie:** W advanced zmień moc PV w polu liczbowym, poczekaj na zakończenie obliczeń, pozostaw fokus w polu i kliknij „Pobierz analizę” albo kartę S21 Pro. Poczekaj i powtórz kliknięcie.

**Dowód:** `probes.json`: pobrania po pierwszym kliknięciu 0, po drugim 1; wybrany model po pierwszym kliknięciu s21-151, po drugim s21-pro. Obie przeglądarki. Pierwotne timeouty w `functional.json` odtworzono i wyjaśniono tym błędem.

**Oczekiwane zachowanie:** Jedno kliknięcie po ukończonej zmianie wykonuje akcję dokładnie raz dla aktualnych danych.

**Rekomendacja naprawy:** Nie przeliczać niezmienionej wartości na blur. Rozdzielić obsługę typów pól albo porównywać znormalizowaną rewizję wejścia przed `schedule`. Zachować blokadę rzeczywiście nieaktualnego eksportu.

**Kryteria akceptacji:** W obu silnikach po zmianie liczby i bez dodatkowego blur pierwsze kliknięcie pobiera jeden plik, wybiera właściwy model i przygotowuje szkic właściwego modelu. Brak podwójnego przeliczania tej samej rewizji.

**Zależności:** Wspólny mechanizm rewizji z AUD-003.

### AUD-005 — Puste wymagane założenia PV są potajemnie zastępowane wartościami domyślnymi

**Kategoria:** PV Mining / walidacja i wiarygodność  
**Priorytet:** P2  
**Status i zakres:** FAIL — UI i silnik.  
**Lokalizacja:** `pv-mining/app.js:15–18,109–118`; `pv-mining/engine.js:14–44,344` (`finite`, `normalize`).

**Obecne zachowanie:** Puste pole mocy PV przechodzi HTML validity; normalizacja przyjmuje 10 kWp. Interfejs nadal pokazuje puste pole, a wynik 10 268 kWh. Podobnie puste ceny lub trudność wracają do domyślnych wartości/snapshotu bez komunikatu przy polu. Tylko puste roczne zużycie ma osobną notę założenia.

**Odtworzenie:** W advanced usuń całą wartość mocy PV i poczekaj. Sprawdź produkcję oraz noty. Powtórz dla ceny importu, BTC i trudności; odróżnij je od pól opisanych „opcjonalnie”.

**Dowód:** `probes.json`: puste `pvKwp`, produkcja 10 268 kWh, brak noty o przyjęciu 10 kWp. `engine-probes.json`: puste importPrice→1, btcPrice→316113.6182181032, difficulty→140577680051919.6, quantity→1.

**Oczekiwane zachowanie:** Użytkownik widzi faktycznie używaną wartość lub błąd blokujący wynik; brak danych nie jest ukrytym założeniem.

**Rekomendacja naprawy:** Zdefiniować schemat pól wymaganych i opcjonalnych. Dla wymaganych blokować obliczenia i eksport przy pustym wpisie albo jawnie przywracać wartość z komunikatem. Odróżnić świadome 0 od braku wartości.

**Kryteria akceptacji:** Każde wymagane pole ma test pustej wartości; brak ukrytej różnicy między formularzem, `settings`, szkicem i eksportem. Puste koszty nadal blokują ROI, a jawne zero pozostaje dozwolone tam, gdzie ma sens.

**Zależności:** AUD-004; nie zmieniać zasad opcjonalnej produkcji, nadwyżki i hashprice bez testów.

### AUD-006 — Zapytanie PV pomija liczbę koparek i nadpisane parametry urządzenia

**Kategoria:** PV Mining / przekazanie zakresu do wyceny  
**Priorytet:** P2  
**Status i zakres:** FAIL — Chromium i WebKit.  
**Lokalizacja:** `pv-mining/app.js:149–170` (`prepareInquiry`), szczególnie 163; `engine.js:283–287`.

**Obecne zachowanie:** Symulacja może dotyczyć trzech koparek po 150 TH/s i 2500 W, ale szkic zawiera tylko „Antminer S21 151 TH/s”, czyli katalogową nazwę wariantu. Nie zawiera liczby sztuk ani rzeczywistych parametrów użytych w obliczeniach.

**Odtworzenie:** W zakładce Mining ustaw quantity=3, własny hashrate S21=150 i pobór=2500. Opuść pole, poczekaj na wynik i przygotuj zapytanie. Porównaj kartę oraz szkic.

**Dowód:** `extra-probes.json`: karta 150 TH/s · 2,50 kW; koszt 3 urządzeń 19 770 zł; szkic „Antminer S21 151 TH/s”, bez liczby sztuk. Dowód w obu silnikach.

**Oczekiwane zachowanie:** Szkic zachowuje parametry istotne dla zaprojektowania zasilania, chłodzenia i kosztorysu.

**Rekomendacja naprawy:** Generować podsumowanie z `lastResult.settings` i wybranego `result.model`, podając ilość, TH/s i W na sztukę, sumaryczny pobór oraz oznaczenie własnych założeń. Dodać podstawowe wymagania magazynu, limit importu i wskazanie profilu; nie dołączać automatycznie prywatnego CSV.

**Kryteria akceptacji:** Dla 1 i 3 sztuk, katalogu i customSpec treść odpowiada aktualnemu wynikowi; po zmianie modelu stary szkic jest unieważniany; dopiski użytkownika są zachowane.

**Zależności:** AUD-003 i AUD-004.

### AUD-007 — Limit mailto w PV sprawdza liczbę znaków treści zamiast długości gotowego URI

**Kategoria:** PV Mining / niezawodność kontaktu  
**Priorytet:** P2  
**Status i zakres:** FAIL — potwierdzona luka limitu; uruchomienie klienta pocztowego NOT TESTED.  
**Lokalizacja:** `pv-mining/app.js:147–148` (`mailHref`, `updateMailLink`); prawidłowy wzorzec w `smart-home-energy/model.js:165–175`.

**Obecne zachowanie:** Warunek `text.length > 7000` nie uwzględnia percent-encoding. Krótka polska wiadomość może wytworzyć znacznie dłuższy adres mailto i nadal udostępniać przycisk. Nie ma jednego uniwersalnego limitu klientów; problemem jest nieskuteczność własnej osłony transportu.

**Odtworzenie:** Przygotuj szkic PV i dopisz 2000 liter „ą”. Odczytaj długość treści i `href` przycisku pocztowego, bez klikania go.

**Dowód:** `functional.json`: 2529 znaków treści → URI długości 12 944, link pozostaje aktywny. Obie przeglądarki. Smart Home już liczy długość zakodowanego URI.

**Oczekiwane zachowanie:** Limit transportowy jest sprawdzany po utworzeniu całego adresu, a pełna treść zawsze pozostaje do kopiowania.

**Rekomendacja naprawy:** Zbudować URI w try/catch, sprawdzić jego długość według jawnej polityki transportowej wspólnej dla obu modułów; po przekroczeniu wyłączyć tylko link, udostępnić kopiowanie i czytelny komunikat.

**Kryteria akceptacji:** Testy ASCII, polskich znaków, emoji i niepełnego UTF-16. Długość zakodowanego URI przekraczająca przyjęty limit zawsze uruchamia fallback; bez obcinania danych i bez automatycznego wysyłania.

**Zależności:** Możliwe współdzielenie czystej funkcji z istniejącym `emailDraft`, bez łączenia całych aplikacji.

### AUD-008 — Pobór EMS jest kosztem finansowym, lecz znika z bilansu fizycznego

**Kategoria:** PV Mining / model energii i kosztów  
**Priorytet:** P2  
**Status i zakres:** FAIL — niezależny przypadek obliczeniowy.  
**Lokalizacja:** `pv-mining/engine.js:190–242` (`dispatch`), `306` (`opex`); `app.js:34` pole `emsWatts`.

**Obecne zachowanie:** EMS jest doliczany jako `W/1000 × godziny × cena importu`, ale nie powiększa obciążenia, importu, wykorzystania PV ani magazynu. W przypadku pracy na granicy nadwyżki model przydziela ASIC energię bez odjęcia EMS; nalicza zarazem opłatę za import, którego fizyczny licznik nie pokazuje.

**Odtworzenie:** Użyj syntetycznego pełnego roku CSV: PV stale 1 kW, dom 0, ASIC 1 kW, rozruch i pozostałe straty 0, korzystne wydobycie, brak magazynu i importu ASIC. Porównaj emsWatts=0 i 200.

**Dowód:** `engine-probes.json`: oba warianty pokazują PV=8760 kWh, ASIC=8760 kWh i grid=0; przy EMS 200 W OPEX rośnie o 1752 zł. Energia 1752 kWh zużyta przez EMS nie pojawia się w bilansie. To nie błąd samego przelicznika W→kWh.

**Oczekiwane zachowanie:** Bilans i rachunek obejmują tę samą energię pomocniczą, a pochodzenie energii EMS jest jawne.

**Rekomendacja naprawy:** Włączyć dodatkowy EMS jako obciążenie interwałowe scenariusza inwestycji, rozliczane z PV/baterii/sieci. Zachować baseline bez dodatkowego EMS. Usunąć osobny koszt dublujący energię rozliczoną w ledgerze. Ustalić zachowanie po zakończeniu życia ASIC, szczególnie z nowym magazynem.

**Kryteria akceptacji:** Dla próby 200 W dodatkowe 1752 kWh ma wskazane źródło i wpływa na bilans oraz rachunek; nie ma podwójnego kosztu. Testy z PV, siecią, istniejącym EMS, nowym magazynem i po wyłączeniu ASIC.

**Zależności:** Zmiana ekonomii wymaga ponownego uruchomienia całego zestawu PV i kontroli baseline/combinedBenefit; po AUD-003.

### AUD-009 — Profil PVGIS roku przestępnego ma błędną deklarację liczby godzin

**Kategoria:** PV Mining / dane i przyszła rozbudowa  
**Priorytet:** P2  
**Status i zakres:** FAIL — test silnika; obecny profil 2023 nie jest dotknięty.  
**Lokalizacja:** `pv-mining/data-loader.js:19–21`; `pv-mining/engine.js:92–122,138,306`.

**Obecne zachowanie:** Walidator dopuszcza 8784 rekordy roku przestępnego, lecz `makeProfile` zwraca zawsze `hours:8760`. Wynik ma więc 8784 interwały i deklaruje 8760 godzin. Liczba ta wpływa na przesunięcie lat i koszt stałego EMS. Import CSV ma własną poprawną liczbę godzin.

**Odtworzenie:** Przekaż do `makeProfile` poprawne 8784 godzinowe rekordy 2024 roku i ustawienia z `normalize`. Porównaj rows.length, sumę dt i hours.

**Dowód:** `engine-probes.json`: rows=8784, sumDt=8784, hours=8760. Oddzielne testy CSV roku przestępnego przechodzą.

**Oczekiwane zachowanie:** Metadata długości profilu jest wyliczana z rzeczywistych interwałów.

**Rekomendacja naprawy:** Wyliczać `hours` z danych i stosować spójny model lat referencyjnych; nie deklarować rzeczywistego kalendarza, jeżeli jest powtarzana pogoda. Dodać test obu ścieżek danych: bundled i CSV.

**Kryteria akceptacji:** 8760 i 8784 dają hours=sum(dt); nie ma nakładających się przesunięć, a koszt godzinowy odpowiada liczbie interwałów. Wyniki dla obecnego profilu 2023 pozostają zgodne poza celowymi zmianami AUD-008.

**Zależności:** AUD-008; test regresji dla przyszłego adaptera PVGIS.

### AUD-010 — Baner cookies zasłania elementy mające fokus klawiatury

**Kategoria:** Dostępność WCAG 2.2 AA / 2.4.11  
**Priorytet:** P2  
**Status i zakres:** FAIL — lokalny Smart Home, Chromium; produkcja używa innego modułu analityki.  
**Lokalizacja:** `assets/consent.css:2`; `assets/consent.js:16–24,61–73`; `smart-home-energy/style.css:22,36–39`.

**Obecne zachowanie:** Baner jest stałą nakładką na dole i nie rezerwuje miejsca. Przy pierwszym wejściu Tab przechodzi przez stronę za banerem. Część pól wyboru i akcji znajduje się całkowicie pod nakładką. Skan axe tego nie wykrył.

**Odtworzenie:** Nowy kontekst bez zapisanego wyboru, 390×844; nie zamykaj banera; przechodź Tab. Pole category-boiler przy kroku 12 i category-pv przy kroku 14 trafiają pod baner. Powtórz desktop 1440×844.

**Dowód:** `keyboard.json`: rect i elementy pokrywające fokus; m.in. checkbox PV y≈686, banner nad nim. `focus-covered-390.png`, `focus-covered-1440.png`. Sam zarys outline CTA może wystawać; dowodem pełnego zasłonięcia są także całe prostokąty checkboxów.

**Oczekiwane zachowanie:** Żaden komponent otrzymujący fokus nie jest całkowicie ukryty przez zawartość autora strony.

**Rekomendacja naprawy:** Zastosować układ rezerwujący miejsce na aktualną wysokość banera i przewijanie uwzględniające nakładkę albo prawidłowo zarządzany, dostępny dialog z jasną odmową. Nie maskować problemu usunięciem fokusu i nie wymuszać zgody na analitykę.

**Kryteria akceptacji:** Przejście Tab i Shift+Tab przez stronę przy otwartym banerze: każdy aktywny komponent widoczny w 375/390/430/1440, także przy dużym tekście. Odmowa, Escape i powrót fokusu działają; brak żądań Google przed zgodą.

**Zależności:** AUD-011; wymaganie W3C [Focus Not Obscured](https://www.w3.org/WAI/WCAG22/Understanding/focus-not-obscured-minimum).

### AUD-011 — Nawigacja desktopowa przepełnia stronę przy powiększeniu tekstu

**Kategoria:** Dostępność / odporność układu  
**Priorytet:** P2  
**Status i zakres:** FAIL — symulacja tekstu 200%; natywny zoom NOT TESTED.  
**Lokalizacja:** `smart-home-energy/style.css:140–146` (`flex-wrap:nowrap`, `white-space:nowrap`, stały breakpoint menu).

**Obecne zachowanie:** Przy dwukrotnym zwiększeniu rozmiaru tekstu i viewport 1440 px dokument rozszerza się do 1830 px. Linki końcowe i telefon wychodzą poza ekran. Zwykły reflow na wszystkich wymaganych szerokościach przechodzi.

**Odtworzenie:** Otwórz Smart Home 1440×900, poczekaj na fonty. W narzędziu QA podwój computed font-size każdego elementu, pozostawiając wymiary okna. Sprawdź documentElement.scrollWidth i nagłówek.

**Dowód:** `text200-detail.json`: oba silniki width=1440, scroll=1830; nav-links right≈1693,6, telefon right≈1829,8. `chromium-text200-1440.png`, `webkit-text200-1440.png`. WebKit mobile dodatkowo zwrócił 541 px bez wskazanego wystającego DOM — ta przyczyna pozostaje UNVERIFIED, nie jest podstawą osobnego zarzutu.

**Oczekiwane zachowanie:** Nawigacja dopasowuje się do dostępnego miejsca przy większym tekście, bez utraty linków i poziomego scrolla całej strony.

**Rekomendacja naprawy:** Uzależnić przełączenie/układ nawigacji od dostępnej przestrzeni i rozmiaru treści; dopuścić zawijanie lub wcześniej użyć menu zwijanego. Zweryfikować prawdziwe powiększenie tekstu i zoom w przeglądarce przed deklaracją WCAG.

**Kryteria akceptacji:** Brak przepełnienia w dokładnie odtworzonym teście 200%; komplet linków osiągalny klawiaturą. Osobno native text zoom 200% i reflow przy 320 CSS px, udokumentowane bez utożsamiania emulacji z testem natywnym.

**Zależności:** AUD-010, AUD-016; temat WCAG 1.4.4/1.4.10 do odbioru manualnego.

### AUD-012 — Start PV Mining powoduje przesunięcia układu i opóźnia pierwszy ekran

**Kategoria:** Wydajność / CLS i LCP  
**Priorytet:** P2  
**Status i zakres:** FAIL — pomiar laboratoryjny; bez danych CrUX.  
**Lokalizacja:** `pv-mining/simple.html:1`, `advanced.html:1` (`#app`); `app.js:35–38,173–179` (async load/boot); `style.css:1` (import fontów).

**Obecne zachowanie:** Początkowy krótki kontener jest po pobraniu JSON zastępowany całą aplikacją; widoczna wcześniej stopka przesuwa się daleko w dół. Fonty dodatkowo zmieniają geometrię. W pierwszym pomiarze simple: CLS 0,218 i LCP 4,05 s; advanced: CLS 0,110.

**Odtworzenie:** Zimne wejście na simple/advanced w Lighthouse mobile, parametry jak w części II; odczytaj layout-shifts i filmstrip, bez interakcji.

**Dowód:** `lh-pv-simple-mobile.json`: przesunięcie footer 0,181 plus 0,0368 związane z fontami. `lh-pv-advanced-mobile.json`: footer 0,1094. Raporty HTML oraz dodatkowe powtórzenia simple w `lh-confirm.json`.

**Oczekiwane zachowanie:** Stabilny pierwszy ekran i miejsce zarezerwowane na aplikację; cel laboratoryjny CLS≤0,1, a LCP≤2,5 s przy tych samych warunkach jako budżet projektu, nie deklaracja CWV całej populacji.

**Rekomendacja naprawy:** Wygenerować stały szkielet layoutu przed pobraniem danych i nie pokazywać stopki w miejscu przyszłej aplikacji; uporządkować krytyczne CSS/fonty (bez łańcucha @import tam, gdzie zwiększa opóźnienie). Nie usuwać komunikatów ładowania ani przenosić ciężkich obliczeń na główny wątek.

**Kryteria akceptacji:** Co najmniej trzy zimne pomiary porównawcze po zmianie, te same ustawienia i maszyna, raporty z przyczynami CLS. Brak przesunięcia stopki; interfejs nadal działa przy wolnych i błędnych danych.

**Zależności:** AUD-003/AUD-004 przed zmianą boot; ocena terenowa wymaga osobnych danych.

### AUD-013 — Zalecane skrypty E2E są częściowo niezgodne z obecną aplikacją

**Kategoria:** QA / wiarygodność regresji  
**Priorytet:** P2  
**Status i zakres:** FAIL — istniejące zestawy testowe, bez modyfikacji testów.  
**Lokalizacja:** `scripts/qa_e2e.mjs:113,148,222`; `scripts/qa_additional.mjs:168`; `README.md` sekcja testów.

**Obecne zachowanie:** Główne E2E ma 26 PASS/3 FAIL, dodatkowe 12 PASS/1 FAIL. Dwa testy szukają linków <a>, choć błędy są już przyciskami. Test oczekuje utraty miejscowości dla usługi zdalnej, choć lokalna poprawka słusznie ją zachowuje. Symulacja awarii importu nie przechwytuje versioned model.js?v=… i testuje sprawną aplikację.

**Odtworzenie:** Uruchom na izolowanej kopii `test:e2e` oraz `test:e2e:additional` z lokalnym zbudowanym artefaktem i dostępnym Playwright. Odczytaj wskazane komunikaty FAIL.

**Dowód:** `existing-e2e.log`, `existing-additional.log`, `06_E2E_RESULTS.json` (237 opcji), `06_ADDITIONAL_RESULTS.json` (66 par kategorii). Własny test wskazania błędu przyciskiem i fallback bez JS przechodzi.

**Oczekiwane zachowanie:** Testy weryfikują obecne wymagania i rzeczywiście wywołują symulowane błędy; błąd testu nie jest interpretowany jako błąd produktu ani pomijany.

**Rekomendacja naprawy:** Uaktualnić selektory do ról/aria-controls, oczekiwanie zachowania miejscowości i przechwytywanie po URL.pathname. W testach awarii potwierdzić liczbę przechwyconych żądań. Dodać regresje nowych przypadków, nie zastępować starych testów pustym PASS.

**Kryteria akceptacji:** Oba zestawy kończą się zerowym kodem i 100% uzasadnionych scenariuszy przechodzi. Zasymulowane uszkodzenie modułu daje fallback, a usunięcie pola z treści powoduje porażkę testu.

**Zależności:** AUD-001–AUD-006; odnowić testy kontraktu przed dalszym rozwojem.

### AUD-014 — Brak automatycznej bramki regresji dla strony i obu modułów

**Kategoria:** Architektura procesu / testowalność  
**Priorytet:** P2  
**Status i zakres:** FAIL — potwierdzony brak w konfiguracji repozytorium; nie awaria UI.  
**Lokalizacja:** `.github/workflows/pv-mining-data-candidate.yml` — jedyny workflow w analizowanej kopii; `package.json`; `scripts/lint.js:4`.

**Obecne zachowanie:** Workflow jest ręczny (workflow_dispatch), ograniczony do feat/pv-mining i uruchamia tylko testy PV oraz staging danych. Gałąź ta nie jest na sprawdzonym zdalnym repo. Zmiany strony i PR nie mają tu automatycznego lint/build/test/release-check. Ponadto lista lint pomija katalog pv-mining, mimo komunikatu ogólnego „Lint OK”.

**Odtworzenie:** Przejrzyj wszystkie pliki .github/workflows i źródła uruchamiane przez lint; porównaj z listą modułów.

**Dowód:** Inwentaryzacja repo, workflow i skrypt lint; w GitHub search_branches brak feat/pv-mining. Nie przeglądano konfiguracji branch protection ani innych, zewnętrznych systemów CI — ich istnienie pozostaje NOT TESTED.

**Oczekiwane zachowanie:** Każda zmiana aplikacji przechodzi powtarzalne kontrole całego publicznego artefaktu i silnika PV w jasno wskazanym środowisku.

**Rekomendacja naprawy:** Dodać po zatwierdzeniu zakresu projektu CI dla push/PR: syntax/lint obu modułów, jednostki, oba buildy, release whitelist, testy przeglądarek bez ruchu zewnętrznego. Ustalić wersje QA (Playwright/axe/Chromium) w osobnym środowisku; nie dodawać ciężkich narzędzi do runtime strony.

**Kryteria akceptacji:** Udokumentowany job uruchamia się na docelowej gałęzi i PR; kontrolowana regresja nowego przypadku powoduje FAIL; raport zawiera wersje i artefakty. Lint obejmuje engine/app/worker/session/data-loader/charts PV.

**Zależności:** AUD-013; nie uruchamiać automatycznie aktualizacji cen ani publikacji jako skutku testu.

### AUD-015 — Wersja produkcyjna nie ma CSP obecnego w lokalnym buildzie

**Kategoria:** Bezpieczeństwo / ograniczenie skutków błędów  
**Priorytet:** P3  
**Status i zakres:** FAIL — brak warstwy ochrony potwierdzony; podatność XSS UNVERIFIED.  
**Lokalizacja:** Produkcja `06a7902`: `smart-home-energy/index.html` i odpowiedź HTTPS. Lokalnie `scripts/public-security.js:4–11`, `scripts/build.js:25`.

**Obecne zachowanie:** Produkcyjny HTML nie ma meta Content-Security-Policy, odpowiedź nie zawiera nagłówka CSP. Lokalny build generuje CSP z hashami skryptów. Nie wykryto aktywnego XSS; brak CSP sam w sobie nie dowodzi możliwości ataku.

**Odtworzenie:** Odczytaj dokument i nagłówki HTTPS /smart-home-energy/; porównaj z dist wygenerowanym lokalnie. Nie wykonuj wstrzyknięć na produkcji.

**Dowód:** `live-smart-headers.json`, `live-smart.txt`; lokalne `release-check.log` potwierdza politykę i hashe. Kontrolowany lokalny test XSS w polach Smart Home nie wykonał kodu.

**Oczekiwane zachowanie:** Przyszły artefakt publiczny zachowuje istniejącą politykę skryptów i uzgodnione originy zasobów.

**Rekomendacja naprawy:** W przyszłym wydaniu użyć zabezpieczonego builda. Przed aktywacją backendu osobno dostosować CSP do Turnstile i endpointu — obecny backend jest celowo wyłączony. Możliwości nagłówków hostingu ocenić oddzielnie, bez obietnicy konfiguracji przez meta.

**Kryteria akceptacji:** Pobrany po przyszłej publikacji HTML zawiera prawidłową politykę; skrypty działają bez unsafe-inline/unsafe-eval w script-src; brak nowych błędów CSP. Wybór analityki i polityka prywatności są zgodne.

**Zależności:** AUD-001, AUD-014; publikacja jest osobnym zadaniem, nie częścią tego audytu.

### AUD-016 — Otwarte menu mobilne jest pomijane w naturalnej kolejności Tab

**Kategoria:** UX klawiatury / nawigacja  
**Priorytet:** P3  
**Status i zakres:** FAIL — Chromium; pełna zgodność WCAG kolejności fokusu UNVERIFIED.  
**Lokalizacja:** `smart-home-energy/index.html:41–57`; `menu.js:8–12`; `style.css:45` (wizualne order:4).

**Obecne zachowanie:** Linki menu występują w DOM przed przyciskiem otwierającym. Po otwarciu fokus zostaje na przycisku, a Tab przechodzi do okruszka „Strona główna”, pomijając otwarte opcje. Dostęp jest możliwy po cofnięciu Shift+Tab; funkcja nie jest całkowicie niedostępna.

**Odtworzenie:** 390 px, zamknij baner, skup przycisk menu i otwórz Enter/Spacją, następnie Tab. Obserwuj aktywny element.

**Dowód:** `keyboard.json` i `functional.json`: po otwarciu kolejnym elementem jest breadcrumb href=/; `menu-keyboard-focus-390.png`. Escape zamyka menu i przywraca fokus poprawnie.

**Oczekiwane zachowanie:** Naturalna kolejność po wyzwalaczu prowadzi przez otwarte opcje, a Escape wraca do wyzwalacza.

**Rekomendacja naprawy:** Ustawić kolejność DOM zgodną z widocznym układem disclosure albo świadomie przenosić fokus na pierwszy link i obsłużyć powrót. Nie używać dodatnich tabindex do ręcznego numerowania strony.

**Kryteria akceptacji:** Tab/Shift+Tab od przycisku przechodzą przewidywalnie przez menu; wszystkie 8 linków osiągalne; zamknięcie i resize nie zostawiają fokusu na ukrytym elemencie.

**Zależności:** AUD-011; zweryfikować także natywny Safari z włączoną pełną nawigacją klawiaturą.

### AUD-017 — Osobny podgląd PV nie dostarcza favikony

**Kategoria:** Wykończenie / jakość artefaktu  
**Priorytet:** P3  
**Status i zakres:** FAIL — żądanie 404 w Chromium i Lighthouse.  
**Lokalizacja:** `scripts/build-pv-mining.mjs:5` lista plików; `pv-mining/simple.html:1`, `advanced.html:1`, `index.html:2`.

**Obecne zachowanie:** Osobny origin podglądu nie ma favicon.ico ani wskazanego favicon.svg. Chromium żąda /favicon.ico i dostaje 404; w karcie brakuje wspólnego znaku AMPOWER. Lighthouse wykazuje errors-in-console.

**Odtworzenie:** Otwórz nową kartę simple/advanced i sprawdź Network/Console lub raport Lighthouse.

**Dowód:** `probes.json` (Chromium: Failed to load resource 404), `lh-pv-simple-mobile.json` i `lh-pv-advanced-mobile.json` — errors-in-console wskazuje /favicon.ico. Publiczny Smart Home ma poprawny favicon.svg.

**Oczekiwane zachowanie:** Podgląd ma ikonę marki i nie generuje zbędnego 404.

**Rekomendacja naprawy:** Jawnie dołączyć właściwą ikonę do whitelisty osobnego builda i dodać link rel=icon w trzech dokumentach PV.

**Kryteria akceptacji:** Zimne wejście na wszystkie trzy dokumenty PV bez żądania favikony zakończonego 404; ikona widoczna w karcie. Zachowany noindex prototypu.

**Zależności:** Brak; nie zmieniać noindex przy tej kosmetycznej poprawce.

## CZĘŚĆ IV — Propozycje usprawnień

Poniższe propozycje są oddzielone od usterek. Nie dowodzą obecnego błędu ani wzrostu konwersji. Powinny mieć własną decyzję produktową i sposób oceny.

| ID | Obserwacja | Konkretne usprawnienie | Jak ocenić efekt |
|---|---|---|---|
| IMP-01 | Smart Home prosi o szczegóły przed dużą częścią wyjaśnienia oferty; długi widok mobile. | Przed formularzem dodać krótki blok „co otrzymasz” z trzema rzeczywistymi rezultatami i etapami współpracy. Szczegółowe ustawienia pokazywać po wyborze kategorii, z wyraźnym „nie wiem”. | Użytkownik potrafi wyjaśnić rezultat usługi przed rozpoczęciem. Badanie kilku reprezentatywnych klientów, czas i porzucenia w zgodnej z prywatnością analityce. |
| IMP-02 | Karty START/STANDARD/PREMIUM prowadzą do tej samej ścieżki; różnica zakresu wymaga czytania. | Dodać krótką tabelę „dla kogo / typowy zakres / co wymaga sprawdzenia”. Przy przejściu z karty wyświetlić jawnie wybrany punkt startowy z opcją zmiany; nie zaznaczać płatnych elementów bez wiedzy użytkownika. | Test kliknięcia każdej karty: kontekst zachowany, bez pozorowania stałej ceny czy gwarantowanej kompatybilności. |
| IMP-03 | Desktop ma podsumowanie obok formularza, mobile traci ten kontekst podczas długiego przewijania. | Dodać kompaktowe, rozwijane podsumowanie wybranych integracji i liczbę brakujących danych. Ewentualny sticky pasek nie może zasłaniać pól ani cookies. | Mniej przewijania w zadaniu „zmień jeden wybór i sprawdź zakres”; pełne testy fokusu i małych ekranów. |
| IMP-04 | Obraz panelu jest czytelniejszy na desktop; na telefonie to wiele drobnych elementów. | Przygotować telefoniczny wariant kadru lub 2–3 powiększone detale z podpisem „przykładowy widok”; umożliwić otwarcie pełnego panelu. Dodać zdjęcia rzeczywistych realizacji, jeśli właściciel ma prawa i zgodę. | Czytelność etykiet na 375 px, brak wymyślonych realizacji/opinii, poprawne alty i dostępna obsługa powiększenia. |
| IMP-05 | Ciężki PNG panelu, brak srcset; lokalny mobile LCP 2,78 s. | Warianty szerokości, WebP/AVIF z fallbackiem i zapisanymi wymiarami; utrzymać lazy-loading poniżej pierwszego ekranu. Dobór fontów/weightów po pomiarze pokrycia. | Porównanie transferu i LCP w identycznych warunkach, bez pogorszenia jakości tekstu na ekranie. Szacunek 388 KiB oszczędności sprawdzić, nie traktować jako gwarancji. |
| IMP-06 | PV pokazuje precyzyjne BTC i pojedynczy scenariusz dziesięcioletni; niepewność wejść jest znacznie większa od precyzji liczb. | Wprowadzić jawne scenariusze ostrożny/bazowy/korzystny z edytowalnymi ceną BTC, trudnością, produkcją i kosztami. W podsumowaniu pokazać przedział wyników scenariuszy oraz największe czynniki, bez udawania przedziału ufności. | Te same ustawienia generują powtarzalne warianty; założenia i różnica cash/portfolio widoczne przy liczbie, a nie wyłącznie w FAQ. |
| IMP-07 | „Roczna korzyść względem eksportu” bywa mylona z dochodem netto; główny CTA wymaga kontaktu. | Obok wyniku podać krótki rozkład: oczekiwana wartość BTC, zmiana rachunku, utrzymanie, nieuwzględnione podatki/ryzyka. Dodać „co musimy sprawdzić w instalacji” jako konkretną listę danych do rozmowy. | Użytkownik odróżnia wartość oczekiwaną od wypłaty i kosztu inwestycji; brak obietnicy gwarantowanego zysku. |
| IMP-08 | Katalog miesza ceny obserwowane i wymagające oferty, różne systemy chłodzenia oraz niepotwierdzone profile sterowania. | Utrzymać pochodzenie ceny per urządzenie: wariant, data, waluta, VAT/import/dostawa, chłodzenie i zakres weryfikacji. Dla każdej zmiany rynku generować candidate + diff do przeglądu, bez automatycznej publikacji. | Niepotwierdzona pozycja nie otrzymuje etykiety zweryfikowanej oferty. Aktualizacja danych nie zmienia przypadkiem jednostek i kosztów. |
| IMP-09 | Długie szablony i rozproszona synchronizacja PV utrudniają utrzymanie. | Po naprawie regresji wydzielić schemat wejścia, czyste funkcje budowania szkicu/eksportu oraz małe renderery. Scentralizować przejścia „zmiana parametrów / import / preset / reset”; zachować oddzielny silnik. | Testy AUD-003–AUD-009 nadal przechodzą, mniejsze funkcje mają jawne wejście/wyjście, brak zmiany formatu sesji bez migracji. Nie jest wymagana wymiana technologii. |
| IMP-10 | Produkcja, gałąź preferowana i lokalny prototyp mają różne funkcje. | Zapisywać w artefakcie identyfikator wersji, datę builda i checksum manifestu; w procedurze wydania porównywać oczekiwane pliki z rzeczywistymi. Dla właściciela przygotować prostą listę „publiczne / lokalne / planowane”. | Można jednoznacznie ustalić, która poprawka jest publiczna; `dist` nie zawiera PV i backendu bez świadomej zmiany kontraktu. |
| IMP-11 | Automatyczne a11y nie obejmuje wszystkich stanów i technologii wspomagających. | Po naprawach wykonać krótkie zadania VoiceOver/Safari i NVDA/Chromium, prawdziwy text zoom, wysokie kontrasty i nawigację dotykową. Uwzględnić status przeliczenia, błędy i wykresy/tabele. | Udokumentowane zadania bez utraty informacji; brak deklaracji „WCAG AA” na podstawie samego axe 0. |
| IMP-12 | Ograniczenia symulacji są opisane, lecz nie wszystkie są obok wyniku: syntetyczny dom, jedna pogoda, żywotność baterii/ASIC, brak sekundowej pętli. | Ustalić dokumentowany zakres modelu i kryteria kalibracji na realnych danych pomiarowych; osobno oszacować degradację baterii i przerwy eksploatacyjne. Nie dopisywać „realistycznych” współczynników bez danych. | Porównanie z zanonimizowanym pomiarem rzeczywistej instalacji, błędy profilu i czułość raportowane jawnie; symulator pozostaje szacunkiem. |

## CZĘŚĆ V — Plan wdrożenia poprawek

Plan jest instrukcją na przyszłość. W ramach tego audytu nie wykonano żadnego z poniższych wdrożeń.

| Etap | Zakres | Zależności | Warunek ukończenia |
|---|---|---|---|
| 0. Ustalenie punktu startowego | Zachować istniejące zmiany, wybrać docelowy checkout/gałąź, spisać różnice produkcja–lokalnie. Zamrozić dane i wersje narzędzi do porównania. | Brak | Jednoznaczny commit + diff; aktualny manifest, podział publiczny/prototyp; brak utraty cudzych zmian. |
| 1. Odzyskanie wiarygodnych testów | AUD-013, zakres lint z AUD-014; dodać minimalne testy odtwarzające dalsze usterki. | Etap 0 | Każda nowa regresja najpierw odtworzona; poprawione testy nie oczekują starego błędu i potwierdzają skuteczność mocków. |
| 2. Spójność danych i kontaktu | AUD-003, AUD-004, AUD-005, AUD-006, AUD-007; zachowanie lokalnych napraw AUD-001 i AUD-002. | Etap 1 | Formularz = ustawienia silnika = źródło wyniku = eksport = szkic. Pierwsze kliknięcie działa. Puste założenie jawne. Szkic kompletny. |
| 3. Bilans i kalendarz modelu | AUD-008, AUD-009, testy baseline/ledger/NPV i granic życia ASIC. | Etap 2 dla testów UI; testy czystego silnika można przygotować wcześniej | Energia EMS ma źródło i koszt dokładnie raz; poprawne 8760/8784; wartości zmienione celowo opisane. Brak „dostrojenia” oczekiwań do dowolnego wyniku. |
| 4. Dostępność i stabilność wizualna | AUD-010, AUD-011, AUD-016; potem AUD-012 i AUD-017. | Etap 2, aby nie diagnozować ruchomego UI | Fokus widoczny, menu przewidywalne, tekst 200% bez utraty informacji, stabilny start PV; trzy porównywalne pomiary i pełna macierz widoków. |
| 5. Bramki jakości i kandydat wydania | Reszta AUD-014, utrzymanie CSP z AUD-015, publiczna whitelist, aktualne E2E i integralność builda. | Etapy 1–4 | Powtarzalne CI bez wysyłek i płatnych usług; wynik testów/wersje/artefakty przypisane do kandydata. |
| 6. Osobna decyzja o publikacji | Rozstrzygnąć zakres Smart Home, PV, cen i backendu. W przypadku zgody publikować wyłącznie uzgodniony artefakt. | Etap 5 i odrębne upoważnienie do publikacji | Kontrola publicznych plików po wydaniu, smoke test bez wysyłki i plan przywrócenia poprzedniego artefaktu. PV nie trafia przypadkiem do produkcji. |
| 7. Usprawnienia produktu | Wybrane IMP-01–IMP-12, po nadaniu priorytetów przez właściciela. | Usunięte usterki wpływające na pomiary | Udokumentowany efekt zadaniowy lub pomiar, zachowane testy; brak kosmetycznej przebudowy maskującej problemy danych. |

Zmiany silnika i przebudowę wizualną należy odbierać osobno: wtedy różnica wyniku finansowego nie zostanie pomylona ze zmianą sposobu prezentacji. Publikacja Smart Home nie wymaga automatycznie publikowania eksperymentu PV.

## CZĘŚĆ VI — Instrukcja dla kolejnego modelu AI

### Kontrakt wykonania

Ten raport **nie udziela zgody na poprawki ani publikację**. Kolejny model może wdrażać dopiero w zakresie nowego polecenia właściciela. Obecny stan roboczy zawiera wcześniejsze prace; nie używać `reset --hard`, `git clean`, automatycznego checkoutu ani nadpisania całych katalogów. Nie zakładać, że preferowana gałąź zawiera PV. Zacząć od `git status`, sprawdzenia HEAD i porównania lokalnych funkcji z raportem. Jeżeli pliki od czasu audytu się zmieniły, odtworzyć tylko właściwe przypadki zamiast powtarzać pełny audyt.

Nie aktywować backendu, wysyłek, cen, Google Analytics, workflow danych ani usuwania noindex przy okazji poprawiania formularza. Nie importować całego katalogu źródeł do hostingu. W przyszłych testach stosować dane syntetyczne, mockować żądania zewnętrzne i nigdy nie klikać rzeczywistego wysłania wiadomości.

### Mapa implementacji

| Plik / warstwa | Zadanie |
|---|---|
| `smart-home-energy/model.js`, `app.js` | Utrzymać komplet `PROJECT_FIELDS`, walidację `parseScenes` i miejscowość w szkicu; porównać z `06a7902`, nie tworzyć drugiej równoległej poprawki. |
| `pv-mining/app.js` — obsługa preset/import/clear/reset | Jeden kontrakt zmiany profilu. Zmiana źródła unieważnia `csvSerial`, kończy import w toku, synchronizuje `imported`, zapis, UI, Worker i rewizję wyniku. Dla powrotu do symulacji Worker musi dostać `{type:'profile', imported:null}` przed obliczeniami albo zostać odtworzony. |
| `pv-mining/app.js` — `input`, `schedule`, `compute` | Nie planować ponownie identycznych znormalizowanych danych na `change` po `input`. Rzeczywista zmiana ustawia `dirty`; stary eksport pozostaje blokowany; pierwsza akcja na gotowym wyniku nie ginie przez blur. |
| `pv-mining/app.js` + `engine.js:normalize` | Jawny schemat wymaganych/opcjonalnych wejść. Rozróżnić `''`, `null`, zero i wartość nieprawidłową. Zastosować ten sam kontrakt do formularza, przywróconej sesji i eksportu. |
| `pv-mining/app.js` — `prepareInquiry`, `mailHref`, `updateMailLink` | Szkic oparty na aktywnym wyniku: liczba urządzeń, rzeczywiste W i TH/s, oznaczenie customSpec. Limit gotowego zakodowanego mailto; pełny tekst do kopiowania; zachować dopiski i mechanizm stale. |
| `pv-mining/engine.js` — `dispatch`, roczny ledger / opex | Włączyć dodatkowy EMS do interwałowego obciążenia scenariusza inwestycji; nie policzyć drugi raz tej samej energii w OPEX. Baseline bez dodatkowego urządzenia, ustalone zachowanie po końcu życia ASIC. |
| `pv-mining/engine.js` — `makeProfile`; `data-loader.js` | `hours = sum(dt)` dla poprawnych danych; prawidłowy rok przestępny i offset powtarzanych lat referencyjnych. CSV i bundled profile objąć oddzielnymi testami. |
| `assets/consent.*`, `smart-home-energy/style.css`, `menu.js`, HTML header | Widoczność fokusu z banerem, układ przy dużym tekście, kolejność otwartego menu zgodna z DOM lub świadome zarządzanie fokusem. Nie używać dodatnich tabindex. |
| `pv-mining/simple.html`, `advanced.html`, `style.css`, start `app.js` | Rezerwacja układu przed danymi, fonty bez zbędnego łańcucha; zachować loading/error i Worker. Dodać ikonę poprzez osobny build PV. |
| `scripts/qa_e2e.mjs`, `qa_additional.mjs`, `lint.js`, workflow | Rola/aria-controls zamiast starych linków, mock po pathname z potwierdzeniem przechwycenia, właściwe oczekiwanie miejscowości, objęcie PV syntax/lint i CI. |

### Minimalny pakiet regresji do implementacji

1. **CSV/preset:** pełny przykład 10 kWp → import → model S21 Pro → preset 20 kWp + 20 kWh → wynik i eksport → reload → ta sama produkcja/energia/source. W obecnym błędzie 10 268/2627 zmienia się po reload na 20 535/5328 kWh. Dodać wariant z trwającym importem i zmianą widoku A/B; nie kodować starych błędnych liczb jako oczekiwanego wyniku.
2. **Blur/akcja:** zmiana liczby → gotowy wynik → bez osobnego blur pierwsze kliknięcie eksportu/modelu/szkicu. Dokładnie jedno pobranie i właściwy aktywny model w Chromium oraz WebKit.
3. **Puste założenia:** każde wymagane pole wyczyszczone; nie może pozostawać puste przy wyniku opartym na ukrytej liczbie. Dla opcjonalnych kosztów brak ROI; zero poprawne tylko tam, gdzie dopuszczone.
4. **Szkic:** trzy S21, custom 150 TH/s i 2500 W/szt. → szkic opisuje 3 sztuki i 7,5 kW znamionowego poboru urządzeń, dodatkowe chłodzenie oddzielnie. Dane wejściowe nie wykonują HTML. Dopiski użytkownika przetrwają świadome odświeżenie.
5. **Mailto:** treść z 2000 „ą”, emoji, ASCII i błędną parą UTF-16. Limit liczony dla gotowego URI; kopiowanie nigdy nie ucina tekstu.
6. **EMS:** 8760 interwałów PV 1 kW, dom 0, ASIC 1 kW, EMS 0/200 W. Dodatkowe 1752 kWh musi wystąpić w bilansie i rachunku właściwego scenariusza. Dodać różne źródła energii i wyłączenie ASIC; sprawdzić brak podwójnego kosztu.
7. **Rok:** poprawne profile 2023/2024, 8760/8784; sumy dt zgodne z hours, przesunięcia lat i roczny koszt EMS poprawne. Nie zmieniać parsera CSV kosztem jego obecnych walidacji.
8. **Smart Home:** wszystkie dodatkowe pola projektu i miejscowość występują w podglądzie i mailto przy realizacji lokalnej/zdalnej/niepewnej; błędne sceny nie tworzą szkicu.
9. **A11y:** nowy profil, otwarty baner, Tab/Shift+Tab 375/390/430/1440; cały komponent z fokusem widoczny. Menu po otwarciu prowadzi do opcji. Symulacja 200% oraz osobny test natywnego powiększenia.
10. **CSV w WebKit:** powtórzyć udany import w świeżym kontekście i sekwencję błędny → poprawny plik z `final-controls.json`, także w natywnym Safari. Odróżnić błąd odczytu File/Worker od walidacji danych; zapisać wyjątek i wersję silnika. Dopiero po reprodukcji przypisać naprawę aplikacji albo narzędziom QA.
11. **Wydajność:** co najmniej trzy zimne pomiary PV simple przy identycznym throttlingu; zapisać przyczyny CLS, nie tylko score. Budżet startowy CLS≤0,1, cel LCP≤2,5 s; nie deklarować terenowych CWV na tej podstawie.

### Komendy kontrolne i bezpieczne odtworzenie

W tym audycie poniższe komendy uruchamiano **w kopii poza repozytorium**, ponieważ build/test może tworzyć `dist`, `output` i raporty:

```sh
npm run lint
npm test
npm run build
npm run pv:build
npm run release:check
npm run test:e2e
npm run test:e2e:additional
npm run test:e2e:consent
```

Playwright i narzędzia QA były już dostępne w środowisku gospodarza; repozytorium nie ma kompletnej instalacji tych zależności. Przed uruchomieniem sprawdzić argumenty skryptów, wymagany serwer i ścieżki modułów. Nie instalować ich trwale do projektu bez nowego upoważnienia. Dla kopii bez `.git` test `legacy.test.js` wymaga read-only dostępu do właściwej historii przez per-command `GIT_DIR`; nie inicjalizować nowego repozytorium i nie zmieniać globalnego środowiska. W audycie wykonano takie powtórzenie tylko dla tego pliku.

Pomocnicze skrypty znajdują się w paczce `scripts/` poza repozytorium. Mają ścieżki środowiskowe i korzystają z `/tmp/ampower-current-audit-path` oraz lokalnych portów — są dowodem procedury, nie gotowym przenośnym frameworkiem. Przy przenoszeniu dostosować je w kopii. Surowe logi zawsze interpretować zgodnie z sekcją ograniczeń.

### Dowody i integralność

Główna paczka: [ampower-audyt-2026-10-27-niezalezny](/Users/jb/outputs/ampower-audyt-2026-10-27-niezalezny). Nie jest częścią Git. Przy przekazywaniu raportu innemu środowisku należy przekazać także tę paczkę; same ścieżki lokalne nie będą tam działać.

| Dowód | Zawartość |
|---|---|
| [matrix.json](/Users/jb/outputs/ampower-audyt-2026-10-27-niezalezny/evidence/matrix.json), [live-matrix.json](/Users/jb/outputs/ampower-audyt-2026-10-27-niezalezny/evidence/live-matrix.json) | Wymiary, silniki, błędy i axe; screenshoty `chromium-*`, `webkit-*`, `live-*`. |
| [probes.json](/Users/jb/outputs/ampower-audyt-2026-10-27-niezalezny/evidence/probes.json), [extra-probes.json](/Users/jb/outputs/ampower-audyt-2026-10-27-niezalezny/evidence/extra-probes.json) | Reprodukcje CSV/preset, pustych pól, kliknięć, ilości/customSpec i tekstu. |
| [engine-probes.json](/Users/jb/outputs/ampower-audyt-2026-10-27-niezalezny/evidence/engine-probes.json) | Oracle BTC, EMS, rok przestępny, bilans/SOC i jawny scenariusz bazowy. |
| [production-comparison.json](/Users/jb/outputs/ampower-audyt-2026-10-27-niezalezny/evidence/production-comparison.json) | Różnice szkicu i walidacji produkcja–lokalnie; `live-smart.txt`, publiczne JS i nagłówki. |
| [keyboard.json](/Users/jb/outputs/ampower-audyt-2026-10-27-niezalezny/evidence/keyboard.json), [text200-detail.json](/Users/jb/outputs/ampower-audyt-2026-10-27-niezalezny/evidence/text200-detail.json) | Położenie fokusu, nakładka i geometria przepełnienia; screenshoty `focus-covered-*`, `*-text200-*`. |
| [lighthouse-summary.json](/Users/jb/outputs/ampower-audyt-2026-10-27-niezalezny/evidence/lighthouse-summary.json), [lh-confirm.json](/Users/jb/outputs/ampower-audyt-2026-10-27-niezalezny/evidence/lh-confirm.json) | Pomiary i powtórzenia; pełne raporty `lh-*.html/json`. |
| `existing-*.log`, `unit-tests.log`, `legacy-retest.log`, `06_*RESULTS.json` | Pełne wyniki istniejących zestawów, także FAIL; pliki 06 pochodzą z aktualnego uruchomienia Smart Home, nie z wcześniejszych raportów backendu. |
| `baseline.json`, `baseline-status.txt`, `integrity-final.json` | Stan plików przed audytem i końcowe porównanie SHA-256; różnicę stanowi wyłącznie dozwolony nowy raport. |

Nie zmodyfikowano kodu witryny, konfiguracji środowisk, danych produkcyjnych ani zależności. Nie powstał commit, PR, push lub deployment. Nie wysłano rzeczywistych formularzy i nie uruchomiono płatnej usługi. Jedynym nowym plikiem w repozytorium jest `AUDYT_SMART_HOME_ENERGY.md`.
