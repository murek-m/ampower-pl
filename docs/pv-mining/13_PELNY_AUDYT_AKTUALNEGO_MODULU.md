# AMPOWER PV Mining — pełny audyt aktualnego modułu

**Data: 25.10.2026. Stan kodu: `db9f2ae`, gałąź `feat/pv-mining`.**

## 1. Werdykt

**Gotowy do demonstracji i dalszych testów lokalnych; niegotowy do publikacji jako kompletna usługa dla klienta.** Interfejs jest spójny wizualnie i responsywny w sprawdzonej przeglądarce. Wspólny silnik A/B uwzględnia nadwyżki, koszt alternatywny energii, ograniczenia baterii, koszty inwestycji i przyszłe zmiany wydobycia. Usunięto ważne błędy poprzedniego audytu. Pozostają jednak potwierdzone problemy obsługi, interpretacji zwrotu, przechowywania danych oraz braki oferty i procesu kontaktowego.

Nie znaleziono podstaw do zapewniania klienta o atrakcyjnym zysku. Poprawa prezentacji powinna ułatwiać zrozumienie wyniku, także niekorzystnego, bez zmieniania założeń na sztucznie korzystniejsze.

## 2. Zakres, metoda i granice

Audyt obejmuje **lokalne prototypy PV Mining: stronę wyboru, wariant A i B**, ich kod, silnik, lokalne dane, aktualizator i przygotowanie do integracji z ampower.pl. Nie jest ponownym pełnym audytem całej działającej witryny ampower.pl, jej Search Console, DNS, panelu Squarespace, backendów innych usług ani rachunków klientów.

Wykonano:

- przegląd kodu formularzy, obliczeń, walidacji, CSV, pamięci sesji, wykresów, builda i workflow;
- uzupełniające próby w przeglądarce: suwak i pole PV, odświeżenie, zakładki z klawiatury, wybór modelu, tabela przy 320 px, błędne pole w zwiniętym formularzu;
- odtwarzalne próby silnika i modułów: przejściowy zwrot, walidacja tekstu katalogu, reset uszkodzonego zapisu sesji;
- kontrolę zgodności źródeł z lokalnym buildem: wszystkie dziewięć porównanych plików zgodne bajtowo, zapisano SHA-256;
- konsolidację wcześniejszego odbioru napraw i przeglądu rozmiarów 320, 390, 768, 1366 i 1440 px.

Nie powtarzano pełnej zielonej macierzy testów ani 81 symulacji, ponieważ kod aplikacji od `db9f2ae` się nie zmienił. **266/266, w tym 47 testów PV, to wynik wcześniejszego odbioru tego samego kodu**, a nie nowy przebieg wykonany teraz. Nowe próby rozszerzają pokrycie i ujawniają przypadki, których tamten zestaw nie zabezpieczał.

Nie przeprowadzono testów fizycznych telefonów, Safari/iOS, czytnika ekranu, płatności, wysyłki e-mail, pentestu ani pilotażu instalacji elektrycznej. Ceny sklepów nie zostały ponownie potwierdzone u sprzedawców. Raport nie jest certyfikatem zgodności ani potwierdzoną ofertą instalacyjną.

### Dowody

- [Bieżące próby i hashe](qa/full-audit-current/probes.json), [skrypt odtworzenia](qa/full-audit-current/probes.mjs).
- [Bieżące próby przeglądarkowe](qa/full-audit-current/browser.json).
- [Pole PV i suwak](qa/full-audit-current/pv-range-mismatch.jpg), [tabela mobilna](qa/full-audit-current/mobile-table.jpg), [błąd zwiniętego formularza](qa/full-audit-current/collapsed-error.jpg).
- [Poprzedni odbiór napraw](11_NAPRAWY_PO_AUDYCIE.md), [jego testy](qa/audit-fixes/node-tests.txt), [przegląd klienta](12_PRZEGLAD_OCZAMI_KLIENTA.md).

Odtworzenie nowych prób: `node docs/pv-mining/qa/full-audit-current/probes.mjs`. Skrypt zapisuje wyłącznie dowód w katalogu audytu; nie aktualizuje danych rynkowych aplikacji. Przykład ceny ASIC 100 zł w próbie jest sztucznym przypadkiem testowym, a nie ofertą.

## 3. Macierz gotowości

