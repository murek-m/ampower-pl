# AMPOWER PV Mining — pełny audyt prototypów i plan poprawek

**Aktualizacja po zleceniu napraw:** [Wynik napraw i dowody odbioru](11_NAPRAWY_PO_AUDYCIE.md). Poniżej zachowano ustalenia dla stanu przed poprawkami. Skrypt `qa/audit/reproduce.mjs` opisuje stare kontrprzykłady; bieżące testy regresji są w `tests/pv-mining-audit.test.js` i nie nadpisują historycznych dowodów.

**Data:** 24–25.10.2026. **Stan badany:** `feat/pv-mining`, commit `78b38b5e3f481d814a5854724980429069a1f478`. **Werdykt:** prototyp nadaje się do dalszego rozwoju, ale wymaga napraw modelu ekonomicznego przed użyciem do doradzania klientom. Nie rekomenduję publikacji w obecnym stanie.

## 1. Zakres i znaczenie wyniku

Audyt obejmuje lokalną stronę wejściową oraz warianty A (`simple.html`) i B (`advanced.html`), wspólny silnik, dane, kosztorys, formularz zapytania, dostępność, mobilność, wydajność, prywatność i przygotowanie do integracji z ampower.pl. To kontynuacja audytu zamówionego po przedstawieniu prototypów. Nie jest to nowy pełny crawl całej produkcyjnej domeny ani audyt danych Google Search Console. Ustalenia dotyczące produkcyjnego hostingu pochodzą z [audytu 24.10](01_AUDYT.md); nie przedstawiam ich jako nowego odczytu panelu produkcji.

Wykonano przegląd źródeł i celowane próby obalające założenia modelu, kontrolę przeglądarkową oraz lokalny build. Zachowano wcześniejsze wyniki testów: **250 testów repozytorium, z czego 31 PV Mining**, opisane w [etapie 3](07_TESTY.md). Nie powtarzano całej zielonej macierzy. Znalezione niżej przypadki pokazują luki jej pokrycia; liczba zaliczonych testów nie dowodzi kompletnej poprawności ekonomicznej.

**Nie zmieniono aplikacji, silnika, danych ofertowych ani produkcji.** Zapisano raport i dowody. `main`, pozostałe worktree oraz istniejące zmiany pozostały nienaruszone. Nie wykonano push, merge, wdrożenia, zakupów ani wysyłki wiadomości.

Priorytety: **P1** — blokuje wiarygodne doradztwo lub publikację kalkulatora; **P2** — poprawić przed odbiorem publicznego MVP; **P3** — usprawnienie utrzymania lub późniejszy rozwój. „Potwierdzony” oznacza próbę wykonania albo jednoznaczny odczyt kodu; „ograniczenie” oznacza funkcję świadomie niezaimplementowaną; „do weryfikacji” nie jest zarzutem wykrytej awarii.

## 2. Najpilniejsze ustalenia

| ID | Priorytet | Problem | Status dowodu |
|---|---|---|---|
| E01 | P1 | Mining otrzymuje korzyść ok. 842 zł mimo zerowego wydobycia | Odtworzony w silniku |
| E02 | P1 | Sterowanie uruchamia ASIC mimo ok. 375 zł rocznej straty operacyjnej | Odtworzony kontrprzykład |
| C01 | P1 | Budżet 4000 zł nie ma rozpiski ani potwierdzonej ceny wykonania | Kod i kosztorys UI |
| D01 | P1 | Wyróżnienie urządzenia nie wymaga potwierdzonej, dostępnej oferty końcowej | Kod i katalog |
| U01 | P1 | Wykres i opis energii błędne przy zasilaniu ASIC z sieci | Silnik, DOM i kod SVG |
| U02 | P2 | Szkic zapytania pozostaje nieaktualny po zmianie parametrów | Przeglądarka |
| U03 | P2 | Przejście A → B gubi ustawienia | Przeglądarka |
| V01 | P2 | Ciche zmiany założeń oraz trudna obsługa błędów formularza | Silnik i przeglądarka |
| D02 | P2 | Zbyt słaba walidacja danych i dat z przyszłości | Próba wadliwego zestawu danych |
| A01 | P2 | Za mały kontrast i bardzo drobne dopiski | Kolory DOM i obliczenie kontrastu |
| A02 | P2 | Brak dostępnej tabeli miesięcznej energii | Kod HTML/SVG |
| U04 | P2 | Wykres zerowego wyniku generuje `NaN` | Bezpośrednia próba funkcji |
| E03 | P2 | Werdykt nie wyróżnia zwrotu po zakończeniu pracy urządzenia | Silnik i szablon werdyktu |
| O01 | P2 | Automatyczna aktualizacja i produkcyjny kanał danych nie działają | Jawne ograniczenie |
| P01 | P2/P3 | Import przed kontrolą rozmiaru; kolejka obliczeń bez anulowania | Kod; wydajność telefonu niezmierzona |

