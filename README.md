# ampower.pl

Strona firmowa **AmPower — Jakub Babiej** (instalacje elektryczne, klimatyzacja, alarmy, monitoring).

Strona główna mieści się w jednym pliku `index.html` z osadzonymi czcionkami
i zdjęciami. Opcjonalną analitykę wyłączono lokalnie podczas końcowego audytu.

## Lokalny podgląd i kontrola

Oferta Smart Home & Energy znajduje się na stronie głównej w sekcji
`/#smart-home-energy` (korzyści, scenariusze, pakiety, realizacja, wsparcie i FAQ).
Sam kalkulator z formularzem pozostaje w `smart-home-energy/index.html`,
pod adresem `/smart-home-energy/`. HTML, CSS i JavaScript bez frameworka i bez nowych zależności.
Fonty nowej podstrony pochodzą z istniejącej strony i są serwowane lokalnie.
Obie strony działają bez analityki. Ponowne włączenie pomiaru wymaga osobnego
zatwierdzenia oraz poprawnego mechanizmu preferencji użytkownika.

Z katalogu tego repozytorium (Node.js 20+ i Python 3):

```sh
npm test
npm run lint
npm run build
npm run preview
```

Otwórz http://127.0.0.1:4173/#smart-home-energy . Nie potrzeba `npm install`.
Build kopiuje publiczne zasoby do ignorowanego `dist/`; nie publikuje strony.
GitHub Pages nadal korzysta z istniejącego źródła na `main` — samo utworzenie
`dist/` nie zmienia konfiguracji hostingu.

Konfigurator ma silnik orientacyjnych widełek, katalog publicznych cen sprzedaży
oraz formularz z bezpośrednią wysyłką do odbiornika. Kwoty i odbiornik są obecnie
wyłączone: brak zatwierdzonego aktualnego cennika i infrastruktury produkcyjnej.
Działa podgląd i kopiowanie konfiguracji. Nie pokazujemy pozornego sukcesu.

W `backend/` znajduje się **lokalny prototyp** przyjmowania zapytań, prywatnego
kosztorysu, edycji/akceptacji oferty i adaptera powiadomień. Nie ma publicznego panelu
administracyjnego ani automatycznej wysyłki ofert. Nie serwuj katalogu repozytorium;
wyłącznie `dist/`. Operacyjne dane i ceny zakupu trzymaj poza repozytorium.

Rozszerzenie: [raport](docs/ampower-sales/RAPORT_KONCOWY.md),
[instrukcja cen i ofert](docs/ampower-sales/INSTRUKCJA.md),
[architektura](docs/ampower-sales/ARCHITEKTURA.md).
Historyczne raporty MVP: [etap 5](docs/ampower-smart/05_IMPLEMENTACJA.md)
i [etap 6](docs/ampower-smart/06_AUDYT_QA.md).

`npm run test:e2e:sales` uruchamia własne lokalne serwery i testuje nowe zgłoszenia
na danych syntetycznych, bez poczty. Nie wymaga ręcznej zmiany konfiguracji strony.

Opcjonalne testy przeglądarkowe: `npm run test:e2e` i `npm run test:e2e:additional`.
Drugi zestaw dodaje wszystkie pary kategorii, nietypowe połączenia, schowek,
większy tekst i laboratoryjny pomiar wydajności. Wymagają lokalnego serwera
z katalogiem `dist/`, Playwright i Chromium; nie dodano ich do zależności strony.
Jeżeli pakiet/przeglądarka są dostępne w zewnętrznym środowisku QA, ustaw
`AMPOWER_PLAYWRIGHT_MODULE` na plik `playwright/index.mjs` i `AMPOWER_CHROME_PATH`
na plik wykonywalny Chrome. Skrypt odrzuca zdalny adres QA i blokuje żądania
poza lokalnym originem oraz metody inne niż GET/HEAD. Nie wysyła wiadomości.

Podgląd samego artefaktu publicznego:

```sh
python3 -m http.server 4173 --bind 127.0.0.1 --directory dist
```

`npm run preview` wykonuje właśnie to polecenie. Po każdej zmianie źródeł ponownie
wykonaj `npm run build` i odśwież stronę. `npm run dev` buduje i uruchamia preview tylko z `dist/`; nie udostępnia backendu ani dokumentów.

## Podgląd na telefonie w tej samej sieci

Telefon i Mac muszą mieć dostęp do tej samej sieci domowej; sieć gościnna z izolacją
urządzeń może blokować połączenie. Zatrzymaj poprzedni serwer przez `Ctrl+C`.
Odczytaj adres Wi‑Fi Maca i uruchom serwer **wyłącznie z artefaktu `dist/`**:

```sh
cd '/Users/jb/Ampower Smart Home/ampower-website'
npm run build
ipconfig getifaddr en1
python3 -m http.server 4173 --bind ADRES_MACA --directory dist
```

Zastąp `ADRES_MACA` wynikiem polecenia. Na tym Macu Wi‑Fi ma interfejs `en1`;
w audycie jego adres wynosił `192.168.1.162`, ale może się zmienić. Otwórz na
telefonie i komputerze `http://ADRES_MACA:4173/smart-home-energy/`.
Przy połączeniu przewodowym odczytaj IP aktywnego interfejsu (np. `en0`);
interfejsy pokazuje `networksetup -listallhardwareports`.

Jeśli systemowy firewall zapyta, dopuść ten lokalny serwer w sieci domowej.
Nie przekierowuj portu routera i nie używaj publicznego tunelu. Zatrzymaj serwer
przez `Ctrl+C` po podglądzie. W razie zajętego portu użyj np. `4174` w poleceniu i URL.
To podgląd lokalny, bez publikacji ani wysyłki zgłoszenia.

HTTP po adresie LAN zwykle nie udostępnia Clipboard API. Wówczas konfigurator
pokaże pełny tekst do ręcznego zaznaczenia i skopiowania; ten fallback sprawdzono.
Na `localhost` automatyczne kopiowanie działa w przetestowanym Chromium.
Sprawdzenie go na fizycznym iPhonie w docelowym HTTPS nadal pozostaje do wykonania.
Nie otwieraj strony przez `file://`, ponieważ używa modułów JavaScript.

## Publikacja

Według dotychczasowej dokumentacji hosting to GitHub Pages publikujący root `main`.
Push na `main` może od razu upublicznić również dokumenty wewnętrzne.
Przed publikacją należy osobno zatwierdzić usługę i ustawić publikowanie wyłącznie
artefaktu `dist/`; sam build nie zmienia ustawień Pages. W etapach 5 i 6 nie wykonano
pushu, deployu ani zmiany hostingu. Szczegóły i rollback w raporcie QA.

Plik `CNAME` przypina domenę ampower.pl — nie usuwać.

## Prywatny panel właściciela — etap 8B

Działający lokalny panel z dashboardem, kosztorysem z opisu, edycją cen/kosztów,
marżą po pełnych kosztach, historią wersji, zatwierdzaniem i generowaniem PDF:

```sh
npm run panel:local
```

Otwórz `http://127.0.0.1:8790`; kod logowania jest w Terminalu. Dane demonstracyjne
dodaje osobny przycisk. Poczta i AI są wyłączone. Magazyn znajduje się poza repo,
w `~/.local/share/ampower-panel-demo`; panel i koszty nie wchodzą do `dist/`.
Do PDF potrzebny jest Python z ReportLab i font obsługujący polski; na tym Macu
wykrywane automatycznie. `npm run panel:backup` tworzy prywatną kopię poza repo.

[Krótka instrukcja po polsku, także dostęp na iPhonie w LAN](docs/ampower-sales/08B_INSTRUKCJA_UZYTKOWNIKA.md),
[raport końcowy i wyniki testów](docs/ampower-sales/08B_RAPORT_KONCOWY.md),
[audyt wcześniejszych modułów](docs/ampower-sales/08B_AUDYT_PANELU.md),
[warianty infrastruktury i koszty produkcji](docs/ampower-sales/08B_ARCHITEKTURA_WDROZENIA.md).

`npm run test:e2e:panel` uruchamia własny izolowany panel na fikcyjnych danych,
wykonuje rzeczywiste testy Chromium i PDF, blokując ruch zewnętrzny. Wymaga
Playwright/Chrome wskazanych przez zmienne QA opisane wyżej. Prototypu lokalnego
nie publikuj bez prac produkcyjnych opisanych w architekturze.

## PV Mining — lokalne prototypy etapu 2

Na gałęzi `feat/pv-mining` przygotowano dwa warianty interfejsu ze wspólnym silnikiem.
Uruchom `npm run pv:dev`, a następnie otwórz `http://127.0.0.1:4186/`.
Osobny artefakt znajduje się w `output/pv-mining-preview/`; nie publikuje strony.
[Opis, instrukcja i ograniczenia prototypów](docs/pv-mining/06_PROTOTYPY.md).
Dane rynkowe są snapshotem, budżety są przykładowe, a pełne testowanie pozostaje etapem 3.
