.PHONY: fmt fmt.check lint lint.fix typecheck test check

## Formatting
fmt:
	bun run format

fmt.check:
	bunx biome format --check src/

## Linting
lint:
	bun run lint

lint.fix:
	bun run lint:fix

## Type checking
typecheck:
	bun run typecheck

## Testing
test:
	bun run test:run

## Run all checks (format + lint + typecheck)
check: fmt.check lint typecheck
