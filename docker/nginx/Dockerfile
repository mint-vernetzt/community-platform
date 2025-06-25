FROM nginx:alpine

COPY /etc/nginx/sites-available/default.conf /etc/nginx/conf.d/default.conf

EXPOSE 80 443

CMD ["nginx", "-g", "daemon off;"]