## 3. Ekonomia i sterowanie — błędy wymagające naprawy

### E01 — inny sposób sterowania baterią w wariancie odniesienia

**Miejsce:** `pv-mining/engine.js:180`, `:191`, `:238`, `:259`, `:270`.

**Odtworzenie:** PV 20 kWp, istniejący magazyn 20 kWh, polityka `economic`, dostępność hashowania 0%, eksport 1 zł/kWh, utrzymanie i EMS 0, S21 151T, horyzont 3 lata. Pozostałe wartości według `normalize`. Skrypt: `node docs/pv-mining/qa/audit/reproduce.mjs`.

**Wynik:** wariant bez ASIC zasila dom z baterii przez 0 kWh; wariant z niedziałającym ASIC — 2730,27 kWh. ASIC zużywa **0 kWh**, wydobywa **0 BTC**, ale otrzymuje **841,88 zł korzyści** w pierwszym roku.

**Przyczyna:** wariant odniesienia ocenia eksport po cenie nominalnej × współczynnik depozytu, natomiast przebieg „z ASIC” otrzymuje krańcową wartość z rejestru depozytu. Ten sam magazyn podejmuje inne decyzje niezależnie od pracy koparki. Zysk z innego sterowania baterią zostaje przypisany miningowi. Ostrzeżenie, że EMS jest heurystyką, nie usuwa tego błędu porównania.

**Naprawa:** przyjąć ten sam cel ekonomiczny, informacje, ograniczenia i sposób oceny eksportu dla obu wariantów. Ewentualną korzyść modernizacji EMS pokazywać osobno. Kontrolować również lata po zakończeniu użyteczności ASIC.

**Odbiór:** przy zerowym wydobyciu, zerowych dodatkowych przepływach ASIC i zerowym dodatkowym OPEX przyrost korzyści miningu wynosi 0 z tolerancją numeryczną. Wyniki baterii w obu identycznych wariantach są identyczne. Test obejmuje polityki `home` i `economic` oraz koniec życia ASIC.

### E02 — cena krańcowa 1 kWh zastosowana do całej energii koparki

**Miejsce:** `engine.js:242`–`:246` i decyzja `:200`–`:203`.

**Odtworzenie:** syntetyczny rok 8760 h: przez pierwsze 12 h doby PV 6 kW, dom 0; przez kolejne 12 h PV 0, dom 0,1 kW. Celowo słaby testowy ASIC 1 TH/s / 6000 W / koszt 0. Brak opłat, OPEX, rozruchu i bufora; dostępność 100%, eksport 0,25 zł/kWh, zakup i należność pokrywalna depozytem 1 zł/kWh, rok pracy i analizy. To kontrprzykład matematyczny, nie oferta urządzenia.

**Wynik:** 4380 h pracy; BTC wycenione na 25,91 zł; pogorszenie rachunku o 400,80 zł; **−374,89 zł korzyści operacyjnej**, mimo OPEX = 0. Wyłączenie ASIC zachowałoby wynik miningu równy 0.

**Przyczyna:** odebranie eksportowi 1 kWh może nie zmieniać wykorzystanego depozytu, jeśli saldo jest nadmiarowe. Odebranie tysięcy kWh już go zmienia. Stała krańcowa wartość z bazowego przebiegu nie jest poprawnym kosztem całego planu pracy.

**Naprawa:** oceniać rzeczywisty blok energii i jego wpływ na rachunek, iterować plan i rejestr depozytu albo zastosować jawnie ograniczoną optymalizację. Zapewnić porównanie z planem „ASIC wyłączony”. Samo przycięcie ujemnego wyniku do zera byłoby ukrywaniem błędu.

**Odbiór:** przy zerowych kosztach stałych plan rekomendowany jako ekonomiczny nie przegrywa z wyłączeniem ASIC w tym kontrprzykładzie. Testować progi wykorzystania depozytu, zwrot, wygaśnięcie, zerowy i ujemny eksport, import z sieci oraz baterię. Dodatnie wydobycie lub dodatni przychód BTC nie wystarcza jako warunek sukcesu.

### E03 — zwrot dopiero po pracy ASIC zależny od wyceny BTC

**Miejsce:** `engine.js:268`–`:277`, `app.js:69`, `:73`, `:78`, `:80`.

Próba: S21 151T, cena własna 10 000 zł, infrastruktura/OPEX/EMS 0, życie 1 rok, horyzont 10 lat, wzrost BTC 100% rocznie, historyczny eksport. Silnik zwraca zwrot w roku 5, mimo końca wydobycia po roku 1. Taka wycena portfela jest matematycznie możliwa, ale nie oznacza zwrotu z dalszej pracy urządzenia. UI pokazuje ogólny pozytywny werdykt; informacja o długości życia i metodzie wyceny jest rozproszona.

