import type { Component, BuildComponent, ComponentSpecs } from '../types/Frontend_types';

// ─────────────────────────────────────────────────────────────────
// Exported types
// ─────────────────────────────────────────────────────────────────

// Los motivos (reasons) se generan en el servidor, que no conoce el idioma
// del usuario. Por eso se devuelven como una clave i18n + parámetros, y el
// cliente los traduce con t(reason.key, reason.params).
export interface ReasonText {
  key: string;
  params?: Record<string, string | number | undefined>;
}

// Helper para construir motivos de forma concisa.
const r = (key: string, params?: Record<string, string | number | undefined>): ReasonText => ({ key, params });

export interface ScoredComponent {
  component: Component;
  totalScore: number;
  compatibilityScore: number;
  performanceScore: number;
  valueScore: number;
  reasons: ReasonText[];
  isCompatible: boolean;
}

export interface MissingTypeRecommendation {
  type_name: string;
  reason: ReasonText;
  suggestions: ScoredComponent[];
}

export interface UpgradeRecommendation {
  current: Component;
  type_name: string;
  alternatives: ScoredComponent[];
}

export interface BuildRecommendations {
  missing: MissingTypeRecommendation[];
  upgrades: UpgradeRecommendation[];
}

export interface ComponentRecommendations {
  component: Component;
  complementary: {
    type_name: string;
    reason: string;
    suggestions: ScoredComponent[];
  }[];
}

// ─────────────────────────────────────────────────────────────────
// Spec helpers
// ─────────────────────────────────────────────────────────────────

function num(specs: ComponentSpecs | undefined, key: string): number | null {
  if (!specs) return null;
  const v = specs[key];
  return typeof v === 'number' ? v : null;
}

function str(specs: ComponentSpecs | undefined, key: string): string | null {
  if (!specs) return null;
  const v = specs[key];
  return v != null ? String(v) : null;
}

// Normaliza sockets para comparar: "LGA 1700" == "LGA1700", "am4" == "AM4"
function normSocket(raw: string | null | undefined): string {
  return String(raw ?? '').toUpperCase().replace(/[^A-Z0-9]/g, '');
}

// El CPU Cooler soporta una lista de sockets (cooler_sockets). Devuelve:
//   true  -> el socket del CPU está soportado
//   false -> no está soportado
//   null  -> sin datos suficientes para evaluar
function coolerSupportsSocket(
  coolerSpecs: ComponentSpecs | undefined,
  cpuSocket: string | null,
): boolean | null {
  const list = coolerSpecs?.['cooler_sockets'];
  if (!cpuSocket || !Array.isArray(list) || list.length === 0) return null;
  return list.map((s) => normSocket(String(s))).includes(normSocket(cpuSocket));
}

export function bestPrice(c: Component): number {
  if (!c.prices || c.prices.length === 0) return Infinity;
  return Math.min(...c.prices.map((p) => p.price));
}

// ─────────────────────────────────────────────────────────────────
// Form factor ranking
// ─────────────────────────────────────────────────────────────────

const FF_RANK: Record<string, number> = {
  itx: 1, 'mini-itx': 1, 'mini itx': 1, miniitx: 1,
  matx: 2, 'micro-atx': 2, 'micro atx': 2, microatx: 2,
  atx: 3, eatx: 4, 'e-atx': 4, 'extended atx': 4,
};

function ffRank(raw: string | null): number {
  if (!raw) return -1;
  return FF_RANK[raw.toLowerCase().trim()] ?? -1;
}

// ─────────────────────────────────────────────────────────────────
// Performance scoring (0–1, normalized per component type)
// ─────────────────────────────────────────────────────────────────

export function scorePerformance(component: Component): number {
  const s = component.specs;
  switch (component.type_name) {
    case 'CPU': {
      const cores = num(s, 'core_count') ?? 4;
      const boost = num(s, 'boost_clock') ?? 3.0;
      return Math.min(1, (cores * boost) / 176); // 32c × 5.5 GHz
    }
    case 'GPU': {
      const vram  = num(s, 'vram_quantity') ?? 4;
      const clock = num(s, 'gpu_boost_clock') ?? 1500;
      return Math.min(1, (vram * clock) / 72000); // 24 GB × 3000 MHz
    }
    case 'RAM': {
      const cap   = num(s, 'capacity') ?? 8;
      const speed = num(s, 'bus_speed') ?? 3200;
      return Math.min(1, (cap * speed) / 921600); // 128 GB × 7200 MHz
    }
    case 'Storage': {
      const read = num(s, 'read_speed') ?? 500;
      const cap  = num(s, 'capacity_value') ?? 500;
      return Math.min(1, (read / 14000) * 0.6 + (cap / 8000) * 0.4);
    }
    case 'PSU': {
      return Math.min(1, (num(s, 'wattage') ?? 400) / 1600);
    }
    case 'CPU Cooler': {
      return Math.min(1, (num(s, 'tdp') ?? 65) / 360); // 360 W = top AIO
    }
    case 'Motherboard': {
      return Math.min(1, (num(s, 'memory_slots_quantity') ?? 2) / 8);
    }
    default:
      return 0.5;
  }
}

