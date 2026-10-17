# AMPOWER — etap 8B: raport końcowy

Data: 11.10.2026. Gałąź `feat/smart-home-energy-mvp`. Stan: działający prywatny prototyp lokalny na danych demonstracyjnych. Bez push, merge, deploy, publikacji, rzeczywistej poczty i aktywacji płatnych usług.

## 1. Implementacja

Dodano osobny panel Node/HTML/CSS/JS z logowaniem i serwerową kontrolą dostępu. Dashboard zawiera sześć statusów, wyszukiwanie, filtrowanie, przypomnienia po 48 godzinach, wartość kompletnych ofert i przewidywany wynik finansowy. Editor obsługuje klienta, urządzenia, indywidualne usługi, materiały, ilości, koszty/sprzedaż netto, czasy/stawki pracy, dojazd, rezerwę, koszty działalności, rabaty, VAT, cele marży i uwagi.

Dodano deterministyczną analizę polskiego opisu, propozycje z istniejącego katalogu, listę braków, archiwum wersji z danymi klienta, unieważnienie zatwierdzenia po edycji, świadome zatwierdzenie wersji, generowanie prawdziwych PDF, ręczne odnotowanie wysłania/akceptacji, audyt, usuwanie danych i prywatne kopie z manifestem. Kontrola konkurencyjnych zapisów zapobiega nadpisaniu innej karty.

## 2. Co działa lokalnie

Oba scenariusze: istniejący konfigurator DEMO → API → trwały zapis → wstępny kosztorys → panel oraz opis wprowadzony przez właściciela → analiza → kosztorys → edycja → zatwierdzenie → PDF. Dane i wcześniejsze wersje przetrwają restart. Użyto 24 modeli/ścieżek i 17 usług oraz dotychczasowego silnika finansowego, magazynu, walidacji i PDF; nie zbudowano równoległego publicznego kalkulatora.

Ceny niezatwierdzone są puste lub wyraźnie wymagają zgody. DEMO z kompletnymi kwotami jest fikcyjnym ćwiczeniem, nie cennikiem. Parser nie wymyśla modelu Daikin, liczby stref ani cen. Propozycje wymagają kontroli zgodności. Nie uruchomiono modelu językowego ani zewnętrznego API AI.

## 3. Co wymaga produkcyjnego backendu

Obecny backend działa lokalnie. Produkcja wymaga transakcyjnej prywatnej bazy, konta z MFA, HTTPS, sekretów w środowisku, produkcyjnego antyspamu, dostawcy i workera poczty, monitoringu, szyfrowanych kopii, polityki retencji oraz testów wdrożenia. Panel lokalny nie jest serwerem do opublikowania bez tych prac. Publiczny formularz nadal nie wysyła do produkcyjnego odbiornika.

## 4. Uruchomienie na Macu

```sh
cd '/Users/jb/Ampower Smart Home/ampower-website'
npm run panel:local
```

Adres: `http://127.0.0.1:8790`; kod logowania jest w Terminalu. Wymagany Node 20+, do PDF Python z ReportLab i polski font; na tym Macu wykrywane automatycznie. Magazyn poza repo: `~/.local/share/ampower-panel-demo`. Szczegóły i alternatywna konfiguracja w [instrukcji](08B_INSTRUKCJA_UZYTKOWNIKA.md).

## 5. iPhone w LAN

Odczytaj `ipconfig getifaddr en1`, zatrzymaj panel i uruchom `AMPOWER_PANEL_HOST=ADRES_MACA npm run panel:local`. Na telefonie otwórz `http://ADRES_MACA:8790` i podaj kod. Mac i telefon muszą być w tej samej dostępnej sieci. Lokalnie używaj danych fikcyjnych; produkcja wymaga HTTPS. Sprawdzono faktyczne połączenie przez prywatny interfejs Maca w mobilnym widoku Chromium, bez secure context. Nie wykonano testu fizycznego iPhone ani Safari.

## 6. Nowy kosztorys

„Nowa wycena” → dane klienta i opis → analiza → sprawdzenie braków i propozycji → utworzenie kosztorysu. Jednoznaczne 8 rolet/12 obwodów zostają rozpoznane; zakresy i przybliżenia nie są zamieniane na pewne ilości. Dodaj właściwe pozycje z katalogu lub własne, uzupełnij koszty i czasy. Sam parser nie rozstrzyga zgodności instalacji elektrycznej/HVAC i nie wykonuje doboru projektowego.

## 7. Zmiana ceny urządzenia

