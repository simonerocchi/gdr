all:
    BUILD +build
    BUILD +buildClient
    # BUILD +lint
    BUILD +serverImage
    BUILD +bootstrapImage

buildClientEnvironment:
    FROM node:14
    WORKDIR '/app'
    COPY ./gdr-client/package.json .
    RUN npm install
    RUN npm i -g @angular/cli@11.2.2
    RUN npm i -D typescript@4.1.5
    COPY ./gdr-client/ .
   
buildEnvironment:
    FROM golang:1.16.3-alpine
    WORKDIR /work

    # Golangci-lint installation
    RUN apk add curl git
    RUN curl -sSfL https://raw.githubusercontent.com/golangci/golangci-lint/master/install.sh | sh -s v1.39.0

    RUN git config --global url."https://simonerocchi:yq3RGzmhzSKbyM5hAhRF@bitbucket.org/".insteadOf "https://bitbucket.org/"

    # Set necessary environmet variables needed for our image
    ENV GO111MODULE=on 
    ENV CGO_ENABLED=0 
    ENV GOOS=linux 
    ENV GOARCH=amd64 
    ENV GOPRIVATE=bitbucket.org/leonardoce

    # Download dependencies
    COPY ./gdr-server/go.mod ./gdr-server/go.sum .
    RUN go mod download

    # Copy source code
    COPY ./gdr-server/cmd cmd
    COPY ./gdr-server/internal internal

build:
    FROM +buildEnvironment
    ENV CGO_ENABLED=0
    RUN go build -o gdr cmd/main.go
    SAVE ARTIFACT gdr

buildClient:
    FROM +buildClientEnvironment
     # ng build --prod
    RUN node --max_old_space_size=4096 node_modules/@angular/cli/bin/ng build --prod --outputPath=./dist
    SAVE ARTIFACT dist

lint:
    FROM +buildEnvironment
    ENV CGO_ENABLED=0
    RUN ./bin/golangci-lint run --timeout 5m0s ./...

baseImage:
    FROM alpine:3.13
    COPY +build/gdr /app/gdr

serverImage:
    FROM +baseImage
    COPY +buildClient/dist /app/web
    EXPOSE 80
    CMD ["/app/gdr", "server"]
    SAVE IMAGE gdr

bootstrapImage:
    FROM +baseImage
    CMD ["/app/gdr", "bootstrap"]
    SAVE IMAGE gdr-bootstrap
