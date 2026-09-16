#!/bin/bash
# Start a nitro-testnode for the differential tests, then upgrade it to ArbOS 60.
set -e
if [ ! -d nitro-testnode ]; then
  git clone --recurse-submodules https://github.com/OffchainLabs/nitro-testnode nitro-testnode
fi
cd nitro-testnode
git fetch origin
git checkout -- .
# Tip of the release branch.
git checkout 9e63ae580c9a560fd7abcc2861966ce35facbeef
git submodule update --init --recursive
./test-node.bash --init-force --detach "$@"

RPC=http://localhost:8547
ARB_SYS=0x0000000000000000000000000000000000000064
ARB_OWNER=0x0000000000000000000000000000000000000070
# nitro-testnode l2owner (chain owner), derived from its public dev mnemonic.
OWNER_KEY=0xdc04c5399f82306ec4b4d654a342f40e2e0620fe39950d967e1e574b32d4dd36
REQUIRED_ARBOS_VERSION=60

while true; do
  if ! raw=$(cast call --rpc-url $RPC $ARB_SYS "arbOSVersion()(uint64)" 2>/dev/null); then
    echo "waiting for testnode"
    sleep 5
    continue
  fi
  version=$((raw - 55))
  if [ "$version" -ge $REQUIRED_ARBOS_VERSION ]; then
    echo "testnode running ArbOS $version"
    break
  fi
  echo "testnode running ArbOS $version, scheduling upgrade to $REQUIRED_ARBOS_VERSION"
  cast send --rpc-url $RPC --private-key $OWNER_KEY $ARB_OWNER \
    "scheduleArbOSUpgrade(uint64,uint64)" $REQUIRED_ARBOS_VERSION 0 >/dev/null 2>&1
  # The upgrade applies on the next block; a transfer forces one.
  cast send --rpc-url $RPC --private-key $OWNER_KEY 0x0000000000000000000000000000000000000000 >/dev/null 2>&1 || true
done

# Clear the now-applied scheduled upgrade so getScheduledUpgrade reads (0, 0).
cast send --rpc-url $RPC --private-key $OWNER_KEY $ARB_OWNER \
  "scheduleArbOSUpgrade(uint64,uint64)" 0 0 >/dev/null 2>&1
