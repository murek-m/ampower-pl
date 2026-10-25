# AMPOWER PV Mining — wyniki i decyzje

**Aktualizacja 25.10.2026:** ten dokument opisuje wcześniejszy etap. Bieżący stan i odbiór poprawek: [raport napraw](11_NAPRAWY_PO_AUDYCIE.md); aktualne liczby: [symulacje po naprawie](09_AKTUALNE_SYMULACJE.md).
**Etap 4, 24.10.2026.** Prace na `feat/pv-mining`, osobny katalog `ampower-pv-mining`. Dwa prototypy działają lokalnie, wspólny silnik przeszedł testy. **Nie wykonano wdrożenia, push ani merge do main.** Przed etapem odczytano 49% limitu 5 h i 72% tygodniowego. Raport zamyka zakres badawczy i prototypowy; nie oznacza odbioru instalacji ani gotowości wszystkich integracji do produkcji.

## Wniosek inwestycyjny

W obecnej próbie cen i założeń **nie rekomenduję zakupu ASIC wyłącznie na potrzeby nadwyżek PV**. Żaden z 81 przeliczonych wariantów nie osiągnął zwrotu w horyzoncie 10 lat. Dodatni przyrost korzyści operacyjnej bywa możliwy, ale nie wystarcza na odzyskanie nakładów, szczególnie przy wzroście trudności, halvingu i pięcioletniej użyteczności ASIC.

To wniosek z określonych scenariuszy, nie twierdzenie o każdej instalacji i ofercie. Tania, zgodna sztuka z potwierdzoną regulacją, istniejąca infrastruktura, inny profil zużycia lub niewykorzystany depozyt mogą zmienić wynik. Najpierw potrzebne są rzeczywiste dane klienta i końcowy koszt urządzenia. Nie uzasadnia to obietnicy zysku.

Najlepszy wynik końcowy w badanej próbie nadal jest ujemny: około **−1747 PLN** po 10 latach dla PV20kWp, istniejącej baterii20kWh, S21 151T i optymistycznych założeń. NPV około−6968PLN. W tym wariancie przyszła wycena BTC rośnie o10%/rok; to symulacja wrażliwości. Zysk na wycenie po zakończeniu pracy ASIC nie jest odzyskaniem gotówki bez sprzedaży BTC.

## Repozytorium i miejsce modułu w AMPOWER

Audyt potwierdził statyczne HTML/CSS/JS, lokalny build Node i rzeczywistą publikację ampower.pl przez GitHubPages `main/root`. Smart Home jest już publiczny. Sam kod na gałęzi roboczej nie publikuje podstrony; repo zawiera też lokalne prototypy backendu. Nie wolno po prostu scalić całego drzewa źródeł do produkcyjnej paczki.

Roli Squarespace jako panelu domeny/DNS nie potwierdzono; nie znaleziono dowodu hostowania tam witryny. Nie trzeba zmieniać DNS, by ocenić prototypy. Obecny formularz publiczny korzysta z poczty/kopiowania; produkcyjne API zapytań nie jest włączone. Publiczna analityka ma osobne reguły tras i zgód; nowy moduł nie został do niej dopisany.

Rekomenduję **osobną podstronę `/pv-mining/`** z wejściem ze Smart Home & Energy. AMPOWER oferuje projekt, pomiar, automatykę, dobór zasilania i chłodzenia; ASIC jest sterowanym odbiornikiem w szerszym EMS. Nie ma potrzeby obciążać strony głównej katalogiem i pełnym formularzem analitycznym. Szczegóły i dowody: [audyt](01_AUDYT.md).

## Jak obejrzeć dwa interfejsy

Z katalogu repo uruchom `npm run pv:dev`; gdy podgląd już działa, wystarczy otworzyć adresy:

| Wariant | Podgląd | Dla kogo | Zakres |
|---|---|---|---|
| **A — prosty** | http://127.0.0.1:4186/simple.html | właściciel domu | krótki formularz, opcjonalne znane nadwyżki, magazyn, porównanie, werdykt i szkic zapytania |
| **B — zaawansowany** | http://127.0.0.1:4186/advanced.html | klient z danymi / projektant | CSV, parametry sieci i ASIC, SOC/moc baterii, net-billing, koszty i scenariusze |

