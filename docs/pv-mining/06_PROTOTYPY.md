# Etap 2 — dwa lokalne prototypy

24.10.2026. Etap rozpoczęty po zgodzie użytkownika „Zaczynaj”. Gałąź `feat/pv-mining`, osobny worktree `ampower-pv-mining`. Bez publikacji, zmian main, uruchamiania płatnych usług ani agentów pomocniczych.

## Uruchomienie i porównanie

Z tego katalogu repozytorium:

```sh
npm run pv:dev
```

- Wybór koncepcji: http://127.0.0.1:4186/
- **A — prosty:** http://127.0.0.1:4186/simple.html
- **B — zaawansowany:** http://127.0.0.1:4186/advanced.html

Nie potrzeba `npm install`. Node i Python 3 muszą być dostępne. `npm run pv:build` tworzy osobny artefakt `output/pv-mining-preview/`; `npm run pv:preview` uruchamia tylko lokalny serwer tego artefaktu. Nie serwujemy katalogu repozytorium, dokumentacji ani backendu. Port4186 użyty tylko dla tego podglądu. Otwieranie przez `file://` nie obsługuje modułów/Workera.

Po zmianie źródeł zbuduj ponownie i odśwież stronę. Przerwij serwer Ctrl+C w terminalu, gdy przestanie być potrzebny. Jeśli port jest zajęty, nie kończ obcego procesu; wybierz inny port w lokalnym poleceniu Python.

## Dwa warianty UX

**A:** narracja dla właściciela domu, krótki formularz instalacji i magazynu, dodatkowe ustawienia w rozwijanej sekcji, werdykt, trzy domyślne urządzenia, energia, BTC, koszty i wynik inwestycji.

**B:** panel analityczny z zakładkami Instalacja / Mining / Ekonomia. Sześć gotowych instalacji, import danych, parametry sieci, własne ceny oraz TH/s/W, ograniczenia baterii, kosztorys i scenariusze wieloletnie.

Oba korzystają z tych samych plików `app.js`, `engine.js`, `worker.js` i danych. Zgodność trzech głównych wyników przy identycznych wartościach sprawdzono w przeglądarce. Warianty nie zapisują automatycznie ustawień pomiędzy stronami; po otwarciu zaczynają od identycznych założeń. JSON analizy pozwala zachować jawny zapis ustawień i wyników.

Design wykorzystuje barwy AMPOWER, lokalne fonty Archivo / IBM Plex, jasne karty i ciemny panel werdyktu. Na małym ekranie parametry można zwinąć i przejść bezpośrednio do wyników. Urządzenia porównuje się kartami; roczna tabela ma osobny obszar przewijania.

Podglądy: [A desktop](qa/stage-2/A_DESKTOP.jpg), [B desktop](qa/stage-2/B_DESKTOP.jpg), [B telefon — wstępna kontrola układu](qa/stage-2/B_MOBILE.jpg).

## Działające elementy

- Edycja parametrów i przeliczanie bez przeładowania; cięższa część w Workerze. W trakcie zmiany poprzedni wynik jest przygaszony, a eksport zablokowany do zakończenia obliczeń.
- Porównanie do czterech spośród siedmiu wariantów ASIC: S21 151T, S21 Pro234T, S21 XP270T, S21+216T, S23 305T, S23 Hydro580T, M60S++218T. Dla WhatsMinera nie podstawiono fikcyjnej ceny: do oceny zwrotu potrzebna jest własna oferta. Ceny katalogowe/importowe nie są przedstawiane jako pełna dostawaPL.
- Własne TH/s i W są oznaczane jako założenia użytkownika. Nie ma pozornej płynnej regulacji mocy ani obietnicy minimalnego poboru bez pomiaru konkretnej sztuki.
- Godzinowy profil PVGIS2023, syntetyczny dom; znana nadwyżka kalibruje rozkład zużycia w czasie, **zachowując jego roczną sumę**. Dane sprzeczne z bilansem są odrzucane z komunikatem.
- Brak / istniejący / nowy magazyn, moc ładowania/rozładowania, sprawność cyklu, SOC, rezerwa, koszt zużycia, priorytet domu lub uproszczony wariant ekonomiczny.
- Opcjonalne rozładowanie baterii na ASIC i limit planowego importu dla koparki. Domyślnie importASIC=0. Fizyczne ograniczenie mocy przerywa minimalny czas pracy.
- CSV z pełnym rokiem kalendarzowymUTC, interwały15/30/60min, jawne jednostki kW albo kWh. Wczytywanie i obliczenia pozostają lokalne. Import blokuje sprzeczne skalowanie mocą PV i zużyciem formularza. Dostępny syntetyczny plik przykładowy.
- Miesięczny rejestr depozytu FIFO: udostępnienie w kolejnym miesiącu, wykorzystanie na uprawnione należności, termin wykorzystania, ograniczony zwrot i końcowe saldo niewliczane do przychodu.
- Krańcowa wartość eksportu z porównania rozliczenia bazowego. To heurystyka decyzjiEMS, nie dowód globalnego optimum całej instalacji.
- Zmiana trudności i cenyBTC, halving z przewidywanej wysokości, opłaty pool/firmware, dostępność, koszt rozruchu, okres użyteczności urządzenia i koniec wydobycia po tym okresie.
- Oczekiwana ilośćBTC i satoshi, jego wycena, utracony wykorzystany depozyt/zwrot, dodatkowe koszty, ekonomiczny wynik inwestycji i odrębna gotówka. Opcja rocznej sprzedaży albo gromadzeniaBTC.
- NPV: przepływy operacyjne oraz przy gromadzeniu hipotetyczna końcowa wartość portfela, wyraźnie odróżniona od wypłaty gotówki. Niedyskontowany zwrot ekonomiczny i zwrot gotówkowy są pokazane osobno.
- Budżet analizy lub szczegółowy kosztorys własny. Puste wymagane pozycje mają status „Do wyceny”, a nie0PLN. Niepełny kosztorys/cena blokują wynik zwrotu, NPV i gotówki poCAPEX. Istniejący zgodny licznik/EMS nie są ponownie kupowane.
- EksportJSON ustawień, źródeł i wyników; nie dołącza surowegoCSV. Szkic zapytania do edycji, kopiowania lub otwarcia we własnej poczcie. Nie uruchomiono odbiornikaAPI ani wysyłki.

