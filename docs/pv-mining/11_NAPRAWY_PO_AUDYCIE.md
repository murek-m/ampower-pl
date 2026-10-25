# Naprawy po audycie AMPOWER PV Mining

25.10.2026. Gałąź `feat/pv-mining`, silnik `2026-10-25.1`. Zakres: błędy lokalnych prototypów z [raportu audytu](10_PELNY_AUDYT_I_PLAN_POPRAWEK.md). Bez publikacji i zmian `main`.

## Wynik i odbiór

**266/266 testów repozytorium zaliczonych, w tym 47 PV Mining.** [Log](qa/audit-fixes/node-tests.txt). Build podglądu poprawny. Wykonano kontrolę przeglądarkową formularzy, wspólnego stanu, importu, szkicu i wymiarów A/B. Polecenia: `npm test`, `npm run pv:build`, `npm run pv:report`.

Przeliczono 81 scenariuszy przy **tym samym snapshocie i jawnych budżetach demonstracyjnych**, aby oddzielić wpływ zmiany algorytmu od zmiany rynku. Wyniki korzyści zmieniły się w 37 rekordach. Żaden z 81 wariantów nie odzyskuje inwestycji w przyjętym horyzoncie. To wynik tej próby, nie wszystkich możliwych instalacji i ofert. Nowe tabele: [09 — symulacje po naprawie](09_AKTUALNE_SYMULACJE.md), [pełny JSON](qa/audit-fixes/simulations.json), [różnice przed/po](qa/audit-fixes/simulation-changes.json). Pierwotny `qa/stage-4/simulations.json` zachowano bez zmian.

## Co naprawiono

| ID audytu | Zmiana | Dowód odbioru |
|---|---|---|
| E01 | Wariant odniesienia i plany miningu są oceniane tym samym pełnym rachunkiem i kosztem zużycia baterii. Wyłączony ASIC jest zawsze dopuszczalnym planem. Po zakończeniu życia ASIC sterowanie wraca do sygnału wariantu odniesienia. | W kontrprzykładzie 0 BTC daje teraz **0 zł korzyści**; dom przez baterię w obu wariantach **2730,27 kWh**, zamiast 0 vs 2730,27. Test obu polityk EMS. |
| E02 | Krańcowa cena 1 kWh jest wyłącznie jednym sygnałem tworzącym kandydatów. Każdy kompletny plan jest oceniany po pełnym rejestrze depozytu i rzeczywistych przepływach; dopuszczony jest brak pracy. | Wykazany plan z 4380 h i stratą −374,89 zł jest odrzucony; ASIC wyłączony, przyrost 0. Testy zerowego/ujemnego eksportu, baterii i importu. |
| C01 | Usunięto domyślne 4000 zł i 20 000 zł. Start od pustego kosztorysu szczegółowego; nieznany koszt wymagany, budżet lub cena nowej baterii blokuje zwrot. | UI „Najpierw uzupełnij kosztorys”; testy brakujących kwot i jawnego zera. Nie dopisano cennika robocizny AMPOWER. |
| D01 | Struktura statusu oferty, dostępności, ceny końcowej i dostawy. Wyróżnienie wymaga aktualnej potwierdzonej oferty i dodatniego wyniku; własne parametry/cena pozostają scenariuszem. | Testy `sold-out`, braku dostawy, ceny i aktualności. Obserwacje katalogowe pozostają **niepotwierdzone**, nie zmieniono ich w oferty. |
| U01 | Energia ASIC rozbita na bezpośrednią PV, baterię i sieć, także miesięcznie. Skala SVG obejmuje wszystkie serie. Rachunek ma osobną pełną zmianę oraz komponent depozytu. | Przypadek PV=0: 23 406,72 kWh z sieci, 0 z PV; skończone współrzędne i słupki w skali. Opis i koszt importu jawne. |
| U02 | Zmiana parametrów/modelu unieważnia szkic, blokuje kopiowanie i link pocztowy do odświeżenia. Odświeżenie zachowuje dopiski i ręczne zmiany treści. Długa treść nie jest po cichu obcinana w e-mailu. | Przeglądarka: 10 → 20 kWp, blokada starej wersji, odświeżone 20 kWp i zachowany dopisek. |
| U03 | Wspólny stan A/B w pamięci sesji; CSV lokalnie w IndexedDB pod identyfikatorem karty. Brak parametrów w URL. Reset usuwa zapisany profil tej karty. | Przeglądarka: zachowanie 20 kWp B → A → B oraz zachowanie własnego CSV; kontrola usunięcia importu. |
| V01 | Sprzeczny SOC, ceny i PV są odrzucane zamiast cichego przestawiania. Puste zużycie domu ma jawne założenie 5000 kWh. Błąd ma ARIA i przycisk otwierający właściwy panel/pole. | SOC 95% > 10% zgłasza błąd; przycisk prowadzi do pola. Nieprawidłowy BTC w ukrytej zakładce prowadzi do widocznego pola Mining z `aria-invalid`. |
| D02 | Wersja schematu, ograniczenia liczb, format ID/URL, zgodność J/TH, pełny rok profilu i odrzucanie dat przyszłych. | Każdy wadliwy przypadek z audytu odrzucony osobno. Przyszła data nie staje się „świeżą”. |
| A01 | Dopiski wyniku i etykiety porównań 14 px oraz ciemniejszy tekst; większe etykiety i pola. | Kontrast dopisku wyniku **6,72:1**, wybranej karty **7,03:1**. DOM mobilny potwierdza 14 px. |
| A02 | Rozwijana tabela miesięcznej energii z nagłówkami, jednostkami i źródłami zasilania ASIC. | Te same serie co wykres, dostępne bez najechania kursorem. Nie wykonano fizycznego testu czytnikiem ekranu. |
| U04 | Minimalna rozpiętość osi finansów przy zerach i stałych wynikach. | SVG nie zawiera `NaN`/`Infinity`; testy zer, dodatnich i ujemnych stałych serii. |
| E03 | Osobna flaga i komunikat przy werdykcie, gdy zwrot zależy od wyceny BTC po zakończeniu pracy ASIC. | Test: życie 1 rok, zwrot późniejszy, brak późniejszego wydobycia. |
| O01 | Dynamiczne daty w UI; działający lokalny adapter rynku, walidowany snapshot i manifest; workflow ręcznego przygotowania artefaktu bez uprawnień zapisu. | Rzeczywiste pobranie danych do osobnego katalogu zakończone; testy awarii, skrajnych cen i zachowania źródeł. Cykliczna publikacja nadal wymaga zatwierdzonego hostingu i wdrożenia. |
| P01 | Rozmiar CSV sprawdzany przed odczytem i w bajtach. Parser w workerze. Aktywne stare obliczenie jest przerywane po zmianie wejść; bezczynny worker przechowuje stałe dane i profil. Prognoza rezerwy domu przygotowywana raz. | Przeglądarka: import 8760 rekordów, odrzucenie 8 000 001 B przed odczytem, szybkie zmiany parametrów. Lokalny pomiar poniżej. |

