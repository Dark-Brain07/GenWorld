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
| **Contract Address** | `0xeEfca6ffd18CCbd3Ee43D4bDFdD5CCbf69A62be8` |
| **Explorer Address URL** | [https://explorer-studio.genlayer.com/address/0xeEfca6ffd18CCbd3Ee43D4bDFdD5CCbf69A62be8](https://explorer-studio.genlayer.com/address/0xeEfca6ffd18CCbd3Ee43D4bDFdD5CCbf69A62be8) |
| **Deployment Tx Hash** | `0xde309afcaf688c182059dc32f9e6829a9b63fa2f800a639fd98319342003f03a` |
| **Explorer Deploy Tx URL** | [https://explorer-studio.genlayer.com/tx/0xde309afcaf688c182059dc32f9e6829a9b63fa2f800a639fd98319342003f03a](https://explorer-studio.genlayer.com/tx/0xde309afcaf688c182059dc32f9e6829a9b63fa2f800a639fd98319342003f03a) |
| **Consensus Status** | `FINALIZED` |
| **Runner Dependency** | `py-genlayer:1jb45aa8ynh2a9c9xn3b7qqh8sm5q93hwfp7jqmwsfhh8jpz09h6` |

---

## 2. Live On-Chain Execution Transactions

### A. Contract Deployment
- **Method:** `deploy_contract`
- **Transaction Hash:** `0xde309afcaf688c182059dc32f9e6829a9b63fa2f800a639fd98319342003f03a`
- **Explorer Link:** [View Deployment Receipt](https://explorer-studio.genlayer.com/tx/0xde309afcaf688c182059dc32f9e6829a9b63fa2f800a639fd98319342003f03a)
- **Status:** `FINALIZED`
- **Result:** Contract successfully instantiated at `0xeEfca6ffd18CCbd3Ee43D4bDFdD5CCbf69A62be8`.

### B. Flagship Session Initialization (`create_session`)
- **Method:** `create_session(session_id, participants, domain_json)`
- **Arguments:**
  - `session_id`: `"artemis_accord_prime"`
  - `participants`: `["0xAC529A665aF41de5Cf89BC0a9C9C0c7A60EB5795", "0x14729733f00C588384291DfE9Ef2CC7921F87f25"]`
  - `domain_json`:
    ```json
    [
      {"id": "power_source", "meaning": "Primary habitat energy grid technology", "values": ["solar", "nuclear", "fusion"]},
      {"id": "water_reserve_days", "meaning": "Days of recycled water storage reserves", "values": [30, 60, 90]},
      {"id": "ai_governance", "meaning": "Degree of autonomous agent oversight", "values": ["advisory", "autonomous"]}
    ]
    ```
- **Transaction Hash:** `0x85ffb69f9deea7705227bd3ef7de40afdce708e3889455df2abfd766ad31db1a`
- **Explorer Link:** [View Session Creation Receipt](https://explorer-studio.genlayer.com/tx/0x85ffb69f9deea7705227bd3ef7de40afdce708e3889455df2abfd766ad31db1a)
- **Consensus Status:** `FINALIZED`

### C. Stakeholder Condition Sealing (`seal_conditions`)
- **Method:** `seal_conditions(session_id, conditions)`
- **Arguments:**
  - `session_id`: `"artemis_accord_prime"`
  - `conditions`: `["Power source must be nuclear or fusion for baseload radiation shield safety."]`
- **Caller Address:** `0xAC529A665aF41de5Cf89BC0a9C9C0c7A60EB5795`
- **Transaction Hash:** `0x90c32e564ea051ad57042950f052a0b7f6a9a44859a790fbdf0ec97693c6ed27`
- **Explorer Link:** [View Condition Seal Receipt](https://explorer-studio.genlayer.com/tx/0x90c32e564ea051ad57042950f052a0b7f6a9a44859a790fbdf0ec97693c6ed27)
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
    "0xac529a665af41de5cf89bc0a9c9c0c7a60eb5795",
    "0x14729733f00c588384291dfe9ef2cc7921f87f25"
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
    "0xac529a665af41de5cf89bc0a9c9c0c7a60eb5795": [
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