## Różnica względem przykładów etapu 1

Badawcze tabele etapu1 przyjmowały pełne wykorzystanie depozytu i uproszczoną cenę alternatywną. Prototyp prowadzi rejestr depozytu przez cały horyzont i używa jego krańcowej wartości w decyzji o pracy; ma też domyślną dostępność hashowania98%. Dlatego godzin pracy, BTC i korzyści nie należy oczekiwać identycznych z tabelami etapu1. Nie zmieniono historycznego raportu ani jego danych.

Przykład początkowyPV10kWp / bez magazynu / S21 151T / dom5000kWh: około **0,00293745BTC w roku1**, **255PLN dodatkowej korzyści**, przy budżecie **10 590PLN**. W analizowanym horyzoncie **brak zwrotu**. Dodatni wynik operacyjny nie oznacza opłacalnej inwestycji. Pełny zapis: `qa/stage-2/default-results.json`.

## Co sprawdzono w tym etapie

To kontrola uruchomienia i podstawowych interakcji, **nie pełny etap3**:

- składnia nowych modułówNode i build osobnego artefaktu;
- lokalneHTTP200 dla stron i danych;
- działanie obu stron oraz identyczne wyniki początkowe;
- zmianaPV bez przeładowania, przełączanie zakładek i wybór modeli;
- blokada zwrotu po wybraniu niepełnego kosztorysu;
- pobranie syntetycznegoCSV, wczytanie8760rekordów, przeliczenie i usunięcie importu;
- pobranieJSON analizy oraz utworzenie szkicu zapytania bez jego wysłania;
- podstawowy bilans SOC/AC w obliczeniach istniejącego i nowego magazynu; bilans kalibracji znanej nadwyżki przy zachowaniu5000kWh zużycia domu;
- wizualna kontrola desktopu oraz jednego viewportu390×844; bez poziomego przepełnienia całej strony w tym widoku;
- odczyt logów błędów obu widoków podczas podstawowej kontroli: bez błędówJavaScript.

Przy odświeżeniu wystąpił pojedynczy błąd pobrania lokalnych danych mimo działającego serwera. Zmieniono odczytyJSON na `cache:no-store`, dodano przycisk ponowienia i potwierdzono poprawne ponowne wczytanie. Nie jest to dowód odporności na wszystkie błędyAPI; macierz awarii pozostaje do etapu3.

## Jawne ograniczenia prototypów

- Snapshot rynku z24.10.2026; bez odpytywania zewnętrznychAPI i bez aktywnego harmonogramuActions. Starsze dane mają ostrzeżenie wieku. Ceny i zapasy pozostają do potwierdzenia przed zakupem.
- Jedna lokalizacja/orientacjaPVGIS. Inne miejsce ma jawny profil zastępczy; inny azymut/nachylenie wymaga przygotowania profilu lub własnegoCSV. Nie pozorujemy produkcji dla niezbadanego dachu.
- Powtarzane lata referencyjne8760/8784h, a nie prognoza pogody. Etykiety lat są orientacyjne; nie odtwarzamy każdego przyszłego kalendarza. Źródłowe miesiące profilu zachowują swoje ceny scenariusza.
- RCE to stały scenariusz ręczny, nie zaimportowany rzeczywisty szereg cen15min. HistoryczneRCEm2025 są scenariuszem miesięcznym, a nie cenami prognozowanymi. Taryfę odwzorowuje cena zmienna; nie pełna faktura wszystkich operatorów.
- Brak wcześniejszego salda depozytu. Reguły umowy, uprawnienia do należności i limit zwrotu trzeba potwierdzić dla klienta. Ujemną cenę zeruje wybrany parametr umowy; surowa cena nie jest ukrywana przez import.
- DecyzjeEMS są heurystyczne. Model nie zastępuje pilotażu z pomiarem1–5s, rzeczywistej krzywejH(P), rozruchu, chłodzenia i oceny faz/obwodów.
- WariantyHydro wymagają pełnego obiegu i jego mocy/kosztu; wyświetlane porównanie nie jest rekomendacją zakupu bez projektu.
- Budżety4000PLN infrastruktury oraz20 000PLN nowej baterii są parametrami demonstracyjnymi. Nie wytworzono cennika robociznyAMPOWER ani ceny dostawy „pod drzwi”.
- Brak pełnej macierzy testów matematycznych, jednostek, błędów i regresji; brak odbioru na fizycznym telefonie. To zakres etapu3.

## Następny etap i granica publikacji

Rekomendacja etapu3: **GPT-6.1 Sol / high** dla kontroli matematyki, jednostek i przypadków granicznych. Modelu nie przełączano. Najpierw testy fizycznego bilansu, kontrfaktycznego net-billingu, SOC, kosztów, gromadzenia/sprzedażyBTC i błędów danych; potem mobilny odbiór obu wariantów.

**Nie rozpoczęto etapu3. Wymagana wyraźna zgoda użytkownika.** Nie zmieniono strony głównej, opublikowanych zasobów, konfiguracjiGitHubPages, DNS ani cudzego worktree. Nie wykonano merge/push ani publikacji.
