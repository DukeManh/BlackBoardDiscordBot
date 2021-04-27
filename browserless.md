- To avoid starting browser overhead and improve scaping performance,
  puppeteer will connect to a Chrome websocket running on a local
  Browserless image instance so all operations share the same browser

- Pull and Start browserless Image with default configuration

$ docker run \
 --rm \
 -p 3000:3000 \
 -e "MAX_CONCURRENT_SESSIONS=10" \
 browserless/chrome:latest