// ─────────────────────────────────────────────────────────────────
// Value score: performance per peso (0–1)
// ─────────────────────────────────────────────────────────────────

export function scoreValue(component: Component): number {
  const price = bestPrice(component);
  if (!isFinite(price) || price === 0) return 0;
  const perf = scorePerformance(component);
  const normalizedPrice = Math.min(1, price / 3_000_000); // ~3M CLP max
  return Math.min(1, perf / (normalizedPrice + 0.01) / 10);
}

// ─────────────────────────────────────────────────────────────────
// Compatibility of a candidate against the rest of the build
// ─────────────────────────────────────────────────────────────────

export function scoreCompatibility(
  candidate: Component,
  build: BuildComponent[],
): { score: number; reasons: ReasonText[]; isCompatible: boolean } {
  const cpu    = build.find((b) => b.component.type_name === 'CPU')?.component;
  const mb     = build.find((b) => b.component.type_name === 'Motherboard')?.component;
  const psu    = build.find((b) => b.component.type_name === 'PSU')?.component;
  const gpu    = build.find((b) => b.component.type_name === 'GPU')?.component;
  const cooler = build.find((b) => b.component.type_name === 'CPU Cooler')?.component;
  const pcCase = build.find((b) => b.component.type_name === 'Case')?.component;
  const ram    = build.find((b) => b.component.type_name === 'RAM')?.component;

  const reasons: ReasonText[] = [];
  let checks    = 0;
  let matches   = 0;
  let hardFails = 0;

  const pass = (reason: ReasonText) => { checks++; matches++;      reasons.push(reason); };
  const fail = (reason?: ReasonText) => { checks++; hardFails++;   if (reason) reasons.push(reason); };
  const soft = (reason?: ReasonText) => { checks++; matches += 0.5; if (reason) reasons.push(reason); };

  const type = candidate.type_name;

  // ── CPU ──────────────────────────────────────────────────────
  if (type === 'CPU') {
    if (mb) {
      const cs = str(candidate.specs, 'socket');
      const ms = str(mb.specs, 'socket');
      if (cs && ms) {
        normSocket(cs) === normSocket(ms)
          ? pass(r('reason.cpuSocketOkMb', { socket: cs }))
          : fail(r('reason.cpuSocketFailMb', { socket: cs, other: ms }));
      }
    }
    if (ram) {
      const cd = str(candidate.specs, 'ram_type')?.toUpperCase();
      const rd = str(ram.specs, 'ram_type')?.toUpperCase();
      if (cd && rd) { cd === rd ? pass(r('reason.supportsRam', { ram: cd })) : fail(); }
    }
    if (cooler) {
      const supported = coolerSupportsSocket(cooler.specs, str(candidate.specs, 'socket'));
      if (supported !== null) {
        supported
          ? pass(r('reason.coolerSocketOk'))
          : fail(r('reason.coolerSocketFail'));
      }
    }
  }

  // ── Motherboard ──────────────────────────────────────────────
  if (type === 'Motherboard') {
    if (cpu) {
      const cs = str(cpu.specs, 'socket');
      const ms = str(candidate.specs, 'socket');
      if (cs && ms) {
        normSocket(cs) === normSocket(ms)
          ? pass(r('reason.mbSocketOkCpu', { socket: ms }))
          : fail(r('reason.mbSocketFailCpu', { socket: ms, other: cs }));
      }
    }
    if (ram) {
      const rd = str(ram.specs, 'ram_type')?.toUpperCase();
      const md = str(candidate.specs, 'ram_type')?.toUpperCase();
      if (rd && md) { rd === md ? pass(r('reason.supportsRam', { ram: md })) : fail(); }
    }
    if (pcCase) {
      const cff = str(pcCase.specs, 'max_motherboard_form_factor');
      const mff = str(candidate.specs, 'form_factor');
      if (cff && mff) {
        ffRank(mff) <= ffRank(cff)
          ? pass(r('reason.mbFitsCase', { ff: mff }))
          : fail(r('reason.mbNotFitCase', { ff: mff }));
      }
    }
  }

  // ── RAM ──────────────────────────────────────────────────────
  if (type === 'RAM') {
    if (cpu) {
      const cd = str(cpu.specs, 'ram_type')?.toUpperCase();
      const rd = str(candidate.specs, 'ram_type')?.toUpperCase();
      if (cd && rd) {
        cd === rd
          ? pass(r('reason.ramOkCpu', { ram: rd }))
          : fail(r('reason.ramFailCpu', { ram: rd, needs: cd }));
      }
    }
    if (mb) {
      const md = str(mb.specs, 'ram_type')?.toUpperCase();
      const rd = str(candidate.specs, 'ram_type')?.toUpperCase();
      if (md && rd && md !== rd) { hardFails++; } // silent — ya capturado por CPU

      // Módulos de RAM vs slots de la Motherboard (no pasarse de la capacidad)
      const slots = num(mb.specs, 'memory_slots_quantity');
      if (slots !== null) {
        const candModules  = num(candidate.specs, 'module_count') ?? 1;
        const otherModules = build
          .filter((b) => b.component.type_name === 'RAM' && b.component.id !== candidate.id)
          .reduce((sum, b) => sum + (num(b.component.specs, 'module_count') ?? 1) * b.quantity, 0);
        otherModules + candModules <= slots
          ? pass(r('reason.ramFitsSlots', { slots }))
          : fail(r('reason.ramExceedSlots', { modules: otherModules + candModules, slots }));
      }
    }
  }

  // ── CPU Cooler ───────────────────────────────────────────────
  if (type === 'CPU Cooler') {
    if (cpu) {
      const ct = num(candidate.specs, 'tdp');
      const pt = num(cpu.specs, 'tdp');
      if (ct && pt) {
        if (ct >= pt * 1.2)   pass(r('reason.coolerMargin', { cooler: ct, cpu: pt }));
        else if (ct >= pt)    soft(r('reason.coolerTight', { cooler: ct, cpu: pt }));
        else                  fail(r('reason.coolerInsufficient', { cooler: ct, cpu: pt }));
      }
      const ps = str(cpu.specs, 'socket');
      const supported = coolerSupportsSocket(candidate.specs, ps);
      if (supported !== null) {
        supported
          ? pass(r('reason.socketCompatible', { socket: ps ?? '' }))
          : fail(r('reason.notSupportSocketCpu', { socket: ps ?? '' }));
      }
    }
    if (pcCase) {
      const coolerH = num(candidate.specs, 'height');
      const maxH    = num(pcCase.specs, 'max_cpu_cooler_height');
      if (coolerH !== null && maxH !== null) {
        coolerH <= maxH
          ? pass(r('reason.coolerFitsCase', { height: coolerH, max: maxH }))
          : fail(r('reason.coolerNotFitCase', { height: coolerH, max: maxH }));
      }
    }
  }

  // ── PSU ──────────────────────────────────────────────────────
  if (type === 'PSU') {
    const cpuTdp = num(cpu?.specs, 'tdp') ?? 0;
    const gpuTdp = num(gpu?.specs, 'gpu_tdp') ?? 0;
    const total  = cpuTdp + gpuTdp;
    const w      = num(candidate.specs, 'wattage');
    if (w) {
      if (total > 0) {
        if      (w >= total * 1.3) pass(r('reason.psuIdeal', { w }));
        else if (w >= total * 1.1) soft(r('reason.psuTight', { w }));
        else                       fail(r('reason.psuInsufficient', { w, cpuTdp, gpuTdp }));
      } else {
        reasons.push(r('reason.watts', { w }));
      }
    }
  }

  // ── GPU ──────────────────────────────────────────────────────
  if (type === 'GPU') {
    if (psu) {
      const pw     = num(psu.specs, 'wattage') ?? 0;
      const cpuTdp = num(cpu?.specs, 'tdp') ?? 0;
      const gTdp   = num(candidate.specs, 'gpu_tdp') ?? 0;
      if (pw > 0 && cpuTdp + gTdp > 0) {
        pw >= (cpuTdp + gTdp) * 1.3
          ? pass(r('reason.psuEnough', { w: pw }))
          : fail(r('reason.psuMaybe', { w: pw }));
      }
    }
    if (pcCase) {
      const gpuLen = num(candidate.specs, 'length');
      const maxLen = num(pcCase.specs, 'max_video_card_length');
      if (gpuLen !== null && maxLen !== null) {
        gpuLen <= maxLen
          ? pass(r('reason.gpuFitsCase', { len: gpuLen, max: maxLen }))
          : fail(r('reason.gpuNotFitCase', { len: gpuLen, max: maxLen }));
      }
    }
    const gTdp = num(candidate.specs, 'gpu_tdp');
    const vram  = num(candidate.specs, 'vram_quantity');
    if (gTdp) reasons.push(r('reason.gpuTdp', { w: gTdp }));
    if (vram)  reasons.push(r('reason.vram', { gb: vram }));
  }

  // ── Case ─────────────────────────────────────────────────────
  if (type === 'Case') {
    if (mb) {
      const mff  = str(mb.specs, 'form_factor');
      const cff  = str(candidate.specs, 'max_motherboard_form_factor');
      if (mff && cff) {
        ffRank(mff) <= ffRank(cff)
          ? pass(r('reason.caseSupportsMb', { ff: cff, mbFf: mff }))
          : fail(r('reason.caseNotSupportMb', { ff: mff }));
      }
    }
    if (gpu) {
      const gpuLen = num(gpu.specs, 'length');
      const maxLen = num(candidate.specs, 'max_video_card_length');
      if (gpuLen !== null && maxLen !== null) {
        gpuLen <= maxLen
          ? pass(r('reason.caseGpuFits', { len: gpuLen, max: maxLen }))
          : fail(r('reason.caseGpuNotFit', { len: gpuLen, max: maxLen }));
      }
    }
    if (cooler) {
      const coolerH = num(cooler.specs, 'height');
      const maxH    = num(candidate.specs, 'max_cpu_cooler_height');
      if (coolerH !== null && maxH !== null) {
        coolerH <= maxH
          ? pass(r('reason.caseCoolerFits', { height: coolerH, max: maxH }))
          : fail(r('reason.caseCoolerNotFit', { height: coolerH, max: maxH }));
      }
    }
  }

  // ── Storage ──────────────────────────────────────────────────
  if (type === 'Storage') {
    if (mb) {
      const isNvme  = candidate.specs?.['is_nvme'] === true;
      const m2Slots = num(mb.specs, 'm2_slots');
      if (isNvme && m2Slots !== null) {
        const usedSlots = build
          .filter(b => b.component.type_name === 'Storage' && b.component.specs?.['is_nvme'] === true
                    && b.component.id !== candidate.id)
          .length;
        usedSlots < m2Slots
          ? pass(r('reason.m2Available', { used: usedSlots + 1, total: m2Slots }))
          : fail(r('reason.m2Full', { total: m2Slots }));
      }
    }
    const readSpeed = num(candidate.specs, 'read_speed');
    const capacity = num(candidate.specs, 'capacity_value');
    if (readSpeed) reasons.push(r('reason.readSpeed', { speed: readSpeed.toLocaleString('es-CL') }));
    if (capacity) reasons.push(r('reason.capacityGb', { gb: capacity }));
  }

  const isCompatible = hardFails === 0;
  const compScore    = checks === 0 ? 0.7 : isCompatible ? Math.min(1, matches / checks) : 0;

  if (reasons.length === 0 && isCompatible) reasons.push(r('reason.compatibleBuild'));

  return { score: compScore, reasons, isCompatible };
}