**Naprawa i odbiór:** bezpośrednio obok werdyktu wskazać „zwrot po zakończeniu pracy ASIC, zależny od założonego kursu zgromadzonych BTC”, jeśli `payback > lifetime`. Zachować oddzielny zwrot gotówkowy. Nie przedstawiać scenariusza kursowego jako prognozy.

### Wpływ na wcześniejsze raporty i symulacje

[Tabele etapu 4](09_AKTUALNE_SYMULACJE.md) i 81 rekordów JSON są archiwalnym wynikiem silnika sprzed tego audytu. E01 dotyczy wykazanej polityki ekonomicznej; nie dowodzi automatycznie, że każdy rekord z priorytetem domu ma ten sam błąd. E02 podważa ogólną wiarygodność wyboru godzin pracy także bez baterii. **Po naprawie trzeba przeliczyć całą macierz i porównać różnice**, zanim powstanie ranking lub materiał dla klienta. Niniejszy audyt nie zamienia starych liczb w poprawione wyniki.

## 4. Kosztorys: co oznacza 4000 zł i jak to poprawić

### C01 — budżet demonstracyjny nie jest wyceną instalacji

**Miejsce:** `app.js:10`, `:22`, `:23`, `:80`; `engine.js:29`, `:256`–`:258`.

4000 zł jest wpisaną domyślnie kwotą na osprzęt i uruchomienie. **Nie wynika z obliczenia kosztu skrzynki, liczników i robocizny.** Interfejs uczciwie nazywa ją przykładem, ale na jej podstawie od razu pokazuje kompletny budżet i okres zwrotu. Szczegółowe pozycje pozostają „do wyceny”. Nie ma podstaw, aby uznać tę kwotę za potrzebną albo wystarczającą dla konkretnej instalacji.

Nie ustalam w tym audycie nowej „prawidłowej” ceny robocizny AMPOWER. Cena zależy od istniejącego wyposażenia, obwodu, odległości, faz, sposobu sterowania i chłodzenia. Zmniejszenie ryczałtu bez rozpisania zakresu nie rozwiązuje problemu wiarygodności.

**Rekomendacja:** domyślnie kosztorys szczegółowy ze statusem „do wyceny”; tryb budżetowy tylko jako świadomie wybrany scenariusz. Wyróżniać, czy kwota jest ceną ofertową, kosztem istniejącego elementu, założeniem klienta czy nieznaną pozycją. Potwierdzenie istniejącego pomiaru/EMS powinno usuwać zakup, a nie domyślnie także koszt sprawdzenia i integracji.

| Pozycja do kosztorysu | Wymagana informacja | Reguła wyceny |
|---|---|---|
| ASIC i dostawa | dokładne SKU, stan, VAT, fracht/import, gwarancja | końcowy koszt dostawy do klienta; bez dublowania VAT |
| Rozdzielnica / obudowa | miejsce montażu, wyposażenie istniejące, liczba obwodów | ilości i ceny materiałów według projektu |
| Pomiar energii i mocy | model, liczba punktów, przekładniki, zgodność API/Modbus | funkcja obowiązkowa; zakup 0 tylko po potwierdzeniu zgodnego urządzenia |
| EMS i wykonanie poleceń | kontroler, komunikacja, interfejs ASIC, ewentualny element wykonawczy | oddzielić sprzęt, konfigurację i integrację |
| Obwód i zabezpieczenia | model ASIC, układ faz, trasa, długość, warunki ułożenia | projekt elektryczny; brak uniwersalnego zestawu zabezpieczeń |
| Wentylacja / hydro | bilans ciepła, hałas, miejsce, moc urządzeń pomocniczych | osobny kompletny zakres; hydro nie mieści się automatycznie w 30 W dodatku |
| Montaż, konfiguracja, odbiór | prace, pomiary, próby, dokumentacja, dojazd | cennik lub oferta AMPOWER zatwierdzona przez właściciela |
| Magazyn | istniejący / nowy, pojemność, moc, integracja | opcjonalny; osobna cena, bez stałych 20 tys. zł dla każdej pojemności |

**Odbiór:** nieznana wymagana pozycja blokuje ofertowy okres zwrotu; znany podzbiór ma etykietę „znana część kosztu”. Osprzęt, robocizna i opcje są oddzielne. Dla Hydro obieg, pobór pomocniczy i koszt wymagają jawnego uzupełnienia przed rekomendacją. Liczba ASIC nie może automatycznie oznaczać, że niezmieniony budżet infrastruktury wystarcza.

### Wrażliwość na sam budżet infrastruktury

Kontrolna symulacja starego silnika: PV 10 kWp, S21 151T za 6590 zł, brak baterii, dom 5000 kWh, historyczny eksport, pozostałe domyślne wartości. To **diagnostyka**, nie oferta ani poprawiona rekomendacja po E02.

