/**
 * High-resolution, topologically exact geographic dataset for India Atlas.
 *
 * Uses a shared-arc topology (NODES + ARCS + buildRing) so adjacent Indian
 * States/Union Territories and neighboring countries share identical boundary
 * vertices—eliminating gaps, overlaps, or jagged polygons while preserving
 * authentic real-world coastlines and official sovereign borders of India.
 *
 * Coordinates are [longitude, latitude] in WGS84 decimal degrees.
 */

export type LonLat = [number, number];

export interface IndianCity {
  id: string;
  name: string;
  state: string;
  lat: number;
  lon: number;
  municipalRadiusKm: number;
  tier: 1 | 2;
}

export interface StateRegion {
  id: string;
  name: string;
  abbr: string;
  toneIndex: number;
  labelCoord: LonLat;
  hideLabel?: boolean;
  polygon: LonLat[];
  extraPolygons?: LonLat[][];
}

export interface NeighborCountry {
  id: string;
  name: string;
  labelCoord: LonLat;
  fontSize?: number;
  hideLabel?: boolean;
  polygon: LonLat[];
}

// ============================================================================
// TOPOLOGICAL TRI-JUNCTION & BORDER NODES
// ============================================================================
const NODES = {
  SIR_CREEK: [68.15, 23.74] as LonLat,
  GJ_RJ_PAK: [71.08, 24.66] as LonLat,
  RJ_PB_PAK: [73.86, 29.96] as LonLat,
  PB_JK_PAK: [74.54, 32.38] as LonLat,
  JK_LA_PAK: [74.12, 34.86] as LonLat,
  LA_AFG_PAK: [74.05, 36.88] as LonLat,
  LA_AFG_CHN: [74.89, 37.08] as LonLat,
  LA_HP_CHN: [78.60, 32.08] as LonLat,
  JK_LA_HP: [76.42, 32.92] as LonLat,
  PB_JK_HP: [75.84, 32.51] as LonLat,
  PB_HR_HP: [76.88, 30.78] as LonLat,
  PB_HR_CH_N: [76.78, 30.78] as LonLat,
  PB_HR_CH_S: [76.82, 30.69] as LonLat,
  HP_UK_CHN: [79.08, 31.42] as LonLat,
  HP_UK_HR: [77.58, 30.42] as LonLat,
  HR_UK_UP: [77.56, 30.35] as LonLat,
  PB_HR_RJ: [74.70, 29.88] as LonLat,
  HR_DL_N: [77.12, 28.88] as LonLat,
  UP_DL_S: [77.33, 28.48] as LonLat,
  HR_RJ_UP: [77.45, 27.90] as LonLat,
  UK_UP_NPL: [80.22, 29.02] as LonLat,
  UK_NPL_CHN: [81.03, 30.22] as LonLat,

  UP_BR_NPL: [83.88, 27.43] as LonLat,
  BR_WB_NPL: [88.12, 26.62] as LonLat,
  WB_SK_NPL: [88.01, 27.20] as LonLat,
  SK_NPL_CHN: [88.14, 27.88] as LonLat,
  SK_BTN_CHN: [88.91, 27.42] as LonLat,
  WB_SK_BTN: [88.88, 27.09] as LonLat,
  WB_AS_BTN: [89.86, 26.72] as LonLat,
  AS_AR_BTN: [92.11, 26.86] as LonLat,
  AR_BTN_CHN: [91.61, 27.78] as LonLat,
  AR_CHN_MMR: [97.35, 28.22] as LonLat,
  AR_NL_MMR: [95.36, 26.76] as LonLat,
  AS_AR_NL: [95.48, 27.20] as LonLat,
  AS_NL_MN: [93.62, 25.40] as LonLat,
  NL_MN_MMR: [94.75, 25.58] as LonLat,
  AS_MN_MZ: [93.08, 24.75] as LonLat,
  MN_MZ_MMR: [93.36, 23.96] as LonLat,
  AS_MZ_TR: [92.34, 24.36] as LonLat,
  TR_MZ_BGD: [92.28, 23.72] as LonLat,
  MZ_BGD_MMR: [92.60, 21.94] as LonLat,
  AS_TR_BGD: [92.24, 24.42] as LonLat,
  AS_ML_BGD_E: [92.42, 25.03] as LonLat,
  AS_ML_BGD_W: [89.87, 25.73] as LonLat,
  WB_AS_BGD: [89.83, 26.15] as LonLat,
  WB_BGD_SEA: [89.10, 21.62] as LonLat,

  UP_MP_RJ: [77.88, 26.82] as LonLat,
  UP_MP_CG: [82.78, 23.95] as LonLat,
  UP_CG_JH: [83.34, 24.16] as LonLat,
  UP_BR_JH: [83.50, 24.48] as LonLat,
  BR_JH_WB: [87.84, 25.25] as LonLat,
  JH_WB_OD: [86.74, 22.25] as LonLat,
  WB_OD_SEA: [87.48, 21.58] as LonLat,
  JH_CG_OD: [84.10, 22.58] as LonLat,
  MP_RJ_GJ: [74.44, 23.16] as LonLat,
  GJ_MP_MH: [74.38, 22.02] as LonLat,
  GJ_MH_SEA: [72.76, 20.16] as LonLat,
  MP_CG_MH: [80.62, 21.62] as LonLat,
  CG_OD_AP: [81.45, 17.82] as LonLat,
  CG_TG_AP: [80.92, 17.72] as LonLat,
  MH_CG_TG: [80.32, 19.12] as LonLat,
  OD_AP_SEA: [84.78, 19.08] as LonLat,
  MH_TG_KA: [77.45, 18.42] as LonLat,
  TG_AP_KA: [77.38, 16.25] as LonLat,
  MH_GA_KA: [74.22, 15.72] as LonLat,
  MH_GA_SEA: [73.68, 15.72] as LonLat,
  GA_KA_SEA: [74.08, 14.89] as LonLat,
  KA_AP_TN: [78.48, 12.82] as LonLat,
  AP_TN_SEA: [80.33, 13.52] as LonLat,
  KA_KL_SEA: [74.88, 12.76] as LonLat,
  KA_KL_TN: [76.34, 11.68] as LonLat,
  KL_TN_SEA: [77.12, 8.28] as LonLat,

  // Neighboring outer junction nodes
  PAK_AFG_IRN: [60.86, 29.86] as LonLat,
  PAK_IRN_SEA: [61.62, 25.16] as LonLat,
  AFG_CHN_TJK: [74.92, 37.35] as LonLat,
  BGD_MMR_SEA: [92.28, 20.78] as LonLat,
  CHN_MMR_LAO: [100.15, 21.55] as LonLat,
};

// ============================================================================
// HIGH-RESOLUTION SHARED BOUNDARY ARCS
// ============================================================================
const defineArcs = <T extends Record<string, LonLat[]>>(arcs: T): T => arcs;

