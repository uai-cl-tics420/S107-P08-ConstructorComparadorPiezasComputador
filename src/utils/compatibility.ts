import type { BuildComponent, CompatibilityIssue } from "../types";

// ─────────────────────────────────────────────────────────────────
// Jerarquía de form factors (mayor número = más grande)
// Un case puede alojar cualquier placa de nivel <= al suyo
// ─────────────────────────────────────────────────────────────────
const FORM_FACTOR_RANK: Record<string, number> = {
  // E-ATX
  'eatx': 4, 'e-atx': 4, 'extended atx': 4,
  // ATX
  'atx': 3,
  // Micro ATX
  'matx': 2, 'micro atx': 2, 'micro-atx': 2, 'microatx': 2, 'mATX': 2,
  // Mini ITX
  'itx': 1, 'mini itx': 1, 'mini-itx': 1, 'miniitx': 1, 'mini-ITX': 1,
};

function ffRank(raw: unknown): number {
  if (!raw) return -1;
  return FORM_FACTOR_RANK[String(raw).toLowerCase().trim()] ?? -1;
}

function ffLabel(raw: unknown): string {
  return raw ? String(raw) : '?';
}

// ─────────────────────────────────────────────────────────────────
// Tipos DDR normalizados (DDR4, DDR5, etc.)
// ─────────────────────────────────────────────────────────────────
function ddrLabel(raw: unknown): string {
  return raw ? String(raw).toUpperCase().trim() : '?';
}

// ─────────────────────────────────────────────────────────────────
// Helper para leer specs numéricas de forma segura
// ─────────────────────────────────────────────────────────────────
function numSpec(component: { specs?: Record<string, unknown> } | undefined, key: string): number | null {
  if (!component?.specs) return null;
  const val = component.specs[key];
  return typeof val === 'number' ? val : null;
}

function strSpec(component: { specs?: Record<string, unknown> } | undefined, key: string): string | null {
  if (!component?.specs) return null;
  const val = component.specs[key];
  return val != null ? String(val) : null;
}

