# { "Depends": "py-genlayer:1jb45aa8ynh2a9c9xn3b7qqh8sm5q93hwfp7jqmwsfhh8jpz09h6" }

"""GenWorld Protocol: Decentralized Semantic Constraint Negotiation & Multi-Stakeholder Plan Alignment.

Enables multiple independent stakeholders to define a shared discrete possibility space
("domain of worlds"), submit natural language constraints, and leverage GenLayer AI-validator
consensus to compile conditions into verifiable boolean logic. GenWorld's on-chain solver
then mathematically diagnoses feasibility, isolates Minimal Unsatisfiable Subsets (MUS conflict cores),
computes minimal repair paths, and locks unanimous multi-party commitment upon agreement.
"""

from genlayer import *
import json
import hashlib

PROTOCOL_NAME = "GENWORLD-V1"
COMPILER_VERSION = "GENWORLD-COMPILE-V1"
MAX_WORLDS = 64
MAX_CLAUSES = 8
MAX_AST_NODES = 64
MAX_AST_DEPTH = 8


# ── Core Helpers & AST Evaluation ─────────────────────────────────────────────

def _canonical_json(data) -> str:
    """Deterministic JSON string for consensus agreement and state digests."""
    return json.dumps(data, sort_keys=True, separators=(",", ":"), ensure_ascii=False)


def _digest_json(data) -> str:
    """SHA-256 digest of canonical JSON."""
    return hashlib.sha256(_canonical_json(data).encode("utf-8")).hexdigest()


def _cartesian_product(pools: list) -> list:
    """Pure-python Cartesian product without itertools."""
    result = [[]]
    for pool in pools:
        result = [x + [y] for x in result for y in pool]
    return result


def _validate_address_str(addr: str) -> str:
    """Validate 20-byte hex address and normalize to lowercase."""
    if not isinstance(addr, str) or len(addr) != 42 or not addr.startswith("0x"):
        raise gl.vm.UserError("INVALID_ADDRESS_FORMAT")
    for c in addr[2:]:
        if c not in "0123456789abcdefABCDEF":
            raise gl.vm.UserError("INVALID_ADDRESS_HEX")
    lowered = addr.lower()
    if lowered == "0x" + "0" * 40:
        raise gl.vm.UserError("ZERO_ADDRESS")
    return lowered


def _validate_scalar(val):
    """Validate allowed discrete value: integer [-1000, 1000], string (1-40 chars), or boolean."""
    if isinstance(val, bool):
        return val
    elif isinstance(val, int):
        if not (-1000 <= val <= 1000):
            raise gl.vm.UserError("SCALAR_INT_OUT_OF_BOUNDS")
        return val
    elif isinstance(val, str):
        cleaned = val.strip()
        if not (1 <= len(cleaned) <= 40):
            raise gl.vm.UserError("SCALAR_STR_LENGTH_INVALID")
        if any(ord(c) < 32 for c in cleaned):
            raise gl.vm.UserError("SCALAR_STR_CONTAINS_CONTROL_CHARS")
        return cleaned
    raise gl.vm.UserError(f"UNSUPPORTED_SCALAR_TYPE: {type(val)}")


