#!/bin/bash
# Start a nitro-testnode for the differential tests.
# --l2-tx-filtering is what makes the testnode boot with ArbOS 60 at genesis.
set -e
if [ ! -d nitro-testnode ]; then
  git clone --recurse-submodules https://github.com/OffchainLabs/nitro-testnode nitro-testnode
fi
cd nitro-testnode
git checkout 6ae31d1b5be5fc44abbf6295997fb140bb3dbdd1
git submodule update --init --recursive
git checkout -- scripts/config.ts docker-compose.yaml
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
# nitro-testnode puts "enable" under address-filter, a key no nitro release accepts.
git apply <<'EOF'
--- a/scripts/config.ts
+++ b/scripts/config.ts
@@ -212,8 +212,8 @@ function createDataAvailabilityConfig(argv: any, anytrust: boolean) {

 function applyTxFilteringConfig(config: any) {
     config.execution["transaction-filtering"] = {
+        "enable": true,
         "address-filter": {
-            "enable": true,
             "s3": {
                 "access-key": "minioadmin",
                 "secret-key": "minioadmin",
EOF
./test-node.bash --init-force --l2-tx-filtering "$@"
