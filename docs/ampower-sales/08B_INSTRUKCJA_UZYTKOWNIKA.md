# AMPOWER — krótka instrukcja panelu 8B

Panel jest działającym prototypem lokalnym. Używaj danych fikcyjnych: wszystkie oferty i zatwierdzenia są demonstracyjne, poczta oraz AI są wyłączone. Dane i wersje przetrwają restart.

## Uruchomienie na Macu

W Terminalu:

```sh
cd '/Users/jb/Ampower Smart Home/ampower-website'
npm run panel:local
```

Wymagany Node.js 20+; panel nie wymaga `npm install`. Otwórz `http://127.0.0.1:8790`. Wklej **kod logowania wyświetlony w Terminalu przy tym uruchomieniu**. Kod zmienia się po restarcie; sesja trwa godzinę. Serwer zatrzymujesz `Ctrl+C`. Zajęty port można zmienić: `AMPOWER_PANEL_PORT=8791 npm run panel:local`, wtedy otwórz port 8791.

Kliknij **Dodaj dane DEMO**, aby zobaczyć dwa przykładowe zgłoszenia. Ponowienie przycisku nie tworzy kopii tych samych przykładów. Dane domyślnie znajdują się w `~/.local/share/ampower-panel-demo`, poza repozytorium. Nie uruchamiaj panelu zwykłym serwerem statycznym i nie udostępniaj root repozytorium.

## iPhone w tej samej sieci Wi-Fi

Zatrzymaj poprzedni serwer. Odczytaj IP Wi-Fi Maca (na tym Macu `en1`; przy innym interfejsie sprawdź `networksetup -listallhardwareports`):

```sh
ipconfig getifaddr en1
```

Następnie podstaw wynik zamiast `ADRES_MACA`:

```sh
AMPOWER_PANEL_HOST=ADRES_MACA npm run panel:local
```

Na Macu i iPhonie otwórz `http://ADRES_MACA:8790` i zaloguj się kodem z Terminala. Adres podczas testu wynosił `192.168.1.162`, ale może się zmienić. Sieć gościnna z izolacją urządzeń może blokować połączenie. Jeśli firewall macOS poprosi, dopuść lokalny Node w sieci domowej. Nie przekierowuj portu routera. Serwer przyjmuje tylko konkretny prywatny adres tego Maca.

To lokalne HTTP dla fikcyjnych danych; produkcja wymaga HTTPS i konta z MFA. Przetestowano rzeczywiste połączenie przez interfejs LAN Maca w Chromium z widokiem mobilnym. Fizyczny iPhone i Safari nie zostały przetestowane.

## Nowy kosztorys z opisu

1. Kliknij **Nowa wycena** i wpisz fikcyjne dane klienta oraz opis, np. „8 rolet, 12 obwodów oświetlenia, klimatyzacja Daikin i podłogówka”.
2. Uruchom analizę opisu. System rozpozna zakres, poda 8 i 12, pokaże propozycje z istniejącego katalogu oraz brakujące modele, protokoły, zasilanie czy liczbę stref. Nie dopisze ceny ani domyślnego modelu.
3. Utwórz kosztorys roboczy i wybierz właściwe modele po sprawdzeniu zgodności. Wybór propozycji zastępuje odpowiedni wiersz doboru. Inne pozycje dodasz z katalogu lub przez **Dodaj własną pozycję**. Praca montażowa, konfiguracja, materiały i dojazd mogą być osobnymi wierszami.
4. Uzupełnij brakujące pola. Puste pole oznacza brak wiedzy; zero wpisuj tylko wtedy, gdy koszt/czas rzeczywiście wynosi zero.

## Cena urządzenia i koszt pracy

W wierszu zmień ilość, **Zakup / koszt netto** i **Sprzedaż netto**. To kwoty za jedną sztukę. W „Czas pracy, VAT i parametry” uzupełnij producenta, model, rodzaj pozycji, czas za jednostkę i koszt własny godziny. Dla sprzętu i materiałów ustaw czas 0; robociznę zapisz oddzielnie. Przy pracy dodatni czas wymaga dodatniej stawki własnej, także dla właściciela.

Zakwalifikuj VAT każdej pozycji i zatwierdź jej ceny oraz VAT. Zmiana ceny/czasu/ilości wymaga ponownego zatwierdzenia cen. Dobór zgodnych urządzeń pozostaje decyzją właściciela. Klucz zakresu pracy pozwala wykryć podwójne rozliczenie tej samej czynności; różne czynności powinny mieć różne klucze. Zawsze sprawdź zakres także merytorycznie.

Przeliczenie odbywa się automatycznie po edycji. Podgląd liczbowy z kompletnych, lecz niezatwierdzonych pól ma oznaczenie szacunkowe. Przy brakujących kwotach panel pokazuje listę braków i nie udaje pełnego wyniku.

## Marża, rabat i cena sprzedaży

W „Koszty i cena sprzedaży” wpisz rezerwę na koszt pracy i przypisane koszty działalności. Nie wpisuj tych samych kosztów ponownie w pozycjach. Rezerwa procentowa obejmuje koszt godzin pracy, nie zakupy sprzętu. Dodatkową rezerwę materiałową można wpisać jako osobną uzasadnioną pozycję kosztową.

Główna marża panelu to **wynik po uwzględnionych kosztach / sprzedaż netto**. Narzut to **ten sam wynik / pełny koszt**. Panel pokazuje również marżę przed przypisanymi kosztami działalności, aby zachować rozróżnienie wcześniejszego kalkulatora. Wynik nie uwzględnia podatku dochodowego.

