# Naprawy i odbiór drugiego audytu PV Mining

25.10.2026, gałąź `feat/pv-mining`, silnik `2026-10-25.2`. Dotyczy ustaleń [audytu 13](13_PELNY_AUDYT_AKTUALNEGO_MODULU.md). Wykonano poprawki kodu lokalnego modułu; bez publikacji.

## Wynik

**51/51 testów PV Mining zaliczonych** po końcowych zmianach, w tym cztery nowe testy obejmujące ponowną stratę po zwrocie, granice retencji CSV, zapis przed odświeżeniem, uszkodzony JSON sesji i walidację katalogu. [Log testów](qa/followup-fixes/tests.txt). Build i kontrola składni poprawne, `git diff --check` bez uwag. Nie powtarzano 81 scenariuszy ani pełnych testów innych modułów; zmiana silnika dodaje opis zwrotu, nie zmienia wartości przepływów.

## Zamknięcie ustaleń F01–F12

| Ustalenie | Poprawka | Odbiór |
|---|---|---|
| F01 — późniejsza strata po zwrocie | Osobne `lossAfterPayback` i `paybackReversed`; ostrzeżenie w nagłówku, brak zielonego werdyktu, rok ponownej straty i końcowy wynik. Karty porównania też oznaczają przejściowy zwrot. Pierwsze odzyskanie nakładu pozostaje oddzielone od zwrotu gotówkowego. | Regresja sztucznego scenariusza: zwrot w roku 1, ponowna strata w roku 3. Sprawdzono tryby gromadzenia i sprzedaży oraz brak pełnych kosztów. |
| F02 — żądanie nieznanego kosztorysu | Nagłówek wstępnej analizy, obliczenia energetyczne i operacyjne oraz zapytanie dostępne bez pełnego kosztorysu. Zwrot nadal blokowany przy brakujących cenach. | Przeglądarka: szkic bez dopisywania cen infrastruktury. |
| F03 — kontakt i wynik za daleko | Wynik przed katalogiem; skrót prowadzi do `#summary`; przycisk zapytania przy podsumowaniu. Katalog zwijany. | Przy 390 px domyślny A ma około **3830 px**, wcześniej 9197 px; przycisk przy podsumowaniu na y≈2775 zamiast jedynego zapytania na y≈8958. Wymiary zależą od otwartych szczegółów. |
| F04 — rozbieżność suwaka | Wspólny zakres 0–100 kWp dla suwaka i pola. | Wpisane 40 → suwak 40. |
| F05 — odświeżenie gubi edycję | Mały stan zapisywany w sessionStorage natychmiast, także zmiany szkicu. Operacje CSV są kolejkowane. Osobny komunikat błędu zapisu. | Po odświeżeniu zachowane 40 kWp i dopisek klienta; szkic wymaga odświeżenia przed wysyłką, zachowując dopiski. |
| F06 — ukryte błędne pole | Przejście do pola otwiera mobilny panel, właściwą zakładkę i sekcję. | Panel `block`, wysokość pola 46 px, fokus `f-btcPrice`. |
| F07 — utrata fokusu | Po renderze odtwarzane otwarte szczegóły oraz fokus wybranego przycisku modelu. | Enter na S21 Pro pozostawia fokus `s21-pro`, szczegóły pozostają otwarte. |
| F08 — none i domyślny budżet | Polskie stany magazynu; budżet domyślnie pusty, do szkicu trafia kwota dopiero po świadomej edycji pola. Stare zapisane ustawienia bez potwierdzenia budżetu nie narzucają 30000 zł. | Szkic: „Brak magazynu”, „Budżet: Do ustalenia”. |
| F09 — osierocone CSV | Kopia z metadanymi retencji 24 h od zapisu, sprzątanie wygasłych kopii przy wejściu, osobny przycisk usuwania wszystkich kopii, także poprzednich sesji. Stare prawidłowe profile migrują do nowego formatu bez natychmiastowego kasowania. | Realny import 8760 rekordów, odświeżenie, A/B, globalne usunięcie, odświeżenie → PVGIS. Granice retencji w teście jednostkowym. |
| F10 — reset uszkodzonej sesji | Bezpieczny odczyt JSON; reset usuwa klucz przed operacją bazy, wadliwa struktura nie blokuje uruchomienia formularza. | Test z `{broken-json` i działający reset w przeglądarce. |
| F11 — tekst katalogu jako HTML | Kodowanie nazw i wariantów w katalogu oraz opisów przy polach; hałas wyświetlany wyłącznie jako liczba. Ograniczenie długości tekstów i walidacja typu/zakresu hałasu. | Test wadliwego typu hałasu, wartości skrajnej i zbyt długiego opisu; przegląd miejsc renderowania. Nie wykonywano ataku ani pentestu. |
| F12 — nadmiar technicznych szczegółów | A pokazuje krótkie podsumowanie, a szczegółowe obliczenia, porównanie i kosztorys są rozwijane. Prostsze etykiety utrzymania i gotówki, krótsza opcja RCEm i jawny opis roku. B zachowuje pełne parametry. Awaria nie każe klientowi uruchamiać npm. | Przegląd A/B i obsługa ponowienia odczytu. Tabele mają wskazówkę przewijania i fokusowalny region. |

