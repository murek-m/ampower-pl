# AMPOWER Smart Home & Energy — raport nieprawidłowości

**Aktualizacja po naprawie,29.10.2026:** AUD001/AUD002 naprawione i potwierdzone na ampower.pl (main f9e31b7). Cloudflare ograniczono do strony głównej; konfigurator/prywatność/PV bez analityki. Odbiór produkcyjny50/50 PASS. Cennik nadal wymaga bieżących zatwierdzonych danych AMPOWER, VoiceOver pozostaje do ręcznego odbioru. Szczegóły: [raport wdrożenia](docs/SMART_HOME_PUBLIKACJA_2026-10-29.md). Poniższe ustalenia są zachowanym raportem stanu SPRZED napraw.

Data dowodów: **29.10.2026**. Sprawdzana strona: https://ampower.pl/smart-home-energy/.
Raport opracowano na podstawie zakończonego sprawdzenia; przy jego sporządzaniu nie powtarzano testów produkcji. Porównanie źródeł dotyczy gałęzi `feat/pv-mining`, commit `7eb6ff615810d163f72cf7c53aedc3ea92e8c47b`.

## Wniosek

**Publiczna strona nadal ma dwa potwierdzone błędy formularza.** Ich poprawki istnieją w repozytorium i przeszły testy, ale nie zostały wdrożone do publicznego Smart Home & Energy. Zielone CI gałęzi źródłowej nie oznacza, że te poprawki działają już na domenie.

**Nie stwierdzono błędu obliczeń cen w wykonanych testach.** Brakuje natomiast zatwierdzonego, aktywnego cennika sprzedaży, więc nie można potwierdzić aktualności rzeczywistych cen AMPOWER.

| Pozycja | Klasyfikacja | Priorytet | Stan |
|---|---|---|---|
| 1. Niepełny szkic zapytania | Potwierdzony błąd produkcji, AUD-001 | Wysoki | Poprawka lokalna gotowa, wymaga wdrożenia |
| 2. Niepoprawna liczba automatyzacji | Potwierdzony błąd produkcji, AUD-002 | Średni | Poprawka lokalna gotowa, wymaga wdrożenia |
| 3. Brak aktywnego cennika | Brak gotowości do automatycznej wyceny, nie błąd arytmetyki | Wysoki, jeśli strona ma podawać ceny | Wymaga zatwierdzonych danych biznesowych |
| 4. Zewnętrzny skrypt Cloudflare | Obserwacja wymagająca wyjaśnienia | Do ustalenia | Przyczyna i pełne zachowanie niezweryfikowane |

## 1. Szkic zapytania gubi część ustawień — AUD-001

**Odtworzenie:** wybrać kategorię, cel i kontakt, następnie w ustawieniach dodatkowych wskazać radio SONOFF ZBDongle-E, gotową infrastrukturę, złożoną integrację, 3 proste i 2 zaawansowane automatyzacje oraz rozszerzone wsparcie. Przygotować szkic wiadomości.

**Wynik:** szkic nie zawiera sprawdzanych informacji o radiu, infrastrukturze, liczbach automatyzacji i rozszerzonym wsparciu. Test kompletności zakończył się FAIL zarówno w Chromium, jak i WebKit.

**Skutek:** użytkownik wypełnia pola, lecz osoba przygotowująca ofertę nie otrzymuje całego zakresu. Może to prowadzić do niepełnej wyceny lub konieczności ponownego zbierania danych.

**Stan naprawy:** lokalny `smart-home-energy/model.js` zawiera `projectAnswers` i `projectLines`; publiczny plik nie zawiera tych poprawek. Nie należy implementować ich ponownie.

**Zalecenie:** wdrożyć sprawdzony zestaw poprawek Smart Home, następnie na domenie potwierdzić obecność wszystkich ustawień w szkicu oraz zgodność treści szkicu z treścią przygotowanego mailto, bez wysyłania wiadomości.

Dowody: `live-results.json`, porównanie `live-model.js` ze źródłem, zrzuty `chromium-draft-complete.png` i `webkit-draft-complete.png`.

## 2. Ujemna liczba automatyzacji nie jest prawidłowo walidowana — AUD-002

**Odtworzenie:** wypełnić wymagane pola, wpisać `-1` w liczbę prostych automatyzacji i nacisnąć przygotowanie szkicu.

**Wynik:** pole nie otrzymuje oczekiwanego oznaczenia błędu `aria-invalid="true"`. Scenariusz wymagający odrzucenia wartości zakończył się FAIL w obu silnikach. Pierwsza nieudana asercja przerwała test przed kolejną kontrolą ukrycia szkicu — ta druga asercja nie jest osobnym potwierdzonym wynikiem.

**Skutek:** formularz nie sygnalizuje prawidłowo niedozwolonej wartości. Dane zapytania mogą być niejednoznaczne. Nie jest to dowód naliczenia ujemnej ceny — aktywnych cen na stronie nie ma.

**Stan naprawy:** lokalny model ma już walidację `parseScenes`; publiczny model nie ma tej poprawki w ścieżce przygotowania szkicu.

**Zalecenie:** wdrożyć istniejącą poprawkę. Odbiór na domenie powinien objąć obydwa pola: wartości ujemne, ułamkowe i tekstowe odrzucane; puste, 0 i poprawne liczby całkowite do 999 obsługiwane zgodnie z wymaganiami. Przy błędzie szkic nie powinien być gotowy do wysłania.