const ARCS = defineArcs({
  // --- International Borders of India ---
  border_gj_pak: [
    NODES.SIR_CREEK,
    [68.42, 24.08],
    [68.78, 24.22],
    [69.18, 24.28],
    [69.65, 24.38],
    [70.18, 24.48],
    [70.68, 24.62],
    NODES.GJ_RJ_PAK,
  ],
  border_rj_pak: [
    NODES.GJ_RJ_PAK,
    [70.82, 25.08],
    [70.48, 25.45],
    [70.18, 25.85],
    [69.85, 26.25],
    [69.54, 26.78],
    [69.82, 27.28],
    [70.28, 27.78],
    [70.85, 28.05],
    [71.48, 28.28],
    [72.12, 28.58],
    [72.75, 28.98],
    [73.25, 29.32],
    [73.58, 29.68],
    NODES.RJ_PB_PAK,
  ],
  border_pb_pak: [
    NODES.RJ_PB_PAK,
    [73.92, 30.22],
    [74.18, 30.58],
    [74.48, 30.92],
    [74.56, 31.18],
    [74.48, 31.48],
    [74.56, 31.76],
    [74.66, 32.02],
    [74.52, 32.22],
    NODES.PB_JK_PAK,
  ],
  border_jk_pak: [
    NODES.PB_JK_PAK,
    [74.68, 32.58],
    [74.52, 32.85],
    [74.18, 33.16],
    [73.92, 33.48],
    [73.76, 33.82],
    [73.68, 34.18],
    [73.55, 34.48],
    [73.85, 34.68],
    NODES.JK_LA_PAK,
  ],
  border_la_pak: [
    NODES.JK_LA_PAK,
    [73.62, 35.12],
    [73.12, 35.48],
    [72.68, 35.85],
    [72.48, 36.22],
    [72.62, 36.58],
    [73.02, 36.82],
    [73.55, 36.92],
    NODES.LA_AFG_PAK,
  ],
  border_la_afg: [
    NODES.LA_AFG_PAK,
    [74.42, 36.98],
    NODES.LA_AFG_CHN,
  ],
  border_la_chn: [
    NODES.LA_AFG_CHN,
    [75.42, 37.02],
    [75.98, 36.82],
    [76.45, 36.52],
    [76.95, 36.22],
    [77.38, 35.92],
    [77.82, 35.58],
    [78.22, 35.68],
    [78.68, 35.86],
    [79.18, 35.78],
    [79.58, 35.58],
    [79.92, 35.18],
    [80.18, 34.72],
    [80.26, 34.35],
    [79.88, 33.98],
    [79.52, 33.68],
    [79.35, 33.25],
    [79.18, 32.85],
    [78.88, 32.42],
    NODES.LA_HP_CHN,
  ],
  border_hp_chn: [
    NODES.LA_HP_CHN,
    [78.58, 31.82],
    [78.82, 31.58],
    NODES.HP_UK_CHN,
  ],
  border_uk_chn: [
    NODES.HP_UK_CHN,
    [79.48, 31.12],
    [79.98, 30.88],
    [80.42, 30.58],
    [80.82, 30.35],
    NODES.UK_NPL_CHN,
  ],
  border_uk_npl: [
    NODES.UK_NPL_CHN,
    [80.72, 29.92],
    [80.32, 29.55],
    [80.18, 29.25],
    NODES.UK_UP_NPL,
  ],
  border_up_npl: [
    NODES.UK_UP_NPL,
    [80.12, 28.72],
    [80.58, 28.52],
    [81.12, 28.32],
    [81.58, 28.08],
    [82.08, 27.85],
    [82.65, 27.58],
    [83.18, 27.42],
    [83.58, 27.38],
    NODES.UP_BR_NPL,
  ],
  border_br_npl: [
    NODES.UP_BR_NPL,
    [84.28, 27.35],
    [84.68, 27.08],
    [85.18, 26.85],
    [85.72, 26.68],
    [86.28, 26.55],
    [86.82, 26.48],
    [87.38, 26.42],
    [87.85, 26.48],
    NODES.BR_WB_NPL,
  ],
  border_wb_npl: [
    NODES.BR_WB_NPL,
    [88.14, 26.88],
    NODES.WB_SK_NPL,
  ],
  border_sk_npl: [
    NODES.WB_SK_NPL,
    [88.02, 27.52],
    NODES.SK_NPL_CHN,
  ],
  border_sk_chn: [
    NODES.SK_NPL_CHN,
    [88.58, 28.12],
    [88.86, 27.82],
    NODES.SK_BTN_CHN,
  ],
  border_sk_btn: [
    NODES.SK_BTN_CHN,
    [88.90, 27.25],
    NODES.WB_SK_BTN,
  ],
  border_wb_btn: [
    NODES.WB_SK_BTN,
    [89.18, 26.95],
    [89.52, 26.82],
    NODES.WB_AS_BTN,
  ],
  border_as_btn: [
    NODES.WB_AS_BTN,
    [90.28, 26.82],
    [90.88, 26.85],
    [91.48, 26.82],
    NODES.AS_AR_BTN,
  ],
  border_ar_btn: [
    NODES.AS_AR_BTN,
    [91.88, 27.08],
    [91.62, 27.45],
    NODES.AR_BTN_CHN,
  ],
  border_ar_chn: [
    NODES.AR_BTN_CHN,
    [92.05, 27.88],
    [92.65, 27.95],
    [93.28, 28.18],
    [93.88, 28.58],
    [94.45, 28.98],
    [95.08, 29.22],
    [95.68, 29.38],
    [96.22, 29.42],
    [96.68, 29.15],
    [97.08, 28.72],
    NODES.AR_CHN_MMR,
  ],
  border_ar_mmr: [
    NODES.AR_CHN_MMR,
    [97.41, 27.82],
    [97.18, 27.22],
    [96.75, 27.05],
    [96.18, 26.98],
    [95.72, 26.88],
    NODES.AR_NL_MMR,
  ],
  border_nl_mmr: [
    NODES.AR_NL_MMR,
    [95.18, 26.42],
    [94.92, 25.98],
    NODES.NL_MN_MMR,
  ],
  border_mn_mmr: [
    NODES.NL_MN_MMR,
    [94.68, 25.12],
    [94.56, 24.62],
    [94.32, 24.18],
    [93.92, 23.95],
    NODES.MN_MZ_MMR,
  ],
  border_mz_mmr: [
    NODES.MN_MZ_MMR,
    [93.42, 23.48],
    [93.36, 22.92],
    [93.22, 22.42],
    [93.02, 21.98],
    NODES.MZ_BGD_MMR,
  ],
  border_mz_bgd: [
    NODES.MZ_BGD_MMR,
    [92.42, 22.28],
    [92.34, 22.85],
    [92.28, 23.35],
    NODES.TR_MZ_BGD,
  ],
  border_tr_bgd: [
    NODES.TR_MZ_BGD,
    [92.05, 23.38],
    [91.74, 22.96],
    [91.42, 23.15],
    [91.16, 23.48],
    [91.22, 23.88],
    [91.52, 24.16],
    [91.88, 24.35],
    NODES.AS_TR_BGD,
  ],
  border_as_bgd_e: [
    NODES.AS_TR_BGD,
    [92.38, 24.72],
    NODES.AS_ML_BGD_E,
  ],
  border_ml_bgd: [
    NODES.AS_ML_BGD_E,
    [91.95, 25.15],
    [91.32, 25.16],
    [90.65, 25.18],
    [90.08, 25.22],
    [89.84, 25.48],
    NODES.AS_ML_BGD_W,
  ],
  border_as_bgd_w: [
    NODES.AS_ML_BGD_W,
    [89.86, 25.95],
    NODES.WB_AS_BGD,
  ],
  border_wb_bgd: [
    NODES.WB_AS_BGD,
    [89.42, 26.28],
    [88.95, 26.35],
    [88.48, 26.42],
    [88.16, 26.08],
    [88.45, 25.68],
    [88.78, 25.25],
    [88.48, 25.02],
    [88.25, 24.68],
    [88.78, 24.32],
    [88.88, 23.82],
    [88.76, 23.25],
    [88.92, 22.72],
    [88.98, 22.22],
    NODES.WB_BGD_SEA,
  ],

  // --- Authentic Indian Coastlines (East -> South -> West) ---
  coast_wb: [
    NODES.WB_BGD_SEA,
    [88.72, 21.62],
    [88.42, 21.65],
    [88.08, 21.65],
    [87.88, 21.72],
    [87.62, 21.62],
    NODES.WB_OD_SEA,
  ],
  coast_od: [
    NODES.WB_OD_SEA,
    [87.12, 21.48],
    [86.94, 21.28],
    [86.98, 20.78],
    [86.68, 20.28],
    [86.25, 19.95],
    [85.82, 19.78],
    [85.42, 19.65],
    [85.05, 19.35],
    NODES.OD_AP_SEA,
  ],
  coast_ap: [
    NODES.OD_AP_SEA,
    [84.45, 18.78],
    [83.95, 18.28],
    [83.52, 17.85],
    [83.30, 17.68],
    [82.82, 17.42],
    [82.38, 17.02],
    [82.34, 16.68],
    [81.98, 16.48],
    [81.35, 16.25],
    [80.98, 15.88],
    [80.42, 15.82],
    [80.18, 15.42],
    [80.12, 14.88],
    [80.16, 14.32],
    [80.26, 13.85],
    NODES.AP_TN_SEA,
  ],
  coast_tn: [
    NODES.AP_TN_SEA,
    [80.32, 13.25],
    [80.29, 13.08],
    [80.22, 12.68],
    [79.96, 12.22],
    [79.84, 11.88],
    [79.79, 11.42],
    [79.86, 10.92],
    [79.87, 10.35],
    [79.52, 10.28],
    [79.18, 9.95],
    [78.95, 9.52],
    [79.38, 9.18],
    [78.88, 9.22],
    [78.42, 9.05],
    [78.18, 8.78],
    [78.12, 8.48],
    [77.82, 8.22],
    [77.54, 8.08],
    [77.32, 8.15],
    NODES.KL_TN_SEA,
  ],
  coast_kl: [
    NODES.KL_TN_SEA,
    [76.88, 8.52],
    [76.62, 8.88],
    [76.42, 9.32],
    [76.28, 9.72],
    [76.21, 10.05],
    [76.02, 10.58],
    [75.82, 11.12],
    [75.55, 11.62],
    [75.25, 12.08],
    [75.02, 12.48],
    NODES.KA_KL_SEA,
  ],
  coast_ka: [
    NODES.KA_KL_SEA,
    [74.79, 13.08],
    [74.68, 13.58],
    [74.52, 14.05],
    [74.34, 14.48],
    NODES.GA_KA_SEA,
  ],
  coast_ga: [
    NODES.GA_KA_SEA,
    [73.88, 15.22],
    [73.77, 15.49],
    NODES.MH_GA_SEA,
  ],
  coast_mh: [
    NODES.MH_GA_SEA,
    [73.48, 16.12],
    [73.32, 16.65],
    [73.22, 17.22],
    [73.06, 17.78],
    [72.95, 18.32],
    [72.86, 18.78],
    [72.80, 19.07],
    [72.76, 19.48],
    [72.72, 19.85],
    NODES.GJ_MH_SEA,
  ],
  coast_gj: [
    NODES.GJ_MH_SEA,
    [72.82, 20.42],
    [72.72, 20.85],
    [72.64, 21.15],
    [72.58, 21.68],
    [72.62, 22.28],
    [72.32, 22.15],
    [72.16, 21.75],
    [72.02, 21.38],
    [71.65, 20.98],
    [71.22, 20.78],
    [70.85, 20.72],
    [70.38, 20.90],
    [69.92, 21.28],
    [69.58, 21.64],
    [69.18, 22.02],
    [68.96, 22.28],
    [69.08, 22.48],
    [69.58, 22.36],
    [70.05, 22.52],
    [70.48, 22.88],
    [70.18, 23.02],
    [69.68, 22.82],
    [69.25, 22.86],
    [68.78, 23.08],
    [68.55, 23.45],
    NODES.SIR_CREEK,
  ],

  // --- Shared Inter-State & Inter-UT Borders ---
  jk_la: [
    NODES.JK_LA_PAK,
    [74.65, 34.72],
    [75.10, 34.62],
    [75.47, 34.28],
    [75.85, 33.90],
    [76.25, 33.52],
    [76.48, 33.15],
    NODES.JK_LA_HP,
  ],
  la_hp: [
    NODES.LA_HP_CHN,
    [78.18, 32.35],
    [77.65, 32.72],
    [77.08, 32.92],
    NODES.JK_LA_HP,
  ],
  jk_hp: [
    NODES.JK_LA_HP,
    [76.15, 32.72],
    NODES.PB_JK_HP,
  ],
  pb_jk: [
    NODES.PB_JK_PAK,
    [74.92, 32.38],
    [75.38, 32.42],
    NODES.PB_JK_HP,
  ],
  pb_hp: [
    NODES.PB_JK_HP,
    [75.88, 32.12],
    [76.12, 31.82],
    [76.42, 31.42],
    [76.62, 31.08],
    NODES.PB_HR_HP,
  ],
  hp_uk: [
    NODES.HP_UK_CHN,
    [78.52, 31.22],
    [78.08, 30.98],
    [77.82, 30.72],
    NODES.HP_UK_HR,
  ],
  hp_hr: [
    NODES.HP_UK_HR,
    [77.22, 30.58],
    NODES.PB_HR_HP,
  ],
  pb_hr_n: [
    NODES.PB_HR_HP,
    NODES.PB_HR_CH_N,
  ],
  pb_ch: [
    NODES.PB_HR_CH_N,
    [76.72, 30.74],
    NODES.PB_HR_CH_S,
  ],
  hr_ch: [
    NODES.PB_HR_CH_N,
    [76.84, 30.74],
    NODES.PB_HR_CH_S,
  ],
  pb_hr_s: [
    NODES.PB_HR_CH_S,
    [76.55, 30.35],
    [76.18, 29.95],
    [75.78, 29.75],
    [75.25, 29.88],
    NODES.PB_HR_RJ,
  ],
  hr_uk: [
    NODES.HR_UK_UP,
    NODES.HP_UK_HR,
  ],
  uk_up: [
    NODES.UK_UP_NPL,
    [79.72, 28.92],
    [79.22, 29.08],
    [78.75, 29.32],
    [78.32, 29.68],
    [77.95, 29.95],
    [77.78, 30.22],
    NODES.HR_UK_UP,
  ],
  hr_up_n: [
    NODES.HR_UK_UP,
    [77.38, 29.88],
    [77.22, 29.42],
    [77.18, 29.08],
    NODES.HR_DL_N,
  ],
  hr_dl: [
    NODES.HR_DL_N,
    [76.86, 28.68],
    [76.96, 28.45],
    [77.18, 28.42],
    NODES.UP_DL_S,
  ],
  up_dl: [
    NODES.HR_DL_N,
    [77.26, 28.74],
    [77.34, 28.62],
    NODES.UP_DL_S,
  ],
  hr_up_s: [
    NODES.UP_DL_S,
    [77.48, 28.22],
    NODES.HR_RJ_UP,
  ],
  rj_pb: [
    NODES.RJ_PB_PAK,
    [74.28, 29.96],
    NODES.PB_HR_RJ,
  ],
  rj_hr: [
    NODES.PB_HR_RJ,
    [75.15, 29.32],
    [75.62, 28.78],
    [76.02, 28.32],
    [76.35, 28.05],
    [76.82, 27.95],
    [77.18, 27.85],
    NODES.HR_RJ_UP,
  ],
  rj_up: [
    NODES.HR_RJ_UP,
    [77.48, 27.52],
    [77.58, 27.15],
    NODES.UP_MP_RJ,
  ],
  gj_rj: [
    NODES.GJ_RJ_PAK,
    [71.68, 24.62],
    [72.25, 24.52],
    [72.82, 24.38],
    [73.32, 24.22],
    [73.85, 23.82],
    [74.18, 23.42],
    NODES.MP_RJ_GJ,
  ],
  mp_rj: [
    NODES.MP_RJ_GJ,
    [74.68, 23.58],
    [74.88, 24.08],
    [75.25, 24.48],
    [75.78, 24.52],
    [76.28, 24.18],
    [76.78, 24.38],
    [76.85, 25.08],
    [76.98, 25.68],
    [77.42, 26.25],
    [77.72, 26.62],
    NODES.UP_MP_RJ,
  ],
  mp_up: [
    NODES.UP_MP_RJ,
    [78.28, 26.48],
    [78.52, 25.88],
    [78.25, 25.35],
    [78.18, 24.75],
    [78.52, 24.35],
    [78.88, 24.68],
    [79.12, 25.18],
    [79.68, 25.32],
    [80.32, 25.08],
    [80.98, 24.92],
    [81.58, 24.78],
    [82.22, 24.42],
    [82.68, 24.22],
    NODES.UP_MP_CG,
  ],
  up_cg: [
    NODES.UP_MP_CG,
    [83.05, 24.05],
    NODES.UP_CG_JH,
  ],
  up_jh: [
    NODES.UP_CG_JH,
    [83.42, 24.32],
    NODES.UP_BR_JH,
  ],
  up_br: [
    NODES.UP_BR_NPL,
    [84.08, 26.95],
    [84.32, 26.45],
    [84.42, 25.92],
    [84.58, 25.74],
    [83.95, 25.55],
    [83.75, 25.18],
    [83.62, 24.75],
    NODES.UP_BR_JH,
  ],
  jh_br: [
    NODES.UP_BR_JH,
    [84.12, 24.52],
    [84.78, 24.48],
    [85.45, 24.45],
    [86.18, 24.55],
    [86.78, 24.75],
    [87.35, 24.95],
    NODES.BR_JH_WB,
  ],
  br_wb: [
    NODES.BR_WB_NPL,
    [87.92, 26.25],
    [87.85, 25.72],
    NODES.BR_JH_WB,
  ],
  jh_wb: [
    NODES.BR_JH_WB,
    [87.82, 24.75],
    [87.48, 24.28],
    [87.05, 23.82],
    [86.82, 23.35],
    [86.78, 22.82],
    NODES.JH_WB_OD,
  ],
  od_wb: [
    NODES.JH_WB_OD,
    [86.95, 21.95],
    [87.22, 21.72],
    NODES.WB_OD_SEA,
  ],
  wb_sk: [
    NODES.WB_SK_NPL,
    [88.35, 27.12],
    NODES.WB_SK_BTN,
  ],
  wb_as: [
    NODES.WB_AS_BTN,
    [89.84, 26.42],
    NODES.WB_AS_BGD,
  ],
  as_ar: [
    NODES.AS_AR_BTN,
    [92.75, 26.92],
    [93.45, 26.98],
    [94.15, 27.18],
    [94.75, 27.45],
    [95.35, 27.78],
    [95.98, 27.85],
    [95.92, 27.45],
    NODES.AS_AR_NL,
  ],
  ar_nl: [
    NODES.AR_NL_MMR,
    [95.42, 27.02],
    NODES.AS_AR_NL,
  ],
  as_nl: [
    NODES.AS_AR_NL,
    [94.92, 26.82],
    [94.45, 26.52],
    [93.98, 26.15],
    [93.72, 25.82],
    NODES.AS_NL_MN,
  ],
  mn_nl: [
    NODES.AS_NL_MN,
    [94.18, 25.48],
    NODES.NL_MN_MMR,
  ],
  as_mn: [
    NODES.AS_NL_MN,
    [93.35, 25.12],
    NODES.AS_MN_MZ,
  ],
  mz_mn: [
    NODES.AS_MN_MZ,
    [93.22, 24.35],
    NODES.MN_MZ_MMR,
  ],
  as_mz: [
    NODES.AS_MN_MZ,
    [92.75, 24.48],
    NODES.AS_MZ_TR,
  ],
  tr_mz: [
    NODES.AS_MZ_TR,
    [92.30, 24.05],
    NODES.TR_MZ_BGD,
  ],
  as_tr: [
    NODES.AS_MZ_TR,
    NODES.AS_TR_BGD,
  ],
  as_ml: [
    NODES.AS_ML_BGD_W,
    [90.45, 25.95],
    [91.15, 25.98],
    [91.78, 25.95],
    [92.25, 25.68],
    [92.52, 25.25],
    NODES.AS_ML_BGD_E,
  ],
  cg_jh: [
    NODES.UP_CG_JH,
    [83.75, 23.72],
    [84.08, 23.15],
    NODES.JH_CG_OD,
  ],
  od_jh: [
    NODES.JH_CG_OD,
    [84.68, 22.38],
    [85.28, 22.15],
    [85.85, 22.08],
    [86.35, 22.22],
    NODES.JH_WB_OD,
  ],
  cg_od: [
    NODES.JH_CG_OD,
    [83.75, 22.05],
    [83.25, 21.42],
    [82.78, 20.68],
    [82.42, 19.85],
    [82.12, 19.05],
    [81.82, 18.42],
    NODES.CG_OD_AP,
  ],
  gj_mp: [
    NODES.MP_RJ_GJ,
    [74.42, 22.62],
    NODES.GJ_MP_MH,
  ],
  gj_mh: [
    NODES.GJ_MP_MH,
    [74.02, 21.58],
    [73.72, 20.92],
    [73.35, 20.42],
    [73.02, 20.18],
    NODES.GJ_MH_SEA,
  ],
  mh_mp: [
    NODES.GJ_MP_MH,
    [74.88, 21.58],
    [75.58, 21.38],
    [76.28, 21.25],
    [77.08, 21.35],
    [77.88, 21.42],
    [78.65, 21.48],
    [79.45, 21.52],
    [80.08, 21.62],
    NODES.MP_CG_MH,
  ],
  mp_cg: [
    NODES.UP_MP_CG,
    [82.22, 23.32],
    [81.68, 22.68],
    [81.12, 22.08],
    NODES.MP_CG_MH,
  ],
  mh_cg: [
    NODES.MP_CG_MH,
    [80.62, 20.85],
    [80.42, 20.02],
    NODES.MH_CG_TG,
  ],
  cg_tg: [
    NODES.CG_TG_AP,
    [80.68, 18.42],
    NODES.MH_CG_TG,
  ],
  cg_ap: [
    NODES.CG_OD_AP,
    [81.18, 17.78],
    NODES.CG_TG_AP,
  ],
  ap_od: [
    NODES.CG_OD_AP,
    [81.95, 18.18],
    [82.58, 18.48],
    [83.18, 18.75],
    [83.75, 18.88],
    [84.28, 18.98],
    NODES.OD_AP_SEA,
  ],
  mh_tg: [
    NODES.MH_CG_TG,
    [79.72, 19.38],
    [78.95, 19.72],
    [78.22, 19.45],
    [77.68, 18.92],
    NODES.MH_TG_KA,
  ],
  tg_ap: [
    NODES.CG_TG_AP,
    [80.32, 17.15],
    [79.72, 16.65],
    [78.98, 16.12],
    [78.22, 15.98],
    NODES.TG_AP_KA,
  ],
  mh_ka: [
    NODES.MH_TG_KA,
    [76.82, 17.95],
    [76.02, 17.42],
    [75.15, 16.82],
    [74.48, 16.32],
    NODES.MH_GA_KA,
  ],
  ka_tg: [
    NODES.MH_TG_KA,
    [77.42, 17.48],
    [77.38, 16.85],
    NODES.TG_AP_KA,
  ],
  ap_ka: [
    NODES.KA_AP_TN,
    [78.08, 13.48],
    [77.48, 13.95],
    [76.98, 14.48],
    [77.08, 15.12],
    [77.35, 15.68],
    NODES.TG_AP_KA,
  ],
  mh_ga: [
    NODES.MH_GA_KA,
    [73.92, 15.78],
    NODES.MH_GA_SEA,
  ],
  ga_ka: [
    NODES.MH_GA_KA,
    [74.32, 15.32],
    [74.22, 15.02],
    NODES.GA_KA_SEA,
  ],
  ap_tn: [
    NODES.AP_TN_SEA,
    [79.72, 13.38],
    [79.18, 13.15],
    [78.82, 12.95],
    NODES.KA_AP_TN,
  ],
  ka_tn: [
    NODES.KA_AP_TN,
    [78.08, 12.62],
    [77.65, 12.18],
    [77.15, 11.78],
    [76.72, 11.68],
    NODES.KA_KL_TN,
  ],
  ka_kl: [
    NODES.KA_KL_TN,
    [75.88, 11.98],
    [75.42, 12.35],
    NODES.KA_KL_SEA,
  ],
  kl_tn: [
    NODES.KA_KL_TN,
    [76.62, 11.15],
    [76.82, 10.45],
    [77.18, 9.82],
    [77.26, 9.05],
    NODES.KL_TN_SEA,
  ],

  // --- Outer Neighboring Country Borders (for seamless continent backdrop) ---
  border_pak_afg: [
    NODES.LA_AFG_PAK,
    [73.32, 36.85],
    [72.35, 36.82],
    [71.58, 36.32],
    [71.18, 35.42],
    [71.42, 34.48],
    [70.38, 33.92],
    [69.32, 32.92],
    [68.98, 31.88],
    [67.55, 31.25],
    [66.48, 30.82],
    [66.22, 29.85],
    [63.65, 29.48],
    NODES.PAK_AFG_IRN,
  ],
  border_pak_irn: [
    NODES.PAK_AFG_IRN,
    [60.82, 27.65],
    [61.28, 26.25],
    NODES.PAK_IRN_SEA,
  ],
  coast_pak: [
    NODES.PAK_IRN_SEA,
    [62.45, 25.18],
    [64.55, 25.24],
    [66.65, 24.92],
    [67.45, 24.35],
    NODES.SIR_CREEK,
  ],
  border_afg_chn: [
    NODES.LA_AFG_CHN,
    NODES.AFG_CHN_TJK,
  ],
  border_chn_npl: [
    NODES.UK_NPL_CHN,
    [82.22, 29.95],
    [83.62, 29.15],
    [84.85, 28.55],
    [86.12, 28.05],
    [87.25, 27.88],
    NODES.SK_NPL_CHN,
  ],
  border_chn_btn: [
    NODES.SK_BTN_CHN,
    [89.25, 27.85],
    [89.95, 28.12],
    [90.85, 28.05],
    NODES.AR_BTN_CHN,
  ],
  border_chn_mmr: [
    NODES.AR_CHN_MMR,
    [98.25, 27.85],
    [98.75, 26.55],
    [98.65, 25.15],
    [99.45, 23.85],
    NODES.CHN_MMR_LAO,
  ],
  border_bgd_mmr: [
    NODES.MZ_BGD_MMR,
    [92.52, 21.45],
    NODES.BGD_MMR_SEA,
  ],
  coast_bgd: [
    NODES.BGD_MMR_SEA,
    [91.88, 21.48],
    [91.52, 22.28],
    [90.95, 22.58],
    [90.22, 21.88],
    NODES.WB_BGD_SEA,
  ],
  coast_mmr: [
    NODES.BGD_MMR_SEA,
    [92.95, 20.15],
    [93.85, 19.15],
    [94.35, 17.55],
    [94.25, 16.05],
    [95.35, 15.85],
    [96.55, 16.55],
    [97.45, 15.85],
    [98.15, 13.55],
    [98.55, 10.05],
    [99.05, 5.00],
  ],
});

