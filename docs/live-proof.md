# GenWorld Protocol — Live On-Chain Proof & Verification

This document provides definitive on-chain proof of the **GenWorld** intelligent contract deployment and multi-stakeholder negotiation execution on the **GenLayer StudioNet** (Chain ID: `61999`).

All transactions were mined and verified through GenLayer's decentralized AI-validator consensus (Optimistic Democracy).

---

## 1. Deployed Intelligent Contract Information

| Field | Value |
|---|---|
| **Contract Name** | `GenWorld` |
| **Network** | GenLayer StudioNet |
| **Chain ID** | `61999` |
| **Contract Address** | `0xCf6B224440958F0360AbaE1e2b453c0cE24Ea8C2` |
| **Explorer Address URL** | [https://explorer-studio.genlayer.com/address/0xCf6B224440958F0360AbaE1e2b453c0cE24Ea8C2](https://explorer-studio.genlayer.com/address/0xCf6B224440958F0360AbaE1e2b453c0cE24Ea8C2) |
| **Deployment Tx Hash** | `0xaa89e2c48ddc1ab710e429b4e5435fa24aca6a10c9c1110607549c3c29240698` |
| **Explorer Deploy Tx URL** | [https://explorer-studio.genlayer.com/tx/0xaa89e2c48ddc1ab710e429b4e5435fa24aca6a10c9c1110607549c3c29240698](https://explorer-studio.genlayer.com/tx/0xaa89e2c48ddc1ab710e429b4e5435fa24aca6a10c9c1110607549c3c29240698) |
| **Consensus Status** | `FINALIZED` |
| **Runner Dependency** | `py-genlayer:1jb45aa8ynh2a9c9xn3b7qqh8sm5q93hwfp7jqmwsfhh8jpz09h6` |

---

## 2. Live On-Chain Execution Transactions

### A. Contract Deployment
- **Method:** `deploy_contract`
- **Transaction Hash:** `0xaa89e2c48ddc1ab710e429b4e5435fa24aca6a10c9c1110607549c3c29240698`
- **Explorer Link:** [View Deployment Receipt](https://explorer-studio.genlayer.com/tx/0xaa89e2c48ddc1ab710e429b4e5435fa24aca6a10c9c1110607549c3c29240698)
- **Status:** `FINALIZED`
- **Result:** Contract successfully instantiated at `0xCf6B224440958F0360AbaE1e2b453c0cE24Ea8C2`.

### B. Flagship Session Initialization (`create_session`)
- **Method:** `create_session(session_id, participants, domain_json)`
- **Arguments:**
  - `session_id`: `"artemis_accord_prime"`
  - `participants`: `["0x30A9Dd04dE4BE992a449fD8c8d03A50c76a56A93", "0xfebac9549221d26a1a94b89b80bd07a59500f974"]`
  - `domain_json`:
    ```json
    [
      {"id": "power_source", "meaning": "Primary habitat energy grid technology", "values": ["solar", "nuclear", "fusion"]},
      {"id": "water_reserve_days", "meaning": "Days of recycled water storage reserves", "values": [30, 60, 90]},
      {"id": "ai_governance", "meaning": "Degree of autonomous agent oversight", "values": ["advisory", "autonomous"]}
    ]
    ```
- **Transaction Hash:** `0x2ef9afea9b19db138c071245176d2db367a784c2ed9b28c07af1cd125203d46c`
- **Explorer Link:** [View Session Creation Receipt](https://explorer-studio.genlayer.com/tx/0x2ef9afea9b19db138c071245176d2db367a784c2ed9b28c07af1cd125203d46c)
- **Consensus Status:** `FINALIZED`

### C. Stakeholder Condition Sealing (`seal_conditions`)
- **Method:** `seal_conditions(session_id, conditions)`
- **Arguments:**
  - `session_id`: `"artemis_accord_prime"`
  - `conditions`: `["Power source must be nuclear or fusion for baseload radiation shield safety."]`
- **Caller Address:** `0x30A9Dd04dE4BE992a449fD8c8d03A50c76a56A93`
- **Transaction Hash:** `0x78c4f8d38587f7a320b239b26ca8b899456073251cd4a830a1cfa9ce6bb5651b`
- **Explorer Link:** [View Condition Seal Receipt](https://explorer-studio.genlayer.com/tx/0x78c4f8d38587f7a320b239b26ca8b899456073251cd4a830a1cfa9ce6bb5651b)
- **Consensus Status:** `FINALIZED`

### D. Frontend Live Transaction Execution via `genlayer-js`
Direct client integration test using `createClient`, `studionet` chain, and `writeContract`:

1. **Frontend Session Creation:**
   - **Method:** `create_session(session_id, participants, domain_json)`
   - **Session ID:** `frontend_live_mviai6su`
   - **Signer (Frontend User):** `0xf808077717e28D37DaE43961863dC8BA889bcD45`
   - **Counterparty:** `0xCfDFb7C55b55f89652e9d80c4991c6e378a097C3`
   - **Transaction Hash:** `0x5b360155ecc82e51cd2fdfd8b031b91ccf44938808067b9f057fdde6dacfd320`
   - **Explorer Link:** [View Frontend Create Session Tx](https://explorer-studio.genlayer.com/tx/0x5b360155ecc82e51cd2fdfd8b031b91ccf44938808067b9f057fdde6dacfd320)
   - **Consensus Status:** `FINALIZED`

2. **Frontend Condition Sealing:**
   - **Method:** `seal_conditions(session_id, conditions)`
   - **Session ID:** `frontend_live_mviai6su`
   - **Conditions:** `["Frequency standard must be 60 Hz to match turbine generators."]`
   - **Transaction Hash:** `0x4e9c3f6a243c7306521f3dca44a32bd41bfee909446557db542217e71c0314b9`
   - **Explorer Link:** [View Frontend Seal Condition Tx](https://explorer-studio.genlayer.com/tx/0x4e9c3f6a243c7306521f3dca44a32bd41bfee909446557db542217e71c0314b9)
   - **Consensus Status:** `FINALIZED`

---

## 3. Verified Persistent Contract State

Direct read query on `get_session("artemis_accord_prime")` returned the verified persistent state on GenLayer:

```json
{
  "id": "artemis_accord_prime",
  "protocol": "GENWORLD-V1",
  "status": "COLLECTING",
  "revision": 0,
  "roster": [
    "0x30a9dd04de4be992a449fd8c8d03a50c76a56a93",
    "0xfebac9549221d26a1a94b89b80bd07a59500f974"
  ],
  "domain": [
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
  ],
  "sealed": {
    "0x30a9dd04de4be992a449fd8c8d03a50c76a56a93": [
      "Power source must be nuclear or fusion for baseload radiation shield safety."
    ]
  },
  "compilation": null,
  "masks": [],
  "waived": [],
  "approvals": {},
  "committed": null,
  "input_hash": null,
  "diagnosis": null,
  "cancelled_by": null
}
```

Protocol metadata verified via `get_protocol()`:
```json
{
  "protocol": "GENWORLD-V1",
  "compiler": "GENWORLD-COMPILE-V1",
  "max_worlds": 64,
  "max_clauses": 8,
  "max_ast_nodes": 64,
  "max_ast_depth": 8,
  "target_network": "Stable Studionet",
  "chain_id": 61999
}
```