Oba są działającymi wariantami opartymi o ten sam `engine.js`, uruchamiany w Workerze. Nie mają dwóch zestawów wzorów. Referencyjny profil PVGIS i dane rynku są lokalnym snapshotem; dane pomiarowe CSV pozostają w pamięci przeglądarki. Eksport JSON nie zawiera surowego CSV. Szkic zapytania wymaga samodzielnego wysłania; nie uruchomiono automatycznej wysyłki.

Podglądy: [A desktop](qa/stage-3/A_DESKTOP.jpg), [B desktop](qa/stage-3/B_DESKTOP.jpg), [B telefon](qa/stage-3/B_MOBILE.jpg). Pełne funkcje i ograniczenia opisuje [etap 2](06_PROTOTYPY.md), a wynik weryfikacji [etap 3](07_TESTY.md).

Moja rekomendacja UX: **A jako wejście klienta, B jako rozwinięcie dla zaawansowanych**, z zachowaniem wspólnego silnika. Wybór pozostaje właścicielowi. Obecnie są to osobne widoki zaczynające od tych samych wartości; automatyczne przenoszenie stanu między A/B pozostaje do dopracowania po wyborze docelowego przepływu.

## ASIC — parametry, ceny i warunkowe rankingi

Badanie obejmuje S21, S21+, S21Pro, S21XP, S23, S23Hydro, S23XPHydro, S23eU2H oraz WhatsMinerM60S++. Prototyp porównuje siedem modeli. [Pełne zestawienie, oferty i źródła](02_ASIC_I_OFERTY.md) zachowuje dokładne SKU, stan, kraj, status VAT/wysyłki, gwarancji i dostępności. Nie ma kompletnej, wiążącej ceny dostawy do polskiego konsumenta dla każdego urządzenia.

| Kryterium | Wynik badanej próby | Co trzeba potwierdzić |
|---|---|---|
| Najniższa odczytana polska cena urządzenia | **S21 151T, 6590 PLN brutto** | dokładny wariant, stan i dostawa; tej ceny nie przypisujemy do S21 200T |
| Najlepsze katalogowe J/TH | S23XPHyd.600T **8,9**, S23Hyd.580T **9,5**, S23air305T **11** | pierwsze futures; obieg cieczy i jego pobór/koszt; niepotwierdzona regulacja |
| Koszt TH/s — badane polskie obserwacje | S21 151T **43,64 PLN/(TH/s)** | bez dostawy; Pro83,33 iXP133,33 opierają się na słabszych cenach indeksowanych |
| Oferty zagraniczne | m.in. Pro234T2119USD, XP270T3299USD; XPUE2999EUR netto | fracht, VAT/import, cło, spread, stan; nie są finalnym rankingiem dostawyPL |
| PV5kWp | ekonomiczny punkt odniesienia: **bez zakupu** | mało godzin wystarczającej mocy; S21 151T jedynie kandydatem do pomiaru |
| PV10/15kWp | S21 151T ma w użytych cenach niższy CAPEX i mniejszą stratę inwestycyjną; Pro/XP zwiększają BTC | wyższe BTC nie kompensuje automatycznie ceny. Brak dodatniego zwrotu dla każdego z trzech w bazie |
| Praca sezonowa | zgodny S21/S21+ z niskim, potwierdzonym kosztem | zużycie, gwarancja i diagnostyka; nie ma bezwarunkowego zwycięzcy |
| Regulacja mocy | S21/+/Pro/XP z odpowiednim kontrolerem, Braiins/LuxOS | rzeczywiste minimum, krzywa H(P), czas rozruchu; nie przyznajemy pierwszego miejsca bez pomiarów |

Braiins/LuxOS nie są uniwersalnym rozwiązaniem dla wszystkich wersji płyt. Dla S23 nie potwierdzono zgodności; WhatsMiner ma własne API, ale parametry konkretnych wersji trzeba zbadać. Prototyp liczy pracę znamionową i wyłączenie. Własne W i TH/s są jawnym założeniem, a nie potwierdzeniem underclockingu.

