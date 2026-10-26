# Opinie AmPower

Przygotowano 24.10.2026 według odpowiedzi właściciela. To implementacja lokalna,
bez publikacji na ampower.pl, zakładania kont i wysyłania rzeczywistych wiadomości.

## Zachowanie

- „Opinie” w menu i nowa sekcja bezpośrednio pod realizacjami.
- Trzy najnowsze opublikowane wpisy; „Rozwiń” pobiera kolejne trzy.
- Gwiazdki 1–5, imię i inicjał, miejscowość, wybór usługi, tekst i dobrowolne zdjęcie.
- Formularz dostępny dla wszystkich bez konta. Moderacja nie jest weryfikacją klienta.
- Publikacja dopiero po zatwierdzeniu; również rzeczowe opinie krytyczne.
- Zdjęcie do 12 MB: przeglądarka zmniejsza i konwertuje do PNG. Serwer sprawdza
  rozmiar, sumy kontrolne i dekompresję oraz usuwa metadane. Zapisany plik do 1,5 MB.
- Nieopublikowane zdjęcia są dostępne wyłącznie w zalogowanym panelu.
- Panel `/admin/opinie/`: publikacja, odrzucenie z powodem, odpowiedź, wycofanie
  publikacji i usuwanie danych. Oddzielny od lokalnego panelu wycen Energy;
  wykorzystuje jego styl, ale nie udostępnia kosztorysów ani danych klientów.
- Link do przekazywania osobiście: `https://ampower.pl/#dodaj-opinie`.
- Kod QR: `assets/reviews-qr.svg`, dostępny także do pobrania w panelu.
  **Nie rozdawać przed uruchomieniem online.**
- Powiadomienia do `kuba@ampower.pl`: trwała kolejka z ponowieniami i kluczem
  idempotencji. Wiadomość zawiera link do panelu i identyfikator, bez treści i zdjęcia.
  Przyjęcie przez dostawcę jest oznaczane osobno; nie oznacza potwierdzonego doręczenia.
- Niezatwierdzone/odrzucone wpisy są usuwane po 90 dniach od przesłania.

## Lokalny podgląd

W katalogu projektu:

```sh
npm run build
npm run reviews:local
```

Strona: `http://127.0.0.1:8791/#opinie`.
Panel: `http://127.0.0.1:8791/admin/opinie/`.
Serwer wypisuje losowe hasło na aktualne uruchomienie. Lokalnie nie wysyła poczty.
Trwałe dane: `~/.local/share/ampower-reviews/`, poza repozytorium i `dist/`.
Można podać inny prywatny katalog przez `AMPOWER_REVIEWS_DATA_DIR`.
Nie używaj tego samego katalogu co panel wycen.

Podgląd statyczny `npm run preview` pokazuje sekcję, ale nie uruchamia API;
w takim przypadku formularz jest zablokowany z informacją o niedostępności.
Nie pokazuje fałszywego sukcesu ani przykładowych wpisów.

## Proponowane uruchomienie online

Zostawić główną stronę na obecnym GitHub Pages, a usługę opinii uruchomić na
zarządzanym **Render Web Service**, w regionie Frankfurt. Dostawca poczty:
**Resend** z potwierdzoną domeną nadawcy. Wymagane są konta właściciela,
wybrany plan, podłączenie repozytorium/artefaktu, domeny i sekrety.

Odczyt cenników 24.10.2026:

- Render: serwer 0.5c-512mb za **7 USD/miesiąc**, trwały dysk **0,25 USD/GB/miesiąc**.
  Przy 1 GB wychodzi 7,25 USD/miesiąc przed podatkami, zmianami kursu i ewentualnymi
  opłatami za przekroczenia limitów. Workspace Hobby nie ma opłaty podstawowej.
  [Cennik](https://render.com/pricing).
- Resend Free: 3000 wiadomości/miesiąc, do 100 dziennie.
  [Cennik](https://resend.com/pricing).
- Darmowy serwer Render nie zapewnia potrzebnego trwałego dysku i usypia.
  Bez trwałego magazynu opinie mogłyby zniknąć przy wdrożeniu/restarcie.
  [Dyski](https://render.com/docs/disks), [usługi](https://render.com/docs/web-services).

Te usługi nie zostały zamówione ani opłacone. Koszt należy ponownie sprawdzić
na ekranie zamówienia. Nie potrzeba kupować domeny, jeśli wykorzystamy
subdomenę `opinie.ampower.pl` istniejącej domeny.

### Konfiguracja serwera

Repozytorium ma brudną gałąź roboczą i historyczny publiczny `main` zawierający
tylko artefakt Pages. **Nie łączyć całej gałęzi roboczej z `main`.**
Usługę Node uruchomić z osobnej, przejrzanej gałęzi lub wydzielonego prywatnego
repozytorium. Publiczne wydanie Pages nadal przenosi wyłącznie `dist/`.

- Node.js: 24 LTS (minimum 22.13; używamy wbudowanego SQLite).
- Build: `npm run build` (bez dodatkowych zależności produkcyjnych).
- Start: `npm run reviews:start`.
- Health check hostingu: `/ready` (sprawdza odczyt bazy i dostępną przestrzeń;
  zwraca 503 przy problemie). `/health` pozostaje prostym testem procesu.
- Jeden proces/instancja; baza SQLite i dysk lokalny nie są konfiguracją dla wielu replik.
- Dysk: 1 GB, zamontowany pod `/var/data`.
- Trwale ustawione zmienne środowiska:

| Nazwa | Wartość |
| --- | --- |
| `AMPOWER_REVIEWS_DATA_DIR` | `/var/data/ampower-reviews` |
| `AMPOWER_PUBLIC_ORIGIN` | `https://ampower.pl` |
| `AMPOWER_REVIEWS_ORIGIN` | `https://opinie.ampower.pl` |
| `AMPOWER_REVIEWS_ADMIN_PASSWORD` | Losowe, silne hasło, minimum 20 znaków, w menedżerze haseł właściciela |
| `AMPOWER_RESEND_KEY` | Klucz z uprawnieniem wysyłki, wyłącznie w sekretach usługi |
| `AMPOWER_MAIL_FROM` | Nadawca z domeny zweryfikowanej w Resend |
| `AMPOWER_REVIEWS_TRUST_PROXY` | `1` tylko za kontrolowanym reverse proxy, które dopisuje rzeczywisty IP na końcu `X-Forwarded-For` |

`PORT` ustawia hosting. Nie zapisuj haseł i kluczy w plikach publicznych ani Git.
Hasło nie jest wyświetlane w logach produkcji. Sesja panelu trwa godzinę;
ciasteczko jest HttpOnly/SameSite=Strict/Secure, operacje wymagają CSRF i właściwego Origin.

Przed włączeniem zaufania do nagłówka IP sprawdzić rzeczywiste nagłówki
wybranego hostingu i jego ochronę przed podmienianiem adresu przez klienta.
Bez tej opcji limit opiera się na adresie połączenia. Przy wspólnym proxy
ograniczałby wszystkich klientów razem. Na brzegu hostingu ustawić również
ograniczenie żądań; istnieją limity aplikacyjne, pułapki na boty i podpisany token,
ale otwarty formularz nie jest odporny na każdy automatyczny spam.

### Po podłączeniu usługi

1. Skonfigurować DNS subdomeny i HTTPS na hostingu.
2. W `assets/reviews-config.js` ustawić `REVIEWS_API_BASE` na `https://opinie.ampower.pl`.
3. Sprawdzić dokładne dane dostawców i zasady retencji w informacji o prywatności.
4. Zbudować i opublikować publiczny artefakt Pages zgodnie z dotychczasową whitelistą.
5. Sprawdzić z ampower.pl: zgłoszenie ze zdjęciem, odebranie e-maila przez właściciela,
   logowanie, publikację i widoczność zdjęcia. Nie rozsyłać zaproszeń przed tym testem.
6. Dopiero wtedy przekazywać link i QR klientom.

Powiadomienia działają tylko przy ustawieniu klucza i nadawcy w produkcji.
Panel jasno pokazuje ich brak. Próby są ponawiane z opóźnieniem, przez mniej
niż 23 godziny od pierwszej próby; potem stan wymaga sprawdzenia u dostawcy,
żeby nie powielać wiadomości poza jego 24-godzinnym oknem idempotencji.
[Idempotencja Resend](https://resend.com/changelog/idempotency-keys).

## Kopie i utrzymanie

### Narzędzie kopii po audycie

`npm run reviews:backup -- /prywatny/nowy-katalog-kopii` z ustawionym
`AMPOWER_REVIEWS_DATA_DIR` tworzy spójną kopię przez SQLite `VACUUM INTO`,
obejmującą również aktywny WAL. Katalog docelowy nie może jeszcze istnieć;
jego katalog nadrzędny musi istnieć. Backup jest poza źródłem i repozytorium,
ma katalog 0700, bazę 0600, kontrolę integralności i manifest SHA-256.
Test odtworzył opinię oraz zdjęcie z takiej kopii do osobnego magazynu.
Kopia jest nieszyfrowana: szyfrowane miejsce docelowe, harmonogram, retencję
i przechowywanie poza dyskiem usługi trzeba skonfigurować na hostingu.

Domyślny limit bazy opinii to 512 MiB; nowy zapis jest zatrzymywany przy
braku miejsca lub spadku wolnej przestrzeni poniżej 16 MiB. Nie zastępuje to
alarmu zajętości dysku ani kopii poza usługą. Panel pokazuje stan magazynu.
Filtr grupy jest wykonywany przed paginacją; licznik obejmuje również starsze
oczekujące wpisy. Publiczna lista i panel używają kursora daty/ID.
Formularz odnawia token bez utraty treści i zdjęcia oraz pozwala ponowić
uruchomienie po błędzie sieci. Minimalny czas antyspamowy nadal obowiązuje.

Publiczny build dodaje CSP z hashami skryptów inline. Po ustawieniu
`REVIEWS_API_BASE` ponownie wykonać build — origin jest dodawany do CSP.
Serwer Node wysyła długi cache wyłącznie dla obrazów/fontów z hashem w nazwie.
GitHub Pages ma własne nagłówki: długi cache, HSTS i blokadę osadzania strony
trzeba ustawić w obsługującej je warstwie hostingu/CDN. Meta CSP chroni stronę
również na Pages, ale nie zastępuje nagłówków niedostępnych jako meta.

Opinie i zdjęcia są w jednym pliku SQLite z WAL, poza publicznym artefaktem.
Nie kopiować samego aktywnego pliku bazy z pominięciem WAL. Wykonywać
spójny backup przez SQLite Backup API/`.backup` albo zatrzymać usługę i
skopiować cały katalog danych. Przechowywać prywatne zaszyfrowane kopie
z ograniczoną retencją i sprawdzić odtworzenie. Automatyczne migawki dysku
nie zastępują sprawdzonego logicznego backupu bazy.

Publikacja nie edytuje treści ani gwiazdek klienta. Odmowa wymaga podania
powodu. Dane i zdjęcie można usunąć z panelu; istniejące kopie zapasowe
podlegają odrębnej retencji. Po odtworzeniu kopii ponownie zastosować
zgłoszone wycofania zgód/usunięcia. Monitorować zajętość dysku i kolejkę poczty.

## Sprawdzenie

```sh
npm test
npm run lint
npm run build
npm run release:check
npm run test:e2e:reviews
```

Testy obejmują publikację, zdjęcia i usuwanie metadanych, izolację danych,
idempotencję, CSRF/Origin, retencję, retry poczty i układ mobilny. E2E zapisuje
oznaczone zrzuty z **wyłącznie syntetycznymi wpisami** do `output/opinie-qa/`.
Nie wysyła e-maili i usuwa tymczasowy magazyn. Nie jest testem doręczenia poczty
ani wdrożenia produkcyjnego.

Informacje o zasadach opinii: [UOKiK](https://uokik.gov.pl/falszywe-opinie-stop).

## Uzupełnienie odbioru 25.10.2026

W gałęzi recenzji kontrola ścieżki magazynu używa realpath i odrzuca alias
rodzica prowadzący do repozytorium. Hash kopii jest liczony buforem 64 KiB;
nie ładuje się całego pliku do pamięci. Testy obejmują CLI, bazę powyżej 16 MiB
oraz odtworzenie opinii ze zdjęciem. Szczegóły: ODBIOR_UWAG_MICHAELA.md.