// ─────────────────────────────────────────────────────────────────
// Score a list of candidates against the current build
// ─────────────────────────────────────────────────────────────────

export function scoreCandidates(
  candidates: Component[],
  build: BuildComponent[],
  currentComponentPrice?: number,
): ScoredComponent[] {
  return candidates
    .map((candidate) => {
      const compat = scoreCompatibility(candidate, build);
      const perf   = scorePerformance(candidate);
      const val    = scoreValue(candidate);

      // Small bonus when price is within 2× the component being replaced
      let priceBonus = 0;
      if (currentComponentPrice) {
        const price = bestPrice(candidate);
        const ratio = price / currentComponentPrice;
        if (ratio >= 0.5 && ratio <= 2.5) priceBonus = 0.08;
      }

      const total = Math.min(
        1,
        compat.score * 0.45 + val * 0.30 + perf * 0.20 + priceBonus,
      );

      return {
        component:          candidate,
        totalScore:         total,
        compatibilityScore: compat.score,
        performanceScore:   perf,
        valueScore:         val,
        reasons:            compat.reasons,
        isCompatible:       compat.isCompatible,
      };
    })
    .filter((s) => s.isCompatible)
    .sort((a, b) => b.totalScore - a.totalScore);
}

// ─────────────────────────────────────────────────────────────────
// Missing type helpers
// ─────────────────────────────────────────────────────────────────

