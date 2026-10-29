# Odbiór AUD012 — 29.10.2026

Build PV: `dccb0baf189fd74d`. LCP: mediana 2,858→2,324 s w porównywalnych trzech zimnych próbach. CLS końcowy 0,013489; TBT 0. Lighthouse 13.5.0, Chrome 156.0.8078.48, mobile 412×823/DPR1,75, RTT150ms/1638,4kbps/CPU×4, lokalny serwer bez kompresji. Pełne ustawienia i trzy wyniki w lighthouse-control/final.json. To pomiary laboratoryjne lokalnego buildu, bez gwarancji terenowych CWV.

acceptance-initial.json: 36 widoków (Smart/simple/advanced ×375/390/430/1366/1440/1920 ×Chromium/WebKit) i6 dotychczasowych funkcji PASS;4 nowe hidden startup FAIL. hidden-diagnostic.json potwierdza błąd instrumentacji: przy wyłączonym rAF domyślne oczekiwanie timeoutuje, mimo gotowego DOM; polling100ms działa. Po korekcie wyłącznie oczekiwania dla ukrytej karty acceptance-functional.json:10/10 PASS, w tym4 nowe przypadki. Wszystkie asercje gotowości, eksportu, wersjonowania, CSP, HTTP i blokowania żądań pozostają. HTML podglądu zabezpieczono securePublicHtml tak jak w build-pv-public.

Wcześniej na tym kodzie:347/347 jednostek, lint, build i release74 PASS. Pełne logi oraz screenshoty poza repo: /Users/jb/outputs/ampower-lcp-2026-10-28/. Oryginalne dane profilu i audyt niezmienione.

Natywny Safari: punktowe obliczenia8760h/3modele oraz błędnyCSV→prawidłowyCSV8760 PASS, dowody AX w historii narzędzia. 29.10 ponownie potwierdzono start simple i oglądnięto widok. Próba Command+F5 nie uruchomiła potwierdzonej sesji VoiceOver (brak procesu/okna i zmian AX); brak dostępu do odczytu mowy. VoiceOver, pełny odbiór natywnego fokusu/zoom i fizyczny iPhone nadal nieweryfikowane. Zamknięto wyłącznie prywatne okna testowe.

Końcowe CI40809462420 dla ff52fdd: success, wszystkie kroki PASS (347 jednostek, lint87, buildy/release i pełne browser QA); metadane ci.json. Wcześniejsze błędy CI dotyczyły wspólnego dist i zależności testów od jego istnienia. tests/public-build-fixture.mjs oraz3 zestawy korzystają teraz z niezależnych katalogów. clean-unit.log potwierdza347/347 na lokalnej kopii bez gotowego dist; żadnej asercji nie usunięto.
