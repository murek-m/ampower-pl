"""Reproduce stage-1 research tables. Not an application or production engine.
Run from any directory: python3 docs/pv-mining/research/calculate.py
Only local evidence is read; no network or external dependencies.
"""
import datetime as dt
import json
import math
from pathlib import Path
from zoneinfo import ZoneInfo

ROOT = Path(__file__).resolve().parents[1]
E = ROOT / 'evidence'
read = lambda name: json.loads((E / (name + '.json')).read_text())
PRICE = float(read('btc-pln')['data']['amount'])
DIFFICULTY = read('network')['currentDifficulty']
HEIGHT = read('block-height')
FEES = int(read('rewards')['totalFee']) / 144 / 1e8
ANCHOR = dt.datetime.fromisoformat(next(x['retrievedAt'] for x in read('fetch-manifest') if x['id'] == 'block-height'))
PV = read('pvgis')['outputs']['hourly']
assert len(PV) == 8760 and all(x['P'] >= 0 for x in PV)
PV_TIMES = [dt.datetime.strptime(row['time'], '%Y%m%d:%H%M').replace(tzinfo=dt.timezone.utc) for row in PV]
# Historical PSE 2025 RCEm including corrections visible on 24 October 2026.
RCEM = [480.01, 442.02, 178.84, 163.19, 216.97, 136.30,
        284.83, 214.68, 279.71, 330.27, 382.88, 466.08]
MODELS = [('S21 151T', 151, 2.642, 6590),
          ('S21 Pro 234T', 234, 3.510, 19500),
          ('S21 XP 270T', 270, 3.645, 36000)]
SITES = [(5, 0), (10, 0), (10, 10), (10, 20), (15, 0), (20, 20)]
# price multiplier now, annual BTC price change, annual difficulty growth,
# weather multiplier. Scenario assumptions, never predictions.
SCENARIOS = {'pesymistyczny': (.65, 0, .30, .90),
             'bazowy': (1, 0, .15, 1),
             'optymistyczny': (1.5, .05, 0, 1.05)}
PROFILE = [.35]*6 + [.8]*3 + [.4]*8 + [1.1]*5 + [.45]*2
LOAD_SCALE = 5000 / (sum(PROFILE) * 365)


def intervals(year, kwp, weather):
    """Map a historical hourly shape to a 365-day scenario year, UTC -> local.
    Leap day omitted explicitly: this is a fixed 8760 h reference-year model.
    """
    for origin, row in zip(PV_TIMES, PV):
        stamp = origin.replace(year=year)
        local = stamp.astimezone(ZoneInfo('Europe/Warsaw'))
        yield stamp, row['P']/1000*kwp*weather, PROFILE[local.hour]*LOAD_SCALE, RCEM[local.month-1]/1000*1.23