def _validate_domain(spec: list) -> list:
    """Validate domain specification: 1 to 4 discrete variables producing <= 64 worlds."""
    if not isinstance(spec, list) or not (1 <= len(spec) <= 4):
        raise gl.vm.UserError("DOMAIN_VARIABLE_COUNT_MUST_BE_1_TO_4")

    validated = []
    seen_ids = set()
    total_worlds = 1

    for item in spec:
        if not isinstance(item, dict):
            raise gl.vm.UserError("DOMAIN_ITEM_MUST_BE_OBJECT")
        if set(item.keys()) != {"id", "meaning", "values"}:
            raise gl.vm.UserError("DOMAIN_ITEM_INVALID_KEYS")

        var_id = item["id"]
        if not isinstance(var_id, str) or not (1 <= len(var_id) <= 32):
            raise gl.vm.UserError("VAR_ID_INVALID_LENGTH")
        if not (var_id[0].isalpha() or var_id[0] == "_"):
            raise gl.vm.UserError("VAR_ID_MUST_START_WITH_LETTER")
        if any(not (c.isalnum() or c == "_") for c in var_id):
            raise gl.vm.UserError("VAR_ID_INVALID_CHARACTERS")
        if var_id in seen_ids:
            raise gl.vm.UserError(f"DUPLICATE_VAR_ID: {var_id}")
        seen_ids.add(var_id)

        meaning = item["meaning"]
        if not isinstance(meaning, str) or not (1 <= len(meaning.strip()) <= 160):
            raise gl.vm.UserError("VAR_MEANING_LENGTH_INVALID")

        raw_values = item["values"]
        if not isinstance(raw_values, list) or not (2 <= len(raw_values) <= 4):
            raise gl.vm.UserError("VAR_VALUES_COUNT_MUST_BE_2_TO_4")

        scalars = [_validate_scalar(v) for v in raw_values]
        first_type = type(scalars[0])
        if any(type(v) is not first_type for v in scalars):
            raise gl.vm.UserError("VAR_VALUES_TYPE_MISMATCH")
        if len({_canonical_json(v) for v in scalars}) != len(scalars):
            raise gl.vm.UserError("DUPLICATE_VAR_VALUE")

        total_worlds *= len(scalars)
        if total_worlds > MAX_WORLDS:
            raise gl.vm.UserError(f"POSSIBILITY_SPACE_EXCEEDS_LIMIT_{MAX_WORLDS}")

        validated.append({
            "id": var_id,
            "meaning": meaning.strip(),
            "values": scalars
        })

    return validated


def _compute_worlds(domain_spec: list) -> list:
    """Generate all possible assignments (worlds) in canonical Cartesian product order."""
    var_ids = [v["id"] for v in domain_spec]
    value_pools = [v["values"] for v in domain_spec]
    product_rows = _cartesian_product(value_pools)
    return [dict(zip(var_ids, row)) for row in product_rows]


def _validate_ast_expr(expr: dict, domain_spec: list) -> dict:
    """Strictly validate AST predicate against domain variables; zero eval or dynamic execution."""
    types = {v["id"]: type(v["values"][0]) for v in domain_spec}
    node_count = [0]

    def _walk(node, depth: int, is_operand: bool = False):
        node_count[0] += 1
        if depth > MAX_AST_DEPTH or node_count[0] > MAX_AST_NODES:
            raise gl.vm.UserError("AST_EXCEEDS_NODE_OR_DEPTH_LIMIT")
        if not isinstance(node, dict):
            raise gl.vm.UserError("AST_NODE_MUST_BE_DICT")

        if is_operand:
            if set(node.keys()) == {"var"}:
                v_name = node["var"]
                if not isinstance(v_name, str) or v_name not in types:
                    raise gl.vm.UserError(f"UNKNOWN_VARIABLE_IN_AST: {v_name}")
                return types[v_name]
            elif set(node.keys()) == {"lit"}:
                lit_val = _validate_scalar(node["lit"])
                return type(lit_val)
            raise gl.vm.UserError("INVALID_OPERAND_KEYS")

        op = node.get("op")
        if not isinstance(op, str):
            raise gl.vm.UserError("INVALID_OPERATOR_TYPE")

        if op in ("and", "or"):
            if set(node.keys()) != {"op", "args"}:
                raise gl.vm.UserError("LOGICAL_OP_INVALID_KEYS")
            args = node["args"]
            if not isinstance(args, list) or not (2 <= len(args) <= 8):
                raise gl.vm.UserError("LOGICAL_OP_INVALID_ARITY")
            for child in args:
                _walk(child, depth + 1, is_operand=False)
            return bool
        elif op == "not":
            if set(node.keys()) != {"op", "arg"}:
                raise gl.vm.UserError("NOT_OP_INVALID_KEYS")
            _walk(node["arg"], depth + 1, is_operand=False)
            return bool
        elif op in ("eq", "ne", "lt", "le"):
            if set(node.keys()) != {"op", "left", "right"}:
                raise gl.vm.UserError("COMPARE_OP_INVALID_KEYS")
            t_left = _walk(node["left"], depth + 1, is_operand=True)
            t_right = _walk(node["right"], depth + 1, is_operand=True)
            if t_left is not t_right:
                raise gl.vm.UserError(f"COMPARE_TYPE_MISMATCH: {t_left} vs {t_right}")
            if op in ("lt", "le") and t_left is not int:
                raise gl.vm.UserError("ORDER_COMPARISON_REQUIRES_INT")
            return bool
        else:
            raise gl.vm.UserError(f"UNRECOGNIZED_OPERATOR: {op}")

    _walk(expr, depth=1, is_operand=False)
    return expr