Hydro dodatkowo wymaga jawnego potwierdzenia kompletnego obiegu, jego poboru i kosztu w szczegółowym kosztorysie. Sam budżet ogólny nie odblokowuje okresu zwrotu. Część rysującą wykresy i obsługę stanu przeniesiono do oddzielnych modułów; A/B zachowują jeden silnik.

## Co dokładnie zmieniło się w algorytmie

Planista tworzy ograniczony zbiór planów przy progach od 0 do pełnej nominalnej wartości eksportu oraz sygnale krańcowym wynikającym z rejestru. Wariant bez ASIC otrzymuje te same możliwości oceny baterii. Następnie porównuje **cały** wpływ każdego planu na wydobycie, rachunek i zużycie baterii przez analizowany horyzont. Plan bez miningu jest zawsze kandydatem. Poprawa wynikająca wyłącznie z przełączenia heurystyki baterii przy niedziałającym ASIC nie jest doliczana do miningu.

Nie jest to dowód globalnego optimum. Wybrany plan nie przegrywa operacyjnie z wyłączeniem w ocenie całego horyzontu **przed stałymi kosztami utrzymania i inwestycji**. Koszty stałe i CAPEX pozostają w wyniku finansowym także wtedy, gdy planista wybierze brak pracy ASIC. Poszczególne lata mogą dać stratę, a horyzont ma założenia przyszłej trudności i kursu. Tego nie zastępuje się przycięciem strat do zera.

Przykład bazowy PV 10 kWp bez baterii, stare jawne budżety badawcze i snapshot 24.10: S21 151T pracuje teraz 721 h, zużywa 1926,51 kWh i wydobywa 0,00169712 BTC w roku 1; korzyść 98,01 zł, wynik po 10 latach −12 048,86 zł. Wcześniejsze 1267 h i 254,52 zł korzyści są wynikiem starego silnika. Cennik AMPOWER ani aktualna końcowa oferta sprzętu nie wynikają z tych liczb.

## Aktualizator danych — użycie i granice

