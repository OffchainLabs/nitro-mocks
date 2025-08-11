#!/bin/bash
# Clone nitro for development
git clone https://github.com/OffchainLabs/nitro nitro
cd nitro
git checkout v3.2.0
git submodule update --init --recursive