| Obszar | Ocena | Wniosek |
|---|---|---|
| Wygląd na komputerze | Dobry dla prototypu | Formularz obok wyników, spójna identyfikacja |
| Telefon i tablet | Układ poprawny, ścieżka za długa | Brak przepełnienia całej strony w zbadanych widokach; kontakt daleko |
| Wariant prosty | Wymaga uproszczenia | Nadmiar szczegółów, klient proszony o nieznany kosztorys |
| Dostępność | Częściowa | Etykiety i zakładki działają; dwa nowe błędy fokusu |
| Obliczenia | Użyteczny model scenariuszowy | Naprawione kontrprzykłady; nowa uwaga o przejściowym zwrocie |
| Kosztorys | Uczciwie niepełny | Brak arbitralnych 4000 zł, ale brak wyceny AMPOWER |
| Ceny i katalog | Do analizy hipotetycznej | Brak potwierdzonych ofert końcowych z dostawą |
| Aktualizacja rynku | Adapter działa, proces nieuruchomiony | Ręczne staging; brak cyklicznej publikacji |
| Prywatność | Obliczenia lokalne; retencja do poprawy | CSV w IndexedDB może pozostać po zamknięciu sesji |
| Bezpieczeństwo | Podstawowe zabezpieczenia, dalsze utwardzenie | Niespójne kodowanie tekstu katalogu do HTML |
| Wydajność | Niewielki statyczny pakiet | Worker i limit CSV; brak pomiarów realnego telefonu/CWV |
| SEO i publikacja | Celowo prototypowe | `noindex,nofollow`, brak docelowej integracji i metadanych |
| Pozyskanie zapytania | Szkic działa | mailto nie jest formularzem z potwierdzeniem odbioru |

## 4. Potwierdzone problemy i plan napraw

P1: rozwiązać przed publikacją klientom. P2: istotna poprawka jakości lub odporności. P3: porządkowanie. Brak stwierdzonego P0 nie oznacza przeprowadzenia pentestu.

### F01 — P1: komunikat o zwrocie nie wyróżnia późniejszego powrotu do straty

**Kod:** `pv-mining/engine.js:309` (pierwsze przekroczenie zera), `pv-mining/app.js:124` i `:128` (werdykt i zielona karta).

**Odtworzenie:** uruchomić `probes.mjs`: 10 kWp, S21, sztuczna cena 100 zł, infrastruktura 0 zł, kurs 900000 PLN/BTC, spadek kursu 50% rocznie, 5 lat pracy i 10 lat analizy. Wszystkie te liczby są założeniami próby odporności.

**Dowód:** `payback=1`; wynik po roku **+1888,24 zł**, po 3 latach **−1037,38 zł**, końcowy **−2768,95 zł**. Kod nadal wybiera „Możliwy zwrot przy przyjętych założeniach” i pozytywny kolor. Tabela i wykres pokazują późniejszą stratę, ale główny komunikat jej nie wyróżnia.

**Wpływ:** klient może odczytać pierwsze odzyskanie nakładu według wyceny BTC jako trwałą opłacalność. Samo wyznaczenie pierwszego przekroczenia nie jest błędem arytmetycznym; problem dotyczy interpretacji i hierarchii komunikatów.

**Naprawa i odbiór:** osobno pokazać pierwsze przekroczenie zera, późniejszy powrót do straty i wynik na końcu horyzontu. W takim przypadku nagłówek ma ostrzegać o przejściowym zwrocie. Zachować osobny zwrot gotówkowy i wycenę portfela; dodać regresję dla sprzedaży i trzymania BTC.

### F02 — P1: brak kosztorysu blokuje ścieżkę początkującego klienta

**Kod:** `app.js:25–26`, `:124–129`, `:135`. **Dowód:** domyślna karta „Najpierw uzupełnij kosztorys”. Klient nie zna kosztu zabezpieczeń, montażu ani wentylacji.

**Naprawa:** pozostawić wyniki energetyczne i operacyjne, z komunikatem „Pełny koszt i zwrot ustalimy po sprawdzeniu instalacji” oraz przyciskiem wyceny. **Odbiór:** bez wpisywania nieznanych cen można przygotować zapytanie; zwrot nadal pozostaje nieobliczony. Nie zastępować braków zerami ani domyślnymi 4000 zł.

### F03 — P1: kontakt zbyt daleko, skrót wyników zaczyna od katalogu

**Kod:** `app.js:36`, `style.css:12`. **Dowód wcześniejszy, ten sam kod:** A przy 390×844 ma 9197 px wysokości; przycisk zapytania na y≈8958. „Przejdź do wyników” trafia przed siedem modeli ASIC.

