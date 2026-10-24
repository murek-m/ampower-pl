# Przykładowe obliczenia — etap 1

Reprodukcja: `python3 docs/pv-mining/research/calculate.py`. Dane wejściowe i pełne wyniki: `research/results.json`.

**To symulacja, nie pomiary klienta ani oferta.** Profil PVGIS 2023, Wrocław, południe, 35°, straty systemowe 14%, uzysk 1026,77 kWh/kWp; wykorzystany jako powtarzany profil referencyjny.

Dom: syntetyczne 5000 kWh/rok, profil dobowy z porannym i wieczornym szczytem. Interwały UTC przeliczane na Europe/Warsaw. Zawsze 8760 h/rok, bez dnia przestępnego; to ograniczenie badania.

Magazyny w tabelach są **istniejące**, 20–90% SOC, 5 kW, 90% sprawności cyklu, początek na rezerwie. Ładowanie po zasileniu domu, rozładowanie tylko na dom; ASIC korzysta z pozostałej nadwyżki. Jest to jedna jawna polityka, nie optymalizator wszystkich możliwości.

ASIC: pełna moc, wentylacja dodatkowa 30 W, 9 minut rozruchu bez wydobycia, próg startu +200 W oraz prognoza dostatecznej nadwyżki PV minus dom w kolejnej godzinie. Ta prognoza nie rezerwuje energii przed ładowaniem magazynu; kolejny krok ponownie sprawdza dostępność i może zatrzymać ASIC. Brak zasilania ASIC z sieci. Uptime poniżej oznacza czas zasilania; hash_hours w JSON odejmuje rozruchy.

Ceny urządzeń: obserwacje polskich stron z raportu ofert. **Budżet I = urządzenie + założone 4000 PLN na pozostałe pozycje**; nie jest cennikiem ani ofertą robocizny AMPOWER. Nieznany ostateczny koszt instalacji i przesyłki wymaga wyceny.

Eksport: historyczne miesięczne RCEm 2025 z korektami ×1,23, założone pełne wykorzystanie depozytu. Nie jest to gotówka ani prognoza taryf 2027. Zakup energii 1 PLN/kWh — założenie do porównania magazynu. OPEX miningu 300 PLN/rok + 70,08 PLN/rok na 8 W EMS. Pool 2% i firmware 2,5%, inny pool bez rabatu Braiins; wartości kontrolować dla wybranej konfiguracji.

Analiza 2027–2036: trudność rośnie w scenariuszu, halving według szacowanej wysokości (144 bloki/dzień od snapshotu), opłaty transakcyjne na blok stałe według próbki 144 bloków. ASIC kończy pracę po 5 latach, wartość rezydualna 0; bez wymiany. PV traci 0,5%/rok. Nie zakładamy stałego wydobycia przez 10 lat.

Scenariusze: pesymistyczny BTC ×0,65, trudność +30%/rok, produkcja ×0,90; bazowy BTC ×1,00 i stały kurs, trudność +15%/rok; optymistyczny BTC ×1,50 i +5%/rok, trudność stała, produkcja ×1,05. Są założeniami, a nie przedziałem prawdopodobieństwa.

Δ = wartość wydobycia − utracony wykorzystany depozyt − OPEX. Σ to skumulowany wynik ekonomiczny po budżecie inwestycji, przed podatkami i dyskontem; nie jest wpływem gotówki przy przechowywaniu BTC. Nie doliczamy wzrostu ceny już zgromadzonych BTC. Zwrot liczony tylko z kolejnych rocznych korzyści, nie z prostego I/Δ przy zmiennych parametrach.

## Pesymistyczny