- `npm run pv:data:stage` pobiera wyłącznie publiczne dane rynku: Coinbase BTC/PLN oraz mempool/Esplora (bloki, difficulty z `bits`, średnia opłat z sześciu coinbase po odjęciu subsidy). Ma timeout, ograniczone próby i walidację zmian. Nie pobiera automatycznie ofert sklepów.
- Wynik trafia do `output/pv-mining-data-candidates/<czas>-<hash>/`, wraz z manifestem i SHA-256. Dotychczasowy snapshot strony pozostaje bez zmian. [Dowód pobranego rynku](qa/audit-fixes/update-market.json), [manifest](qa/audit-fixes/update-manifest.json).
- Po osobnym przeglądzie lokalne zastosowanie umożliwia `node scripts/pv-mining-update.mjs --apply-local`, wyłącznie na `feat/pv-mining`, atomowo dla całej grupy rynku. Potem trzeba wykonać build i ponownie przeliczyć scenariusze. Tego trybu nie uruchamiano w ramach napraw.
- Nie odnawia dat cen ASIC, historycznego RCEm ani profilu PV. Średnia sześciu bloków jest jawnie krótką próbką, nie gwarancją przyszłych opłat. Nieudane pobranie nie zeruje danych i nie nadaje im nowej daty.
- `.github/workflows/pv-mining-data-review.yml` ma tylko `workflow_dispatch`, `contents:read`, limit czasu i artefakt. Bez `schedule`, commitów, push lub deploy. Nie uruchomiono zdalnego workflow. Alarmem jest błąd joba; docelowy monitoring i endpoint dla frontendów należą do przyszłego zatwierdzonego wdrożenia.

Źródła interfejsów, sprawdzone 25.10: [Coinbase Prices](https://docs.cdp.coinbase.com/coinbase-business/track-apis/prices), [Esplora API](https://github.com/Blockstream/esplora/blob/master/API.md), [mempool REST](https://mempool.space/docs/api/rest). Nie wymaga kluczy przeglądarkowych. Nie włączono płatnych usług ani harmonogramu.

## Przeglądarka, wydajność i dowody

[Wyniki przeglądarkowe](qa/audit-fixes/browser.json), [wyniki silnika i kontrast](qa/audit-fixes/results.json), [widok mobilny](qa/audit-fixes/B-mobile.png). A/B przy 320, 390 i 768 px: szerokość przewijania równa szerokości dokumentu; brak poziomego przepełnienia. Odczyt ten nie zastępuje odbioru na fizycznym telefonie. Błędy JS po sesji zapisano w dowodzie przeglądarkowym.

Orientacyjny pojedynczy pomiar `calculate` na lokalnym Node v26.10.0/macOS arm64: cztery modele, bateria 20 kWh, 10 lat — **265 ms** dla profilu godzinowego i **720 ms** dla 15-minutowego. Nowy planista wykonuje więcej ocen rachunku niż stary; optymalizacja rezerwy ogranicza koszt. To czas samego silnika, nie CWV ani pomiar telefonu. Przeglądarka przerywa stare zadania zamiast gromadzić kolejkę.

Przy przełączaniu widoków dane wejściowe są zachowywane lokalnie. CSV nie jest wysyłany. To zmiana wobec wcześniejszego prototypu przechowującego profil tylko w pamięci: opis UI informuje o lokalnym zachowaniu do usunięcia, a reset usuwa profil bieżącej karty. Nie zachowujemy danych w adresie strony. Nie wysłano żadnego zapytania e-mail.

## Pozostały zakres przed produkcją

Naprawy kodu nie dostarczają rzeczywistej oferty AMPOWER, potwierdzenia cen dostawy, projektu elektrycznego ani testu sprzętu. Nadal potrzebne są dane konkretnej instalacji, faktury/umowa net-billing, pomiary regulacji/rozruchu i obiegu chłodzenia, pilotaż EMS oraz odbiór elektryczny. Rozbudowa profili dachów, pełne RCE/taryfy i degradacja magazynu pozostają jawnymi rozszerzeniami modelu.

Cykliczny pipeline, produkcyjny endpoint JSON, formularz/API, monitoring i publikacja wymagają wyboru środowiska oraz odrębnej akceptacji użytkownika zgodnie z pierwotnym zakazem wdrożenia. `noindex,nofollow` prototypów pozostaje. Nie deklarujemy przeprowadzenia pentestu, testów na fizycznym telefonie lub wszystkich kryteriów WCAG. Bez push, merge i publikacji na ampower.pl.

Rzeczywisty odczyt przy końcowej kontroli: **78% limitu pięciogodzinnego, 97% tygodniowego**. Odnowienia **25.10.2026 12:31:17 CET** i **01.11.2026 07:31:17 CET**. Bez resetów, dopłat, agentów i samodzielnej zmiany modelu.
