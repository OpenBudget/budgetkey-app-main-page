FROM node:14-slim

# RUN apt-get add --update git

COPY . /app/
RUN cd /app/ && \
    npm install --no-audit --legacy-peer-deps && \
    npm run build --prod

EXPOSE 8000

CMD cd /app/ && npm start