const ESSENTIAL_TYPES = [
  'CPU', 'Motherboard', 'RAM', 'GPU', 'Storage', 'Fans', 'PSU', 'CPU Cooler', 'Case',
] as const;

export function getMissingTypes(build: BuildComponent[]): string[] {
  const present = new Set(build.map((b) => b.component.type_name));
  return ESSENTIAL_TYPES.filter((t) => !present.has(t));
}

export function getMissingTypeReason(typeName: string, build: BuildComponent[]): ReasonText {
  const cpu = build.find((b) => b.component.type_name === 'CPU')?.component;
  const mb  = build.find((b) => b.component.type_name === 'Motherboard')?.component;
  const gpu = build.find((b) => b.component.type_name === 'GPU')?.component;

  const cpuTdp = num(cpu?.specs, 'tdp') ?? 0;
  const gpuTdp = num(gpu?.specs, 'gpu_tdp') ?? 0;

  switch (typeName) {
    case 'CPU': {
      if (!mb) return r('reason.cpuHeart');
      const socket = str(mb.specs, 'socket');
      return socket ? r('reason.socketCompatible', { socket }) : r('reason.socketCompatibleMb');
    }
    case 'Motherboard': {
      if (!cpu) return r('reason.systemBase');
      const socket = str(cpu.specs, 'socket');
      return socket ? r('reason.socketCompatible', { socket }) : r('reason.socketCompatibleCpu');
    }
    case 'RAM':
      if (cpu) return r('reason.ramOkCpu', { ram: str(cpu.specs, 'ram_type') ?? 'RAM' });
      if (mb)  return r('reason.ramOkMb', { ram: str(mb.specs, 'ram_type') ?? 'RAM' });
      return r('reason.systemMemory');
    case 'CPU Cooler':
      return cpu
        ? r('reason.coolerMinDissipation', { w: Math.ceil(cpuTdp * 1.2) })
        : r('reason.cpuCooling');
    case 'PSU':
      return cpuTdp + gpuTdp > 0
        ? r('reason.psuMinRecommended', { w: Math.ceil((cpuTdp + gpuTdp) * 1.3) })
        : r('reason.systemPsu');
    case 'GPU':
      return r('reason.gpuForBuild');
    case 'Storage':
      return r('reason.storageForSystem');
    case 'Fans':
      return r('reason.fansForCooling');
    case 'Case':
      return mb
        ? r('reason.caseSupportsFf', { ff: str(mb.specs, 'form_factor') ?? 'Form Factor' })
        : r('reason.systemCase');
    default:
      return r('reason.addType', { type: typeName });
  }
}

