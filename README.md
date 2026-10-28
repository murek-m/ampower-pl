# AmPower — strona publiczna i lokalny prototyp PV Mining

Aktualny katalog źródeł: `ampower-pv-mining`, gałąź `feat/pv-mining`.
Zawiera poprawki strony publicznej oraz osobny lokalny prototyp PV Mining.
Stan napraw z 27.10.2026: [raport odbioru](docs/NAPRAWY_AUDYTU_2026-10-27.md).
W audycie z tego dnia domena pokazywała starsze wydanie z 22.10.2026.
Lokalny build nie aktualizuje domeny.

Wcześniejsze uwagi do wersji z 21.10.2026:
[checklista](docs/ODBIOR_UWAG_MICHAELA.md).

- Na głównej sześć kart usług, w tym jedna „06 / SMART HOME” z linkiem do podstrony.
- Rozbudowane treści i konfigurator pozostają pod `/smart-home-energy/`.
- Menu prowadzi na podstronę, stopki nie mają dodatkowego linku Smart Home,
  a opis meta głównej zachowuje wersję sprzed dodania Smart Home.
- Google Analytics `G-3D328MRNWG` oraz baner cookies zostały przywrócone.
  Google ładuje się tylko na głównej ampower.pl po jawnej zgodzie. Odmowa i zmiana
  wyboru w stopce są dostępne. Podgląd lokalny nie wysyła danych do Google.
  Cloudflare Web Analytics nie jest ładowane. Szczegóły w `/prywatnosc/`.

## Lokalny podgląd

Node.js 22.13+ z wbudowanym SQLite oraz Python 3. Sprawdzono na Node 26.10.0.

```sh
npm test
npm run lint
npm run build
npm run release:check
npm run preview
```

Strona: http://127.0.0.1:4173/ ; Smart Home: `/smart-home-energy/`.
`npm run preview` serwuje wyłącznie publiczny katalog `dist/`.

Opinie są odłożone i nie wchodzą do publicznej strony. Zachowany prototyp ma
[osobną instrukcję](docs/OPINIE.md); polecenie `npm run reviews:local` dotyczy tego
archiwalnego prototypu, a nie podstawowego podglądu strony.
Konfigurator Smart Home przygotowuje szkic do samodzielnego wysłania; odbiornik
produkcyjny i aktualny cennik są wyłączone do osobnego odbioru.

## Testy przeglądarkowe

Playwright jest narzędziem QA, nie zależnością strony. Ustaw
`AMPOWER_PLAYWRIGHT_MODULE` na moduł Playwright i `AMPOWER_CHROME_PATH` na Chrome.
Dla testów publicznych ustaw `AMPOWER_QA_URL=http://127.0.0.1:8791` i uruchom podgląd.

```sh
npm run test:e2e:publication
npm run test:e2e
npm run test:e2e:additional
npm run test:e2e:reviews
npm run test:e2e:consent
npm run test:e2e:audit
npm run test:release
```

Testy opinii i zgody uruchamiają własne tymczasowe serwery. Test zgody symuluje
ampower.pl i zastępuje Google atrapą; nie wysyła prawdziwych zdarzeń do Google.
Dane testowe są syntetyczne. Potwierdzenie tagu w koncie GA jest osobnym odbiorem
przed publikacją; wyniki testów nie są potwierdzeniem odbioru danych w usłudze.

`test:e2e:audit` sprawdza gotowe `dist/` i `output/pv-mining-preview/`,
uruchamiając własne serwery lokalne. Oprócz Playwright wymaga axe-core:
`AMPOWER_AXE_SOURCE` wskazuje plik `axe-core/axe.min.js` w środowisku QA.
Obejmuje walidację kalkulatora, dostępność, rozwinięte panele i większy tekst.

## Granica publikacji

Serwuj wyłącznie `dist/`. Nie publikuj całego repozytorium i nie łącz całej gałęzi
źródłowej z produkcyjnym `main`, który zawiera artefakt strony. Build oraz kontrola
wydania egzekwują whitelistę plików. `backend/` zawiera także lokalny prototyp
wycen Energy; nie jest publicznym API. Operacyjne dane, cenniki zakupu i sekrety
muszą pozostać poza repozytorium i artefaktem. Historyczne dokumenty w `docs/`
nie zastępują aktualnej checklisty odbioru.

## PV Mining — lokalny moduł

Prototypy A/B zachowano na `feat/pv-mining`. `npm run pv:dev` uruchamia osobny
podgląd `http://127.0.0.1:4186/`; moduł nie jest dołączany do publicznego `dist/`.
[Raport ostatnich napraw i odbioru](docs/pv-mining/14_NAPRAWY_I_ODBIOR_AUDYTU.md).
Rynek ma jawny snapshot, ceny infrastruktury pozostają do wyceny.

Prywatny panel ofert Energy: `npm run panel:local`;
[instrukcja](docs/ampower-sales/08B_INSTRUKCJA_UZYTKOWNIKA.md).
Panel i dokumenty nie wchodzą do publicznego artefaktu.

## Regresje audytu Smart Home & Energy

[Naprawy AUD-001–017 i ograniczenia odbioru](NAPRAWY_SMART_HOME_ENERGY.md).
Workflow `.github/workflows/regression.yml` sprawdza push/PR: lint (w tym PV),
jednostki, oba buildy, whitelistę/CSP i przeglądarki. Nie publikuje ani nie aktualizuje danych.
QA jest oddzielone od zależności strony: Playwright **1.62.1** z przypisanymi
Chromium i WebKit, Ubuntu 24.04 i Node 22.22.0. Wersje silników i raporty trafiają do artefaktu CI.
Istniejące testy PDF używają osobnego środowiska Python 3.12 z ReportLab 4.4.9
i fontem DejaVu Sans. CI przygotowuje je w katalogu tymczasowym; nie aktywuje backendu.

Po zbudowaniu obu artefaktów można użyć istniejącego środowiska QA:

```sh
AMPOWER_PLAYWRIGHT_MODULE=/absolutna/sciezka/playwright/index.mjs node scripts/qa_regression.mjs
```

Runner uruchamia własne serwery na localhost, blokuje obce originy i metody zapisu,
używa wyłącznie syntetycznych danych. `AMPOWER_CHROME_PATH` opcjonalnie wskazuje
lokalny Chrome; bez tej zmiennej używa Chromium z Playwright. Raporty domyślnie
w `output/qa-regression/` (`AMPOWER_QA_OUTPUT` zmienia katalog).
Można wskazać pojedynczy zestaw, np. `node scripts/qa_regression.mjs qa_pv_forms`.
Macierz odbiorcza obejmuje 375, 390, 430, 1366, 1440 i 1920 px w obu silnikach.
Automatyczny WebKit nie zastępuje odbioru natywnego Safari/VoiceOver.
Buildy i testy twórz w osobnej kopii roboczej, jeżeli istniejące `dist/` i `output/`
zawierają potrzebne wcześniejsze artefakty.
