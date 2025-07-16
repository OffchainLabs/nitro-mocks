import { expect } from "chai";
import { BaseContract } from "ethers";
import { getAllStorageAccessesFromCall, StorageAccess } from "./storage";
import { getUnderlyingProvider, PRECOMPILE_ADDRESSES } from "./utils";
import { ethers } from "hardhat";
import { ArbOwnerPublic__factory } from "../../typechain-types";

const VERSION_SLOT = "0x15fed0451499512d95f3ec5a41c878b9de55f21878b5b4e190d4667ec709b400";

let cachedChainOwners: string[] = [];

interface EquivalenceError {
  parameters: {
    contractFactory: string;
    address: string;
    method: string;
    args: any[];
    options?: EquivalenceOptions;
  };
  result: {
    reason: string;
    mockData?: any;
    underlyingData?: any;
    details?: any;
  };
}

function failWithError(error: EquivalenceError): void {
  expect.fail(JSON.stringify(error, null, 2));
}

export function createStorageComparer(errorContext?: Partial<EquivalenceError>) {
  return function storageComparerExact(mock: StorageAccess[], underlying: StorageAccess[]): void {
    if (mock.length !== underlying.length) {
      failWithError({
        ...errorContext,
        result: {
          reason: "Storage access count mismatch",
          mockData: { count: mock.length, accesses: mock },
          underlyingData: { count: underlying.length, accesses: underlying }
        }
      } as EquivalenceError);
    }
    
    for (let i = 0; i < mock.length; i++) {
      if (mock[i].address !== underlying[i].address) {
        failWithError({
          ...errorContext,
          result: {
            reason: `Storage access ${i}: address mismatch`,
            mockData: mock[i],
            underlyingData: underlying[i],
            details: { accessIndex: i }
          }
        } as EquivalenceError);
      }
      
      if (mock[i].slot !== underlying[i].slot) {
        failWithError({
          ...errorContext,
          result: {
            reason: `Storage access ${i}: slot mismatch`,
            mockData: mock[i],
            underlyingData: underlying[i],
            details: { accessIndex: i }
          }
        } as EquivalenceError);
      }
      
      if (mock[i].type !== underlying[i].type) {
        failWithError({
          ...errorContext,
          result: {
            reason: `Storage access ${i}: operation type mismatch`,
            mockData: mock[i],
            underlyingData: underlying[i],
            details: { accessIndex: i }
          }
        } as EquivalenceError);
      }
    }
  };
}

export function createStorageComparerExcludingVersion(errorContext?: Partial<EquivalenceError>) {
  return function storageComparerExcludingVersion(mock: StorageAccess[], underlying: StorageAccess[]): void {
    const underlyingFiltered = underlying.filter(access => access.slot !== VERSION_SLOT);
    createStorageComparer(errorContext)(mock, underlyingFiltered);
  };
}

export const storageComparerExact = createStorageComparer();
export const storageComparerExcludingVersion = createStorageComparerExcludingVersion();

async function getAndVerifyChainOwners(): Promise<string[]> {
  if (cachedChainOwners) {
    return cachedChainOwners;
  }
  
  const forkProvider = ethers.provider;
  const underlyingProvider = getUnderlyingProvider();
  
  const forkArbOwnerPublic = ArbOwnerPublic__factory.connect(PRECOMPILE_ADDRESSES.ArbOwnerPublic, forkProvider);
  const underlyingArbOwnerPublic = ArbOwnerPublic__factory.connect(PRECOMPILE_ADDRESSES.ArbOwnerPublic, underlyingProvider);
  
  const forkOwner = await forkArbOwnerPublic.getAllChainOwners();
  const underlyingOwner = await underlyingArbOwnerPublic.getAllChainOwners();
  
  if (forkOwner.length === 0 || underlyingOwner.length === 0) {
    throw new Error("No chain owners found");
  }
  
  if (forkOwner[0] !== underlyingOwner[0]) {
    throw new Error(`Chain owner mismatch: fork has ${forkOwner[0]}, underlying has ${underlyingOwner[0]}`);
  }
  
  cachedChainOwners = forkOwner;
  return cachedChainOwners;
}


export interface EquivalenceOptions {
  from?: string;
  storage?: (mock: StorageAccess[], underlying: StorageAccess[]) => void;
  result?: (mock: any, underlying: any) => void;
}

