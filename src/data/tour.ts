/**
 * Runtime configuration for the production tour and its floor plan.
 *
 * Hand-maintained: a point's place on the plan, its links and its arrow
 * offsets are all judged against the panoramas, not computed.
 *
 * Arrow directions are derived at runtime from x/y: the
 * bearing from one point to its neighbour on the plan is the arrow's yaw. Move
 * a point and every arrow into and out of it follows. `arrows` nudges an arrow
 * off that bearing, for the link whose doorway is not on the straight line
 * between the two points; every link carries one, 0 where the bearing is right.
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
  /**
   * Per-link nudge in degrees on top of the derived bearing, clockwise, aimed
   * by dragging the arrow in the editor. One entry per link: 0 means the plain
   * bearing points at the doorway, anything else that it does not.
   */
  arrows?: Record<string, number>;
};

export const tourPlan = {
  imageUrl: '/tour/plan.svg',
  width: 839,
  height: 770,
  widgetSize: '260px',
} as const;

export const tourStartNodeId = 'P02';

export const tourNodes: Record<string, TourNode> = {
  P02: { name: 'Лаунж', caption: 'Лаунж и фитнес-бар у ресепшена', x: 158, y: 397, north: 24, links: ['P18'], arrows: { P18: -30 } },
  P03: { name: 'Студия', caption: 'Зал групповых программ', x: 361, y: 230, north: 185, links: ['P18'], arrows: { P18: 139 } },
  P04: { name: 'Функциональная зона', caption: 'Вход в зал — функциональная зона', x: 649, y: 357, north: 182, links: ['P05', 'P08', 'P18'], arrows: { P05: -176, P08: 175, P18: -175 } },
  P05: { name: 'Мужская раздевалка', caption: 'Мужская раздевалка', x: 649, y: 229, north: 8, links: ['P04', 'P07'], arrows: { P04: -10, P07: -55 } },
  P07: { name: 'Мужская душевая', caption: 'Мужская душевая', x: 742, y: 188, north: 0, links: ['P05'], arrows: { P05: -72 } },
  P08: { name: 'Функциональная зона', caption: 'Тренажёрный зал — функциональная зона', x: 646, y: 468, north: 0, links: ['P04', 'P09', 'P10', 'P11'], arrows: { P04: -179, P09: 174, P10: 177, P11: 177 } },
  P09: { name: 'Функциональная зона', caption: 'Силовая рама и зона функционального тренинга', x: 748, y: 473, north: 0, links: ['P08'], arrows: { P08: 178 } },
  P10: { name: 'Блочные тренажёры', caption: 'Тренажёрный зал — блочные тренажёры', x: 417, y: 421, north: 0, links: ['P08', 'P12'], arrows: { P08: 178, P12: 175 } },
  P11: { name: 'Силовые тренажёры', caption: 'Тренажёрный зал — силовые тренажёры', x: 644, y: 595, north: 0, links: ['P08', 'P12', 'P16'], arrows: { P08: -180, P12: -180, P16: -178 } },
  P12: { name: 'Силовая рама', caption: 'Тренажёрный зал — силовая рама и скамьи', x: 414, y: 593, north: 0, links: ['P10', 'P11', 'P13', 'P15'], arrows: { P10: -177, P11: -174, P13: -170, P15: -176 } },
  P13: { name: 'Свободные веса', caption: 'Тренажёрный зал — зона свободных весов', x: 186, y: 586, north: 0, links: ['P12', 'P14'], arrows: { P12: -177, P14: -177 } },
  P14: { name: 'Кроссоверы', caption: 'Тренажёрный зал — кроссоверы', x: 187, y: 672, north: 0, links: ['P13', 'P15'], arrows: { P13: 175, P15: -175 } },
  P15: { name: 'Беговые дорожки', caption: 'Кардиозона — беговые дорожки', x: 417, y: 669, north: 0, links: ['P12', 'P14', 'P16'], arrows: { P12: 175, P14: 179, P16: 179 } },
  P16: { name: 'Беговые дорожки', caption: 'Кардиозона — беговые дорожки', x: 644, y: 666, north: 10, links: ['P11', 'P15', 'P17'], arrows: { P11: 174, P15: 178, P17: 174 } },
  P17: { name: 'Зона бокса', caption: 'Зона бокса и велотренажёров', x: 741, y: 668, north: 0, links: ['P16'], arrows: { P16: 179 } },
  P18: { name: 'Коридор', caption: 'Коридор между лаунжем и раздевалками', x: 228, y: 327, north: 355, links: ['P02', 'P03', 'P04', 'P19'], arrows: { P02: 0, P03: 0, P04: -1, P19: 0 } },
  P19: { name: 'Женская раздевалка', caption: 'Женская раздевалка', x: 227, y: 95, north: 262, links: ['P18', 'P21'], arrows: { P18: 84, P21: 93 } },
  P21: { name: 'Женская раздевалка', caption: 'Женская раздевалка', x: 109, y: 111, north: 15, links: ['P19', 'P22'], arrows: { P19: 108, P22: 41 } },
  P22: { name: 'Женская душевая', caption: 'Женская душевая', x: 94, y: 162, north: 0, links: ['P21'], arrows: { P21: 104 } },
};
