#!/bin/bash
# Start a nitro-testnode for the differential tests.
# --l2-tx-filtering is what makes the testnode boot with ArbOS 60 at genesis.
if [ ! -d nitro-testnode ]; then
  git clone --recurse-submodules https://github.com/OffchainLabs/nitro-testnode nitro-testnode
fi
cd nitro-testnode
git checkout 6ae31d1b5be5fc44abbf6295997fb140bb3dbdd1
git submodule update --init --recursive
./test-node.bash --init-force --l2-tx-filtering "$@"
