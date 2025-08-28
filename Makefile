.PHONY: dev-up dev-down logs health clean

dev-up:
	./scripts/dev-up.sh

dev-down:
	./scripts/dev-down.sh

logs:
	docker compose -f docker-compose.dev.yml logs --tail=200 -f

health:
	./scripts/healthcheck.sh

clean:
	docker compose -f docker-compose.dev.yml down --remove-orphans
	docker image prune -f