| PV / magazyn | ASIC | I budżet PLN | kWh ASIC/rok | h/rok | BTC / sat w 1. roku | Wartość PLN | Utracony eksport PLN | Δ PLN/rok | Δ/I | Σ3 PLN | Σ5 PLN | Σ10 PLN | Zwrot |
|---|---|---:|---:|---:|---|---:|---:|---:|---:|---:|---:|---:|---|
| 5 kWp / 0 kWh | S21 151T | 10590 | 0 | 0.0 | 0.00000000 / 0 | 0 | 0 | -370 | -3.5% | -11700 | -12440 | -12440 | Brak zwrotu w analizowanym okresie |
| 5 kWp / 0 kWh | S21 Pro 234T | 23500 | 0 | 0.0 | 0.00000000 / 0 | 0 | 0 | -370 | -1.6% | -24610 | -25350 | -25350 | Brak zwrotu w analizowanym okresie |
| 5 kWp / 0 kWh | S21 XP 270T | 40000 | 0 | 0.0 | 0.00000000 / 0 | 0 | 0 | -370 | -0.9% | -41110 | -41850 | -41850 | Brak zwrotu w analizowanym okresie |
| 10 kWp / 0 kWh | S21 151T | 10590 | 0 | 0.0 | 0.00000000 / 0 | 0 | 0 | -370 | -3.5% | -11700 | -12440 | -12440 | Brak zwrotu w analizowanym okresie |
| 10 kWp / 0 kWh | S21 Pro 234T | 23500 | 464 | 131.0 | 0.00044908 / 44908 | 92 | 78 | -356 | -1.5% | -24596 | -25336 | -25336 | Brak zwrotu w analizowanym okresie |
| 10 kWp / 0 kWh | S21 XP 270T | 40000 | 713 | 194.0 | 0.00077786 / 77786 | 160 | 128 | -338 | -0.8% | -41078 | -41818 | -41818 | Brak zwrotu w analizowanym okresie |
| 10 kWp / 10 kWh | S21 151T | 10590 | 0 | 0.0 | 0.00000000 / 0 | 0 | 0 | -370 | -3.5% | -11700 | -12440 | -12440 | Brak zwrotu w analizowanym okresie |
| 10 kWp / 10 kWh | S21 Pro 234T | 23500 | 393 | 111.0 | 0.00037999 / 37999 | 78 | 66 | -358 | -1.5% | -24598 | -25338 | -25338 | Brak zwrotu w analizowanym okresie |
| 10 kWp / 10 kWh | S21 XP 270T | 40000 | 595 | 162.0 | 0.00064784 / 64784 | 133 | 106 | -343 | -0.9% | -41083 | -41824 | -41824 | Brak zwrotu w analizowanym okresie |
| 10 kWp / 20 kWh | S21 151T | 10590 | 0 | 0.0 | 0.00000000 / 0 | 0 | 0 | -370 | -3.5% | -11700 | -12440 | -12440 | Brak zwrotu w analizowanym okresie |
| 10 kWp / 20 kWh | S21 Pro 234T | 23500 | 386 | 109.0 | 0.00037342 / 37342 | 77 | 65 | -358 | -1.5% | -24598 | -25338 | -25338 | Brak zwrotu w analizowanym okresie |
| 10 kWp / 20 kWh | S21 XP 270T | 40000 | 581 | 158.0 | 0.00063170 / 63170 | 130 | 104 | -344 | -0.9% | -41084 | -41824 | -41824 | Brak zwrotu w analizowanym okresie |
| 15 kWp / 0 kWh | S21 151T | 10590 | 0 | 0.0 | 0.00000000 / 0 | 0 | 0 | -370 | -3.5% | -11700 | -12440 | -12440 | Brak zwrotu w analizowanym okresie |
| 15 kWp / 0 kWh | S21 Pro 234T | 23500 | 666 | 188.0 | 0.00064769 / 64769 | 133 | 112 | -349 | -1.5% | -24589 | -25329 | -25329 | Brak zwrotu w analizowanym okresie |
| 15 kWp / 0 kWh | S21 XP 270T | 40000 | 1036 | 282.0 | 0.00113710 / 113710 | 234 | 186 | -322 | -0.8% | -41062 | -41803 | -41803 | Brak zwrotu w analizowanym okresie |
| 20 kWp / 20 kWh | S21 151T | 10590 | 0 | 0.0 | 0.00000000 / 0 | 0 | 0 | -370 | -3.5% | -11700 | -12440 | -12440 | Brak zwrotu w analizowanym okresie |
| 20 kWp / 20 kWh | S21 Pro 234T | 23500 | 712 | 201.0 | 0.00069383 / 69383 | 143 | 119 | -347 | -1.5% | -24587 | -25327 | -25327 | Brak zwrotu w analizowanym okresie |
| 20 kWp / 20 kWh | S21 XP 270T | 40000 | 1110 | 302.0 | 0.00122042 / 122042 | 251 | 199 | -318 | -0.8% | -41058 | -41798 | -41798 | Brak zwrotu w analizowanym okresie |

