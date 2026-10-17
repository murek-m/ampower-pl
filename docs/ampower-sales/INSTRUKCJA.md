# Obsługa wycen AMPOWER — lokalny prototyp

Nie wymaga nowych płatnych usług. Frontend i backend JS wymagają Node.js 20+. Generator PDF dodatkowo wymaga Python, ReportLab i fontu obsługującego polski tekst. Rzeczywiste ceny zakupu, dane klientów i PDF trzymaj poza repozytorium. Nie serwuj źródeł repo ani katalogu backendu przez http.server. `npm run dev` teraz buduje i serwuje wyłącznie dist.

## Podgląd i weryfikacja

```sh
npm test
npm run lint
npm run build
npm run preview
```

Adres: http://127.0.0.1:4173/smart-home-energy/. Bieżący odbiornik jest wyłączony. Przycisk „Wyślij zapytanie” wyjaśnia brak uruchomienia, zachowując konfigurację. „Podgląd konfiguracji” i kopiowanie działają niezależnie. Nie ma publicznego panelu administracyjnego.

Pełny automatyczny test formularza uruchamia własne dwa serwery na loopbacku, wstrzykuje konfigurację tylko w kontekście przeglądarki, zapisuje wyłącznie syntetyczne dane do katalogu tymczasowego i usuwa je po zakończeniu:

```sh
npm run test:e2e:sales
```

Wymaga Playwright i Chromium, ewentualnie `AMPOWER_PLAYWRIGHT_MODULE` oraz `AMPOWER_CHROME_PATH`. Nie wysyła poczty, nie tworzy kont dostawców i nie wykonuje deploymentu. Opcjonalne `test:e2e` oraz `test:e2e:additional` sprawdzają podgląd, układ i stare kalkulatory; wymagają działającego preview.

## Zmiana cen

