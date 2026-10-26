# AMPOWER.pl i Smart Home & Energy — przegląd i naprawy

26.10.2026. Zakres: strona główna, konfigurator Smart Home & Energy, prywatność, publiczne zasoby i przygotowanie wydania. Prace lokalne na `feat/pv-mining`; **bez wdrożenia na ampower.pl**.

## Wynik

Przygotowano spójną wersję całej strony, zachowując osobny moduł PV Mining. Naprawiono błędne interpretowanie liczb w kalkulatorze usług, dodano podgląd/kopiowanie zapytania, uporządkowano kontakt w Smart Home oraz obsługę błędów i nawigacji klawiaturą. Publiczny build używa wersjonowanych zasobów i nadal zawiera wyłącznie dozwolone pliki.

**318/318 testów kodu zaliczonych.** Lint trzech stron, składnia JS, JSON-LD, build i kontrola wydania poprawne. W przeglądarce potwierdzono wskazane niżej ścieżki; nie testowano fizycznego telefonu ani rzeczywistej wysyłki.

## Uzgodnienie wersji

Punktem wyjścia był `9b08e31` na `feat/pv-mining`. Nowsza wersja strony głównej i Smart Home znajdowała się w commicie `39fb120` gałęzi `review/murek-feedback-2026-10-24`. Włączono ten stan do lokalnej gałęzi, zachowując wszystkie skrypty i testy PV Mining. Konflikty dotyczyły README i listy poleceń package.json; połączono potrzebne instrukcje i polecenia.

Dodatkowo uwzględniono istniejące, nowsze poprawki czterech plików z katalogu `ampower-murek-review`: usunięcie nieuruchomionej publicznej sekcji opinii, odpowiadających jej deklaracji i zasobów wydania oraz korektę kontrastu. [Ścieżki i SHA-256 przyjętego snapshotu](qa/adopted-snapshot.json). Plików w tamtym katalogu ani w `ampower-website` nie edytowano. To integracja wcześniejszych prac, nie ponowne wykonanie i przypisywanie sobie ich wyników.

Usługa opinii i jej kod backendowy pozostają dostępne w źródłach jako osobny, nieuruchomiony zakres. Nie dodano ich do publicznej strony. PV Mining pozostaje osobnym lokalnym podglądem i nie trafia do publicznego `dist/`.

## Nowe naprawy

| Obszar i dowód problemu | Zmiana | Potwierdzenie odbioru |
|---|---|---|
| Kalkulator usług (`index.html`, `num`/`odswiez`): pole przyjmowało 2,5 punktu, a `parseInt` liczył 2 i pokazywał 300–400 zł. Wartości poza zakresem były po cichu przycinane. | Jawna walidacja aktywnych pól. Liczby punktów, pomieszczeń i kamer muszą być całkowite; pusty/błędny wpis blokuje kwotę i linki zapytania. Wpis pozostaje do poprawienia, bez cichej zmiany na inną liczbę. | Testy 2,5, pustej wartości, −1 i 1000 punktów; przeglądarka: kwota „—”, link e-mail bez href, widoczny komunikat. |
| Trasy i długości również były obcinane do całych metrów. | Pomiary trasy, powierzchni i linii kroplującej zachowują części jednostki. | Test 5,5 m: szkic zawiera 5,5 w wartości liczbowej zapytania, a cena uwzględnia dodatkowe pół metra. Stawki cennika pozostały niezmienione. |
| Strona główna oferowała tylko SMS/mailto, bez pełnego tekstu do ręcznego przeniesienia. | Dodano rozwijany podgląd i kopiowanie zapytania; przy braku Clipboard API tekst jest zaznaczany do ręcznego skopiowania. Linki mają limit transportu 8000 znaków; treść nie jest ucinana. | Przeglądarka: poprawne 12 punktów → 1700–2400 zł, pełny szkic i komunikat poprawnego skopiowania. Nie otwierano poczty/SMS i nie wysyłano wiadomości. |
| Przejście z komunikatu błędu do pola było zawodne podczas aktualizacji interfejsu. | Komunikaty mają przyciski prowadzące do pola; usunięto zbędne przeliczanie na blur pól liczbowych i tekstowych. Podobne przyciski dodano w Smart Home. | Przeglądarka: fokus `elek-punkty` oraz `email` w Smart Home; błędne pole ma `aria-invalid`. |
| Smart Home pokazywał oba pola kontaktu, mimo że szkic uwzględniał tylko kanał preferowany przez klienta. | Pokazywane jest pole właściwe dla wybranego kanału. Gdy odbiornik serwerowy będzie osobno uruchomiony, zachowany jest jego odrębny kontrakt danych. Dodano krótkie objaśnienie. | Telefon → szkic z numerem testowym, e-mail ukryty. Zmiana na e-mail pokazuje adres i unieważnia stary szkic. Przygotowanie nowej wersji i kopiowanie poprawne. |
| Brak skrótu klawiaturowego omijającego menu strony głównej. | Dodano „Przejdź do treści”; główny landmark jest celem fokusu. | Enter na skrócie → fokus `top`. Menu Smart Home zamyka się Escape i oddaje fokus do przełącznika. |
| Możliwe użycie starego JS/CSS z pamięci podręcznej wraz z nowym HTML. | Jeden identyfikator wydania w odwołaniach HTML, importach modułów i CSS. Hash uwzględnia publiczne źródła i kod transformacji builda; CSP powstaje z finalnego HTML. | 18 odwołań z jedną wersją `958c11895cf07969`; wszystkie pliki istnieją, kontrola CSP i whitelisty przechodzi. |

Stare ceny usług nie otrzymały nowej daty weryfikacji ani statusu zatwierdzonej oferty. Naprawa arytmetyki nie jest potwierdzeniem aktualności cennika, doboru sprzętu ani kosztu konkretnej realizacji.

