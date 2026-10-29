# Naprawy publicznego Smart Home & Energy — 29.10.2026

Najnowsze polecenie użytkownika „W takim razie teraz to napraw” dotyczyło raportu nieprawidłowości publicznej strony. Wdrożono już istniejące i przetestowane poprawki formularza, zachowując pozostałe pliki produkcji.

## Zakres

Baza main:d6e68b701bb4d51adbc9c1fcec60d66aaf04189c. Commit przygotowanego publicznego artefaktu:f9e31b79e59aca4b2aefa2965e25917c34c48c77, wysłany bez force na main w osobnej izolowanej kopii. Źródłowego checkoutu użytkownika nie przełączano ani nie resetowano. Zachowano oryginalny audyt i raport nieprawidłowości.

Osiem zmienionych plików: smart-home-energy/{app.js,data.js,index.html,inquiry-client.js,menu.js,model.js,style.css} oraz assets/consent.js. Publiczny moduł Smart pochodzi z buildu02a1af088937a42d sprawdzonych źródeł7eb6ff6. HTML ma CSP i wersjonowane odwołania do JS/CSS.

AUD001: do szkicu trafiają radio, infrastruktura, złożoność, liczby scen i wsparcie, a miejscowość jest zachowana także przy realizacji zdalnej. AUD002: oba pola scen odrzucają -1,1.5 iabc; puste,0,1,999 działają zgodnie z regułami. Poprawki menu, fokusu i rozmiaru pól pochodzą z wcześniej przetestowanego pakietu.

## Analityka — potwierdzona przyczyna i minimalna zmiana

Żądanie Cloudflare nie było wstrzyknięte przez hosting. Surowy HTML i repo main nie zawierały beacona, natomiast CDP wskazał inicjator: stary assets/consent.js, linia24. Kod produkcji świadomie używał Cloudflare, odmiennie od nowszej źródłowej wersji Google. Zachowano produkcyjnego dostawcę i pozostałą logikę; w publicznym consent.js listę dozwolonych ścieżek ograniczono do / oraz /index.html. Smart, prywatność i PV nie ładują statystyk. Nie przenoszono źródłowego wariantu Google na produkcję.

Ważne dla przyszłego wydania: budowanie całego dist ze źródłowego assets/consent.js przełączyłoby dostawcę statystyk. Należy świadomie zachować aktualną produkcyjną politykę Cloudflare ograniczoną do strony głównej; nie zastępować całego main gałęzią źródłową.

## Ceny i usługi

Cennika nie aktywowano: brak zatwierdzonych danych AMPOWER. price-book.js/pricing.js i inquiry-config.js pozostały bez zmian; działająca arytmetyka została wcześniej sprawdzona119/119 testami i niezależnym rachunkiem. Użytkownik otrzymał pytanie o źródło zatwierdzonych cen; do odpowiedzi pozostaje wycena indywidualna. Odbiornik zapytań pozostaje wyłączony, bez prawdziwych formularzy, wiadomości i opłat zewnętrznych.

## Weryfikacja przed publikacją

Finalny kandydat:28/28 przypadków Chromium/WebKit PASS —12 kategorii i66 par na silnik,6 szerokości375/390/430/1366/1440/1920,3 tryby realizacji ze zgodnym szkicem/mailto,oba pola scen,brak zewnętrznych żądań i błędówJS/HTTP.

Dodatkowo22/22 PASS: polityka analityki dla4 ścieżek w2 silnikach, menu mobilne oraz12 kontroli tekstu200%/pól44px/fontu16px. Podczas symulacji domeny skrypt Cloudflare na stronie głównej zastąpiono atrapą, więc żaden rzeczywisty pomiar nie został wysłany. Build/release74 PASS. Zrzut WebKit390 obejrzany. Wcześniejszy test48 komórek dostępności dotyczył przejściowego wariantu zgody Google i NIE jest wynikiem końcowego artefaktu; końcowe, właściwe testy są w scope-results.json.

49 zachowanych plików potwierdzono SHA256, w tym wszystkie21 plików PV oraz index.html strony głównej. Oprócz manifestu zachowania sprawdzono dokładnie zakres8 zmienionych plików, brak backendu/sekretów i git diff --check.

Dowody poza repo: /Users/jb/outputs/ampower-smart-fix-2026-10-29/ — state.json,release-manifest.json,preserved-sha256.json,beacon-browser.json,final-local/results.json,scope-results.json,logi i screenshoty. Izolowane kopie źródeł i produkcji podano w state.json.

## Stan wdrożenia

GitHub Pages40883248831 zakończył publikację: built dla f9e31b79e59aca4b2aefa2965e25917c34c48c77. Na domenie30/30 pobranych plików ma oczekiwane SHA256:8 zmienionych,21PV i index.html strony głównej. Produkcyjny odbiór28/28 funkcjonalnych oraz22/22 polityki analityki/menu/tekstu200% PASS. Nie ma żądania do Cloudflare ani Google na Smart/prywatności/PV; dostawca strony głównej zachowany i w testach zastąpiony atrapą.

Dwa potwierdzone błędy formularza są NAPRAWIONE I ZWERYFIKOWANE NA PRODUKCJI. Obserwacja Cloudflare wyjaśniona i skorygowana przez zawężenie ścieżek, bez zmiany dostawcy na stronie głównej. Cennik pozostaje ograniczeniem biznesowym: brak bieżących zatwierdzonych danych Smart Home; przeszukanie podłączonych dokumentów nie dostarczyło aktualnego kompletnego katalogu. Nie publikowano danych z prywatnych dokumentów. Pytanie do właściciela o aktualne dane pozostaje aktualne.

Dowody przenośne: docs/qa/smart-public-2026-10-29/. Końcowy stan wyników:50 lokalnych i50 produkcyjnych PASS. VoiceOver/pełny ręczny Safari nadal nieweryfikowane, bez deklaracji pełnej zgodności WCAG. Nie wymaga to zaplanowanej pętli automatycznego wznowienia; potrzebny jest ręczny odbiór i decyzja cenowa. Limit przed końcowym zapisem79%300min, tygodniowy13%; reset1793298259/1793774116.