// ─────────────────────────────────────────────────────────────────
// Complementary types for a single component view
// ─────────────────────────────────────────────────────────────────

export function getComplementaryTypes(component: Component): { type: string; reason: string }[] {
  const s      = component.specs;
  const socket = str(s, 'socket');
  const ddr    = str(s, 'ram_type');
  const tdp    = num(s, 'tdp');
  const gpuTdp = num(s, 'gpu_tdp');
  const ff     = str(s, 'max_motherboard_form_factor');

  switch (component.type_name) {
    case 'CPU':
      return [
        { type: 'Motherboard', reason: `Compatible con socket ${socket ?? 'de este CPU'}` },
        { type: 'RAM',         reason: `${ddr ?? 'RAM'} compatible con este CPU` },
        { type: 'CPU Cooler',  reason: tdp ? `Disipación mínima ${Math.ceil(tdp * 1.2)} W` : 'Compatible con este CPU' },
        { type: 'PSU',         reason: tdp ? `Fuente para CPU de ${tdp} W` : 'Fuente de poder adecuada' },
      ];
    case 'GPU':
      return [
        { type: 'PSU', reason: gpuTdp ? `Mínimo ${Math.ceil(gpuTdp * 1.3 + 100)} W recomendado` : 'Potencia adecuada para esta GPU' },
      ];
    case 'Motherboard':
      return [
        { type: 'CPU', reason: `Compatible con socket ${socket ?? 'de esta Motherboard'}` },
        { type: 'RAM', reason: `${ddr ?? 'RAM'} compatible con esta Motherboard` },
      ];
    case 'RAM':
      return [
        { type: 'CPU',         reason: `Soporta ${ddr ?? 'esta RAM'}` },
        { type: 'Motherboard', reason: `Soporta ${ddr ?? 'esta RAM'}` },
      ];
    case 'CPU Cooler':
      return [
        { type: 'CPU', reason: socket ? `Compatible con socket ${socket}` : 'Compatible con este Cooler' },
      ];
    case 'Case':
      return [
        { type: 'Motherboard', reason: ff ? `Form Factor hasta ${ff}` : 'Form Factor compatible' },
      ];
    default:
      return [];
  }
}
