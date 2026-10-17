# AMPOWER Smart Home & Energy — Etap 8A: audyt cennika usług

**Data analizy i sprawdzenia źródeł internetowych: 2026-10-11. Status: WEWNĘTRZNA REKOMENDACJA DO DECYZJI WŁAŚCICIELA. Żadna kwota w tym raporcie nie jest zatwierdzonym cennikiem, ofertą ani gwarancją rentowności.** PLN. Nie zmieniono kodu, cen, statusów zatwierdzenia ani konfiguratora. Nie wykonano push, merge, deploymentu, publikacji, płatnych uruchomień lub wysyłek do klientów.

## 1. Najważniejszy wynik audytu

W etapie 7 przygotowano 17 pozycji katalogu usług, ale **wszystkie mają `saleNetRange: null`, `hoursRange: null`, `approvalStatus: pending`, `vatRate: null`, `vatApproved: false`**. Nie istnieje aktualna zatwierdzona kwota sprzedaży żadnej z tych usług. Historyczne stawki zapisano wyłącznie w `historicalAssumption` i dokumentacji etapu 3. Ich potwierdzenie jako zawartości projektu nie oznacza zatwierdzenia biznesowego.

Rekomenduję do decyzji: 220 zł netto/r-g konfiguracji i 180 zł netto/r-g montażu; bazę nowego systemu 1320 zł netto; punkt 55 zł netto, z rabatem do 50 zł za kolejne powtarzalne punkty. Największy potencjał wyniku na godzinę mają uporządkowane wdrożenia HA, powtarzalne rozbudowy i sceny na znanych integracjach. Eksperymentalne integracje mogą zniwelować tę przewagę.

Przy modelowych kosztach własnych i przydziale kosztów działalności historyczne 180 zł/h konfiguracji oraz 150 zł/h montażu dają odpowiednio 28,33% i 25,00% marży po uwzględnionych kosztach. Są dodatnie, lecz nie osiągają proponowanego progu 30%. Szczególnie zagrożone są: przesyłka za historyczne 40 zł, bezlimitowy onboarding/serwis, złożoność rozliczana jednym ryczałtem i odsprzedaż materiałów z narzutem 15% bez pokrycia obsługi zakupów.

## 2. Dokumenty i ślad danych

| Źródło | Co wykorzystano |
| --- | --- |
| [Katalog etapu 7](../../backend/catalog.seed.json) | Dokładne 17 ID, nazwy, pola cen/statusów i wewnętrzne hipotezy kosztów. |
| [Raport etapu 7](RAPORT_KONCOWY.md) | Rozdzielenie cen historycznych, cen zatwierdzonych, prototypów i zależności. |
| [Historyczne kalkulacje etapu 7](PRZYKLADY.json) | Punkt porównania ekonomiki; nie użyto ich kwot jako aktualnych ofert. |
| [Logika wyceny etapu 3](../../../docs/ampower-smart/03_CENNIK_LOGIKA.md) | Godziny, zakresy, 180/150 zł sprzedaży, koszty 90/75 zł, km, narzut i rezerwa. |
| [Pakiety i opieka](../../../docs/ampower-smart/03_OFERTA_PAKIETY.md) | Minima, granice lokalnej/zdalnej realizacji i hipotezy abonamentowe 199/349 zł. |
| [BOM etapu 2](../../../docs/ampower-smart/02_BOM_CENY.md) | Archiwalny detaliczny punkt odniesienia sprzętu z 2026-10-10, nie faktury zakupowe. |
| [Macierz kompatybilności](../../../docs/ampower-smart/02_KOMPATYBILNOSC.md) i [research](../../../docs/ampower-smart/02_TECH_RESEARCH.md) | Funkcje dopuszczone dokumentacyjnie, warunki modeli i brak testów fizycznych. |
| [Model publiczny](../../smart-home-energy/pricing.js), [model wewnętrzny](../../backend/internal-calculator.js) | Jednostki, deduplikacja, rozdział kosztów i rzeczywiste ograniczenia prototypu. |
| [Architektura](ARCHITEKTURA.md), [instrukcja](INSTRUKCJA.md), [QA etapu 6](../ampower-smart/06_AUDYT_QA.md) | Raport jest dokumentem wewnętrznym poza listą plików publicznego buildu. Nie zmieniono działających kalkulatorów. |

Dokumenty etapów 2–3 znajdują się w nadrzędnym katalogu projektu `Ampower Smart Home/docs/ampower-smart`, a nie wewnątrz repozytorium. Powyższe linki odzwierciedlają lokalną strukturę. Nie kopiowano ich ani nie edytowano.

**Ważne rozbieżności do późniejszego wdrożenia, po decyzji właściciela:**

- Metadane `unit: job` są zbyt ogólne dla większości pozycji. Montaż wymaga sztuk, integracja instancji, diagnostyka godzin, dojazd km i czasu, przesyłka paczek.
- Obecny publiczny model rozlicza jedną ogólną cenę `integration` dla każdej instancji; nie rozróżnia jej czasochłonności. Nie da się odwzorować poniższej taryfy energii i HVAC samym wpisaniem jednej kwoty.
- Obecne `quantityDiscounts` dotyczą sprzętu. Rekomendowany rabat na konfigurację punktów wymaga osobnej reguły. Nie włączono go.
- `remote` jest obecnie dodawane do każdego wariantu zdalnego. Rekomendacja wymaga naliczania wyłącznie rzeczywistej dodatkowej pracy poza bazą.
- `materials` i `shipping` są dziś ryczałtowymi pozycjami zależnymi od doboru sprzętu. Rekomendowany koszt materiałów musi wynikać z BOM, a wysyłka z liczby paczek i kosztu logistycznego.
- `expansion` i `point` nie mogą zawierać tej samej pracy. Należy odjąć mapowanie już objęte zakresem rozbudowy.
- Pole `marginPercent` modelu wewnętrznego etapu 7 oznacza marżę po kosztach bezpośrednich, **przed** `allocatedOverheadNet`. Niniejsza główna tabela liczy marżę **po** przydziale kosztów działalności. Nie zmieniono nazw, wzorów ani progu w kodzie; potrzebna będzie świadoma decyzja o obu metrykach.

## 3. Aktualny research rynku

Źródła pierwotne: strony wykonawców. Wszystkie sprawdzono 2026-10-11. To ceny widoczne na stronach, nie otrzymane indywidualne oferty ani potwierdzenie dostępności terminu. Jeśli strona nie podaje daty cennika, oznaczono ją jako niepodaną. Nie kontaktowano się z firmami i nie wysłano formularzy.