type ContractFunctionNames<T> = {
  [K in keyof T]: T[K] extends (...args: any[]) => any ? K : never;
}[keyof T];
export async function expectEquivalentCall<TContract extends BaseContract>(
  ContractFactory: {
    connect(address: string, provider: any): TContract;
    createInterface(): any;
  },
  address: string,
  method: ContractFunctionNames<TContract>,
  args: any[] = [],
  options?: EquivalenceOptions
): Promise<void> {
  const errorContext: EquivalenceError = {
    parameters: {
      contractFactory: ContractFactory.constructor.name,
      address,
      method: method as string,
      args,
      options
    },
    result: {
      reason: ""
    }
  };
  const forkProvider = ethers.provider;
  const underlyingProvider = getUnderlyingProvider();
  
  const mockContract = ContractFactory.connect(address, forkProvider);
  const underlyingContract = ContractFactory.connect(address, underlyingProvider);
  
  const iface = ContractFactory.createInterface();
  const callData = iface.encodeFunctionData(method as string, args);
  
  let mockResult: any;
  let underlyingResult: any;
  let mockReverted = false;
  let underlyingReverted = false;
  
  try {
    mockResult = await (mockContract as any)[method as string](...args);
  } catch (error: any) {
    mockReverted = true;
    mockResult = error;
  }
  
  try {
    underlyingResult = await (underlyingContract as any)[method as string](...args);
  } catch (error: any) {
    console.log(`Underlying call to ${method as string} failed:`, error.message);
    underlyingReverted = true;
    underlyingResult = error;
  }
  
  if (mockReverted && underlyingReverted) {
    return;
  } else if (mockReverted || underlyingReverted) {
    failWithError({
      ...errorContext,
      result: {
        reason: mockReverted ? "Mock reverted but underlying succeeded" : "Underlying reverted but mock succeeded",
        mockData: mockReverted ? { error: mockResult.reason || mockResult.message } : mockResult,
        underlyingData: underlyingReverted ? { error: underlyingResult.reason || underlyingResult.message } : underlyingResult
      }
    });
  }
  
  if (options?.result) {
    options.result(mockResult, underlyingResult);
  } else {
    if (typeof mockResult === 'bigint' && typeof underlyingResult === 'bigint') {
      if (mockResult !== underlyingResult) {
        failWithError({
          ...errorContext,
          result: {
            reason: "Result mismatch (bigint)",
            mockData: mockResult.toString(),
            underlyingData: underlyingResult.toString()
          }
        });
      }
    } else if (Array.isArray(mockResult) && Array.isArray(underlyingResult)) {
      if (mockResult.length !== underlyingResult.length) {
        failWithError({
          ...errorContext,
          result: {
            reason: "Result array length mismatch",
            mockData: { length: mockResult.length, array: mockResult },
            underlyingData: { length: underlyingResult.length, array: underlyingResult }
          }
        });
      }
      for (let i = 0; i < mockResult.length; i++) {
        if (typeof mockResult[i] === 'bigint' && typeof underlyingResult[i] === 'bigint') {
          if (mockResult[i] !== underlyingResult[i]) {
            failWithError({
              ...errorContext,
              result: {
                reason: `Result array item ${i} mismatch (bigint)`,
                mockData: mockResult[i].toString(),
                underlyingData: underlyingResult[i].toString(),
                details: { index: i }
              }
            });
          }
        } else {
          try {
            expect(mockResult[i]).to.deep.equal(underlyingResult[i]);
          } catch {
            failWithError({
              ...errorContext,
              result: {
                reason: `Result array item ${i} mismatch`,
                mockData: mockResult[i],
                underlyingData: underlyingResult[i],
                details: { index: i }
              }
            });
          }
        }
      }
    } else {
      try {
        expect(mockResult).to.deep.equal(underlyingResult);
      } catch {
        failWithError({
          ...errorContext,
          result: {
            reason: "Result mismatch",
            mockData: mockResult,
            underlyingData: underlyingResult
          }
        });
      }
    }
  }
  
  const [mockAccesses, underlyingAccesses] = await Promise.all([
    getAllStorageAccessesFromCall(forkProvider, address, callData, options?.from),
    getAllStorageAccessesFromCall(underlyingProvider, address, callData, options?.from)
  ]);
  
  if (options?.storage) {
    options.storage(mockAccesses, underlyingAccesses);
  } else {
    createStorageComparer(errorContext)(mockAccesses, underlyingAccesses);
  }
}

export async function expectEquivalentCallFromMultipleAddresses<TContract extends BaseContract>(
  ContractFactory: {
    connect(address: string, provider: any): TContract;
    createInterface(): any;
  },
  address: string,
  method: ContractFunctionNames<TContract>,
  args: any[] = [],
  options?: EquivalenceOptions
): Promise<void> {
  const chainOwners = await getAndVerifyChainOwners();
  const randomAddress = ethers.Wallet.createRandom().address;
  
  const testAddresses = [
    ...chainOwners,
    ethers.ZeroAddress,
    PRECOMPILE_ADDRESSES.ArbSys,
    PRECOMPILE_ADDRESSES.ArbRetryableTx,
    PRECOMPILE_ADDRESSES.ArbGasInfo,
    PRECOMPILE_ADDRESSES.ArbAggregator,
    PRECOMPILE_ADDRESSES.ArbFunctionTable,
    PRECOMPILE_ADDRESSES.ArbosTest,
    PRECOMPILE_ADDRESSES.ArbOwner,
    PRECOMPILE_ADDRESSES.ArbBLS,
    PRECOMPILE_ADDRESSES.ArbInfo,
    PRECOMPILE_ADDRESSES.ArbAddressTable,
    PRECOMPILE_ADDRESSES.ArbStatistics,
    PRECOMPILE_ADDRESSES.NodeInterface,
    PRECOMPILE_ADDRESSES.ArbDebug,
    PRECOMPILE_ADDRESSES.ArbOwnerPublic,
    PRECOMPILE_ADDRESSES.ArbWasm,
    PRECOMPILE_ADDRESSES.ArbWasmCache,
    randomAddress
  ];
  
  for (const fromAddress of testAddresses) {
    await expectEquivalentCall(
      ContractFactory,
      address,
      method,
      args,
      {
        ...options,
        from: fromAddress
      }
    );
  }
}