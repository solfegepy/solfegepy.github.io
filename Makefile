.PHONY: start-dev stop clean build format format-check typecheck eslint lint test test-e2e test-e2e-slow test-e2e-step-by-step outdated upgrade zap lighthouse

include .devcontainer/.env
export


# ------------ run from host (with docker) --------
DEPLOYED_URL ?= https://codec64.com

zap:
	mkdir -p ui/test-results/zap_wrk
	bash -o pipefail -c 'docker run --rm -t \
		-v "$$1/ui/test-results/zap_wrk:/zap/wrk" \
		-v "$$1/ui/zap.conf:/zap.conf:ro" \
		ghcr.io/zaproxy/zaproxy:weekly zap-baseline.py -t "$$2" -c /zap.conf \
		| tee "$$1/ui/test-results/zap.log"' _ "$(CURDIR)" "$(DEPLOYED_URL)"

lighthouse:
	mkdir -p ui/test-results/lighthouse
	cd ui && pnpm exec lighthouse "$(DEPLOYED_URL)" --no-enable-error-reporting --view \
		--output-path=./test-results/lighthouse --output=html --output=json

deploy:
	docker exec -it saicli__ai_codec64 make build
	echo "You can now 'git push' and check status: https://github.com/solfegepy/solfegepy.github.io/actions"

# ------------ run from devcontainer (with node) ----------
start-dev:
	cd ui && pnpm run dev

build: ui/node_modules
	cd ui && pnpm run build

clean:
	cd ui && rm -rf ../docs .astro .pnpm-store node_modules test-results

format: ui/node_modules
	cd ui && pnpm exec prettier --write .

lint: ui/node_modules
	cd ui && pnpm exec prettier --check .
	cd ui && pnpm run typecheck
	cd ui && pnpm exec eslint .
	cd ui && semgrep scan --error --config auto .

test: ui/node_modules
	cd ui && pnpm test -- --bail=1

test-e2e: ui/node_modules
	cd ui && pnpm exec playwright test --max-failures=1

test-e2e-slow: ui/node_modules
	cd ui && PLAYWRIGHT_SLOW_MO=1000 pnpm exec playwright test --headed --max-failures=1

test-e2e-step-by-step: ui/node_modules
	cd ui && pnpm exec playwright test --debug

outdated: ui/node_modules
	cd ui && pnpm outdated

upgrade: ui/node_modules
	cd ui && pnpm update

ui/node_modules:
	cd ui && pnpm install --frozen-lockfile
