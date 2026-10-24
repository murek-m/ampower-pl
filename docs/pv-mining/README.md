# AMPOWER PV Mining — dokumentacja projektu

**Aktualny stan:** etapy 1–4 zakończone w zakresie audytu, prototypów, testów i przedstawienia wyników. Bez publikacji. Zacznij od [wyników i decyzji](08_WYNIKI_I_DECYZJE.md), [aktualnych 81 symulacji](09_AKTUALNE_SYMULACJE.md) i [raportu testów](07_TESTY.md). [Uruchomienie A/B](06_PROTOTYPY.md). Poniżej zachowano historyczny raport etapu 1; jego zgody i rekomendacje dotyczą stanu w chwili napisania.

Data badania: **24.10.2026**. Wyłącznie audyt, research i obliczenia badawcze. Nie rozpoczęto prototypów ani publikacji.

## Najważniejsze ustalenia

1. Witryna działa na GitHub Pages, `main/root`. Smart Home jest już opublikowany. Źródła rozwojowe i produkcyjna paczka mają różne historie zmian.
2. PV Mining jest technicznie wykonalny jako rozszerzenie EMS. Pomiar dwukierunkowy i sterowanie są obowiązkowe; magazyn jest opcjonalny.
3. Niska cena kWh PV nie oznacza zerowego kosztu: tracimy możliwość eksportu albo zasilenia domu. Kilka tysięcy godzin rocznie nie jest zapewnione mocą znamionową PV.
4. S21 / S21+ / S21 Pro / S21 XP mają potwierdzone ścieżki sterowania przez Braiins OS lub LuxOS, zależne od elektroniki. Dla S23 nie potwierdzono tych ścieżek. Nie przyjmujemy dowolnej regulacji od 0 W.
5. Nie uzyskano wiążącej ceny dostawy do polskiego konsumenta dla wszystkich ofert. Ceny urządzeń są obserwacjami stron, a nie ofertami AMPOWER; brakujące koszty pozostają nieznane.
6. **Nie ma podstaw do obietnicy zwrotu ani bezwarunkowej rekomendacji zakupu.** Ranking inwestycyjny musi dopuszczać „nie kupować”. Wyniki zależą szczególnie od wykorzystania depozytu, ceny konkretnej sztuki i profilu nadwyżki.

Przykład bazowy PV10 kWp bez magazynu, dom5000 kWh/rok, S21 Pro234T: **583 h zasilania/rok**, **2064 kWh** łącznie z założoną dodatkową wentylacją, **0,00218164 BTC** (ok.218164 sat), wartość ok.690 PLN. Utracony wykorzystany depozyt ok.464 PLN, przykładowyOPEX370 PLN: **−144 PLN/rok przed odzyskaniem inwestycji**. To wynik jawnych założeń badania, nie pomiar klienta. Przy zastosowanych cenach urządzeń i budżetach infrastruktury żadna z54symulacji nie odzyskała CAPEX w analizowanym okresie. Nie dowodzi to braku opłacalności wszystkich innych cen, profili i sposobów wykorzystania depozytu.

## Dokumenty

- [Audyt repozytorium i produkcji](01_AUDYT.md).
- [Urządzenia, oferty i rankingi](02_ASIC_I_OFERTY.md).
- [Model ekonomiczny, EMS, dane i koszty utrzymania](03_MODEL_I_ARCHITEKTURA.md).
- [Reprodukowalne przykłady: sześć instalacji × trzy ASIC × trzy scenariusze](04_SYMULACJE.md).
- [Rejestr źródeł i ograniczeń](05_ZRODLA.md).
- `evidence/`: odczyty API, metadane ofert, profil PVGIS, manifest źródeł.
- `research/calculate.py`: obliczenia pomocnicze raportu, **nie silnik aplikacji etapu 2**.
- `research/results.json`: pełne wyniki liczbowe i parametry.

## Granice wiarygodności

Profil PV jest historyczną symulacją PVGIS, nie pomiarem klienta. Zużycie domu, budżet infrastruktury, przyszłe ceny, trudność i okres życia są założeniami. Symulacja nie stanowi oferty handlowej, audytu elektrycznego ani deklaracji opłacalności konkretnej instalacji. Brak pomiarów egzemplarza ASIC, stanowiskowych testów regulacji i zaakceptowanego cennika AMPOWER pozostaje jawny.

Badania internetowe i odczyty zakończono; potwierdzenie zapasów, warunków dostawy, seryjnego wariantu i końcowej faktury wymaga odpowiedzi sprzedawcy. Nie wysyłano zapytań do sprzedawców w imieniu użytkownika.

## Stan prac i następny krok

Gałąź `feat/pv-mining`, katalog `/Users/jb/Ampower Smart Home/ampower-pv-mining`, baza `0c6a56a`. Pozostałe katalogi robocze zachowano. Nie wykonano push, merge ani zmiany hostingu.

Rekomendacja do etapu 2: obecny model programistyczny **GPT-6.1 Sol, rozumowanie medium**; trudniejsze fragmenty bilansu i walidacji można rozpatrzyć z `high` po decyzji użytkownika. To rekomendacja organizacyjna, nie pomiar zużycia. Modelu nie przełączano. Oficjalne wskazówki dotyczące poziomów rozumowania: https://developers.openai.com/api/docs/guides/reasoning.

**Etap 2 wymaga wyraźnej zgody użytkownika.** Do decyzji: lokalny moduł `/pv-mining/`, zakres danych domyślnych i wariantów zakupowych, założenia symulacji oraz późniejszy kanał publikacji JSON. Docelowy hosting i produkcyjne API formularza wymagają osobnej decyzji przed wdrożeniem.