| Budżet dodatkowy | Łączny CAPEX | Korzyść roku 1 | Wynik po 10 latach | Zwrot |
|---:|---:|---:|---:|---|
| 0 zł | 6590 zł | 254,52 zł | −9825,46 zł | brak |
| 1000 zł | 7590 zł | 254,52 zł | −10 825,46 zł | brak |
| 2000 zł | 8590 zł | 254,52 zł | −11 825,46 zł | brak |
| 4000 zł | 10 590 zł | 254,52 zł | −13 825,46 zł | brak |

Obniżenie budżetu o 1000 zł poprawia końcowy wynik dokładnie o 1000 zł, lecz w tej konkretnej próbie nie zapewnia zwrotu. Wariant 0 zł służy wyłącznie analizie wrażliwości — nie jest deklaracją bezpłatnej instalacji.

## 5. Interfejs, formularze i wykresy

### U01 — energia z sieci pokazana jak energia PV

**Miejsce:** `app.js:60`, `:70`, `:75`; `engine.js:222`, `:226`.

**Próba:** PV 0, limit importu ASIC 10 kW, BTC 10 mln zł, zakup 0,01 zł/kWh, S21. To celowo skrajny, dopuszczony scenariusz testowy. Roczna energia ASIC **23 406,72 kWh**, w całości z sieci. Maksimum miesięczne ASIC 1990,64 kWh, PV 0.

Skala wykresu uwzględnia tylko PV i spada do 1. Słupek ASIC otrzymuje wysokość ok. **308 135 jednostek SVG**, a wykres ma wysokość 230. `overflow:visible` umożliwia wychodzenie rysunku poza panel. Opis nadal mówi o udziale produkcji i mocy pozostałej po domu; pokazuje 0% mimo dużego poboru z sieci. Przy dodatniej PV licznik `energy/pv` również miesza źródła i przycina udział do 100%.

**Naprawa:** skala ze wszystkich rysowanych serii; miesięczne pola ASIC z PV / baterii / sieci; udział PV liczony tylko z energii odpowiedniego pochodzenia. Dom przez baterię nie powinien być graficznie przycinany do miesięcznej PV bez wyjaśnienia przeniesienia energii.

**Odbiór:** każdy słupek w zakresie osi, wszystkie współrzędne skończone, PV 0 nie powoduje przepełnienia. Wynik jasno podaje import ASIC i jego koszt. Suma rozłącznych źródeł odpowiada energii ASIC. Testować też przejście miesięcy i baterię.

### U02 — nieaktualny szkic zapytania

**Miejsce:** `app.js:42`–`:49`, `:54`, `:58`, `:85`–`:86`.

Przygotować zapytanie dla 10 kWp, zmienić pole na 20 kWp, poczekać na przeliczenie. Wyniki dotyczą 20 kWp, lecz treść zapytania nadal zawiera **„Moc PV: 10 kWp”**. Podobne ryzyko dotyczy modelu, baterii i budżetu. Nie wysyłano wiadomości.

**Naprawa i odbiór:** zapisać wersję założeń szkicu; po zmianie oznaczyć go jako nieaktualny i umożliwić bezpieczne odświeżenie. Zachować ręczne dopiski klienta. Kopiowanie/otwarcie poczty nie powinno bez ostrzeżenia korzystać ze starej konfiguracji. Przetestować zmianę modelu i importu CSV.

### U03 — A i B mają wspólny silnik, lecz oddzielny stan

**Miejsce:** odnośniki w `simple.html:1`, `advanced.html:1`; `app.js:10`.

Wariant A: ustawić 20 kWp i przejść „Zaawansowany”. Wariant B otwiera **10 kWp**. Wspólny moduł matematyczny nie zapewnia wspólnego stanu klienta.

**Naprawa i odbiór:** przełączanie widoku bez resetu albo wersjonowany stan sesji. Parametry finansowe i CSV nie powinny trafiać do query stringu. Określić świadomie czas przechowywania danych; zapewnić „wyczyść”. Po A → B → A te same wspólne założenia dają ten sam wynik; import CSV pozostaje dostępny albo klient otrzymuje wyraźne ostrzeżenie przed jego utratą.

### V01 — formularz pokazuje inne założenia niż silnik

**Miejsce:** `engine.js:8`, `:43`, `:45`; `app.js:15`, `:59`.

Potwierdzone: górny SOC 10%, rezerwa 95% pozostają w polach bez błędu i z komunikatem o zakończonym obliczeniu; silnik ustawia rezerwę na 10%. Puste zużycie domu wraca do 5000 kWh. Cena pokrywalna depozytem jest ograniczana do ceny zakupu bez synchronizacji pola. Zaokrąglenie liczby ASIC 1,5 → 2 występuje w `normalize`, ale **UI ma `step=1` i odrzuca tę wartość**; nie zaliczam jej do potwierdzonych przepuszczonych błędów UI.

Drugi problem: wpisać BTC = 0 w zakładce Mining, przejść do Instalacji. Komunikat „Sprawdź wartość: Kurs BTC/PLN” występuje przy wynikach, ale błędne pole pozostaje ukryte; brak `aria-invalid`, powiązania błędu i przejścia do pola.

