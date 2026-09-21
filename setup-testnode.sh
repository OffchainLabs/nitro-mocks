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
git checkout -- docker-compose.yaml
# The sequencer keeps state for the last 128 blocks, but hardhat forks unknown chains at
# latest-128, so the fork block is pruned as soon as the chain passes 128 blocks.
git apply <<'EOF'
--- a/docker-compose.yaml
+++ b/docker-compose.yaml
@@ -171,6 +171,7 @@ services:
       - --conf.file=/config/sequencer_config.json
       - --node.feed.output.enable
       - --node.feed.output.port=9642
+      - --execution.caching.archive
       - --http.api=net,web3,eth,txpool,debug,timeboost,auctioneer
       - --node.seq-coordinator.my-url=http://sequencer:8547
       - --graphql.enable
EOF
./test-node.bash --init-force --l2-tx-filtering "$@"