Oferty opisane jako hosting wyłączono z porównań zakupu do domu. Rozbieżny wariant305/318T i nieznane koszty importu nie stają się „okazją”. Nie rekomenduję Hydro do domowego MVP5–15kWp bez pełnego projektu. Odczyty rynku pochodzą z24.10.2026; przed ofertą konieczne jest ponowne potwierdzenie handlowe, nie samo odświeżenie kursuBTC.

## Przykład PV10kWp bez magazynu

Założenia: dom5000kWh/rok; referencyjny profilWrocław2023; historiaRCEm2025; miesięczny depozytFIFO; snapshotBTC316113,62PLN; trudność+15%/rok; stały kursBTC; ASIC5lat, analiza10lat. Ceny sprzętu są obserwacjami, infrastruktura4000PLN jest budżetem przykładowym. Nie jest to cennikAMPOWER.

| Model | Budżet inwestycji PLN | Energia ASIC kWh/rok | h zasilania | BTC/rok | sat/rok | Wartość BTC PLN | Utracony eksport PLN | Dodatkowa korzyść PLN/rok |
|---|---:|---:|---:|---:|---:|---:|---:|---:|
| S21 151T | 10 590 | 3385 | 1267 | 0,00293745 | 293 745 | 929 | 304 | **255** |
| S21 Pro234T | 23 500 | 3735 | 1055 | 0,00378932 | 378 932 | 1198 | 398 | **430** |
| S21 XP270T | 40 000 | 3745 | 1019 | 0,00422322 | 422 322 | 1335 | 399 | **566** |

Koszt stały przy tych założeniach to370,08PLN/rok (utrzymanie300 + dodatkowyEMS8W jako koszt energii z sieci). Czas hashowania jest niższy od czasu zasilania przez rozruch. Nie zakładamy8h/dobę. Dla S21 151T wynik poCAPEX wynosi około **−11380 / −12837 / −13825 PLN** po3/5/10latach. Wszystkie trzy: **Brak zwrotu w analizowanym okresie**. Prosty procent korzyści roku1 wynosi odpowiednio2,40% /1,83% /1,41%; jego odwrotność nie jest prognozą zwrotu przy zmiennej trudności.

Pełne sześć instalacji, po trzy ASIC, scenariusze pesymistyczny/bazowy/optymistyczny oraz nowy magazyn: [aktualne tabele](09_AKTUALNE_SYMULACJE.md), [81 rekordów JSON z założeniami](qa/stage-4/simulations.json). Odtworzenie: `node scripts/pv-mining-report.mjs`. To wspólny silnik prototypów, nie dodatkowy model matematyczny. Historyczne obliczenia etapu1 zachowano osobno; miały uproszczony koszt alternatywny eksportu i nie należy ich mieszać z rejestrem depozytu prototypów.

## Wpływ magazynu

Dla S21 151T / PV10kWp bateria istniejąca10kWh zmniejsza energię ASIC z3385 do2627kWh/rok, bo najpierw wspiera dom. Mining nie przejmuje oszczędności domu. Dodatkowa korzyść samego miningu w tej symulacji wynosi349PLN/rok wobec identycznej baterii bez ASIC. To nie dowodzi, że należy kupić baterię.

Przy **nowej baterii10kWh** budżet całego zestawu rośnie do30590PLN; korzyść zestawu dla domu i miningu wynosi946PLN w roku1, a wynik po10latach około−25334PLN. Połączenie obu efektów bez ceny baterii zawyżyłoby ocenę miningu. Dla20kWh w przykładzie użyto tego samego demonstracyjnego budżetu20tys.PLN, więc nie jest to porównanie rzeczywistych ofert pojemności.

Magazyn jest opcjonalny. Nie jest potrzebny do samej stabilizacji instalacji on-grid. Jeśli go dopuszczamy do ASIC, obowiązują SOC, moc, sprawność i koszt cykli oraz ochrona rezerwy domu. Sterownik może wybrać eksport i nie uruchomić koparki.

## Architektura fizyczna i odpowiedzialność EMS