| Firma / obszar | Publiczna cena i zakres | Netto/brutto / aktualność | Znaczenie dla AMPOWER |
| --- | --- | --- | --- |
| [71elektryk — Wrocław i okolice](https://71elektryk.pl/smart-home-zestawy/) | Start: od 5100 zł netto, centrala, 6 sekcji światła, 2 przyciski scen, 4 sceny i szkolenie. Dopłata za sekcję włączaną 320 zł netto. Rolety: od 1300 zł netto/3 okna, następne +340 zł netto. Ogrzewanie: od 1400 zł netto/4 głowice, następna +280 zł netto. | Wykonawca podaje zaokrąglone brutto przy 8%: odpowiednio 5510, 1400 i 1510 zł; obejmuje materiał, montaż, konfigurację. Data taryfy niepodana. | Regionalny punkt odniesienia dla pakietów; nie cena samej konfiguracji HA ani samej robocizny Shelly. Nie kopiować kwalifikacji VAT. |
| [LANICAM — Wrocław](https://lanicam.pl/oferta/smart-home/) | HA/Fibaro/KNX/Grenton, światła, rolety, ogrzewanie, klimatyzacja, alarm i kamery. **Brak publicznej kwoty na sprawdzonej stronie.** | Indywidualna wycena; brak daty cennika. | Regionalna konkurencja zakresowa; nie można wyliczyć stawki godzinowej. |
| [ELEKTROMATIK — Głogów](https://elektromatik.net.pl/kontakt/) | Inteligentne instalacje, elektryka, PV, pompy ciepła i klimatyzacja. **Brak publicznej ceny integracji HA na sprawdzonej stronie.** | Potwierdzony lokalny obszar; brak taryfy. Podstrona usług zwróciła timeout, wykorzystano stronę kontaktową. | Nie podstawiać ceny montażu PV/pompy jako ceny integracji Smart Home. |
| [ZSA — Głogów, Polkowice i region](https://zsaalarmy.pl/) | Alarmy, CCTV, kontrola dostępu, montaż/konserwacja/serwis. **Brak publicznej ceny integracji HA.** | Ochrona/monitoring alarmów 24/7 to odmienna usługa. | Porównanie lokalnego serwisu zabezpieczeń; brak podstaw do wyceny HA lub deklaracji opieki 24/7. |
| [Flux Elektryka — Wrocław/Kiełczów](https://fluxelektryka.pl/instalacje-niskonapieciowe) | Rolety 10 okien: 4000–8000 zł (silniki i sterowniki); opcjonalne zmiany/utrzymanie: 200–400 zł/h. | Netto/brutto nieokreślone na tej stronie; data taryfy niepodana. | Widełki dotyczą innego koszyka. Wynik wyszukiwarki pokazywał także HA 3000–8000 zł; tej pozycji nie było już w ponownie otwartej stronie, dlatego **nie uznano jej za aktualną ofertę**. |
| [MeeTech — Bydgoszcz](https://meetech.pl/smart-home) | Konsultacja/audyt od 200 zł; automatyzacja od 150 zł; dashboard od 400 zł. | Brak oznaczenia VAT, godzin i daty taryfy. | Ogólnopolski punkt porównania dla analizy i scen; ceny „od”, bez gwarancji tego samego zakresu. |
| [Homlly — rynek ponadregionalny](https://homlly.pl/cennik/) | START 8–18 tys., KOMFORT 18–40 tys., PREMIUM 45–90 tys. zł; sprzęt, montaż i konfiguracja HA. Audyt DIY od 500 zł; naprawa 160 zł/h; opieka 150–300 zł/mies. | Nagłówek strony: ceny netto, orientacyjne; brak daty taryfy. Przy usługach dodatkowych kwalifikację VAT potwierdzić w ofercie. | Pakiety różnią się zakresem od przykładów AMPOWER; PREMIUM obejmuje projekt nowego domu. Nie porównywać wyłącznie nazwy pakietu. |
| [HA Expert — polskojęzyczny serwis zdalny, siedziba w Danii](https://ha-expert.com/pl/) | Doradztwo pisemne od 60 zł, naprawy od 100 zł, opieka 490 zł/rok; większy projekt indywidualnie. | VAT i limit godzin nieokreślone w cenniku strony; data niepodana. | Nie lokalny montaż. 490/12 ≈40,83 zł/mies. jest tylko przeliczeniem opłaty rocznej, nie ofertą miesiąc po miesiącu ani dowodem porównywalnej puli pracy. |

**Luki:** nie znaleziono wiarygodnego publicznego cennika pojedynczego montażu/konfiguracji Shelly ani samodzielnej integracji pomp ciepła, PV czy magazynu z HA w Głogowie/Polkowicach. Regionalne strony potwierdzają zakres usług, ale nie ich stawki. Dostępne strony o pełnych magazynach energii w Polkowicach dotyczą zakupu BESS i montażu, a nie samej integracji HA — nie użyto ich do kalibracji usług. Ogłoszenie OLX dla HA w Głogowie nie zwróciło użytecznej bieżącej treści, więc nie przypisano mu ceny. Agregatorów „średnich cen w mieście” nie uznano za oferty konkretnych wykonawców.

**Wniosek analityczny:** 220 zł netto/h jest propozycją wynikającą z kosztów AMPOWER, nie ustaloną medianą rynku. Jest wyższe od 160 zł/h publikowanych przez Homlly i nie daje się bezpośrednio porównać z 200–400 zł/h Flux bez informacji o VAT i zakresie. Region ma zbyt mało porównywalnych danych, aby twierdzić, że rekomendowana stawka jest „potwierdzoną ceną rynkową”. Walidacja: wyniki własnych 3–5 płatnych wdrożeń oraz zaakceptowane/odrzucone oferty o porównywalnym koszyku.

## 4. Model kosztów i rentowności

Wszystkie poniższe parametry są **szacunkowe**. Koszty 90/75/90 zł i auto 0,90 zł/km pochodzą z historycznej polityki AMPOWER; nie sprawdzono ich na księgach. Przydział 30 zł/r-g jest nową hipotezą analityczną: np. 2400 zł miesięcznych kosztów działalności i pozyskania / 80 godzin produktywnych. To nie dodatkowe wynagrodzenie właściciela. Jego wynagrodzenie i obciążenia mieszczą się w koszcie godziny i muszą być zweryfikowane.

| Parametr | Model |
| --- | ---: |
| Własna praca integratora / konfiguracja / podróż | 90 zł/r-g |
| Własna praca elektryka | 75 zł/r-g |
| Rezerwa poprawek wdrożenia | 10% kosztu pracy; bez ponownego mnożenia ceny sprzedaży |
| Przydział kosztów działalności | 30 zł za godzinę aktywnej realizacji, także podróży |
| Efektywny koszt godziny IT/podróży | 90 + 9 + 30 = **129 zł** |
| Efektywny koszt godziny montażu | 75 + 7,50 + 30 = **112,50 zł** |
| Auto | 0,90 zł/km, trasa w obie strony; bez fikcyjnej stawki „za jedną stronę” |
| Cel marży po wszystkich uwzględnionych kosztach | **minimum 30% dla całego wdrożenia** |

`L = 90 × hIT + 75 × hE + 90 × hT`

`Cbezp = zakup sprzętu + materiały + L + 0,90 × km + podwykonawcy/logistyka + 10% × L`

`K = 30 × (hIT + hE + hT)`

`C = Cbezp + K`

`Marża pokrycia = Pnetto − Cbezp`; `m_pokrycia = (Pnetto − Cbezp) / Pnetto`.

`Wynik po uwzględnionych kosztach Z = Pnetto − C`; `m = Z/Pnetto`; `narzut względem C = Z/C`.

`Próg zera = C`; `minimalna cena dla celu 30% = C/0,70`, zaokrąglona w górę. Cena powyżej C jest dodatnia w modelu, lecz dopiero C/0,70 spełnia proponowany cel. Z nie jest zyskiem netto firmy: nie odjęto podatku dochodowego, niepotwierdzonych kosztów finansowania i kosztów spoza modelu. Nie dodawać drugi raz ogólnego ryczałtu 500/1000/1800 zł ze starych przykładów, gdy ten sam zakres kosztów pokrywa K.

Narzut 20% na zakup oznacza marżę 16,67%, a nie 20%. Narzut 15% oznacza 13,04%. Cel 30% marży oznacza narzut **42,86% względem tej samej podstawy kosztów**. Osobno kontrolować towar, usługi i całą realizację.

### VAT

Tabela stosuje **23% wyłącznie jako spójne założenie kalkulacyjne** dla czynnego podatnika VAT z prawem odliczenia zakupów. [Ministerstwo Finansów — stawki i limity](https://www.podatki.gov.pl/podatki-firmowe/vat/stawki-i-limity), sprawdzono 2026-10-11, wskazuje podstawowe 23% i obniżone 8% m.in. dla określonych prac w budownictwie objętym społecznym programem mieszkaniowym. Nie potwierdza to 8% dla każdej usługi HA. Status AMPOWER, prawo odliczenia i charakter świadczenia wymagają decyzji z księgowością. Nie przenosić 8% z cennika konkurenta. Przy zwolnieniu VAT koszt zakupów uwzględnia nieodliczany podatek, a klient nie płaci automatycznie „netto +23%”.

Wyliczenia brutto są zaokrąglone do groszy; nie są aktywnymi stawkami VAT w katalogu. Przykłady sumują VAT od przedstawionych agregatów kosztorysu. Przy późniejszym podziale na osobne sztuki i linie faktury może wystąpić różnica kilku groszy wymagająca przeliczenia.

## 5. Pełna tabela 17 usług do decyzji

D = można przedłożyć do zatwierdzenia dla określonego standardowego zakresu. W = dodatkowa weryfikacja czasu/modelu/kosztu. N = ryzyko nieopłacalności w opisanych dalej warunkach. P = duży potencjał wyniku, jeśli zakres jest powtarzalny. **Każda rekomendacja pozostaje ceną szacunkową; D nie oznacza zatwierdzenia ani potwierdzenia ceny przez rynek.**


| Usługa | Obecna cena netto³ | Rekomendowana cena netto | Cena brutto (23%) | Czas pracy | Koszt własny C⁴ | Marża %⁴ | Status |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Konfiguracja centrali | —; H: 1080 / wdrożenie | 1320 / wdrożenie | 1 623,60 | 6 h | 774,00 | 41,36% | D · P |
| Rozbudowa istniejącego HA | —; H: 180/h; brak sumy | 440–880 / zakres | 541,20–1 082,40 | 2–4 h | 258,00–516,00 | 41,36% | W · P |
| Integracja systemu | —; H: 180/h; brak sumy | 220–1760 / instancję | 270,60–2 164,80 | 1–8 h | 129,00–1 032,00 | 41,36% | W · P |
| Konfiguracja punktu | —; H: 45 / punkt | 55 / punkt¹ | 67,65 | 0,25 h | 32,25 | 41,36% | D |
| Montaż obwodu światła | —; H: 112,50 / obwód | 135 / obwód | 166,05 | 0,75 h | 84,38 | 37,50% | D |
| Montaż i kalibracja rolety | —; H: 150 / napęd | 180 / napęd | 221,40 | 1 h | 112,50 | 37,50% | W |
| Montaż licznika | —; H: 225 / licznik | 270 / licznik | 332,10 | 1,5 h | 168,75 | 37,50% | W |
| Automatyzacja prosta | —; H: 90 / scenę | 110 / scenę | 135,30 | 0,5 h | 64,50 | 41,36% | D · P |
| Automatyzacja zaawansowana | —; H: 180/h; 270–540² | 330–660 / scenę | 405,90–811,80 | 1,5–3 h | 193,50–387,00 | 41,36% | W · P |
| Diagnostyka | —; H: 180/h; brak sumy | 220 / pierwszą h | 270,60 | 1 h | 129,00 | 41,36% | D |
| Dodatkowe uruchomienie zdalne | —; H: 180/h; brak sumy | 220–660 / sesję | 270,60–811,80 | 1–3 h | 129,00–387,00 | 41,36% | W · N |
| Wsparcie podstawowe jednorazowe | —; H: 180/h; brak sumy | 220 / 1 h | 270,60 | 1 h | 129,00 | 41,36% | D |
| Wsparcie rozszerzone jednorazowe | —; H: 180/h; brak sumy | 440 / 2 h | 541,20 | 2 h | 258,00 | 41,36% | W |
| Dodatkowa złożona integracja | —; H: 180/h; brak sumy | 440–1760 / zakres | 541,20–2 164,80 | 2–8 h | 258,00–1 032,00 | 41,36% | W · N |
| Dojazd | —; H: 1,50/km + 150/h² | 2/km + 190/h | 2,46/km + 233,70/h | t h w obie strony | 0,90k + 129t | 32,11–55,00% | W |
| Materiały dodatkowe | —; H: M × 1,15² | M × 1,20 / komplet | M × 1,476 | W bazie; nadwyżka osobno | M; nadwyżka pracy osobno | 16,67%⁵ | W · N |
| Wysyłka i opakowanie | —; H: 40/paczka² | 85 / paczkę⁶ | 104,55 | 0,25 h | 56,25⁶ | 33,82% | W · N |


¹ Punkt: 55 zł dla pierwszych 10 punktów, 50 zł od 11. punktu, przy powtarzalnym gotowym zakresie; brutto rabatowe 61,50 zł, koszt 32,25 zł, wynik 17,75 zł i marża 35,50%. Cena 55 zł dotyczy także pierwszego punktu po przygotowaniu integracji. Pierwsze uruchomienie nowej rodziny urządzeń zawiera dodatkowo jednorazową integrację opisaną w rozdziale 7.

² Wyliczenie z dokumentu historycznego; `historicalAssumption` sam nie zawiera tej kwoty/zakresu. Dokument etapu 3 zakładał 40 zł netto za przesyłkę w przykładzie zdalnym, nie stały zatwierdzony cennik logistyczny.

³ „—” oznacza brak aktywnej zapisanej ceny (`null`). H oznacza wyłącznie historyczną hipotezę. Wszystkie kwoty H są niezatwierdzone. Przedziały i cena za godzinę nie są tym samym co stała cena całej usługi.

⁴ C to pełny modelowy koszt: własna robocizna, rezerwa i przydział kosztów działalności; szczegóły poniżej. Zakupy/dodatkowe licencje/HVAC nie są zawarte w C usług godzinowych, o ile wyraźnie nie podano ich w wierszu. Marża dotyczy tylko opisanego zakresu bez tych dodatków. To różni się od marży przed kosztami stałymi w prototypie etapu 7.

⁵ M = rzeczywisty koszt zakupu netto materiałów dodatkowych. Dla M=100 zł rekomendacja wynosi 120 zł netto/147,60 zł brutto, C=100 zł i Z=20 zł. Prace zakupowe ponad bazę osobno, po uzgodnieniu. 16,67% jest poniżej 30%; dopuszczalne jedynie przy rentownym całym wdrożeniu, nie jako samodzielna usługa z tym samym celem marży.

⁶ Hipoteza paczki: przewoźnik 18 zł netto + opakowanie 6 zł + 0,25 h pracy ×129 zł =56,25 zł. To budżet, **nie sprawdzona oferta kuriera**. Inne gabaryty/ubezpieczenie/liczba paczek wymagają realnej wyceny. Przy 85 zł koszty kuriera i opakowania nie mogą przekroczyć 27,25 zł, aby zachować 30% po koszcie pracy.

## 6. Szczegółowe granice, własna praca, wynik i minimum każdej usługi

Poniżej godziny oznaczają aktywną pracę jednej osoby, nie czas kalendarzowy obserwacji. „Minimum 30%” to próg dla tego zakresu przy podanych kosztach, przed zakupami/dojazdem niewliczonymi w usługę. Progi zera są równe C w tabeli głównej.


| ID / jednostka i zakres | Własna robocizna L netto | Rezerwa + przydział kosztów | Wynik Z netto | Minimum 30% netto | Koszty dodatkowe / granica |
| --- | --- | --- | --- | --- | --- |
| `base` — Jedno wdrożenie: kwalifikacja znanego zestawu 1 h; host, konta i panel 2 h; backup i próba odtworzenia 1,5 h; dokumentacja/szkolenie 1,5 h. | 540,00 | 234,00 | 546,00 | 1 105,72 | Sprzęt, miejsce kopii/licencje, montaż i dojazd osobno. Podstawowe zamówienie/odbiór sprzętu w przygotowaniu bazy; dodatkowe zakupy tylko rzeczywiste godziny. |
| `expansion` — Zakres na istniejącym sprawnym HA: 2–4 h, w tym 1 h preflight/kopia i 1–3 h uzgodnionych zmian wraz z testami. | 180,00–360,00 | 78,00–156,00 | 182,00–364,00 | 368,58–737,15 | Nowy sprzęt, instalacja, nowa integracja/scena tylko jeśli poza uzgodnionym zakresem; mapowania wykonanego w rozbudowie nie dodawać jako point. |
| `integration` — Za jedną instancję połączenia: znana lokalna 1–2 h; HVAC 2–4 h; odczyt energii 4–8 h. | 90,00–720,00 | 39,00–312,00 | 91,00–728,00 | 184,29–1 474,29 | Licencje/interfejs, specjalista HVAC/PV i nietypowa sieć poza limitem. Nie mnożyć opłat za markę/protokół/każdy sensor tej samej instancji. |
| `point` — Za punkt: nazwa, strefa, przypisanie panelu, komunikacja i kontrola stanu; 0,25 h. | 22,50 | 9,75 | 22,75 | 46,08 | Gotowe urządzenie. Złożony punkt 0,5–1 h po liście prac, 110–220 zł; nie traktować jego encji jako kolejnych punktów. |
| `install-light` — Za gotowy obwód: połączenie modułu, kontrola/pomiary lokalne, manual i stan po restarcie; 0,75 h. | 56,25 | 28,13 | 50,62 | 120,55 | Moduł, akcesoria, dojazd i przebudowa puszek/przewodów osobno. Bez bruzdowania i całego przeglądu instalacji. |
| `install-blind` — Za zakwalifikowany napęd: połączenie, kierunki, blokada, kalibracja i manual; 1 h. | 75,00 | 37,50 | 67,50 | 160,72 | Moduł/silnik, naprawa napędu, puszka, dojazd osobno. Nie ponownie naliczać kalibracji w mapowaniu/scenie. |
| `install-meter` — Za licznik z CT w dostępnej rozdzielnicy: połączenie, fazy/znaki i porównanie wskazań; 1,5 h. | 112,50 | 56,25 | 101,25 | 241,08 | Licznik/CT, zabezpieczenia i rozbudowa rozdzielnicy osobno. HA mapowanie oddzielne; nie ponawiać tej samej kontroli CT w integracji. |
| `simple` — Za jeden harmonogram/ręczną scenę jednej grupy z testem i zapisem zakresu; 0,5 h. | 45,00 | 19,50 | 45,50 | 92,15 | Nie naliczać za każde światło w tej samej scenie. Nie obejmuje niestandardowej logiki priorytetów. |
| `advanced` — Za scenariusz: warunki, priorytety/konflikty, zachowanie awaryjne i test; 1,5–3 h. | 135,00–270,00 | 58,50–117,00 | 136,50–273,00 | 276,43–552,86 | Scenariusz energetyczny 4–8 h =880–1760 zł netto (1082,40–2164,80 brutto), C516–1032, Z364–728; min 30% 737,15–1474,29. Wyłącznie zatwierdzony zakres, bez eksperymentalnego zapisu BMS. |
| `diagnostics` — Pierwsza godzina płatnej analizy z wynikiem i następnym krokiem; dalej 220 zł/h, w blokach 0,25 h. | 90,00 | 39,00 | 91,00 | 184,29 | Brak gwarancji naprawy w 1 h. Lokalny audyt 3–6 h: 660–1320 zł netto + dojazd; naprawa/zakupy osobno. Wykorzystaną kwalifikację odjąć z późniejszej bazy. |
| `remote` — Dodatkowa sesja poza bazą: przygotowanie bezpiecznego dostępu/parowania z osobą na miejscu; 1–3 h. | 90,00–270,00 | 39,00–117,00 | 91,00–273,00 | 184,29–552,86 | Może wynieść 0, jeśli wszystko pokrywa baza. Zewnętrzny dostęp/licencja i wysyłka osobno; bez elektrycznego montażu na odległość. |
| `support-basic` — Jednorazowa pula do 1 h na uzgodnione wsparcie/zmianę; wynik i zamknięcie zgłoszenia. | 90,00 | 39,00 | 91,00 | 184,29 | Nie miesięczny abonament. Nie płatne ponownie szkolenie bazy ani poprawka własnej wady; dodatkowe godziny dopiero po zgodzie. |
| `support-extended` — Jednorazowa pula do 2 h, np. przegląd kopii i uzgodniona aktualizacja z testem. | 180,00 | 78,00 | 182,00 | 368,58 | Bez gwarancji pełnego odtworzenia dowolnej instalacji w 2 h. Części, wyjazd, licencje i nowe funkcje poza pulą. |
| `complex` — Dodatkowe 2–8 h o opisanych zadaniach: naprawa sieci, nieobjęta wcześniej koordynacja lub dodatkowe testy. | 180,00–720,00 | 78,00–312,00 | 182,00–728,00 | 368,58–1 474,29 | Wyłącznie nadwyżka poza integration/advanced. Nowy komponent/inżynieria prototypu indywidualnie z limitem i kryterium zakończenia, także gdy wynik negatywny. |
| `travel` — km samochodu i r-g osoby w trasie, za całą umówioną wizytę | 90t | 39t; auto 0,90k oddzielnie | 1,10k + 61t | (0,90k +129t)/0,70 | Parking/opłaty faktyczne; przy drugiej osobie doliczyć jej czas, lecz nie drugi raz km tego samego auta. |
| `materials` — komplet rzeczywistych akcesoriów z BOM | 0 dodatkowo, jeśli zakup pokryty bazą | 0 dodatkowo | 0,20M | M/0,70 | Próg zera M; rekomendacja 1,20M celowo poniżej samodzielnego progu 30%, kontrolować całość. Nadwyżka godzin zakupu osobno. |
| `shipping` — jedna standardowa paczka | 22,50 | 9,75; kurier +opakowanie 24 oddzielnie | 28,75 | 80,36 | Próg zera 56,25; aktualna oferta przewoźnika wymagana. Przy 0,5 h obsługi C=88,50 i cena 85 daje stratę 3,50. |

### Czas i ryzyko

Czasy są normami do pomiaru, nie potwierdzonymi wynikami instalacji. Szczególnie rolety, rozdzielnice i HVAC wymagają oględzin. Przykładowo przy cenie 135 zł za światło i pełnym koszcie 112,50/h próg 30% pozwala na **0,84 h**, czyli ok.50 min. Robocze 45 min pozostawia mały bufor. Montaż rolety 180 zł pozwala na 1,12 h; licznik 270 zł na 1,68 h. Konfiguracja 220 zł/h zachowuje 30% tylko przy C≤154 zł/h; punkt 55 zł przy czasie≤0,298 h (ok.18 min), rabatowy 50 zł przy≤0,271 h (ok.16 min). Wynik zależy od mierzonego czasu, nie samego podpisania taryfy.

## 7. Zasady naliczania bez podwójnej pracy

1. **Nowy system:** baza 1320 zł netto raz na centralę. Sprzęt osobno. Nie naliczać kolejnej bazy za radio, mostek, drugą markę ani nazwę PREMIUM. Jeśli płatny audyt wykonał kwalifikację 1 h w bazie, pomniejszyć bazę o 220 zł za tę samą pracę.
2. **Posiadany sprawny HA:** rozbudowa 440–880 zł obejmuje opisane czynności; brak drugiej pełnej bazy. Gdy mapowanie 2 punktów zostało wykonane w jej 2 h, nie dopisywać 2×point. Migracja nowego hosta wymaga osobnego zakresu z odjęciem powtarzających się prac.
3. **Pierwsze urządzenie nowej rodziny:** np. znany Shelly: integracja 1 h 220 zł + pierwszy punkt 55 zł =275 zł netto/338,25 brutto za konfigurację. Kolejny Shelly w tej samej zakwalifikowanej instancji 55 zł; od 11. punktu 50 zł. Integracja ZHA2 h 440 zł + pierwszy sensor 55 =495 netto/608,85 brutto; kolejne sensory według punktów. To koszt pierwszego uruchomienia interfejsu, a nie dodatkowy „podatek za pierwsze urządzenie”. Na już działającej integracji pierwszy nowy punkt też 55 zł. Baza/montaż osobno, jeśli potrzebne.
4. **Rabaty:** pierwszych 10 punktów 55 zł, wyłącznie punkty 11+ po 50 zł. Rabat progresywny nie obniża wstecz całego koszyka. Bez rabatu na zmienne koszty, nieznane integracje czy audyt. Rabat sprzętowy tylko na podstawie faktycznej obniżki ceny zakupu i marży całego zlecenia. Nie rabatować wspólnej pracy już odjętej w deduplikacji.
5. **Wiele marek:** dodatkowa cena wynika z liczby odrębnych instancji i zmierzonych godzin, nie liczby logotypów. Shelly światła +licznik w tej samej uzgodnionej instancji: jedna opłata startowa. Fronius PV +odczyt baterii: jedna integracja 4 h, dwa punkty urządzeń; nie dodatkowa integracja baterii ani cena za każdą encję.
6. **Zdalnie:** ta sama stawka 220 zł/h; oszczędność wynika z braku dojazdu i montażu, nie darmowej pracy właściciela. `remote` tylko gdy zadania wykraczają poza bazę. Klient/elektryk na miejscu wcześniej wykonuje i odbiera montaż. Wysyłka i licencje jawnie osobno.
7. **Lokalnie:** montaż 180 zł/r-g, dojazd 2 zł/km +190 zł/h czasu podróży. Jedna wspólna wizyta to jeden przejazd. Promień „gratis” tylko przy wskazanym koszcie już wliczonym w ofertę. Przykład 60 km i 1,5 h:405 zł netto/498,15 brutto; koszt 247,50, wynik 157,50 i marża 38,89%.
8. **Minima:** nowa baza 1320 zł; samodzielna sesja zdalna minimum 220 zł (1 h), rozbudowa 440 zł za wskazane 2 h. Mała lokalna wizyta: proponowane minimum **550 zł netto koszyka usług**, dojazd/sprzęt osobno. Dopełnienie wyłącznie różnicy do minimum, nie dodatkowe 550 ponad policzone usługi. Zakres i minimalne rozliczenie wskazać przed realizacją.
9. **Pełne wdrożenie:** historyczne minima 4400 netto lokalnie i 4000 zdalnie pozostają tylko dolnymi hipotezami. Proponowany warunek: `P = max(suma pozycji, C/0,70, minimum uzgodnione dla realizacji)`. Minima nie są cenami pakietów ani gwarancją, że każdy dom zmieści się w kwocie. Nowy START poniżej wymaga co najmniej 5119,30 netto do celu 30%, więc samo 4400 byłoby niewystarczające.
10. **Sceny i złożoność:** sceny policzyć za komplet logiki, nie za każdy sterowany odbiornik. Test działania API w integration, test mapowania w point, test sceny w simple/advanced. `complex` tylko za dodatkowe nazwane zadania. Bez automatycznego procentowego mnożnika za tę samą trudność.
11. **Własne poprawki i wsparcie:** oczekiwane poprawki uzgodnionego wdrożenia w rezerwie; nowych funkcji nie nazywać naprawą gwarancyjną. Nie sprzedawać klientowi ponownie poprawienia własnego błędu jako support. Wsparcie jednorazowe i opieka miesięczna to odrębne produkty.
12. **Korekty właściciela:** każdy rabat lub dodatkowy koszt wymaga ponownego C, Z i obu marż. Nie finansować stratnego wdrożenia hipotetycznym przyszłym abonamentem. Nie zwiększać ceny już wykonanego zakresu jednostronnie z powodu przekroczonej normy czasu.

## 8. Opcjonalna opieka — osobna propozycja, nie część 17 usług

`support-basic` i `support-extended` są jednorazowe. W katalogu abonamenty pozostają wyłączone. Historyczne 199/349 zł/mies. dawały przy pełnym wykorzystaniu puli 145/255 zł kosztów **przed ogólnymi kosztami działalności**, czyli 27,14/26,93% marży. Nowy model nie może traktować ich jako gotowych abonamentów.

| Propozycja | Podstawowa | Rozszerzona |
| --- | ---: | ---: |
| Cena netto/mies. do decyzji | 259,00 | 459,00 |
| Brutto przy 23% | 318,57 | 564,57 |
| Łączna pula pracy, także przegląd/aktualizacja | 1 h | 2 h |
| Własna praca przy pełnej puli | 90,00 | 180,00 |
| Przydział kosztów działalności | 30,00 | 60,00 |
| Narzędzia/kopie — hipoteza, nie zakupiona usługa | 20,00 | 20,00 |
| Administracja poza pulą techniczną | 15,00 | 20,00 |
| Rezerwa incydentów | 20,00 | 35,00 |
| C przy pełnej puli | **175,00** | **315,00** |
| Z / marża | **84,00 /32,43%** | **144,00 /31,37%** |
| Minimalna cena dla 30% | 250,00 | 450,00 |

Rezerwa incydentów zastępuje tu 10% rezerwy wdrożeniowej — nie sumowano obu dla tego samego ryzyka. Koszt 15/20 zł dotyczy dodatkowej obsługi konkretnej umowy, której nie zawiera 30 zł ogólnych kosztów działalności. Przy rozliczeniu rzeczywistych ksiąg skorygować nakładające się zakresy.

Brak obsługi 24/7 i gwarancji czasu naprawy. Limit obejmuje wszystkie planowe czynności i zgłoszenia, bez podwójnej puli. Wyjazdy, sprzęt i nowe projekty osobno. Test odtworzenia rozliczać w tej samej puli lub osobnym zleceniu. Reakcja wyłącznie w potwierdzonych godzinach obsługi; terminy i zastępstwo wymagają decyzji właściciela. Dla 20 rozszerzonych umów rezerwować co najmniej 40 h technicznych miesięcznie plus administrację i incydenty. Po wykorzystaniu rezerwy koszty mogą wzrosnąć.

Ceny przewyższają część publicznych ofert opieki, ale ich zakresy/limity nie są porównywalne. Najpierw pilotaż na małej liczbie znanych instalacji; nie uruchamiać abonamentu w konfiguratorze na podstawie tego raportu.

## 9. Przykłady START / STANDARD / PREMIUM

### Status techniczny i cenowy

To **przykłady analityczne, warunkowe**, nie gotowe oferty. W poprzednich etapach potwierdzono dokumentację integracji; nie przeprowadzono testów fizycznych instalacji AMPOWER. Użyto wyłącznie funkcji mających udokumentowaną ścieżkę. Każde rzeczywiste urządzenie wymaga potwierdzenia modelu/firmware, dostępności funkcji i odbioru. Żaden przykład nie deklaruje automatycznego sterowania magazynem ani EV.

- Światła: Shelly 1 PM Mini Gen 3, lokalna integracja [HA Shelly](https://www.home-assistant.io/integrations/shelly/); właściwe obciążenia, przewody i puszki po kwalifikacji.
- Sensory: SNZB-02P i ZBDongle-E przez ZHA, zgodnie z [macierzą etapu 2](../../../docs/ampower-smart/02_KOMPATYBILNOSC.md). Zakres temperatura/wilgotność, nie funkcja zabezpieczenia.
- Rolety STANDARD/PREMIUM: **już działająca Somfy TaHoma Switch i kompatybilne napędyio dostępne lokalnie**, [HA Overkiz](https://www.home-assistant.io/integrations/overkiz/). Nie zakładać feedbacku RTS. Istniejące napędy są sparowane i odebrane; brak zakupu nowych modułów i elektrycznego montażu rolet.
- Ogrzewanie i chłodzenie: **istniejąca jednostka Daikin z adapterem BRP069B41/B45**, zakres [HA Daikin](https://www.home-assistant.io/integrations/daikin/) obejmuje trybheat/cool i nastawy. STANDARD nie zawiera sterowania podłogówką, kotłem lub dowolną pompą ciepła. Jeśli klient potrzebuje takiego ogrzewania, wymaga ono osobnej kwalifikacji i wyceny — nie ukryto go w przykładowej cenie.
- Energia PREMIUM: istniejący **FroniusGen 24 z aktywnym Solar API i kompatybilnym magazynem udostępniającym dane**; [HA Fronius](https://www.home-assistant.io/integrations/fronius/) dokumentuje odczyt PV, przepływów i danychstorage. API jest tylko do odczytu. Dostępne encje baterii muszą zostać potwierdzone w danej instalacji. Modbus/zapis nastaw i sterowanie EMS/BMS wyłączone.

Powyższe oficjalne strony HA ponownie sprawdzono 2026-10-11. Fronius dokumentuje też opcjonalne sterowanie przezModbus, lecz istnienie funkcji w dokumentacji nie potwierdza jej dopuszczenia w konkretnym domu; **nie wliczono go**.

Sprzęt: użyto archiwalnych cen BOM z 2026-10-10 jako jawnych założeń symulacji kosztu. Nie odświeżono oferty sprzętu do zakupów; nie potwierdzono cen zakupu netto na fakturze. CenyP01/P03/P04/P06/P07 pozostają niezatwierdzone; P01/P06 miały braki dostępności. UPS439 zł to historyczna cena poza promocją 389 zł, nie gwarancja dostępności. Po zmianie cen/dostępności przeliczyć przykład lub zakwalifikować zamiennik.

### BOM — ilości i koszt sprzętu

| Sprzęt; archiwalna cena brutto/szt. | START | STANDARD | PREMIUM |
| --- | ---: | ---: | ---: |
| P01 Green 999,00 | 1 | 1 | 1 |
| P03 ZBDongle-E89,90 | 1 | 1 | 1 |
| P04 Shelly 1 PM Mini Gen 3 64,90 | 3 | 8 | 12 |
| P06 SONOFFSNZB-02P49,90 | 2 | 4 | 6 |
| P07 Shelly Pro 3 EM120A522,98 | 0 | 1 | 1 |
| P10 UPS439,00 (bez promocji) | 1 | 1 | 1 |
| **Suma archiwalnego detalicznego brutto** | **1822,40** | **2769,68** | **3129,08** |
| **Model zakupu netto przy odliczeniu 23%** | **1481,63** | **2251,77** | **2543,97** |

Router/LAN, miejsce kopii poza hostem i pozostałe gotowe instalacje już istnieją. Sprzęt klienta: STANDARDTaHoma+4 rolety i 1 Daikin; PREMIUMTaHoma+8 rolet,2 Daikin oraz gotowe PV/magazyn Fronius. Ich koszt zakupowy w tej transakcji AMPOWER wynosi 0, ponieważ nie są dostarczane. **Przykład PREMIUM nie obejmuje zakupu lub montażu PV, baterii ani klimatyzatorów.** Brak istniejącej infrastruktury oznacza dodatkowy koszt i nowy BOM, nie ten sam pakiet.

### Zakres pracy — jawne godziny i brak podwójnych opłat

| Składnik | START | STANDARD | PREMIUM |
| --- | --- | --- | --- |
| Baza | 6 h,1320 | 6 h,1320 | 6 h,1320 |
| Integracje | Shelly 1 h +ZHA2 h =3 h,660 | Shelly 1 +ZHA2 +Somfy 1,5 +Daikin 2 =6,5 h,1430 | Shelly 1 +ZHA2 +Somfy 1,5 +2 instancje Daikin po 2 +Fronius 4 =12,5 h,2750 |
| Punkty | 5;1,25 h;275 | 18;4,50 h;950 | 31;7,75 h;1600 |
| Sceny proste | 2 ×0,5 h;220 | 4 ×0,5 h;440 | 6 ×0,5 h;660 |
| Sceny zaawansowane | 0 | 2 ×2 h;880 | 4 ×2,5 h;2200 |
| Łączna konfiguracja | **11,25 h** | **23,00 h** | **39,25 h** |
| Montaż świateł/licznika | 3×0,75 =2,25 h | 8×0,75 +1,5 =7,50 h | 12×0,75 +1,5 =10,50 h |
| Podróż — wszystkie wizyty łącznie | 1,5 h /60 km | 2 h /80 km | 3 h /120 km |
| **Łącznie r-g** | **15,00** | **32,50** | **52,75** |

Punkty STANDARD:8 świateł +4 rolety +4 sensory +1 HVAC +1licznik =18. Punkty PREMIUM:12 świateł +8 rolet +6 sensorów +2 HVAC +1licznik +1 PV +1magazyn =31. Jeden HVAC obsługuje grzanie i chłodzenie; nie liczono go dwa razy. Fronius PV i bateria dzielą integrację. Cena punktów: pierwszych 10 po 55 zł, następne po 50 zł. `complex`, `remote`, `shipping` i dodatkowy support=0, ponieważ opisany zakres ich nie wymaga; nie dodano ich „na zapas”.

START: harmonogram świateł i scena wyjścia. STANDARD: sceny świateł/rolet, harmonogram HVAC i dwie logiki temperatury/priorytetu harmonogramów na udokumentowanych funkcjach. PREMIUM: dodatkowe sceny komfortu, logika świateł/rolet i powiadomienia o temperaturze/danych energii. Monitoring PV/baterii i powiadomienia o braku danych nie zmieniają nastaw magazynu. Odbiór API/znaków energii mieści się w 4 h integracji Fronius; próby logiki scen w ich własnym czasie. Oczekiwanie na 48–72 h obserwacji nie jest 48–72 r-g; aktywna analiza ujęta w godzinach zakresu i rezerwie.

### Cena sprzedaży, koszty i rentowność


| Pozycja | START | STANDARD | PREMIUM |
| --- | ---: | ---: | ---: |
| Koszt zakupu sprzętu netto | 1 481,63 | 2 251,77 | 2 543,97 |
| Koszt zakupu materiałów dodatkowych | 150,00 | 350,00 | 700,00 |
| Własna praca montażowa — 75 zł/h | 168,75 | 562,50 | 787,50 |
| Własna praca konfiguracji — 90 zł/h | 1 012,50 | 2 070,00 | 3 532,50 |
| Własna praca w podróży — 90 zł/h | 135,00 | 180,00 | 270,00 |
| Auto — 0,90 zł/km | 54,00 | 72,00 | 108,00 |
| Rezerwa 10% własnej pracy | 131,63 | 281,25 | 459,00 |
| Przydział kosztów działalności 30 zł/h | 450,00 | 975,00 | 1 582,50 |
| **C: wszystkie uwzględnione koszty netto** | 3 583,51 | 6 742,52 | 9 983,47 |
| Sprzedaż sprzętu netto (narzut 20%) | 1 777,96 | 2 702,12 | 3 052,76 |
| Sprzedaż materiałów netto (narzut 20%) | 180,00 | 420,00 | 840,00 |
| Sprzedaż montażu netto | 405,00 | 1 350,00 | 1 890,00 |
| Sprzedaż konfiguracji netto | 2 475,00 | 5 020,00 | 8 530,00 |
| Sprzedaż dojazdu netto | 405,00 | 540,00 | 810,00 |
| **Łączna cena sprzedaży netto** | 5 242,96 | 10 032,12 | 15 122,76 |
| **Cena brutto przy 23%** | 6 448,84 | 12 339,51 | 18 600,99 |
| **Z: wynik po uwzględnionych kosztach** | 1 659,45 | 3 289,60 | 5 139,29 |
| **Marża m po C** | 31,65% | 32,79% | 33,98% |
| Narzut względem C | 46,31% | 48,79% | 51,48% |
| Próg sprzedaży dla 30% po C — informacyjnie | 5 119,30 | 9 632,18 | 14 262,10 |

Dodatkowo marża pokrycia przed przydziałem kosztów działalności: START 2 109,45 zł / 40,23%; STANDARD 4 264,60 zł / 42,51%; PREMIUM 6 721,79 zł / 44,45%. Nie utożsamiać jej z marżą po C powyżej.

Ceny sum wynikają z arytmetyki i służą audytowi. Nie uzasadniają publikacji pozornie dokładnych ofert 5242,96/10032,12/15122,76 zł bez oględzin i aktualnego BOM. Przy przygotowaniu konkretnej oferty właściciel może zaokrąglić ją w górę, a potem ponownie sprawdzić rentowność. Wszystkie koszty dodatkowe i rabaty obniżają dostępny wynik.

### Wrażliwość — potencjalna nieopłacalność

Przy niezmienionej cenie i **25% więcej godzin konfiguracji oraz montażu**, bez zwiększania podróży, po doliczeniu rezerwy i kosztów działalności:


| Przykład | Dodatkowy modelowy koszt | Wynik Z | Marża po C |
| --- | ---: | ---: | ---: |
| START | 426,09 | 1 233,36 | 23,52% |
| STANDARD | 952,69 | 2 336,91 | 23,29% |
| PREMIUM | 1 561,13 | 3 578,16 | 23,66% |


Żaden przykład nie zachowuje wtedy celu 30%. Nie należy ustalać szerokiego ryczałtu na nieznane urządzenia na podstawie modelowych godzin. Przy koszcie integratora 130 zł/h efektywny koszt rośnie do 173 zł/h, a marża przy sprzedaży 220 zł/h spada do 21,36%; cena dla 30% wynosi co najmniej 247,15 zł/h. Przy montażowym koszcie 110 zł/h efektywny 151 zł/h oznacza 16,11% przy 180 zł/h. Przy kosztach działalności 60 zamiast 30 zł/h marża IT przy 220 zł/h wynosi 27,73%. Dane własne firmy są konieczne przed ostateczną taryfą.

## 10. Priorytety decyzji właściciela

| Grupa | Ocena i działanie |
| --- | --- |
| **Można zaproponować do zatwierdzenia** | Baza 1320, punkt 55/50, prosta scena 110, znany montaż światła 135, diagnostyka 220/h, wsparcie jednorazowe 220/440 — tylko opisany zakres, po akceptacji kosztów i VAT. |
| **Dodatkowa weryfikacja** | Rozbudowa, typy integracji, rolety, liczniki, zaawansowane sceny, dodatkowy onboarding, rozszerzony serwis, złożoność, dojazd, materiał i logistyka. Mierzyć czas i określić granice/konkretne modele. |
| **Ryzyko nieopłacalności** | Wysyłka 40 zł;85 zł przy obsłudze 0,5 h; materiały z narzutem 15/20% sprzedawane samodzielnie; bezlimitowe wsparcie; cena za złożoność bez limitu godzin; dodatkowy onboarding wymuszony przez nienadającą się sieć klienta. Historyczne taryfy 180/150 są poniżej nowego celu 30%, a nie automatycznie stratne. |
| **Największy potencjał** | Powtarzalna baza:546 zł modelowego wyniku/6 h; znane integracje/rozbudowy:91 zł/h; scenyproste 45,50/scenę, zaawansowane 136,50–273/scenę. Potencjał miesięcznej opieki wymaga kontroli wykorzystania puli i obsady. Montaż ma 67,50 zł wyniku/h i może przynosić więcej łącznie dzięki skali, lecz nie ukrywać dojazdu. |

Do decyzji: realny koszt produktywnej godziny i stałe koszty firmy; cel 30% po wszystkich kosztach vs dotychczasowy próg po kosztach bezpośrednich; stawki 220/180; baza 1320; progresywny rabat punktów; minima i ich zakres; miejsce startu/promień oraz stawka dojazdu; VAT; narzut sprzętu/materiałów 20%; pakowanie/kurier; granice integracji i dopłat; oferta jednorazowego wsparcia oraz ewentualna późniejsza opieka 259/459. **Nie aktywować żadnej z tych propozycji samym przeczytaniem raportu.**

Plan kalibracji: dla 3–5 zakwalifikowanych wdrożeń zapisać rzeczywiste godziny w podzialebaza/integracja/punkt/montaż/scena/podróż, zakup i zwroty sprzętu, poprawki, obsługę handlową i serwis. Zmierzyć efektywne godziny pracy właściciela; nie wpisywać 0 zł. Porównać estymację z wykonaniem i ponownie ocenić taryfę. Dodatkową nieznaną integrację sprzedawać jako limitowany audyt/pilot z dopuszczalnym wynikiem negatywnym, dopiero później wdrożenie.

## 11. Kontrola raportu i stan końcowy

- Sprawdzono zgodność 17 wierszy z 17 identyfikatorami katalogu; osobno rozdzielono historyczne hipotezy i aktywne puste ceny.
- Przeliczono brutto 23%, koszty godzin, rezerwę, koszty działalności, różnicę marży/narzutu, progi 30%, progresywny rabat, wspólne integracje oraz trzy przykłady i wzrost czasu 25%.
- Przykłady nie zawierają zapisów do baterii, sterowania EV, uniwersalnej podłogówki ani zakupu mini-PC bez kwalifikacji. Ogrzewanie opisano konkretnie jako trybheat zgodnego Daikin.
- Dokument zachowuje rozdział kosztu zakupu, pracy i cen sprzedaży. Archiwalny BOM i nowe koszty logistyczne pozostają szacunkami.
- Nie uruchamiano testów aplikacji w tym etapie, ponieważ kod i dane aplikacji pozostały niezmienione. Nie przedstawiono wcześniejszych 184 testów jako nowych testów cennika.
- Sumy SHA-256 wszystkich istniejących 100 plików roboczych repozytorium (bez `.git`, `node_modules` i `output`) porównano przed i po analizie; jedynym nowym plikiem jest ten raport. Nie wykonano eksportu cen ani przebudowaniabuildu. Raport jest poza jawną listą plików publicznych w `scripts/build.js`; nie kopiowano go do `dist`.

**Ukończono audyt i propozycję do decyzji. Kod, zatwierdzenia, konfigurator i publikacja pozostają bez zmian. Dalsze wpisywanie/aktywowanie cen wymaga decyzji właściciela oraz osobnego etapu wdrożenia.**
