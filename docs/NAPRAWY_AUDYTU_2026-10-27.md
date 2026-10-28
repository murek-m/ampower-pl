# Naprawy błędów audytu AMPOWER — 27.10.2026

Poprawki przygotowano w `ampower-pv-mining` na gałęzi `feat/pv-mining`.
Baza: `175cf2933eb4bd1b2c8ab0625154e70d7210df95`; opisane zmiany są w katalogu
roboczym. Strona publiczna i PV Mining mają osobne artefakty.

## Wynik

- **329/329 testów projektu** poprawnych; [log](qa/audit-2026-10-27/tests.log).
- **25/25 scenariuszy Chromium** poprawnych; [wyniki](qa/audit-2026-10-27/browser.json).
- Lint, dwa buildy i kontrola publicznego wydania poprawne;
  [lint](qa/audit-2026-10-27/lint.log), [kontrola wydania](qa/audit-2026-10-27/release.log).
- W objętych skanem stanach brak automatycznych naruszeń reguł WCAG A/AA,
  błędów JavaScript i poziomego przepełnienia dokumentu.

## Zamknięcie potwierdzonych ustaleń

| Ustalenie audytu | Stan i odbiór |
|---|---|
| Kalkulator wycenia ujemną liczbę punktów online | Poprawka była już w aktualnych źródłach. Zweryfikowano gotowy `dist/`: `-1`, puste pole, `2.5` i `1000` usuwają kwotę, oznaczają pole jako błędne, czyszczą szkic, blokują kopiowanie i oba linki wiadomości. Powrót do `25` przywraca 3 500–5 000 zł i kontakt. |
| Obsługa zera | `0` bez rozdzielnicy nie daje kwoty ani szkicu. `0` z rozdzielnicą zachowuje zamierzoną możliwość wyceny samej rozdzielnicy: 1 200–2 800 zł. Nie zmieniano stawek. |
| Kontrast głównej | Źródła zawierały już ciemniejszy `--volt-deep: #866200`. Skan paczki przy 390/1440 px w jasnym i ciemnym motywie potwierdził brak zgłoszenia. |
| Nieprawidłowa lista podsumowania | Źródła zawierały już osobny `#calc-empty`. W przeglądarce sprawdzono pustą listę, wybraną usługę, błąd, samą rozdzielnicę i odznaczenie usługi. Brak naruszenia `definition-list`. |
| Słaby kontrast PV Mining | Zmieniono paletę opisów na wspólne `--muted`, `--accent-text` i osobny jasny `--dark-muted`. Dotyczy m.in. stopki, zakładek, założeń, kosztów i zapytania. Skan obejmuje również rozwinięte szczegóły i trzy zakładki wariantu zaawansowanego. |
| Drobny tekst PV Mining | Pomocnicze opisy mają co najmniej 13 px; istotne istniejące etykiety 14 px zachowano. Nagłówki i metadane zawijają się na krótkich ekranach. |
| Układ po zwiększeniu tekstu | Poprawiono schemat energii w nagłówku, zawijanie nawigacji i wartości podsumowań. Szerokie tabele przewija się wewnątrz ich kontenera. Brak poziomego przepełnienia dokumentu przy 320/390/768/1440 px; dodatkowo przy tekście 200% dla 390/1440 px. |
| Za małe pola wyboru urządzeń | Natywne pola wyboru modeli mają 24 × 24 px i nie kurczą się w etykiecie. |
| Nieaktualna instrukcja źródeł/podglądu | README wskazuje bieżący katalog i gałąź oraz statyczny podgląd `dist/` na 4173. Prototyp opinii jest opisany jako archiwalny, odłożony. |

Podglądy po zmianach: [prosty na telefonie](qa/audit-2026-10-27/simple-mobile.png),
[zaawansowany na komputerze](qa/audit-2026-10-27/advanced-desktop.png).

## Artefakty i publikacja

Publiczna strona: `dist/` oraz `output/public-release/ampower-public.zip`.
Paczka zawiera 74 pliki; backend i dokumenty nie trafiają do wydania.
Identyfikator zasobów strony: `0fcd0f186417ed95`.
SHA-256 ZIP: `672eea37e9ae9e94d2121ed2c69bd4501c9813d972def9a04951868d9f233aef`.
`output/public-release/manifest.json` zawiera hashe plików.

PV Mining: `output/pv-mining-preview/`, identyfikator zasobów
`0b62309dd6304ef2`. Moduł nie jest dołączony do publicznego ZIP.

Zadanie zakończyło się przygotowaniem i odbiorem lokalnych poprawek.
Nie wykonano push, merge ani publikacji. Poprawki kalkulatora i kontrastu
będą działać na domenie po wdrożeniu publicznej paczki.

Przy wdrożeniu wskazać docelowy commit źródeł i zachować poprzedni publiczny
artefakt do cofnięcia. Po publikacji powtórzyć próbę `-1`, poprawienie pola,
kontrolę kontrastu, kontaktu i zgodności analityki z polityką prywatności.
Nie przenosić całej gałęzi źródłowej na produkcyjne `main`.

## Odtworzenie kontroli

```sh
npm test
npm run lint
npm run build
npm run pv:build
npm run release:check
npm run test:e2e:audit
```

Ostatnie polecenie wymaga zewnętrznego środowiska QA z Playwright, Chromium
i axe-core. `AMPOWER_PLAYWRIGHT_MODULE` wskazuje moduł Playwright,
`AMPOWER_CHROME_PATH` plik wykonywalny przeglądarki, a `AMPOWER_AXE_SOURCE`
plik `axe-core/axe.min.js`. Nie dodano tych pakietów do zależności strony.
Test uruchamia i zatrzymuje własne serwery na losowych portach localhost,
blokuje ruch zewnętrzny i nie wysyła wiadomości. Wyniki zapisuje w
`output/qa-audit-2026-10-27/`.

Skan automatyczny to kontrola określonych reguł i stanów, nie pełny certyfikat
zgodności. Powiększenie tekstu sprawdzono przez podwojenie rozmiarów CSS.
Nie wykonywano odbioru na fizycznym telefonie ani świeżego testu Safari.
Redakcyjne propozycje nowych treści, realizacji i optymalizacji zdjęć z audytu
pozostają rekomendacjami rozwoju, odrębnymi od potwierdzonych błędów.
