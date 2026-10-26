// Publiczny katalog pytań. Kategorie nie potwierdzają kompatybilności urządzeń.
export const CONTACT = Object.freeze({ email: 'kuba@ampower.pl', phone: '+48785668797' });
export const PRICE_POLICY = Object.freeze({
  status: 'individual', approvedVersion: null,
  reason: 'Koszt zależy od kompatybilności urządzeń, potrzebnego sprzętu i zakresu prac.',
  // 03_CENNIK_LOGIKA.md zawiera hipotezy, nie zatwierdzony publiczny cennik.
  components: [
    ['Sprzęt i materiały', 'Centrala, moduły i akcesoria dobrane do instalacji.'],
    ['Prace instalacyjne', 'Montaż i ewentualne doposażenie.'],
    ['Konfiguracja', 'Połączenie systemów, panel, scenariusze, testy i przekazanie.']
  ]
});
export const UNKNOWN = 'unknown';
export const STATUS = { unknown: 'Nie wiem', installed: 'Zamontowane i działają', planned: 'W montażu lub planowane', retrofit: 'Trzeba doposażyć instalację' };
export const CONNECTION = { unknown: 'Nie wiem', network: 'Wi-Fi lub sieć LAN', radio: 'Zigbee lub inne radio', gateway: 'Przez centralę producenta', wired: 'Przewodowo', other: 'Inne' };
export const GOALS = { app: 'Chcę sterować z jednej aplikacji.', automation: 'Chcę automatyzacje.', energy: 'Chcę analizę i optymalizację energii.' };
export const DELIVERY = { unknown: 'Jeszcze nie wiem', local: 'Montaż i konfiguracja na miejscu', remote: 'Zestaw z konfiguracją zdalną' };
export const ACCESS = { unknown: 'Nie wiem', home: 'W domu', away: 'Również poza domem' };
export const HOST = { unknown: 'Nie wiem', owned: 'Tak', needed: 'Potrzebuję doboru' };
export const YES_NO = { unknown: 'Nie wiem', yes: 'Tak', no: 'Nie' };
// Wspólne etykiety dla formularza, podsumowania i przygotowanej wiadomości.
export const PROJECT_FIELDS = [
  { key: 'radioChoice', label: 'Czy masz radio Zigbee do centrali Home Assistant?', options: { unknown: 'Nie wiem', none: 'Nie mam — dobór i dostawa według potrzeb', p03: 'Mam SONOFF ZBDongle-E', p02: 'Mam Home Assistant Connect ZBT-2 (Zigbee)' } },
  { key: 'infrastructure', label: 'Warunki instalacji', options: { unknown: 'Nie wiem / wymaga sprawdzenia', ready: 'Sprawna sieć i gotowe punkty instalacji' } },
  { key: 'complexity', label: 'Stopień złożoności', options: { unknown: 'Do oceny przez AMPOWER', simple: 'Standardowe integracje, bez przebudowy', complex: 'Dodatkowa diagnostyka / złożone integracje' } },
  { key: 'simpleScenes', label: 'Dodatkowe proste automatyzacje — liczba' },
  { key: 'advancedScenes', label: 'Dodatkowe zaawansowane automatyzacje — liczba' },
  { key: 'support', label: 'Jednorazowe wsparcie po uruchomieniu', options: { none: 'Standardowe przekazanie', basic: 'Dodatkowe wsparcie podstawowe', extended: 'Dodatkowe wsparcie rozszerzone' } }
];
const control = { unknown: 'Nie wiem', central: 'Wspólna centrala / bramka', perDrive: 'Osobny sterownik na każdy napęd', buttons: 'Same przyciski', mixed: 'Układ mieszany' };
const heating = { unknown: 'Nie wiem', central: 'Regulator / bramka producenta', separate: 'Osobne sterowniki / termostaty' };
const heatFunction = { unknown: 'Nie wiem', read: 'Podgląd', control: 'Regulacja', both: 'Podgląd i regulacja' };
export const CATEGORIES = [
  { id: 'blinds', label: 'Rolety', count: 'Ile niezależnych rolet chcesz połączyć?', unit: 'napędy', help: 'Jedna roleta to jeden napęd, niezależnie od liczby przycisków. Centrala i sterownik na napęd to odrębne drogi integracji.', control, controlLabel: 'Jak sterujesz roletami?' },
  { id: 'lights', label: 'Oświetlenie', count: 'Ile obwodów lub niezależnych punktów smart?', unit: 'obwody / punkty', help: 'Kilka lamp sterowanych razem może być jednym obwodem.', control: { unknown: 'Nie wiem', central: 'Wspólna bramka', separate: 'Osobne sterowniki', buttons: 'Zwykłe włączniki', mixed: 'Układ mieszany' }, controlLabel: 'Jak sterujesz oświetleniem?' },
  { id: 'ac', label: 'Klimatyzacja', count: 'Ile jednostek wewnętrznych?', unit: 'jednostki wewnętrzne', control: { unknown: 'Nie wiem', central: 'Centrala / system producenta', separate: 'Osobne sterowniki', remote: 'Pilot' }, controlLabel: 'Jak sterujesz klimatyzacją?' },
  { id: 'heatPump', label: 'Pompa ciepła', count: 'Ile pomp chcesz objąć integracją?', unit: 'pompy', control: heating, controlLabel: 'Jaki jest regulator?', functions: heatFunction },
  { id: 'boiler', label: 'Kocioł / ogrzewanie', count: 'Ile źródeł ciepła lub regulatorów?', unit: 'źródła / regulatory', help: 'Strefy podłogówki podaj w osobnej kategorii.', control: heating, controlLabel: 'Jaki jest regulator?', functions: heatFunction },
  { id: 'floor', label: 'Podłogówka', count: 'Ile niezależnych stref temperatury?', unit: 'strefy temperatury', help: 'Kilka pętli na jednym termostacie to jedna strefa.', control: { unknown: 'Nie wiem', central: 'Jedna listwa / regulator', separate: 'Oddzielne termostaty', none: 'Brak sterowników' }, controlLabel: 'Jak sterujesz podłogówką?' },
  { id: 'pv', label: 'Fotowoltaika', count: 'Ile falowników lub systemów PV?', unit: 'falowniki / systemy', functions: { unknown: 'Nie wiem', read: 'Podgląd produkcji', broader: 'Szersza integracja' } },
  { id: 'storage', label: 'Magazyn energii', count: 'Ile systemów magazynowania?', unit: 'systemy magazynowania', help: 'Liczymy systemy, nie pojedyncze moduły baterii.', functions: { unknown: 'Nie wiem', read: 'Podgląd stanu', control: 'Sterowanie' } },
  { id: 'ev', label: 'EV / ładowarka', count: 'Ile ładowarek?', unit: 'ładowarki', functions: { unknown: 'Nie wiem', read: 'Podgląd', schedule: 'Harmonogram', power: 'Regulacja mocy' } },
  { id: 'gate', label: 'Brama', count: 'Ile niezależnych napędów?', unit: 'napędy', control: { unknown: 'Nie wiem', central: 'Wspólna centrala / bramka', separate: 'Osobne sterowniki', buttons: 'Pilot / przycisk' }, controlLabel: 'Jak sterujesz bramą?' },
  { id: 'security', label: 'Monitoring / alarm', security: true },
  { id: 'other', label: 'Inne', count: 'Ile urządzeń — jeśli wiesz?', unit: 'urządzenia' }
];
export const SECURITY = { unknown: 'Jeszcze nie wiem', monitoring: 'Monitoring', alarm: 'Alarm', both: 'Monitoring i alarm' };
