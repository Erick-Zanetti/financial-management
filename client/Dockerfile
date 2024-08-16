FROM node:alpine as build-stage

WORKDIR /app

COPY package*.json /app/

RUN npm install

COPY . /app

RUN npm run build --prod

FROM nginx:alpine

COPY --from=build-stage /app/dist/app-financial-management/browser /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
