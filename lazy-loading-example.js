// Пример реализации Lazy Loading для изображений
// Добавить в script.js или создать отдельный файл

(function() {
    'use strict';
    
    // Проверка поддержки Intersection Observer
    if ('IntersectionObserver' in window) {
        // Настройки для lazy loading
        const imageObserver = new IntersectionObserver((entries, observer) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const img = entry.target;
                    
                    // Загружаем изображение
                    if (img.dataset.src) {
                        img.src = img.dataset.src;
                        img.removeAttribute('data-src');
                    }
                    
                    // Загружаем WebP версию, если поддерживается
                    if (img.dataset.srcset) {
                        img.srcset = img.dataset.srcset;
                        img.removeAttribute('data-srcset');
                    }
                    
                    // Добавляем класс для анимации появления
                    img.classList.add('loaded');
                    
                    // Убираем из наблюдения
                    observer.unobserve(img);
                }
            });
        }, {
            rootMargin: '50px' // Начинаем загрузку за 50px до появления в viewport
        });
        
        // Находим все изображения с data-src
        const lazyImages = document.querySelectorAll('img[data-src]');
        lazyImages.forEach(img => {
            imageObserver.observe(img);
        });
        
        // Fallback для старых браузеров
    } else {
        // Если Intersection Observer не поддерживается, загружаем все изображения сразу
        const lazyImages = document.querySelectorAll('img[data-src]');
        lazyImages.forEach(img => {
            img.src = img.dataset.src;
            if (img.dataset.srcset) {
                img.srcset = img.dataset.srcset;
            }
            img.removeAttribute('data-src');
            img.removeAttribute('data-srcset');
        });
    }
    
    // Функция для добавления loading="lazy" ко всем изображениям
    function addLazyLoadingToImages() {
        const images = document.querySelectorAll('img:not([loading])');
        images.forEach(img => {
            // Не добавляем lazy для изображений выше fold (первые 1000px)
            const rect = img.getBoundingClientRect();
            if (rect.top > 1000) {
                img.setAttribute('loading', 'lazy');
            }
        });
    }
    
    // Вызываем при загрузке DOM
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', addLazyLoadingToImages);
    } else {
        addLazyLoadingToImages();
    }
    
    // Функция для создания WebP версии изображения
    function createWebPImage(originalSrc) {
        // Проверяем поддержку WebP
        const webpSupported = document.createElement('canvas')
            .toDataURL('image/webp')
            .indexOf('data:image/webp') === 0;
        
        if (!webpSupported) {
            return originalSrc;
        }
        
        // Заменяем расширение на .webp (если есть)
        return originalSrc.replace(/\.(jpg|jpeg|png)$/i, '.webp');
    }
    
    // Добавляем placeholder для изображений
    function addImagePlaceholder(img) {
        if (!img.dataset.placeholder) {
            // Создаем простой placeholder через SVG
            const placeholder = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="400" height="300"%3E%3Crect fill="%23f0f0f0" width="400" height="300"/%3E%3C/svg%3E';
            img.src = placeholder;
        }
    }
    
})();

// Пример использования в HTML:
/*
<!-- Обычное изображение с lazy loading -->
<img src="placeholder.jpg" 
     data-src="real-image.jpg" 
     data-srcset="real-image.webp" 
     alt="Описание"
     loading="lazy"
     class="lazy-image">

<!-- Изображение с srcset для адаптивности -->
<img src="placeholder.jpg"
     data-src="image-small.jpg"
     data-srcset="image-small.webp 400w, image-medium.webp 800w, image-large.webp 1200w"
     sizes="(max-width: 600px) 400px, (max-width: 1200px) 800px, 1200px"
     alt="Описание"
     loading="lazy"
     class="lazy-image">
*/
