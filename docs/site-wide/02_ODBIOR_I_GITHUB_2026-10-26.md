# AMPOWER — ponowny audyt i wysyłka do GitHub

26.10.2026. Zakres: strona główna, Smart Home & Energy, prywatność i publiczny pakiet statyczny. Kontrola wersji po raporcie `01_AUDYT_I_NAPRAWY_2026-10-26.md`, na lokalnej gałęzi `feat/pv-mining`, od commita `5534b01`. Bez agentów, zmiany modelu, wysyłania zapytań i publikacji produkcyjnej.

## Werdykt

**Wersja nadaje się do przeglądu przez właściciela.** W sprawdzonych ścieżkach nie pozostał błąd blokujący. Potwierdzono 320/320 testów kodu, poprawny build i kontrolę publicznego wydania oraz działanie kluczowych ścieżek klienta w przeglądarce. Nie jest to gwarancja działania każdej kombinacji urządzenia i przeglądarki.

Pakiet wysłano na [review/ampower-site-2026-10-26](https://github.com/murek-m/ampower-pl/tree/review/ampower-site-2026-10-26). Commit: `e3988ec850ef3e9647d1619169cca2b2af491314`. [Porównanie z main](https://github.com/murek-m/ampower-pl/compare/main...review/ampower-site-2026-10-26).

**ampower.pl nie zostało zmienione.** GitHub Pages nadal publikuje `main`, katalog `/`, tryb `legacy`. Zdalny `main` przed i po wysyłce: `06a79027bc8325526a261a32f7f390658639f948`. Nie wykonano merge ani zmiany źródła Pages, DNS czy domeny. Sama gałąź GitHub nie stanowi działającego podglądu strony.

## Potwierdzona usterka i poprawka

**P2 — wycena samej rozdzielnicy była blokowana przez minimum 1 punktu.**

- Lokalizacja: `index.html`, pole `elek-punkty` i funkcja `odswiez`; regresje w `tests/legacy.test.js`.
- Odtworzenie: wybrać instalacje elektryczne, wpisać 0 punktów i wybrać „Nowa lub wymiana” rozdzielnicy. Walidacja poprzedniej wersji odrzucała 0, chociaż rozdzielnica jest osobnym składnikiem kalkulacji.
- Wpływ: klient bez nowych punktów nie mógł przygotować wyceny samej rozdzielnicy.
- Poprawka: minimum 0, wskazówka przy polu. Jeżeli wybrano usługę, ale nie określono faktycznego zakresu, pojawia się prośba o jego uzupełnienie zamiast komunikatu o braku wybranej usługi.
- Odbiór: 0 punktów + rozdzielnica daje istniejący orientacyjny przedział **1200–2800 PLN** i pełny szkic. 0 punktów bez rozdzielnicy nie daje kwoty ani aktywnego linku zapytania. Ułamek 2,5, pusty wpis, −1 i 1000 nadal są odrzucane bez zmiany wpisanej liczby.

Nie zmieniano stawek. Powyższy przedział pochodzi z dotychczasowego `CENNIK.rozdzielnica`; audyt nie potwierdza jego aktualności ani adekwatności do konkretnej instalacji. To również nie wycena całej infrastruktury PV Mining ani uzasadnienie wcześniejszego budżetu 4000 PLN. Robocizna AMPOWER i osprzęt konkretnego projektu wymagają własnej oferty.

## Wyniki ponownej kontroli

| Zakres | Wynik i dowód |
|---|---|
| Kod i obliczenia | [320/320 testów](qa/recheck-2026-10-26/tests.txt), w tym dwa nowe przypadki rozdzielnicy i pustego zakresu. Pozostałe testy obejmują także zachowane moduły źródłowe; nie oznacza to publikacji backendu lub PV Mining. |
| HTML, JS i dane strukturalne | [Lint](qa/recheck-2026-10-26/lint.txt): identyfikatory, etykiety, ARIA, odnośniki, składnia 70 plików JS, skrypty inline i JSON-LD poprawne. |
| Build | [Build](qa/recheck-2026-10-26/build.txt): 74 dozwolone pliki; wersja zasobów `0b752a23e42edad3`. `git diff --check` bez błędów. |
| Bezpieczeństwo pakietu | [Kontrola wydania](qa/recheck-2026-10-26/release.txt) zaliczona. [Pięć przypadków](qa/recheck-2026-10-26/release-negative.json): poprawny pakiet przechodzi; dodatkowy prywatny plik, poufne pole, obcy skrypt inline i symlink są odrzucane. Testy negatywne dotyczą kopii pakietu. |
| Linki i zasoby | [60 lokalnych żądań HEAD](qa/recheck-2026-10-26/links.json) z trzech HTML: wszystkie HTTP 200; wskazane fragmenty istnieją. Sprawdzono także srcset. Nie jest to pełny crawl historycznych URL domeny. |
| Strona główna | Pusty zakres, sama rozdzielnica, kopiowanie szkicu, blokowanie kwoty i linków przy 2,5 punktu, przejście z błędu do pola i skrót „Przejdź do treści” działają. |
| Smart Home | Poprawny szkic e-mail, przełączenie na telefon unieważniające poprzedni szkic, nowy szkic z telefonem bez starego adresu, kopiowanie oraz błędny e-mail z fokusem i `aria-invalid` działają. Dane testowe syntetyczne. |
| Menu mobilne | Otwieranie i zamknięcie Escape działają; fokus wraca do przełącznika, `aria-expanded=false`. |
| Prywatność | Panel ustawień cookies otwiera się; odmowa zamyka panel. W badanym lokalnym stanie nie dodano skryptów Google. Kontakt przygotowuje szkic, bez automatycznej wysyłki. |
| Konsola | W odczytanym dzienniku sesji nie było błędów przeglądarki. Nie jest to obserwacja wszystkich możliwych stanów ani środowiska produkcyjnego. |

[Zapis ścieżek przeglądarkowych](qa/recheck-2026-10-26/browser.json).

### Telefon, tablet, komputer

Trzy podstrony sprawdzono przy szerokościach **320, 390, 768 i 1366 px**. We wszystkich 12 stanach szerokość dokumentu nie przekraczała dostępnej szerokości; kontrola DOM nie wykazała obrazów bez atrybutu alt ani zakończonych błędem ładowania. Ten pomiar nie dowodzi załadowania każdego obrazu z odroczonym ładowaniem. Istnienie ich plików sprawdzają build i żądania zasobów.

Oceniono zrzuty: [główna — komputer](qa/recheck-2026-10-26/home-desktop.jpg), [główna — telefon](qa/recheck-2026-10-26/home-mobile.jpg), [Smart Home — telefon](qa/recheck-2026-10-26/smart-mobile.jpg). Główne nagłówki i przyciski są czytelne, treść mieści się w ekranie, nagłówek mobilny udostępnia menu i telefon. Testowano przeglądarkę na komputerze z emulowaną szerokością, bez fizycznego telefonu.

## Co dokładnie wysłano

Repozytorium jest publiczne. Utworzono commit z rodzicem będącym dotychczasowym zdalnym `main` i drzewem równym **wyłącznie zawartości sprawdzonego `dist/`**. Porównano wszystkie 74 ścieżki oraz identyfikatory blobów plików z buildem. [Manifest SHA-256](qa/recheck-2026-10-26/artifact.json).

Nie wysłano nowej lokalnej historii źródłowej z backendem, panelem, testami, dokumentacją i roboczymi kosztorysami. Raport i dowody zachowano lokalnie na `feat/pv-mining`. PV Mining pozostaje osobnym lokalnym podglądem. Wysłany pakiet zawiera główną stronę, Smart Home & Energy i prywatność, a nie prototypy miningu.

`git push` potwierdził utworzenie gałęzi. Następnie `git ls-remote` potwierdził SHA `e3988ec850ef3e9647d1619169cca2b2af491314` i niezmieniony `main`; API Pages potwierdziło dalszą publikację z `main`.

## Odbiór i ewentualny powrót

Lokalny podgląd: http://127.0.0.1:4190/ oraz http://127.0.0.1:4190/smart-home-energy/ . Serwer obsługuje wyłącznie `dist/`. Nie udostępniać statycznie katalogu źródłowego repozytorium.

Jeżeli serwer zostanie zatrzymany, w tym katalogu projektu:

```sh
npm run build
python3 -m http.server 4190 --bind 127.0.0.1 --directory dist
```

Po pobraniu gałęzi przeglądowej, która zawiera już sam pakiet, można uruchomić serwer statyczny z jej katalogu głównego. Nie wymaga ona npm ani budowania. Podgląd loopback działa tylko na tym komputerze.

Na tym etapie nie trzeba cofać produkcji: dotychczasowy commit nadal jest na `main`. W razie odrzucenia tej wersji można przygotować kolejną poprawkę na gałęzi przeglądowej albo z niej zrezygnować. Gdyby później zatwierdzono wdrożenie, poprzednią wersję wskazuje commit `06a79027bc8325526a261a32f7f390658639f948`; powrót powinien odbyć się osobnym zatwierdzonym commitem przywracającym publiczne pliki, bez force-push. Żadnego cofania teraz nie wykonywano.

## Pozostałe ograniczenia

1. Brak testu fizycznego iPhone/Safari i Androida, rzeczywistych aplikacji pocztowych/SMS, klawiatur ekranowych i czytnika ekranu. Nie wysyłano wiadomości ani nie wykonywano połączeń.
2. Aktualność stawek, autoryzacji i danych firmy wymaga potwierdzenia właściciela. Ten audyt naprawia działanie strony; nie stanowi nowego researchu cenowego ani oceny prawnej.
3. Nie uruchamiano odbiornika serwerowego, usług opinii ani płatnych integracji. Konfigurator jest narzędziem przygotowania zapytania, zgodnie z widocznym opisem.
4. Nie wykonywano pomiaru Core Web Vitals na rzeczywistym ruchu, audytu GSC, pentestu ani sprawdzania konta Google Analytics. Test poprawności pakietu i lokalna kontrola konsoli nie zastępują tych pomiarów.
5. Zgoda na wysyłkę do GitHub nie została potraktowana jako zgoda na produkcję. Odbiór po przyszłej publikacji na domenie pozostaje osobnym krokiem.

Rzeczywisty odczyt przed końcowym zapisem: **41% pozostałego limitu 5 h**, **75% tygodniowego**. Odnowienie: **26.10.2026 17:39:40 CET** i **02.11.2026 07:29:53 CET**. Nie używano resetów, dopłat ani nowych automatyzacji.