type ArcKey = keyof typeof ARCS;

/**
 * Concatenates directed arcs (`'arc'` forward, `'~arc'` reversed),
 * deduplicating shared junction vertices so polygons seal seamlessly.
 */
function buildRing(refs: ReadonlyArray<ArcKey | `~${ArcKey}`>): LonLat[] {
  const out: LonLat[] = [];
  for (const ref of refs) {
    const rev = ref.startsWith('~');
    const key = (rev ? ref.slice(1) : ref) as ArcKey;
    const pts = rev ? [...ARCS[key]].reverse() : ARCS[key];
    for (let i = 0; i < pts.length; i += 1) {
      const pt = pts[i];
      if (!pt) continue;
      const prev = out[out.length - 1];
      if (!prev || prev[0] !== pt[0] || prev[1] !== pt[1]) {
        out.push(pt);
      }
    }
  }
  if (out.length > 1) {
    const first = out[0];
    const last = out[out.length - 1];
    if (first && last && first[0] === last[0] && first[1] === last[1]) {
      out.pop();
    }
  }
  return out;
}

/**
 * Complete sovereign mainland boundary of India (including complete Ladakh,
 * Jammu & Kashmir, Aksai Chin, Gilgit-Baltistan, Uttarakhand, Sikkim, and
 * full Arunachal Pradesh).
 */
