FROM nginx:alpine

# Copy custom Nginx virtualhost configuration
COPY default.conf /etc/nginx/conf.d/default.conf

WORKDIR /var/www/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