def dispatch(series, capacity, model, economic, mining=True):
    """Sample home-reserve policy: direct house, battery charging, surplus ASIC.
    No battery discharge for ASIC: house energy beats mining in these samples.
    Uses full-power modes only. A start needs two sufficient consecutive hours.
    """
    th, power = model[1:3]
    rated = power + .030  # explicitly assumed additional active ventilation
    eta = math.sqrt(.90)
    lo, hi = .20*capacity, .90*capacity
    soc = lo
    running = False
    totals = dict(pv=0., house_direct=0., house_battery=0., grid=0., export=0.,
                  export_value=0., btc=0., hours=0., hash_hours=0., asic_kwh=0.,
                  starts=0, charge=0., discharge=0., losses=0.)
    monthly = {str(m): dict(pv=0., asic=0., btc=0.) for m in range(1, 13)}
    for i, (stamp, pv, house, exp_price) in enumerate(series):
        direct = min(pv, house)
        surplus, deficit = pv-direct, house-direct
        discharge = min(deficit, 5., max(0., soc-lo)*eta)
        soc -= discharge/eta
        deficit -= discharge
        charge = min(surplus, 5., max(0., hi-soc)/eta)
        soc += charge*eta
        surplus -= charge
        elapsed = max(0., (stamp-ANCHOR).total_seconds())
        projected_height = HEIGHT + elapsed/600
        subsidy = 50 / 2**int(projected_height//210000)
        difficulty = DIFFICULTY * (1+economic['difficulty_growth'])**(elapsed/(365.25*86400))
        # BTC per hashing hour, pool and firmware fees distinct, no rebate assumed.
        btc_hour = th*1e12*3600*(subsidy+FEES)/(difficulty*2**32)*.98*.975
        mine_value = btc_hour*economic['btc_price']*(1 if running else .85)
        enough_next = (i+1 < len(series) and series[i+1][1]-series[i+1][2] >= rated+.2)
        worthwhile = mine_value > rated*exp_price
        on = mining and worthwhile and surplus >= rated+(0 if running else .2) and (running or enough_next)
        if on:
            startup = 0 if running else .15  # assumed 9 minutes, consumes power without hashes
            totals['starts'] += int(not running)
            hash_hours = 1-startup
            btc = btc_hour*hash_hours
            surplus -= rated
            totals['hours'] += 1
            totals['hash_hours'] += hash_hours
            totals['btc'] += btc
            totals['asic_kwh'] += rated
        else:
            btc = 0
        running = on
        totals['pv'] += pv
        totals['house_direct'] += direct
        totals['house_battery'] += discharge
        totals['grid'] += deficit
        totals['export'] += surplus
        totals['export_value'] += surplus*exp_price
        totals['charge'] += charge
        totals['discharge'] += discharge
        totals['losses'] += charge*(1-eta)+discharge*(1/eta-1)
        m = monthly[str(stamp.astimezone(ZoneInfo('Europe/Warsaw')).month)]
        m['pv'] += pv; m['asic'] += rated if on else 0; m['btc'] += btc
        assert lo-1e-8 <= soc <= hi+1e-8
        # AC conservation; battery AC charge/discharge enter opposite sides.
        assert abs(pv+deficit+discharge-(house+surplus+charge+(rated if on else 0))) < 1e-7
    totals['end_soc'] = soc
    totals['monthly'] = monthly
    return totals


def simulate(kwp, storage, model, scenario):
    mul, price_growth, difficulty_growth, weather = SCENARIOS[scenario]
    economic = dict(btc_price=PRICE*mul, difficulty_growth=difficulty_growth)
    # This is a hypothetical budget, NOT a quote or confirmed installed price.
    capex = model[3]+4000
    cumulative = -capex
    cumulative_new = -(capex+2000*storage)
    years = []
    payback = None
    for n in range(10):
        year = 2027+n
        economic['btc_price'] = PRICE*mul*(1+price_growth)**n
        series = list(intervals(year, kwp*(.995**n), weather))
        without = dispatch(series, storage, model, economic, mining=False)
        with_miner = dispatch(series, storage, model, economic, mining=n < 5)
        no_storage = dispatch(series, 0, model, economic, mining=False)
        lost_export = without['export_value']-with_miner['export_value']
        # 300 PLN annual mining maintenance + incremental EMS 8 W all year.
        opex = 300+8/1000*8760*1.00 if n < 5 else 0
        value = with_miner['btc']*economic['btc_price']
        benefit = value-lost_export-opex
        cumulative += benefit
        # Separate combined investment vs PV only; battery cycling cost assumed.
        storage_saving = ((no_storage['grid']-without['grid'])*1.00
                          + without['export_value']-no_storage['export_value']
                          - .10*without['discharge'])
        cumulative_new += benefit+storage_saving
        if cumulative >= 0 and payback is None: payback = n+1
        years.append(dict(year=year, btc=with_miner['btc'], value_pln=value,
                          energy_kwh=with_miner['asic_kwh'], hours=with_miner['hours'],
                          hash_hours=with_miner['hash_hours'], starts=with_miner['starts'],
                          pv_kwh=with_miner['pv'], house_direct_kwh=with_miner['house_direct'],
                          house_battery_kwh=with_miner['house_battery'],
                          export_lost_pln=lost_export, opex_pln=opex, benefit_pln=benefit,
                          cumulative_pln=cumulative, combined_new_storage_pln=cumulative_new,
                          battery_end_soc_kwh=with_miner['end_soc'], monthly=with_miner['monthly']))
    return dict(pv_kwp=kwp, battery_kwh=storage, model=model[0], scenario=scenario,
                device_observed_pln=model[3], capex_budget_pln=capex,
                confirmed_installed_price_pln=None, new_storage_budget_pln=2000*storage,
                payback_year=payback, roi_first_year=years[0]['benefit_pln']/capex,
                years=years)


def main():
    results = [simulate(pv, battery, model, scenario) for scenario in SCENARIOS
               for pv, battery in SITES for model in MODELS]
    payload = dict(market_snapshot=dict(btc_pln=PRICE, difficulty=DIFFICULTY,
                   height=HEIGHT, mean_fee_btc=FEES, anchor=ANCHOR.isoformat()),
                   assumptions=dict(house_kwh=5000, battery_roundtrip=.9,
                   battery_power_kw=5, soc_range=[.2,.9], asic_life_years=5,
                   additional_infrastructure_budget_pln=4000, new_battery_budget_pln_kwh=2000,
                   rcem_2025_pln_mwh=RCEM, deposit_utilization=1,
                   scenarios=SCENARIOS), results=results)
    (ROOT/'research/results.json').write_text(json.dumps(payload,ensure_ascii=False,indent=2)+'\n')
    lines = ['# Przykładowe obliczenia — etap 1', '',
      'Reprodukcja: `python3 docs/pv-mining/research/calculate.py`. Dane wejściowe i pełne wyniki: `research/results.json`.', '',
      '**To symulacja, nie pomiary klienta ani oferta.** Profil PVGIS 2023, Wrocław, południe, 35°, straty systemowe 14%, uzysk 1026,77 kWh/kWp; wykorzystany jako powtarzany profil referencyjny.', '',
      'Dom: syntetyczne 5000 kWh/rok, profil dobowy z porannym i wieczornym szczytem. Interwały UTC przeliczane na Europe/Warsaw. Zawsze 8760 h/rok, bez dnia przestępnego; to ograniczenie badania.', '',
      'Magazyny w tabelach są **istniejące**, 20–90% SOC, 5 kW, 90% sprawności cyklu, początek na rezerwie. Ładowanie po zasileniu domu, rozładowanie tylko na dom; ASIC korzysta z pozostałej nadwyżki. Jest to jedna jawna polityka, nie optymalizator wszystkich możliwości.', '',
      'ASIC: pełna moc, wentylacja dodatkowa 30 W, 9 minut rozruchu bez wydobycia, próg startu +200 W oraz prognoza dostatecznej nadwyżki PV minus dom w kolejnej godzinie. Ta prognoza nie rezerwuje energii przed ładowaniem magazynu; kolejny krok ponownie sprawdza dostępność i może zatrzymać ASIC. Brak zasilania ASIC z sieci. Uptime poniżej oznacza czas zasilania; hash_hours w JSON odejmuje rozruchy.', '',
      'Ceny urządzeń: obserwacje polskich stron z raportu ofert. **Budżet I = urządzenie + założone 4000 PLN na pozostałe pozycje**; nie jest cennikiem ani ofertą robocizny AMPOWER. Nieznany ostateczny koszt instalacji i przesyłki wymaga wyceny.', '',
      'Eksport: historyczne miesięczne RCEm 2025 z korektami ×1,23, założone pełne wykorzystanie depozytu. Nie jest to gotówka ani prognoza taryf 2027. Zakup energii 1 PLN/kWh — założenie do porównania magazynu. OPEX miningu 300 PLN/rok + 70,08 PLN/rok na 8 W EMS. Pool 2% i firmware 2,5%, inny pool bez rabatu Braiins; wartości kontrolować dla wybranej konfiguracji.', '',
      'Analiza 2027–2036: trudność rośnie w scenariuszu, halving według szacowanej wysokości (144 bloki/dzień od snapshotu), opłaty transakcyjne na blok stałe według próbki 144 bloków. ASIC kończy pracę po 5 latach, wartość rezydualna 0; bez wymiany. PV traci 0,5%/rok. Nie zakładamy stałego wydobycia przez 10 lat.', '',
      'Scenariusze: pesymistyczny BTC ×0,65, trudność +30%/rok, produkcja ×0,90; bazowy BTC ×1,00 i stały kurs, trudność +15%/rok; optymistyczny BTC ×1,50 i +5%/rok, trudność stała, produkcja ×1,05. Są założeniami, a nie przedziałem prawdopodobieństwa.', '',
      'Δ = wartość wydobycia − utracony wykorzystany depozyt − OPEX. Σ to skumulowany wynik ekonomiczny po budżecie inwestycji, przed podatkami i dyskontem; nie jest wpływem gotówki przy przechowywaniu BTC. Nie doliczamy wzrostu ceny już zgromadzonych BTC. Zwrot liczony tylko z kolejnych rocznych korzyści, nie z prostego I/Δ przy zmiennych parametrach.', '']
    for scenario in SCENARIOS:
        lines += ['## '+scenario.capitalize(), '',
          '| PV / magazyn | ASIC | I budżet PLN | kWh ASIC/rok | h/rok | BTC / sat w 1. roku | Wartość PLN | Utracony eksport PLN | Δ PLN/rok | Δ/I | Σ3 PLN | Σ5 PLN | Σ10 PLN | Zwrot |',
          '|---|---|---:|---:|---:|---|---:|---:|---:|---:|---:|---:|---:|---|']
        for r in results:
            if r['scenario'] != scenario: continue
            a=r['years'][0]
            out=[f"{r['pv_kwp']} kWp / {r['battery_kwh']} kWh",r['model'],str(r['capex_budget_pln']),
                 f"{a['energy_kwh']:.0f}",str(a['hours']),f"{a['btc']:.8f} / {a['btc']*1e8:.0f}",
                 f"{a['value_pln']:.0f}",f"{a['export_lost_pln']:.0f}",f"{a['benefit_pln']:.0f}",
                 f"{r['roi_first_year']*100:.1f}%"]
            out += [f"{r['years'][y-1]['cumulative_pln']:.0f}" for y in [3,5,10]]
            out += [str(r['payback_year'])+' lat' if r['payback_year'] else 'Brak zwrotu w analizowanym okresie']
            lines.append('| '+' | '.join(out)+' |')
        lines.append('')
    lines += ['## Nowy magazyn — odrębny zakres', '',
      'W JSON `combined_new_storage_pln` porównuje cały zestaw z PV bez magazynu i miningu. Hipotetyczny budżet nowego magazynu to 2000 PLN/kWh (20 000 / 40 000 PLN), koszt cyklu 0,10 PLN/kWh oddanej energii. **Nie są to sprawdzone ceny zakupu ani koszt degradacji konkretnej baterii.** Zakup należy policzyć ponownie z rzeczywistą ofertą i gwarantowanym throughputem. Wynik obejmuje oszczędność domu oddzielnie od korzyści miningu. Magazyn nie dostaje dodatkowej energii z sieci.', '',
      'Istniejąca bateria nie jest darmowa: jej zużycie na dom jest w obu porównywanych wariantach takie samo i koszt się znosi. Wariant rozładowywania na mining wymaga dodatkowego kosztu degradacji i utraconej oszczędności domu; tutaj świadomie nie został przyjęty.', '',
      'Godzinowe próbki nie ujawniają chmur i przekroczeń mocy wewnątrz godziny. Czasy pracy są przybliżeniem, nie gwarancją braku importu w EMS. Brak modelu awarii, wymiany ASIC i cen odsprzedaży; ekonomiczny werdykt trzeba potwierdzić na danych 1–15-minutowych klienta. Końcowy SOC jest zapisany; nie przypisuje się mu dodatkowego przychodu.']
    (ROOT/'04_SYMULACJE.md').write_text('\n'.join(lines)+'\n')
    for r in results:
        if r['scenario']=='bazowy':
            a=r['years'][0]
            print(r['pv_kwp'],r['battery_kwh'],r['model'],a['hours'],round(a['benefit_pln']),r['payback_year'])


if __name__ == '__main__':
    main()
