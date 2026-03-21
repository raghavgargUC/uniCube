FROM cubejs/cube:latest

COPY package.json /cube/conf/package.json
RUN cd /cube/conf && npm install --production

COPY cube.js /cube/conf/cube.js
COPY src /cube/conf/src
COPY model /cube/conf/model
