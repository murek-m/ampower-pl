# ASIC i oferty — stan 24.10.2026

Zakres: Bitcoin SHA-256. Parametry dotyczą dokładnego wariantu, nie wszystkich urządzeń z nazwą serii. `?` oznacza niepotwierdzone, nigdy zero. „W magazynie” oznacza deklarację strony, bez rezerwacji i sprawdzenia konkretnego numeru seryjnego.

## Parametry i sterowanie

| Producent / wariant | TH/s | W urządzenia | J/TH | Chłodzenie | Zasilanie | Hałas | Braiins OS 26.09.1 / regulacja |
|---|---:|---:|---:|---|---|---|---|
| Bitmain S21 200T | 200 | 3500 | 17,5 | powietrze | 220–277 V, 1 faza, wejście wg dokumentacji 20 A | ? w odczytanej karcie | model obsługiwany, płyta i firmware do identyfikacji |
| Bitmain S21 151T, wariant sklepu | 151 | 2642 | ok.17,50 | powietrze | potwierdzić tabliczką wariantu | ? | rodzina obsługiwana; zakres mocy tej sztuki nieznany |
| Bitmain S21+ 216T | 216 | 3564 | 16,5 | powietrze | 1 faza wg katalogu; zakres napięć do potwierdzenia instrukcją SKU | ? | obsługiwany; nie przenosić parametrów na 225/235T |
| Bitmain S21 Pro 234T | 234 | 3510 | 15 | powietrze | 220–277 V, 1 faza, 20 A, wymaganie mocy zasilania 4000 W | 76 dBA | obsługiwany |
| Bitmain S21 XP 270T | 270 | 3645 | 13,5 | powietrze | 220–277 V, 1 faza, 20 A, wymaganie 4000 W | 76 dBA | obsługiwany |
| Bitmain S23 305T | 305 | 3355 | 11 | powietrze | katalog: 1 faza; instrukcja wariantu wymagana | ? | **brak na zweryfikowanej liście**, brak potwierdzonego minimum mocy |
| Bitmain S23 Hyd. 580T-10 | 580 | 5510 | 9,5 | ciecz, zewnętrzny obieg | 380–415 V, 3 fazy, 12 A wg instrukcji | ? dla kompletnego obiegu | brak potwierdzenia obsługi |
| Bitmain S23 XP Hyd. 600T | 600 | 5340 | 8,9 | ciecz | 3 fazy wg katalogu, szczegóły do projektu | ? | brak potwierdzenia obsługi; futures od XI 2026 |
| Bitmain S23e U2H 865T | 865 | 8650 | 10 | ciecz / rack | 3 fazy wg katalogu | ? | brak potwierdzenia obsługi; poza domowym MVP |
| MicroBT WhatsMiner M60S++ 218T | 218 | 3379 | 15,5 | powietrze | 220–240 V; przewód IEC C19 >=16 A wg instrukcji rodziny | ? w instrukcji | brak Braiins; natywne API MicroBT, minimum do pomiaru |