**Naprawa i odbiór:** walidacja relacji SOC i cen przed obliczeniem; jawne założenie zastępcze przy brakujących danych; brak cichych korekt. Komunikat prowadzi do właściwej zakładki i pola, powiązany przez ARIA. Walidować tylko mające zastosowanie parametry lub jasno wyjaśniać blokadę. Nie przesuwać fokusu agresywnie przy każdym znaku podczas pisania.

### U04 — zerowy wykres wyniku

**Miejsce:** `app.js:61`. Bezpośrednie wywołanie funkcji dla CAPEX 0 i rocznych wyników 0 daje `max-min = 0`, a współrzędne SVG zawierają `NaN`. Odtworzono funkcję, nie pełny scenariusz klikany w UI.

**Naprawa i odbiór:** minimalna rozpiętość osi, czytelna linia zera; skończone współrzędne dla samych zer, identycznych wyników, dodatnich i ujemnych serii.

## 6. Dane, ceny i automatyzacja

### D01 — wiarygodność oferty nie wpływa na wyróżnienie wyniku

**Miejsce:** `app.js:66`–`:68`, `:72`, `:77`, `:79`; `data/models.json`.

Katalog miesza cenę obserwowaną bez dostawy, ceny z indeksu do potwierdzenia, budżet USD + VAT bez frachtu/cła oraz modele `sold out`. Filtr „najlepszy wynik” sprawdza znajomość ceny, kompletność kosztów i budżet, ale nie potwierdzenie dostępności ani końcowej ceny dostawy. Wiek danych daje ostrzeżenie niżej, nie odbiera możliwości wyróżnienia.

**Naprawa:** oddzielić katalog specyfikacji, hipotetyczny scenariusz i ofertę zakupu. Ustrukturyzować dokładne SKU/stan/kraj/walutę/VAT/dostawę/gwarancję/dostępność/datę/cenę końcową. Brak kosztu to wartość nieznana, nie zero. Własna cena powinna mieć własną datę i status źródła.

**Odbiór:** urządzenie niedostępne lub z niepotwierdzoną ceną nie otrzymuje oznaczenia rekomendacji zakupowej. Może pozostać w wyraźnie opisanym porównaniu hipotetycznym. TTL blokuje rekomendację zakupową, nie analizę jawnie historyczną. Bez kontaktowania sprzedawców w ramach tego audytu.

### D02 — walidator przepuszcza niewiarygodne wartości

**Miejsce:** `data-loader.js:2`–`:8`, `:18`–`:20`.

Zestaw testowy z datą rynku **2099-01-01**, BTC **1e99**, efektywnością modelu **999 J/TH** niespójną z W/TH oraz profilem 8760 h przesuniętym o 20 dni przeszedł walidację. Data z przyszłości nie jest oznaczana jako nieaktualna. To wykazanie luk walidatora; nie twierdzenie, że bieżący plik ma te wartości. Przesunięty profil wbudowany nie przechodzi przez bardziej rygorystyczny parser CSV.

**Naprawa i odbiór:** schemat z wersją, jednostkami, zakresem dat, granicami roku profilu, relacją W/TH i J/TH, dopuszczalnymi zakresami i kontrolą dużych zmian. Przyszła data poza tolerancją zegara blokuje dane. Brakujące metadane mają jawny status. Dodatkowo walidować format ID modeli i bezpiecznie kodować wszystkie wartości w atrybutach HTML; obecnie ID trafiają do `data-model`/`data-active` bez takiego kodowania. To ryzyko przy przyszłym zewnętrznym zasilaniu katalogu, nie potwierdzony atak na obecne lokalne dane.

### O01 — plan aktualizacji nie jest działającą usługą

`loadDataset` czyta względne pliki JSON. Brak aktywnego pipeline aktualizacji i produkcyjnego endpointu. Daty 24.10.2026 są częściowo wpisane w HTML i `app.js:34`, `:79`, więc samo podmienienie danych nie zaktualizuje wszystkich etykiet.

**Przed publikacją:** wdrożyć osobno zatwierdzony kanał danych: adaptery → walidacja → ostatni poprawny snapshot → wersja/manifest → statyczny endpoint → kontrola wieku w UI. Testować timeout, 429/503, błędny format, niepełny update i rollback. Nie mieszać grup danych z niezgodnymi wersjami. Data obserwacji, data pobrania i termin ważności mają pochodzić z danych, nie tekstu strony. Klucze pozostają poza frontendem.

Koszt 0 zł/miesiąc z [raportu architektury](03_MODEL_I_ARCHITEKTURA.md) pozostaje **warunkowym wcześniejszym szacunkiem**, nie odczytem rachunku ani nowo zweryfikowanym cennikiem usług. Ten audyt nie uruchomił płatnej infrastruktury. Przed wyborem hostingu ponownie sprawdzić warunki komercyjnego użycia, limity transferu/Actions/API i koszty formularza. Ręczna weryfikacja ofert oraz obsługa błędów nadal kosztują czas.

