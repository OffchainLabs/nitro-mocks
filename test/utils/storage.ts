import { ArbPrecompile } from "./utils";

export enum StorageAccessType {
  Read = "read",
  Write = "write"
}

export interface StorageAccess {
  address: string;
  slot: string;
  type: StorageAccessType;
  pc: number;
  op: string;
}

const ARBOS_STORAGE_ADDRESS = "0xA4b05FffffFffFFFFfFFfffFfffFFfffFfFfFFFf";

function isPrecompileAddress(address: string): boolean {
  const normalizedAddress = address.toLowerCase();
  return Object.values(ArbPrecompile).some(precompile => precompile.toLowerCase() === normalizedAddress);
}

function parseStorageAccessesFromTrace(trace: any, initialAddress: string): StorageAccess[] {
  const accesses: StorageAccess[] = [];
  let currentAddress = initialAddress;

  if (!trace.structLogs) {
    return accesses;
  }

  for (let i = 0; i < trace.structLogs.length; i++) {
    const log = trace.structLogs[i];

    if (log.depth && i > 0 && trace.structLogs[i - 1].depth !== log.depth) {
      if (log.op === "CALL" || log.op === "DELEGATECALL" || log.op === "STATICCALL" || log.op === "CALLCODE") {
        const stackLength = trace.structLogs[i - 1].stack?.length || 0;
        if (stackLength >= 2) {
          currentAddress = "0x" + trace.structLogs[i - 1].stack![stackLength - 2].slice(-40);
        }
      }
    }

    if (log.op === "SLOAD" && log.stack && log.stack.length >= 1) {
      const slotRaw = log.stack[log.stack.length - 1];
      const slot = slotRaw.startsWith("0x")
        ? "0x" + slotRaw.slice(2).padStart(64, "0")
        : "0x" + slotRaw.padStart(64, "0");

      accesses.push({
        address: currentAddress,
        slot,
        type: StorageAccessType.Read,
        pc: log.pc,
        op: log.op
      });
    } else if (log.op === "SSTORE" && log.stack && log.stack.length >= 2) {
      const slotRaw = log.stack[log.stack.length - 1];
      const slot = slotRaw.startsWith("0x")
        ? "0x" + slotRaw.slice(2).padStart(64, "0")
        : "0x" + slotRaw.padStart(64, "0");

      accesses.push({
        address: currentAddress,
        slot,
        type: StorageAccessType.Write,
        pc: log.pc,
        op: log.op
      });
    }
  }

  return accesses;
}

function postProcessStorageAccesses(accesses: StorageAccess[]): StorageAccess[] {
  return accesses.map(access => {
    // Arbitrum quirk: storage accesses from precompiles are actually to ArbosStorage
    if (isPrecompileAddress(access.address)) {
      return {
        ...access,
        address: ARBOS_STORAGE_ADDRESS
      };
    }
    return access;
  });
}

export async function getAllStorageAccessesFromTx(
  provider: any, // Provider with send method
  txHash: string
): Promise<StorageAccess[]> {
  const trace = await provider.send("debug_traceTransaction", [
    txHash,
    {
      enableMemory: false,
      enableReturnData: false,
      disableStorage: false
    }
  ]);

  const receipt = await provider.send("eth_getTransactionReceipt", [txHash]);
  const initialAddress = receipt.to || receipt.contractAddress;

  const accesses = parseStorageAccessesFromTrace(trace, initialAddress);
  return postProcessStorageAccesses(accesses);
}

export async function getAllStorageAccessesFromCall(
  provider: any, // Provider with send method
  to: string,
  data: string,
  from?: string,
  blockTag?: string | number
): Promise<StorageAccess[]> {
  const callParams = {
    to,
    data,
    from: from || "0x0000000000000000000000000000000000000000"
  };

  const trace = await provider.send("debug_traceCall", [
    callParams,
    blockTag || "latest",
    {
      enableMemory: false,
      enableReturnData: false,
      disableStorage: false
    }
  ]);

  const accesses = parseStorageAccessesFromTrace(trace, to);
  return postProcessStorageAccesses(accesses);
}
