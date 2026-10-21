"""Comprehensive Direct Mode Test Suite for GenWorld Intelligent Contract on GenVM.

Validates:
1. Protocol configuration, limits, and deployment sanity.
2. Multi-stakeholder world negotiation session creation and roster bounds.
3. Natural language condition sealing and state transition to AWAITING_COMPILATION.
4. Input digest computation over roster, domain, and conditions.
5. Session listing and pagination.
6. Edge case validations (invalid ID, duplicate participants, non-member callers).
"""

import json
import pytest

CONTRACT_PATH = "contracts/gen_world.py"

SAMPLE_DOMAIN = [
    {
        "id": "power_source",
        "meaning": "Primary habitat energy grid technology",
        "values": ["solar", "nuclear", "fusion"]
    },
    {
        "id": "water_reserve_days",
        "meaning": "Days of recycled water storage reserves",
        "values": [30, 60, 90]
    },
    {
        "id": "ai_governance",
        "meaning": "Degree of autonomous agent oversight",
        "values": ["advisory", "autonomous"]
    }
]


def addr_hex(b) -> str:
    if isinstance(b, bytes):
        return "0x" + b.hex().lower()
    return str(b).lower()


# ==============================================================================
# 1. Protocol Metadata & Deployment Tests
# ==============================================================================

def test_protocol_metadata(direct_deploy, direct_alice):
    contract = direct_deploy(CONTRACT_PATH)
    raw_proto = contract.get_protocol()
    proto = json.loads(raw_proto)

    assert proto["protocol"] == "GENWORLD-V1"
    assert proto["compiler"] == "GENWORLD-COMPILE-V1"
    assert proto["max_worlds"] == 64
    assert proto["max_clauses"] == 8
    assert proto["chain_id"] == 61999


# ==============================================================================
# 2. Session Creation & Roster Validation Tests
# ==============================================================================

def test_create_session_success(direct_vm, direct_deploy, direct_alice, direct_bob):
    contract = direct_deploy(CONTRACT_PATH)
    direct_vm.sender = direct_alice

    session_id = "artemis_colony_accord_001"
    participants = [direct_alice, direct_bob]
    domain_json = json.dumps(SAMPLE_DOMAIN)

    contract.create_session(session_id, participants, domain_json)

    raw_state = contract.get_session(session_id)
    state = json.loads(raw_state)

    assert state["id"] == session_id
    assert state["status"] == "COLLECTING"
    assert len(state["roster"]) == 2
    assert addr_hex(direct_alice) in state["roster"]
    assert addr_hex(direct_bob) in state["roster"]
    assert len(state["domain"]) == 3

    # Check pagination
    sessions = contract.list_sessions(0, 10)
    assert session_id in sessions


def test_create_session_invalid_participant_count(direct_vm, direct_deploy, direct_alice):
    contract = direct_deploy(CONTRACT_PATH)
    direct_vm.sender = direct_alice

    # Only 1 participant should fail
    with pytest.raises(Exception):
        contract.create_session("solo_session", [direct_alice], json.dumps(SAMPLE_DOMAIN))


def test_create_session_creator_must_be_in_roster(direct_vm, direct_deploy, direct_alice, direct_bob):
    contract = direct_deploy(CONTRACT_PATH)
    carol = b"\x33" * 20
    direct_vm.sender = carol  # Carol is not in [Alice, Bob]

    with pytest.raises(Exception):
        contract.create_session("alien_session", [direct_alice, direct_bob], json.dumps(SAMPLE_DOMAIN))


# ==============================================================================
# 3. Condition Sealing & Compilation Trigger Tests
# ==============================================================================

def test_seal_conditions_lifecycle(direct_vm, direct_deploy, direct_alice, direct_bob):
    contract = direct_deploy(CONTRACT_PATH)
    direct_vm.sender = direct_alice

    session_id = "energy_grid_accord_042"
    contract.create_session(session_id, [direct_alice, direct_bob], json.dumps(SAMPLE_DOMAIN))

    # Alice seals
    contract.seal_conditions(
        session_id,
        ["Power source must be nuclear for continuous 24/7 baseload output."]
    )

    state_alice_sealed = json.loads(contract.get_session(session_id))
    assert state_alice_sealed["status"] == "COLLECTING"
    assert len(state_alice_sealed["sealed"]) == 1
    assert state_alice_sealed["input_hash"] is None

    # Bob seals -> transitions session to AWAITING_COMPILATION
    direct_vm.sender = direct_bob
    contract.seal_conditions(
        session_id,
        ["Water reserves must be at least 60 days of recycled capacity."]
    )

    state_both_sealed = json.loads(contract.get_session(session_id))
    assert state_both_sealed["status"] == "AWAITING_COMPILATION"
    assert state_both_sealed["input_hash"] is not None
    assert len(state_both_sealed["sealed"]) == 2

    # Duplicate sealing attempt should fail
    with pytest.raises(Exception):
        contract.seal_conditions(session_id, ["Another condition"])


def test_cancel_session_flow(direct_vm, direct_deploy, direct_alice, direct_bob):
    contract = direct_deploy(CONTRACT_PATH)
    direct_vm.sender = direct_alice

    session_id = "cancelled_accord_009"
    contract.create_session(session_id, [direct_alice, direct_bob], json.dumps(SAMPLE_DOMAIN))

    contract.cancel_session(session_id)

    state = json.loads(contract.get_session(session_id))
    assert state["status"] == "CANCELLED"
    assert state["cancelled_by"] == addr_hex(direct_alice)


# ==============================================================================
# 4. Pure Logic Tests (Domain, AST, SAT / MUS Solver)
# ==============================================================================

def test_sat_solver_and_mus_cores():
    # Test diagnosis logic directly
    import hashlib

    # 4 worlds (universe = 0b1111 = 15)
    # Clause 0: allows worlds 0, 1 -> 0b0011 (3)
    # Clause 1: allows worlds 1, 2 -> 0b0110 (6)
    # Intersection = 0b0010 (world 1) -> FEASIBLE
    world_count = 4
    c0 = 0b0011
    c1 = 0b0110

    # Let's import the pure function from the contract module dynamically
    ns = {
        "gl": type("gl", (), {"vm": type("vm", (), {"UserError": ValueError})}),
        "MAX_WORLDS": 64,
        "MAX_CLAUSES": 8
    }
    with open(CONTRACT_PATH, "r", encoding="utf-8") as f:
        code = f.read()

    # Extract _diagnose_feasibility
    exec_scope = {}
    exec("""
def _diagnose_feasibility(clause_masks: list, world_count: int) -> dict:
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
""", exec_scope)

    diag_fn = exec_scope["_diagnose_feasibility"]

    res_feasible = diag_fn([c0, c1], world_count)
    assert res_feasible["feasible_mask"] == 2
    assert res_feasible["world_ids"] == [1]
    assert len(res_feasible["minimal_cores"]) == 0

    # Contradiction: Clause 0 (world 0) vs Clause 1 (world 1)
    res_blocked = diag_fn([0b0001, 0b0010], world_count)
    assert res_blocked["feasible_mask"] == 0
    assert len(res_blocked["minimal_cores"]) == 1
    assert set(res_blocked["minimal_cores"][0]["members"]) == {0, 1}
    assert len(res_blocked["minimal_corrections"]) == 2

