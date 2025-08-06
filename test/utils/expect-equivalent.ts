import { expect } from "chai";
import { 
  BaseContract, 
  HDNodeWallet,
  ContractTransactionResponse, 
  ContractTransactionReceipt,
  EventLog,
  Provider,
  Interface,
  Signer
} from "ethers";
import { getAllStorageAccessesFromCall, getAllStorageAccessesFromTx, StorageAccess } from "./storage";
import { getUnderlyingProvider } from "./utils";
import { ethers } from "hardhat";

const VERSION_SLOT = "0x15fed0451499512d95f3ec5a41c878b9de55f21878b5b4e190d4667ec709b400";
const L2_BASE_FEE_SLOT = "0xe54de2a4cdacc0a0059d2b6e16348103df8c4aff409c31e40ec73d11926c8202";
const TEST_MNEMONIC = "indoor dish desk flag debris potato excuse depart ticket judge file exit";

function getWalletFromMnemonic(index: number, provider?: Provider): HDNodeWallet {
  const wallet = ethers.HDNodeWallet.fromPhrase(TEST_MNEMONIC, undefined, `m/44'/60'/0'/0/${index}`);
  return provider ? wallet.connect(provider) : wallet;
}

function getWalletIndexFromAddress(address: string): number {
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
    args: unknown[];
    options?: EquivalenceOptions;
  };
  result: {
    reason: string;
    mockData?: unknown;
    underlyingData?: unknown;
    details?: unknown;
  };
}