Dowody: `live-results.json`, `live-model.js`, zrzuty `*-invalid-scenes-blocked.png`; lokalne testy regresji w `tests/smart.test.js`.

## 3. Nie można potwierdzić rzeczywistych cen AMPOWER

**Stan potwierdzony:** publiczny cennik ma `enabled=false`. Zawiera 24 urządzenia i 17 usług, lecz żadna pozycja nie ma publicznej kwoty sprzedaży. Strona wyświetla „Wymaga indywidualnej wyceny” dla wszystkich 12 kategorii oraz 66 par kategorii w obu silnikach.

Pliki publiczne `price-book.js` i `pricing.js` są identyczne z bieżącymi źródłami. Projekcja cennika jest zgodna z katalogiem projektu. Nie wykryto rozjazdu pomiędzy tymi plikami na stronie a repozytorium.

**Co jest poprawne:** 119/119 testów modelu i wyceny PASS. Sprawdzono m.in. sumowanie, VAT per pozycja, zaokrąglenia, rabaty, minima oraz brak podwójnego naliczania centrali i integracji. Dodatkowy niezależny rachunek na danych syntetycznych dał zgodny wynik.

**Czego nie potwierdzono:** aktualności rynkowej cen urządzeń, zatwierdzenia stawek usług przez AMPOWER, opłacalności oferty ani prawnej kwalifikacji VAT. Dane syntetyczne z testów nie są cennikiem ani ofertą.

**Zalecenie:** przed aktywowaniem cen zatwierdzić ceny sprzedaży urządzeń i usług, zasady dojazdu, minima, rabaty, okres ważności oraz właściwe stawki VAT. Następnie sprawdzić kilka rzeczywistych konfiguracji na niezależnie policzonych przykładach. Nie włączać cennika tylko po to, by strona zaczęła pokazywać kwoty.

Dowody: `price-check.json`, `live-manifest.json`, `unit.log`.

## 4. Próba pobrania skryptu Cloudflare

Strona próbowała pobrać `https://static.cloudflareinsights.com/beacon.min.js`. Test zablokował ruch zewnętrzny. Z tego powodu kontrola braku niedozwolonych żądań zakończyła się FAIL w obu silnikach.

Nie ustalono, czy skrypt pochodzi z konfiguracji hostingu, czy z innego mechanizmu. Nie badano pełnego zachowania zgody ani danych przesyłanych przez skrypt. Nie jest to dowód awarii kalkulatora ani naruszenia prawa.

**Zalecenie:** wyjaśnić źródło skryptu i sprawdzić, czy jego obecność oraz uruchamianie są zgodne z zamierzonym ustawieniem analityki. Dopiero na tej podstawie decydować o zmianie. Nie usuwać kodu na podstawie przypuszczeń.

## Ograniczenia i elementy działające zgodnie z konfiguracją

- Odbiornik formularza jest wyłączony. Strona przygotowuje szkic do samodzielnego wysłania; nie jest to działający formularz przyjmujący zapytania na serwerze. Jeśli celem jest bezpośrednia wysyłka, wymaga ona osobnego wdrożenia i odbioru.
- Na szerokościach 375, 390, 430, 1366, 1440 i 1920 px nie wykryto poziomego przepełnienia dokumentu w Chromium/WebKit. To nie jest pełny audyt dostępności ani gwarancja poprawności każdego widoku.
- VoiceOver i pełny ręczny odbiór Safari pozostają nieweryfikowane. WebKit nie zastępuje takiego odbioru.
- Nie wykonano rzeczywistych wysyłek, zmian cen ani publikacji. Oryginalny raport audytu i kod zachowano.

## Kolejność dalszych działań

1. Wdrożyć już przetestowane poprawki Smart Home dotyczące kompletności szkicu i walidacji, z zachowaniem pozostałych prac oraz obecnej strony PV.
2. Potwierdzić te przypadki na publicznej domenie w Chromium i WebKit.
3. Wyjaśnić konfigurację skryptu Cloudflare.
4. Oddzielnie zatwierdzić cennik i zdecydować o uruchomieniu automatycznej wyceny oraz ewentualnego odbiornika zapytań.
5. Uzupełnić ręczny odbiór dostępności.

Nie są to polecenia publikacji wykonane w ramach sporządzenia raportu.

## Dowody i interpretacja wyników

Katalog dowodów: `/Users/jb/outputs/ampower-smart-check-2026-10-29/`.

- `live-results.json`: 22 wyniki grupowe — 16 PASS, 6 FAIL. Cztery FAIL odpowiadają dwóm problemom formularza w dwóch silnikach; dwa pozostałe dotyczą zewnętrznego żądania Cloudflare. Nie oznacza to sześciu niezależnych błędów aplikacji.
- `unit.log`: 119/119 PASS, bez pominiętych testów.
- `price-check.json`: zgodność projekcji cennika i niezależnej arytmetyki.
- `live-manifest.json`: statusy HTTP i sumy SHA256 pobranych plików.
- `check-live.mjs`, `live-browser.log`, pliki `live-*` i screenshoty: odtworzenie oraz materiał źródłowy.

Raport opisuje stan z chwili testów 29.10.2026, nie stan po ewentualnych późniejszych wdrożeniach.