def _eval_ast(expr: dict, world_assignment: dict) -> bool:
    """Evaluate validated AST predicate against a concrete world assignment."""
    op = expr["op"]
    if op == "and":
        return all(_eval_ast(child, world_assignment) for child in expr["args"])
    elif op == "or":
        return any(_eval_ast(child, world_assignment) for child in expr["args"])
    elif op == "not":
        return not _eval_ast(expr["arg"], world_assignment)

    left_val = world_assignment[expr["left"]["var"]] if "var" in expr["left"] else expr["left"]["lit"]
    right_val = world_assignment[expr["right"]["var"]] if "var" in expr["right"] else expr["right"]["lit"]

    if op == "eq":
        return left_val == right_val
    elif op == "ne":
        return left_val != right_val
    elif op == "lt":
        return left_val < right_val
    elif op == "le":
        return left_val <= right_val
    return False


def _compute_clause_mask(expr: dict, domain_spec: list) -> int:
    """Compute 64-bit integer bitmask representing world indices where expression evaluates to True."""
    all_worlds = _compute_worlds(domain_spec)
    mask = 0
    for idx, world in enumerate(all_worlds):
        if _eval_ast(expr, world):
            mask |= (1 << idx)
    return mask


# ── Mathematical Feasibility & Conflict Diagnosis ───────────────────────────

def _diagnose_feasibility(clause_masks: list, world_count: int) -> dict:
    """Analyze joint satisfiability: computes feasible world IDs or isolates Minimal Unsatisfiable Subsets (MUS)."""
    if world_count > MAX_WORLDS or len(clause_masks) > MAX_CLAUSES:
        raise gl.vm.UserError("DIAGNOSIS_BOUNDS_EXCEEDED")

    universe_mask = (1 << world_count) - 1
    num_clauses = len(clause_masks)
    subset_count = 1 << num_clauses
    intersections = [universe_mask] * subset_count

    for s in range(1, subset_count):
        lowest_bit = s & -s
        clause_idx = lowest_bit.bit_length() - 1
        intersections[s] = intersections[s ^ lowest_bit] & clause_masks[clause_idx]

    full_subset = (1 << num_clauses) - 1
    feasible_mask = intersections[full_subset]

    feasible_world_ids = [i for i in range(world_count) if (feasible_mask & (1 << i)) != 0]

    cores = []
    repairs = []

    if feasible_mask == 0 and num_clauses > 0:
        # 1. Minimal Unsatisfiable Subsets (MUS): subset with 0 intersection, but removing any member becomes non-zero
        for s in range(1, subset_count):
            members = [i for i in range(num_clauses) if (s & (1 << i))]
            if intersections[s] == 0:
                if all(intersections[s ^ (1 << i)] != 0 for i in members):
                    witnesses = []
                    for i in members:
                        w_mask = intersections[s ^ (1 << i)]
                        witness_world = (w_mask & -w_mask).bit_length() - 1
                        witnesses.append({"removed_clause": i, "witness_world": witness_world})
                    cores.append({"members": members, "witnesses": witnesses})

        # 2. Minimal Correction Sets (MCS): minimal set of clauses to remove to make remainder feasible
        for s in range(1, subset_count):
            members = [i for i in range(num_clauses) if (s & (1 << i))]
            kept_subset = full_subset ^ s
            if intersections[kept_subset] != 0:
                if all(intersections[kept_subset | (1 << i)] == 0 for i in members):
                    repair_world = (intersections[kept_subset] & -intersections[kept_subset]).bit_length() - 1
                    repairs.append({"remove_clauses": members, "restored_world": repair_world})

    return {
        "feasible_mask": feasible_mask,
        "world_ids": feasible_world_ids,
        "minimal_cores": cores,
        "minimal_corrections": repairs
    }


