
1. Deploy Storage Manager at 0xA4B05FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF
- Calculates storage slots matching ArbOS's layout
- Uses sstore/sload to read/write its own storage (which is where ArbOS expects data)
- No state variables to avoid slot collisions - only uses assembly with calculated slots
- Works universally on any EVM fork without cheat codes

2. Deploy Mocks at Precompile Addresses
- Deploy directly to 0x70 (ArbOwner), 0x6e (ArbGasInfo), etc.
- Each mock has identical function signatures to the real precompile
- Functions make external calls to the Storage Manager

Example flow for SetL2BaseFee:
1. Call ArbOwnerMock.SetL2BaseFee() at 0x70
2. Mock calls StorageManager.writeL2BaseFee(value) at 0xA4B05FFF...
3. Storage Manager uses sstore to write to its own storage at the correct slot
4. Since Storage Manager lives at 0xA4B05FFF..., this updates the exact location ArbOS expects