## 7. Dostępność, mobilność i UX

### A01 — kontrast i czytelność

**Miejsce:** `style.css:2`, reguły mobilne `:5`–`:6`.

| Element | Kolory tekst / tło | Rozmiar w próbie 390 px | Kontrast |
|---|---|---:|---:|
| Dopisek pod wynikiem `.metric>small` | `#8b8374` / `#ffffff` | 9 px | **3,75:1** |
| Etykieta wybranej karty `.compare-tag` | `#887244` / `#fffae8` | 8 px | **4,43:1** |
| Pomoc przy polu `.field small` | `#6e6b61` / `#ffffff` | 11 px | 5,33:1 |

Pierwsze dwa przypadki są poniżej wymaganego dla zwykłego tekstu progu 4,5:1. Źródło kryterium: [W3C — WCAG 2.2, Contrast Minimum](https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html), odczyt 25.10.2026. Kolory odczytano z DOM; nie mierzono antyaliasingu obrazu. Mały rozmiar sam w sobie nie jest odrębnym naruszeniem minimalnej wielkości fontu WCAG, lecz utrudnia czytanie informacji o kosztach i ryzyku.

**Naprawa i odbiór:** ciemniejszy tekst ≥4,5:1; zwiększyć istotne dopiski i etykiety, jako cel UX przyjąć ok. 14–16 px dla treści wymagającej przeczytania. Sprawdzić także stany aktywne, ostrzeżenia i wykresy. Nie chować kluczowego ryzyka wyłącznie drobnym drukiem. Odbiór z powiększeniem tekstu i klawiaturą.

### A02 — miesięczny wykres wymaga alternatywy tekstowej

**Miejsce:** `app.js:60`, `:75`, `:78`. SVG ma ogólną etykietę i elementy `title`; nie ma równoważnej tabeli miesięcznej energii. Tabela finansów rocznych już istnieje. Same podpowiedzi SVG nie zapewniają wygodnej obsługi dotykiem i czytnikiem ekranu.

**Naprawa i odbiór:** rozwijana tabela miesięcy z jednostkami, nagłówkami i tymi samymi danymi co wykres; podział źródeł energii zgodny z U01. Pełne informacje dostępne bez najechania myszą. Test czytnikiem ekranu pozostaje do wykonania.

### Mobilność — co faktycznie sprawdzono

Wcześniejszy etap obejmował A/B przy 320/390/768 px i sterowanie zakładkami klawiaturą. Uzupełniający odczyt przy viewport 390×844: szerokość dokumentu 375 px (miejsce na pasek przewijania), `scrollWidth = clientWidth = 375` w obu wariantach. Zwijanie parametrów B ustawiło `aria-expanded=false` i wysokość panelu 0. Nie odnotowano błędów JS w kontrolowanej sesji.

**Ograniczenie dowodu:** zapisany w tej sesji `qa/audit/mobile-B.png` ma anomalie renderowania niezgodne z odczytanymi wymiarami DOM. Nie używam go do potwierdzenia wady responsywności ani do pozytywnego odbioru wizualnego. Zachowano go jako surowy artefakt; wcześniejsze zrzuty są w `qa/stage-3/`. Nie sprawdzono fizycznego telefonu, Safari/iOS, powiększenia 200/400%, czytnika ekranu ani drukowania. Te kontrole należą do odbioru po naprawach, a nie do rzekomo zaliczonych testów.

UX: A jest lepszym punktem wejścia; B powinien zachować wspólny stan i pokazywać założenia wymagające uzupełnienia. Proponuję przy werdykcie krótki zestaw „źródło danych / jakość profilu / kompletność kosztów / najważniejsze ryzyko” oraz jawne porównanie z wariantem bez zakupu. Nie trzeba rozbudowywać strony głównej o cały formularz.

## 8. Wydajność, prywatność i utrzymanie

### P01 — import i kolejka obliczeń

**Miejsce:** `app.js:44`, `:58`–`:59`, `:91`; `engine.js:50`–`:51`; `worker.js:2`.

Plik jest w całości odczytywany przez `file.text()` przed sprawdzeniem limitu. Parser sprawdza liczbę znaków, a nie bajty `file.size`; parsowanie odbywa się na głównym wątku. Worker liczy poza UI, ale stare zadania nie są anulowane: ID odrzuca stare odpowiedzi, nie koszt obliczeń. Każda zmiana kopiuje ponownie profil i import do workera. To ryzyko opóźnień na słabszym telefonie, nie stwierdzone w tym audycie zawieszenie urządzenia.

Pomiar orientacyjny, po jednym uruchomieniu lokalnego Node v26.10.0 / macOS arm64: cztery modele, 10 lat, bateria 20 kWh — profil godzinowy **201 ms**, 15-minutowy **612 ms**. Pomiar obejmuje `calculate`, nie czas pobierania, renderowania czy interakcji. Nie jest wynikiem Lighthouse, Core Web Vitals ani benchmarkiem telefonu. Artefakt build: **18 plików, 488 144 B nieskompresowane**, w tym profil ok. 270 kB.