Edytuj zakup/koszt netto, sprzedaż netto i ilość w wierszu; panel przelicza wynik automatycznie. W szczegółach zatwierdź ceny i kwalifikację VAT. Zapis tworzy nową wersję roboczą; dane klienta i wcześniejsza oferta pozostają w archiwum.

## 8. Poprawa marży

Panel oblicza koszt własny godzin właściciela i odróżnia marżę od narzutu. Główny cel korzysta z pełnego kosztu: sprzęt + materiały + praca + dojazd + koszty dodatkowe + rezerwa pracy + przypisane koszty działalności. Marża = wynik/sprzedaż, narzut = wynik/koszt. „Ustaw cenę dla docelowej marży” tworzy jawną korektę netto wymagającą VAT; można też zmienić sprzedaż poszczególnych pozycji. Rabat obniża każdą podstawę i VAT; nie łączy się go z końcową korektą.

Przykład testowy: sprzedaż 800 netto, pełny koszt 448, wynik 352, marża 44%, narzut ≈78,57%. Cel 30% wymaga co najmniej 640 netto. Są to liczby fikcyjne, nie oferta handlowa ani zatwierdzenie cennika. Wynik pozostaje przed podatkiem dochodowym.

## 9. Oferta PDF

Uzupełnij warunki, ważność, ceny, koszty i VAT, potwierdź kontrolę techniczną/finansową, zapisz i zatwierdź konkretną wersję. PDF zawiera logo, wykonawcę, klienta, identyfikator/wersję, datę, ważność, zakres, sprzęt i prace, sumy netto/VAT/brutto, warunki oraz gwarancję i serwis, jeśli ich treść zatwierdzono. Nie zawiera kosztów zakupu, stawek własnych, marż i wewnętrznych notatek. Każda wersja DEMO jest tak oznaczona; robocza jest dodatkowo niezatwierdzona. Niekompletne kwoty blokują PDF.

Przykładowe pliki znajdują się w ignorowanym `output/pdf/`: `ampower-8b-robocza-demo.pdf`, `ampower-8b-zatwierdzona-demo.pdf`, `ampower-8b-wersja-2-demo.pdf` i test wielostronicowy. Archiwum pozwala ponownie wygenerować wcześniejszą kompletną wersję. Zapisywany jest hash wygenerowanego PDF, nie jego trwały binarny plik; odtwarzalność jest semantyczna, a nie gwarancją identycznych bajtów. W produkcji, jeśli potrzebne są dokładnie te same bajty, trzeba dodać prywatne archiwum plików PDF związane z wersją.

## 10. Obsługa zapytań

Konfigurator DEMO dostępny na loopback Maca korzysta z istniejącej walidacji i magazynu. Nadawany jest unikalny identyfikator; zapis jest atomowy, z idempotencją, honeypotem i limitem żądań. Powtórzenie po utraconej odpowiedzi zachowuje identyfikator. Zmienione dane pod tym samym kluczem dają konflikt. Odpowiedź przyjęcia dotyczy trwałego zapisu, nie wysłanej poczty. Powiadomienie ma `demo-disabled`; nawet uruchomienie adaptera nie wysyła takich rekordów.

Adres docelowy powiadomień po wdrożeniu: `kuba@ampower.pl`. Obecnie nie przesłano żadnej wiadomości. Ręczne statusy wysłania i akceptacji wymagają notatki i zatwierdzonej oferty; nie wykonują operacji zewnętrznych.

## 11. Testy i dowody

| Sprawdzenie | Wynik |
| --- | --- |
| `npm test` | 219/219 PASS, w tym 35 testów panelu; bez pominięć |
| `npm run lint`, `npm run build`, `git diff --check` | PASS |
| Nowy panel: rzeczywisty Chrome/Chromium 155.0.8059.40 | 15/15 scenariuszy PASS |
| Dotychczasowy formularz/API sprzedaży | 9/9 scenariuszy PASS |
| Regresja konfiguratora i strony | 29/29 PASS; 237 opcji formularza, cztery kalkulatory i kombinacja |
| Dodatkowa regresja | 13/13 PASS, w tym 66 par kategorii |
| PDF | Rzeczywiste dokumenty, kontrola tekstu/braku pól poufnych, render i wizualna kontrola; test 70 pozycji/10 stron |

