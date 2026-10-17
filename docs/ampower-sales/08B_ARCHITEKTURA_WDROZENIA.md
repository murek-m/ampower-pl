# AMPOWER — 8B: architektura i ścieżka produkcyjna

Data weryfikacji kosztów: 11.10.2026. To plan wdrożenia, nie konfiguracja aktywnych usług. Lokalny serwer celowo odmawia `NODE_ENV=production`.

## Działająca architektura lokalna

```text
Właściciel → sesja właściciela + CSRF → prywatne API Node → FileStore poza repo
                    ↓                        ↓                 ↓
                dashboard             istniejący katalog    wersje i audyt
                                             ↓                 ↓
Opis PL → deterministyczny parser → prywatny kalkulator → decyzja właściciela
                                                               ↓
                                                bezpieczny eksport → ReportLab PDF

Konfigurator DEMO na Macu → istniejące API zgłoszeń → ten sam FileStore → dashboard
                                                   powiadomienia: demo-disabled
```

Publiczne źródła i kalkulatory pozostają odrębne. Konfigurator DEMO otrzymuje konfigurację lokalnego odbiornika wyłącznie w odpowiedzi prywatnego serwera; plik publiczny nie jest zmieniany. Parser `analyzeDescription(description, catalog)` jest portem do przyszłego dostawcy AI: jego wynik jest propozycją zakresu, nigdy zatwierdzeniem produktu, ceny czy oferty. Obecnie nie wykonuje żadnych zewnętrznych wywołań.

Lokalnie działa sesja przechowywana na serwerze, kod losowany przy każdym uruchomieniu, limit prób logowania, rola `owner`, token CSRF, sprawdzenie Host/Origin, CSP, HttpOnly/SameSite i brak cache danych. Sesja wygasa po godzinie; restart unieważnia sesje. Serwer wiąże się domyślnie z loopback, opcjonalnie z konkretnym prywatnym IPv4 tego Maca. Nie akceptuje `0.0.0.0`, publicznych adresów ani alternatywnego rzeczywistego katalogu.

Pliki mają uprawnienia 0600, katalog 0700, zapis atomowy i blokadę transakcji; odczyt odrzuca symlinki. To izolacja lokalnego użytkownika systemu, nie szyfrowanie bazy ani produkcyjny system kont. Audyt plikowy nie jest odporny na administratora systemu. HTTP w LAN jest dopuszczony wyłącznie dla fikcyjnych danych prototypu.

## Dwa realne warianty

| Element / koszt miesięczny | A — VPS z istniejącym Node/Python | B — Cloudflare Workers + D1 + Access |
| --- | --- | --- |
| Publiczna strona | Dotychczasowy GitHub Pages, po osobnej zmianie źródła na `dist/` | Tak samo |
| Panel i API | VPS w UE, Node, Caddy/HTTPS; oddzielny host `panel.ampower.pl` | Worker na oddzielnym hoście, prywatne API za Access; publiczny endpoint zgłoszeń z antyspamem |
| Baza | SQLite w WAL dla małej firmy; migracja do PostgreSQL przy większej współbieżności | D1, relacyjna baza z transakcjami i unikalnymi kluczami |
| PDF | Istniejący ReportLab i lokalne fonty | Potrzebny generator JS z osadzonym polskim fontem albo odrębna usługa; Python subprocess i FileStore nie przenoszą się bez zmian |
| Hosting | Hetzner CX23: 5,49 EUR + IPv4 0,50 EUR = 5,99 EUR bez VAT | Free: 0 USD w limitach; Workers Paid minimum 5 USD |
| Backup | Backup VPS +20% ceny serwera ≈ 1,10 EUR; razem ≈ 7,09 EUR bez VAT; niezależny zaszyfrowany backup dodatkowo | Eksport bazy, niezależna zaszyfrowana kopia i test odtworzenia; koszt miejsca zależy od wybranej usługi |
| Poczta | Resend Free 0 USD do 3000/miesiąc, maks. 100/dzień; plan Pro 20 USD/miesiąc, jeśli potrzebny | Tak samo |
| Utrzymanie | Aktualizacje OS, Node/Python, kopie, monitoring po stronie AMPOWER | Mniej administrowania OS, ale adaptacja kodu i kontrola limitów/CPU |