# ── AI Compilation Prompt & Verification ──────────────────────────────────────

AI_COMPILER_SYSTEM_PROMPT = """GENWORLD-COMPILE-V1
You are an independent AI validator compiling natural-language stakeholder conditions into typed boolean AST predicates over the frozen discrete domain.

CORE COMPILATION RULES:
1. Translate each condition in isolation against the declared variable IDs, meanings, and discrete values.
2. Output STRICT JSON only. No explanations, markdown tags, or prose.
3. Allowed AST node structures:
   - Variable operand: {"var": "variable_id"}
   - Literal operand:  {"lit": value}
   - Binary comparison: {"op": "eq"|"ne"|"lt"|"le", "left": operand, "right": operand}
   - Negation:          {"op": "not", "arg": predicate}
   - Conjunction/Disjunction: {"op": "and"|"or", "args": [predicate, predicate, ...]}
4. If a condition is ambiguous, contradictory, or refers to undeclared variables, mark status as "UNKNOWN" and expr as null.
5. Allowed status values: "COMPILED" or "UNKNOWN".

Output Format:
{
  "input_hash": "<exact supplied input_hash>",
  "rules": [
    {"clause_id": "<clause_id>", "status": "COMPILED", "expr": <predicate>},
    {"clause_id": "<clause_id>", "status": "UNKNOWN", "expr": null}
  ]
}
"""


def _build_ai_prompt(session_snapshot: dict) -> str:
    """Build canonical compiler prompt for AI consensus."""
    clauses = []
    for owner in session_snapshot["roster"]:
        for text_val in session_snapshot["sealed"].get(owner, []):
            clauses.append({
                "id": f"C{len(clauses)}",
                "owner": owner,
                "text": text_val
            })

    source_data = {
        "protocol": PROTOCOL_NAME,
        "prompt_version": COMPILER_VERSION,
        "input_hash": session_snapshot["input_hash"],
        "domain": session_snapshot["domain"],
        "conditions": clauses
    }

    return AI_COMPILER_SYSTEM_PROMPT + "\nSEALED_STAKEHOLDER_SOURCE:\n" + _canonical_json(source_data)


