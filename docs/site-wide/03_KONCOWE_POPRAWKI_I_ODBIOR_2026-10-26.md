# AMPOWER — końcowe poprawki po odnowieniu limitu

26.10.2026, jednorazowy powrót po 17:45 CET. Początek: lokalny `feat/pv-mining`, commit `5dacf9b`, czysty katalog roboczy. Nie rozpoczynano audytu od zera; sprawdzono pozostałe niespójności przepływu danych i kosztorysu strony głównej oraz Smart Home & Energy.

## Wynik odbioru

**Cztery potwierdzone usterki naprawione. Zmieniony publiczny pakiet jest gotowy do przeglądu właściciela.** Nie wykryto w sprawdzonych ścieżkach dalszego błędu blokującego przygotowanie zapytania. „Gotowy” nie oznacza zatwierdzenia cen, testu fizycznych telefonów ani wdrożenia na domenie.

Zaktualizowano [gałąź GitHub do przeglądu](https://github.com/murek-m/ampower-pl/tree/review/ampower-site-2026-10-26) zwykłym commitem `ddb54a4fea3ac4cf7be1f54a0e08022e67c4e234`, którego rodzicem jest poprzednio wysłany `e3988ec850ef3e9647d1619169cca2b2af491314`.

**Produkcja pozostaje bez zmian.** Przed i po wysyłce `main` wskazywał `06a79027bc8325526a261a32f7f390658639f948`; źródło GitHub Pages nadal `main:/`, tryb `legacy`. Nie zmieniono DNS, hostingu ani ustawień publikacji. [Potwierdzenie zdalnych referencji i Pages](qa/final-2026-10-26/github.json).

## Naprawione błędy

| Priorytet i problem | Odtworzenie i dowód | Zmiana i kryterium odbioru |
|---|---|---|
| P2 — miejscowość realizacji zdalnej znikała z zapytania | W widocznym polu wpisać Głogów, wybrać konfigurację zdalną i przygotować wiadomość. `buildInquiry` ustawiał `locality=null`. [Dane przed naprawą](qa/final-2026-10-26/before.json), [przeglądarka przed naprawą](qa/final-2026-10-26/before-ui.json). | `smart-home-energy/model.js`, `buildInquiry` i `validate`: widoczna miejscowość jest zachowana i walidowana do 80 znaków przy każdym sposobie realizacji. Gotowość Ethernet/osoby nadal dotyczy tylko realizacji zdalnej. Szkic zawiera „Miejscowość: Głogów”. |
| P2 — ustawienia wspólne formularza nie trafiały do wiadomości | Wybrać posiadane radio SONOFF, warunki instalacji, złożoność, liczbę prostych/zaawansowanych automatyzacji i wsparcie rozszerzone. W starym szkicu brakowało tych odpowiedzi, mimo ich odczytywania przez UI. | `data.js`, `PROJECT_FIELDS`; `model.js`, `projectAnswers`/`projectLines`/`inquiryText`; `app.js`, podsumowanie. Sześć pól ma wspólną definicję etykiet i opcji. Wszystkie wybrane odpowiedzi są w podsumowaniu, pełnym szkicu i zakodowanym body mailto. Brak automatycznej ceny lub nowej opłaty za wsparcie — zakres i koszt do potwierdzenia w ofercie. |
| P2 — liczby automatyzacji nie były walidowane w publicznym generatorze szkicu | Wpisać −2 lub abc i przygotować wiadomość. Przed naprawą `validate` zwracało brak błędów; sprawdzanie było wyłącznie w ścieżce wyłączonego odbiornika serwerowego. | Wspólna walidacja dla szkicu i odbiornika: liczby całkowite 0–999 albo puste. Puste nie jest zamieniane w 0. Błędny wpis blokuje szkic; przycisk błędu otwiera zamknięte szczegóły i przenosi fokus do pola. Dodano widoczną instrukcję i powiązanie `aria-describedby`. |
| P2 — kwota „Razem” nie zawsze równała się sumie wyświetlonych usług | 1 punkt wymiany osprzętu: 50–100 PLN; monitoring 4 kamer: 3350–5400 PLN. Poprzednia suma: **3400–5450**, zamiast widocznych **3400–5500 PLN**. [Test odtwarzający błąd przed poprawką](qa/final-2026-10-26/before-total.txt). | `index.html`, `rounded` i `odswiez`: suma agreguje zaokrąglone przedziały poszczególnych pozycji. Ten sam wynik jest na stronie i w szkicu. Dodano krótkie wyjaśnienie zaokrąglenia do 50 PLN. **Stawki CENNIK nie zostały zmienione.** |

W poprawkach zachowano niewiążący charakter zapytania. Nie włączono publicznego cennika Smart Home, nie dopisano robocizny AMPOWER i nie zmieniano rentowności ani kosztorysu prototypów PV Mining.

## Weryfikacja zmian

- **158/158 testów celowanych**: Smart Home, kalkulator usług, pricing, prezentacja i wcześniejsze uwagi do strony. [Wyniki](qa/final-2026-10-26/targeted-tests.txt).
- **6/6 testów dodatkowych** modelu, w tym zaktualizowana regresja kontraktu miejscowości we wszystkich kombinacjach. Ta macierz dotyczy zmienionej reguły; nie powtarzano wcześniejszych macierzy przeglądarkowych. [Wyniki](qa/final-2026-10-26/additional-targeted.txt).
- Testy nowych wartości: −2, abc, 1.5, 1e2, 1000 i 04 są odrzucane. Puste pole i jawne 0 pozostają rozróżnione. Test wszystkich sześciu dodatkowych ustawień sprawdza ich zachowanie w treści bez generowania kwoty.
- [Lint](qa/final-2026-10-26/lint.txt): trzy HTML, powiązania etykiet i ARIA, składnia 70 plików JS, skrypty inline i JSON-LD poprawne.
- [Build](qa/final-2026-10-26/build.txt) i [kontrola wydania](qa/final-2026-10-26/release.txt) zaliczone. Wersja zasobów `0fcd0f186417ed95`, 74 dozwolone publiczne pliki. `git diff --check` poprawny.
- [Przeglądarka](qa/final-2026-10-26/browser.json): zgodność podsumowania, pełnej wiadomości i mailto; poprawny kontakt testowy; blokada błędnej liczby i usunięcie starego szkicu/href; przejście do pola z zamkniętych szczegółów; poprawione 0 i kopiowanie; zgodna suma pozycji i zapytania. Nie wysyłano poczty ani SMS.

W tej kontynuacji zaliczono **164 testy celowane**, a nie ponownie cały wcześniejszy zestaw 320. Nie ma podstaw do deklarowania, że niewykonane teraz testy backendu i PV Mining zostały ponownie uruchomione. Ich kod nie był zmieniany.

### Widok telefonu i komputera

Rozbudowane, wypełnione podsumowanie i szkic Smart Home sprawdzono przy 320, 390 i 1366 px. W każdym stanie szerokość dokumentu była równa dostępnej szerokości; body linku e-mail odpowiadało pełnej treści podglądu. Wypełniony kosztorys główny sprawdzono dodatkowo przy 390 px. Konsola badanej sesji nie zawierała błędów.

Dowody wizualne: [Smart Home — komputer](qa/final-2026-10-26/smart-summary-desktop.jpg), [Smart Home — telefon](qa/final-2026-10-26/smart-summary-mobile.jpg), [zgodna suma wyceny — telefon](qa/final-2026-10-26/quote-total-mobile.jpg). Nie są to testy fizycznego iPhone ani Androida.

## Bezpieczne przekazanie

Repozytorium jest publiczne. Nowy commit przeglądowy zawiera drzewo równe wyłącznie sprawdzonemu `dist/`, z tym samym zestawem 74 ścieżek co poprzedni publiczny pakiet. Każdy plik porównano z blobem Git i zapisano SHA-256 w [manifeście](qa/final-2026-10-26/artifact.json). Wysłano tylko historię publicznych artefaktów. Lokalny kod źródłowy, dokumenty, raporty, backend, panel, testy i prywatne kosztorysy nie zostały dołączone do publicznej gałęzi. Nie użyto force-push.

Publiczna wersja obejmuje główną stronę AMPOWER, Smart Home & Energy i prywatność. PV Mining pozostaje osobnym lokalnym prototypem. Zmiana hashy odnośników do zasobów w prywatności nie oznacza zmiany treści polityki ani nowej oceny prawnej.

Podgląd lokalny: **http://127.0.0.1:4190/** oraz **http://127.0.0.1:4190/smart-home-energy/**. Serwer uruchomiono ponownie wyłącznie dla `dist/`, na loopback. W razie zatrzymania:

```sh
npm run build
python3 -m http.server 4190 --bind 127.0.0.1 --directory dist
```

Gałąź GitHub jest pakietem do pobrania/przeglądu, nie osobną opublikowaną witryną. Poprzedni artefakt `e3988ec` pozostaje rodzicem nowego commita, a produkcyjny `main` nie został zmieniony.

## Pozostające warunki odbioru

Nie ma otwartej potwierdzonej usterki z niniejszej kontroli. Pozostają warunki wymagające osobnego odbioru lub decyzji, których nie można zastąpić zmianą kodu:

1. Fizyczny iPhone/Safari i Android, czytnik ekranu, klawiatura ekranowa oraz zachowanie rzeczywistych aplikacji poczty/SMS. Lokalny podgląd nie jest udostępniony w sieci.
2. Potwierdzenie aktualności stawek, danych firmy i deklaracji autoryzacji przez właściciela. Nie wykonano nowego researchu rynkowego ani opinii prawnej.
3. Obecny, jasno opisany sposób kontaktu przygotowuje wiadomość do samodzielnego wysłania. Odbiornik serwerowy, opinie i płatne usługi nie zostały uruchomione. To odrębny zakres, jeśli będzie zamówiony.
4. Osobna zgoda na wdrożenie na ampower.pl i odbiór działania na docelowej domenie. Nie wykonano pomiarów rzeczywistego ruchu/CWV, testu konta GA ani zmian analityki produkcyjnej.

Rzeczywiste odczyty: na początku **100% pozostałego limitu 5 h i 69% tygodniowego**; przed końcowym zapisem **87% i 67%**. Odnowienia aktualnych okien: **26.10.2026 22:45:14 CET** i **02.11.2026 07:29:53 CET**. Bez resetów, dopłat, zmiany modelu i agentów. Jednorazowe zadanie oznaczono jako wstrzymane po wykonaniu, aby nie wracało kolejnego dnia; nie tworzono nowej automatyzacji.