## Przegląd całej strony

### Publiczna domena

Pobrano aktualne HTML strony głównej, Smart Home i prywatności. Odpowiedzi wskazują hosting GitHub Pages. Odnotowano daty i hashe plików; nie zakładano zgodności produkcji z lokalną gałęzią.

Sprawdzenie HEAD bez wysyłania formularzy: **24 odnośniki/zasoby domeny publicznej — bez błędów HTTP** oraz **58 lokalnych — bez błędów HTTP**. [Wyniki i hashe stron](qa/links.json). To zestaw odwołań z trzech HTML, także srcset; nie jest pełnym crawlerem całej domeny, odczytem GSC ani audytem wszystkich historycznych adresów. Zasoby wskazane wewnątrz CSS dodatkowo obejmuje lista plików builda, nie osobny zdalny crawl.

### Telefon, tablet i komputer

Sprawdzono każdą z trzech podstron przy szerokościach **320, 390, 768 i 1366 px**. W każdym z 12 pomiarów szerokość przewijania dokumentu była równa jego szerokości dostępnej: brak poziomego przepełnienia w sprawdzonych stanach. W Smart Home dodatkowo przetestowano wybór kategorii/celu, oba kanały kontaktu, walidację, przygotowanie/kopiowanie oraz unieważnienie szkicu po zmianie konfiguracji.

Na stronie głównej sprawdzono pusty i poprawny kalkulator oraz błędną ilość, przejście do pola, podgląd i kopiowanie. Menu mobilne prowadzi do Smart Home. Zasady oferty pozostają czytelnie warunkowe: zgodność modeli i sterowanie energią wymagają kwalifikacji, kwoty Smart Home są do indywidualnej wyceny. Publiczne opinie nie udają działającej usługi bez API.

[Dowody przeglądarkowe](qa/browser.json), [główna — telefon](qa/home-mobile.jpg), [główna — komputer](qa/home-desktop.jpg), [Smart Home — telefon](qa/smart-mobile.jpg).

### Dane, analityka i bezpieczeństwo

Zachowano istniejący mechanizm jawnego wyboru analityki z nowszej gałęzi. Lokalny host nie uruchamia Google Analytics; nie wysyłano testowych zdarzeń do Google i nie zmieniano konta GA. Nie oceniano zgodności prawnej polityki prywatności ani konfiguracji kont dostawców.

Konfigurator Smart Home nadal nie zapisuje kontaktu w trwałej pamięci ani URL. Przechowuje dane tylko w otwartej stronie i przygotowuje wiadomość do samodzielnego wysłania. Nie włączono odbiornika, Turnstile ani płatnego dostawcy poczty. Zapisane w dowodach dane kontaktowe są syntetyczne.

Build zawiera **74 jawnie dozwolone pliki**. Backend, dokumenty, bazy, kopie i prywatne cenniki są poza nim. Kontrola wydania sprawdza listę, typ pliku i CSP; nie jest pentestem ani skanem całej historii repozytorium. W dzienniku badanej sesji przeglądarki nie stwierdzono błędów JS/CSP. Nie zmieniano DNS, ustawień Pages ani nagłówków CDN.

## Weryfikacja i odtworzenie

- [318 testów](qa/unit-tests.txt), w tym pięć nowych przypadków kalkulatora i zachowane 51 testów PV Mining.
- `npm run lint`, `npm run build`, `npm run release:check`, `git diff --check` — zaliczone.
- [Wersje i istnienie zasobów](qa/assets.json).
- Testy przeglądarkowe wykonywano przez CUA; nie uruchamiano dodatkowych agentów ani automatyzacji Playwright z terminala.

Podgląd w tej sesji: **http://127.0.0.1:4190/** i **http://127.0.0.1:4190/smart-home-energy/**. Serwer udostępnia wyłącznie `dist/`. Jeżeli zostanie zatrzymany:

```sh
npm run build
python3 -m http.server 4190 --bind 127.0.0.1 --directory dist
```

Nie uruchamiać serwera statycznego z katalogu głównego repozytorium. Test fizycznego telefonu wymaga osobnego, świadomego udostępnienia samego `dist/` w sieci lokalnej albo zatwierdzonego podglądu HTTPS; obecny loopback jest dostępny tylko na tym komputerze.

## Pozostałe warunki publikacji

1. Odbiór na fizycznym iPhone/Safari i Androidzie, klawiatury ekranowej, rzeczywistego powiększenia i czytnika ekranu. Emulowana szerokość nie zastępuje tych testów.
2. Potwierdzenie zakresów/cenników usług i docelowego kanału kontaktu. Nie gwarantować ceny dla dużych lub nietypowych instalacji na podstawie uproszczonego kalkulatora.
3. Oddzielna decyzja o odbiorniku Smart Home, e-mailach, analityce produkcyjnej i ewentualnej usłudze opinii. Nie są uruchomione przez sam build.
4. Zgoda na publikację wyłącznie publicznego artefaktu i odbiór na domenie wraz z planem powrotu. Nie scalać całej gałęzi źródłowej do produkcyjnego root `main`; zawiera ona także prywatne narzędzia i dokumentację.

Nie wykonano push, merge do main ani wdrożenia. Lokalne `main` i `origin/main` zachowały odpowiednio `2f9be19` i `06a7902`. Nie kupowano usług, nie używano resetów limitu i nie wysyłano wiadomości.

Odczyt przed zapisaniem raportu: **52% limitu pięciogodzinnego**, **92% tygodniowego**; odnowienia **26.10.2026 12:29 CET** i **02.11.2026 07:29 CET**. Są to odczyty konta, nie szacunki.