**Naprawa:** wynik i kontakt przed szczegółami; katalog jako opcjonalne rozwinięcie. **Odbiór:** po skrócie widoczne podsumowanie, a rozpoczęcie wyceny dostępne obok niego. Nie wymagać znajomości modeli koparek przed zrozumieniem wyniku.

### F04 — P2: pole PV i suwak pokazują różne wartości

**Kod:** `app.js:23`, `:81`. **Odtworzenie:** wpisać 40 w polu mocy PV. Pole ma maksimum 100, suwak 30; DOM: pole `40`, suwak `30`.

**Wpływ:** dwa elementy opisujące tę samą instalację przeczą sobie. **Naprawa:** wspólny zakres lub jawny tryb wartości powyżej zakresu suwaka. **Odbiór:** każda dozwolona wartość ma spójną reprezentację, również po odtworzeniu sesji.

### F05 — P2: odświeżenie gubi najnowsze parametry i potencjalnie dopiski

**Kod:** `app.js:72–89`, `session.js:27`. Stan zapisuje się przy nawigacji aplikacji i operacjach CSV, nie po zwykłych zmianach pól i szkicu.

**Odtworzenie:** zmienić moc z zapisanych 10 na 40 i odświeżyć bez przejścia A/B. Wraca 10. **Naprawa:** ograniczony częstotliwością zapis zmian lub jawna informacja o niezapisanym stanie. **Odbiór:** odświeżenie zachowuje ostatnią poprawną konfigurację i dopiski; awaria magazynu lokalnego daje zrozumiały komunikat.

### F06 — P2: mobilne „Przejdź do pola” nie rozwija formularza

**Kod:** `app.js:93`, `style.css:12`. **Odtworzenie:** na 320 px wpisać kurs BTC=0, zwinąć parametry, kliknąć „Przejdź do pola”.

**Dowód:** panel nadal `display:none`, pole ma wysokość 0, fokus pozostaje na przycisku. **Naprawa:** rozwinąć panel mobilny, odpowiednią zakładkę i details, potem ustawić fokus. **Odbiór:** pole widoczne, aktywne i możliwe do poprawienia bez szukania go ręcznie.

### F07 — P2: utrata fokusu po wyborze koparki klawiaturą

**Kod:** `app.js:47`, `:128–137`. **Odtworzenie:** aktywować kartę S21 Pro klawiszem Enter. Wybór zmienia się prawidłowo, lecz ponowne `innerHTML` usuwa aktywny przycisk; `document.activeElement` staje się BODY.

**Naprawa:** zachować stabilny element albo odtworzyć fokus po renderze. **Odbiór:** Enter/Spacja zachowuje fokus na wybranej karcie, a Tab prowadzi logicznie dalej. Zakładki Instalacja/Mining/Ekonomia poprawnie obsłużyły strzałkę w osobnej próbie.

### F08 — P2: szkic zawiera techniczne wartości i niepotwierdzony budżet

**Kod:** `app.js:12`, `:153`, `:157`. **Dowód:** „Magazyn: none” oraz „Budżet: 30000 PLN” z domyślnego, zwiniętego ustawienia, bez deklaracji klienta.

**Naprawa:** polskie nazwy stanu magazynu; budżet „do ustalenia” albo oznaczenie wartości przykładowej do potwierdzenia. **Odbiór:** treść nie przypisuje klientowi decyzji, których nie podjął; wszystkie warianty `none/existing/new` mają polski opis.

### F09 — P2: osierocone profile CSV mogą pozostać w IndexedDB

**Kod:** `session.js:3–37`. **Dowód z kodu:** profil jest trwały w IndexedDB, jego identyfikator przechowywany tylko w sessionStorage; usuwanie dotyczy aktualnego `csvId`. Nie ma TTL ani sprzątania innych rekordów. Po zakończeniu sesji nowa karta może nie znać identyfikatora starego profilu, więc jej reset go nie usuwa.

**Wpływ:** dane energetyczne pozostają lokalnie dłużej, niż użytkownik może się spodziewać, i zajmują miejsce. To nie jest dowód wycieku do internetu. **Naprawa:** określić czas retencji, sprzątanie i zakres przycisku usuwania; uwzględnić wiele aktywnych kart. **Odbiór:** da się usunąć wszystkie zachowane profile tego modułu, także po zakończeniu poprzedniej sesji, bez niespodziewanego kasowania aktywnego importu innej karty.