export const INDIA_SOVEREIGN_MAINLAND: LonLat[] = buildRing([
  'border_gj_pak',
  'border_rj_pak',
  'border_pb_pak',
  'border_jk_pak',
  'border_la_pak',
  'border_la_afg',
  'border_la_chn',
  'border_hp_chn',
  'border_uk_chn',
  'border_uk_npl',
  'border_up_npl',
  'border_br_npl',
  'border_wb_npl',
  'border_sk_npl',
  'border_sk_chn',
  'border_sk_btn',
  'border_wb_btn',
  'border_as_btn',
  'border_ar_btn',
  'border_ar_chn',
  'border_ar_mmr',
  'border_nl_mmr',
  'border_mn_mmr',
  'border_mz_mmr',
  'border_mz_bgd',
  'border_tr_bgd',
  'border_as_bgd_e',
  'border_ml_bgd',
  'border_as_bgd_w',
  'border_wb_bgd',
  'coast_wb',
  'coast_od',
  'coast_ap',
  'coast_tn',
  'coast_kl',
  'coast_ka',
  'coast_ga',
  'coast_mh',
  'coast_gj',
]);

/**
 * Unique internal inter-state & inter-UT border polylines (drawn once each
 * for crisp, uniform 1px hairline cartographic borders with zero double-strokes).
 */
