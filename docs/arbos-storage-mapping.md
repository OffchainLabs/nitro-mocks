# ArbOS Storage Key Mapping

Based on analysis of Nitro's `storage.go`, here's how ArbOS maps storage keys:

## Storage Address
ArbOS stores all its data at address: `0xA4B05FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF`

## Key Mapping Algorithm

The `mapAddress` function in storage.go implements a special mapping to preserve contiguity within 256-slot "pages":

1. **Input**: A 32-byte key (common.Hash)
2. **Process**:
   - Take the first 31 bytes of the key
   - Compute `keccak256(storageKey || key[:31])`
   - Take the first 31 bytes of the hash result
   - Append the last byte of the original key
3. **Result**: The mapped storage slot

### Example Calculations

For root storage (empty storageKey) and key = 0:
```
storageKey = [] (empty)
key = 0x0000000000000000000000000000000000000000000000000000000000000000
key[:31] = 0x00000000000000000000000000000000000000000000000000000000000000 (31 bytes)
keccak256(storageKey || key[:31]) = 0x15fed0451499512d95f3ec5a41c878b9de55f21878b5b4e190d4667ec709b4cf
mapped_slot = 0x15fed0451499512d95f3ec5a41c878b9de55f21878b5b4e190d4667ec709b4 + 0x00
            = 0x15fed0451499512d95f3ec5a41c878b9de55f21878b5b4e190d4667ec709b400
```

For key = 1:
```
mapped_slot = 0x15fed0451499512d95f3ec5a41c878b9de55f21878b5b4e190d4667ec709b401
```

## Important Implementation Details

1. **Page Preservation**: The algorithm preserves the last byte of the key, which means keys 0-255 all map to slots ending in 0x00-0xff respectively. This creates "pages" of 256 contiguous slots.

2. **Security**: By hashing 248 bits (31 bytes) of the key, the algorithm provides 124-bit security against collision attacks.

3. **UintToHash**: When using numeric keys (like for version=0, chainId=1), they are converted using `common.BigToHash(new(big.Int).SetUint64(val))`, which right-aligns the value in a 32-byte array.

## Common Storage Locations

- Version (key 0): `0x15fed0451499512d95f3ec5a41c878b9de55f21878b5b4e190d4667ec709b400`
- ChainId (key 1): `0x15fed0451499512d95f3ec5a41c878b9de55f21878b5b4e190d4667ec709b401`

## SubStorage

For nested storage spaces, the storageKey is computed as `keccak256(parent.storageKey || name)`, and then the same mapping algorithm applies.