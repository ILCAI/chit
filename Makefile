include .docker.env
.PHONY: version build push docker-login

VERSION ?= "$(shell ./ops/version.sh $(SERVICE))"
IMAGE_NAME="$(DOCKER_REGISTRY)/chit-$(SERVICE):$(VERSION)"

version:
	@echo $(VERSION)

build:
	@docker build \
		-t $(IMAGE_NAME) \
		-f services/$(SERVICE)/Dockerfile \
		--target release \
		services/$(SERVICE)

push: docker-login
	@docker push $(IMAGE_NAME)

docker-login:
	@echo $(DOCKER_LOGIN_PASSWORD) | docker login $(DOCKER_REGISTRY) -u $(DOCKER_LOGIN_USER) --password-stdin
