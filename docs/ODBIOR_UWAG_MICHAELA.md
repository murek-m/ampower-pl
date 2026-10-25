# Odbiór uwag do Smart Home & Energy

Weryfikacja 25.10.2026 względem czterech punktów recenzji z 21.10.2026.
Gałąź: `review/murek-feedback-2026-10-24`. Stan: gotowe do ponownego przeglądu,
bez wdrożenia na `main` i ampower.pl.

| Punkt | Zrealizowane zachowanie | Dowód |
|---|---|---|
| 1. Skrócenie Smart Home na głównej | Sześć równorzędnych kart usług. Jedna karta „06 / SMART HOME” prowadzi do `/smart-home-energy/`. Brak rozbudowanych sekcji Smart Home pod kartami. | `tests/reviewer-feedback.test.js`, test publikacyjny |
| 2. Przeniesienie szczegółów | Korzyści, automatyzacje, pakiety, realizacja, wsparcie i FAQ są na podstronie Smart Home razem z konfiguracją zakresu. | `tests/reviewer-feedback.test.js`, 29 scenariuszy konfiguratora |
| 3. Nawigacja i meta | Menu kieruje do `/smart-home-energy/`; stopki nie mają dodatkowego odsyłacza Smart Home. Opis meta głównej jest identyczny z wersją sprzed dodania Smart Home, z commita `2f9be19`. | Test kontraktu wszystkich trzech stopek i dokładnego opisu meta |
| 4. Google Analytics i baner | Przywrócono `G-3D328MRNWG` oraz automatyczny baner pierwszego wyboru. Odmowa nie blokuje strony; wybór można zmienić w stopce. GA jest blokowane przed zgodą i po odmowie; lokalny podgląd nie wysyła statystyk. Cloudflare nie jest równocześnie ładowane. | 12 scenariuszy zgody z atrapą Google i wirtualną domeną produkcyjną; bez rzeczywistych wysyłek analitycznych |

Wcześniejszy wariant Cloudflare bez banera nie odpowiadał punktowi 4. W tej gałęzi
został zastąpiony zgodnie z aktualną dyspozycją właściciela. Wersja produkcyjna
nie została przy tej pracy zmieniona.

## Sprawdzenie

- 262 testy kodu: wszystkie poprawne.
- 82 uruchomienia scenariuszy przeglądarkowych: 73 Chromium i 9 WebKit, wszystkie
  poprawne. Zestaw publikacyjny powtarza te same 9 scenariuszy w dwóch silnikach.
- W tym: publikacja 9, opinie 10, konfigurator 29, dodatkowe 13, zgody 12,
  publikacja WebKit 9. To liczba uruchomień, nie 82 unikalne scenariusze.
- Lint, build, whitelista 78 publicznych plików i negatywne testy wydania poprawne.
- Sprawdzono baner na szerokościach 320/390/1440 px oraz zachowanie odmowy,
  ponownej wizyty, wycofania, wygaśnięcia, GPC, awarii Google i braku storage.
- Testy Google podstawiają syntetyczny SDK zamiast łączyć się z Google.
  Potwierdzają zachowanie kodu i CSP, nie odbiór zdarzeń w koncie Google Analytics.

Podsumowanie maszynowe: [CHECKS.json](review-murek/CHECKS.json).
Widok mobilny: [baner zgody](review-murek/CONSENT-BANNER-MOBILE.png).

## Dodatkowe zamknięte ustalenia audytu

1. Magazyn opinii sprawdza rzeczywistą ścieżkę po rozwiązaniu dowiązań. Rodzic
   będący aliasem do repozytorium nie pozwala uruchomić bazy w repozytorium.
   Osobne testy obejmują konstruktor i CLI.
2. Backup liczy SHA-256 porcjami do 64 KiB zamiast wczytywać cały snapshot do RAM.
   Test na syntetycznej bazie powyżej 16 MiB sprawdza rozmiar bufora i hash;
   odtworzenie kopii ze zdjęciem nadal przechodzi.

## Granice odbioru przed publikacją

- To przegląd gałęzi, nie wdrożenie. Nie mergować całego źródłowego projektu
  do produkcyjnego `main`. Publikować jedynie sprawdzony artefakt `dist/`.
- Przed publikacją potwierdzić w koncie GA właściwy strumień, retencję,
  wyłączenie zbędnych automatycznych pomiarów formularzy i rzeczywisty odbiór danych.
  Kod własnego pomiaru nie przekazuje treści formularzy ani wiadomości.
- Google działa tylko na głównej ampower.pl po zgodzie. Smart Home i panel nie
  ładują GA; adresy z parametrami, nieznanym fragmentem lub prywatnym referrerem,
  DNT/GPC i podgląd lokalny wyłączają pomiar.
- Opinie produkcyjne wymagają hostingu Node, trwałej bazy, poczty, automatycznych
  kopii poza usługą i odbioru na domenie. Ta gałąź nie potwierdza ich uruchomienia.
- Nie testowano fizycznego telefonu ani VoiceOver/NVDA z użytkownikiem.

Implementacja zgody według dokumentacji:
[Google - podstawowy tryb zgody](https://developers.google.com/tag-platform/security/guides/consent).
W testach nie wysyłano prawdziwych e-maili ani zdarzeń Google.
