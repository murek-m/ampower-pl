# Audyt źródeł i rzeczywistej witryny

24.10.2026. Odczyty: Git, GitHub REST przez `gh`, DNS, WHOIS NASK, HTTP strony i plików JavaScript. Nie zmieniano ustawień kont.

## Repozytorium i ochrona wcześniejszej pracy

Katalog nadrzędny workspace nie jest właściwym repozytorium projektu. Właściwe repo to `ampower-website`, origin `https://github.com/murek-m/ampower-pl.git`. Istnieje też worktree `ampower-murek-review`. Oba zawierają liczne niezacommitowane zmiany; nie resetowano, nie stashowano ani nie dodawano ich do commitów.

Po `git fetch origin`:

| Ref | Commit | Znaczenie |
|---|---|---|
| `feat/smart-home-energy-mvp` / origin | `0c6a56a6845c81a63b4bfd29bb326db8ee963dba` | zapisane źródła MVP |
| `origin/main` | `06a79027bc8325526a261a32f7f390658639f948` | aktualna publiczna paczka |
| `feat/pv-mining` | baza `0c6a56a` | nowy izolowany worktree, dokumentacja etapu 1 |

`main` nie został przełączony ani zmodyfikowany. Nowa gałąź powstała z zapisanych źródeł Smart Home, a nie z produkcyjnej paczki. **Nie zawiera późniejszych niezacommitowanych poprawek istniejącego katalogu.** Przed etapem 2 trzeba uzgodnić i przenieść odpowiednie publiczne poprawki ze stanu źródeł; nie mergować całego repo na main. Nie znaleziono stosujących się plików AGENTS.md w workspace i przodkach.

## Stack i publikacja

- Frontend: statyczne HTML, CSS, natywne moduły JavaScript; brak React/Next/Vite i zależności runtime w package.json.
- Istniejący konfigurator: `smart-home-energy/{app,model,data,pricing,price-book,inquiry-client}.js`; wycena kategorii urządzeń, nie symulacja energii ani miningu. Nie wykorzystywać tego cennika jako źródła cen ASIC.
- Build: Node kopiuje jawnie dozwolone pliki do `dist/`. Aktualny niezacommitowany build ma dodatkowe zabezpieczenia whitelisty. Lokalny serwer podglądu: Python http.server. Zapisana baza wymaga Node >=20, nowsze lokalne źródła backendu >=22.13.
- `backend/`: lokalne prototypy Node/panel/wyceny, nie dowód produkcyjnego API. W nowych lokalnych źródłach jest koordynacja SQLite; nie przenosić jej do przeglądarki ani publicznego artefaktu.
- Odczyt GitHub Pages: `legacy`, źródło **main, /**, CNAME `ampower.pl`, HTTPS enforced, status `built`. Dowód: `evidence/github-pages.json`.
- Odczyt HTTP `https://ampower.pl/`: 200, `server: GitHub.com`. Podstrona Smart Home także odpowiada i zawiera działające zasoby konfiguratora. To niezależne potwierdzenie, że Smart Home nie pozostaje wyłącznie na gałęzi roboczej. Nie wykonano w tym etapie pełnego testu UX produkcji ani wysyłki formularza.
- Lokalny `.github/workflows/public-artifact.yml` jest nieśledzony w pierwotnym worktree; działa tylko na `workflow_dispatch`, przygotowuje artefakt, bez deployu. Nie zakładać, że taki workflow już działa na GitHubie.

## Squarespace i DNS

WHOIS NASK wskazuje rejestratora **Key-Systems GmbH**. NS: `ns-cloud-d1..d4.googledomains.com`. A wskazuje GitHub Pages; www ma CNAME `murek-m.github.io`.

Nie ma dowodu, że Squarespace hostuje lub renderuje stronę. Może być panelem pośrednika domeny/DNS, ale publiczne NS i rejestrator nie potwierdzają umowy ani konta klienta. **Rola konta Squarespace pozostaje niepotwierdzona bez odczytu panelu lub dokumentu właściciela.** Nie jest potrzebna zmiana DNS do lokalnych prototypów.

## Formularze, prywatność, analityka

Publiczny `/smart-home-energy/inquiry-config.js` ma `enabled:false, endpoint:null`. HTML oferuje otwarcie aplikacji pocztowej i kopiowanie konfiguracji. Nie ma podstaw do deklaracji automatycznego dostarczenia zapytania. W PV Mining trzeba zachować tę uczciwą ścieżkę do czasu uruchomienia zatwierdzonego backendu; CSV liczyć lokalnie, bez uploadu.

Publiczny `assets/consent.js` ładuje Cloudflare Web Analytics, wyłącza GA i usuwa wcześniejsze cookies Google. Ogranicza pomiar do znanych tras; respektuje DNT/GPC i blokuje pomiar adresów z parametrami. Nowe `/pv-mining/` **nie jest jeszcze na liście tras analityki**. Ewentualne rozszerzenie listy i prywatności to późniejsza zmiana, nie wykonana tutaj. Nie przekazywać danych profilu energii, formularza, adresu portfela ani założeń finansowych w URL lub eventach. Odczyt skryptu nie potwierdza aktualnego odbioru zdarzeń w panelu Cloudflare; historyczna dokumentacja opisuje taki odbiór.

## Design system i informacja

Aktualny lokalny CSS Smart Home: akcent `#ffc400`, ciemny panel `#181613`, tło `#f4f3ee`, Archivo dla nagłówków, IBM Plex Sans i Mono, kontrolki dotykowe >=44 px, widoczny focus, dark mode. Nie ma osobnego pakietu komponentów; design system jest zapisany w CSS i wzorcach HTML. Dla prototypów zachować te tokeny i język marki, a szeroką tabelę porównawczą na telefonie zastąpić kartami.

Rekomendacja: osobna podstrona **`/pv-mining/`** z odnośnikiem z części energia Smart Home. To propozycja do akceptacji, nie wdrożona trasa. W obrębie niej przełącznik Prosty/Zaawansowany, wspólny stan wejściowy i wspólny moduł obliczeń. Katalog i porównanie 2–4 urządzeń, wyniki oddzielające BTC od PLN, miesięczne wykresy energii, wynik wieloletni, kosztorys i CTA do wyceny. Bez rozbudowania strony głównej o wszystkie formularze.

Źródła: repozytorium lokalne i https://github.com/murek-m/ampower-pl, https://ampower.pl/smart-home-energy/, https://ampower.pl/assets/consent.js, https://dns.pl/whois. Odczyty HTTP wykonano CLI, ponieważ narzędzie przeglądania nie mogło pobrać domeny.
