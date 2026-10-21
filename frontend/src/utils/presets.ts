import { DomainVariable } from '../types/genworld';

export interface ScenarioPreset {
  id: string;
  name: string;
  badge: string;
  description: string;
  defaultRoster: string[];
  domain: DomainVariable[];
  stakeholderACondition: string;
  stakeholderBCondition: string;
}

export const SCENARIO_PRESETS: ScenarioPreset[] = [
  {
    id: "artemis_accord_prime",
    name: "Artemis Lunar Base Accord",
    badge: "Planetary Settlement",
    description: "Multilateral life-support & power architecture agreement between Lunar Operations and Planetary Science Directorate.",
    defaultRoster: [
      "0xAC529A665aF41de5Cf89BC0a9C9C0c7A60EB5795",
      "0x89D24A6b4CcB1B6fAA2625fE562bDD9a23260359"
    ],
    domain: [
      {
        id: "power_source",
        meaning: "Primary habitat energy grid technology",
        values: ["solar_storage", "nuclear_micro", "radiothermal"]
      },
      {
        id: "water_reserve_days",
        meaning: "Days of recycled water storage reserves",
        values: [30, 60, 90]
      },
      {
        id: "ai_governance",
        meaning: "Degree of autonomous agent life-support oversight",
        values: ["advisory", "autonomous"]
      }
    ],
    stakeholderACondition: "Primary power source must be nuclear_micro or radiothermal for baseload radiation shield safety during lunar night.",
    stakeholderBCondition: "Water reserve days must be 60 or 90 to ensure biological emergency buffers."
  },
  {
    id: "smart_grid_accord_2026",
    name: "Decentralized Clean Grid Accord",
    badge: "Energy Transition",
    description: "Joint allocation treaty between Municipal Power Utility and Regional Renewable Producers.",
    defaultRoster: [
      "0xAC529A665aF41de5Cf89BC0a9C9C0c7A60EB5795",
      "0x4B20993Bc481177ec7E8f571ceCaE8A9e22C02db"
    ],
    domain: [
      {
        id: "generation_mix",
        meaning: "Baseline renewable generation profile",
        values: ["solar_dominant", "wind_dominant", "hybrid_hydro"]
      },
      {
        id: "storage_buffer_mwh",
        meaning: "Battery energy storage capacity in megawatt-hours",
        values: [50, 100, 200]
      },
      {
        id: "tariff_model",
        meaning: "Dynamic versus regulated price settlement structure",
        values: ["dynamic_spot", "capped_stable"]
      }
    ],
    stakeholderACondition: "Storage buffer must be at least 100 MWh if solar_dominant generation profile is adopted.",
    stakeholderBCondition: "Tariff model must be capped_stable to protect essential public health facilities."
  },
  {
    id: "agentic_safety_accord",
    name: "Autonomous AI Collective Accord",
    badge: "AI Multi-Agent Coordination",
    description: "Constraint consensus between Frontier AI Deployment Cluster and External Safety Audit Council.",
    defaultRoster: [
      "0xAC529A665aF41de5Cf89BC0a9C9C0c7A60EB5795",
      "0x78731D3Ca6b7E34aC0F824c42a7cC18A495cabaB"
    ],
    domain: [
      {
        id: "model_architecture",
        meaning: "Neural backbone architecture for multi-agent synthesis",
        values: ["dense_transformer", "sparse_moe"]
      },
      {
        id: "safety_guardrail",
        meaning: "Verification protocol for agent output actions",
        values: ["heuristic_filter", "constitutional_ai", "dual_supervisor"]
      },
      {
        id: "compute_tier",
        meaning: "Compute cluster allocation multiplier tier",
        values: [1, 2, 4]
      }
    ],
    stakeholderACondition: "Compute tier must be 2 or 4 to sustain real-time latency SLAs.",
    stakeholderBCondition: "Safety guardrail must be constitutional_ai or dual_supervisor when compute tier exceeds 1."
  }
];