Źródła: [Hetzner — ceny po zmianie 15.06.2026](https://docs.hetzner.com/general/infrastructure-and-availability/price-adjustment/), [IPv4](https://docs.hetzner.com/cloud/servers/primary-ips/overview/), [backup 20%](https://docs.hetzner.com/cloud/billing/faq/), [Workers](https://developers.cloudflare.com/workers/platform/pricing/), [D1](https://developers.cloudflare.com/d1/platform/pricing/), [Access/Zero Trust Free](https://www.cloudflare.com/plans/), [Resend](https://resend.com/pricing).

Workers Free ma 100 000 żądań/dzień i 10 ms CPU na wywołanie. D1 Free obejmuje 5 mln odczytanych wierszy/dzień, 100 tys. zapisanych/dzień i 5 GB danych łącznie. Access Free obejmuje do 50 użytkowników; 24-godzinne logi usługi nie zastępują własnego audytu aplikacji. Nie zakładamy, że rozbudowany PDF zmieści się w darmowym CPU: potrzebny pomiar prototypu generatora. Workers Paid obejmuje 10 mln żądań i 30 mln ms CPU/miesiąc; przekroczenia są płatne według cennika. Limity i koszt poczty również trzeba monitorować.

Podane kwoty nie obejmują podatków właściwych dla rozliczenia, przewalutowania, odnowienia domeny, pracy przy utrzymaniu, niezależnego miejsca na kopie ani przyszłego API AI. Nie przeliczono EUR/USD na PLN według zgadywanego kursu. Wariant B może kosztować 0 USD za wskazane usługi przy małym ruchu i spełnieniu limitów, ale wymaga większej adaptacji. Wariant A jest rekomendacją techniczną dla najkrótszego przeniesienia obecnego kodu; zakup pozostaje decyzją właściciela. Nie aktywowano żadnego abonamentu.

## Produkcja — konkretne prace do wykonania

1. Wybrać infrastrukturę i lokalizację przetwarzania; zatwierdzić dostawców, warunki przetwarzania i miesięczny limit kosztów.
2. Oddzielić publiczny artefakt Pages (`dist/`) od aplikacji prywatnej, zmienić konfigurację publikacji dopiero za osobną zgodą. Backend, katalog wewnętrzny, dane i raporty nie mogą wejść do Pages. Ustawić domenę panelu i HTTPS po zgodzie.
3. Zastąpić kod lokalny kontem właściciela z MFA/OIDC, odzyskiwaniem dostępu i audytem tożsamości. Egzekwować rolę na każdym endpointzie niezależnie od bramy Access. Cookie Secure, TLS, właściwy proxy/Origin, limity logowania i publicznych zgłoszeń. Wyłączyć seed DEMO i lokalne obejście antyspamu.
4. Zastąpić FileStore bazą: `inquiries`, `quote_revisions`, `offer_approvals`, `audit_events`, `notification_outbox`, `idempotency_keys`. Klucz idempotencji unikalny, zapis zapytania/wersji/audytu/outbox w jednej transakcji. Wersja rekordu chroni przed nadpisaniem w dwóch kartach. Migracja zachowuje UUID, historię i zatwierdzenia.
5. Publiczne API ma akceptować tylko przewidziany origin i schemat danych, ograniczać rozmiar, tempo, honeypot i serwerowo sprawdzony Turnstile. Nie wymagać sesji administratora od klienta. Odpowiedź przyjęcia dopiero po trwałym zapisie; awaria poczty nie usuwa zapytania. Powtórzenie tego samego klucza zwraca ten sam identyfikator; zmieniony payload powoduje konflikt.
6. Adapter poczty transakcyjnej: odbiorca `kuba@ampower.pl`, weryfikacja domeny/SPF/DKIM, worker outbox, idempotencja dostawcy, retry/backoff oraz stany oczekuje/przyjęte przez dostawcę/dostarczone/błąd. Weryfikować podpis webhooków; przyjęcie przez API poczty nie oznacza doręczenia. Ofert do klientów nie wysyłać bez osobnego jawnego działania właściciela.
7. Zatwierdzić aktualne ceny zakupu i sprzedaży, koszt godzin właściciela, czasy prac, rezerwę, koszty działalności, docelową marżę i kwalifikacje VAT. Potwierdzić dane wykonawcy, treść realizacji, gwarancji i serwisu. Żadne propozycje 8A nie zostały automatycznie przyjęte.
8. Przechowywać sekrety wyłącznie w środowisku/secret managerze. Szyfrować dysk i backupy, ograniczyć dostęp, ustalić retencję z właścicielem. Usunięcie obejmuje zgłoszenie, wszystkie wersje, kopie według ich polityki i wyeksportowane pliki. Tombstone idempotencji nie zawiera danych klienta. Lokalny przycisk nie kasuje wcześniej pobranych PDF ani istniejących backupów.
9. Wykonywać codzienną kopię bazy poza serwer, ustalić RPO/RTO i okres przechowywania. Przetestować odtworzenie, alerty błędów zapisu/poczty/PDF, aktualizacje i niezależny przegląd bezpieczeństwa. Zachować audyt operacji; produkcyjnie chronić go przed modyfikacją.
10. Wykonać test na fizycznym iPhonie/Safari i docelowym HTTPS oraz testy migracji, kontroli dostępu, retencji i awarii. Opublikować dopiero po osobnej zgodzie.

## AI w przyszłości

Przyszły adapter otrzyma opis z minimalizacją danych osobowych i katalog dostępnych identyfikatorów. Odpowiedź musi przejść walidację struktury, ilości, źródeł parametrów i identyfikatorów katalogu. Nieznane wartości pozostają `null`. Silnik finansowy i zatwierdzenie po stronie serwera pozostają deterministyczne. Koszt, dostawca API i zasady przetwarzania wymagają zgody; AI nie ma endpointu pozwalającego samodzielnie zatwierdzić ofertę.