export const INDIA_INTERNAL_BORDERS: LonLat[][] = [
  ARCS.jk_la,
  ARCS.la_hp,
  ARCS.jk_hp,
  ARCS.pb_jk,
  ARCS.pb_hp,
  ARCS.hp_uk,
  ARCS.hp_hr,
  ARCS.pb_hr_n,
  ARCS.pb_ch,
  ARCS.hr_ch,
  ARCS.pb_hr_s,
  ARCS.hr_uk,
  ARCS.uk_up,
  ARCS.hr_up_n,
  ARCS.hr_dl,
  ARCS.up_dl,
  ARCS.hr_up_s,
  ARCS.rj_pb,
  ARCS.rj_hr,
  ARCS.rj_up,
  ARCS.gj_rj,
  ARCS.mp_rj,
  ARCS.mp_up,
  ARCS.up_cg,
  ARCS.up_jh,
  ARCS.up_br,
  ARCS.jh_br,
  ARCS.br_wb,
  ARCS.jh_wb,
  ARCS.od_wb,
  ARCS.wb_sk,
  ARCS.wb_as,
  ARCS.as_ar,
  ARCS.ar_nl,
  ARCS.as_nl,
  ARCS.mn_nl,
  ARCS.as_mn,
  ARCS.mz_mn,
  ARCS.as_mz,
  ARCS.tr_mz,
  ARCS.as_tr,
  ARCS.as_ml,
  ARCS.cg_jh,
  ARCS.od_jh,
  ARCS.cg_od,
  ARCS.gj_mp,
  ARCS.gj_mh,
  ARCS.mh_mp,
  ARCS.mp_cg,
  ARCS.mh_cg,
  ARCS.cg_tg,
  ARCS.cg_ap,
  ARCS.ap_od,
  ARCS.mh_tg,
  ARCS.tg_ap,
  ARCS.mh_ka,
  ARCS.ka_tg,
  ARCS.ap_ka,
  ARCS.mh_ga,
  ARCS.ga_ka,
  ARCS.ap_tn,
  ARCS.ka_tn,
  ARCS.ka_kl,
  ARCS.kl_tn,
];

/**
 * Surrounding neighboring countries sharing exact boundary arcs with India,
 * plus seamless continental backdrop polygons extending off-canvas so no
 * landmass ends abruptly inside the map frame.
 */
export const NEIGHBORING_COUNTRIES: NeighborCountry[] = [
  {
    id: 'PAK',
    name: 'PAKISTAN',
    labelCoord: [65.2, 29.2],
    polygon: buildRing([
      'border_gj_pak',
      'border_rj_pak',
      'border_pb_pak',
      'border_jk_pak',
      'border_la_pak',
      'border_pak_afg',
      'border_pak_irn',
      'coast_pak',
    ]),
  },
  {
    id: 'AFG',
    name: 'AFGHANISTAN',
    labelCoord: [65.2, 34.2],
    polygon: [
      ...ARCS.border_la_afg,
      ...ARCS.border_afg_chn.slice(1),
      [71.65, 38.48],
      [68.65, 37.32],
      [64.62, 36.65],
      [61.28, 35.62],
      [60.58, 32.55],
      NODES.PAK_AFG_IRN,
      ...[...ARCS.border_pak_afg].reverse().slice(1),
    ],
  },
  {
    id: 'IRN_BACKDROP',
    name: '',
    labelCoord: [56.0, 31.0],
    hideLabel: true,
    polygon: [
      NODES.PAK_IRN_SEA,
      ...[...ARCS.border_pak_irn].reverse().slice(1),
      [60.58, 32.55],
      [61.28, 35.62],
      [50.0, 38.0],
      [48.0, 24.5],
      [57.5, 25.4],
    ],
  },
  {
    id: 'CASIA_BACKDROP',
    name: '',
    labelCoord: [65.0, 41.0],
    hideLabel: true,
    polygon: [
      [61.28, 35.62],
      [64.62, 36.65],
      [68.65, 37.32],
      [71.65, 38.48],
      NODES.AFG_CHN_TJK,
      [73.5, 48.0],
      [50.0, 48.0],
      [50.0, 38.0],
    ],
  },
  {
    id: 'CHN',
    name: 'CHINA',
    labelCoord: [86.8, 32.8],
    polygon: [
      ...ARCS.border_la_chn,
      ...ARCS.border_hp_chn.slice(1),
      ...ARCS.border_uk_chn.slice(1),
      ...ARCS.border_chn_npl.slice(1),
      ...ARCS.border_sk_chn.slice(1),
      ...ARCS.border_chn_btn.slice(1),
      ...ARCS.border_ar_chn.slice(1),
      ...ARCS.border_chn_mmr.slice(1),
      [118.0, 22.0],
      [118.0, 48.0],
      [73.5, 48.0],
      NODES.AFG_CHN_TJK,
      ...[...ARCS.border_afg_chn].reverse().slice(1),
    ],
  },
  {
    id: 'NPL',
    name: 'NEPAL',
    labelCoord: [84.1, 28.35],
    fontSize: 10,
    polygon: buildRing([
      'border_uk_npl',
      'border_up_npl',
      'border_br_npl',
      'border_wb_npl',
      'border_sk_npl',
      '~border_chn_npl',
    ]),
  },
  {
    id: 'BTN',
    name: 'BHUTAN',
    labelCoord: [90.42, 27.45],
    fontSize: 8.5,
    polygon: buildRing([
      'border_sk_btn',
      'border_wb_btn',
      'border_as_btn',
      'border_ar_btn',
      '~border_chn_btn',
    ]),
  },
  {
    id: 'BGD',
    name: 'BANGLADESH',
    labelCoord: [90.35, 23.85],
    fontSize: 10,
    polygon: buildRing([
      '~border_wb_bgd',
      '~border_as_bgd_w',
      '~border_ml_bgd',
      '~border_as_bgd_e',
      '~border_tr_bgd',
      '~border_mz_bgd',
      'border_bgd_mmr',
      'coast_bgd',
    ]),
  },
  {
    id: 'MMR',
    name: 'MYANMAR',
    labelCoord: [96.4, 21.6],
    polygon: [
      ...ARCS.border_ar_mmr,
      ...ARCS.border_nl_mmr.slice(1),
      ...ARCS.border_mn_mmr.slice(1),
      ...ARCS.border_mz_mmr.slice(1),
      ...ARCS.border_bgd_mmr.slice(1),
      ...ARCS.coast_mmr.slice(1),
      [114.0, 5.0],
      [114.0, 22.0],
      NODES.CHN_MMR_LAO,
      ...[...ARCS.border_chn_mmr].reverse().slice(1),
    ],
  },
  {
    id: 'LKA',
    name: 'SRI LANKA',
    labelCoord: [80.72, 7.65],
    fontSize: 9.5,
    polygon: [
      [80.02, 9.82],
      [80.28, 9.68],
      [80.82, 8.95],
      [81.25, 8.55],
      [81.62, 7.95],
      [81.84, 7.45],
      [81.86, 6.85],
      [81.48, 6.28],
      [81.05, 6.06],
      [80.52, 5.92],
      [80.12, 6.08],
      [79.92, 6.38],
      [79.84, 6.94],
      [79.78, 7.75],
      [79.82, 8.38],
      [79.92, 8.85],
      [79.68, 9.15],
      [79.92, 9.65],
    ],
  },
];

