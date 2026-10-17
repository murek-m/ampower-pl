# AMPOWER — 8B: audyt przed rozbudową

Data: 11.10.2026. Repozytorium: `ampower-website`, gałąź `feat/smart-home-energy-mvp`. Zakres: prywatny lokalny panel, bez publikacji i rzeczywistej poczty.

## Przeanalizowane materiały

Brief, audyt i plan projektu; dokumentacja etapów 1–4 w nadrzędnym `docs/ampower-smart`; raporty implementacji i QA etapów 5–6; dokumentacja architektury, instrukcji i raportu sprzedażowego; [08A_AUDYT_CENNIKA_USLUG.md](08A_AUDYT_CENNIKA_USLUG.md); kod formularza, katalogu, kalkulacji, magazynu, adaptera powiadomień, ofert i PDF oraz istniejące testy. Wcześniejsze raporty zachowano jako zapis wcześniejszego stanu.

## Co zastano i wykorzystano

| Moduł | Stan przed 8B | Wykorzystanie w 8B |
| --- | --- | --- |
| `smart-home-energy/pricing.js` | Publiczny silnik wyceny, wspólne zaokrąglenia | Bez zmian w publicznym silniku; prywatny kalkulator korzysta ze wspólnych groszy |
| `backend/catalog.seed.json`, `catalog.js` | 24 modele/ścieżki i 17 usług; projekcja publiczna oddzielona od kosztów | Ten sam katalog w uwierzytelnionym API panelu |
| `internal-calculator.js` | Prywatny kalkulator kosztów i wyników | Rozszerzenie o rabaty, pełną podstawę marży, zatwierdzenia cen i ochronę przed powielonym zakresem |
| `server.js`, `validation.js`, `store.js` | Walidacja zgłoszeń, UUID, idempotencja, limity, honeypot, zapis atomowy i kolejka | Ten sam odbiornik w lokalnym trybie DEMO; brak rzeczywistych powiadomień |
| `owner.js`, `offers.js` | Obsługa przez CLI, zatwierdzenie związane z hashem wersji | GUI oraz historia wcześniejszych wersji, klientów i zatwierdzeń |
| `pdf_offer.py` | PDF z eksportu pozbawionego kosztów wewnętrznych | Ten sam generator, logo, poprawiona typografia, dane modelu, warunki, wielostronicowość i oznaczenia DEMO |
| Publiczne kalkulatory | Działające, odrębny zakres | Bez zmian w ramach 8B; testy regresji |

## Wnioski z 8A i ograniczenia

Aktywne ceny usług, czasy i kwalifikacje VAT wymagają decyzji właściciela. Historyczne kwoty i propozycje 8A nie mogą automatycznie stać się cennikiem. Panel pozostawia takie pola puste i blokuje zatwierdzenie. Jawnie fikcyjny kosztorys finansowy DEMO służy wyłącznie ćwiczeniu obsługi.

Pierwotna marża odnosiła się do kosztów bez przypisanych kosztów działalności. Panel pokazuje dodatkowo wynik i marżę po wszystkich uwzględnionych kosztach. Cel rentowności w panelu korzysta z tej pełnej podstawy; zachowano wcześniejsze znaczenie pól dla CLI. Wynik pozostaje przed podatkiem dochodowym i nie jest zyskiem netto firmy.

Nie było przeglądarkowego panelu, parsera opisu ani archiwum poprzednich ofert. Magazyn plikowy jest wystarczający do lokalnego prototypu, ale wymaga zastąpienia transakcyjną bazą i produkcyjnego uwierzytelniania przed wdrożeniem.

## Granica prywatności

Panel znajduje się w `backend/panel/`, poza whitelistą publicznego buildu. Serwer udostępnia wyłącznie wymienione zasoby; dane, katalog wewnętrzny i PDF wymagają sesji właściciela. Magazyn panelu znajduje się poza repozytorium. Nie zapisuje się danych klienta w localStorage ani sessionStorage. Eksport PDF nie zawiera kosztów zakupu, stawek własnych, marż ani wewnętrznych uwag.

Dotychczasowa dokumentacja opisuje GitHub Pages z root `main`. Taki sposób publikacji trzeba zmienić na sam `dist/` przed jakąkolwiek przyszłą publikacją repozytorium zawierającego backend i dokumenty. Lokalny build nie zmienia konfiguracji Pages.

## Zachowanie wcześniejszej pracy

Przed edycją wykonano kopię źródeł z manifestem SHA-256: `/Users/jb/.local/share/ampower-backups/before-8b-20261011-182309`. Kopia nie obejmuje `.git`, zależności i wyników generowanych. Zastano niezacommitowane wcześniejsze etapy; nie resetowano ani nie porządkowano ich kosztem danych.

W trakcie pracy pojawiły się niezależne zmiany publicznych `index.html`, `scripts/build.js` i ilustracja `assets/smart-home-panel.png`. Nie są implementacją prywatnego panelu 8B; zachowano je. Przy odtwarzaniu poprzedniego stanu należy porównywać i przywracać tylko wybrane pliki, aby nie nadpisać równoległej pracy.

Nie wykonano push, merge, deploy, konfiguracji domen, publikacji panelu, uruchamiania płatnych usług ani rzeczywistych wysyłek.