Źródła techniczne: [S21](https://support.bitmain.com/hc/en-us/articles/23794895251609-S21-Specification), [S21 Pro](https://support.bitmain.com/hc/en-us/articles/31321354157593-S21-Pro-Specification), [S21 XP](https://support.bitmain.com/hc/en-us/articles/35383015643673-S21-XP-Specifications), [katalog Bitmain API](https://shop-product-service.bitmain.com/api/productshow/getMainProduct), [instrukcja S23 Hyd.](https://file12.bitmain.com/shop-product-s3/firmware/807d3b27-f625-470f-a940-247f83b36854/2025/06/20/14/S23%20Hyd.%20Product%20Manual_v1.0.6.pdf), [MicroBT 218T](https://shop.whatsminer.com/products/details/74?skuId=169), [instrukcja M60S++](https://aws-microbt-com-bucket.s3.us-west-2.amazonaws.com/WhatsMinerM60S%2B%2B_1760948259244.pdf), [S21 151T — sprzedawca](https://miners.pl/pl/p/Bitmain-Antminer-S21/113).

M60S++: dokument rodziny podaje zakres 200–226T i 3230–3570 W, niejednakowy z przemnożeniem końców zakresów przez 15,5. Do wyliczenia 218T stosować konkretną kartę sklepu producenta 3379 W, a do obwodu tolerancje instrukcji. Nie uśredniać do innego SKU. Bitmain S21 XP ma w internetowej tabeli błędną etykietę jednostki J/Ksol: 3645/270 = **13,5 J/TH** dla SHA-256.

S23 Hyd.: wymagany przepływ 8–10 l/min, ciecz na wlocie 20–50°C, ciśnienie <=3,5 bar. To nie podłączenie do instalacji wodnej domu bez projektu. Moc pomp i chłodnicy nie zawiera się w 5510 W urządzenia. Dla Pro/XP producent podaje tolerancje hashrate ±3%, mocy i sprawności ±5%; nie utożsamiać katalogu z gwarantowanym wynikiem pomiaru.

### Firmware i API — osobno dla modelu

| Model | Braiins | LuxOS | Pozostała ścieżka i ograniczenie |
|---|---|---|---|
| S21 | tak, sprawdzić kontroler | power targeting: AML/CVITEK i wymienione hashboardy | stock: nie potwierdzono uniwersalnego płynnego API |
| S21+ | tak | AML, A3HB70701/02/03 | profil po underclockingu wymaga pomiaru H(P) |
| S21 Pro | tak | AML, A3HB70601/02/03 | zmiana firmware może wpłynąć na gwarancję |
| S21 XP | tak | AML, A3HB70501/02/03 | nie przyjmować identycznej krzywej jak Pro |
| S23 | nie potwierdzono | nie występuje w odczytanej tabeli | tylko potwierdzony tryb stock / API po pilotażu |
| S23 Hyd. / XP Hyd. / U2H | nie potwierdzono | nie potwierdzono | konieczne także sterowanie i blokady chłodzenia |
| M60S++ | nie | brak dokładnego modelu w odczytanej tabeli (jest M60S) | MicroBT API v3; weryfikacja wersji firmware i uprawnień |

[Braiins releases](https://downloads.braiins.com/braiins-os/) potwierdza modele, nie zmierzony minimalny pobór. [Braiins API](https://academy.braiins.com/braiins-os/papi-about) obsługuje gRPC i REST (REST od 25.07). [LuxOS compatibility](https://docs.luxor.tech/firmware/compatibility) wymienia konkretne kontrolery/hashboardy; niektóre instalacje wymagają pomocy producenta firmware. [MicroBT API](https://apidoc.whatsminer.com/) rozróżnia zadanie mocy, power limit i tryb low/normal/high; ustawienie limitu może wymagać restartu. To nie potwierdzenie szybkiej regulacji dowolnego M60S++.

[VNISH](https://vnish.global/) oferuje buildy S21 i S21 Pro zależne od kontrolera; nie zweryfikowano całej macierzy i zakresów mocy każdego SKU. Nie używać deklaracji marketingowych o oszczędnościach jako parametrów obliczeń. Domyślnie tylko nazwane, potwierdzone tryby; niepotwierdzona regulacja = brak suwaka mocy.

[Braiins fee](https://braiins.com/os-firmware/download): 2–2,5% hashrate zależnie od sprzętu. Nie jest to to samo co pool fee; konfiguracja Braiins Pool może mieć rabat. Uwzględnić zależność od serwera licencji i [warunki przerw łączności](https://academy.braiins.com/braiins-os/faqs/license).

## Oferty i koszty dla Polski

Przeliczenia orientacyjne: NBP 23.10.2026, USD 3,9247 PLN, EUR 4,3917 PLN, CZK 0,1807 PLN. To kurs średni, bez spreadu. W kalkulacji konsumenta przyjmujemy 23% VAT dla sprzętu; rzeczywista faktura i warunki OSS/importu muszą zostać potwierdzone. Nie ustalono taryfy celnej konkretnej przesyłki — **nie przyjęto automatycznie cła 0%**.

Każda obserwacja poniżej ma datę weryfikacji **24.10.2026**. Źródła indeksowane wyszukiwarką są wyraźnie słabsze od bieżącego odczytu HTTP/API.

| Sprzedawca / kraj | Dokładna oferta i stan | Cena odczytana | Wysyłka PL, VAT, import / końcowa cena | Gwarancja / dostępność |
|---|---|---:|---|---|
| [Miners.pl / PL](https://miners.pl/pl/p/Bitmain-Antminer-S21/113) | S21, wybieralny wariant 151T; nowy wg standardowej karty, potwierdzić fakturą | 6590 PLN brutto, 5357,72 netto | dostawa nieznana; **6590 + dostawa**, nie przypisywać tej ceny do 200T | karta: producent 365 dni; „średnia ilość” |
| [Unlimited / PL](https://www.unlimitedminer.com/sklep/s21-pro) | S21 Pro 234T; stan potwierdzić | 19 500 PLN brutto | dostawa nieznana; finalna niepotwierdzona | sprzedawca 24 miesiące; dostępność potwierdza przed realizacją; cena z indeksu, bez udanego odczytu strony |
| [Unlimited / PL](https://unlimitedminer.com/sklep) | S21 XP 270T / S23 Hyd.580T; stan potwierdzić | 36 000 / 72 000 PLN brutto | wysyłka nieznana, hydro bez pełnego obiegu; finalna niepotwierdzona | brak potwierdzenia SKU; cena indeksowana |
| [NexMine / DE](https://nexmine.de/shop) | S21 Pro234T / S21+216T z etykietą **Hosting** | 1830 / 1384 EUR netto | **wyłączone z porównania dostawy do domu**; indeks wskazuje hosting, strona dynamiczna nie ujawniła bieżących kart | brak niezależnej weryfikacji sztuk; ceny orientacyjne |
| [Cryptobox / CZ](https://cryptobox.cz/product/antminer-s21-200-th-s-skladem-hk/) | S21 200T, stan do potwierdzenia, **magazyn HK** | 89 000 CZK netto / 107 690 z czeskim DPH | warunki PL/importu/dostawy nieznane; nie stosować czeskiego brutto jako finalnego PL; netto × kurs ×1,23 ≈19 782 PLN przed brakującymi kosztami | „u dostawcy”, 7–10 dni; gwarancji nie potwierdzono |
| [Antminer Distribution Europe / NL](https://www.antminerdistribution.com/) | S21 XP270T; stan wg strony sklepu, wymaga potwierdzenia | 2999 EUR netto | netto × kurs ×1,23 ≈16 200 PLN + dostawa; deklarowany magazyn UE, brak odprawy przy dostawie z UE | deklaracja do 2 lat, wysyłka 7 dni; cena z głównej, karta produktu nie ujawnia tej samej ceny |
| [ADE / NL](https://www.antminerdistribution.com/antminer-s23/) | S23: główna 305T, tytuł karty **318T** | 7999 EUR netto na głównej | **rozbieżny wariant — wstrzymać ranking**, koszt po konwersji nie jest ofertą305T | deklaracja X/XI, potwierdzić wariant |
| [CryptoMinerBros / HK, potwierdzić podmiot fakturujący](https://www.cryptominerbros.com/product/bitmain-antminer-s21-plus-bitcoin-miner/) | S21+225T / 235T, NewCondition w metadanych | 1629 / 1739 USD | 7864 / 8395 PLN po samym VAT i kursie, **bez dostawy, cła, odprawy i spreadu**; finalna null | metadane InStock, opis365dni; opis techniczny nadal216T, więc potwierdzić tabliczkę |
| [CryptoMinerBros / HK](https://www.cryptominerbros.com/product/bitmain-antminer-s21-pro-bitcoin-miner-234th-s/) | S21 Pro234T /245T, nowe | 2119 /2229 USD | ok.10 229 /10 761 PLN z samym VAT, pozostałe nieznane | InStock, deklarowane365dni; 245T nie modelować mocą234T |
| [CryptoMinerBros / HK](https://www.cryptominerbros.com/product/bitmain-antminer-s21-xp-bitcoin-miner/) | S21 XP270T, nowy | **3299 USD bieżące metadane**, indeks starszy3489 | ok.15 926 PLN z samym VAT, pozostałe nieznane | InStock, 365 dni deklarowane |
| [Bitmain / Chiny](https://shop-product-service.bitmain.com/api/productshow/getMainProduct) | S21+216T / S23 305T / S23 Hyd.580T | 3240 /9150 /17 400 USD katalogowo | PL końcowa nieznana, fracht/cło/odprawa/VAT osobno; kupon nie jest ceną gwarantowaną | katalog/UI sold out dla tych pozycji; stare terminy nie dowodzą dostępności |
| [Bitmain / Chiny](https://shop.bitmain.com/product/detail?pid=000202608201636197889T3Y4SxC0660) | S23 XP Hyd.600T | 15 300 USD | końcowa nieznana; chłodzenie osobno | futures od XI2026, brak dostawy natychmiast |
| [MicroBT / Chiny](https://shop.whatsminer.com/products/details/74?skuId=169) | M60S++218T | brak stabilnej ceny w odczycie | wszystkie koszty handlowe nieznane | specyfikacja potwierdzona, zapas/gwarancja niepotwierdzone |

Nie potwierdzono końcowej ceny „pod drzwi” wszystkich powyższych urządzeń, więc raport **nie nazywa żadnej oferty najtańszą dostarczoną do Polski**. W metadanych sklepu znaleziono też przekierowanie starego URL S21 do S21+ — automatyczny scraper po nazwie adresu kupiłby inny model. Dowód: `evidence/seller-s21.json`. Cennik importowy musi sprawdzać nazwę, TH/s i wariant po przekierowaniu.

Prywatne oferty używanych S21+ także istnieją, lecz bez diagnostyki hashboardów, historii gwarancji i pomiaru nie są porównywalne z nowymi. Nie włączono ich do rekomendacji inwestycyjnych. Urządzenia refurbished muszą mieć odrębny status i warunki; nie znaleziono wystarczająco pewnej kompletnej oferty refurbished do rekomendacji.

## Rankingi — rozdzielone kryteria

| Kryterium | Wynik w badanej próbie | Warunek / ograniczenie |
|---|---|---|
| Najniższa polska cena urządzenia | S21 151T:6590 PLN brutto | bez dostawy; stan/wariant przed zakupem potwierdzić |
| Najlepsze J/TH | S23 XP Hyd.8,9; dalej S23 Hyd.9,5; S23 air11 | pierwsza pozycja futures; dodatkowe chłodzenie i CAPEX |
| Najniższy koszt TH/s, polskie odczyty | S21 151T **43,64 PLN/(TH/s)**; Pro234 **83,33**; XP270 **133,33** | XP/Pro ceny indeksowane, bez dostawy; nie globalny ranking |
| Koszt TH/s, import — tylko kwota po VAT | S21+225 ok.34,95; Pro234 ok.43,71; XP270 ok.58,98 PLN/(TH/s) | przed frachtem/cłem, S21+ niespójny opis; nie zwycięzcy zakupowi |
| PV5 kWp | najpierw rozważyć **brak zakupu**; S21 151T kandydatem do pomiaru | próg2,642kW pomaga, ale niska liczba godzin i starsza sprawność |
| PV10 kWp | S21 151T / Pro234 / XP270 porównać na identycznym profilu i cenach | wyniki bazowe w04; opłacalność inwestycji może być ujemna dla wszystkich |
| PV15 kWp | Pro234 lub tani S21; XP jeśli uzasadni premię w PLN | większe PV nie zmienia automatycznie niskiego wykorzystania zimą |
| Praca sezonowa | najniższy wiarygodny CAPEX na zgodny S21/S21+ | amortyzacja przez mało godzin, ryzyko używanych sztuk |
| Regulacja mocy | S21 /Pro/XP/+ z rozpoznaną płytą i Braiins/LuxOS | **brak uczciwej kolejności bez zmierzonych Pmin, H(P), rozruchu i sprawności** |

To rankingi warunkowe, nie zamiennik landed-cost ani optymalizacji. Najkorzystniejszy zakup w danym scenariuszu wybierać dopiero spośród zgodnych urządzeń z kompletnym kosztem i dodatnim przyrostem wartości; porównać z wariantem bez inwestycji. S23 Hydro nie rekomenduję do domowego MVP 5–15 kWp: wysokie minimum, obieg chłodniczy i niepotwierdzona regulacja zwiększają ryzyko mimo znakomitego J/TH. Możliwy odrębny projekt przemysłowy/odzysk ciepła, z ekonomią ciepła liczona osobno.
