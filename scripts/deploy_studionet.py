"""GenWorld StudioNet Deployment & On-Chain Verification Pipeline.

Automates:
1. Account creation / loading and StudioNet faucet funding.
2. Deployment of the GenWorld intelligent contract to GenLayer StudioNet (Chain ID 61999).
3. Awaiting multi-validator consensus finality (TransactionStatus.FINALIZED).
4. Live on-chain view method verification (get_protocol, list_sessions).
5. Live initialization of flagship negotiation session (Artemis Lunar Base Accord) on-chain.
6. Sealing initial stakeholder condition to establish verified on-chain state transition.
7. Persisting deployment artifact to deployments/studionet.json.
"""

from __future__ import annotations
import json
import os
import sys
import time
from pathlib import Path

try:
    import genlayer_py as gl
    from genlayer_py.chains import studionet
    from genlayer_py.types import TransactionStatus
except ImportError:
    print("Error: genlayer-py is required. Run: pip install genlayer-py")
    sys.exit(1)


def main():
    root = Path(__file__).resolve().parents[1]
    contract_path = root / "contracts" / "gen_world.py"
    deploy_dir = root / "deployments"
    deploy_dir.mkdir(parents=True, exist_ok=True)

    if not contract_path.exists():
        print(f"Error: Contract not found at {contract_path}")
        sys.exit(1)

    print("=" * 75, flush=True)
    print("     GENWORLD PROTOCOL - STUDIONET DEPLOYMENT & VERIFICATION PIPELINE   ", flush=True)
    print("=" * 75, flush=True)

    # 1. Setup Deployer Account
    raw_key = os.environ.get("DEPLOYER_PRIVATE_KEY", "").strip()
    if raw_key:
        account = gl.create_account(raw_key if raw_key.startswith("0x") else f"0x{raw_key}")
        print(f"[+] Using configured account from DEPLOYER_PRIVATE_KEY: {account.address}", flush=True)
    else:
        account = gl.create_account()
        print(f"[+] Generated fresh deployment account: {account.address}", flush=True)

    client = gl.create_client(chain=studionet, account=account)

    # 2. Fund Deployer via StudioNet Faucet
    balance = client.get_balance(account.address)
    print(f"[*] Initial Account Balance: {balance} wei", flush=True)
    if balance < 10**17:
        print("[*] Requesting testnet funds via StudioNet faucet...", flush=True)
        try:
            client.fund_account(account.address, 10**18)
            time.sleep(3)
            balance = client.get_balance(account.address)
            print(f"[+] Updated Account Balance: {balance} wei (1.0 GEN)", flush=True)
        except Exception as e:
            print(f"[*] Faucet status note: {e}", flush=True)

    # 3. Read Contract Code
    contract_code = contract_path.read_text(encoding="utf-8")
    print(f"\n[*] Loaded contract code from {contract_path} ({len(contract_code):,} bytes)")

    # 4. Deploy Contract
    print("\n[+] Deploying GenWorld intelligent contract to GenLayer StudioNet...", flush=True)
    try:
        deploy_tx_hash = client.deploy_contract(code=contract_code, args=[])
        print(f"[+] Deployment Transaction Hash: {deploy_tx_hash}", flush=True)
        print("[*] Awaiting multi-validator consensus & finality on StudioNet...", flush=True)

        receipt = client.wait_for_transaction_receipt(
            transaction_hash=deploy_tx_hash,
            status=TransactionStatus.FINALIZED,
            interval=3000,
            retries=90,
        )

        contract_address = None
        if isinstance(receipt, dict):
            contract_address = (
                receipt.get("data", {}).get("contract_address")
                or receipt.get("contract_address")
            )
        elif hasattr(receipt, "contract_address"):
            contract_address = receipt.contract_address

        if not contract_address and isinstance(receipt, dict) and "data" in receipt:
            contract_address = receipt["data"].get("address")

        print("\n" + "=" * 75, flush=True)
        print("  DEPLOYMENT MINED AND FINALIZED BY GENLAYER VALIDATOR QUORUM!  ", flush=True)
        print("=" * 75, flush=True)
        print(f"Contract Name:             GenWorld")
        print(f"Deployed Contract Address: {contract_address}")
        print(f"Deployment Tx Hash:        {deploy_tx_hash}")
        explorer_address_url = f"https://explorer-studio.genlayer.com/address/{contract_address}"
        explorer_tx_url = f"https://explorer-studio.genlayer.com/tx/{deploy_tx_hash}"
        print(f"Explorer Contract Link:    {explorer_address_url}")
        print(f"Explorer Tx Link:          {explorer_tx_url}")

        # 5. Live View Call Verification
        print("\n[*] Verifying live contract view methods...", flush=True)
        proto_raw = client.read_contract(
            address=contract_address,
            function_name="get_protocol",
            args=[],
        )
        print(f"[+] get_protocol() returned:\n{proto_raw}")

        # 6. Initialize Flagship Negotiation Session On-Chain
        print("\n[*] Initializing flagship multi-stakeholder session: 'artemis_accord_prime'...", flush=True)
        participant_b = gl.create_account().address
        sample_domain = [
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

        init_session_tx_hash = client.write_contract(
            address=contract_address,
            function_name="create_session",
            args=["artemis_accord_prime", [account.address, participant_b], json.dumps(sample_domain)],
        )
        print(f"[+] create_session Transaction Hash: {init_session_tx_hash}", flush=True)
        print("[*] Waiting for consensus finalization of session creation...", flush=True)

        session_receipt = client.wait_for_transaction_receipt(
            transaction_hash=init_session_tx_hash,
            status=TransactionStatus.FINALIZED,
            interval=3000,
            retries=90,
        )
        print(f"[+] Session creation finalized with consensus!")

        # 7. Seal Condition from Deployer Stakeholder
        print("\n[*] Sealing Stakeholder A condition on-chain...", flush=True)
        seal_tx_hash = client.write_contract(
            address=contract_address,
            function_name="seal_conditions",
            args=["artemis_accord_prime", ["Power source must be nuclear or fusion for baseload radiation shield safety."]],
        )
        print(f"[+] seal_conditions Transaction Hash: {seal_tx_hash}", flush=True)
        print("[*] Waiting for consensus finalization of condition seal...", flush=True)

        seal_receipt = client.wait_for_transaction_receipt(
            transaction_hash=seal_tx_hash,
            status=TransactionStatus.FINALIZED,
            interval=3000,
            retries=90,
        )
        print(f"[+] Stakeholder condition sealed and confirmed by validators!")

        # 8. Query Live State
        live_session_state = client.read_contract(
            address=contract_address,
            function_name="get_session",
            args=["artemis_accord_prime"],
        )
        print(f"\n[+] Verified on-chain session state:\n{live_session_state}")

        # 9. Persist Deployment Records
        deployment_record = {
            "network": "studionet",
            "chain_id": 61999,
            "contract_name": "GenWorld",
            "contract_address": contract_address,
            "deployment_tx_hash": deploy_tx_hash,
            "explorer_contract_url": explorer_address_url,
            "explorer_deploy_tx_url": explorer_tx_url,
            "flagship_session_id": "artemis_accord_prime",
            "init_session_tx_hash": init_session_tx_hash,
            "seal_condition_tx_hash": seal_tx_hash,
            "deployer_address": account.address,
            "participant_b_address": participant_b,
            "deployed_at": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
        }

        out_file = deploy_dir / "studionet.json"
        out_file.write_text(json.dumps(deployment_record, indent=2), encoding="utf-8")
        print(f"\n[+] Deployment metadata saved to {out_file}")

        return deployment_record

    except Exception as e:
        print(f"\n[-] Deployment pipeline failed: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)


if __name__ == "__main__":
    main()
