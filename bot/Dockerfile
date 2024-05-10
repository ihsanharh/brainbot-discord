# the bot
FROM brainbot/env:latest AS builder

WORKDIR /bot

COPY . .

RUN cmake -DCMAKE_BUILD_TYPE=Release -B ./build
RUN cmake --build ./build
RUN sh -c "mkdir -p /tmp/nes \
    && find /usr \( -name "*redis*" -o -name "*dpp*" \) -depth -exec sudo cp -R --parents {} /tmp/ \;"

FROM alpine:3.19

WORKDIR /home/runner/bot

RUN apk add openssl-dev spdlog-dev zlib-dev

COPY --from=builder /tmp/usr /usr/
COPY --from=builder /bot/build/brainbot .

RUN adduser -D runner
USER runner

ENTRYPOINT [ "./brainbot" ]