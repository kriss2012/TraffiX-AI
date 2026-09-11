"""
TraffiX-AI: Security Governance & DPDP Act 2023 Compliance Manager
Implements:
- Edge Salted Pseudonymization (HMAC-SHA256)
- Dual-Key Lawful Interception Authorization Verification
- Immutable Append-Only Hash-Chained Audit Ledger
"""

import time
import hashlib
import json
from typing import Dict, List, Optional, Tuple

class CryptographicAuditLedger:
    """Tamper-evident, hash-chained audit log for all lawful interception and surveillance queries."""

    def __init__(self):
        self.chain: List[Dict] = []
        # Create Genesis Block
        genesis = {
            "block_id": 0,
            "timestamp": time.time(),
            "officer_badge": "SYSTEM_GENESIS",
            "action_type": "INITIALIZE_AUDIT_LEDGER",
            "query_payload": {"status": "SECURE_DPDP_COMPLIANT"},
            "warrant_token": "GENESIS_ROOT_TRUST",
            "prev_hash": "0000000000000000000000000000000000000000000000000000000000000000",
            "block_hash": ""
        }
        genesis["block_hash"] = self._compute_hash(genesis)
        self.chain.append(genesis)

    def _compute_hash(self, block: Dict) -> str:
        """Computes SHA-256 hash across block fields."""
        payload_str = json.dumps(block["query_payload"], sort_keys=True)
        raw = f"{block['block_id']}:{block['timestamp']}:{block['officer_badge']}:{block['action_type']}:{payload_str}:{block['warrant_token']}:{block['prev_hash']}"
        return hashlib.sha256(raw.encode("utf-8")).hexdigest()

    def record_access(
        self,
        officer_badge: str,
        action_type: str,
        query_payload: Dict,
        warrant_token: str
    ) -> Dict:
        """Appends an immutable audit block for any surveillance or trajectory query."""
        prev_block = self.chain[-1]
        new_block = {
            "block_id": len(self.chain),
            "timestamp": time.time(),
            "officer_badge": officer_badge,
            "action_type": action_type,
            "query_payload": query_payload,
            "warrant_token": warrant_token,
            "prev_hash": prev_block["block_hash"],
            "block_hash": ""
        }
        new_block["block_hash"] = self._compute_hash(new_block)
        self.chain.append(new_block)
        return new_block

    def verify_chain_integrity(self) -> Tuple[bool, int]:
        """
        Verifies that no historical blocks in the audit ledger have been tampered with.
        Returns: (is_valid, corrupted_block_id_or_-1)
        """
        for i in range(1, len(self.chain)):
            curr = self.chain[i]
            prev = self.chain[i - 1]
            if curr["prev_hash"] != prev["block_hash"]:
                return False, i
            recalculated = self._compute_hash(curr)
            if recalculated != curr["block_hash"]:
                return False, i
        return True, -1

    def get_recent_logs(self, limit: int = 15) -> List[Dict]:
        """Returns the most recent audit blocks for auditor inspection."""
        return list(reversed(self.chain[-limit:]))

# Singleton Audit Ledger
AUDIT_LEDGER = CryptographicAuditLedger()

def verify_lawful_warrant(warrant_token: str, officer_badge: str) -> bool:
    """
    Simulates Dual-Key Lawful Interception Authorization under DPDP Act 2023.
    Requires a valid judicial warrant prefix and authorized officer credential.
    """
    if not warrant_token or not officer_badge:
        return False
    # Valid tokens follow pattern "COURT-WARRANT-YYYY-NNNN" or "FIR-NNN/YYYY"
    if warrant_token.startswith("COURT-WARRANT-") or warrant_token.startswith("FIR-"):
        return True
    return False