1. Skopiuj `backend/catalog.seed.json` do prywatnego pliku **poza repo**. Szablon zawiera P01–P11 i 13 ścieżek na posiadanym sprzęcie oraz 17 usług. Historyczne ceny detaliczne `historicalReference` nie są cenami zakupu netto AMPOWER. Dane historyczne zostają jako dowód, a aktualne kwoty wpisuje właściciel na podstawie ofert/faktur.
2. W każdym modelu uzupełnij `purchaseNet` (koszt rzeczywiście ponoszony, z uwzględnieniem prawa odliczenia VAT), `saleNetRange` lub prywatną `markupRule`, koszty i czasy montażu/konfiguracji, `installationService`, `configurationService`, `hoursRange`, `difficulty`, wymagania i źródło. **Silnik publiczny odczytuje zatwierdzone `saleNetRange`; nie oblicza ceny zakupu ani narzutu w przeglądarce.** Przy regule narzutu właściciel oblicza i zapisuje wynik sprzedaży przed eksportem.
3. Zweryfikuj dostępność (`available` dla nowego sprzętu), konkretny wariant integracji (`compatibility.status: qualified`), dozwolone funkcje `allowedFunctions`, drogi sterowania `allowedControls`, tryby `allowedDeliveries` i kwalifikację istniejącego sprzętu `existingApproved`. Wymagane materiały/radio to `dependencyIds`. `pointsPerUnit` domyślnie 1; 0 tylko dla jednoznacznie zakwalifikowanego współdzielonego punktu, np. dodatkowego odczytu tego samego systemu PV. Nie ustawiaj 0 dla całego osobnego systemu. Reguła `approvedHostModels` zawiera zakwalifikowane modele posiadanego Home Assistant; nie utożsamiaj dowolnej bramki z hostem HA. `radioAlternatives` dopuszcza sprawdzone zamienniki adapterów. Wybór posiadanego zgodnego radia w formularzu zapobiega ponownemu naliczeniu zakupu.
4. Każda usługa ma cenę sprzedaży netto jako dolną/górną granicę za jednostkę. `point` jest za punkt, `integration` za instancję systemu, `simple` i `advanced` za scenę; baza, dodatkowa trudność, materiały, wsparcie i uruchomienie zdalne za uzgodnione zlecenie. Czasy własne i `purchaseNet` usług zostają prywatne; znany brak kosztu dodatkowego zapisuj świadomie jako 0, brak wiedzy jako null. Nie powtarzaj backupu i szkolenia w onboardingu ani kalibracji rolety w scenie.
5. Uzupełnij VAT i jego kwalifikację: `vatRate` oraz `vatApproved`. Silnik obsługuje 23%, 8% i 0% po zatwierdzeniu. 0% to arytmetyczny wariant do kwalifikacji, nie automatyczna obsługa podatnika zwolnionego. Status podatnika i odliczenia wpływa też na koszty zakupów. Sam fakt, że instalacja jest w domu, nie daje 8%.
6. Zatwierdź osobno każdą pozycję oraz wersję katalogu i reguły: `approvalStatus: approved`, `approvedBy`, `approvedAt`, `validUntil`; pozycje dodatkowo `updatedAt`, katalog `validFrom` i unikalne `version`. Status nie jest automatycznie ustawiany przez skrypt. Wygasła pozycja jest pomijana w publikacji kwot i powoduje indywidualną wycenę potrzebnego zakresu.
7. Reguły: `minimumOrderNet`, `minimumExpansionNet`, `minimumConfigurationNet`, `minimumVatRate`, `quantityDiscounts: [{from,percent}]`, krok zaokrąglania `roundingGross`. `travelZones` mapuje miejscowość małymi literami na zatwierdzony przedział netto dojazdu, VAT i ważność. Miejscowość bez reguły nie jest bezpłatnym dojazdem. Dla mieszanego VAT minimalna dopłata wymaga zgodnej kwalifikacji; silnik odsyła niejednoznaczny wariant do wyceny indywidualnej.
8. Nie aktywuj abonamentów. `subscriptionsEnabled` w publicznej projekcji zawsze pozostaje false.
9. Ustaw `AMPOWER_CATALOG_PATH` na prywatny plik, uruchom `npm run prices:export`, testy i build. Eksporter odrzuca operacyjny plik wewnątrz repo. Publiczna projekcja zawiera wyłącznie jawnie wybrane pola; niezaktualizowane/niezatwierdzone ceny mają null. To lokalna zmiana artefaktu, bez publikacji. Backend musi potem używać tej samej wersji prywatnego katalogu.

Nie edytuj wygenerowanego `price-book.js` ręcznie. Zmianę kwot, VAT lub zakresu traktuj jako nową wersję z nowym zatwierdzeniem. Nie zmieniaj poprzednich ofert przez aktualizację katalogu — oferty są osobnymi migawkami. Nie ma jeszcze panelu edycji cen ani automatycznego pobierania aktualnych cen dostawców.

## Zapytania i oferty właściciela

Dla lokalnego testu: `AMPOWER_LOCAL_TEST=1 npm run backend:local`. Serwer nasłuchuje wyłącznie na 127.0.0.1:8787. Domyślny prywatny magazyn to `~/.local/share/ampower-sales`, można wskazać `AMPOWER_DATA_DIR`. Katalog musi mieć prawa 0700 i należeć do operatora, pliki mają 0600. Nie używaj prawdziwych danych przy lokalnych próbach. Frontend domyślnie nie podłącza się do tego serwera; test e2e pokazuje pełną ścieżkę bez zmiany konfiguracji publikacyjnej.

Na koncie właściciela, z tą samą zmienną `AMPOWER_DATA_DIR`:

```sh
npm run owner -- list
npm run owner -- inspect AMP-IDENTYFIKATOR
npm run owner -- draft AMP-IDENTYFIKATOR /PRYWATNY/KATALOG/kosztorys.json
npm run owner -- revise AMP-IDENTYFIKATOR /PRYWATNY/KATALOG/kosztorys.json
npm run owner -- preview AMP-IDENTYFIKATOR /PRYWATNY/KATALOG/podglad-klienta.json
npm run owner -- approve AMP-IDENTYFIKATOR 1
npm run owner -- export AMP-IDENTYFIKATOR /PRYWATNY/KATALOG/oferta-klienta.json
```