### F10 — P2: reset nie radzi sobie z uszkodzonym JSON sesji

**Kod:** `session.js:34–37`, `app.js:45`. **Dowód jednostkowy:** `probes.mjs` podaje atrapę magazynu z `{broken-json`; `clearSession()` rzuca wyjątek przed `removeItem`. Nie modyfikowano rzeczywistej pamięci przeglądarki.

**Naprawa:** reset musi tolerować błędny format, usunąć niepoprawny klucz i poinformować o ewentualnym problemie z kasowaniem profilu. **Odbiór:** odzyskanie działania bez narzędzi deweloperskich.

### F11 — P2: niespójne kodowanie tekstów katalogowych do HTML

**Kod:** `data-loader.js:13–17`, `app.js:36` oraz `:134` dla hałasu. Walidator dopuszcza markup w nazwie, a lista wyboru wstawia `m.name` i `m.variant` bez funkcji `esc`. Pole hałasu także nie ma pełnej walidacji/kodowania w tym miejscu.

**Dowód:** inertny tekst `<b>TEST-MARKUP</b>` przechodzi walidację; nie wykonywano skryptu ani ataku. Aktualny katalog jest lokalnym plikiem repozytorium. Nie wykazano zdalnej podatności dostępnej dla zwykłego użytkownika; ryzyko wzrośnie przy automatycznym zasilaniu katalogu z zewnętrznych źródeł.

**Naprawa:** konsekwentne kodowanie każdej wartości tekstowej lub użycie `textContent`, walidacja typów i długości. **Odbiór:** tekst zawierający znaczniki wyświetla się jako tekst, a żadne pole katalogu nie tworzy elementów HTML.

### F12 — P2: prosty wariant za techniczny, część opisów zbyt długa

**Kod:** `app.js:129–136`, `:32`, `simple.html:1`, `advanced.html:1`. NPV, CAPEX, OPEX, cash flow, rozbudowane depozyty i zerowa sekcja baterii trafiają do początkującego odbiorcy. Zamknięta lista RCEm na 390 px obcina rok; komunikat awarii każe klientowi wykonać `npm run pv:dev` (`app.js:173`).

**Naprawa:** prosty język, rozwijane szczegóły, pełny rok obok pola i docelowy komunikat awarii. **Odbiór:** klient rozumie korzyść operacyjną, brak pełnego kosztu i następny krok bez znajomości terminologii programistycznej.

## 5. Ekonomia i ograniczenia modelu

Wzór wydobycia opiera się na TH/s × 10¹², czasie, trudności i 2³² oraz nagrodzie i opłatach. Odejmowane są prowizje i dostępność hashowania. Pobór energii i wydobycie są rozdzielone podczas rozruchu. Bilans AC i granice SOC są sprawdzane w dispatch. PV nie jest utożsamiana z nadwyżką.

Model porównuje rachunki wariantu z ASIC i bez niego, a nowy magazyn dodatkowo z PV bez zakupu baterii. Zapis depozytu ma miesiące dostępności, zużycie i zwroty. Braki kosztów blokują zwrot. Wartość BTC i gotówka są rozdzielone. Pełna zgodność z konkretną fakturą/umową nie została potwierdzona — nie jest to audyt rozliczenia sprzedawcy energii.

Ograniczenia jawne lub wymagające lepszego objaśnienia:

- Planista wybiera spośród ograniczonej rodziny planów, a nie globalnego optimum. Ocena horyzontu przed kosztami stałymi nie gwarantuje dodatniego wyniku każdego roku.
- Profil bazowy to Wrocław 2023 i syntetyczne zużycie. Lokalizacja „inna” nie pobiera nowego profilu. Azymut i nachylenie nie są swobodnie symulowane. Używać danych CSV dla konkretnej instalacji.
- RCE to ręczny scenariusz stałej ceny, nie szereg cen interwałowych. RCEm 2025 jest zapisane w tablicy w `engine.js:124`; aktualizator rynku nie aktualizuje tej tablicy.
- Godzinowy profil nie pozwala weryfikować sekundowej pętli EMS ani dokładnie odtworzyć każdego zachmurzenia. Parametry 9/15/10 minut nie zmieniają rozdzielczości danych wejściowych.
- Symulowana jest pełna moc lub wyłączenie. Brakuje potwierdzonych krzywych mocy/hashrate dla underclockingu każdego ASIC.
- `prepareYears` powtarza długość profilu i dodaje `y*profile.hours`, więc przyszłe lata nie są mapowane indywidualnie według lat przestępnych. Przed analizą dokładnych dat halvingu i kalendarzowego cash flow należy określić sposób mapowania roku referencyjnego.
- Brak modelu degradacji pojemności i wymiany baterii, wspólnych ograniczeń falownika, różnic fazowych, harmonogramu realnych awarii i ceny odsprzedaży urządzenia. Opłaty firmware i utrzymanie są założeniami, nie potwierdzonymi kosztami każdej konfiguracji.
- Prywatne klucze portfela nie są potrzebne kalkulatorowi i nie powinny trafiać do zapytania.

