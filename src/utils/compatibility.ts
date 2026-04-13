import type { BuildComponent, CompatibilityIssue } from "../types";

export function checkCompatibility(build: BuildComponent[]): CompatibilityIssue[] {
  const issues: CompatibilityIssue[] = [];
  const cpu = build.find(b => b.component.type_name === "CPU")?.component;
  const motherboard = build.find(b => b.component.type_name === "Motherboard")?.component;
  const ram = build.find(b => b.component.type_name === "RAM")?.component;
  const psu = build.find(b => b.component.type_name === "PSU")?.component;

  // CPU + Motherboard socket check
  if (cpu && motherboard) {
    if (cpu.specs?.socket && motherboard.specs?.socket && cpu.specs.socket !== motherboard.specs.socket) {
      issues.push({
        type: "error",
        message: `CPU (${cpu.specs.socket}) incompatible con Motherboard (${motherboard.specs.socket})`
      });
    }
  }

  // CPU + RAM type check
  if (cpu && ram) {
    if (cpu.specs?.ram_type && ram.specs?.ram_type && cpu.specs.ram_type !== ram.specs.ram_type) {
      issues.push({
        type: "error",
        message: `CPU soporta ${cpu.specs.ram_type} pero la RAM es ${ram.specs.ram_type}`
      });
    }
  }

  // PSU wattage check
  if (psu) {
    const totalTdp = build.reduce((sum, b) => sum + (b.component.specs?.tdp ?? 0), 0);
    const recommended = Math.ceil(totalTdp * 1.3);
    if (psu.specs?.wattage && psu.specs.wattage < recommended) {
      issues.push({
        type: "warning",
        message: `PSU de ${psu.specs.wattage}W puede ser insuficiente (se recomiendan ${recommended}W)`
      });
    }
  }

  return issues;
}