/**
 * Island territories of India (Andaman & Nicobar Islands, Lakshadweep).
 */
export const INDIA_ISLANDS: {name: string; polygon: LonLat[]}[] = [
  // North Andaman
  {
    name: 'North Andaman',
    polygon: [
      [92.95, 13.56],
      [93.06, 13.32],
      [93.02, 13.02],
      [92.85, 12.96],
      [92.80, 13.28],
    ],
  },
  // Middle Andaman
  {
    name: 'Middle Andaman',
    polygon: [
      [92.86, 12.92],
      [93.00, 12.76],
      [92.95, 12.38],
      [92.76, 12.34],
      [92.72, 12.68],
    ],
  },
  // South Andaman (Port Blair)
  {
    name: 'South Andaman',
    polygon: [
      [92.68, 12.28],
      [92.82, 12.14],
      [92.78, 11.68],
      [92.76, 11.48],
      [92.60, 11.54],
      [92.58, 11.98],
    ],
  },
  // Little Andaman
  {
    name: 'Little Andaman',
    polygon: [
      [92.46, 10.92],
      [92.62, 10.85],
      [92.58, 10.54],
      [92.42, 10.58],
    ],
  },
  // Car Nicobar
  {
    name: 'Car Nicobar',
    polygon: [
      [92.73, 9.25],
      [92.86, 9.20],
      [92.83, 9.04],
      [92.71, 9.08],
    ],
  },
  // Katchal & Camorta
  {
    name: 'Katchal & Camorta',
    polygon: [
      [93.36, 8.22],
      [93.56, 8.18],
      [93.52, 7.88],
      [93.32, 7.92],
    ],
  },
  // Great Nicobar (Indira Point)
  {
    name: 'Great Nicobar',
    polygon: [
      [93.64, 7.25],
      [93.92, 7.20],
      [93.85, 6.75],
      [93.62, 6.84],
    ],
  },
  // Lakshadweep Archipelago
  {
    name: 'Lakshadweep N',
    polygon: [
      [72.14, 11.74],
      [72.30, 11.74],
      [72.28, 11.55],
      [72.12, 11.56],
    ],
  },
  {
    name: 'Lakshadweep C',
    polygon: [
      [72.58, 10.68],
      [72.76, 10.68],
      [72.74, 10.48],
      [72.56, 10.50],
    ],
  },
  {
    name: 'Andrott & Kalpeni',
    polygon: [
      [73.58, 10.86],
      [73.72, 10.86],
      [73.70, 10.72],
      [73.56, 10.74],
    ],
  },
  {
    name: 'Minicoy',
    polygon: [
      [72.98, 8.36],
      [73.12, 8.36],
      [73.10, 8.20],
      [72.96, 8.22],
    ],
  },
];

/**
 * All Mainland States & Union Territories of India (28 States + Mainland UTs)
 * built from shared topological arcs for exact border alignment.
 * (Andaman & Nicobar Islands and Lakshadweep are in INDIA_ISLANDS.)
 */