Wcześniejsze 81 scenariuszy po poprawkach nie wykazało zwrotu przy ich założeniach. Nie jest to dowód, że mining nigdy nie ma sensu. Rzetelny dobór wymaga realnych nadwyżek, cen zakupu, rozliczenia energii i kosztorysu.

## 6. Ceny, kosztorys i dane

**Do zatwierdzenia przed ofertą klientowi:** dokładny SKU, stan urządzenia, dostępność, VAT, dostawa, import, gwarancja, zasilanie, hałas i zgodność firmware. Wszystkie wpisy katalogu mają status końcowej oferty niepotwierdzonej. Mechanizm wyróżnienia zakupowego już to uwzględnia.

4000 zł nie jest obecnym domyślnym kosztorysem. Pomiar i EMS są wymaganymi funkcjami; zgodne istniejące elementy nie powinny być kupowane ponownie. Kwoty robocizny i uruchomienia musi dostarczyć AMPOWER. Pozostawić status „do wyceny”, dopóki nie istnieje konkretna wycena materiałów i pracy.

Snapshot rynku w aplikacji pochodzi z **24.10.2026**, a nie z chwili audytu. Etykieta daty jest widoczna. Adapter umie przygotować nowy pakiet, lecz wcześniejsze próbne pobranie nie oznacza zastosowania go we frontendzie. Kryterium siedmiu dni jest wspólne dla rynku i cen urządzeń; docelowo ustalić różne okresy ważności, bez sugerowania bieżącego kursu na podstawie tygodniowego snapshotu.

Walidacja i zatrzymanie na błędach danych są obecne. Brakuje produkcyjnego procesu zatwierdzania ofert oraz monitoringów aktualności/awarii. Zalecane osobne daty rynku, profilu, energii i oferty, identyfikator zestawu oraz jednoznaczne oznaczenie ręcznych nadpisań.

## 7. Prywatność, bezpieczeństwo i dostępność

Frontend pobiera trzy lokalne JSON-y; obliczenia i CSV wykonuje lokalnie, używa lokalnych fontów. W przeglądanym module nie ma kodu analityki zewnętrznej ani formularza przesyłającego dane do serwera. Mailto przekazuje treść do programu pocztowego dopiero przy działaniu użytkownika. Nie jest to gwarancja braku analityki po późniejszym osadzeniu w innej witrynie.

Ważne zabezpieczenia już obecne: limit 8 MB przed odczytem, worker parsera, rygorystyczne numeryczne CSV, kontrola jednostek i interwałów, walidacja URL HTTPS, dat i parametrów, `noopener noreferrer` w źródłach, brak sekretów API w sprawdzanych modułach. Budowanie korzysta z listy publicznych plików, bez backendu i dokumentacji.

F09–F11 trzeba domknąć. Nagłówki bezpieczeństwa i CSP należy ocenić na wybranym hostingu; lokalny Python HTTP nie jest dowodem konfiguracji produkcji. Przegląd źródeł nie zastępuje skanowania całej historii repozytorium ani pentestu.

Dostępność: widoczne sprawdzone pola miały nazwy, zakładki obsługują strzałki, wykres energii ma tabelę, błędy mają komunikaty ARIA, istnieje preferencja ograniczenia ruchu i skip link. Na 320 px tabela ma 687 px szerokości przewijania w kontenerze 239 px, bez rozszerzenia dokumentu. Zapewnić widoczną wskazówkę przewijania i sprawdzić obsługę tabel klawiaturą w różnych przeglądarkach; sam `tabIndex=-1` kontenera nie rozstrzyga zachowania wszystkich przeglądarek. Potrzebny test czytnika ekranu, powiększenia tekstu i fizycznej klawiatury ekranowej. Nie deklarować pełnego WCAG na podstawie tego audytu.

## 8. Wydajność, SEO i operacje

