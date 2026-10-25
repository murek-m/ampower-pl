# PV Mining — przegląd oczami klienta

Data: 25.10.2026. Kod: db9f2ae, gałąź feat/pv-mining. Przegląd lokalnego prototypu na porcie 4186; bez publikacji i zmian aplikacji.

## Zakres i metoda

Oględziny w przeglądarce przy rozmiarach telefonu 390×844, małego telefonu 320×740, tabletu 768×1024, laptopa 1366×768 i komputera 1440×900. Obejrzano stronę wyboru wariantów, A i B, wynik A, mobilny skrót wyników, przygotowanie zapytania oraz zakładkę Ekonomia w B. Nie jest to test na fizycznych urządzeniach, Safari/iOS, klawiaturze ekranowej ani badanie z rzeczywistymi klientami. Nie powtarzano testów silnika matematycznego.

## Ocena

Wizualnie spójny prototyp: wyraźna identyfikacja AMPOWER, dobry podział kart, czytelne pola, rozróżnione przyciski. Laptop dobrze wykorzystuje układ dwóch kolumn. Telefon i tablet przechodzą do jednej kolumny. W sprawdzonych widokach A/B szerokość dokumentu odpowiadała szerokości dostępnej bez paska przewijania: 305/305 przy 320 px, 375/375 przy 390 px, 753/753 przy 768 px i 1351/1351 przy 1366 px. A na 1440 px: 1425/1425. Nie stwierdzono poziomego przepełnienia całego dokumentu. To nie potwierdza czytelności każdej tabeli po rozwinięciu.

Skrót do wyników, przygotowanie szkicu i przełączenie mobilnej zakładki Ekonomia zadziałały. Odczyt dziennika błędów przeglądarki nie zwrócił błędów. Nie wysyłano wiadomości ani nie uruchamiano klienta poczty.

## Zalecenia według ważności

1. **P1 — uprościć pierwszą odpowiedź dla klienta.** W A główny komunikat brzmi „Najpierw uzupełnij kosztorys”. Klient nie zna cen montażu i osprzętu. Pokazać wstępny wynik energetyczny i operacyjny oraz wyjaśnienie „Pełny koszt i zwrot ustalimy po sprawdzeniu instalacji”, z przyciskiem zapytania. Zachować blokadę obliczania zwrotu przy nieznanych kosztach; nie podstawiać zera ani arbitralnego budżetu.
2. **P1 — kontakt przy wyniku.** Przy 390×844 A miał 9197 px wysokości przed rozwinięciem szkicu, a przycisk zapytania znajdował się na y≈8958 px (ponad 10 wysokości ekranu od początku). Umieścić drugi przycisk bezpośrednio przy podsumowaniu. Kryterium: klient może rozpocząć zapytanie bez przeglądania wszystkich sekcji.
3. **P1 — wynik przed wyborem siedmiu ASIC.** Mobilny „Przejdź do wyników” prowadzi do początku analizy, gdzie najpierw widać listę siedmiu modeli. Werdykt zaczyna się dopiero na dole kolejnego widoku. Przenieść wybór do rozwijanej sekcji albo zmienić cel skrótu na podsumowanie. Kryterium: po kliknięciu klient widzi ocenę i główne liczby.
4. **P2 — odchudzić wariant prosty.** A pokazuje NPV, CAPEX, OPEX, cash flow, szczegółowy depozyt i osobną sekcję baterii także przy jej braku. Zostawić podstawowe wyniki, resztę udostępnić jako szczegóły. B pozostawić do analizy eksperckiej. Wyjaśnić skróty lub zastąpić je polskimi określeniami. Nie ukrywać ograniczeń i źródeł — skrócić pierwszy poziom treści.
5. **P2 — poprawić szkic zapytania.** Potwierdzono tekst „Magazyn: none, pojemność 0 kWh”. Wyświetlać „Brak magazynu”. Szkic zawiera także domyślny budżet 30000 PLN, mimo że użytkownik w tej ścieżce go nie deklarował, a ustawienie znajduje się w zwiniętej sekcji. Oznaczyć wartość jako założenie albo pozostawić „do ustalenia”, dopóki klient jej świadomie nie potwierdzi.
6. **P2 — zadbać o widoczność pełnych opcji pól.** W B przy 390 px zamknięty wybór cen pokazuje skrócone „Historyczne miesięczne RCEm 20”. Umieścić rok w krótszej etykiecie lub pod polem. Kryterium: wybrany okres jest widoczny bez otwierania listy.
7. **P2 — przygotować treść docelową przed publikacją.** Start nadal ma „PROTOTYP LOKALNY · ETAP 2”, „porównaj dwa sposoby analizy” i techniczne „snapshot”. To poprawne dla przeglądu właściciela, ale wymaga redakcji na stronę usługową. Klient powinien przede wszystkim zobaczyć, co AMPOWER sprawdza, projektuje i montuje oraz jak uzyskać wycenę.
8. **P2 — domknąć kanał kontaktu.** Obecnie generowany jest szkic i link mailto, a nie wysyłany formularz. Jest to jasno opisane. Przed publikacją sprawdzić docelowy adres, zachowanie na telefonie bez aplikacji pocztowej oraz rozważyć obsługiwany formularz z potwierdzeniem odbioru.

## Rekomendowana ścieżka

Krótki opis usługi → kilka danych domu → wstępna ocena i trzy główne liczby → „Poproś AMPOWER o sprawdzenie instalacji” → opcjonalne szczegóły, porównanie sprzętu i tryb zaawansowany. Nie zmieniać wyników ekonomicznych na korzystniejsze w celu poprawy konwersji.

## Pozostała weryfikacja

Przed publikacją wykonać fizyczny test Android/Chrome i iPhone/Safari, obsługę klawiatury ekranowej, orientację poziomą, powiększenie tekstu oraz docelowy kanał kontaktu. Niniejszy przegląd potwierdza responsywny układ w jednej przeglądarce, nie pełną zgodność między urządzeniami.
