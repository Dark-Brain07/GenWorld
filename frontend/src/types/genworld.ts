export type ScalarValue = string | number | boolean;

export interface DomainVariable {
  id: string;
  meaning: string;
  values: ScalarValue[];
}

export interface Clause {
  id: string;
  owner: string;
  text: string;
}

export interface Witness {
  removed_clause: number;
  witness_world: number;
}

export interface MinimalCore {
  members: number[];
  witnesses: Witness[];
}

export interface MinimalCorrection {
  remove_clauses: number[];
  restored_world: number;
}

export interface Diagnosis {
  feasible_mask: number;
  world_ids: number[];
  minimal_cores: MinimalCore[];
  minimal_corrections: MinimalCorrection[];
}

export interface CompiledRule {
  clause_id: string;
  status: "COMPILED" | "UNKNOWN";
  expr: any;
  mask: number | null;
}

export interface CommittedPlan {
  world_id: number;
  plan: Record<string, ScalarValue>;
  revision: number;
  state_hash: string;
}

export type SessionStatus =
  | "COLLECTING"
  | "AWAITING_COMPILATION"
  | "REVIEW_REQUIRED"
  | "FEASIBLE"
  | "BLOCKED"
  | "COMMITTED"
  | "CANCELLED";

export interface WorldSession {
  protocol: string;
  id: string;
  roster: string[];
  domain: DomainVariable[];
  sealed: Record<string, string[]>;
  status: SessionStatus;
  revision: number;
  compilation: CompiledRule[] | null;
  masks: number[];
  waived: number[];
  approvals: Record<string, number>;
  committed: CommittedPlan | null;
  input_hash: string | null;
  diagnosis: Diagnosis | null;
  cancelled_by: string | null;
}

export interface TransactionLifecycleState {
  isOpen: boolean;
  txHash: string;
  stage: "idle" | "preparing" | "submitted" | "proposing" | "finalized" | "error";
  title: string;
  description: string;
  explorerUrl?: string;
  receipt?: any;
  error?: string;
}
