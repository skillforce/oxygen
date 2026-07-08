import boxingBags from '../assets/images/boxing-bags.avif';
import cardioEllipticals from '../assets/images/cardio-ellipticals.avif';
import cardioTreadmills from '../assets/images/cardio-treadmills.avif';
import dumbbells from '../assets/images/dumbbells.avif';
import fitbarNeon from '../assets/images/fitbar-neon.avif';
import functionalRack from '../assets/images/functional-rack.avif';
import functionalRed from '../assets/images/functional-red.avif';
import functionalRed2 from '../assets/images/functional-red2.avif';
import gymBenches from '../assets/images/gym-benches.avif';
import gymLegpress from '../assets/images/gym-legpress.avif';
import gymRacks from '../assets/images/gym-racks.avif';
import lockerKeypad2 from '../assets/images/locker-keypad2.avif';
import lockersBlue from '../assets/images/lockers-blue.avif';
import lockersPink from '../assets/images/lockers-pink.avif';
import loungeDivider from '../assets/images/lounge-divider.avif';
import loungePaintings from '../assets/images/lounge-paintings.avif';
import loungeSofa from '../assets/images/lounge-sofa.avif';
import matrixStation from '../assets/images/matrix-station.avif';
import oxygenCage from '../assets/images/oxygen-cage.avif';
import smithMachines from '../assets/images/smith-machines.avif';
import studioBuddha from '../assets/images/studio-buddha.avif';
import studioCorner from '../assets/images/studio-corner.avif';
import studioMirror from '../assets/images/studio-mirror.avif';

export const site = {
  brand: 'OXYGEN FITNESS',
  phoneHref: 'tel:+375447257979',
  instagramHref: 'https://www.instagram.com/oxygen_fitness_/',
  instagramLabel: '@oxygen_fitness_',
  addressLine: 'г. Могилёв, ул. Чигринова 2А',
  addressStreet: 'ул. Чигринова, 2А',
  addressCity: 'Могилёв, Беларусь',
  summary: 'Тренажёрный зал. Кардио зона. Персональные тренировки. г. Могилёв, ул. Чигринова 2А.',
  accreditation: '791285911',
};

export const navLinks = [
  { href: '#programs', label: 'Программы' },
  { href: '#gallery', label: 'Клуб' },
  { href: site.phoneHref, label: 'Записаться' },
];

export const hours = [
  { label: 'Пн — Пт', from: '08:00', to: '22:00' },
  { label: 'Сб — Вс', from: '09:00', to: '18:00' },
];

export const programs = [
  {
    number: '01',
    label: 'Тренажёрный зал',
    className: 'c-1',
    image: gymRacks,
    alt: 'Силовая зона со стойками и свободными весами Oxygen Fitness.',
    title: { before: 'Железо. ', emphasis: 'Без', after: ' очередей.' },
    description: 'Свободные веса, тренажёры, кардио зона — всё под одной крышей. Открыто с 8:00 до 22:00, без записи.',
  },
  {
    number: '02',
    label: 'Кардио зона',
    className: 'c-2',
    image: cardioTreadmills,
    alt: 'Кардиозона: беговые дорожки и эллипсы.',
    title: { before: 'Мотор, ', emphasis: 'а не', after: ' марафон.' },
    description: 'Беговые дорожки, эллипсы, гребные. Интервалы — по пульсу, а не на глаз.',
  },
  {
    number: '03',
    label: 'Персональные',
    className: 'c-3',
    image: boxingBags,
    alt: 'Персональная тренировка у боксёрского мешка Oxygen.',
    title: { before: 'Один на ', emphasis: 'один.', after: '' },
    description: 'Программа под твою цель, разбор техники, измеримый прогресс.',
  },
  {
    number: '04',
    label: 'Сплит',
    className: 'c-4',
    image: functionalRed,
    alt: 'Кроссфит зона с рамами и свободным пространством.',
    title: { before: 'Тренируйся ', emphasis: 'вдвоём.', after: '' },
    description: 'Парные занятия с тренером — для пары, друзей или коллег. Один протокол, две скорости.',
  },
  {
    number: '05',
    label: 'Семья и дети',
    className: 'c-5',
    image: loungeSofa,
    alt: 'Зона отдыха с диванами и картинами.',
    title: { before: 'Зал для ', emphasis: 'всех.', after: '' },
    description: 'Пришёл с ребёнком — есть где присмотреть и подождать, пока тренируешься.',
  },
];