**Naprawa i odbiór:** sprawdzić `file.size` przed odczytem; parser w workerze; cache stałych danych; realizować ostatnie żądanie zamiast nieograniczonej kolejki. Przy dużym CSV mieć stan postępu/błędu i możliwość odzyskania kontroli. Mierzyć pełną interakcję na fizycznym telefonie. Nie dodawać frameworka wyłącznie w celu rozwiązania tych problemów.

### Prywatność i bezpieczeństwo — stan oraz warunki dalszego rozwoju

Potwierdzone w źródłach: CSV jest przetwarzany lokalnie; nie ma uploadu profilu ani aktywnego API formularza, kluczy portfela, zdalnego sterowania ASIC lub analityki w prototypie. Dane są ładowane z lokalnych względnych JSON; fonty także lokalne. Linki źródeł mają `noopener noreferrer`, strona `no-referrer`. Build kopiuje listę dozwolonych publicznych plików i nie obejmuje backendu/dokumentacji. To korzystne podstawy, ale nie pełny pentest.

Przed produkcją ustalić kanał zapytań i potwierdzić docelowy adres odbiorcy, retencję danych, treść informacji o przetwarzaniu i zakres analityki. Jeśli zostaje poczta, UI ma nadal wyraźnie mówić, że samo przygotowanie zapytania niczego nie wysyła. Eksport JSON zawiera założenia klienta, więc wymaga rozsądnego opisu przed udostępnieniem. Nie wysyłać danych energetycznych, kontaktowych ani finansowych w URL/eventach. Nie dodawać żądania seedów/kluczy. Wzmocnić granicę danych według D02; CSP i nagłówki sprawdzić na wybranym hostingu.

P3: `app.js` i CSS mają bardzo długie wiersze, łączą szablony, walidację, formatowanie i obsługę stanu. Rozdzielić te odpowiedzialności i sformatować pliki po ustaleniu poprawek funkcjonalnych. Nie tworzyć drugiego silnika dla A/B. Zapisać wersję silnika i danych w eksporcie, dodać import własnego scenariusza, jeżeli ma służyć konsultacjom powtarzanym.

## 9. Zakres techniczny i gotowość publikacji

| Obszar wymagań | Obecny stan | Co pozostaje do odbioru |
|---|---|---|
| Godzinowa PV i dom | PVGIS Wrocław 2023, syntetyczny dom, skalowanie | profile dla lokalizacji/azymutu/kąta; jakość szacunku i pomiary klienta |
| CSV | pełny rok UTC, 15/30/60 min, kW/kWh | adaptery rzeczywistych eksportów falowników i lokalnego kalendarza; ewentualne dane miesięczne jako jawna symulacja |
| Wspólny silnik i bilans | działa, ogranicza moc, SOC, rozruch | E01/E02 i dalsze testy kontrfaktyczne; rozdzielenie energii źródeł |
| Net-billing | uproszczony miesięczny rejestr FIFO, historia RCEm / stała cena RCE | porównanie z fakturą i umową klienta, szeregi RCE i taryfy; nie przedstawiać obecnego RCE jako pełnego rozliczenia |
| Bateria | opcjonalna, moc, SOC, straty, koszt cykli | degradacja pojemności, wymiana, wspólne limity falownika; oddzielna korzyść domu, EMS i ASIC |
| ASIC i firmware | pełna moc / wyłączony, własne W/TH | potwierdzone krzywe H(P), elektronika kontrolera, firmware i API każdego SKU |
| Pełny koszt | budżet lub ręczny kosztorys | C01, gwarancja/dostawa, rozpiska projektu, cennik AMPOWER |
| Bezpieczeństwo fizyczne | opis założeń, brak sterowania sprzętem | projekt obwodu/faz, złączy, chłodzenia, hałasu, awaryjnego wyłączenia; pomiary urządzenia |
| EMS/HA | koncepcja, nie gotowa integracja | pilotaż z licznikiem i API; utrata pomiaru/sieci, przegrzanie, restart, import ponad limit |
| Dane automatyczne | snapshot, ostrzeżenia i walidacja | O01/D02, endpoint, cache, monitoring błędów, rollback |
| Formularz | szkic, kopiowanie, `mailto` | U02, wybór kanału, dostarczalność i prywatność |
| SEO | `lang=pl`, tytuły, lokalne `noindex,nofollow` | po akceptacji publikacji: meta description, canonical, OG, sitemap, link ze Smart Home i kontrola indeksacji |

Brak `noindex` nie jest obecnym zadaniem: **pozostawić blokadę indeksowania prototypów**. Nie ma podstaw do oceny pozycji Google, ruchu organicznego lub realnych CWV bez właściwych danych. Specjalistycznego audytu GSC nie wykonano i nie podaję wymyślonej punktacji SEO.

