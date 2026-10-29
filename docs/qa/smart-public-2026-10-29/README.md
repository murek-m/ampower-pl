# Odbiór publicznego Smart Home — 29.10.2026

Wydanie main:f9e31b79e59aca4b2aefa2965e25917c34c48c77. Baza d6e68b7. Lokalnie50/50 i produkcja50/50 PASS:28 funkcji/layoutu/cen +22 polityki analityki/menu/tekstu200%. Oba silniki Chromium156.0.8078.48/WebKit26.5; sześć szerokości375/390/430/1366/1440/1920.

live-manifest.json:30/30 plików zgodnych SHA256 (8 zmienionych,21 zachowanych PV i index.html strony głównej). preserved-sha256.json dokumentuje pozostałe zachowane pliki; assets/consent.css dodatkowo przywrócono bez zmiany.

acceptance.mjs/scope.mjs to dokładne skrypty wykorzystane lokalnie w tym środowisku. Wymagają dostępnego runtime Playwright i Chrome pod zapisanymi ścieżkami, bez instalacji zależności projektu. Acceptance przyjmuje AMPOWER_FIX_ORIGIN oraz AMPOWER_FIX_OUTPUT. Scope w wersji live zmieniał jedynie lokalny origin podglądu na https://ampower.pl oraz plik wynikowy. W testach statystyk ruch do Cloudflare był zastąpiony atrapą. Nie przesłano rzeczywistych formularzy, wiadomości ani pomiarów analitycznych.

beacon-diagnostic.json wskazuje inicjator starego żądania Cloudflare w assets/consent.js. Obecny publiczny skrypt zachowuje Cloudflare na stronie głównej, z wykluczeniem Smart/prywatności/PV. Źródłowa gałąź ma inny wariant Google — pełnego dist nie wolno bezrefleksyjnie kopiować do produkcji. Szczegóły w docs/SMART_HOME_PUBLIKACJA_2026-10-29.md.

Cennik pozostaje wyłączony do otrzymania aktualnych, zatwierdzonych cen. Brak zgody cenowej nie został zastąpiony danymi testowymi. Pełne logi i screenshoty poza repo: /Users/jb/outputs/ampower-smart-fix-2026-10-29/.