def _parse_ai_compilation(session_snapshot: dict, raw_json_data) -> list:
    """Validate AI compiler output structure and compute boolean truth masks."""
    if isinstance(raw_json_data, dict):
        parsed = raw_json_data
    else:
        try:
            parsed = json.loads(raw_json_data)
        except Exception as exc:
            raise gl.vm.UserError(f"INVALID_COMPILATION_JSON: {exc}")

    if not isinstance(parsed, dict) or set(parsed.keys()) != {"input_hash", "rules"}:
        raise gl.vm.UserError("COMPILATION_TOP_LEVEL_KEYS_INVALID")
    if parsed["input_hash"] != session_snapshot["input_hash"]:
        raise gl.vm.UserError("COMPILATION_INPUT_HASH_MISMATCH")

    clauses = []
    for owner in session_snapshot["roster"]:
        for text_val in session_snapshot["sealed"].get(owner, []):
            clauses.append(f"C{len(clauses)}")

    rules = parsed["rules"]
    if not isinstance(rules, list) or len(rules) != len(clauses):
        raise gl.vm.UserError("COMPILATION_RULE_COUNT_MISMATCH")

    normalized_rules = []
    for clause_id, rule in zip(clauses, rules):
        if not isinstance(rule, dict) or set(rule.keys()) != {"clause_id", "status", "expr"}:
            raise gl.vm.UserError("RULE_RECORD_INVALID_KEYS")
        if rule["clause_id"] != clause_id:
            raise gl.vm.UserError(f"RULE_ID_MISMATCH: {rule['clause_id']} vs {clause_id}")
        if rule["status"] not in ("COMPILED", "UNKNOWN"):
            raise gl.vm.UserError(f"INVALID_RULE_STATUS: {rule['status']}")

        if rule["status"] == "UNKNOWN":
            if rule["expr"] is not None:
                raise gl.vm.UserError("UNKNOWN_RULE_MUST_HAVE_NULL_EXPR")
            normalized_rules.append({
                "clause_id": clause_id,
                "status": "UNKNOWN",
                "expr": None,
                "mask": None
            })
        else:
            validated_expr = _validate_ast_expr(rule["expr"], session_snapshot["domain"])
            bitmask = _compute_clause_mask(validated_expr, session_snapshot["domain"])
            normalized_rules.append({
                "clause_id": clause_id,
                "status": "COMPILED",
                "expr": validated_expr,
                "mask": bitmask
            })

    return normalized_rules


def _compute_session_state_hash(session_data: dict) -> str:
    """Digest of active session negotiation state for optimistic concurrency control."""
    state_subset = {
        "input_hash": session_data.get("input_hash"),
        "revision": session_data.get("revision", 0),
        "masks": session_data.get("masks", []),
        "waived": session_data.get("waived", []),
        "status": session_data.get("status")
    }
    return _digest_json(state_subset)


# ── GenWorld Intelligent Contract ─────────────────────────────────────────────

