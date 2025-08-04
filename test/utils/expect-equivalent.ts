import { expect } from "chai";
import { BaseContract, HDNodeWallet } from "ethers";
import { getAllStorageAccessesFromCall, getAllStorageAccessesFromTx, StorageAccess } from "./storage";
import { getUnderlyingProvider } from "./utils";
import { ethers } from "hardhat";

const VERSION_SLOT = "0x15fed0451499512d95f3ec5a41c878b9de55f21878b5b4e190d4667ec709b400";
const L2_BASE_FEE_SLOT = "0xe54de2a4cdacc0a0059d2b6e16348103df8c4aff409c31e40ec73d11926c8202";
const TEST_MNEMONIC = "indoor dish desk flag debris potato excuse depart ticket judge file exit";

function getWalletFromMnemonic(index: number, provider?: any): HDNodeWallet {
  const wallet = ethers.HDNodeWallet.fromPhrase(TEST_MNEMONIC, undefined, `m/44'/60'/0'/0/${index}`);
  return provider ? wallet.connect(provider) : wallet;
}

function getWalletIndexFromAddress(address: string): number {
  // Check for known wallet indices
  for (let i = 0; i <= 10; i++) {
    const wallet = getWalletFromMnemonic(i);
    if (wallet.address.toLowerCase() === address.toLowerCase()) {
      return i;
    }
  }
  return -1;
}

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
  // Custom replacer to handle BigInt serialization
  const replacer = (key: string, value: any) => {
    if (typeof value === 'bigint') {
      return value.toString() + 'n';
    }
    return value;
  };
  expect.fail(JSON.stringify(error, replacer, 2));
}

