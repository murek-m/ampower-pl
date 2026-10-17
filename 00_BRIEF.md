# AMPOWER Smart Home & Energy — brief projektu

Data: 2026-10-10. Etap: 1/6 — audyt i dokumentacja.

## Status i granice prac

Uzgodnienia biznesowe pochodzą z polecenia właściciela. Audyt wykonano na lokalnym klonie publicznego repozytorium `murek-m/ampower-pl`, gałąź `main`, commit `2f9be19a61c52aed390a53a2a1b5bd67a049ea69`. Lokalizacja: `/Users/jb/Ampower Smart Home/ampower-website`. Stack: statyczny HTML/CSS/JavaScript, hosting GitHub Pages z publikacją z `main`. Pełne ustalenia i otwarte decyzje znajdują się w [01_AUDYT.md](01_AUDYT.md). Dokumenty są zapisane w głównym katalogu tego repozytorium i pozostają lokalne. Wcześniejsze pliki w nadrzędnym `docs/ampower-smart/` zachowano; opisywały stan przed sklonowaniem źródeł.

Etap 1 obejmuje wyłącznie odczyt GitHuba, lokalne klonowanie, audyt i dokumentację zgodnie z doprecyzowaniem właściciela. Zakaz implementacji funkcji, zmiany istniejących kalkulatorów, publikacji, deployu i push. Nie dotykać innych repozytoriów i projektów. Nie nadpisywać istniejących zmian. Publikacja nie jest objęta tym briefem i wymaga odrębnej, wyraźnej zgody właściciela; sam plan etapów jej nie udziela.

## Usługa i odbiorcy

AMPOWER wykonuje instalacje elektryczne, klimatyzację, CCTV, alarmy i automatykę. Nowa usługa integruje urządzenia domowe i zarządzanie energią w jednej aplikacji. Odbiorcy początkowi: właściciele domów; docelowo także małe firmy.

Zakres integracji zależny od kompatybilności i indywidualnej wyceny: rolety, światła, ogrzewanie podłogowe, kocioł gazowy, pompa ciepła, klimatyzacja, bramy, PV, magazyn energii, ładowarka EV oraz opcjonalnie inne urządzenia. Nie obiecywać integracji każdego modelu urządzenia.

Modele realizacji:

- Montaż lokalny wraz z konfiguracją.
- Sprzedaż gotowej centralki Home Assistant z konfiguracją zdalną.

Cennik: pakiet startowy + moduły i robocizna zależne od zakresu, opcjonalny serwis. Kwoty, obszar obsługi nowej usługi, warunki zdalnego dostępu, granice wsparcia i SLA nie zostały ustalone. Obecna strona podaje Dolny Śląsk; rozszerzenie tego zakresu na nową usługę wymaga decyzji.

## Zakres V1

V1 ma działać niezawodnie i oferować proste automatyzacje. Strona ma wyjaśniać usługę, warianty realizacji i sposób uzyskania wyceny. Home Assistant jest elementem rozwiązania u klienta, a nie potwierdzonym stackiem strony WWW.

AI i koparki kryptowalut są wyłącznie opcjami rozwojowymi. Bez obietnic zysku, gwarantowanych oszczędności ani sugerowania ich dostępności w V1. Istniejące kalkulatory pozostają poza zakresem zmian.

## Proponowany cel podstrony — do zatwierdzenia w etapie 2

Osobna podstrona „Smart Home & Energy”, spójna z obecną stroną, z opisem korzyści, zakresu, procesu realizacji, modelu ceny, FAQ i CTA do konsultacji lub wyceny. Audyt potwierdza brak formularza i backendu leadów; istnieją telefon, SMS i e-mail. Rekomendacja V1: te kanały kontaktu. Nowy formularz lub magazyn danych wymaga odrębnej specyfikacji przepływu danych. Nie dodawać konfiguratora ani kalkulatora w ramach domyślnego zakresu V1.

## Kryteria akceptacji projektu

1. Właściwe repozytorium, stack, routing, deployment i sposób testowania są udokumentowane na podstawie plików, a nie domeny. Audyt techniczny ma zamknięte luki przed implementacją.
2. Nowa podstrona ma zatwierdzoną trasę (rekomendacja `/smart-home-energy/`, plik `smart-home-energy/index.html`) i miejsce w menu; wykorzystuje istniejący layout, style i komponenty tam, gdzie to bezpieczne. Nie zmienia działania istniejących kalkulatorów.
3. Treść rozróżnia V1 i rozwój; przedstawia oba modele realizacji, zależność zakresu od kompatybilności i model wyceny bez nieuzgodnionych kwot lub obietnic.
4. Każda deklarowana integracja V1 ma określone warunki kompatybilności i odbioru technicznego. Zachowanie przy utracie sieci, restarcie i awarii centralki oraz możliwość ręcznej obsługi ustala się dla konkretnego wdrożenia.
5. CTA i ewentualny formularz mają zweryfikowanego odbiorcę, obsługę błędów, ochronę przed spamem i zatwierdzoną minimalizację danych. Znane są cel, miejsce przechowywania, dostęp, okres retencji i proces usuwania danych; formularz nie zbiera haseł, tokenów ani dostępu do instalacji klienta.
6. Podstrona ma sprawdzone widoki mobilne, dostępność klawiaturą, etykiety formularza, metadane SEO oraz brak regresji nawigacji i kalkulatorów. Testy wynikają z rzeczywistego stacku.
7. Sekrety i dane klientów nie trafiają do dokumentacji, kodu frontendu ani przykładowych leadów. Dostęp do urządzeń klienta pozostaje oddzielony od publicznej strony.
8. Wynik prac jest przeglądalny przed publikacją. Push, deploy i publikacja wymagają odrębnej autoryzacji i znajomości środowiska oraz procedury wycofania.

## Dokumenty powiązane

- [01_AUDYT.md](01_AUDYT.md) — fakty, luki i ryzyka techniczne.
- [PLAN_ETAPOW.md](PLAN_ETAPOW.md) — proponowana kolejność sześciu etapów.
