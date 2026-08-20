// GERADO POR scripts/logo-svg.py — NAO EDITAR A MAO.
//
// Os contornos do letreiro "FayAi" tirados da Inter Bold, ja no sistema de
// tela (Y para baixo, origem na caixa de tinta). Um `d` daqui pode ir direto
// para um `<path>` do React ou para `new Path2D(d)` no canvas do favicon —
// e por isso que o desenho do cabecalho, o do loader e o do favicon nunca
// divergem: e o mesmo contorno.
//
// Regerar:  python scripts/logo-svg.py

export interface GlifoDaMarca {
  /** A letra, para depuracao — o desenho nao depende dela. */
  ch: string;
  /** `true` no "Ai": a metade colorida, e a que enche no carregamento. */
  acento: boolean;
  d: string;
}

export const MARCA = {
  "largura": 5461,
  "altura": 1998,
  "caixaDoAcento": [
    3538,
    0,
    5461,
    1572
  ],
  "simbolo": {
    "lado": 512,
    "escala": 0.124,
    "dx": 97.28,
    "dy": 153.45,
    "caixa": [
      97.28,
      163.62,
      414.72,
      348.38
    ],
    "caixaDoAcento": [
      237.28,
      163.62,
      414.72,
      348.38
    ],
    "glifos": [
      {
        "d": "M0 1572V82H980V335H305V751H914V1000H305V1572Z",
        "acento": false,
        "dx": 0.0
      },
      {
        "d": "M3538 1572 4047 82H4447L4969 1572H4630L4391 853Q4348 714 4303.5 548.5Q4259 383 4210 187H4277Q4229 384 4187.5 550.5Q4146 717 4105 853L3875 1572ZM3856 1226V987H4651V1226Z",
        "acento": true,
        "dx": -2409.0
      }
    ]
  },
  "glifos": [
    {
      "ch": "F",
      "acento": false,
      "d": "M0 1572V82H980V335H305V751H914V1000H305V1572Z"
    },
    {
      "ch": "a",
      "acento": false,
      "d": "M1507 1594Q1401 1594 1316.5 1556.5Q1232 1519 1183.5 1444.5Q1135 1370 1135 1259Q1135 1166 1169.5 1103.0Q1204 1040 1263.5 1002.0Q1323 964 1398.5 944.0Q1474 924 1557 916Q1654 906 1713.5 897.5Q1773 889 1800.5 870.5Q1828 852 1828 816V811Q1828 763 1808.0 730.0Q1788 697 1748.5 679.5Q1709 662 1653 662Q1595 662 1552.0 679.5Q1509 697 1482.0 726.0Q1455 755 1442 791L1167 746Q1196 648 1263.0 580.0Q1330 512 1429.5 476.0Q1529 440 1654 440Q1744 440 1829.0 461.5Q1914 483 1981.5 528.0Q2049 573 2088.5 645.5Q2128 718 2128 819V1572H1844V1417H1834Q1807 1469 1762.0 1508.5Q1717 1548 1653.5 1571.0Q1590 1594 1507 1594ZM1592 1383Q1663 1383 1716.5 1355.0Q1770 1327 1800.0 1279.0Q1830 1231 1830 1172V1051Q1817 1061 1790.0 1069.0Q1763 1077 1730.0 1083.0Q1697 1089 1665.0 1094.0Q1633 1099 1608 1102Q1553 1110 1511.0 1128.0Q1469 1146 1446.0 1175.5Q1423 1205 1423 1251Q1423 1294 1445.0 1323.5Q1467 1353 1505.0 1368.0Q1543 1383 1592 1383Z"
    },
    {
      "ch": "y",
      "acento": false,
      "d": "M2376 1968 2445 1742 2482 1751Q2542 1767 2589.0 1760.0Q2636 1753 2664.5 1722.0Q2693 1691 2699 1635L2707 1575L2287 454H2606L2794 1034Q2828 1144 2849.5 1254.0Q2871 1364 2899 1484H2829Q2856 1364 2883.0 1253.5Q2910 1143 2946 1034L3142 454H3457L2982 1704Q2948 1794 2895.0 1860.0Q2842 1926 2763.0 1962.0Q2684 1998 2572 1998Q2512 1998 2460.0 1989.5Q2408 1981 2376 1968Z"
    },
    {
      "ch": "A",
      "acento": true,
      "d": "M3538 1572 4047 82H4447L4969 1572H4630L4391 853Q4348 714 4303.5 548.5Q4259 383 4210 187H4277Q4229 384 4187.5 550.5Q4146 717 4105 853L3875 1572ZM3856 1226V987H4651V1226Z"
    },
    {
      "ch": "i",
      "acento": true,
      "d": "M5146 1572V454H5446V1572ZM5296 308Q5228 308 5180.0 263.0Q5132 218 5132 154Q5132 90 5180.0 45.0Q5228 0 5296 0Q5364 0 5412.5 44.5Q5461 89 5461 154Q5461 218 5412.5 263.0Q5364 308 5296 308Z"
    }
  ]
} as const;

/** Caixa de tinta do letreiro inteiro, em unidades do viewBox. */
export const LARGURA = MARCA.largura;
export const ALTURA = MARCA.altura;

/** So o "Ai" — [x0, y0, x1, y1]. O recipiente do enchimento. */
export const CAIXA_DO_ACENTO = MARCA.caixaDoAcento;

export const GLIFOS: readonly GlifoDaMarca[] = MARCA.glifos;