export function createStorageAccessComparer(errorContext?: Partial<EquivalenceError>) {
  return function storageAccessComparerExact(mock: StorageAccess[], underlying: StorageAccess[]): void {
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

export function createStorageAccessComparerExcludingVersion(errorContext?: Partial<EquivalenceError>) {
  return function storageAccessComparerExcludingVersion(mock: StorageAccess[], underlying: StorageAccess[]): void {
    const underlyingFiltered = underlying.filter(access => access.slot !== VERSION_SLOT);
    createStorageAccessComparer(errorContext)(mock, underlyingFiltered);
  };
}

export function createStorageAccessComparerExcludingVersionAndBaseFee(errorContext?: Partial<EquivalenceError>) {
  return function storageAccessComparerExcludingVersionAndBaseFee(mock: StorageAccess[], underlying: StorageAccess[]): void {
    // The native precompile returns the actual L2 base fee even during eth_call,
    // while our mock implementation needs to read it from storage when block.basefee is 0.
    // This causes an extra storage access that we need to filter out.
    const mockFiltered = mock.filter(access => access.slot !== L2_BASE_FEE_SLOT);
    const underlyingFiltered = underlying.filter(access => access.slot !== VERSION_SLOT);
    createStorageAccessComparer(errorContext)(mockFiltered, underlyingFiltered);
  };
}

export const storageAccessComparerExact = createStorageAccessComparer();
export const storageAccessComparerExcludingVersion = createStorageAccessComparerExcludingVersion();
export const storageAccessComparerExcludingVersionAndBaseFee = createStorageAccessComparerExcludingVersionAndBaseFee();

export interface StorageValueComparerOptions {
  excludeSlots?: string[];
}

export function createStorageValueComparer(
  errorContext?: Partial<EquivalenceError>,
  options?: StorageValueComparerOptions
) {
  return function compareStorageValues(
    mockAccesses: StorageAccess[],
    underlyingAccesses: StorageAccess[],
    mockValues: Map<string, string>,
    underlyingValues: Map<string, string>
  ): void {
    const excludeSlots = new Set(options?.excludeSlots || []);
    
    // Get unique address/slot pairs that were accessed by both
    const allAccessedSlots = new Set<string>();
    
    for (const access of mockAccesses) {
      if (!excludeSlots.has(access.slot)) {
        allAccessedSlots.add(`${access.address}:${access.slot}`);
      }
    }
    
    for (const access of underlyingAccesses) {
      if (!excludeSlots.has(access.slot)) {
        allAccessedSlots.add(`${access.address}:${access.slot}`);
      }
    }
    
    // Compare final values for each accessed slot
    for (const key of allAccessedSlots) {
      const mockValue = mockValues.get(key) || "0x0";
      const underlyingValue = underlyingValues.get(key) || "0x0";
      
      if (mockValue !== underlyingValue) {
        const [address, slot] = key.split(':');
        failWithError({
          ...(errorContext || {} as Partial<EquivalenceError>),
          result: {
            reason: "Storage value mismatch after transaction",
            mockData: { address, slot, value: mockValue },
            underlyingData: { address, slot, value: underlyingValue }
          }
        } as EquivalenceError);
      }
    }
  };
}

export const storageValueComparerExact = createStorageValueComparer();
export const storageValueComparerExcludingVersion = createStorageValueComparer(undefined, { excludeSlots: [VERSION_SLOT] });

export function getChainOwner() {
  return getWalletFromMnemonic(5);
}

function getFromAddresses(): string[] {
  const chainOwnerWallet = getChainOwner()
  const testWallet = getWalletFromMnemonic(6);
  
  return [
    chainOwnerWallet.address,
    testWallet.address
  ];
}

export interface EquivalenceOptions {
  from?: string;
  storageAccess?: (mock: StorageAccess[], underlying: StorageAccess[]) => void;
  storageValues?: (mock: StorageAccess[], underlying: StorageAccess[], mockValues: Map<string, string>, underlyingValues: Map<string, string>) => void;
  result?: (mock: any, underlying: any) => void;
  events?: (mock: any[], underlying: any[]) => void;
}

type ContractFunctionNames<T> = {
  [K in keyof T]: T[K] extends (...args: any[]) => any ? K : never;
}[keyof T];
function compareResults(
  mockResult: any,
  underlyingResult: any,
  errorContext: EquivalenceError,
  customComparer?: (mock: any, underlying: any) => void
): void {
  if (customComparer) {
    customComparer(mockResult, underlyingResult);
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
}

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
    underlyingReverted = true;
    underlyingResult = error;
  }
  
  if (mockReverted && underlyingReverted) {
    // TODO: we should still compare storage and events even if both reverted - if we can get a trace, and events are emitted
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
  
  compareResults(mockResult, underlyingResult, errorContext, options?.result);
  
  const [mockAccesses, underlyingAccesses] = await Promise.all([
    getAllStorageAccessesFromCall(forkProvider, address, callData, options?.from),
    getAllStorageAccessesFromCall(underlyingProvider, address, callData, options?.from)
  ]);
  
  if (options?.storageAccess) {
    options.storageAccess(mockAccesses, underlyingAccesses);
  } else {
    createStorageAccessComparer(errorContext)(mockAccesses, underlyingAccesses);
  }
}

function compareEvents(
  mockEvents: any[],
  underlyingEvents: any[],
  errorContext: EquivalenceError
): void {
  if (mockEvents.length !== underlyingEvents.length) {
    failWithError({
      ...errorContext,
      result: {
        reason: "Event count mismatch",
        mockData: { count: mockEvents.length, events: mockEvents },
        underlyingData: { count: underlyingEvents.length, events: underlyingEvents }
      }
    });
  }
  
  for (let i = 0; i < mockEvents.length; i++) {
    const mockEvent = mockEvents[i];
    const underlyingEvent = underlyingEvents[i];
    
    if (mockEvent.address.toLowerCase() !== underlyingEvent.address.toLowerCase()) {
      failWithError({
        ...errorContext,
        result: {
          reason: `Event ${i}: address mismatch`,
          mockData: mockEvent,
          underlyingData: underlyingEvent,
          details: { eventIndex: i }
        }
      });
    }
    
    if (mockEvent.topics.length !== underlyingEvent.topics.length) {
      failWithError({
        ...errorContext,
        result: {
          reason: `Event ${i}: topics length mismatch`,
          mockData: mockEvent,
          underlyingData: underlyingEvent,
          details: { eventIndex: i }
        }
      });
    }
    
    for (let j = 0; j < mockEvent.topics.length; j++) {
      if (mockEvent.topics[j] !== underlyingEvent.topics[j]) {
        failWithError({
          ...errorContext,
          result: {
            reason: `Event ${i}: topic ${j} mismatch`,
            mockData: mockEvent,
            underlyingData: underlyingEvent,
            details: { eventIndex: i, topicIndex: j }
          }
        });
      }
    }
    
    if (mockEvent.data !== underlyingEvent.data) {
      failWithError({
        ...errorContext,
        result: {
          reason: `Event ${i}: data mismatch`,
          mockData: mockEvent,
          underlyingData: underlyingEvent,
          details: { eventIndex: i }
        }
      });
    }
  }
}

export async function expectEquivalentTx<TContract extends BaseContract>(
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
  
  let mockSigner: any;
  let underlyingSigner: any;
  
  if (options?.from) {
    const walletIndex = getWalletIndexFromAddress(options.from);
    if (walletIndex !== -1) {
      mockSigner = getWalletFromMnemonic(walletIndex, forkProvider);
      underlyingSigner = getWalletFromMnemonic(walletIndex, underlyingProvider);
    } else {
      throw new Error(`Unknown test address: ${options.from}`);
    }
  } else {
    throw new Error("From address is required for transactions");
  }
  
  const mockContract = ContractFactory.connect(address, mockSigner);
  const underlyingContract = ContractFactory.connect(address, underlyingSigner);
  
  let mockResult: any;
  let underlyingResult: any;
  let mockStaticReverted = false;
  let underlyingStaticReverted = false;
  
  try {
    mockResult = await (mockContract as any)[method as string].staticCall(...args);
  } catch (error: any) {
    mockStaticReverted = true;
    mockResult = error;
  }
  
  try {
    underlyingResult = await (underlyingContract as any)[method as string].staticCall(...args);
  } catch (error: any) {
    underlyingStaticReverted = true;
    underlyingResult = error;
  }
  
  if (!mockStaticReverted && !underlyingStaticReverted) {
    compareResults(mockResult, underlyingResult, errorContext, options?.result);
  }
  let mockTx: any;
  let mockReceipt: any;
  let underlyingTx: any;
  let underlyingReceipt: any;
  let mockReverted = false;
  let underlyingReverted = false;
  
  try {
    mockTx = await (mockContract as any)[method as string](...args);
    mockReceipt = await mockTx.wait();
  } catch (error: any) {
    mockReverted = true;
    mockTx = error;
  }

  try {
    underlyingTx = await (underlyingContract as any)[method as string](...args);
    underlyingReceipt = await underlyingTx.wait();
  } catch (error: any) {
    underlyingReverted = true;
    underlyingTx = error;
  }
  
  if (mockReverted && underlyingReverted) {
    // TODO: we should still compare storage and events even if both reverted - if they're available
    return;
  } else if (mockReverted || underlyingReverted) {
    failWithError({
      ...errorContext,
      result: {
        reason: mockReverted ? "Mock tx reverted but underlying succeeded" : "Underlying tx reverted but mock succeeded",
        mockData: mockReverted ? { error: mockTx.reason || mockTx.message } : mockTx.hash,
        underlyingData: underlyingReverted ? { error: underlyingTx.reason || underlyingTx.message } : underlyingTx.hash
      }
    });
  }
  
  if (mockReceipt.status !== underlyingReceipt.status) {
    failWithError({
      ...errorContext,
      result: {
        reason: "Transaction status mismatch",
        mockData: { status: mockReceipt.status, receipt: mockReceipt },
        underlyingData: { status: underlyingReceipt.status, receipt: underlyingReceipt }
      }
    });
  }

  if (options?.events) {
    options.events(mockReceipt.logs, underlyingReceipt.logs);
  } else {
    compareEvents(mockReceipt.logs, underlyingReceipt.logs, errorContext);
  }
  
  const [mockAccesses, underlyingAccesses] = await Promise.all([
    getAllStorageAccessesFromTx(forkProvider, mockTx.hash),
    getAllStorageAccessesFromTx(underlyingProvider, underlyingTx.hash)
  ]);
  
  // First compare storage accesses
  if (options?.storageAccess) {
    options.storageAccess(mockAccesses, underlyingAccesses);
  } else {
    createStorageAccessComparer(errorContext)(mockAccesses, underlyingAccesses);
  }
  
  // Then fetch and compare final storage values
  const mockFinalValues = new Map<string, string>();
  const underlyingFinalValues = new Map<string, string>();
  
  // Get unique address/slot pairs from both mock and underlying
  const slotsToCheck = new Map<string, Set<string>>();
  
  for (const access of [...mockAccesses, ...underlyingAccesses]) {
    if (!slotsToCheck.has(access.address)) {
      slotsToCheck.set(access.address, new Set());
    }
    slotsToCheck.get(access.address)!.add(access.slot);
  }
  
  // Fetch storage values in parallel
  const fetchPromises: Promise<void>[] = [];
  
  for (const [address, slots] of slotsToCheck) {
    for (const slot of slots) {
      const key = `${address}:${slot}`;
      fetchPromises.push(
        forkProvider.getStorage(address, slot).then(value => {
          mockFinalValues.set(key, value);
        })
      );
      fetchPromises.push(
        underlyingProvider.getStorage(address, slot).then(value => {
          underlyingFinalValues.set(key, value);
        })
      );
    }
  }
  
  await Promise.all(fetchPromises);
  
  // Compare the final values
  if (options?.storageValues) {
    options.storageValues(mockAccesses, underlyingAccesses, mockFinalValues, underlyingFinalValues);
  } else {
    createStorageValueComparer(errorContext)(mockAccesses, underlyingAccesses, mockFinalValues, underlyingFinalValues);
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
  const testAddresses = [...getFromAddresses(), ethers.ZeroAddress];
  
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

export async function expectEquivalentTxFromMultipleAddresses<TContract extends BaseContract>(
  ContractFactory: {
    connect(address: string, provider: any): TContract;
    createInterface(): any;
  },
  address: string,
  method: ContractFunctionNames<TContract>,
  args: any[] = [],
  options?: EquivalenceOptions
): Promise<void> {
  const testAddresses = getFromAddresses();
  
  for (const fromAddress of testAddresses) {
    await expectEquivalentTx(
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

export async function expectEquivalentCallFromChainOwner<TContract extends BaseContract>(
  ContractFactory: {
    connect(address: string, provider: any): TContract;
    createInterface(): any;
  },
  address: string,
  method: ContractFunctionNames<TContract>,
  args: any[] = [],
  options?: EquivalenceOptions
): Promise<void> {
  const chainOwner = getChainOwner();
  await expectEquivalentCall(
    ContractFactory,
    address,
    method,
    args,
    {
      ...options,
      from: chainOwner.address
    }
  );
}

export async function expectEquivalentTxFromChainOwner<TContract extends BaseContract>(
  ContractFactory: {
    connect(address: string, provider: any): TContract;
    createInterface(): any;
  },
  address: string,
  method: ContractFunctionNames<TContract>,
  args: any[] = [],
  options?: EquivalenceOptions
): Promise<void> {
  const chainOwner = getChainOwner();
  await expectEquivalentTx(
    ContractFactory,
    address,
    method,
    args,
    {
      ...options,
      from: chainOwner.address
    }
  );
}