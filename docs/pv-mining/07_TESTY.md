# Etap 3 — testy i poprawki

**Aktualizacja 25.10.2026:** ten dokument opisuje wcześniejszy etap. Bieżący stan i odbiór poprawek: [raport napraw](11_NAPRAWY_PO_AUDYCIE.md); aktualne liczby: [symulacje po naprawie](09_AKTUALNE_SYMULACJE.md).
24.10.2026. Zgoda użytkownika: „Kontynuuj 3 i 4 etap jeżeli będą limity”. Przed etapem odczytano 59% limitu 5 h i 73% tygodniowego; przy ponownym odczycie w trakcie 56% / 73%. Bez dodatkowych agentów, zmiany modelu, płatnych usług i publikacji.

## Wynik

**250/250 testów repozytorium przeszło**, w tym **31 testów PV Mining**. Build lokalnego artefaktu poprawny. Log: [node-tests.txt](qa/stage-3/node-tests.txt). Polecenia odtwarzające: `npm test`, `npm run pv:test`, `npm run pv:build`.

Pierwszy przebieg 25 testów silnika: 20 pozytywnych, 5 negatywnych. Cztery ujawniły błędy zachowania; piąty wskazał brak diagnostyki do kontroli baterii. Dodatkowa kontrola ujawniła ryzyko jednoczesnego ładowania i zasilania ASIC z baterii. Naprawiono:

- jawne 0 kWh produkcji nie wraca już do wartości PVGIS;
- CSV wymaga dokładnej liczby interwałów pełnego roku UTC; brak początku lub końca roku nie przechodzi walidacji. Stałe przesunięcie znacznika wewnątrz interwału, np. 00:10, pozostaje dopuszczalne;
- rozruch bez hashowania przechodzi pomiędzy interwałami; rozruch 60 min przy pomiarze co 15 min nie blokuje wszystkich startów;
- zerowa dostępność hashowania uniemożliwia uruchomienie ASIC również przy ujemnej cenie eksportu;
- magazyn nie ładuje się i nie rozładowuje w jednym interwale, także przy dopuszczeniu energii dla ASIC;
- prognoza rezerwy domu obejmuje 24 h, również na granicy powtarzanych lat. Uproszczona polityka ekonomiczna nie ładuje baterii bez przyszłego zapotrzebowania domu wyłącznie po to, by skonsumować nadwyżkę;
- walidator danych odrzuca uszkodzony snapshot, błędne liczby, katalog i profil. Odczyt nie podstawia zer po awarii. Osobne ostrzeżenia wieku danych rynku i cen ASIC (>7 dni).

Przygotowano diagnostykę roczną: SOC początkowy/końcowy/min/max, ładowanie, maksymalna moc ładowania/rozładowania, zużycie domu, licznik jednoczesnych przepływów. W każdym kroku nadal obowiązuje kontrola bilansu AC i granic SOC.

## Zakres matematyczny

Testy wykorzystują niezależne, analityczne wyniki, a nie kopię kodu silnika:

| Obszar | Sprawdzone przypadki |
|---|---|
| W / kWh / TH/s / BTC | Stałe 1 kW przez 8760 h; wzór trudności; BTC/PH/d; dwa urządzenia; pojedyncze zastosowanie pool fee, dev fee i dostępności |
| Produkcja | Brak PV, niedostateczna moc, 0 kWh, znana nadwyżka z zachowaniem zużycia domu, odrzucenie sprzecznego bilansu |
| Sterowanie | Rozruch przez kilka interwałów, przerwanie pomimo minimalnego czasu pracy przy braku mocy, brak importu ASIC przy limicie 0 |
| Bateria | Brak magazynu, ograniczona moc, SOC, straty, bilans roczny z różnicą SOC, brak jednoczesnego ładowania/rozładowania, zakup istniejącego vs nowego magazynu |
| Net-billing | Depozyt od następnego miesiąca, FIFO, brak pokrycia dystrybucji, wygaśnięcie, limity zwrotu 20/30%, saldo bez fikcyjnej wypłaty, ceny zerowe/ujemne |
| Mining | Halving wewnątrz roku, wzrost trudności, koniec użyteczności ASIC |
| Finanse | NPV z niezależnego wzoru, gromadzenie vs sprzedaż, brak zwrotu, CAPEX=0 bez nieskończonego ROI, brak ceny lub kosztów blokuje wynik, istniejący licznik/EMS bez ponownego zakupu |
| CSV | kW i kWh dla 15/30/60 min, rok przestępny, luki i duplikaty, brak skrajnych interwałów, błędne jednostki, liczby ujemne, brak strefy czasu |
| Dane | HTTP 503, niedostępne API, błędny JSON, zła trudność/cena, duplikaty ID, niepełny profil i deterministyczne oznaczenie starych danych |

