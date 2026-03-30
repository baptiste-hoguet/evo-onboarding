#!/bin/bash
export PATH="/Users/evoincubator/.nvm/versions/node/v24.14.1/bin:$PATH"
export NODE_PATH="/Users/evoincubator/.nvm/versions/node/v24.14.1/lib/node_modules"
cd /Users/evoincubator/evo-onboarding
exec node node_modules/.bin/next dev