export const INDIA_STATE_REGIONS: StateRegion[] = [
  {
    id: 'LA',
    name: 'Ladakh',
    abbr: 'LA',
    toneIndex: 0,
    labelCoord: [77.65, 34.55],
    polygon: buildRing([
      'border_la_pak',
      'border_la_afg',
      'border_la_chn',
      'la_hp',
      '~jk_la',
    ]),
  },
  {
    id: 'JK',
    name: 'Jammu & Kashmir',
    abbr: 'JK',
    toneIndex: 2,
    labelCoord: [74.72, 33.65],
    polygon: buildRing(['border_jk_pak', 'jk_la', 'jk_hp', '~pb_jk']),
  },
  {
    id: 'HP',
    name: 'Himachal Pradesh',
    abbr: 'HP',
    toneIndex: 1,
    labelCoord: [77.22, 31.95],
    polygon: buildRing([
      '~jk_hp',
      '~la_hp',
      'border_hp_chn',
      'hp_uk',
      'hp_hr',
      '~pb_hp',
    ]),
  },
  {
    id: 'PB',
    name: 'Punjab',
    abbr: 'PB',
    toneIndex: 3,
    labelCoord: [75.38, 30.92],
    polygon: buildRing([
      'border_pb_pak',
      'pb_jk',
      'pb_hp',
      'pb_hr_n',
      'pb_ch',
      'pb_hr_s',
      '~rj_pb',
    ]),
  },
  {
    id: 'CH',
    name: 'Chandigarh',
    abbr: 'CH',
    toneIndex: 4,
    labelCoord: [76.78, 30.73],
    hideLabel: true,
    polygon: buildRing(['~pb_ch', 'hr_ch']),
  },
  {
    id: 'UK',
    name: 'Uttarakhand',
    abbr: 'UK',
    toneIndex: 4,
    labelCoord: [79.15, 30.08],
    polygon: buildRing([
      '~hp_uk',
      'border_uk_chn',
      'border_uk_npl',
      'uk_up',
      'hr_uk',
    ]),
  },
  {
    id: 'HR',
    name: 'Haryana',
    abbr: 'HR',
    toneIndex: 0,
    labelCoord: [76.12, 29.05],
    polygon: buildRing([
      '~pb_hr_s',
      '~hr_ch',
      '~pb_hr_n',
      '~hp_hr',
      '~hr_uk',
      'hr_up_n',
      'hr_dl',
      'hr_up_s',
      '~rj_hr',
    ]),
  },
  {
    id: 'DL',
    name: 'Delhi',
    abbr: 'DL',
    toneIndex: 3,
    labelCoord: [77.12, 28.64],
    polygon: buildRing(['~hr_dl', 'up_dl']),
  },
  {
    id: 'RJ',
    name: 'Rajasthan',
    abbr: 'RJ',
    toneIndex: 1,
    labelCoord: [73.75, 26.65],
    polygon: buildRing([
      'border_rj_pak',
      'rj_pb',
      'rj_hr',
      'rj_up',
      '~mp_rj',
      '~gj_rj',
    ]),
  },
  {
    id: 'UP',
    name: 'Uttar Pradesh',
    abbr: 'UP',
    toneIndex: 2,
    labelCoord: [80.72, 26.95],
    polygon: buildRing([
      '~hr_up_n',
      '~uk_up',
      'border_up_npl',
      'up_br',
      'up_jh',
      'up_cg',
      '~mp_up',
      '~rj_up',
      '~hr_up_s',
      '~up_dl',
    ]),
  },
  {
    id: 'BR',
    name: 'Bihar',
    abbr: 'BR',
    toneIndex: 4,
    labelCoord: [85.72, 25.68],
    polygon: buildRing(['border_br_npl', 'br_wb', '~jh_br', '~up_br']),
  },
  {
    id: 'JH',
    name: 'Jharkhand',
    abbr: 'JH',
    toneIndex: 3,
    labelCoord: [85.45, 23.58],
    polygon: buildRing(['jh_br', 'jh_wb', '~od_jh', '~cg_jh', '~up_jh']),
  },
  {
    id: 'WB',
    name: 'West Bengal',
    abbr: 'WB',
    toneIndex: 0,
    labelCoord: [87.85, 23.38],
    polygon: buildRing([
      'border_wb_npl',
      'wb_sk',
      'border_wb_btn',
      'wb_as',
      'border_wb_bgd',
      'coast_wb',
      '~od_wb',
      '~jh_wb',
      '~br_wb',
    ]),
  },
  {
    id: 'SK',
    name: 'Sikkim',
    abbr: 'SK',
    toneIndex: 2,
    labelCoord: [88.48, 27.55],
    polygon: buildRing([
      'border_sk_npl',
      'border_sk_chn',
      'border_sk_btn',
      '~wb_sk',
    ]),
  },
  {
    id: 'AR',
    name: 'Arunachal Pradesh',
    abbr: 'AR',
    toneIndex: 1,
    labelCoord: [94.55, 28.12],
    polygon: buildRing([
      'border_ar_btn',
      'border_ar_chn',
      'border_ar_mmr',
      'ar_nl',
      '~as_ar',
    ]),
  },
  {
    id: 'AS',
    name: 'Assam',
    abbr: 'AS',
    toneIndex: 4,
    labelCoord: [92.85, 26.35],
    polygon: buildRing([
      'border_as_btn',
      'as_ar',
      'as_nl',
      'as_mn',
      'as_mz',
      'as_tr',
      'border_as_bgd_e',
      '~as_ml',
      'border_as_bgd_w',
      '~wb_as',
    ]),
  },
  {
    id: 'ML',
    name: 'Meghalaya',
    abbr: 'ML',
    toneIndex: 3,
    labelCoord: [91.22, 25.54],
    polygon: buildRing(['as_ml', 'border_ml_bgd']),
  },
  {
    id: 'NL',
    name: 'Nagaland',
    abbr: 'NL',
    toneIndex: 2,
    labelCoord: [94.48, 26.05],
    polygon: buildRing(['~ar_nl', 'border_nl_mmr', '~mn_nl', '~as_nl']),
  },
  {
    id: 'MN',
    name: 'Manipur',
    abbr: 'MN',
    toneIndex: 0,
    labelCoord: [93.92, 24.68],
    polygon: buildRing(['mn_nl', 'border_mn_mmr', '~mz_mn', '~as_mn']),
  },
  {
    id: 'MZ',
    name: 'Mizoram',
    abbr: 'MZ',
    toneIndex: 1,
    labelCoord: [92.82, 23.18],
    polygon: buildRing([
      'mz_mn',
      'border_mz_mmr',
      'border_mz_bgd',
      '~tr_mz',
      '~as_mz',
    ]),
  },
  {
    id: 'TR',
    name: 'Tripura',
    abbr: 'TR',
    toneIndex: 3,
    labelCoord: [91.75, 23.68],
    polygon: buildRing(['~as_tr', 'tr_mz', 'border_tr_bgd']),
  },
  {
    id: 'GJ',
    name: 'Gujarat',
    abbr: 'GJ',
    toneIndex: 2,
    labelCoord: [71.65, 22.72],
    polygon: buildRing([
      'border_gj_pak',
      'gj_rj',
      'gj_mp',
      'gj_mh',
      'coast_gj',
    ]),
  },
  {
    id: 'DN',
    name: 'Dadra & Nagar Haveli and Daman & Diu',
    abbr: 'DN',
    toneIndex: 1,
    labelCoord: [72.92, 20.32],
    hideLabel: true,
    polygon: [
      // Dadra & Nagar Haveli enclave
      [72.95, 20.35],
      [73.12, 20.32],
      [73.14, 20.14],
      [72.96, 20.12],
    ],
    extraPolygons: [
      // Daman coast enclave
      [
        [72.81, 20.44],
        [72.88, 20.44],
        [72.88, 20.37],
        [72.81, 20.37],
      ],
      // Diu island enclave
      [
        [70.88, 20.73],
        [70.98, 20.73],
        [70.98, 20.69],
        [70.88, 20.69],
      ],
    ],
  },
  {
    id: 'MP',
    name: 'Madhya Pradesh',
    abbr: 'MP',
    toneIndex: 4,
    labelCoord: [77.88, 23.38],
    polygon: buildRing(['mp_rj', 'mp_up', 'mp_cg', '~mh_mp', '~gj_mp']),
  },
  {
    id: 'CG',
    name: 'Chhattisgarh',
    abbr: 'CG',
    toneIndex: 1,
    labelCoord: [82.05, 21.35],
    polygon: buildRing([
      '~up_cg',
      'cg_jh',
      'cg_od',
      'cg_ap',
      'cg_tg',
      '~mh_cg',
      '~mp_cg',
    ]),
  },
  {
    id: 'OD',
    name: 'Odisha',
    abbr: 'OD',
    toneIndex: 3,
    labelCoord: [84.45, 20.42],
    polygon: buildRing(['od_jh', 'od_wb', 'coast_od', '~ap_od', '~cg_od']),
  },
  {
    id: 'MH',
    name: 'Maharashtra',
    abbr: 'MH',
    toneIndex: 0,
    labelCoord: [75.85, 19.28],
    polygon: buildRing([
      '~gj_mh',
      'mh_mp',
      'mh_cg',
      'mh_tg',
      'mh_ka',
      'mh_ga',
      'coast_mh',
    ]),
  },
  {
    id: 'GA',
    name: 'Goa',
    abbr: 'GA',
    toneIndex: 3,
    labelCoord: [74.02, 15.32],
    polygon: buildRing(['~mh_ga', 'ga_ka', 'coast_ga']),
  },
  {
    id: 'TG',
    name: 'Telangana',
    abbr: 'TG',
    toneIndex: 2,
    labelCoord: [79.12, 17.85],
    polygon: buildRing(['~mh_tg', '~cg_tg', 'tg_ap', '~ka_tg']),
  },
  {
    id: 'AP',
    name: 'Andhra Pradesh',
    abbr: 'AP',
    toneIndex: 4,
    labelCoord: [79.22, 15.15],
    polygon: buildRing([
      '~cg_ap',
      'ap_od',
      'coast_ap',
      'ap_tn',
      'ap_ka',
      '~tg_ap',
    ]),
  },
  {
    id: 'KA',
    name: 'Karnataka',
    abbr: 'KA',
    toneIndex: 1,
    labelCoord: [75.85, 14.48],
    polygon: buildRing([
      '~mh_ka',
      'ka_tg',
      '~ap_ka',
      'ka_tn',
      'ka_kl',
      'coast_ka',
      '~ga_ka',
    ]),
  },
  {
    id: 'KL',
    name: 'Kerala',
    abbr: 'KL',
    toneIndex: 3,
    labelCoord: [76.38, 10.42],
    polygon: buildRing(['~ka_kl', 'kl_tn', 'coast_kl']),
  },
  {
    id: 'TN',
    name: 'Tamil Nadu',
    abbr: 'TN',
    toneIndex: 0,
    labelCoord: [78.65, 10.95],
    polygon: buildRing(['~ka_tn', '~ap_tn', 'coast_tn', '~kl_tn']),
  },
  {
    id: 'PY',
    name: 'Puducherry',
    abbr: 'PY',
    toneIndex: 2,
    labelCoord: [79.81, 11.93],
    hideLabel: true,
    polygon: [
      // Puducherry enclave
      [79.75, 11.99],
      [79.84, 11.99],
      [79.84, 11.88],
      [79.75, 11.88],
    ],
    extraPolygons: [
      // Karaikal enclave
      [
        [79.77, 10.98],
        [79.86, 10.98],
        [79.86, 10.89],
        [79.77, 10.89],
      ],
      // Yanam enclave
      [
        [82.18, 16.76],
        [82.26, 16.76],
        [82.26, 16.70],
        [82.18, 16.70],
      ],
      // Mahe enclave
      [
        [75.51, 11.73],
        [75.57, 11.73],
        [75.57, 11.68],
        [75.51, 11.68],
      ],
    ],
  },
];

/**
 * 42 Major Indian Cities across all regions with exact real-world lat/lon.
 */
