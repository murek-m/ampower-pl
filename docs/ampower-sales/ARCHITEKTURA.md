# Rozszerzenie wycen AMPOWER — 2026-10-11

Prace na istniejącej gałęzi feat/smart-home-energy-mvp. Zastane zmiany MVP i wszystkie cztery stare kalkulatory pozostają zachowane. Analiza etapów 1–6: research i macierz opisują warunkowe ścieżki integracji, P01–P11 są historycznymi cenami detalicznymi, model etapu 3 i abonamenty są hipotezami. QA etapu 6 nie sprawdzał backendu ani cen Smart Home. Nie istnieje zatwierdzony cennik ani produkcyjny odbiornik.

## Granice zaufania

GitHub Pages udostępnia tylko dist z jawną listą plików. Publiczny silnik zna wyłącznie ceny sprzedaży, zakresy robót i kwalifikację wariantów. Projekcja katalogu wybiera konkretne dozwolone pola; kwoty pozycji niezatwierdzonych zastępuje null. Koszt zakupu, stawki własne, narzut i wynik są wyłącznie w backendzie. Roboczy szablon danych w repo nie zawiera rzeczywistych cen zakupu AMPOWER; rzeczywisty katalog i dane klientów muszą być poza repo, w prywatnym magazynie. Publiczne repo nigdy nie jest magazynem danych poufnych.

Przeglądarka → publiczne HTTPS API zgłoszeń → walidacja/antyspam → trwały zapis zapytania i zadania powiadomienia → worker poczty → kuba@ampower.pl. Sukces oznacza zapis zgłoszenia, a nie doręczenie e-maila. Odpowiedź ujawnia tylko identyfikator, datę przyjęcia i stan powiadomienia. Nie udostępniamy listy ani odczytu zgłoszeń przez publiczne API.

Lokalny prototyp Node wiąże się tylko z 127.0.0.1. Prywatny CLI właściciela korzysta z uprawnień systemu operacyjnego do katalogu 0700 i plików 0600. Brak HTTP panelu administracyjnego. Prywatne pliki nie są serwowane przez backend. Prototyp jest przeznaczony do lokalnej weryfikacji, nie do wystawienia przez tunel lub reverse proxy.

## Wycena

Każda pozycja ma osobną cenę sprzedaży netto, VAT, czas i zatwierdzenie. Widełki wynikają z zatwierdzonych granic prac i cen, nie arbitralnego ±25%. Wspólna centrala/radio liczone raz; integracja raz na instancję systemu, nie markę i kategorię. Rabat ilościowy dotyczy tylko sprzętu. Minimalna konfiguracja i minimum zlecenia są oddzielnymi dopełnieniami; nie duplikują robót. Rozbudowa ma własną bazę i minimum. Nieznany model, infrastruktura, liczba, transport, trudność, VAT lub wygasła cena powodują indywidualną wycenę całego zakresu. Zdalnie nie naliczamy montażu 230 V; wymagający go wariant przechodzi do indywidualnej oceny. Abonamenty są wyłączone.

## Proces oferty

Zapytanie → kosztorys roboczy → edycja urządzeń/ilości/kosztów/godzin/marży/ceny → dokument roboczy → zatwierdzenie przez właściciela konkretnej wersji → eksport oferty. Każda edycja unieważnia zatwierdzenie. PDF zawiera tylko dane klienta, publiczny zakres, cenę netto/VAT/brutto i warunki. Nie zawiera kosztów własnych. Nie ma automatycznej wysyłki ofert ani działającego przycisku wysyłki do klienta. Późniejsza wysyłka wymaga sprawdzenia zatwierdzenia i skrótu PDF oraz jawnej operacji właściciela.

## Docelowa infrastruktura — propozycja, nie uruchomiona usługa

Rekomendacja: Cloudflare Worker + D1 (transakcja inquiry/outbox/idempotency) + Turnstile + Resend, prywatny panel za Cloudflare Access z MFA i rolą owner, JWT weryfikowany na backendzie. Worker nie publikuje prywatnego katalogu. Sekrety przez secret store, brak kluczy w Pages. CSP/CORS tylko zatwierdzone originy; limity rozproszone, kolejka retry z idempotencją dostawcy, podpisane webhooki delivered/bounced, backup i retencja, audyt zatwierdzeń. PDF w osobnym workerze/serwisie lub generowany przez prywatny CLI.

Lokalny prototyp używa atomowych plików z fsync i kluczy idempotencji oraz limitu w pamięci jednego procesu. Przed produkcją trzeba zastąpić magazyn transakcyjną bazą, limity rozproszonym licznikiem, uruchomić worker i zweryfikować odbiór przez pocztę. Nie ustawiono kont, DNS, Turnstile, API poczty ani hostingu. Nie potwierdzono faktycznej dostawy e-maila.
