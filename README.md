# AmPower - wersja do ponownej recenzji

Gałąź `review/murek-feedback-2026-10-24` zawiera poprawki do czterech uwag
z 21.10.2026. Stan odbioru: [checklista](docs/ODBIOR_UWAG_MICHAELA.md).
Gałąź jest przeznaczona do sprawdzenia; nie została wdrożona na `main` ani domenę.

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
npm run reviews:local
```

Strona: http://127.0.0.1:8791/ ; Smart Home: `/smart-home-energy/`.
Panel opinii: `/admin/opinie/`. Losowe hasło na to uruchomienie pojawi się w terminalu.
Dane są w prywatnym katalogu poza repozytorium; lokalnie nie wysyła się poczty.
Sam statyczny `npm run preview` pokazuje stronę, ale nie uruchamia API opinii.

[Opinie, hosting i kopie zapasowe](docs/OPINIE.md). Opinie online oraz rzeczywista
poczta nadal wymagają konfiguracji usługi Node, trwałego dysku i dostawcy wiadomości.
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
npm run test:release
```

Testy opinii i zgody uruchamiają własne tymczasowe serwery. Test zgody symuluje
ampower.pl i zastępuje Google atrapą; nie wysyła prawdziwych zdarzeń do Google.
Dane testowe są syntetyczne. Potwierdzenie tagu w koncie GA jest osobnym odbiorem
przed publikacją; wyniki testów nie są potwierdzeniem odbioru danych w usłudze.

## Granica publikacji

Serwuj wyłącznie `dist/`. Nie publikuj całego repozytorium i nie łącz całej gałęzi
źródłowej z produkcyjnym `main`, który zawiera artefakt strony. Build oraz kontrola
wydania egzekwują whitelistę plików. `backend/` zawiera także lokalny prototyp
wycen Energy; nie jest publicznym API. Operacyjne dane, cenniki zakupu i sekrety
muszą pozostać poza repozytorium i artefaktem. Historyczne dokumenty w `docs/`
nie zastępują aktualnej checklisty odbioru.