## Kontrola przeglądarkowa

Sprawdzono lokalnie w przeglądarce Codex:

- A i B: 320×844, 390×844, 768×844 — brak poziomego przepełnienia dokumentu; [odczyty wymiarów](qa/stage-3/mobile-layout.json).
- B: zwijanie parametrów i przejście do wyników na małym ekranie. [Zrzut mobilny](qa/stage-3/B_MOBILE.jpg).
- Zakładki B działają klawiaturą (ArrowRight, zaznaczenie Mining).
- Niepełny kosztorys pokazuje „Najpierw uzupełnij kosztorys”, a nie okres zwrotu. Jawne 0 kWh produkcji daje 0 kWh ASIC i 0 h pracy.
- Limit porównania czterech urządzeń: próba zaznaczenia piątego wraca do niezaznaczonego stanu; pozostają cztery.
- Dedykowany, tymczasowy serwer testowy 127.0.0.1:4187 podawał HTTP 503, uszkodzony JSON oraz snapshot i ceny z 2020 r. Potwierdzono komunikaty, ponowienie i oba ostrzeżenia wieku. [Wyniki](qa/stage-3/data-faults.json). Serwer awarii zatrzymano po testach.
- Normalne A/B: odczyt logów błędów JavaScript po powyższych interakcjach — puste listy.
- [A desktop](qa/stage-3/A_DESKTOP.jpg), [B desktop](qa/stage-3/B_DESKTOP.jpg). Działający podgląd: http://127.0.0.1:4186/.

Kontrola importu/eksportu i szkicu zapytania z etapu 2 pozostaje opisana w [raporcie prototypów](06_PROTOTYPY.md). W etapie 3 dodatkowo przetestowano parser i granice importu automatycznie. Nie wysyłano zapytań ani danych klienta.

## Granice odbioru

To sprawdzony prototyp badawczy, nie certyfikacja instalacji lub firmware. Nie wykonano testów na fizycznym telefonie, kilku silnikach przeglądarkowych ani rzeczywistym ASIC, falowniku i magazynie. Emulacja wymiarów ekranu nie potwierdza wydajności telefonu ani obsługi plików w Safari/iOS.

Brak aktywnego zewnętrznego API i harmonogramu aktualizacji: testy awarii dotyczą granicy pobierania danych, nie działającego produkcyjnego integratora. Ostatni poprawny snapshot jest wersjonowany w repozytorium; nie wdrożono odświeżania ani cache offline.

Rejestr depozytu jest modelem przy jawnych parametrach umowy; nie zweryfikowano faktur konkretnego klienta. EMS używa heurystyki, nie optymalizacji globalnej. Stały pobór EMS jest konserwatywnym kosztem zakupu energii poza interwałowym bilansem PV; nie stanowi dodatkowego fizycznego przepływu na wykresie. Profil 8760/8784 h jest powtarzany; kalendarz przyszłych lat jest przybliżony.

Koszt i moc pełnego obiegu hydro, rzeczywiste minimum mocy, rozruch oraz wydajność konkretnego firmware wymagają pomiarów. Nierozstrzygnięte warunki ofert i dostaw pozostają jawne; testy nie zamieniają cen indeksowanych w potwierdzone oferty.

## Przejście do etapu 4

Zalecenie: zachować obecny model; do syntezy wyników wystarczy poziom rozumowania **medium**. Modelu ani poziomu nie przełączano automatycznie. Etap 4 może rozpocząć się na podstawie otrzymanej zgody, jeśli ponowny odczyt każdego obowiązującego limitu pozostanie ≥30%. Nie ma zgody na wdrożenie produkcyjne.

Odczyt po etapie 3 / przed etapem 4: **49% 5 h, 72% tygodniowego**. Odnowienia: 25.10.2026 02:40:47 CEST i 31.10.2026 06:35:01 CET. Innych limitów procentowych narzędzie nie zwróciło. Warunek kontynuacji spełniony.