export const INDIAN_CITIES: IndianCity[] = [
  {id: 'delhi', name: 'New Delhi', state: 'Delhi', lat: 28.6139, lon: 77.209, municipalRadiusKm: 42, tier: 1},
  {id: 'mumbai', name: 'Mumbai', state: 'Maharashtra', lat: 19.076, lon: 72.8777, municipalRadiusKm: 38, tier: 1},
  {id: 'bengaluru', name: 'Bengaluru', state: 'Karnataka', lat: 12.9716, lon: 77.5946, municipalRadiusKm: 36, tier: 1},
  {id: 'chennai', name: 'Chennai', state: 'Tamil Nadu', lat: 13.0827, lon: 80.2707, municipalRadiusKm: 34, tier: 1},
  {id: 'kolkata', name: 'Kolkata', state: 'West Bengal', lat: 22.5726, lon: 88.3639, municipalRadiusKm: 34, tier: 1},
  {id: 'hyderabad', name: 'Hyderabad', state: 'Telangana', lat: 17.385, lon: 78.4867, municipalRadiusKm: 35, tier: 1},
  {id: 'ahmedabad', name: 'Ahmedabad', state: 'Gujarat', lat: 23.0225, lon: 72.5714, municipalRadiusKm: 32, tier: 1},
  {id: 'pune', name: 'Pune', state: 'Maharashtra', lat: 18.5204, lon: 73.8567, municipalRadiusKm: 30, tier: 1},
  {id: 'jaipur', name: 'Jaipur', state: 'Rajasthan', lat: 26.9124, lon: 75.7873, municipalRadiusKm: 28, tier: 1},
  {id: 'lucknow', name: 'Lucknow', state: 'Uttar Pradesh', lat: 26.8467, lon: 80.9462, municipalRadiusKm: 28, tier: 1},
  {id: 'srinagar', name: 'Srinagar', state: 'Jammu & Kashmir', lat: 34.0837, lon: 74.7973, municipalRadiusKm: 24, tier: 1},
  {id: 'leh', name: 'Leh', state: 'Ladakh', lat: 34.1526, lon: 77.5771, municipalRadiusKm: 22, tier: 2},
  {id: 'shimla', name: 'Shimla', state: 'Himachal Pradesh', lat: 31.1048, lon: 77.1734, municipalRadiusKm: 18, tier: 2},
  {id: 'chandigarh', name: 'Chandigarh', state: 'Chandigarh', lat: 30.7333, lon: 76.7794, municipalRadiusKm: 22, tier: 2},
  {id: 'dehradun', name: 'Dehradun', state: 'Uttarakhand', lat: 30.3165, lon: 78.0322, municipalRadiusKm: 22, tier: 2},
  {id: 'amritsar', name: 'Amritsar', state: 'Punjab', lat: 31.634, lon: 74.8723, municipalRadiusKm: 24, tier: 2},
  {id: 'jodhpur', name: 'Jodhpur', state: 'Rajasthan', lat: 26.2389, lon: 73.0243, municipalRadiusKm: 24, tier: 2},
  {id: 'udaipur', name: 'Udaipur', state: 'Rajasthan', lat: 24.5854, lon: 73.7125, municipalRadiusKm: 20, tier: 2},
  {id: 'bhopal', name: 'Bhopal', state: 'Madhya Pradesh', lat: 23.2599, lon: 77.4126, municipalRadiusKm: 26, tier: 1},
  {id: 'indore', name: 'Indore', state: 'Madhya Pradesh', lat: 22.7196, lon: 75.8577, municipalRadiusKm: 26, tier: 2},
  {id: 'nagpur', name: 'Nagpur', state: 'Maharashtra', lat: 21.1458, lon: 79.0882, municipalRadiusKm: 26, tier: 1},
  {id: 'surat', name: 'Surat', state: 'Gujarat', lat: 21.1702, lon: 72.8311, municipalRadiusKm: 26, tier: 2},
  {id: 'varanasi', name: 'Varanasi', state: 'Uttar Pradesh', lat: 25.3176, lon: 82.9739, municipalRadiusKm: 22, tier: 2},
  {id: 'kanpur', name: 'Kanpur', state: 'Uttar Pradesh', lat: 26.4499, lon: 80.3319, municipalRadiusKm: 24, tier: 2},
  {id: 'patna', name: 'Patna', state: 'Bihar', lat: 25.5941, lon: 85.1376, municipalRadiusKm: 25, tier: 1},
  {id: 'ranchi', name: 'Ranchi', state: 'Jharkhand', lat: 23.3441, lon: 85.3096, municipalRadiusKm: 22, tier: 2},
  {id: 'raipur', name: 'Raipur', state: 'Chhattisgarh', lat: 21.2514, lon: 81.6296, municipalRadiusKm: 22, tier: 2},
  {id: 'bhubaneswar', name: 'Bhubaneswar', state: 'Odisha', lat: 20.2961, lon: 85.8245, municipalRadiusKm: 24, tier: 1},
  {id: 'visakhapatnam', name: 'Visakhapatnam', state: 'Andhra Pradesh', lat: 17.6868, lon: 83.2185, municipalRadiusKm: 24, tier: 2},
  {id: 'vijayawada', name: 'Vijayawada', state: 'Andhra Pradesh', lat: 16.5062, lon: 80.648, municipalRadiusKm: 22, tier: 2},
  {id: 'panaji', name: 'Panaji', state: 'Goa', lat: 15.4909, lon: 73.8278, municipalRadiusKm: 18, tier: 2},
  {id: 'kochi', name: 'Kochi', state: 'Kerala', lat: 9.9312, lon: 76.2673, municipalRadiusKm: 22, tier: 1},
  {id: 'thiruvananthapuram', name: 'Thiruvananthapuram', state: 'Kerala', lat: 8.5241, lon: 76.9366, municipalRadiusKm: 22, tier: 1},
  {id: 'madurai', name: 'Madurai', state: 'Tamil Nadu', lat: 9.9252, lon: 78.1198, municipalRadiusKm: 22, tier: 2},
  {id: 'coimbatore', name: 'Coimbatore', state: 'Tamil Nadu', lat: 11.0168, lon: 76.9558, municipalRadiusKm: 22, tier: 2},
  {id: 'gangtok', name: 'Gangtok', state: 'Sikkim', lat: 27.3314, lon: 88.6138, municipalRadiusKm: 16, tier: 2},
  {id: 'guwahati', name: 'Guwahati', state: 'Assam', lat: 26.1445, lon: 91.7362, municipalRadiusKm: 24, tier: 1},
  {id: 'shillong', name: 'Shillong', state: 'Meghalaya', lat: 25.5788, lon: 91.8933, municipalRadiusKm: 18, tier: 2},
  {id: 'itanagar', name: 'Itanagar', state: 'Arunachal Pradesh', lat: 27.0844, lon: 93.6053, municipalRadiusKm: 18, tier: 2},
  {id: 'imphal', name: 'Imphal', state: 'Manipur', lat: 24.817, lon: 93.9368, municipalRadiusKm: 18, tier: 2},
  {id: 'agartala', name: 'Agartala', state: 'Tripura', lat: 23.8315, lon: 91.2868, municipalRadiusKm: 18, tier: 2},
  {id: 'port_blair', name: 'Port Blair', state: 'Andaman & Nicobar', lat: 11.6234, lon: 92.7265, municipalRadiusKm: 18, tier: 2},
];

// Projection bounds framing full sovereign India (~80%+ focus) while displaying neighboring countries cleanly
const MIN_LON = 67.2;
const MAX_LON = 98.4;
const MIN_LAT = 5.6;
const MAX_LAT = 37.8;
const REF_LAT_RAD = (22.5 * Math.PI) / 180;
const COS_REF = Math.cos(REF_LAT_RAD);

export interface MapProjection {
  project: (lon: number, lat: number) => {x: number; y: number};
  pixelsPerKm: number;
  bounds: {left: number; top: number; width: number; height: number};
}

/**
 * Computes an aspect-corrected geographic projection (Equirectangular scaled by cos(22.5°))
 * so horizontal and vertical distances across India match true Haversine proportions,
 * keeping India as the primary ~80%+ focal area inside the canvas.
 */
export function createIndiaProjection(
  canvasWidth: number,
  canvasHeight: number,
): MapProjection {
  const padX = 100;
  const padTop = 26;
  const padBottom = 26;

  const availW = canvasWidth - padX * 2;
  const availH = canvasHeight - padTop - padBottom;

  const lonSpanScaled = (MAX_LON - MIN_LON) * COS_REF;
  const latSpan = MAX_LAT - MIN_LAT;

  const scale = Math.min(availW / lonSpanScaled, availH / latSpan);
  const mapW = lonSpanScaled * scale;
  const mapH = latSpan * scale;

  const offsetX = (canvasWidth - mapW) / 2;
  const offsetY = padTop + (availH - mapH) / 2;

  // 1 degree of latitude is ~111.132 km
  const pixelsPerKm = scale / 111.132;

  return {
    project: (lon: number, lat: number) => ({
      x: offsetX + (lon - MIN_LON) * COS_REF * scale,
      y: offsetY + (MAX_LAT - lat) * scale,
    }),
    pixelsPerKm,
    bounds: {left: offsetX, top: offsetY, width: mapW, height: mapH},
  };
}

/**
 * Great-circle Haversine distance in kilometers between two coordinates.
 */
export function haversineKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c);
}
