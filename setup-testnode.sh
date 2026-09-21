#!/bin/bash
# Start a nitro-testnode for the differential tests.
# --l2-tx-filtering is what makes the testnode boot with ArbOS 60 at genesis.
set -e
if [ ! -d nitro-testnode ]; then
  git clone --recurse-submodules https://github.com/OffchainLabs/nitro-testnode nitro-testnode
fi
cd nitro-testnode
git fetch -q origin
git checkout 55807a8aa18b6c8faa81c380b2c5c270fe98b0e0
git submodule update --init --recursive
./test-node.bash --init-force --detach --l2-tx-filtering "$@"