export const galleryImages = [
  { src: fitbarNeon, alt: 'Fit bar клуба с неоновой вывеской OXYGEN и барными стульями.' },
  { src: oxygenCage, alt: 'Проход тренажёрного зала с фирменной вывеской OXYGEN и живыми растениями.' },
  { src: gymLegpress, alt: 'Зона жимов ногами и силовые тренажёры Oxygen Fitness.' },
  { src: gymBenches, alt: 'Зал со скамьями для жима и кирпичными колоннами.' },
  { src: smithMachines, alt: 'Машины Смита и силовые рамы клуба.' },
  { src: dumbbells, alt: 'Гантельный ряд и зона свободных весов.' },
  { src: matrixStation, alt: 'Мультистанция Matrix у панорамных окон.' },
  { src: cardioEllipticals, alt: 'Ряд эллиптических тренажёров у окна с синими светильниками.' },
  { src: boxingBags, alt: 'Зона бокса с фирменными мешками OXYGEN.' },
  { src: functionalRack, alt: 'Функциональная стойка с медболами, гирями и сэндбэгами.' },
  { src: functionalRed2, alt: 'Функциональная зона с красными рамами и газоном.' },
  { src: studioMirror, alt: 'Зеркальный зал групповых занятий с балетным станком.' },
  { src: studioBuddha, alt: 'Студия с муралом Будды и деревянным полом.' },
  { src: studioCorner, alt: 'Уголок студии с фитболами и ковриками у станка.' },
  { src: loungePaintings, alt: 'Зона отдыха с диваном и фирменными картинами на синей стене.' },
  { src: loungeDivider, alt: 'Лаунж с чёрной рейкой-перегородкой и синими креслами.' },
  { src: lockersBlue, alt: 'Раздевалка с серыми шкафчиками и синей подсветкой.' },
  { src: lockersPink, alt: 'Раздевалка с рядами шкафчиков и скамьями.' },
  { src: lockerKeypad2, alt: 'Кодовая панель замка шкафчика крупным планом.' },
];

export const plans = [
  {
    name: 'Месяц',
    price: '120',
    period: 'руб. / 1 мес.',
    items: [
      'Безлимитный доступ в тренажёрный зал',
      'Кардио зона включена',
    ],
  },
  {
    name: '3 месяца',
    price: '290',
    period: 'руб. / 3 мес.',
    items: [
      '≈ 97 руб. в месяц',
      'Экономия 70 руб. против помесячного',
      'Безлимитный доступ в тренажёрный зал',
    ],
  },
  {
    name: '6 месяцев',
    price: '510',
    period: 'руб. / 6 мес.',
    items: [
      '85 руб. в месяц',
      '2 заморозки по 7 дней',
      'Приоритет на персональные слоты',
    ],
  },
  {
    name: 'Годовой',
    note: 'лучшее решение',
    price: '900',
    period: 'руб./ 12 мес.',
    featured: true,
    items: [
      '75 руб. в месяц — минимальный тариф',
      'Экономия 540 руб. против помесячного',
      'Безлимитный доступ весь год',
    ],
  },
];

export const priceGroups = [
  {
    title: 'Разовые посещения',
    rows: [
      { name: 'Разовое посещение', value: '25', unit: 'руб.' },
      { name: 'Разовое', detail: 'детский', value: '10', unit: 'руб.' },
      { name: 'Абонемент 4 занятия', detail: '1 мес.', value: '60', unit: 'руб.' },
      { name: 'Абонемент 8 занятий', detail: '1 мес.', value: '95', unit: 'руб.' },
    ],
  },
  {
    title: 'Специальные абонементы',
    rows: [
      { name: 'Безлимит «утро»', detail: '8:00 – 16:00 · 1 мес.', value: '105', unit: 'руб.' },
      { name: 'Безлимит для студентов', detail: '1 мес.', value: '100', unit: 'руб.' },
      { name: '«Семейный»', detail: '2 чел. · 1 мес.', value: '200', unit: 'руб.' },
      { name: '«Семейный»', detail: '2 чел. · 3 мес.', value: '480', unit: 'руб.' },
    ],
  },
  {
    title: 'Тренировки и доп. услуги',
    rows: [
      { name: 'Занятие с тренером', value: '25 / 30', unit: 'руб.' },
      { name: 'Сплит', detail: '2 человека', value: '40 / 50', unit: 'руб.' },
      { name: 'Заморозка', detail: '7 дней', value: '15', unit: 'руб.' },
    ],
  },
  {
    title: 'Зал групповых занятий (направление интенсив)',
    rows: [
      { name: 'Разовое посещение', value: '15', unit: 'руб.' },
      { name: 'Абонемент 8 занятий', value: '110', unit: 'руб.' },
    ],
  },
];

export const footerClubLinks = [
  { href: '#programs', label: 'Зоны и форматы' },
  { href: '#gallery', label: 'Фото клуба' },
  { href: '#join', label: 'Цены' },
];
