import { JsonRpcProvider } from "ethers";
import { ArbPrecompile, forkSync, getUnderlyingProvider } from "./utils";
import { getChainOwner } from "./expect-equivalent";
import { ArbOwner__factory } from "../../typechain-types";

export interface NativeArbOwnerCall {
  method: string;
  args: unknown[];
}

const SETTLE_MS = 2000;
const SEND_ATTEMPTS = 5;
const RETRY_MS = 1000;

// Pricing setup can raise the base fee between the fee estimate and the send. Bidding well above
// the minimum base fee keeps a teardown from being rejected by the state its own setup created,
// which would otherwise leave the constraints installed. Arbitrum refunds the difference.
const MAX_FEE_PER_GAS = 1_000_000_000n;

/**
 * Sets up state the mock cannot produce itself by driving the native ArbOwner precompile on the
 * testnode, then re-points the fork at the result so both sides read the same state.
 */
export async function applyNativeArbOwnerTxs(calls: NativeArbOwnerCall[]): Promise<void> {
  const provider = getUnderlyingProvider();
  const chainOwner = getChainOwner().connect(provider);
  const arbOwner = ArbOwner__factory.connect(ArbPrecompile.ArbOwner, chainOwner);

  for (const call of calls) {
    await send(arbOwner, provider, chainOwner.address, call);
  }

  // Let the pricing model absorb the gas the setup transactions themselves burnt.
  await new Promise(resolve => setTimeout(resolve, SETTLE_MS));
  await forkSync();
}

/**
 * The chain owner is also the sender the differential tests use, and the testnode's own setup
 * scripts transact as it too, so its nonce can move between the estimate and the send. Each attempt
 * therefore reads the nonce afresh rather than tracking it locally.
 */
async function send(
  arbOwner: ReturnType<typeof ArbOwner__factory.connect>,
  provider: JsonRpcProvider,
  from: string,
  call: NativeArbOwnerCall
): Promise<void> {
  let lastError: unknown;
  for (let attempt = 0; attempt < SEND_ATTEMPTS; attempt++) {
    const nonce = await provider.getTransactionCount(from, "pending");
    try {
      const tx = await arbOwner
        .getFunction(call.method)
        .send(...call.args, { nonce, maxFeePerGas: MAX_FEE_PER_GAS, maxPriorityFeePerGas: 0n });
      const receipt = await tx.wait();
      if (receipt?.status !== 1) {
        throw new Error(`transaction ${tx.hash} reverted`);
      }
      return;
    } catch (error) {
      lastError = error;
      await new Promise(resolve => setTimeout(resolve, RETRY_MS));
    }
  }
  throw new Error(
    `native ArbOwner.${call.method} failed after ${SEND_ATTEMPTS} attempts: ${await diagnose(provider, lastError)}`
  );
}

async function diagnose(provider: JsonRpcProvider, error: unknown): Promise<string> {
  const block = await provider.getBlock("latest");
  const reason = error instanceof Error ? error.message : String(error);
  return `${reason} (block ${block?.number}, base fee ${
    block?.baseFeePerGas
  }, chain owner nonce ${await provider.getTransactionCount(getChainOwner().address, "pending")})`;
}