Możesz podnieść sprzedaż poszczególnych pozycji lub ustawić cel marży i kliknąć **Ustaw cenę dla docelowej marży**. Powstaje jawna korekta ceny całego zakresu: zakwalifikuj i zatwierdź VAT korekty. Rabat całej oferty obniża podstawę każdej pozycji i jej VAT; nie można równocześnie używać rabatu i końcowej korekty ceny. Zaokrąglenia odbywają się do groszy na pozycji.

## Zapis, zatwierdzenie i PDF

1. Wpisz warunki realizacji, płatności, termin, ważność 1–90 dni i wyłączenia. Uwagi oznaczone jako wewnętrzne nie trafiają do PDF. Gwarancję i serwis wpisz, jeśli zostały ustalone, i zatwierdź ich treść.
2. Potwierdź kontrolę techniczną oraz pełne koszty, ceny i VAT. Kliknij **Zapisz nową wersję**. Edycja zapisanej oferty zawsze tworzy nową wersję roboczą i unieważnia jej poprzednią zgodę.
3. Kompletną wersję można pobrać jako **PDF roboczy**. Brak cen, ilości czy kwalifikacji VAT blokuje PDF — uzupełnij wskazane pola zamiast zastępować je zgadywanymi zerami.
4. Kliknij **Zatwierdź wersję** i potwierdź konkretną wersję. Oferta poniżej celu marży wymaga wpisania uzasadnienia wyjątku rentowności. Jest to świadoma decyzja właściciela.
5. Pobierz **PDF zatwierdzony**. Nadal ma oznaczenie demonstracyjne. Nie zawiera kosztów zakupu, własnych stawek, marży ani wewnętrznych uwag. Pobranie nie wysyła wiadomości.

„Historia wersji” umożliwia pobranie wcześniejszej kompletnej oferty. Zatwierdzona wersja zachowuje dane klienta i hash zatwierdzenia z tamtej chwili. Przywrócenie wcześniejszej kalkulacji tworzy nowy szkic do ponownej kontroli; dane bieżącego klienta pozostają bieżące. Wygasłej oferty nie można pobrać jako aktualnie zatwierdzonej — przywróć kalkulację jako nową wersję i uzgodnij nową ważność.

## Zapytanie z konfiguratora

Na Macu, w trybie loopback (`npm run panel:local`), kliknij **Konfigurator DEMO**, wybierz zakres i wypełnij formularz fikcyjnymi danymi. Wyślij lokalne zapytanie i wróć do dashboardu. Ten sam istniejący odbiornik nada UUID, zapisze zgłoszenie i wstępny kosztorys. Ponowienie żądania z tym samym kluczem nie tworzy duplikatu.

Konfigurator DEMO jest dostępny tylko na Macu przez loopback; przy uruchomieniu panelu w LAN służy on do obsługi właścicielskiej. Publiczny formularz nadal nie ma aktywnego produkcyjnego odbiornika. Status powiadomień `demo-disabled` oznacza wyłączoną pocztę, nie dostarczenie do `kuba@ampower.pl`.

Statusy „wysłana” i „zaakceptowana” są ręcznym odnotowaniem zdarzenia i wymagają notatki. Nie wykonują wysyłki ani nie tworzą automatycznej akceptacji klienta. Dashboard pokazuje wartości najnowszych kompletnych ofert i przewidywany wynik, a nie przychód z zaksięgowanych faktur. Przypomnienie po 48 godzinach jest informacją na dashboardzie.

## Kopia, usunięcie i błędy

Kopię danych wykonasz poleceniem `npm run panel:backup`. Kopia z manifestem SHA-256 trafi do `~/.local/share/ampower-panel-backups`. Jest nieszyfrowana i prywatna dla użytkownika Maca. Zatrzymaj panel przed odtwarzaniem; użyj nowego prywatnego katalogu z plikami kopii i `AMPOWER_PANEL_DATA_DIR=/pełna/ścieżka npm run panel:local`. Zachowaj katalog 0700 i pliki 0600. Dla produkcji potrzebna jest osobna szyfrowana polityka kopii.

Usunięcie zgłoszenia wymaga wpisania jego pełnego identyfikatora; kasuje dane oraz wszystkie wersje z aktywnego magazynu. Zostaje techniczny tombstone bez danych klienta, aby ponowienie starego klucza nie przywróciło zgłoszenia. Pobrane PDF i wcześniej wykonane backupy trzeba usunąć zgodnie z osobną retencją.

Konflikt 409 oznacza zmianę w innej karcie. Zapis nie nadpisuje jej; zanotuj własne zmiany i otwórz rekord ponownie. Błąd sieci nie jest potwierdzeniem zapisu. Po wygaśnięciu sesji zaloguj się ponownie. Dane wpisane w niezapisanym formularzu nie są trwałym zapisem.

## Generator PDF na innym Macu

Na tym Macu wykryto działający Python z ReportLab w środowisku Codex oraz font Arial. Jeśli panel zgłasza brak generatora, wskaż Python posiadający ReportLab:

```sh
AMPOWER_PYTHON=/pełna/ścieżka/do/python3 npm run panel:local
```

Można przygotować własne środowisko poza repozytorium:

```sh
python3 -m venv ~/.local/share/ampower-panel-python
~/.local/share/ampower-panel-python/bin/pip install reportlab
AMPOWER_PYTHON="$HOME/.local/share/ampower-panel-python/bin/python3" npm run panel:local
```

To instrukcja instalacji zależności, nie krok wykonany automatycznie. Font na macOS jest wykrywany z `/System/Library/Fonts/Supplemental/Arial.ttf`; inny font obsługujący polski podasz przez `AMPOWER_PDF_FONT`. Brak generatora daje jawny błąd 503; nie zmienia oferty ani nie udaje pobrania PDF.