function failWithError(error: EquivalenceError): void {
  // Custom replacer to handle BigInt serialization
  const replacer = (key: string, value: unknown) => {
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
  result?: (mock: unknown, underlying: unknown) => void;
  events?: (mock: EventLog[], underlying: EventLog[]) => void;
}

// Extract function names from the contract's interface getFunction parameter type
type ContractFunctionNames<T extends BaseContract> = T extends {
  interface: {
    getFunction(nameOrSignature: infer N): unknown;
  };
} ? N : string;
function compareResults(
  mockResult: unknown,
  underlyingResult: unknown,
  errorContext: EquivalenceError,
  customComparer?: (mock: unknown, underlying: unknown) => void
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
    connect(address: string, signerOrProvider: Signer | Provider): TContract;
    createInterface(): Interface;
  },
  address: string,
  method: ContractFunctionNames<TContract>,
  args: unknown[] = [],
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
  
  let mockResult: unknown;
  let underlyingResult: unknown;
  let mockReverted = false;
  let underlyingReverted = false;
  
  try {
    const mockFn = mockContract.getFunction(method as string);
    mockResult = await mockFn.staticCall(...args);
  } catch (error) {
    mockReverted = true;
    mockResult = error;
  }
  
  try {
    const underlyingFn = underlyingContract.getFunction(method as string);
    underlyingResult = await underlyingFn.staticCall(...args);
  } catch (error) {
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
        mockData: mockReverted ? { error: (mockResult as any)?.reason || (mockResult as any)?.message } : mockResult,
        underlyingData: underlyingReverted ? { error: (underlyingResult as any)?.reason || (underlyingResult as any)?.message } : underlyingResult
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

export function compareEvents(
  mockEvents: EventLog[],
  underlyingEvents: EventLog[],
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

export interface TxExecutionResult {
  staticResult?: unknown;
  staticReverted: boolean;
  staticError?: Error;
  
  tx?: ContractTransactionResponse;
  receipt?: ContractTransactionReceipt;
  reverted: boolean;
  revertReason?: string;
  
  storageAccesses: StorageAccess[];
  finalStorageValues: Map<string, string>;
  
  events?: EventLog[];
}

export async function executeTx<TContract extends BaseContract>(
  ContractFactory: {
    connect(address: string, signerOrProvider: Signer | Provider): TContract;
    createInterface(): Interface;
  },
  address: string,
  method: ContractFunctionNames<TContract>,
  args: unknown[] = [],
  from: string,
  provider: Provider,
  overrides?: { value?: bigint }
): Promise<TxExecutionResult> {
  const walletIndex = getWalletIndexFromAddress(from);
  if (walletIndex === -1) {
    throw new Error(`Unknown test address: ${from}`);
  }
  const signer = getWalletFromMnemonic(walletIndex, provider);
  const contract = ContractFactory.connect(address, signer);
  
  let staticResult: unknown;
  let staticReverted = false;
  let staticError: Error | undefined;
  
  try {
    const fn = contract.getFunction(method as string);
    if (overrides?.value) {
      staticResult = await fn.staticCall(...args, { value: overrides.value });
    } else {
      staticResult = await fn.staticCall(...args);
    }
  } catch (error) {
    staticReverted = true;
    staticError = error instanceof Error ? error : new Error(String(error));
  }
  
  let tx: ContractTransactionResponse | undefined;
  let receipt: ContractTransactionReceipt | undefined;
  let reverted = false;
  let revertReason: string | undefined;
  
  try {
    const fn = contract.getFunction(method as string);
    if (overrides?.value) {
      tx = await fn.send(...args, { value: overrides.value });
    } else {
      tx = await fn.send(...args);
    }
    const txReceipt = await tx!.wait();
    receipt = txReceipt || undefined;
  } catch (error) {
    reverted = true;
    revertReason = error instanceof Error ? error.message : String(error);
  }
  
  let storageAccesses: StorageAccess[] = [];
  if (!reverted && tx && tx.hash) {
    storageAccesses = await getAllStorageAccessesFromTx(provider, tx.hash);
  }
  
  const finalStorageValues = new Map<string, string>();
  const slotsToCheck = new Map<string, Set<string>>();
  
  for (const access of storageAccesses) {
    if (!slotsToCheck.has(access.address)) {
      slotsToCheck.set(access.address, new Set());
    }
    slotsToCheck.get(access.address)!.add(access.slot);
  }
  
  const fetchPromises: Promise<void>[] = [];
  for (const [contractAddress, slots] of slotsToCheck) {
    for (const slot of slots) {
      const key = `${contractAddress}:${slot}`;
      fetchPromises.push(
        provider.getStorage(contractAddress, slot).then((value: string) => {
          finalStorageValues.set(key, value);
        })
      );
    }
  }
  
  await Promise.all(fetchPromises);
  
  let events: EventLog[] | undefined;
  if (receipt && receipt.logs) {
    events = receipt.logs.filter((log): log is EventLog => log instanceof EventLog);
  }
  
  return {
    staticResult,
    staticReverted,
    staticError,
    tx,
    receipt,
    reverted,
    revertReason,
    storageAccesses,
    finalStorageValues,
    events
  };
}

export function compareTxResults<TContract extends BaseContract>(
  mockResult: TxExecutionResult,
  underlyingResult: TxExecutionResult,
  ContractFactory: {
    connect(address: string, signerOrProvider: Signer | Provider): TContract;
    createInterface(): Interface;
  },
  address: string,
  method: ContractFunctionNames<TContract>,
  args: unknown[] = [],
  options?: EquivalenceOptions
): void {
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
  
  if (!mockResult.staticReverted && !underlyingResult.staticReverted) {
    compareResults(mockResult.staticResult, underlyingResult.staticResult, errorContext, options?.result);
  }
  
  if (mockResult.reverted && underlyingResult.reverted) {
    // TODO: we should still compare storage and events even if both reverted - if they're available
    return;
  } else if (mockResult.reverted || underlyingResult.reverted) {
    failWithError({
      ...errorContext,
      result: {
        reason: mockResult.reverted ? "Mock tx reverted but underlying succeeded" : "Underlying tx reverted but mock succeeded",
        mockData: mockResult.reverted ? { error: mockResult.revertReason } : mockResult.tx?.hash,
        underlyingData: underlyingResult.reverted ? { error: underlyingResult.revertReason } : underlyingResult.tx?.hash
      }
    });
  }
  
  if (mockResult.receipt?.status !== underlyingResult.receipt?.status) {
    failWithError({
      ...errorContext,
      result: {
        reason: "Transaction status mismatch",
        mockData: { status: mockResult.receipt?.status, receipt: mockResult.receipt },
        underlyingData: { status: underlyingResult.receipt?.status, receipt: underlyingResult.receipt }
      }
    });
  }
  
  if (options?.events) {
    const mockLogs = mockResult.receipt?.logs?.filter((log): log is EventLog => log instanceof EventLog) || [];
    const underlyingLogs = underlyingResult.receipt?.logs?.filter((log): log is EventLog => log instanceof EventLog) || [];
    options.events(mockLogs, underlyingLogs);
  } else {
    const mockLogs = mockResult.receipt?.logs?.filter((log): log is EventLog => log instanceof EventLog) || [];
    const underlyingLogs = underlyingResult.receipt?.logs?.filter((log): log is EventLog => log instanceof EventLog) || [];
    compareEvents(mockLogs, underlyingLogs, errorContext);
  }
  
  if (options?.storageAccess) {
    options.storageAccess(mockResult.storageAccesses, underlyingResult.storageAccesses);
  } else {
    createStorageAccessComparer(errorContext)(mockResult.storageAccesses, underlyingResult.storageAccesses);
  }
  
  const allStorageValues = new Map<string, string>();
  const slotsToCheck = new Map<string, Set<string>>();
  
  for (const access of [...mockResult.storageAccesses, ...underlyingResult.storageAccesses]) {
    if (!slotsToCheck.has(access.address)) {
      slotsToCheck.set(access.address, new Set());
    }
    slotsToCheck.get(access.address)!.add(access.slot);
  }
  
  const mockFinalValues = new Map<string, string>();
  const underlyingFinalValues = new Map<string, string>();
  
  for (const [contractAddress, slots] of slotsToCheck) {
    for (const slot of slots) {
      const key = `${contractAddress}:${slot}`;
      const mockValue = mockResult.finalStorageValues.get(key);
      const underlyingValue = underlyingResult.finalStorageValues.get(key);
      if (mockValue !== undefined) {
        mockFinalValues.set(key, mockValue);
      }
      if (underlyingValue !== undefined) {
        underlyingFinalValues.set(key, underlyingValue);
      }
    }
  }
  
  if (options?.storageValues) {
    options.storageValues(mockResult.storageAccesses, underlyingResult.storageAccesses, mockFinalValues, underlyingFinalValues);
  } else {
    createStorageValueComparer(errorContext)(mockResult.storageAccesses, underlyingResult.storageAccesses, mockFinalValues, underlyingFinalValues);
  }
}

export async function expectEquivalentTx<TContract extends BaseContract>(
  ContractFactory: {
    connect(address: string, signerOrProvider: Signer | Provider): TContract;
    createInterface(): Interface;
  },
  address: string,
  method: ContractFunctionNames<TContract>,
  args: unknown[] = [],
  options?: EquivalenceOptions & { value?: bigint }
): Promise<void> {
  if (!options?.from) {
    throw new Error("From address is required for transactions");
  }
  
  const forkProvider = ethers.provider;
  const underlyingProvider = getUnderlyingProvider();
  
  const overrides = options?.value ? { value: options.value } : undefined;
  
  const [mockResult, underlyingResult] = await Promise.all([
    executeTx(ContractFactory, address, method, args, options.from, forkProvider, overrides),
    executeTx(ContractFactory, address, method, args, options.from, underlyingProvider, overrides)
  ]);
  
  compareTxResults(
    mockResult,
    underlyingResult,
    ContractFactory,
    address,
    method,
    args,
    options
  );
}

export async function expectEquivalentCallFromMultipleAddresses<TContract extends BaseContract>(
  ContractFactory: {
    connect(address: string, signerOrProvider: Signer | Provider): TContract;
    createInterface(): Interface;
  },
  address: string,
  method: ContractFunctionNames<TContract>,
  args: unknown[] = [],
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
    connect(address: string, signerOrProvider: Signer | Provider): TContract;
    createInterface(): Interface;
  },
  address: string,
  method: ContractFunctionNames<TContract>,
  args: unknown[] = [],
  options?: EquivalenceOptions & { value?: bigint }
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
    connect(address: string, signerOrProvider: Signer | Provider): TContract;
    createInterface(): Interface;
  },
  address: string,
  method: ContractFunctionNames<TContract>,
  args: unknown[] = [],
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
    connect(address: string, signerOrProvider: Signer | Provider): TContract;
    createInterface(): Interface;
  },
  address: string,
  method: ContractFunctionNames<TContract>,
  args: unknown[] = [],
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