## Bazowy

| PV / magazyn | ASIC | I budżet PLN | kWh ASIC/rok | h/rok | BTC / sat w 1. roku | Wartość PLN | Utracony eksport PLN | Δ PLN/rok | Δ/I | Σ3 PLN | Σ5 PLN | Σ10 PLN | Zwrot |
|---|---|---:|---:|---:|---|---:|---:|---:|---:|---:|---:|---:|---|
| 5 kWp / 0 kWh | S21 151T | 10590 | 265 | 99.0 | 0.00023903 / 23903 | 76 | 51 | -346 | -3.3% | -11673 | -12414 | -12414 | Brak zwrotu w analizowanym okresie |
| 5 kWp / 0 kWh | S21 Pro 234T | 23500 | 39 | 11.0 | 0.00004043 / 4043 | 13 | 10 | -367 | -1.6% | -24607 | -25347 | -25347 | Brak zwrotu w analizowanym okresie |
| 5 kWp / 0 kWh | S21 XP 270T | 40000 | 11 | 3.0 | 0.00001277 / 1277 | 4 | 3 | -369 | -0.9% | -41109 | -41849 | -41849 | Brak zwrotu w analizowanym okresie |
| 10 kWp / 0 kWh | S21 151T | 10590 | 975 | 365.0 | 0.00088883 / 88883 | 281 | 184 | -274 | -2.6% | -11593 | -12333 | -12333 | Brak zwrotu w analizowanym okresie |
| 10 kWp / 0 kWh | S21 Pro 234T | 23500 | 2064 | 583.0 | 0.00218164 / 218164 | 690 | 464 | -144 | -0.6% | -24359 | -25099 | -25099 | Brak zwrotu w analizowanym okresie |
| 10 kWp / 0 kWh | S21 XP 270T | 40000 | 2065 | 562.0 | 0.00242633 / 242633 | 767 | 463 | -66 | -0.2% | -40771 | -41511 | -41511 | Brak zwrotu w analizowanym okresie |
| 10 kWp / 10 kWh | S21 151T | 10590 | 751 | 281.0 | 0.00068168 / 68168 | 215 | 141 | -296 | -2.8% | -11618 | -12358 | -12358 | Brak zwrotu w analizowanym okresie |
| 10 kWp / 10 kWh | S21 Pro 234T | 23500 | 1699 | 480.0 | 0.00179170 / 179170 | 566 | 382 | -186 | -0.8% | -24406 | -25146 | -25146 | Brak zwrotu w analizowanym okresie |
| 10 kWp / 10 kWh | S21 XP 270T | 40000 | 1716 | 467.0 | 0.00201099 / 201099 | 636 | 385 | -120 | -0.3% | -40832 | -41572 | -41572 | Brak zwrotu w analizowanym okresie |
| 10 kWp / 20 kWh | S21 151T | 10590 | 703 | 263.0 | 0.00063699 / 63699 | 201 | 131 | -300 | -2.8% | -11624 | -12364 | -12364 | Brak zwrotu w analizowanym okresie |
| 10 kWp / 20 kWh | S21 Pro 234T | 23500 | 1614 | 456.0 | 0.00169990 / 169990 | 537 | 363 | -196 | -0.8% | -24421 | -25161 | -25161 | Brak zwrotu w analizowanym okresie |
| 10 kWp / 20 kWh | S21 XP 270T | 40000 | 1632 | 444.0 | 0.00190982 / 190982 | 604 | 367 | -134 | -0.3% | -40851 | -41591 | -41591 | Brak zwrotu w analizowanym okresie |
| 15 kWp / 0 kWh | S21 151T | 10590 | 1376 | 515.0 | 0.00126001 / 126001 | 398 | 263 | -234 | -2.2% | -11547 | -12287 | -12287 | Brak zwrotu w analizowanym okresie |
| 15 kWp / 0 kWh | S21 Pro 234T | 23500 | 2793 | 789.0 | 0.00296144 / 296144 | 936 | 627 | -61 | -0.3% | -24264 | -25004 | -25004 | Brak zwrotu w analizowanym okresie |
| 15 kWp / 0 kWh | S21 XP 270T | 40000 | 2826 | 769.0 | 0.00332840 / 332840 | 1052 | 634 | 48 | 0.1% | -40639 | -41379 | -41379 | Brak zwrotu w analizowanym okresie |
| 20 kWp / 20 kWh | S21 151T | 10590 | 1331 | 498.0 | 0.00121961 / 121961 | 386 | 254 | -238 | -2.3% | -11551 | -12291 | -12291 | Brak zwrotu w analizowanym okresie |
| 20 kWp / 20 kWh | S21 Pro 234T | 23500 | 2959 | 836.0 | 0.00313979 / 313979 | 993 | 665 | -43 | -0.2% | -24241 | -24982 | -24982 | Brak zwrotu w analizowanym okresie |
| 20 kWp / 20 kWh | S21 XP 270T | 40000 | 3043 | 828.0 | 0.00358709 / 358709 | 1134 | 684 | 79 | 0.2% | -40602 | -41342 | -41342 | Brak zwrotu w analizowanym okresie |