`inspect` zawiera dane poufne — tylko prywatny terminal. Nazwy plików przykładowe; zastąp ID rzeczywistym UUID z listy, numer wersji aktualnym. Eksport pliku nie nadpisuje istniejącej wersji. Kwoty/czasy w kosztorysie są jednostkowe; `quantity` mnoży cenę i czas. Sprzęt/materiały mają godziny 0, robocizna trafia do osobnych wierszy. Nieznanego kosztu nie zamieniaj automatycznie na 0.

Właściciel zmienia modele, ilości, jednostkowe koszty, godziny, cenę sprzedaży, rezerwę, przydział kosztów stałych i docelową marżę. `finalSaleNet` jest świadomą korektą ceny; jej VAT kwalifikuje `adjustmentVatRate` + `adjustmentVatApproved`. Zatwierdzenie wymaga kompletnych kosztów/VAT, `technicalChecked`, `costsChecked`, warunków i ważności. Marża poniżej progu lub niedodatni wynik po przydzielonych kosztach wymaga jawnego uzasadnienia `marginException`, zapisanego w audycie. `AMPOWER_OWNER_NAME` identyfikuje operatora w audycie. To kontrola lokalnego konta, nie usługa logowania.

`revise` zwiększa numer wersji i usuwa zatwierdzenie. `approve` wiąże zgodę ze skrótem wersji, klienta i kosztorysu. Zmiana danych unieważnia eksport. Wygasła oferta wymaga nowej wersji i zatwierdzenia. Eksport klienta nie zawiera kosztów zakupu, stawek własnych, rezerwy ani marży.

PDF z eksportu (na prywatnym komputerze, z Pythonem posiadającym ReportLab):

```sh
python3 backend/pdf_offer.py /PRYWATNY/KATALOG/oferta-klienta.json /PRYWATNY/KATALOG/oferta.pdf --font /SCIEZKA/DejaVuSans.ttf
```

Dla podglądu niezatwierdzonego dodaj `--draft`; pojawi się oznaczenie wersji roboczej. Dokument jest statycznym PDF do sprawdzenia i przekazania, nie fakturą. Generator przyjmuje wyłącznie eksport dla klienta, nie pełny zapis zgłoszenia. Plik PDF i JSON muszą pozostać prywatne. Skontroluj PDF przed ręcznym wysłaniem. **Nie zaimplementowano wysyłania ofert klientowi**; nikt nie otrzyma dokumentu automatycznie.

## Powiadomienia i zależności produkcyjne

`notification.status` ma wartości pending, sending, retry-needed, provider-accepted lub reconcile-needed. Provider-accepted oznacza odbiór żądania przez dostawcę, nie dostarczenie do skrzynki. Retry używa stałego klucza; po 23 godzinach od pierwszej próby wymaga ręcznego uzgodnienia z dostawcą, aby nie ponawiać po wygaśnięciu jego 24-godzinnej idempotencji. Prototyp adaptera Resend pozostaje wyłączony. Nie uruchamiaj go podczas QA.

Produkcja wymaga zatwierdzenia dostawców, prywatnego magazynu/bazy, zasad retencji i backupu, weryfikacji HTTPS, Turnstile hostname/action, domeny poczty i odbioru przez kuba@ampower.pl. Dopiero wtedy ustaw publiczne `inquiry-config.js` (endpoint HTTPS, publiczny sitekey, zatwierdzona wersja informacji o danych). Sekrety wyłącznie w środowisku backendu. Uzupełnij informację o dostawcach/retencji/transferach; nie włączaj formularza samym enabled bez tych zależności.

Nie opublikowano backendu, nie ustawiono kont dostawców i nie zweryfikowano rzeczywistej poczty. Root repo nadal nie jest bezpiecznym źródłem publikacji Pages; przed jakimkolwiek osobno autoryzowanym deploymentem skonfiguruj hosting wyłącznie dla dist.
