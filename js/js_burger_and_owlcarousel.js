$(document).ready(function() {
    // Бургер-меню
    $('#burgerBtn').click(function() {
        $(this).toggleClass('active');
        $('#navMenu').toggleClass('active');
    });

    // Закрытие меню при клике на ссылку
    $('.nav-list a').click(function() {
        $('#burgerBtn').removeClass('active');
        $('#navMenu').removeClass('active');
    });

    // Инициализация Owl Carousel ТОЛЬКО для главной страницы
    if ($('#developerCarousel').length) {
        $('#developerCarousel').owlCarousel({
            loop: true,
            margin: 20,
            nav: false,
            dots: true,
            autoplay: true,
            autoplayTimeout: 5000,
            autoplayHoverPause: true,
            center: true,
            items: 3,
            responsive: {
                0: {
                    items: 1,
                    center: false
                },
                600: {
                    items: 2,
                    center: true
                },
                1000: {
                    items: 3,
                    center: true
                }
            }
        });
    }

    // УПРАВЛЕНИЕ С КЛАВИАТУРЫ (для карусели на главной)
    $(document).keydown(function(e) {
        if ($('#developerCarousel').length) {
            if (e.keyCode === 37) { // Левая стрелка
                $('#developerCarousel').trigger('prev.owl.carousel');
                e.preventDefault();
            }
            else if (e.keyCode === 39) { // Правая стрелка
                $('#developerCarousel').trigger('next.owl.carousel');
                e.preventDefault();
            }
        }
    });
});

// ========== ФУНКЦИЯ ДЛЯ ЯНДЕКС.КАРТЫ ==========
function initYandexMap() {
    // Проверяем, есть ли элемент карты на странице
    if (document.getElementById('yandex-map-irkt')) {
        console.log('Создаем карту...');
        
        try {
            var map = new ymaps.Map("yandex-map-irkt", {
                center: [52.27515415312987, 104.27977082209006],
                zoom: 17,
                controls: ['zoomControl']
            });

            var placemark = new ymaps.Placemark([52.27515415312987, 104.27977082209006], {
                hintContent: 'ул. Гагарина, 20',
                balloonContent: '<div style="padding: 5px;"><strong>ул. Гагарина, 20</strong><br>Иркутск, Россия</div>'
            }, {
                preset: 'islands#redDotIcon',
                iconColor: '#E36D6D'  // Розовый цвет под наш сайт
            });

            map.controls.remove('geolocationControl');
            map.controls.remove('searchControl');
            map.controls.remove('trafficControl');
            map.controls.remove('typeSelector');

            map.geoObjects.add(placemark);
            placemark.balloon.open();

            if (/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)) {
                map.behaviors.disable('drag');
            }
            
            console.log('Карта успешно создана!');
        } catch (error) {
            console.error('Ошибка при создании карты:', error);
        }
    } else {
        console.log('Элемент карты не найден на этой странице');
    }
}

// Загружаем API Яндекс.Карт и инициализируем карту
if (typeof ymaps !== 'undefined') {
    ymaps.ready(initYandexMap);
} else {
    console.log('ymaps не загружен');
}