## Optymistyczny

| PV / magazyn | ASIC | I budżet PLN | kWh ASIC/rok | h/rok | BTC / sat w 1. roku | Wartość PLN | Utracony eksport PLN | Δ PLN/rok | Δ/I | Σ3 PLN | Σ5 PLN | Σ10 PLN | Zwrot |
|---|---|---:|---:|---:|---|---:|---:|---:|---:|---:|---:|---:|---|
| 5 kWp / 0 kWh | S21 151T | 10590 | 1063 | 398.0 | 0.00103384 / 103384 | 490 | 286 | -166 | -1.6% | -11439 | -12130 | -12130 | Brak zwrotu w analizowanym okresie |
| 5 kWp / 0 kWh | S21 Pro 234T | 23500 | 166 | 47.0 | 0.00018664 / 18664 | 88 | 39 | -321 | -1.4% | -24554 | -25278 | -25278 | Brak zwrotu w analizowanym okresie |
| 5 kWp / 0 kWh | S21 XP 270T | 40000 | 81 | 22.0 | 0.00010043 / 10043 | 48 | 19 | -342 | -0.9% | -41075 | -41807 | -41807 | Brak zwrotu w analizowanym okresie |
| 10 kWp / 0 kWh | S21 151T | 10590 | 3041 | 1138.0 | 0.00299120 / 299120 | 1418 | 833 | 215 | 2.0% | -10917 | -11479 | -11479 | Brak zwrotu w analizowanym okresie |
| 10 kWp / 0 kWh | S21 Pro 234T | 23500 | 3469 | 980.0 | 0.00398298 / 398298 | 1889 | 967 | 551 | 2.3% | -23365 | -23686 | -23686 | Brak zwrotu w analizowanym okresie |
| 10 kWp / 0 kWh | S21 XP 270T | 40000 | 3502 | 953.0 | 0.00446827 / 446827 | 2119 | 971 | 778 | 1.9% | -39404 | -39562 | -39562 | Brak zwrotu w analizowanym okresie |
| 10 kWp / 10 kWh | S21 151T | 10590 | 2464 | 922.0 | 0.00241521 / 241521 | 1145 | 673 | 102 | 1.0% | -11074 | -11672 | -11672 | Brak zwrotu w analizowanym okresie |
| 10 kWp / 10 kWh | S21 Pro 234T | 23500 | 2807 | 793.0 | 0.00321237 / 321237 | 1523 | 774 | 379 | 1.6% | -23600 | -23997 | -23997 | Brak zwrotu w analizowanym okresie |
| 10 kWp / 10 kWh | S21 XP 270T | 40000 | 2852 | 776.0 | 0.00362522 / 362522 | 1719 | 784 | 565 | 1.4% | -39721 | -39979 | -39979 | Brak zwrotu w analizowanym okresie |
| 10 kWp / 20 kWh | S21 151T | 10590 | 2314 | 866.0 | 0.00226804 / 226804 | 1075 | 629 | 77 | 0.7% | -11114 | -11719 | -11719 | Brak zwrotu w analizowanym okresie |
| 10 kWp / 20 kWh | S21 Pro 234T | 23500 | 2630 | 743.0 | 0.00300816 / 300816 | 1426 | 716 | 340 | 1.4% | -23657 | -24070 | -24070 | Brak zwrotu w analizowanym okresie |
| 10 kWp / 20 kWh | S21 XP 270T | 40000 | 2675 | 728.0 | 0.00339997 / 339997 | 1612 | 727 | 515 | 1.3% | -39806 | -40090 | -40090 | Brak zwrotu w analizowanym okresie |
| 15 kWp / 0 kWh | S21 151T | 10590 | 4000 | 1497.0 | 0.00394848 / 394848 | 1872 | 1092 | 411 | 3.9% | -10632 | -11125 | -11125 | Brak zwrotu w analizowanym okresie |
| 15 kWp / 0 kWh | S21 Pro 234T | 23500 | 4775 | 1349.0 | 0.00550139 / 550139 | 2609 | 1332 | 907 | 3.9% | -22853 | -23004 | -23004 | Brak zwrotu w analizowanym okresie |
| 15 kWp / 0 kWh | S21 XP 270T | 40000 | 4833 | 1315.0 | 0.00618721 / 618721 | 2934 | 1350 | 1214 | 3.0% | -38741 | -38684 | -38684 | Brak zwrotu w analizowanym okresie |
| 20 kWp / 20 kWh | S21 151T | 10590 | 3898 | 1459.0 | 0.00385032 / 385032 | 1826 | 1063 | 392 | 3.7% | -10656 | -11156 | -11156 | Brak zwrotu w analizowanym okresie |
| 20 kWp / 20 kWh | S21 Pro 234T | 23500 | 4885 | 1380.0 | 0.00563237 / 563237 | 2671 | 1361 | 940 | 4.0% | -22808 | -22936 | -22936 | Brak zwrotu w analizowanym okresie |
| 20 kWp / 20 kWh | S21 XP 270T | 40000 | 5009 | 1363.0 | 0.00641390 / 641390 | 3041 | 1395 | 1277 | 3.2% | -38635 | -38528 | -38528 | Brak zwrotu w analizowanym okresie |

