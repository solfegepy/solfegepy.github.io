.PHONY: start-dev clean build format lint test test-e2e test-e2e-headed test-e2e-slow test-e2e-debug test-report outdated upgrade zap lighthouse

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
	~/.local/bin/assert_ui_breakpoint.sh ui/src

test: ui/node_modules
	cd ui && pnpm test -- --bail=1

test-e2e: ui/node_modules
	cd ui && pnpm exec playwright test --max-failures=1

test-e2e-headed: ui/node_modules
	cd ui && pnpm exec playwright test --headed --max-failures=1

test-e2e-slow: ui/node_modules
	cd ui && PLAYWRIGHT_SLOW_MO=1000 pnpm exec playwright test --headed --max-failures=1

test-e2e-debug: ui/node_modules
	cd ui && DEBUG='pw:api,pw:browser*' pnpm exec playwright test --debug

test-report: ui/node_modules
	cd ui && pnpm exec playwright show-report --host 0.0.0.0 test-results/playwright/report

outdated: ui/node_modules
	cd ui && pnpm outdated

upgrade: ui/node_modules
	cd ui && pnpm update
	@pkg=$$(jq -r '.devDependencies["@playwright/test"]' ui/package.json | tr -d '^~='); \
	img=$$(jq -r '.driverVersion' /ms-playwright/.docker-info); \
	[ "$$pkg" = "$$img" ] || { echo "Playwright mismatch: package.json wants $$pkg, devcontainer image has $$img. Bump the Playwright image version in .devcontainer/compose.devcontainer.yaml (or its Dockerfile) to $$pkg."; exit 1; }

ui/node_modules:
	cd ui && pnpm install --frozen-lockfile