// ─────────────────────────────────────────────────────────────────
// CHECK PRINCIPAL
// ─────────────────────────────────────────────────────────────────
export function checkCompatibility(build: BuildComponent[]): CompatibilityIssue[] {
  const issues: CompatibilityIssue[] = [];

  const cpu        = build.find(b => b.component.type_name === "CPU")?.component;
  const mb         = build.find(b => b.component.type_name === "Motherboard")?.component;
  const psu        = build.find(b => b.component.type_name === "PSU")?.component;
  const cooler     = build.find(b => b.component.type_name === "CPU Cooler")?.component;
  const pcCase     = build.find(b => b.component.type_name === "Case")?.component;
  const gpu        = build.find(b => b.component.type_name === "GPU")?.component;
  const ramEntries = build.filter(b => b.component.type_name === "RAM");
  const ram        = ramEntries[0]?.component;

  // ───────────────────────────────────────────────
  // 1. CPU ↔ Motherboard — Socket
  // ───────────────────────────────────────────────
  if (cpu && mb) {
    const cpuSocket = strSpec(cpu, 'socket');
    const mbSocket  = strSpec(mb, 'socket');
    if (cpuSocket && mbSocket && cpuSocket !== mbSocket) {
      issues.push({
        type: "error",
        message: `CPU usa socket ${cpuSocket} pero la Motherboard es ${mbSocket} — son incompatibles`,
      });
    }
  }

  // ───────────────────────────────────────────────
  // 2. RAM ↔ CPU — Tipo DDR
  // ───────────────────────────────────────────────
  if (ram && cpu) {
    const cpuDdr = strSpec(cpu, 'ram_type');
    const ramDdr = strSpec(ram, 'ram_type');
    if (cpuDdr && ramDdr && cpuDdr.toUpperCase() !== ramDdr.toUpperCase()) {
      issues.push({
        type: "error",
        message: `CPU soporta ${ddrLabel(cpuDdr)} pero la RAM es ${ddrLabel(ramDdr)}`,
      });
    }
  }

  // ───────────────────────────────────────────────
  // 3. RAM ↔ Motherboard — Tipo DDR
  // ───────────────────────────────────────────────
  if (ram && mb) {
    const mbDdr  = strSpec(mb, 'ram_type');
    const ramDdr = strSpec(ram, 'ram_type');
    if (mbDdr && ramDdr && mbDdr.toUpperCase() !== ramDdr.toUpperCase()) {
      issues.push({
        type: "error",
        message: `Motherboard soporta ${ddrLabel(mbDdr)} pero la RAM es ${ddrLabel(ramDdr)}`,
      });
    }
  }

  // ───────────────────────────────────────────────
  // 4. RAM — Módulos vs slots disponibles en Motherboard
  // ───────────────────────────────────────────────
  if (mb && ramEntries.length > 0) {
    const slots = numSpec(mb, 'memory_slots_quantity');
    if (slots !== null) {
      // Suma todos los módulos de todos los kits de RAM agregados
      const totalModules = ramEntries.reduce((sum, entry) => {
        const modulesPerKit = numSpec(entry.component, 'module_count') ?? 1;
        return sum + modulesPerKit * entry.quantity;
      }, 0);
      if (totalModules > slots) {
        issues.push({
          type: "error",
          message: `Tienes ${totalModules} módulos de RAM pero la Motherboard solo tiene ${slots} slot${slots > 1 ? 's' : ''}`,
        });
      } else if (totalModules === slots) {
        issues.push({
          type: "warning",
          message: `Estás usando los ${slots} slots de RAM al máximo — no podrás ampliar memoria sin reemplazar módulos`,
        });
      }
    }
  }

  // ───────────────────────────────────────────────
  // 5. CPU Cooler ↔ CPU — TDP
  // ───────────────────────────────────────────────
  if (cooler && cpu) {
    const coolerTdp = numSpec(cooler, 'tdp');
    const cpuTdp    = numSpec(cpu, 'tdp');
    if (coolerTdp !== null && cpuTdp !== null) {
      if (coolerTdp < cpuTdp) {
        issues.push({
          type: "error",
          message: `El CPU Cooler aguanta ${coolerTdp}W pero el CPU consume ${cpuTdp}W — el sistema se sobrecalentará`,
        });
      } else if (coolerTdp < cpuTdp * 1.2) {
        issues.push({
          type: "warning",
          message: `El CPU Cooler (${coolerTdp}W) tiene muy poco margen sobre el CPU (${cpuTdp}W) — bajo carga sostenida puede tener problemas`,
        });
      }
    }
  }

  // ───────────────────────────────────────────────
  // 6. CPU Cooler ↔ CPU — Socket
  // ───────────────────────────────────────────────
  if (cooler && cpu) {
    const coolerSocket = strSpec(cooler, 'socket');
    const cpuSocket    = strSpec(cpu, 'socket');
    if (coolerSocket && cpuSocket && coolerSocket !== cpuSocket) {
      issues.push({
        type: "error",
        message: `El CPU Cooler es para socket ${coolerSocket} pero el CPU usa ${cpuSocket}`,
      });
    }
  }

  // ───────────────────────────────────────────────
  // 7. Case ↔ Motherboard — Form Factor
  // ───────────────────────────────────────────────
  if (pcCase && mb) {
    const caseMaxFF = strSpec(pcCase, 'max_motherboard_form_factor');
    const mbFF      = strSpec(mb, 'form_factor');
    if (caseMaxFF && mbFF) {
      const caseRank = ffRank(caseMaxFF);
      const mbRank   = ffRank(mbFF);
      if (caseRank !== -1 && mbRank !== -1 && mbRank > caseRank) {
        issues.push({
          type: "error",
          message: `El Case solo soporta hasta ${ffLabel(caseMaxFF)} pero la Motherboard es ${ffLabel(mbFF)} — no cabe`,
        });
      }
    }
  }

  // ───────────────────────────────────────────────
  // 8. Case ↔ CPU Cooler — Altura (form_factor del cooler)
  // ───────────────────────────────────────────────
  if (pcCase && cooler) {
    const caseCoolerFF   = strSpec(pcCase, 'form_factor');
    const coolerFF       = strSpec(cooler, 'form_factor');
    // Solo reportar si ambos tienen datos y claramente son incompatibles por tipo
    if (caseCoolerFF && coolerFF) {
      const caseLower = caseCoolerFF.toLowerCase();
      const coolerLower = coolerFF.toLowerCase();
      const caseIsITX = caseLower.includes('itx') || caseLower.includes('mini');
      const coolerIsTower = coolerLower.includes('tower') || coolerLower.includes('atx');
      if (caseIsITX && coolerIsTower) {
        issues.push({
          type: "warning",
          message: `El Case es tipo ${ffLabel(caseCoolerFF)} y el Cooler es ${ffLabel(coolerFF)} — verifica que el cooler entre en el case`,
        });
      }
    }
  }

  // ───────────────────────────────────────────────
  // 9. PSU — Wattaje total (CPU TDP + GPU TDP + margen)
  // ───────────────────────────────────────────────
  if (psu) {
    const psuWatts = numSpec(psu, 'wattage');
    if (psuWatts !== null) {
      const cpuTdp = numSpec(cpu, 'tdp') ?? 0;
      const gpuTdp = numSpec(gpu, 'gpu_tdp') ?? 0;
      const baseTdp = cpuTdp + gpuTdp;

      // Si tenemos datos de TDP del CPU o GPU
      if (baseTdp > 0) {
        const recommended = Math.ceil(baseTdp * 1.3); // +30% de margen
        const minimum     = Math.ceil(baseTdp * 1.1); // +10% mínimo absoluto

        if (psuWatts < minimum) {
          issues.push({
            type: "error",
            message: `PSU de ${psuWatts}W es insuficiente para CPU (${cpuTdp}W) + GPU (${gpuTdp}W) — necesitas mínimo ${minimum}W`,
          });
        } else if (psuWatts < recommended) {
          issues.push({
            type: "warning",
            message: `PSU de ${psuWatts}W es ajustada — se recomiendan ${recommended}W para CPU+GPU con margen de seguridad`,
          });
        }
      }
    }
  }

  // ───────────────────────────────────────────────
  // 10. Motherboard sin CPU
  // ───────────────────────────────────────────────
  if (mb && !cpu) {
    issues.push({
      type: "warning",
      message: `Tienes Motherboard pero no tienes CPU — recuerda agregar un procesador`,
    });
  }

  // ───────────────────────────────────────────────
  // 11. CPU sin Cooler (solo si el CPU no trae cooler incluido)
  // ───────────────────────────────────────────────
  if (cpu && !cooler) {
    // Los CPUs "BOX" incluyen cooler, los "TRAY" o "OEM" no
    const cpuName = cpu.name.toLowerCase();
    const isBoxed = cpuName.includes('box') || cpuName.includes('wraith') || cpuName.includes('cooler');
    if (!isBoxed) {
      issues.push({
        type: "warning",
        message: `No tienes CPU Cooler — verifica si el CPU incluye uno o agrega uno por separado`,
      });
    }
  }

  // ───────────────────────────────────────────────
  // 12. PSU sin GPU ni CPU (build incompleto)
  // ───────────────────────────────────────────────
  if (!psu && (cpu || gpu)) {
    issues.push({
      type: "warning",
      message: `No tienes PSU en el build — agrega una fuente de poder`,
    });
  }

  return issues;
}
