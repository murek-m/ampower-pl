# Źródła, daty i ograniczenia

Weryfikacja podczas etapu1: **24.10.2026**. Źródła oznaczone „indeks” były dostępne jedynie przez wyszukiwarkę; nie przedstawiamy ich jako potwierdzonego dzisiejszego checkoutu. Żaden odczyt sklepu nie jest rezerwacją ani badaniem wiarygodności finansowej sprzedawcy.

## Dane zapisane i odtwarzalne

`evidence/fetch-manifest.json` zawiera URL, czas UTC, wynik HTTP i hashe zapisanych plików. Wiek danych źródłowych jest oddzielny od czasu pobrania. Przy NBP jest to23.10.2026; PVGIS to model dla roku2023, nie produkcja z dnia pobrania.

| Źródło | Co ustalono | Granica dowodu |
|---|---|---|
| GitHub REST `/repos/murek-m/ampower-pl/pages` | main/root, legacy, domena iHTTPS | nie potwierdza działania backendu |
| GitHub REST repo/branches + lokalnyGit | publiczność, commity iizolacja | niezacommitowane zmiany pierwotnego worktree nie są wnowej bazie |
| DNS/WHOIS NASK, HTTPampower.pl | GitHubhosting, registrarKey-Systems, NSGoogleDomains | brak odczytu paneluSquarespace |
| [Coinbase spotBTCPLN](https://api.coinbase.com/v2/prices/BTC-PLN/spot) | publiczny odczyt200, kurs wPLN | cena informacyjna, brak gwarancji realizacji iSLA |
| [mempool hashrate/difficulty](https://mempool.space/api/v1/mining/hashrate/3d), [reward-stats144](https://mempool.space/api/v1/mining/reward-stats/144), [height](https://mempool.space/api/blocks/tip/height) | trudność, szacunekhashrate, feespróbki, wysokość | nie prognoza przyszłych opłat/trudności; snapshoty mogą różnić się o chwilę |
| [NBP](https://api.nbp.pl/) | USD/EUR/CZK wPLN, effectiveDate | kurs średni, nie kurs wymiany konsumenta |
| [PVGISJRC](https://joint-research-centre.ec.europa.eu/photovoltaic-geographical-information-system-pvgis/using-pvgis-5/api-non-interactive-service_en) | seriescalc5.3, Wrocław51.1079/17.0385, 2023, 1kWp, południe35°,14%strat | dom syntetyczny; próbkowaniegodzinowe nie jest pomiarem w czasie rzeczywistym |
| [PSEAPI](https://api.raporty.pse.pl/api/rce-pln) | daty, przedziały15min, UTC, paginacja, filtr | odczyt2rekordów nie jest pełnym rokiem cen |
| [Bitmain catalogAPI](https://shop-product-service.bitmain.com/api/productshow/getMainProduct) | konkretneSKU, W, TH/s, J/TH, ceny, terminy/statusy | publiczny nieudokumentowany kontrakt nie gwarantuje zgody na stałyfeed |
| CryptoMinerBros productJSON-LD | fakty cen/wariantów, NewCondition, InStock, przekierowania | nie potwierdza fizycznego zapasu, dostawy, importu ani pełnej zgodności opisu |

Metadane ofert celowo zawierają tylko fakty z JSON-LD, nie kopie całych opisów sklepu. Hashe wmanifeście odnoszą się do zapisanych plików, nie do całych oryginalnych odpowiedziHTTP po ekstrakcji. Środowisko pracy ma aktualną datę24.10.2026; nie datowano wszystkich danych tą datą tylko dlatego, że zostały dziś pobrane.

## Źródła techniczne

- [BitmainS21](https://support.bitmain.com/hc/en-us/articles/23794895251609-S21-Specification), [S21Pro](https://support.bitmain.com/hc/en-us/articles/31321354157593-S21-Pro-Specification), [S21XP](https://support.bitmain.com/hc/en-us/articles/35383015643673-S21-XP-Specifications): źródła producenta; instrukcje i tolerancje należy dopasować do sztuki.
- [S23Hydinstrukcja](https://file12.bitmain.com/shop-product-s3/firmware/807d3b27-f625-470f-a940-247f83b36854/2025/06/20/14/S23%20Hyd.%20Product%20Manual_v1.0.6.pdf): chłodzenie i zasilanie; nie zawiera projektu instalacji klienta.
- [MicroBTM60S++instrukcja](https://aws-microbt-com-bucket.s3.us-west-2.amazonaws.com/WhatsMinerM60S%2B%2B_1760948259244.pdf) i [sklep producenta218T](https://shop.whatsminer.com/products/details/74?skuId=169): rozbieżność zakresów opisana w02.
- [Braiinsrelease26.09.1](https://downloads.braiins.com/braiins-os/), [API](https://academy.braiins.com/braiins-os/papi-about), [opłaty](https://braiins.com/os-firmware/download), [licencjonowanie](https://academy.braiins.com/braiins-os/faqs/license).
- [LuxOSzgodność](https://docs.luxor.tech/firmware/compatibility), [power targeting](https://docs.luxor.tech/firmware/features/powertargeting), [changelog](https://docs.luxor.tech/firmware/changelog).
- [MicroBTAPI](https://apidoc.whatsminer.com/): dokumentacja v3.0.5 indeksowana; bez logowania/sterowania sprzętem.
- [VNISH](https://vnish.global/): odczyt kanału dostawcy, nie niezależne potwierdzenie reklamowanej oszczędności.
- [HA/Shelly](https://www.home-assistant.io/integrations/shelly), [Shellyobciążenia>16A](https://support.shelly.cloud/en/support/solutions/articles/103000043920-i-want-to-control-a-load-above-16a-and-monitor-his-consumption-what-device-should-i-use-): integracja lokalna i zewnętrzny stycznik.
- [BitcoinDeveloperReference](https://developer.bitcoin.org/reference/block_chain.html): subsidy ihalving co210000bloków; stare wartości bieżącej nagrody ztekstu nie zostały użyte. Dzisiejszą nagrodę wyznacza odczyt wysokości i reguła konsensusu.

## Źródła handlowe

- PL: [Miners.plS21](https://miners.pl/pl/p/Bitmain-Antminer-S21/113) — strona odczytana, różne warianty. [UnlimitedS21Pro](https://www.unlimitedminer.com/sklep/s21-pro), [katalogUnlimited](https://unlimitedminer.com/sklep) — **indeks**, bez udanego pobrania bezpośredniego.
- DE: [NexMine](https://nexmine.de/shop) — firmaDEi dynamiczna strona odczytana, ceny/etykietyhosting **indeks**. Nie rekomendowano ich jako dostawy doPL.
- CZ: [CryptoboxS21HK](https://cryptobox.cz/product/antminer-s21-200-th-s-skladem-hk/) — strona odczytana, magazynHK i warunkiPL nieznane.
- NL: [AntminerDistributionEurope](https://www.antminerdistribution.com/), [S23](https://www.antminerdistribution.com/antminer-s23/), [XP](https://www.antminerdistribution.com/antminer-s21-xp/) — odczytane; cena na głównej i niezgodność nazwyS23na karcie nie tworzą pełnej oferty wariantu.
- Chiny/HK: [Bitmain](https://shop.bitmain.com/), [oficjalneAPI](https://shop-product-service.bitmain.com/api/productshow/getMainProduct), [CryptoMinerBrosS21+](https://www.cryptominerbros.com/product/bitmain-antminer-s21-plus-bitcoin-miner/), [Pro234](https://www.cryptominerbros.com/product/bitmain-antminer-s21-pro-bitcoin-miner-234th-s/), [XP](https://www.cryptominerbros.com/product/bitmain-antminer-s21-xp-bitcoin-miner/).

Nie traktowano domen `bitmain.com.de`, `bitmain.com.lc` ani `bitmainofficial.com` jako potwierdzonych oficjalnych sklepów producenta; podobieństwo nazwy domeny nie jest dowodem. Agregatory i blogi pomagały znaleźć dokumenty, ale nie zastąpiły kart producentów w parametrach technicznych. Dla konkretnego zakupu pozostają: dane sprzedawcy/faktura, MOQ, Incoterms, dowód stanu, gwarancja i pełna dostawaPL.

## Energia, prawo, platformy

- [PSE/RCEm](https://www.pse.pl/oire/rcem-rynkowa-miesieczna-cena-energii-elektrycznej): odczytane ceny i korekty, ostatni pełny rok użyty w przykładach2025.
- [Energa/net-billing](https://formularze.energa.pl/dom/strefa-prosumenta/net-billing): zasady operatora/sprzedawcy, nie wszystkie umowy wszystkich klientów.
- [MF/VAT](https://www.podatki.gov.pl/podatki-firmowe/vat/stawki-i-limity), [MF/walutywirtualne](https://www.podatki.gov.pl/podatki-osobiste/pit/informacje-podstawowe/co-jest-opodatkowane/zbycie-kryptowalut): podstawowe informacje; klasyfikacja celnaASIC i indywidualna odliczalność kosztów nie zostały rozstrzygnięte.
- [GitHubActionsbilling](https://docs.github.com/en/billing/concepts/product-billing/github-actions), [Pageslimits/polityka](https://docs.github.com/en/pages/getting-started-with-github-pages/github-pages-limits).
- [CloudflarePagesFree](https://developers.cloudflare.com/pages/platform/limits/): limity planu, nie utworzone wdrożenie ani zgoda na aktywację.
- [CoinGeckolimitpublic](https://support.coingecko.com/hc/en-us/articles/4538771776153-What-is-the-rate-limit-for-CoinGecko-API-public-plan), [wykorzystaniedanych](https://support.coingecko.com/articles/4315804955-can-i-use-coingecko-data-and-screenshots-for-my-website-book-etc): różne komunikaty o publicznych limitach; dlatego brak obietnicy jednej gwarantowanej przepustowości bez planu.
- [OpenAIdokumentacja rozumowania](https://developers.openai.com/api/docs/guides/reasoning): rekomendacja poziomu do następnego etapu. Rzeczywiste limity odczytano z narzędzia kontaCodex, nie z dokumentacji ani szacowania tokenów.

## Co wymaga późniejszej weryfikacji

Pełny koszt dostarczenia urządzenia, aktualny stan magazynu i gwarancja każdej sztuki, minimum stabilnej mocy i krzyweH(P), pomiary klienta i bilans faz, cennikAMPOWER, zakres wykorzystania depozytu konkretnej umowy, zgoda na feed/skrapowanie cen, docelowy endpointCDN/CORS/CSP i rola kontaSquarespace. Te niewiadome nie są wypełnione fikcyjnymi cenami ani deklaracją kompatybilności.
