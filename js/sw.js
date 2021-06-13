this.addEventListener('install', function (event) {
    event.waitUntil(
        caches.open('v1').then(function (cache) {
            return cache.addAll([
                'data/database-latest.csv',
                'css/main.css',
                'js/main.js',
                'index.html',
                'images/img1.jpg',
                'images/img2.jpg',
                'images/img3.jpg',
                // Weitere Bilder noch adden usw.
            ]);
        })
    );
});
this.addEventListener('fetch', function (event) {
    event.respondWith(
        caches.match(event.request).catch(function () {
            return fetch(event.request).then(function (response) {
                return caches.open('v1').then(function (cache) {
                    cache.put(event.request, response.clone());
                    return response;
                });
            });
        })
    );
});
this.addEventListener('activate', function (event) {
    var cacheWhitelist = ['v2'];

    event.waitUntil(
        caches.keys().then(function (keyList) {
            return Promise.all(keyList.map(function (key) {
                if (cacheWhitelist.indexOf(key) === -1) {
                    return caches.delete(key);
                }
            }));
        })
    );
});