/**
 * Runtime configuration for the production tour and its floor plan.
 *
 * Arrow directions are derived at runtime from x/y: the
 * bearing from one point to its neighbour on the plan is the arrow's yaw. Move
 * a point and every arrow into and out of it follows.
 *
 * `north` is the one number that cannot be derived: how far the panorama is
 * rotated relative to the plan. 0 means the panorama's yaw 0 already faces the
 * top of the plan.
 */

export type TourNode = {
  name: string;
  caption: string;
  /** position on the floor plan, in pixels of `tourPlan.imageUrl` */
  x: number;
  y: number;
  /** degrees to rotate the panorama so its yaw 0 faces the top of the plan */
  north: number;
  /** ids this point can walk to; links are reciprocal by construction */
  links: string[];
};

export const tourPlan = {
  imageUrl: '/tour/plan.svg',
  width: 839,
  height: 770,
  widgetSize: '260px',
} as const;

export const tourStartNodeId = 'T008';

export const tourNodes: Record<string, TourNode> = {
  T008: { name: 'Ресепшен', caption: 'Ресепшен и зона лобби', x: 156, y: 408, north: 182, links: ['T010', 'T012', 'T078'] },
  T010: { name: 'Ресепшен', caption: 'Ресепшен и зона лобби', x: 74, y: 460, north: 182, links: ['T008'] },
  T012: { name: 'Ресепшен', caption: 'Ресепшен и зона лобби', x: 234, y: 362, north: 6, links: ['T008', 'T015', 'T023'] },
  T015: { name: 'Коридор к раздевалке', caption: 'Коридор вдоль туалета к женской раздевалке', x: 220, y: 260, north: 14, links: ['T012', 'T016', 'T017'] },
  T016: { name: 'Санузел', caption: 'Санузел за ресепшеном', x: 128, y: 242, north: 360, links: ['T015'] },
  T017: { name: 'Вход в раздевалку', caption: 'Тамбур женской раздевалки', x: 218, y: 192, north: 355, links: ['T015', 'T018', 'T019'] },
  T018: { name: 'Женская душевая', caption: 'Женская душевая — первая дверь в раздевалке', x: 98, y: 164, north: 359, links: ['T017'] },
  T019: { name: 'Женская раздевалка', caption: 'Женская раздевалка', x: 216, y: 116, north: 1, links: ['T017', 'T021'] },
  T021: { name: 'Женская раздевалка', caption: 'Женская раздевалка', x: 114, y: 80, north: 1, links: ['T019'] },
  T023: { name: 'Коридор между раздевалками', caption: 'Коридор между женской и мужской раздевалками', x: 324, y: 310, north: 265, links: ['T012', 'T025', 'T027'] },
  T025: { name: 'Зал групповых занятий', caption: 'Студия групповых программ', x: 316, y: 210, north: 357, links: ['T023'] },
  T027: { name: 'Коридор между раздевалками', caption: 'Коридор между женской и мужской раздевалками', x: 464, y: 312, north: 270, links: ['T023', 'T028'] },
  T028: { name: 'Коридор между раздевалками', caption: 'Коридор между женской и мужской раздевалками', x: 688, y: 318, north: 357, links: ['T027', 'T030', 'T035'] },
  T030: { name: 'Мужская раздевалка', caption: 'Мужская раздевалка', x: 648, y: 216, north: 359, links: ['T028', 'T033'] },
  T032: { name: 'Мужская душевая', caption: 'Мужская душевая — единственный вход из раздевалки', x: 722, y: 172, north: 360, links: ['T033'] },
  T033: { name: 'Мужская раздевалка', caption: 'Мужская раздевалка — выход в зал', x: 684, y: 172, north: 3, links: ['T030', 'T032'] },
  T035: { name: 'Функциональная зона', caption: 'Тренажёрный зал — функциональная зона', x: 692, y: 398, north: 182, links: ['T028', 'T038', 'T061'] },
  T038: { name: 'Функциональная зона', caption: 'Тренажёрный зал — функциональная зона', x: 698, y: 566, north: 182, links: ['T035', 'T059', 'T067'] },
  T042: { name: 'Центральные тренажёры', caption: 'Тренажёрный зал — центральные тренажёры', x: 574, y: 674, north: 92, links: ['T044', 'T066', 'T067'] },
  T044: { name: 'Центральные тренажёры', caption: 'Тренажёрный зал — центральные тренажёры', x: 366, y: 676, north: 356, links: ['T042', 'T070'] },
  T049: { name: 'Центральные тренажёры', caption: 'Тренажёрный зал — центральные тренажёры', x: 306, y: 462, north: 359, links: ['T051'] },
  T051: { name: 'Рама и дорожки', caption: 'Тренажёрный зал — силовая рама и беговые дорожки', x: 304, y: 578, north: 354, links: ['T049', 'T070'] },
  T059: { name: 'Рама и дорожки', caption: 'Тренажёрный зал — силовая рама и беговые дорожки', x: 764, y: 482, north: 358, links: ['T038'] },
  T061: { name: 'Рама и дорожки', caption: 'Тренажёрный зал — силовая рама и беговые дорожки', x: 764, y: 376, north: 358, links: ['T035'] },
  T062: { name: 'Силовые тренажёры', caption: 'Тренажёрный зал — силовые тренажёры', x: 582, y: 474, north: 2, links: ['T064'] },
  T064: { name: 'Силовые тренажёры', caption: 'Тренажёрный зал — силовые тренажёры', x: 584, y: 548, north: 358, links: ['T062', 'T066'] },
  T066: { name: 'Силовые тренажёры', caption: 'Тренажёрный зал — силовые тренажёры', x: 516, y: 624, north: 356, links: ['T042', 'T064'] },
  T067: { name: 'Силовые тренажёры', caption: 'Тренажёрный зал — силовые тренажёры', x: 718, y: 672, north: 87, links: ['T038', 'T042'] },
  T070: { name: 'Силовые тренажёры', caption: 'Тренажёрный зал — силовые тренажёры', x: 262, y: 640, north: 4, links: ['T044', 'T051', 'T073'] },
  T073: { name: 'Свободные веса', caption: 'Тренажёрный зал — зона свободных весов', x: 158, y: 682, north: 5, links: ['T070', 'T075'] },
  T075: { name: 'Свободные веса', caption: 'Тренажёрный зал — зона свободных весов', x: 82, y: 624, north: 4, links: ['T073', 'T077'] },
  T077: { name: 'Переход в лаунж', caption: 'Переход из зала в лаунж', x: 80, y: 546, north: 355, links: ['T075'] },
  T078: { name: 'Лаунж', caption: 'Лаунж и зона ожидания', x: 232, y: 488, north: 1, links: ['T008'] },
};