## Prywatność i retencja — dokładne znaczenie

24 h to czas od zapisania kopii CSV w IndexedDB. Zmiana samych małych pól nie przepisuje całego dużego profilu. Wygasłe kopie są usuwane przy następnym otwarciu modułu; zamknięta witryna nie uruchamia zegara czyszczącego dane w tle. Reset dotyczy bieżącej karty. Osobny, wyraźnie opisany przycisk usuwa wszystkie zachowane kopie CSV tego modułu z tej przeglądarki.

Inne otwarte karty mogą nadal mieć aktywny profil w pamięci i zapisać go ponownie. Jest to opisane obok przycisku; nie próbowano zdalnie kasować ich aktywnej pracy. Nie wysyłano plików na zewnętrzny serwer. Test używał wyłącznie syntetycznego lokalnego CSV.

## Przeglądarka i build

[Dowody odbioru](qa/followup-fixes/browser.json), [telefon](qa/followup-fixes/A-mobile.jpg), [komputer](qa/followup-fixes/A-desktop.jpg).

Przy 320, 768 i 1366 px A nie rozszerza całego dokumentu poziomo, również po rozwinięciu szczegółów. Sprawdzono poprawki walidacji w mobilnym B i wymianę CSV pomiędzy wariantami. Nie wykonano testu fizycznego telefonu ani pełnej oceny WCAG.

Podczas kontroli odnotowano pojedynczy przechwycony błąd odczytu lokalnych JSON-ów. Przyciskiem „Spróbuj ponownie” odczyt przywrócono, bez utraty zachowanych parametrów i CSV. Nie deklarujemy na tej podstawie bezawaryjności sieci. Dziennik JS nie zawierał nieobsłużonych błędów.

Build dodaje do odwołań modułów, workera i CSS wspólny identyfikator zależny od zawartości źródeł. Zapobiega mieszaniu starego JS w pamięci przeglądarki z nowym wydaniem. Końcowy identyfikator: `4a16e5f8343f7dba`; odwołania sprawdzone, pliki docelowe istnieją. Źródła w repozytorium pozostają czytelne, wersjonowanie dotyczy wygenerowanego podglądu.

## Co pozostaje poza naprawami kodu

Potwierdzone oferty i ceny dostawy, kosztorys AMPOWER, regulacja konkretnego ASIC, projekt i odbiór elektryczny, realne dane instalacji, pełne RCE/taryfy, degradacja baterii, kalendarzowe mapowanie lat i globalna optymalizacja pozostają ograniczeniami lub osobnymi rozszerzeniami opisanymi w audycie. Nie przedstawiamy ich jako zrealizowanych przez uproszczenie interfejsu.

Nadal potrzebne są odbiór na iPhone/Android, docelowy kanał kontaktu, konfiguracja hostingu/bezpieczeństwa i zatwierdzenie publikacji. Przygotowanie szkicu nie jest formularzem wysyłającym wiadomość. Nie uruchomiono automatycznej publikacji, harmonogramu ani płatnych usług; bez push i merge do main.

Prace poniżej 30% limitu wykonano za wyraźną zgodą użytkownika. Odczyt przed końcowym zapisem: **15% pięciogodzinnego, 71% tygodniowego**; odnowienia 25.10.2026 **20:58:28 CET**, 01.11.2026 **07:31:17 CET**. Bez resetów i zmiany modelu.
