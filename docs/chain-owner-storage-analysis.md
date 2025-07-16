# Chain Owner Storage Slots Analysis

## Underlying (Real Arbitrum) Storage Access Pattern

When calling `ArbOwnerPublic.getAllChainOwners()` on the underlying fork, these storage slots are accessed:

### 1. Version/Metadata Access
- **Slot**: `0x15fed0451499512d95f3ec5a41c878b9de55f21878b5b4e190d4667ec709b400`
- **Value**: `0x41e0d7d38ffe0727248ee6ed6ea1250b08279ad004e3ab07b7ffe78352d8c400`
- **Purpose**: This appears to be reading some metadata that points to the chain owner storage location

### 2. Chain Owner Count
- **Slot**: `0x41e0d7d38ffe0727248ee6ed6ea1250b08279ad004e3ab07b7ffe78352d8c400`
- **Value**: `0x0000000000000000000000000000000000000000000000000000000000000002`
- **Purpose**: Number of chain owners (2)

### 3. First Chain Owner
- **Slot**: `0x41e0d7d38ffe0727248ee6ed6ea1250b08279ad004e3ab07b7ffe78352d8c401`
- **Value**: `0x0000000000000000000000005e1497dd1f08c87b2d8fe23e9aab6c1de833d927`
- **Address**: `0x5E1497dD1f08C87b2d8FE23e9AAB6c1De833D927`

### 4. Second Chain Owner
- **Slot**: `0x41e0d7d38ffe0727248ee6ed6ea1250b08279ad004e3ab07b7ffe78352d8c402`
- **Value**: `0x000000000000000000000000087ea22d62abe4ce062fbcf945b3a5efe953a793`
- **Address**: `0x087ea22d62abE4Ce062fBCf945b3a5Efe953A793`

### 5. End Check (returns undefined)
- **Slot**: `0x41e0d7d38ffe0727248ee6ed6ea1250b08279ad004e3ab07b7ffe78352d8c402`
- **Purpose**: Checking if there's a third owner (there isn't)

## Pattern Observed

The storage slots follow a consecutive pattern:
- Base slot: `0x41e0d7d38ffe0727248ee6ed6ea1250b08279ad004e3ab07b7ffe78352d8c400`
- Count at: `...c400`
- Owner 1 at: `...c401`
- Owner 2 at: `...c402`

This suggests the underlying implementation uses consecutive storage slots for the address set.

## Mock Implementation Issue

Our mock computed slot: `0x4771e6740774d46a482df6f07f054f5c67b6117215c3e0f6bbfa28a4ab2d8653`

This is completely different from the underlying slots, indicating our storage mapping algorithm doesn't match the real implementation.