## Nowy magazyn — odrębny zakres

W JSON `combined_new_storage_pln` porównuje cały zestaw z PV bez magazynu i miningu. Hipotetyczny budżet nowego magazynu to 2000 PLN/kWh (20 000 / 40 000 PLN), koszt cyklu 0,10 PLN/kWh oddanej energii. **Nie są to sprawdzone ceny zakupu ani koszt degradacji konkretnej baterii.** Zakup należy policzyć ponownie z rzeczywistą ofertą i gwarantowanym throughputem. Wynik obejmuje oszczędność domu oddzielnie od korzyści miningu. Magazyn nie dostaje dodatkowej energii z sieci.

Istniejąca bateria nie jest darmowa: jej zużycie na dom jest w obu porównywanych wariantach takie samo i koszt się znosi. Wariant rozładowywania na mining wymaga dodatkowego kosztu degradacji i utraconej oszczędności domu; tutaj świadomie nie został przyjęty.

Godzinowe próbki nie ujawniają chmur i przekroczeń mocy wewnątrz godziny. Czasy pracy są przybliżeniem, nie gwarancją braku importu w EMS. Brak modelu awarii, wymiany ASIC i cen odsprzedaży; ekonomiczny werdykt trzeba potwierdzić na danych 1–15-minutowych klienta. Końcowy SOC jest zapisany; nie przypisuje się mu dodatkowego przychodu.