Audyt 24.10 potwierdzał GitHub Pages `main/root` i działające Smart Home. Gałąź robocza nie jest kanałem automatycznej publikacji. Rola konta Squarespace pozostaje niepotwierdzona; nie należy na tej podstawie zmieniać hostingu czy DNS. Przed przyszłym wdrożeniem trzeba porównać aktualne źródła Smart Home z produkcyjną paczką i nie przenosić obcych niezacommitowanych zmian bez rozpoznania.

## 10. Kolejność napraw i kryteria zamknięcia

1. **Silnik i dowody:** naprawić E01/E02, dodać testy zachowania ekonomicznego oraz identyczności wariantów przy niedziałającym ASIC. Przejrzeć koszt alternatywny baterii i importu. Ponownie przeliczyć 81 scenariuszy i udokumentować różnice. Właściciel: development + przegląd analityczny.
2. **Koszty i oferty:** wdrożyć C01/D01, zebrać zatwierdzony zakres kosztorysu AMPOWER, końcowe ceny i kryteria dopuszczenia ofert. Hydro tylko z pełnym zakresem. Właściciel: AMPOWER + development.
3. **Wyniki i formularz:** U01–U04, V01, E03; wspólny stan A/B, aktualność szkicu, poprawne wykresy i wyraźna jakość założeń. Właściciel: frontend + przegląd UX.
4. **Dostępność i dane:** A01/A02/D02; testy klawiatury, czytnika, powiększenia, telefonu i Safari; schemat/wersja/TTL danych. Właściciel: frontend + QA.
5. **Operacje:** P01/O01 oraz wybór formularza i hostingu. Uruchomienie automatyzacji dopiero w zaakceptowanym zakresie. Odbiór awarii danych, starego snapshotu i przywracania ostatniej poprawnej wersji.
6. **Bramka produkcyjna:** ponowny audyt P1, kompletne ceny, czytelne ryzyka, aktualne wyniki, odbiór prywatności i publikacji przez właściciela. Integracja sprzętowa wymaga osobnego pilotażu. Publikacja pozostaje osobną decyzją użytkownika.

Nie podaję godzin napraw ani ceny ich wykonania bez ustalenia docelowego zakresu. Najwięcej niepewności dotyczy algorytmu ekonomicznego, rzeczywistych rozliczeń i ofert sprzętowych, a nie samego wyglądu strony. Rekomenduję zachowanie obecnego modelu; dla napraw silnika wysoki poziom rozumowania, dla treści i prostych korekt UI średni. Nie przełączano modelu ani poziomu automatycznie. Ten raport nie rozpoczyna napraw.

## 11. Dowody, odtworzenie i limity

- [Pierwotne próby silnika](qa/audit/engine-probes.json), [powtórzenie celowanych kontrprzykładów](qa/audit/engine-probes-recheck.json), [przenośny skrypt](qa/audit/reproduce.mjs). Wyniki obu plików są zgodne. Polecenie odtwarzające z katalogu repo: `node docs/pv-mining/qa/audit/reproduce.mjs`. Skrypt zapisuje wyłącznie `engine-probes-recheck.json`.
- [Próby przeglądarkowe](qa/audit/browser-probes.json): SOC, ukryte błędne pole, wymiary A/B, kontrastowe kolory, utrata stanu i nieaktualny szkic; log błędów JS pusty.
- [Dodatkowe próby](qa/audit/additional-probes.json): kontrast z równania luminancji, zerowy SVG, orientacyjny czas obliczeń i lista plików build.
- [Zapis wykresu z importem z sieci](qa/audit/grid-chart.jpg). Dowodem liczbowym U01 są także wyniki silnika i wzór skali w `app.js:60`.
- [Poprzednie testy](07_TESTY.md), [audyt repozytorium/hostingu](01_AUDYT.md), [oferty](02_ASIC_I_OFERTY.md), [architektura](03_MODEL_I_ARCHITEKTURA.md).

Wznowienie 25.10 po odnowieniu: rzeczywisty odczyt **100% limitu 5 h / 64% tygodniowego**. Kontrola w trakcie: **76% / 60%**. Odczyt przy końcowej kontroli raportu: **62% / 58%**. Kolejne odnowienie 5 h: **25.10.2026 06:45:08 CET**; tygodniowe **31.10.2026 06:35:01 CET**. Zmiana CEST → CET tej nocy jest uwzględniona. Narzędzie nie zwróciło innych limitów procentowych. Nie użyto resetów, dopłat, agentów ani nowych automatyzacji.

Kontrola dokumentacji: wszystkie lokalne odnośniki raportu prowadzą do istniejących plików; pierwotny i odtworzony JSON prób silnika są identyczne. Build podglądu zakończył się poprawnie i zawiera tylko 18 dozwolonych plików. Raport i dowody zapisano lokalnie na `feat/pv-mining`; nie wykonano commitu ani push w ramach tego wznowienia.