Aktualny cały katalog podglądu: **508334 bajty (~496 KiB)**, przed kompresją transportową; zawiera również warianty stron i fonty, więc to nie jest ilość pobrana przy pojedynczym wejściu. Worker ogranicza blokowanie interfejsu i przerywa nieaktualne obliczenia. Wcześniejszy pomiar 265/720 ms dotyczył samego silnika na lokalnym komputerze, nie telefonu ani Core Web Vitals.

Przed publikacją mierzyć start na średnim telefonie i wolniejszym łączu, największy dopuszczony CSV, szybką edycję wielu pól oraz zamykanie/otwieranie strony. `no-store` dla wszystkich JSON-ów zapewnia odczyt przy każdym wejściu, lecz docelowo można wersjonować ciężki niezmienny profil i osobno odświeżać rynek.

Strony mają tytuły, język polski, viewport i świadome **`noindex,nofollow`**. Nie usuwać tej blokady przed zgodą na publikację. Docelowo przygotować opis meta, adres kanoniczny, linkowanie ze Smart Home & Energy, sitemapę i podgląd udostępniania. Nie oceniano pozycji w wyszukiwarce ani indeksacji produkcyjnej domeny.

Workflow `pv-mining-data-review.yml` ma ręczne uruchomienie, uprawnienia odczytu i zapis artefaktu; nie publikuje. Aktualizator ma timeout i walidację, zachowuje dotychczasowe dane. Brakuje zatwierdzonego endpointu produkcyjnego, harmonogramu, alertów do opiekuna i procedury przywrócenia ostatniej wersji wdrożenia. Nie należy nazywać tego już działającą cykliczną usługą.

W tym audycie koszt nowych płatnych usług wynosi **0 zł — niczego nie uruchomiono ani nie kupiono**. Miesięcznego kosztu produkcji nie da się potwierdzić bez wyboru hostingu, liczby uruchomień, ruchu i kanału formularza. Nie wpisywać bezwarunkowego „0 zł/mies.” jako gwarancji.

## 9. Zamknięte ustalenia poprzedniego audytu

Według kodu `db9f2ae` i zachowanych dowodów: E01 (fikcyjna korzyść przy 0 BTC), E02 (wykazany stratny plan), C01 (domyślne 4000 zł), U01 (skala/import), U02 (nieaktualny szkic), U03 (przejście A/B), V01/D02 (walidacja), A01/A02 (wybrane kontrasty i tabela), U04 (zerowa oś), E03 (zwrot po życiu ASIC) i P01 (CSV/worker) otrzymały poprawki. Nie przedstawiać historycznych błędów jako nadal otwartych w niezmienionej postaci.

F01 to odrębny przypadek interpretacji zwrotu; F05 dotyczy odświeżenia, nie naprawionego przejścia A/B; F06 dotyczy zwiniętego panelu mobilnego, nie samej ukrytej zakładki. O01 pozostaje częściowo operacyjnie otwarte: istnieje adapter i ręczny workflow, ale nie uruchomiona cykliczna publikacja.

## 10. Kolejność napraw i bramka publikacji

1. **Wiarygodność decyzji:** F01, jednoznaczne statusy ceny i braków kosztów, weryfikacja konkretnej oferty i cennika AMPOWER.
2. **Ścieżka klienta:** F02–F03, F08 i F12. Krótki formularz → wynik → zapytanie → szczegóły.
3. **Obsługa i odporność:** F04–F07, F09–F11, regresje opisanych przypadków.
4. **Odbiór:** prawdziwy Android/Chrome, iPhone/Safari, klawiatura/czytnik, powiększenie tekstu, tabele, CSV i reset, test zapytania do zatwierdzonego odbiorcy.
5. **Uruchomienie operacji:** wybrany hosting i adres modułu, publikacja danych po walidacji, monitoring i rollback, treść prywatności zgodna z rzeczywistym zapisem i kanałem kontaktu.
6. **Odrębna zgoda właściciela na produkcję.** Dopiero wtedy integracja, zmiana indeksowania i wdrożenie. Pilotaż sprzętowy pozostaje osobnym odbiorem przed oferowaniem działającej automatyki ASIC.

Raport oraz dowody zapisano lokalnie. Nie zmieniano kodu aplikacji, danych produkcyjnych, main, nie wykonano push, merge ani publikacji. Nie wysyłano zapytań do sprzedawców. Zachowano wcześniejsze raporty i pliki użytkownika.