PV → falownik → szyna AC/rozdzielnica → dom, opcjonalny magazyn, dedykowany obwódASIC. Dwukierunkowy pomiar przyłącza przekazuje dane do lokalnegoEMS/HA; EMS steruje ASIC przez autoryzowaneAPI. Pool wypłacaBTC na adres kontrolowany przez klienta. EMS nie jest szeregowym elementem toru mocy. [Schemat i logika](03_MODEL_I_ARCHITEKTURA.md#fizyczna-architektura-i-ems).

Wymagany jest pomiar mocy/energii, lokalne sterowanie i projekt obwodu. ShellyPro3EM lub zgodny licznikModbus są kandydatami; istniejących elementów nie kupujemy ponownie. Dobór stycznika, przewodów, zabezpieczeń, faz, złączy, wentylacji i obiegu cieczy wynika z dokumentacji oraz projektu. Kilka kilowatów ciepła i hałas są ograniczeniami miejsca montażu.

Decyzja energetyczna uwzględnia krańcową wartość: uniknięcie zakupu dla domu, późniejsze wykorzystanie baterii, wydobycie po kosztach i faktycznie wykorzystany eksport. Histereza i czasy minimalne ograniczają przełączanie. Utrata pomiaru/API, prąd, temperatura, przepływ cieczy lub niedopuszczalny import wymuszają bezpieczne zatrzymanie. Godzinowa symulacja nie weryfikuje pętli1–5s; potrzebny pilotaż na konkretnym sprzęcie.

Sterowanie zostaje w sieci lokalnej, bez publicznych portówASIC. Publiczny kalkulator nie wysyła komend do instalacji. **AMPOWER nie przechowuje kluczy prywatnych ani seedów**. Klient kontroluje pool, adres i portfel. Wyniki są przed podatkami i nie gwarantują dochodu.

## Aktualizacja danych i utrzymanie

Działa dziś: wersjonowany lokalnyJSON, źródła i daty, walidacja, ostrzeżenia wieku, brak zewnętrznych wywołań z prototypu. **Pipeline automatycznej aktualizacji pozostaje zaprojektowany, nieaktywny.** Nie uruchomiono harmonogramu ani usług.

Rekomendowana architektura:

1. Actions co6h pobieraBTC/PLN(Coinbase) i difficulty/height/fees(mempool); NBP raz dziennie roboczo, PSE według okresów publikacji, PVGIS z cache profili.
2. Adaptery mają timeout/backoff i walidację schematu, jednostek, wieku oraz zmian. CenyASIC ręcznie zatwierdzane lub ze źródeł z potwierdzoną zgodą/feedem. Brak założenia o legalności masowego scrapingu sklepów.
3. Każda grupa ma źródło, datę obserwacji, pobrania, ważność i status. Nieudany odczyt zachowuje ostatnią poprawną grupę; nigdy nie wpisuje0 zamiast ceny.
4. WersjonowanyJSON i manifest trafiają do osobnego repo/gałęzi danych. ArtefaktActions sam nie jest endpointem dla frontendów. W produkcji potrzebny zatwierdzony statyczny hosting/CDN lub kontrolowany build strony, z CORS/CSP/cache i rollbackiem.
5. Klucze wyłącznie wSecrets po stronie automatyzacji. Alarm błęduworkflow dla właściciela, a frontend niezależnie pokazuje wiek. PoTTL brak rekomendacji zakupowej; pozostaje jawna analiza historyczna/własne założenia.

Obecne Pages jest skonfigurowane na main/root. JSON z `feat/pv-mining` **nie pojawi się automatycznie na ampower.pl**. Wybór hostingu danych i publikacji wymaga decyzji. Ograniczenia bezpłatnychAPI, brakSLA, korektyPSE i warunki komercyjnego hostingu opisano wraz ze źródłami w [architekturze danych](03_MODEL_I_ARCHITEKTURA.md#aktualizacja-danych-i-źródła).

Szacunek infrastruktury dla małej skali: **0PLN/miesiąc**, pod warunkiem publicznego repo, standardowych darmowych runnerów, darmowychAPI i dostępnego bezpłatnego hostingu statycznego. Przy4uruchomieniach/dzień po2min to około240min/miesiąc. Nie jest to odczyt rachunku ani gwarancja przyszłych cenników. Nie obejmuje domeny, pracy nad ofertami/awariami, sprzętuEMS, internetu i opcjonalnej poczty/API formularza. Nie kupiono kredytów, nie włączono płatnych planów. Stała obsługa cen pozostaje pracą człowieka.

## Wynik testów i pozostałe ograniczenia

**250/250 testów**, w tym31PVMining; build poprawny. Testy jednostek, wzoruBTC/halvingu, bilansu, baterii, depozytuFIFO, kosztów i awarii danych są opisane w [raporcie testów](07_TESTY.md). Oba widoki sprawdzono przy320/390/768px; nie jest to odbiór na fizycznym telefonie ani test wydajnościSafari/iOS. Zachowano zrzuty i wyniki odczytów.

Przed produkcją pozostają: rzeczywiste profile różnych dachów i lokalizacji, pełny szeregRCE i taryfy, faktura/depozyt konkretnego klienta, potwierdzone oferty i landed-cost, kosztorysAMPOWER, pomiary H(P)/rozruchu konkretnegoASIC, pilotażEMS i odbiór elektryczny. Nie zaimplementowano backendu leadów, aktywnegoActions, produkcyjnegoCDN ani kompletnej integracjiHA/ASIC. To jawne granice prototypu; raport nie nazywa tych integracji zakończonymi.

## Decyzje do Twojej akceptacji

| Decyzja | Rekomendacja |
|---|---|
| Wariant interfejsu | A jako wejście, B dostępny po przełączeniu; możesz wybrać jeden do dopracowania |
| Miejsce w serwisie | osobne `/pv-mining/`, link zeSmartHome; bez rozbudowy strony głównej |
| Dalsza oferta AMPOWER | konsultacja/projektEMS z uczciwą oceną „nie kupować”, zamiast obietnicy zarobku |
| Sprzęt pilotażowy | jedna konkretna sztuka S21/Pro z rozpoznanym kontrolerem i pomiarem; dopiero po aktualnej ofercie i uzasadnieniu budżetu |
| Dane klienta | lokalnyCSV jako źródło preferowane; profilePVGIS dla dodatkowych lokalizacji po ustaleniu zakresu |
| Rozliczenia | potwierdzić zasady umowy, wykorzystania depozytu i cen interwałowych; domyślne założenia nie zastępują faktur |
| Kosztorys | Twój cennik/realne oferty, łącznie z chłodzeniem i importem; usunąć demonstracyjne budżety przed ofertowaniem |
| CennikASIC | zatwierdzane ręcznie ceny lub feed za zgodą sprzedawcy; nie automatyczny scraping bez podstaw |
| Automatyzacja/hostingJSON | osobny statyczny endpoint, planowany limit0PLN; żadnych dopłat bez zgody |
| Formularz i prywatność | wybór między pocztą a zatwierdzonymAPI; bez wysyłkiCSV i kluczy; osobny przegląd analityki |
| Publikacja | dopiero osobne zatwierdzenie zakresu po obejrzeniu prototypów i usunięciu wskazanych braków |

Zgoda na etapy3–4 nie jest zgodą na zakup sprzętu, kontakt ze sprzedawcami ani wdrożenie. Nie wykonano żadnej z tych czynności.

## Zamknięcie etapów i limity

Rzeczywisty odczyt po etapie4: **45% limitu5h, 71% tygodniowego**. Odnowienia: **25.10.2026 02:40:47 CEST** oraz **31.10.2026 06:35:01 CET**. Innych limitów procentowych narzędzie nie zwróciło. Nie wykorzystano resetów ani dopłat. Nie zmieniano modelu.

Dalsze dopracowanie wybranego UX: rekomenduję pozostanie przy GPT-6.1Sol / medium; zmiany matematyki i integracji sprzętu rozważyć z high po Twojej decyzji. Nie rozpoczynam dalszych prac ani publikacji na podstawie samej zgody na etapy3–4.
