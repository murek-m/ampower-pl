# AMPOWER Smart Home & Energy — plan 6 etapów

Data: 2026-10-10. Etap 1 został zlecony; etapy 2–6 są propozycją do uzgodnienia. Plan nie jest zgodą na implementację, push ani publikację.

| Etap | Zakres | Wynik i warunek zakończenia |
| --- | --- | --- |
| 1. Audyt i brief | Repozytorium, Git, stack, hosting, testy, formularze, dane, SEO, kalkulatory, menu; bez implementacji | Trzy dokumenty. Zakończony audyt po sklonowaniu `murek-m/ampower-pl`; aktualne trzy dokumenty w głównym katalogu `ampower-website`, otwarte decyzje produktowe i kwestie operacyjne wskazane w audycie |
| 2. Specyfikacja i decyzje | Ponownie sprawdzić Git i równoległe prace; zatwierdzić `/smart-home-energy/`, link w menu, style, treść, CTA telefon/SMS/e-mail, zakres V1 i wycenę; rozstrzygnąć analitykę i dane | Zatwierdzona specyfikacja na podstawie audytu rzeczywistych plików i kryteria odbioru, bez publikacji |
| 3. Podstrona i nawigacja | Po odrębnym zleceniu wdrożyć zatwierdzoną stronę w istniejącym stacku, style, menu, treść i SEO | Lokalny wynik do przeglądu; kalkulatory bez zmian; brak push/deploy |
| 4. Kontakt i obsługa leadów | Zweryfikować i po zleceniu podłączyć zatwierdzony kanał kontaktu; walidacja, błędy, antyspam i ścieżka obsługi | Sprawdzony przepływ na danych testowych, uzgodnione przechowywanie i dostęp; bez danych klientów i sekretów w repo |
| 5. Weryfikacja i odbiór | Testy odpowiednie do stacku, regresje menu i kalkulatorów, mobile, dostępność, SEO, przegląd treści i zgodności zakresu | Lista wyników i poprawek, zaakceptowany artefakt do publikacji oraz procedura wycofania; nadal bez publikacji |
| 6. Publikacja i kontrola | Wyłącznie po oddzielnej wyraźnej zgodzie, z użyciem zweryfikowanego procesu deploymentu | Kontrola strony i kontaktu po publikacji, przekazanie obsługi i plan monitorowania; bez obietnic dostępności opcji rozwojowych |

## Wejście do etapu 2

- Repozytorium dostępne lokalnie: `/Users/jb/Ampower Smart Home/ampower-website`; nie dotykać innych projektów. Źródła i hosting już zbadano.
- Przed implementacją ponownie sprawdzić stan Git i prace zdalne; nie nadpisywać zmian. Obecnie zmiany lokalne ograniczają się do trzech nowych dokumentów.
- Routing, menu, layout, style, formularze, SEO, kalkulatory, ustalony plan kontroli (brak skryptów testowych w repo) i konfiguracja GitHub Pages; bez kopiowania sekretów.
- Decyzje biznesowe: obszar montażu, lista wspieranych integracji V1, granice konfiguracji zdalnej i serwisu, zasady wyceny oraz CTA i odbiorca leadów.
- Uzgodniony zakres danych kontaktowych, miejsce ich przechowywania, zasady dostępu i retencji oraz właściciel obsługi zgłoszeń.

- Zatwierdzony sposób lokalnego podglądu bez publikacji, decyzja o analityce (obecny mechanizm ma niespójność zgody) oraz o oddzieleniu dokumentacji od przyszłego artefaktu Pages.

## Reguły obowiązujące między etapami

Nie zmieniać istniejących kalkulatorów. Nie nadpisywać cudzych zmian. Nie kopiować sekretów, tokenów ani danych klientów do raportów. Nie uruchamiać zbędnych procesów. Każdy etap ma kończyć się przeglądalnym wynikiem i wskazaniem otwartych kwestii. Home Assistant u klienta i publiczna strona mają oddzielne zakresy dostępu. AI i koparki kryptowalut pozostają opcjami rozwojowymi bez obietnic zysku.

Referencje: [brief](00_BRIEF.md), [audyt](01_AUDYT.md).