class GenWorld(gl.Contract):
    """GenWorld: Decentralized Semantic Constraint Negotiation & Multi-Stakeholder Plan Alignment Contract."""

    sessions: TreeMap[str, str]
    session_ids: TreeMap[str, str]
    session_count: u64

    def __init__(self):
        self.session_count = u64(0)

    # ── Internal Storage Access Helpers ───────────────────────────────────────

    def _load_session(self, session_id: str) -> dict:
        if not isinstance(session_id, str) or not (1 <= len(session_id) <= 64):
            raise gl.vm.UserError("INVALID_SESSION_ID_LENGTH")
        if session_id not in self.sessions:
            raise gl.vm.UserError(f"SESSION_NOT_FOUND: {session_id}")
        return json.loads(self.sessions[session_id])

    def _persist_session(self, session_state: dict) -> None:
        self.sessions[session_state["id"]] = _canonical_json(session_state)

    def _get_clauses_list(self, session_state: dict) -> list:
        clauses = []
        for owner in session_state["roster"]:
            for text_val in session_state["sealed"].get(owner, []):
                clauses.append({
                    "id": f"C{len(clauses)}",
                    "owner": owner,
                    "text": text_val
                })
        return clauses

    def _refresh_diagnosis(self, session_state: dict) -> None:
        active_clause_indices = [i for i in range(len(session_state["masks"])) if i not in session_state["waived"]]
        active_masks = [session_state["masks"][i] for i in active_clause_indices]
        world_count = len(_compute_worlds(session_state["domain"]))

        diagnosis = _diagnose_feasibility(active_masks, world_count)

        # Remap internal active indices back to absolute clause indices
        for core in diagnosis["minimal_cores"]:
            core["members"] = [active_clause_indices[i] for i in core["members"]]
            for w in core["witnesses"]:
                w["removed_clause"] = active_clause_indices[w["removed_clause"]]
        for repair in diagnosis["minimal_corrections"]:
            repair["remove_clauses"] = [active_clause_indices[i] for i in repair["remove_clauses"]]

        session_state["diagnosis"] = diagnosis
        session_state["status"] = "FEASIBLE" if diagnosis["feasible_mask"] != 0 else "BLOCKED"

    # ── Public Write Methods ──────────────────────────────────────────────────

    @gl.public.write
    def create_session(self, session_id: str, participants: list[Address], domain_json: str) -> None:
        """Initialize a new multi-stakeholder world negotiation session."""
        if not isinstance(session_id, str) or not (1 <= len(session_id) <= 64):
            raise gl.vm.UserError("INVALID_SESSION_ID")
        if any(not (c.isalnum() or c in "_-") for c in session_id):
            raise gl.vm.UserError("SESSION_ID_INVALID_CHARACTERS")
        if session_id in self.sessions:
            raise gl.vm.UserError("SESSION_ALREADY_EXISTS")

        if not isinstance(participants, list) or not (2 <= len(participants) <= 4):
            raise gl.vm.UserError("PARTICIPANTS_COUNT_MUST_BE_2_TO_4")

        roster = [_validate_address_str(str(Address(p))) for p in participants]
        if len(set(roster)) != len(roster):
            raise gl.vm.UserError("DUPLICATE_PARTICIPANT_ADDRESS")

        caller_addr = _validate_address_str(str(gl.message.sender_address))
        if caller_addr not in roster:
            raise gl.vm.UserError("CREATOR_MUST_BE_IN_ROSTER")

        try:
            domain_spec = json.loads(domain_json)
        except Exception:
            raise gl.vm.UserError("INVALID_DOMAIN_JSON")

        validated_domain = _validate_domain(domain_spec)

        initial_state = {
            "protocol": PROTOCOL_NAME,
            "id": session_id,
            "roster": roster,
            "domain": validated_domain,
            "sealed": {},
            "status": "COLLECTING",
            "revision": 0,
            "compilation": None,
            "masks": [],
            "waived": [],
            "approvals": {},
            "committed": None,
            "input_hash": None,
            "diagnosis": None,
            "cancelled_by": None
        }

        self._persist_session(initial_state)
        self.session_ids[str(int(self.session_count))] = session_id
        self.session_count = u64(int(self.session_count) + 1)

    @gl.public.write
    def seal_conditions(self, session_id: str, conditions: list[str]) -> None:
        """Stakeholder submits natural language constraints into the session."""
        state = self._load_session(session_id)
        caller_addr = _validate_address_str(str(gl.message.sender_address))

        if caller_addr not in state["roster"]:
            raise gl.vm.UserError("CALLER_NOT_IN_ROSTER")
        if state["status"] != "COLLECTING":
            raise gl.vm.UserError("SESSION_NOT_IN_COLLECTING_STATE")
        if caller_addr in state["sealed"]:
            raise gl.vm.UserError("CONDITIONS_ALREADY_SEALED")

        if not isinstance(conditions, list) or not (1 <= len(conditions) <= 2):
            raise gl.vm.UserError("MUST_SEAL_1_TO_2_CONDITIONS")

        cleaned_conditions = []
        for cond in conditions:
            if not isinstance(cond, str) or not (1 <= len(cond.strip()) <= 480):
                raise gl.vm.UserError("CONDITION_TEXT_INVALID_LENGTH")
            if any(ord(c) < 32 and c not in "\n\t" for c in cond):
                raise gl.vm.UserError("CONDITION_CONTAINS_CONTROL_CHARS")
            cleaned_conditions.append(cond.strip())

        if len(set(cleaned_conditions)) != len(cleaned_conditions):
            raise gl.vm.UserError("DUPLICATE_CONDITION_IN_SUBMISSION")

        state["sealed"][caller_addr] = cleaned_conditions

        # If all participants have sealed, advance state and compute input hash
        if len(state["sealed"]) == len(state["roster"]):
            state["status"] = "AWAITING_COMPILATION"
            clauses = self._get_clauses_list(state)
            hash_input = {
                "protocol": PROTOCOL_NAME,
                "id": state["id"],
                "roster": state["roster"],
                "domain": state["domain"],
                "clauses": clauses
            }
            state["input_hash"] = _digest_json(hash_input)

        self._persist_session(state)

    @gl.public.write
    def compile_session(self, session_id: str) -> None:
        """Trigger GenLayer AI validator consensus to compile natural language conditions into boolean ASTs."""
        snapshot = self._load_session(session_id)
        if snapshot["status"] != "AWAITING_COMPILATION":
            raise gl.vm.UserError("SESSION_NOT_AWAITING_COMPILATION")

        # ── Storage Pre-Extraction (CRITICAL RULE) ────────────────────────────
        # Extract all state into immutable local Python strings/primitives before defining closures.
        snapshot_json = _canonical_json(snapshot)
        prompt_text = _build_ai_prompt(snapshot)

        def leader_fn() -> str:
            # Independent non-deterministic prompt execution
            raw_response = gl.nondet.exec_prompt(prompt_text, response_format="text")
            try:
                # Validate compilation AST structure deterministically
                _parse_ai_compilation(json.loads(snapshot_json), raw_response)
                raw_dict = json.loads(raw_response) if isinstance(raw_response, str) else raw_response
                return _canonical_json(raw_dict)
            except Exception as e:
                raise gl.vm.UserError(f"LEADER_COMPILATION_ERROR: {e}")

        def validator_fn(leader_res) -> bool:
            if not isinstance(leader_res, gl.vm.Return):
                return False
            try:
                independent_raw = leader_fn()
                local_snap = json.loads(snapshot_json)
                rules_leader = _parse_ai_compilation(local_snap, leader_res.calldata)
                rules_validator = _parse_ai_compilation(local_snap, independent_raw)
                # Consensus equivalence: both must agree on status and boolean bitmask over all worlds
                eq_leader = [(r["status"], r["mask"]) for r in rules_leader]
                eq_validator = [(r["status"], r["mask"]) for r in rules_validator]
                return eq_leader == eq_validator
            except Exception:
                return False

        accepted_compilation_raw = gl.vm.run_nondet_unsafe(leader_fn, validator_fn)

        # Confirm storage was not modified concurrently
        if _canonical_json(self._load_session(session_id)) != snapshot_json:
            raise gl.vm.UserError("CONCURRENT_STATE_MODIFICATION")

        parsed_rules = _parse_ai_compilation(snapshot, accepted_compilation_raw)
        snapshot["compilation"] = parsed_rules

        if any(r["status"] == "UNKNOWN" for r in parsed_rules):
            snapshot["status"] = "REVIEW_REQUIRED"
        else:
            snapshot["masks"] = [r["mask"] for r in parsed_rules]
            self._refresh_diagnosis(snapshot)

        self._persist_session(snapshot)

    @gl.public.write
    def waive_condition(self, session_id: str, clause_id: str, expected_hash: str) -> None:
        """Stakeholder waives a condition they own to resolve mutual conflict and restore feasibility."""
        state = self._load_session(session_id)
        caller_addr = _validate_address_str(str(gl.message.sender_address))

        if caller_addr not in state["roster"]:
            raise gl.vm.UserError("CALLER_NOT_IN_ROSTER")
        if state["status"] not in ("FEASIBLE", "BLOCKED"):
            raise gl.vm.UserError("SESSION_NOT_NEGOTIABLE")

        current_hash = _compute_session_state_hash(state)
        if expected_hash != current_hash:
            raise gl.vm.UserError("STALE_STATE_HASH")

        clauses = self._get_clauses_list(state)
        clause_map = {c["id"]: i for i, c in enumerate(clauses)}
        if clause_id not in clause_map:
            raise gl.vm.UserError(f"CLAUSE_ID_NOT_FOUND: {clause_id}")

        idx = clause_map[clause_id]
        if clauses[idx]["owner"] != caller_addr:
            raise gl.vm.UserError("ONLY_CLAUSE_OWNER_MAY_WAIVE")
        if idx in state["waived"]:
            raise gl.vm.UserError("CLAUSE_ALREADY_WAIVED")

        state["waived"] = sorted(state["waived"] + [idx])
        state["revision"] += 1
        state["approvals"] = {}

        self._refresh_diagnosis(state)
        self._persist_session(state)

    @gl.public.write
    def approve_plan(self, session_id: str, world_id: int, expected_hash: str) -> None:
        """Vote to approve a specific feasible world assignment. Unanimous vote permanently commits the plan."""
        state = self._load_session(session_id)
        caller_addr = _validate_address_str(str(gl.message.sender_address))

        if caller_addr not in state["roster"]:
            raise gl.vm.UserError("CALLER_NOT_IN_ROSTER")
        if state["status"] != "FEASIBLE":
            raise gl.vm.UserError("SESSION_NOT_FEASIBLE")

        current_hash = _compute_session_state_hash(state)
        if expected_hash != current_hash:
            raise gl.vm.UserError("STALE_STATE_HASH")

        if not isinstance(world_id, int) or world_id not in state["diagnosis"]["world_ids"]:
            raise gl.vm.UserError(f"WORLD_ID_NOT_FEASIBLE: {world_id}")

        state["approvals"][caller_addr] = world_id

        # Check for unanimous agreement across all roster members
        if len(state["approvals"]) == len(state["roster"]):
            distinct_approvals = set(state["approvals"].values())
            if len(distinct_approvals) == 1 and next(iter(distinct_approvals)) == world_id:
                all_worlds = _compute_worlds(state["domain"])
                state["committed"] = {
                    "world_id": world_id,
                    "plan": all_worlds[world_id],
                    "revision": state["revision"],
                    "state_hash": expected_hash
                }
                state["status"] = "COMMITTED"

        self._persist_session(state)

    @gl.public.write
    def cancel_session(self, session_id: str) -> None:
        """Stakeholder cancels the negotiation session."""
        state = self._load_session(session_id)
        caller_addr = _validate_address_str(str(gl.message.sender_address))

        if caller_addr not in state["roster"]:
            raise gl.vm.UserError("CALLER_NOT_IN_ROSTER")
        if state["status"] in ("COMMITTED", "CANCELLED"):
            raise gl.vm.UserError("SESSION_IN_TERMINAL_STATE")

        state["status"] = "CANCELLED"
        state["cancelled_by"] = caller_addr
        state["approvals"] = {}

        self._persist_session(state)

    # ── Public View Methods ───────────────────────────────────────────────────

    @gl.public.view
    def get_session(self, session_id: str) -> str:
        """Retrieve complete session JSON state."""
        return _canonical_json(self._load_session(session_id))

    @gl.public.view
    def get_state_hash(self, session_id: str) -> str:
        """Retrieve current negotiation state hash for concurrency protection."""
        return _compute_session_state_hash(self._load_session(session_id))

    @gl.public.view
    def list_sessions(self, offset: int, limit: int) -> list[str]:
        """Paginated list of active session IDs."""
        total = int(self.session_count)
        if not (0 <= offset <= total) or not (1 <= limit <= 50):
            raise gl.vm.UserError("INVALID_PAGE_BOUNDS")
        end = min(offset + limit, total)
        return [self.session_ids[str(i)] for i in range(offset, end)]

    @gl.public.view
    def get_protocol(self) -> str:
        """Retrieve protocol specification metadata."""
        return _canonical_json({
            "protocol": PROTOCOL_NAME,
            "compiler": COMPILER_VERSION,
            "max_worlds": MAX_WORLDS,
            "max_clauses": MAX_CLAUSES,
            "max_ast_nodes": MAX_AST_NODES,
            "max_ast_depth": MAX_AST_DEPTH,
            "target_network": "Stable Studionet",
            "chain_id": 61999
        })