Testy obejmują VAT i zaokrąglenia, rabat/mieszany VAT, marżę/narzut/pełne koszty, darmową pracę właściciela, null/ułamki/olbrzymie kwoty, podwójny klucz pracy, zapis/odczyt/backup, wersje i hash zatwierdzenia, historię klientów, CSRF/Host/Origin/sesje/limity, odrzucanie prywatnych ścieżek i symlinków, usunięcie wszystkich wersji, blokadę ponowienia po usunięciu, brak poczty DEMO i brak danych prywatnych w publicznym buildzie.

Browser QA: rzeczywista edycja ilości/ceny/rabatu, zapis, zatwierdzenie, pobranie PDF, stare wersje, nowy opis, dodawanie/usuwanie pozycji, konfigurator → dashboard, wylogowanie i działanie w LAN przez HTTP. Dashboard i edytor nie przewijają się poziomo przy 320/390/768/1440 px; regresja publiczna obejmuje także inne progi. Powiększenie tekstu sprawdzono przez CSS 200%, nie przez rzeczywisty zoom Safari. Brak wyjątków JS i ruchu zewnętrznego w testach panelu. To nie jest pełny pentest produkcyjny.

Dowody: [panel](qa/panel-8b/RESULTS.json), [sprzedaż](qa/panel-8b/public-sales/SALES_E2E_RESULTS.json), [regresja](qa/panel-8b/public-regression/06_E2E_RESULTS.json), [dodatkowe QA](qa/panel-8b/public-regression/06_ADDITIONAL_RESULTS.json), zrzuty w `qa/panel-8b/`. Fizyczny iPhone, Safari, produkcyjna poczta i hosting nie zostały przetestowane.

## 12. Koszt miesięczny

Wariant VPS: Hetzner CX23 + IPv4 ≈5,99 EUR bez VAT; z backupem dostawcy ≈7,09 EUR bez VAT. Alternatywa Workers/D1/Access może kosztować 0 USD w darmowych limitach; Workers Paid od 5 USD/miesiąc, ale przeniesienie PDF wymaga adaptacji i pomiaru CPU. Poczta Resend Free: 0 USD do 3000/miesiąc i 100/dzień; Pro 20 USD, jeśli potrzebny. Domeny, podatki, przewalutowanie, praca utrzymaniowa, niezależne szyfrowane kopie i AI dodatkowo według decyzji.

Zweryfikowane źródła i ograniczenia: [Hetzner](https://docs.hetzner.com/general/infrastructure-and-availability/price-adjustment/), [IPv4](https://docs.hetzner.com/cloud/servers/primary-ips/overview/), [backup](https://docs.hetzner.com/cloud/billing/faq/), [Workers](https://developers.cloudflare.com/workers/platform/pricing/), [D1](https://developers.cloudflare.com/d1/platform/pricing/), [Access](https://www.cloudflare.com/plans/), [Resend](https://resend.com/pricing). Pełne porównanie w [architekturze](08B_ARCHITEKTURA_WDROZENIA.md). Nie wybrano ani nie aktywowano płatnego planu.

## 13. Pozostałe decyzje i uruchomienie produkcyjne

Właściciel musi zatwierdzić aktualne ceny/założenia 8A, stawki pracy i VAT, warunki ofert/gwarancji/serwisu, dostawcę i budżet hostingu, politykę retencji/kopii oraz zgodę na domeny i wdrożenie. Potem: baza i migracja, MFA/HTTPS, antyspam produkcyjny, prawdziwy outbox/poczta z obsługą błędów, monitorowanie, odtworzenie kopii, test fizycznego iPhone/Safari, przegląd bezpieczeństwa i kontrolowane wdrożenie. Nie wymaga to budowania publicznej strony od nowa.

## Pliki i możliwość przywrócenia

Nowe moduły `panel-server.js`, `panel-domain.js`, `panel-demo.js`, `description.js`, `pdf-service.js`, `panel-backup.js`, UI `backend/panel/`, testy panelu i dokumentacja. Istniejące moduły prywatne rozszerzono, zachowując dotychczasowe testy/CLI; publicznego silnika i kalkulatorów nie edytowano w ramach 8B. Szczegóły w [audycie](08B_AUDYT_PANELU.md).

Kopia źródeł sprzed 8B: `/Users/jb/.local/share/ampower-backups/before-8b-20261011-182309`, z manifestem SHA-256. Przy rollbacku porównaj wybrane pliki i zachowaj niezależne równoległe zmiany publicznej strony; nie wykonuj resetu całego niezacommitowanego repozytorium. Dane panelu i backupy są poza repozytorium; wygenerowane PDF w ignorowanym `output/`. Nie wykonano żadnej operacji Git publikującej zmiany.
