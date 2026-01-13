// Hero video fallback
const heroVideo = document.querySelector('.hero-video');
if (heroVideo) {
    heroVideo.addEventListener('error', () => {
        // Если видео не загрузилось, используем fallback градиент
        const heroSection = document.querySelector('.hero-section');
        if (heroSection) {
            heroSection.style.background = 'var(--gradient-primary)';
        }
    });
    
    // Попытка загрузить видео
    heroVideo.load();
}

// Mobile menu toggle
const menuToggle = document.querySelector('.menu-toggle');
const navMenu = document.querySelector('.nav-menu');

if (menuToggle) {
    menuToggle.addEventListener('click', () => {
        navMenu.classList.toggle('active');
    });
}

// Close mobile menu when clicking outside
document.addEventListener('click', (e) => {
    if (navMenu && menuToggle && !navMenu.contains(e.target) && !menuToggle.contains(e.target)) {
        navMenu.classList.remove('active');
    }
});

// Smooth scrolling for navigation links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        const href = this.getAttribute('href');
        if (href && href !== '#') {
            e.preventDefault();
            const target = document.querySelector(href);
            if (target) {
                const headerOffset = 120;
                const elementPosition = target.getBoundingClientRect().top;
                const offsetPosition = elementPosition + window.pageYOffset - headerOffset;

                window.scrollTo({
                    top: offsetPosition,
                    behavior: 'smooth'
                });
                
                // Close mobile menu if open
                if (navMenu) {
                    navMenu.classList.remove('active');
                }
            }
        }
    });
});

// Update active nav link on scroll
window.addEventListener('scroll', () => {
    const sections = document.querySelectorAll('section[id]');
    const scrollY = window.pageYOffset;

    sections.forEach(section => {
        const sectionHeight = section.offsetHeight;
        const sectionTop = section.offsetTop - 150;
        const sectionId = section.getAttribute('id');
        const navLink = document.querySelector(`.nav-link[href="#${sectionId}"]`);

        if (scrollY > sectionTop && scrollY <= sectionTop + sectionHeight) {
            document.querySelectorAll('.nav-link').forEach(link => {
                link.classList.remove('active');
            });
            if (navLink) {
                navLink.classList.add('active');
            }
        }
    });
});

// CTA Buttons - scroll to form (except topCtaBtn which opens calculator)
document.addEventListener('DOMContentLoaded', () => {
    const topCtaBtn = document.getElementById('topCtaBtn');
    if (topCtaBtn) {
        topCtaBtn.addEventListener('click', (e) => {
            e.preventDefault();
            window.location.href = 'calculator.html';
        });
    }

    // Other CTA buttons - scroll to form
    const ctaButtons = document.querySelectorAll('#heroCtaBtn, #consultationBtn, #processCtaBtn');
    ctaButtons.forEach(btn => {
        if (btn) {
            btn.addEventListener('click', () => {
                const formSection = document.getElementById('request-form');
                if (formSection) {
                    const headerOffset = 120;
                    const elementPosition = formSection.getBoundingClientRect().top;
                    const offsetPosition = elementPosition + window.pageYOffset - headerOffset;

                    window.scrollTo({
                        top: offsetPosition,
                        behavior: 'smooth'
                    });
                }
            });
        }
    });
});

// Telegram Bot Configuration
const TELEGRAM_BOT_TOKEN = 'YOUR_BOT_TOKEN'; // Замените на токен вашего бота
const TELEGRAM_CHAT_ID = 'YOUR_CHAT_ID'; // Замените на ID чата или канала

// Функция отправки сообщения в Telegram
async function sendToTelegram(message) {
    if (!TELEGRAM_BOT_TOKEN || TELEGRAM_BOT_TOKEN === 'YOUR_BOT_TOKEN') {
        console.log('Telegram bot не настроен. Сообщение:', message);
        return false;
    }

    try {
        const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                chat_id: TELEGRAM_CHAT_ID,
                text: message,
                parse_mode: 'HTML'
            })
        });

        if (response.ok) {
            return true;
        } else {
            console.error('Ошибка отправки в Telegram:', await response.text());
            return false;
        }
    } catch (error) {
        console.error('Ошибка отправки в Telegram:', error);
        return false;
    }
}

// Форматирование сообщения для Telegram
function formatTelegramMessage(data, type = 'request') {
    if (type === 'request') {
        return `
<b>📋 Новая заявка с сайта</b>

<b>Имя:</b> ${data.name || 'Не указано'}
<b>Телефон:</b> ${data.phone || 'Не указано'}
<b>Email:</b> ${data.email || 'Не указано'}
<b>Услуга:</b> ${data.service || 'Не указано'}
<b>Площадь:</b> ${data.area || 'Не указано'}
<b>Сроки:</b> ${data.deadline || 'Не указано'}
<b>Сообщение:</b> ${data.message || 'Нет дополнительной информации'}

<i>Время заявки: ${new Date().toLocaleString('ru-RU')}</i>
        `.trim();
    } else if (type === 'callback') {
        return `
<b>📞 Запрос обратного звонка</b>

<b>Телефон:</b> ${data.phone || 'Не указано'}

<i>Время запроса: ${new Date().toLocaleString('ru-RU')}</i>
        `.trim();
    } else if (type === 'calculator') {
        return `
<b>🧮 Заявка из калькулятора</b>

<b>Имя:</b> ${data.name || 'Не указано'}
<b>Телефон:</b> ${data.phone || 'Не указано'}
<b>Email:</b> ${data.email || 'Не указано'}
<b>Тип объекта:</b> ${data.objectType || 'Не указано'}
<b>Площадь:</b> ${data.area || 'Не указано'} м²
<b>3D-моделирование:</b> ${data.has3D ? 'Да' : 'Нет'}
<b>Расчетная стоимость:</b> ${data.estimatedCost || 'Не указано'}

<i>Время заявки: ${new Date().toLocaleString('ru-RU')}</i>
        `.trim();
    }
    return '';
}

// Request Form submission
// Форма теперь отправляется через PHP (telegram.php), но оставляем JS для дополнительной отправки в Telegram как резерв
const requestForm = document.getElementById('requestForm');
if (requestForm) {
    requestForm.addEventListener('submit', async (e) => {
        // Не блокируем стандартную отправку формы, но можем отправить копию в Telegram через JS
        const formData = new FormData(requestForm);
        const data = Object.fromEntries(formData);
        
        // Дополнительная отправка в Telegram через JS (как резерв)
        // Основная отправка происходит через PHP
        try {
            const telegramMessage = formatTelegramMessage(data, 'request');
            await sendToTelegram(telegramMessage);
        } catch (error) {
            console.log('Дополнительная отправка в Telegram не удалась, но форма отправлена через PHP');
        }
    });
}

// Phone input mask
const phoneInputs = document.querySelectorAll('input[type="tel"]');
phoneInputs.forEach(input => {
    input.addEventListener('input', (e) => {
        let value = e.target.value.replace(/\D/g, '');
        if (value.length > 0) {
            if (value[0] !== '7' && value[0] !== '8') {
                value = '7' + value;
            }
            if (value[0] === '8') {
                value = '7' + value.slice(1);
            }
            
            let formattedValue = '+7';
            if (value.length > 1) {
                formattedValue += ' (' + value.slice(1, 4);
            }
            if (value.length >= 4) {
                formattedValue += ') ' + value.slice(4, 7);
            }
            if (value.length >= 7) {
                formattedValue += '-' + value.slice(7, 9);
            }
            if (value.length >= 9) {
                formattedValue += '-' + value.slice(9, 11);
            }
            
            e.target.value = formattedValue;
        }
    });
});

// Modal Callback
const callbackModal = document.getElementById('callbackModal');
const callbackForm = document.getElementById('callbackForm');
const closeModal = document.querySelector('.close');

if (closeModal) {
    closeModal.addEventListener('click', () => {
        if (callbackModal) {
        callbackModal.classList.remove('active');
        document.body.style.overflow = '';
        }
    });
}

// Close modal when clicking outside
if (callbackModal) {
    callbackModal.addEventListener('click', (e) => {
        if (e.target === callbackModal) {
            callbackModal.classList.remove('active');
            document.body.style.overflow = '';
        }
    });
}

// Callback form submission
// Форма теперь отправляется через PHP (telegram.php)
if (callbackForm) {
    callbackForm.addEventListener('submit', async (e) => {
        // Не блокируем стандартную отправку формы
        const formData = new FormData(callbackForm);
        const phone = formData.get('phone');
        
        // Дополнительная отправка в Telegram через JS (как резерв)
        try {
            const data = { phone };
            const telegramMessage = formatTelegramMessage(data, 'callback');
            await sendToTelegram(telegramMessage);
        } catch (error) {
            console.log('Дополнительная отправка в Telegram не удалась, но форма отправлена через PHP');
        }
        
        // Закрываем модальное окно после отправки
        setTimeout(() => {
        callbackForm.reset();
            if (callbackModal) {
        callbackModal.classList.remove('active');
        document.body.style.overflow = '';
            }
        }, 100);
    });
}

// Initialize Yandex Map
function initMap() {
    if (typeof ymaps === 'undefined') {
        // If Yandex Maps API is not loaded, try again after a short delay
        setTimeout(initMap, 100);
        return;
    }

    ymaps.ready(function () {
        const mapElement = document.getElementById('map');
        if (!mapElement) return;

        const coordinates = [59.934543, 30.301235]; // Санкт-Петербург, Митрофаньевское шоссе
        
        // Create map
        const myMap = new ymaps.Map('map', {
            center: coordinates,
            zoom: 16,
            controls: ['zoomControl', 'typeSelector', 'fullscreenControl', 'routeButtonControl']
        });

        // Add marker
        const myPlacemark = new ymaps.Placemark(coordinates, {
            balloonContentHeader: '<strong>ООО «АМНИС»</strong>',
            balloonContentBody: '196084, г. Санкт-Петербург, Митрофаньевское шоссе, дом 27, литер А, офис 10/6<br><br>' +
                '<strong>Телефон:</strong> <a href="tel:+79216253441">+7 (921) 625-34-41</a><br>' +
                '<strong>Email:</strong> <a href="mailto:amnis-info@yandex.ru">amnis-info@yandex.ru</a><br><br>' +
                '<strong>Схема проезда:</strong> от метро «Московские ворота» 15 минут пешком или 5 минут на автобусе №13',
            balloonContentFooter: '<a href="https://yandex.ru/maps/?pt=' + coordinates[1] + ',' + coordinates[0] + '&z=16&l=map" target="_blank">Открыть в Яндекс.Картах</a>',
            hintContent: 'ООО «АМНИС» - Геодезические услуги и лазерное сканирование'
        }, {
            preset: 'islands#blueDotIcon',
            iconColor: '#2c5aa0'
        });

        myMap.geoObjects.add(myPlacemark);
        
        // Open balloon automatically
        myPlacemark.balloon.open();
    });
}

// Initialize map when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initMap);
} else {
    initMap();
}

// Add scroll animation for elements
const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
};

const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.style.opacity = '1';
            entry.target.style.transform = 'translateY(0)';
        }
    });
}, observerOptions);

// Observe elements for animation
document.querySelectorAll('.service-category-card, .advantage-item, .guarantee-item, .portfolio-item, .process-step, .testimonial-item').forEach(item => {
    item.style.opacity = '0';
    item.style.transform = 'translateY(20px)';
    item.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
    observer.observe(item);
});

// Set minimum date for deadline input
document.addEventListener('DOMContentLoaded', () => {
    const deadlineInput = document.getElementById('deadline');
    if (deadlineInput) {
        const today = new Date();
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        const minDate = tomorrow.toISOString().split('T')[0];
        deadlineInput.setAttribute('min', minDate);
    }
});

// Handle window resize
window.addEventListener('resize', () => {
    if (window.innerWidth > 768) {
        if (navMenu) {
            navMenu.classList.remove('active');
        }
    }
});

// Form validation
function validateForm(form) {
    const requiredFields = form.querySelectorAll('[required]');
    let isValid = true;
    
    requiredFields.forEach(field => {
        if (!field.value.trim()) {
            isValid = false;
            field.style.borderColor = 'var(--error-color)';
            setTimeout(() => {
                field.style.borderColor = '';
            }, 2000);
        } else {
            field.style.borderColor = '';
        }
    });
    
    // Validate email
    const emailFields = form.querySelectorAll('input[type="email"]');
    emailFields.forEach(field => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (field.value && !emailRegex.test(field.value)) {
            isValid = false;
            field.style.borderColor = 'var(--error-color)';
            setTimeout(() => {
                field.style.borderColor = '';
            }, 2000);
        }
    });
    
    // Validate phone
    const phoneFields = form.querySelectorAll('input[type="tel"]');
    phoneFields.forEach(field => {
        const phoneRegex = /^\+7 \(\d{3}\) \d{3}-\d{2}-\d{2}$/;
        if (field.value && !phoneRegex.test(field.value)) {
            isValid = false;
            field.style.borderColor = 'var(--error-color)';
            setTimeout(() => {
                field.style.borderColor = '';
            }, 2000);
        }
    });
    
    return isValid;
}

// Add validation to forms
if (requestForm) {
    requestForm.addEventListener('submit', (e) => {
        if (!validateForm(requestForm)) {
            e.preventDefault();
            alert('Пожалуйста, заполните все обязательные поля корректно.');
        }
    });
}

if (callbackForm) {
    callbackForm.addEventListener('submit', (e) => {
        if (!validateForm(callbackForm)) {
            e.preventDefault();
            alert('Пожалуйста, введите корректный номер телефона.');
        }
    });
}

// Interactive Calculator
const calculatorData = {
    currentStep: 1,
    totalSteps: 4,
    serviceType: null,
    basePrice: 10,
    priceUnit: 'м²',
    objectType: null,
    objectMultiplier: 1.0,
    area: 500,
    addPrice: 0,
    serviceName: ''
};

// Цены и параметры для разных типов работ
const serviceConfigs = {
    facade: {
        name: 'Фасадная съемка',
        basePrice: 10,
        unit: 'м²',
        rangeMin: 50,
        rangeMax: 10000,
        rangeStep: 50,
        defaultArea: 500,
        quickAreas: [100, 500, 1000, 5000]
    },
    laser: {
        name: 'Лазерное сканирование',
        basePrice: 30,
        unit: 'м²',
        rangeMin: 50,
        rangeMax: 10000,
        rangeStep: 50,
        defaultArea: 500,
        quickAreas: [100, 500, 1000, 5000]
    },
    topography: {
        name: 'Топографическая съемка',
        basePrice: 45000,
        unit: 'га',
        rangeMin: 0.1,
        rangeMax: 100,
        rangeStep: 0.1,
        defaultArea: 1,
        quickAreas: [0.5, 1, 5, 10]
    },
    construction: {
        name: 'Геодезическое сопровождение',
        basePrice: 10000,
        unit: 'день',
        rangeMin: 1,
        rangeMax: 365,
        rangeStep: 1,
        defaultArea: 30,
        quickAreas: [7, 30, 90, 180]
    },
    survey: {
        name: 'Геодезические изыскания',
        basePrice: 45000,
        unit: 'га',
        rangeMin: 0.1,
        rangeMax: 100,
        rangeStep: 0.1,
        defaultArea: 1,
        quickAreas: [0.5, 1, 5, 10]
    },
    geology: {
        name: 'Геологические изыскания',
        basePrice: 60000,
        unit: 'объект',
        rangeMin: 1,
        rangeMax: 10,
        rangeStep: 1,
        defaultArea: 1,
        quickAreas: [1, 2, 5, 10]
    },
    cadastre: {
        name: 'Кадастровые работы',
        basePrice: 18000,
        unit: 'участок',
        rangeMin: 1,
        rangeMax: 20,
        rangeStep: 1,
        defaultArea: 1,
        quickAreas: [1, 2, 5, 10]
    },
    demolition: {
        name: 'Проектирование демонтажа',
        basePrice: 34000,
        unit: 'объект',
        rangeMin: 1,
        rangeMax: 10,
        rangeStep: 1,
        defaultArea: 1,
        quickAreas: [1, 2, 5, 10]
    }
};

// Initialize calculator - SIMPLE VERSION
function initCalculator() {
    console.log('=== INIT CALCULATOR ===');
    
    // Service buttons - SIMPLE DIRECT HANDLERS
    const serviceBtns = document.querySelectorAll('.service-type-btn');
    console.log(`Found ${serviceBtns.length} service buttons`);
    
    serviceBtns.forEach(btn => {
        btn.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            
            const serviceType = this.getAttribute('data-service');
            const config = serviceConfigs[serviceType];
            
            console.log('CLICK:', serviceType);
            
            if (!config) {
                alert('Ошибка: конфигурация не найдена');
        return;
    }

            // Update data
            calculatorData.serviceType = serviceType;
            calculatorData.basePrice = config.basePrice;
            calculatorData.priceUnit = config.unit;
            calculatorData.serviceName = config.name;
            calculatorData.area = config.defaultArea;
            
            // Update UI
            document.querySelectorAll('.service-type-btn').forEach(b => {
                b.classList.remove('selected');
            });
            this.classList.add('selected');
            
            console.log('Selected:', serviceType);
            console.log('Data:', calculatorData);
        });
    });
    
    // Next button
    const nextBtn = document.getElementById('calcNextBtn');
    if (nextBtn) {
        nextBtn.addEventListener('click', function(e) {
            e.preventDefault();
            console.log('NEXT clicked, step:', calculatorData.currentStep);
            
            if (validateCurrentStep()) {
                goToNextStep();
            } else {
                alert('Пожалуйста, выберите вариант');
            }
        });
    }
    
    // Prev button
    const prevBtn = document.getElementById('calcPrevBtn');
    if (prevBtn) {
        prevBtn.addEventListener('click', function(e) {
            e.preventDefault();
            goToPrevStep();
        });
    }

    // Area range input
    if (areaRange && areaValue) {
        areaRange.addEventListener('input', (e) => {
            const value = parseFloat(e.target.value);
            calculatorData.area = value;
            if (areaValue) {
                const unit = document.getElementById('areaUnit');
                if (calculatorData.priceUnit === 'га' || calculatorData.priceUnit === 'участок' || calculatorData.priceUnit === 'объект') {
                    areaValue.textContent = value.toLocaleString('ru-RU', { minimumFractionDigits: 1, maximumFractionDigits: 1 });
                } else {
                    areaValue.textContent = Math.round(value).toLocaleString('ru-RU');
                }
            }
        });
    }

    // Quick area buttons
    quickAreaBtns.forEach(btn => {
        btn.addEventListener('click', function(e) {
            e.preventDefault();
            const area = parseFloat(this.getAttribute('data-area'));
            calculatorData.area = area;
            if (areaRange) {
                areaRange.value = area;
            }
            if (areaValue) {
                const unit = document.getElementById('areaUnit');
                if (calculatorData.priceUnit === 'га' || calculatorData.priceUnit === 'участок' || calculatorData.priceUnit === 'объект') {
                    areaValue.textContent = area.toLocaleString('ru-RU', { minimumFractionDigits: 1, maximumFractionDigits: 1 });
                } else {
                    areaValue.textContent = Math.round(area).toLocaleString('ru-RU');
                }
            }
            quickAreaBtns.forEach(b => b.classList.remove('active'));
            this.classList.add('active');
        });
    });

    // Object type buttons
    const objectBtns = document.querySelectorAll('.object-type-btn');
    objectBtns.forEach(btn => {
        btn.addEventListener('click', function(e) {
            e.preventDefault();
            calculatorData.objectType = this.getAttribute('data-value');
            calculatorData.objectMultiplier = parseFloat(this.getAttribute('data-multiplier'));
            
            const step = this.closest('.calculator-step');
            step.querySelectorAll('.object-type-btn').forEach(b => b.classList.remove('selected'));
            this.classList.add('selected');
        });
    });
    
    // Option type buttons
    const optionBtns = document.querySelectorAll('.option-type-btn');
    optionBtns.forEach(btn => {
        btn.addEventListener('click', function(e) {
            e.preventDefault();
            calculatorData.addPrice = parseFloat(this.getAttribute('data-addprice'));
            
            const step = this.closest('.calculator-step');
            step.querySelectorAll('.option-type-btn').forEach(b => b.classList.remove('selected'));
            this.classList.add('selected');
        });
    });
    
    // Area range
    const areaRange = document.getElementById('areaRange');
    const areaValue = document.getElementById('areaValue');
    if (areaRange && areaValue) {
        areaRange.addEventListener('input', function(e) {
            calculatorData.area = parseFloat(e.target.value);
            areaValue.textContent = Math.round(calculatorData.area).toLocaleString('ru-RU');
        });
    }
    
    // Quick area buttons
    const quickBtns = document.querySelectorAll('.quick-btn');
    quickBtns.forEach(btn => {
        btn.addEventListener('click', function(e) {
            e.preventDefault();
            const area = parseFloat(this.getAttribute('data-area'));
            calculatorData.area = area;
            if (areaRange) areaRange.value = area;
            if (areaValue) areaValue.textContent = Math.round(area).toLocaleString('ru-RU');
            
            quickBtns.forEach(b => b.classList.remove('active'));
            this.classList.add('active');
        });
    });
    
    console.log('=== CALCULATOR INITIALIZED ===');

    // REMOVED: Duplicate event handlers - all handled by event delegation above
    // This prevents conflicts where multiple handlers try to manage the same buttons

    // Book calculation button
    if (bookBtn) {
        bookBtn.addEventListener('click', async () => {
            // Отправка данных калькулятора в Telegram
            const calcData = {
                objectType: calculatorData.objectType,
                area: calculatorData.area,
                has3D: calculatorData.has3D,
                estimatedCost: document.getElementById('estimatedCost')?.textContent || 'Не рассчитано'
            };
            
            const telegramMessage = formatTelegramMessage(calcData, 'calculator');
            await sendToTelegram(telegramMessage);
            
            // Scroll to form and pre-fill data
            const formSection = document.getElementById('request-form');
            if (formSection) {
                const headerOffset = 120;
                const elementPosition = formSection.getBoundingClientRect().top;
                const offsetPosition = elementPosition + window.pageYOffset - headerOffset;

                window.scrollTo({
                    top: offsetPosition,
                    behavior: 'smooth'
                });

                // Pre-fill form if exists
                setTimeout(() => {
                    const serviceSelect = document.getElementById('service');
                    const areaInput = document.getElementById('area');
                    if (serviceSelect) {
                        serviceSelect.value = 'facade-surveying';
                    }
                    if (areaInput) {
                        areaInput.value = calculatorData.area;
                    }
                }, 500);
            }
        });
    }
}

function updateParameterStep(config) {
    const areaRange = document.getElementById('areaRange');
    const areaValue = document.getElementById('areaValue');
    const areaUnit = document.getElementById('areaUnit');
    const parameterTitle = document.getElementById('parameterTitle');
    const rangeMin = document.getElementById('rangeMin');
    const rangeMax = document.getElementById('rangeMax');
    const quickButtons = document.getElementById('quickButtons');
    
    if (areaRange && config) {
        areaRange.min = config.rangeMin;
        areaRange.max = config.rangeMax;
        areaRange.step = config.rangeStep;
        areaRange.value = config.defaultArea;
    }
    
    if (areaValue) {
        if (config.unit === 'га' || config.unit === 'участок' || config.unit === 'объект') {
            areaValue.textContent = config.defaultArea.toLocaleString('ru-RU', { minimumFractionDigits: 1, maximumFractionDigits: 1 });
} else {
            areaValue.textContent = Math.round(config.defaultArea).toLocaleString('ru-RU');
        }
    }
    
    if (areaUnit) {
        areaUnit.textContent = config.unit;
    }
    
    if (parameterTitle) {
        const titles = {
            'м²': 'Площадь объекта (м²)',
            'га': 'Площадь участка (га)',
            'день': 'Количество дней',
            'участок': 'Количество участков',
            'объект': 'Количество объектов'
        };
        parameterTitle.textContent = titles[config.unit] || 'Параметр';
    }
    
    if (rangeMin && rangeMax) {
        rangeMin.textContent = `${config.rangeMin} ${config.unit}`;
        rangeMax.textContent = `${config.rangeMax} ${config.unit}`;
    }
    
    if (quickButtons && config.quickAreas) {
        quickButtons.innerHTML = '';
        config.quickAreas.forEach(area => {
            const btn = document.createElement('button');
            btn.className = 'quick-btn';
            btn.setAttribute('data-area', area);
            if (config.unit === 'га' || config.unit === 'участок' || config.unit === 'объект') {
                btn.textContent = area.toLocaleString('ru-RU', { minimumFractionDigits: 1, maximumFractionDigits: 1 });
            } else {
                btn.textContent = Math.round(area).toLocaleString('ru-RU');
            }
            quickButtons.appendChild(btn);
        });
        
        // Re-attach event listeners
        quickButtons.querySelectorAll('.quick-btn').forEach(btn => {
            btn.addEventListener('click', function(e) {
                e.preventDefault();
                const area = parseFloat(this.getAttribute('data-area'));
                calculatorData.area = area;
                if (areaRange) {
                    areaRange.value = area;
                }
                if (areaValue) {
                    if (config.unit === 'га' || config.unit === 'участок' || config.unit === 'объект') {
                        areaValue.textContent = area.toLocaleString('ru-RU', { minimumFractionDigits: 1, maximumFractionDigits: 1 });
                    } else {
                        areaValue.textContent = Math.round(area).toLocaleString('ru-RU');
                    }
                }
                quickButtons.querySelectorAll('.quick-btn').forEach(b => b.classList.remove('active'));
                this.classList.add('active');
            });
        });
    }
}

function validateCurrentStep() {
    const currentStepEl = document.querySelector(`.calculator-step[data-step="${calculatorData.currentStep}"]`);
    console.log('=== VALIDATION ===');
    console.log('Current step:', calculatorData.currentStep);
    console.log('Calculator data:', JSON.stringify(calculatorData, null, 2));
    
    if (calculatorData.currentStep === 1) {
        // Check if any service button is selected
        const selectedService = document.querySelector('.service-type-btn.selected');
        if (!calculatorData.serviceType && !selectedService) {
            alert('Пожалуйста, выберите тип работ');
            console.log('✗ Validation failed: no service type selected');
            return false;
        }
        
        // If button is selected but data is missing, get it from button
        if (!calculatorData.serviceType && selectedService) {
            const serviceType = selectedService.getAttribute('data-service');
            const config = serviceConfigs[serviceType];
            if (config) {
                calculatorData.serviceType = serviceType;
                calculatorData.basePrice = config.basePrice;
                calculatorData.priceUnit = config.unit;
                calculatorData.serviceName = config.name;
                calculatorData.area = config.defaultArea;
                console.log('✓ Restored data from selected button:', calculatorData);
            }
        }
        
        console.log('✓ Step 1 validated, serviceType:', calculatorData.serviceType);
        return true;
    } else if (calculatorData.currentStep === 2) {
        const selectedObject = document.querySelector('.object-type-btn.selected');
        if (!calculatorData.objectType && !selectedObject) {
            alert('Пожалуйста, выберите тип объекта');
            console.log('✗ Validation failed: no object type selected');
            return false;
        }
        
        if (!calculatorData.objectType && selectedObject) {
            calculatorData.objectType = selectedObject.getAttribute('data-value');
            calculatorData.objectMultiplier = parseFloat(selectedObject.getAttribute('data-multiplier'));
        }
        
        console.log('✓ Step 2 validated, objectType:', calculatorData.objectType);
        return true;
    } else if (calculatorData.currentStep === 4) {
        const selected = currentStepEl.querySelector('.option-type-btn.selected');
        if (!selected) {
            alert('Пожалуйста, выберите вариант');
            console.log('✗ Validation failed: no option selected');
            return false;
        }
        
        if (!calculatorData.addPrice && calculatorData.addPrice !== 0) {
            calculatorData.addPrice = parseFloat(selected.getAttribute('data-addprice'));
        }
        
        console.log('✓ Step 4 validated');
        return true;
    }
    
    console.log('✓ Validation passed');
    return true;
}

function goToNextStep() {
    console.log('goToNextStep called, current step:', calculatorData.currentStep, 'totalSteps:', calculatorData.totalSteps);
    if (calculatorData.currentStep < calculatorData.totalSteps) {
        calculatorData.currentStep++;
        console.log('Moving to step:', calculatorData.currentStep);
        updateCalculatorUI();
        
        // Update parameter step if moving to step 3
        if (calculatorData.currentStep === 3 && calculatorData.serviceType) {
            const config = serviceConfigs[calculatorData.serviceType];
            if (config) {
                updateParameterStep(config);
            }
        }
        
        if (calculatorData.currentStep === calculatorData.totalSteps) {
            calculateResult();
        }
    } else {
        console.log('Already at last step');
    }
}

function goToPrevStep() {
    if (calculatorData.currentStep > 1) {
        calculatorData.currentStep--;
        updateCalculatorUI();
    }
}

function updateCalculatorUI() {
    console.log('updateCalculatorUI called, current step:', calculatorData.currentStep);
    
    // Update steps visibility
    document.querySelectorAll('.calculator-step').forEach((step, index) => {
        const stepNum = index + 1;
        if (stepNum === calculatorData.currentStep) {
            step.classList.add('active');
            step.style.display = 'block';
            console.log('Showing step', stepNum);
        } else {
            step.classList.remove('active');
            step.style.display = 'none';
        }
    });

    // Update progress bar
    const progress = (calculatorData.currentStep / calculatorData.totalSteps) * 100;
    const progressFill = document.getElementById('progressFill');
    if (progressFill) {
        progressFill.style.width = progress + '%';
    }

    // Update progress steps
    document.querySelectorAll('.progress-step').forEach((step, index) => {
        const stepNum = index + 1;
        step.classList.remove('active', 'completed');
        if (stepNum < calculatorData.currentStep) {
            step.classList.add('completed');
        } else if (stepNum === calculatorData.currentStep) {
            step.classList.add('active');
        }
    });

    // Update navigation buttons
    const prevBtn = document.getElementById('calcPrevBtn');
    const nextBtn = document.getElementById('calcNextBtn');
    
    if (prevBtn) {
        prevBtn.style.display = calculatorData.currentStep > 1 ? 'block' : 'none';
    }
    
    if (nextBtn) {
        if (calculatorData.currentStep === calculatorData.totalSteps) {
            nextBtn.style.display = 'none';
        } else {
            nextBtn.style.display = 'block';
            nextBtn.textContent = calculatorData.currentStep === calculatorData.totalSteps - 1 ? 'Рассчитать' : 'Далее';
        }
    }
}

function calculateResult() {
    const basePrice = calculatorData.basePrice;
    const area = calculatorData.area;
    const multiplier = calculatorData.objectMultiplier;
    const addPriceMultiplier = calculatorData.addPrice;
    const unit = calculatorData.priceUnit;
    
    // Base calculation based on unit
    let baseCost;
    if (unit === 'м²' || unit === 'га') {
        baseCost = basePrice * area * multiplier;
    } else if (unit === 'день') {
        baseCost = basePrice * area * multiplier;
    } else {
        // для участков и объектов
        baseCost = basePrice * area * multiplier;
    }
    
    // Add additional options multiplier
    if (addPriceMultiplier > 0) {
        baseCost = baseCost * (1 + addPriceMultiplier);
    }
    
    // Calculate min and max (with ±20% variance)
    const minCost = Math.round(baseCost * 0.8);
    const maxCost = Math.round(baseCost * 1.2);
    
    // Calculate discount
    const discountPercent = 15;
    const discountAmount = Math.round(maxCost * (discountPercent / 100));
    const finalCost = maxCost - discountAmount;
    
    // Calculate lead time (based on service type and area)
    let leadTime = calculateLeadTime(calculatorData.serviceType, area, unit);
    
    // Update discount date (7 days from now)
    const discountDate = new Date();
    discountDate.setDate(discountDate.getDate() + 7);
    const discountDateStr = discountDate.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' });
    
    // Display results
    const resultServiceNameEl = document.getElementById('resultServiceName');
    const basePriceEl = document.getElementById('basePrice');
    const estimatedCostEl = document.getElementById('estimatedCost');
    const discountAmountEl = document.getElementById('discountAmount');
    const discountDateEl = document.getElementById('discountDate');
    const leadTimeEl = document.getElementById('leadTime');
    const resultEl = document.getElementById('calculatorResult');
    
    if (resultServiceNameEl) {
        resultServiceNameEl.textContent = calculatorData.serviceName || '-';
    }
    if (basePriceEl) {
        basePriceEl.textContent = `${basePrice.toLocaleString('ru-RU')} руб/${unit}`;
    }
    if (estimatedCostEl) {
        estimatedCostEl.textContent = `от ${minCost.toLocaleString('ru-RU')} до ${maxCost.toLocaleString('ru-RU')} руб.`;
    }
    if (discountAmountEl) {
        discountAmountEl.textContent = `${discountAmount.toLocaleString('ru-RU')} руб.`;
    }
    if (discountDateEl) {
        discountDateEl.textContent = discountDateStr;
    }
    if (leadTimeEl) {
        leadTimeEl.textContent = `${leadTime} рабочих ${leadTime === 1 ? 'день' : leadTime < 5 ? 'дня' : 'дней'}`;
    }
    if (resultEl) {
        resultEl.style.display = 'block';
        resultEl.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
}

function calculateLeadTime(serviceType, area, unit) {
    const configs = {
        facade: (a) => a > 5000 ? 10 : a > 2000 ? 7 : a > 500 ? 3 : 1,
        laser: (a) => a > 5000 ? 14 : a > 2000 ? 10 : a > 500 ? 5 : 2,
        topography: (a) => a > 50 ? 15 : a > 10 ? 10 : a > 1 ? 5 : 2,
        construction: (a) => Math.ceil(a / 30), // дни сопровождения
        survey: (a) => a > 50 ? 20 : a > 10 ? 15 : a > 1 ? 7 : 3,
        geology: (a) => a > 5 ? 30 : a > 2 ? 20 : 10,
        cadastre: (a) => a > 10 ? 20 : a > 5 ? 15 : a > 1 ? 10 : 5,
        demolition: (a) => a > 5 ? 25 : a > 2 ? 15 : 10
    };
    
    const calc = configs[serviceType] || (() => 5);
    return Math.max(1, calc(area));
}

// Initialize calculator and map on page load
// NOTE: This is only for index.html - calculator.html has its own initialization
if (document.getElementById('calculatorSteps') || window.location.pathname.includes('calculator.html')) {
    // Only initialize if calculator is on this page
    document.addEventListener('DOMContentLoaded', () => {
        initCalculator();
        updateCalculatorUI();
    });
}

// Initialize map only on index.html
if (!window.location.pathname.includes('calculator.html')) {
    document.addEventListener('DOMContentLoaded', () => {
        setTimeout(() => {
            initProjectsMap();
        }, 500);
    });
}

// Projects Map with Filters
let projectsMap = null;
let projectsMarkers = [];
let allProjects = [];

// Загрузка проектов из JSON файла
async function loadProjectsData() {
    try {
        const response = await fetch('assets/data/projects.json');
        if (response.ok) {
            const data = await response.json();
            return data;
        } else {
            console.warn('Не удалось загрузить projects.json, используем встроенные данные');
            return getDefaultProjects();
        }
    } catch (error) {
        console.warn('Ошибка загрузки projects.json:', error);
        return getDefaultProjects();
    }
}

// Встроенные проекты по умолчанию (если JSON не загрузился)
function getDefaultProjects() {
    return [
    {
        id: 1,
        title: "Объект Газпромнефть-Снабжение",
        location: "Санкт-Петербург",
        coordinates: [59.934543, 30.301235],
        year: 2023,
        type: "laser",
        region: "spb",
        area: "12 500 м²",
        date: "Июнь 2023",
        challenge: "Съемка действующего нефтеперерабатывающего завода",
        solution: "Комбинирование наземного и воздушного сканирования",
        results: [
            "Соблюдены промышленные стандарты безопасности",
            "Выявлены скрытые деформации конструкций",
            "Экономия 2.3 млн руб. на реконструкции"
        ],
        clientLogo: "https://via.placeholder.com/80x40/2c5aa0/ffffff?text=Газпром",
        photos: [
            "https://images.unsplash.com/photo-1581092160562-40aa08e78837?w=300&h=200&fit=crop",
            "https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=300&h=200&fit=crop"
        ],
        caseLink: "#"
    },
    {
        id: 2,
        title: "ЖК «Невский»",
        location: "Санкт-Петербург",
        coordinates: [59.944543, 30.311235],
        year: 2023,
        type: "construction",
        region: "spb",
        area: "28 000 м²",
        date: "Январь 2023",
        challenge: "Геодезическое сопровождение строительства",
        solution: "Полный контроль на всех этапах",
        results: [
            "Разбивка осей с точностью до ±3 мм",
            "Контроль вертикальности стен",
            "Исполнительная съемка"
        ],
        clientLogo: "https://via.placeholder.com/80x40/2c5aa0/ffffff?text=ПИК",
        photos: [],
        caseLink: "#"
    },
    {
        id: 3,
        title: "Историческое здание «Петровский корпус»",
        location: "Санкт-Петербург",
        coordinates: [59.924543, 30.291235],
        year: 2022,
        type: "facade",
        region: "spb",
        area: "4 500 м²",
        date: "Март 2022",
        challenge: "Обмеры памятника архитектуры",
        solution: "Лазерное сканирование для реставрации",
        results: [
            "Создана точная 3D-модель здания",
            "Подготовлена исполнительная документация",
            "Выявлены деформации конструкций"
        ],
        clientLogo: "",
        photos: [],
        caseLink: "#"
    },
    {
        id: 4,
        title: "Промышленный парк",
        location: "Москва",
        coordinates: [55.755817, 37.617644],
        year: 2023,
        type: "laser",
        region: "moscow",
        area: "45 га",
        date: "Май 2023",
        challenge: "Топографическая съемка территории",
        solution: "Лазерное SLAM сканирование и наземное сканирование",
        results: [
            "Создан топографический план М 1:500",
            "Выполнена подеревная съемка",
            "Привязаны инженерные сети"
        ],
        clientLogo: "",
        photos: [],
        caseLink: "#"
    },
    {
        id: 5,
        title: "Офисное здание",
        location: "Ленинградская область",
        coordinates: [59.954543, 30.321235],
        year: 2022,
        type: "facade",
        region: "lo",
        area: "8 200 м²",
        date: "Август 2022",
        challenge: "Фасадная съемка для вентфасада",
        solution: "Тахеометрическая съемка фасадов",
        results: [
            "Точная съемка фасадов",
            "Проектирование подсистемы",
            "Соблюдение сроков"
        ],
        clientLogo: "",
        photos: [],
        caseLink: "#"
    }
];

// Генерируем больше проектов для демонстрации (если нужно)
function generateMoreProjects(existingProjects) {
    const startId = existingProjects.length + 1;
    const regions = [
        { name: "spb", coords: [59.934543, 30.301235], cities: ["Санкт-Петербург"] },
        { name: "moscow", coords: [55.755817, 37.617644], cities: ["Москва"] },
        { name: "lo", coords: [59.944543, 30.311235], cities: ["Выборг", "Гатчина", "Колпино"] },
        { name: "mo", coords: [55.755817, 37.617644], cities: ["Химки", "Мытищи", "Красногорск"] },
        { name: "other", coords: [56.326887, 44.007481], cities: ["Нижний Новгород", "Казань", "Екатеринбург"] }
    ];
    
    const types = ["facade", "laser", "construction"];
    const years = [2021, 2022, 2023, 2024];
    
    for (let i = startId; i <= startId + 44; i++) {
        const region = regions[Math.floor(Math.random() * regions.length)];
        const type = types[Math.floor(Math.random() * types.length)];
        const year = years[Math.floor(Math.random() * years.length)];
        const city = region.cities[Math.floor(Math.random() * region.cities.length)];
        
        const offsetLat = (Math.random() - 0.5) * 0.5;
        const offsetLon = (Math.random() - 0.5) * 0.5;
        
        existingProjects.push({
            id: i,
            title: `Проект ${i}`,
            location: city,
            coordinates: [region.coords[0] + offsetLat, region.coords[1] + offsetLon],
            year: year,
            type: type,
            region: region.name,
            area: `${Math.floor(Math.random() * 10000 + 500)} м²`,
            date: `${["Январь", "Февраль", "Март", "Апрель", "Май", "Июнь"][Math.floor(Math.random() * 6)]} ${year}`,
            challenge: "Стандартная задача",
            solution: "Профессиональное выполнение",
            results: ["Выполнено в срок", "Высокое качество", "Соответствие ГОСТ"],
            clientLogo: "",
            photos: [],
            caseLink: "#"
        });
    }
}

async function initProjectsMap() {
    // Проверяем наличие элемента карты
    const mapElement = document.getElementById('projectsMap');
    if (!mapElement) {
        return;
    }

    // Проверяем загрузку Yandex Maps API
    if (typeof ymaps === 'undefined') {
        setTimeout(initProjectsMap, 100);
        return;
    }

    try {
        // Загружаем проекты из JSON файла
        const loadedProjects = await loadProjectsData();
        
        // Если проектов мало, генерируем дополнительные для демонстрации
        if (loadedProjects.length < 20) {
            generateMoreProjects(loadedProjects);
            allProjects = [...loadedProjects];
        } else {
            allProjects = [...loadedProjects];
        }

        ymaps.ready(function() {
            try {
                const mapElement = document.getElementById('projectsMap');
                if (!mapElement) {
                    return;
                }

                projectsMap = new ymaps.Map('projectsMap', {
                    center: [55.7558, 37.6176],
                    zoom: 3,
                    controls: ['zoomControl', 'typeSelector', 'fullscreenControl']
                });

                // ObjectManager для кластеризации
                const objectManager = new ymaps.ObjectManager({
                    clusterize: true,
                    gridSize: 64,
                    clusterIconLayout: 'default#pieChart',
                    clusterIconPieChartRadius: 25,
                    clusterIconPieChartCoreRadius: 20,
                    clusterIconPieChartStrokeWidth: 3
                });

                projectsMap.geoObjects.add(objectManager);

                // Добавляем проекты на карту
                function addProjectsToMap(projects) {
                    if (!projects || projects.length === 0) {
                        console.warn('Нет проектов для отображения');
                        return;
                    }
                    
                    const features = projects.map(project => ({
                        type: 'Feature',
                        id: project.id,
                        geometry: {
                            type: 'Point',
                            coordinates: project.coordinates || [55.7558, 37.6176]
                        },
                        properties: {
                            balloonContent: generatePopupContent(project),
                            clusterCaption: project.title || 'Проект',
                            hintContent: project.title || 'Проект'
                        }
                    }));

                    objectManager.removeAll();
                    objectManager.add(features);
                }

                // Инициализация
                addProjectsToMap(allProjects);
                updateProjectsCount(allProjects.length);

                // Обработчики фильтров
                const filterYear = document.getElementById('filterYear');
                const filterType = document.getElementById('filterType');
                const filterRegion = document.getElementById('filterRegion');
                const resetBtn = document.getElementById('resetFilters');

                function applyFilters() {
                    let filtered = [...allProjects];

                    if (filterYear && filterYear.value !== 'all') {
                        filtered = filtered.filter(p => p.year === parseInt(filterYear.value));
                    }

                    if (filterType && filterType.value !== 'all') {
                        filtered = filtered.filter(p => p.type === filterType.value);
                    }

                    if (filterRegion && filterRegion.value !== 'all') {
                        filtered = filtered.filter(p => p.region === filterRegion.value);
                    }

                    addProjectsToMap(filtered);
                    updateProjectsCount(filtered.length);
                }

                if (filterYear) filterYear.addEventListener('change', applyFilters);
                if (filterType) filterType.addEventListener('change', applyFilters);
                if (filterRegion) filterRegion.addEventListener('change', applyFilters);

                if (resetBtn) {
                    resetBtn.addEventListener('click', () => {
                        if (filterYear) filterYear.value = 'all';
                        if (filterType) filterType.value = 'all';
                        if (filterRegion) filterRegion.value = 'all';
                        addProjectsToMap(allProjects);
                        updateProjectsCount(allProjects.length);
                    });
                }
            } catch (error) {
                console.error('Ошибка инициализации карты проектов:', error);
            }
        });
    } catch (error) {
        console.error('Ошибка загрузки данных проектов:', error);
    }
}

function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function generatePopupContent(project) {
    const resultsList = (project.results || []).map(r => '<li>' + escapeHtml(r) + '</li>').join('');
    
    return '<div class="map-popup-content">' +
        '<div class="map-popup-header">' +
        '<h3>' + escapeHtml(project.title || '') + '</h3>' +
        '<div class="popup-location">' + escapeHtml(project.location || '') + '</div>' +
        '</div>' +
        '<div class="map-popup-body">' +
        '<div class="map-popup-info">' +
        '<div class="map-popup-info-item">' +
        '<span class="map-popup-info-label">Дата:</span>' +
        '<span class="map-popup-info-value">' + escapeHtml(project.date || '') + '</span>' +
        '</div>' +
        '<div class="map-popup-info-item">' +
        '<span class="map-popup-info-label">Площадь:</span>' +
        '<span class="map-popup-info-value">' + escapeHtml(project.area || '') + '</span>' +
        '</div>' +
        '</div>' +
        '<div class="map-popup-challenge">' +
        '<strong>Задача:</strong> ' +
        escapeHtml(project.challenge || '') +
        '</div>' +
        '<div class="map-popup-solution">' +
        '<strong>Решение:</strong> ' +
        escapeHtml(project.solution || '') +
        '</div>' +
        '<div class="map-popup-results">' +
        '<strong>Результаты:</strong>' +
        '<ul>' + resultsList + '</ul>' +
        '</div>' +
        '</div>' +
                '<div class="map-popup-footer">' +
                '<a href="case-study.html?id=' + (project.id || '') + '" class="map-popup-link">Подробнее о проекте</a>' +
                '</div>' +
                '</div>';
}

function updateProjectsCount(count) {
    const countEl = document.getElementById('visibleProjects');
    if (countEl) {
        countEl.textContent = count;
    }
}

// City Selector Functionality
document.addEventListener('DOMContentLoaded', () => {
    const cityModal = document.getElementById('citySelectorModal');
    const cityConfirmBtn = document.getElementById('cityConfirmBtn');
    const cityChangeBtn = document.getElementById('cityChangeBtn');
    const citySkipBtn = document.getElementById('citySkipBtn');
    const citySelectorBtn = document.getElementById('citySelectorBtn');
    const citySelectorList = document.getElementById('citySelectorList');
    const citySearchInput = document.getElementById('citySearchInput');
    const citiesGrid = document.getElementById('citiesGrid');
    const selectedCitySpan = document.getElementById('selectedCity');

    // Get saved city from localStorage with error handling
    let savedCity = null;
    let cityModalShown = null;
    try {
        savedCity = localStorage.getItem('selectedCity');
        cityModalShown = localStorage.getItem('cityModalShown');
    } catch (e) {
        // localStorage may be unavailable
    }

    // Show city selector on first visit
    if (!savedCity && !cityModalShown) {
        setTimeout(() => {
            if (cityModal) {
                cityModal.classList.add('active');
                document.body.style.overflow = 'hidden';
            }
        }, 1000);
    } else if (savedCity && selectedCitySpan) {
        selectedCitySpan.textContent = savedCity;
    }

    // Confirm button - set default city (Saint-Petersburg)
    if (cityConfirmBtn) {
        cityConfirmBtn.addEventListener('click', () => {
            const defaultCity = 'Санкт-Петербург';
            try {
                localStorage.setItem('selectedCity', defaultCity);
                localStorage.setItem('cityModalShown', 'true');
            } catch (e) {
                // localStorage may be unavailable
            }
            if (selectedCitySpan) {
                selectedCitySpan.textContent = defaultCity;
            }
            closeCityModal();
        });
    }

    // Change city button - show city list
    if (cityChangeBtn) {
        cityChangeBtn.addEventListener('click', () => {
            if (citySelectorList) {
                citySelectorList.style.display = 'block';
            }
        });
    }

    // Skip button - close modal without selecting
    if (citySkipBtn) {
        citySkipBtn.addEventListener('click', () => {
            try {
                localStorage.setItem('cityModalShown', 'true');
            } catch (e) {
                // localStorage may be unavailable
            }
            closeCityModal();
        });
    }

    // City selector button in header - reopen modal
    if (citySelectorBtn) {
        citySelectorBtn.addEventListener('click', () => {
            if (cityModal) {
                cityModal.classList.add('active');
                document.body.style.overflow = 'hidden';
                if (citySelectorList) {
                    citySelectorList.style.display = 'block';
                }
            }
        });
    }

    // City search functionality
    if (citySearchInput) {
        citySearchInput.addEventListener('input', (e) => {
            const searchTerm = e.target.value.toLowerCase();
            const cityOptions = citiesGrid.querySelectorAll('.city-option');
            
            cityOptions.forEach(option => {
                const cityName = option.getAttribute('data-city').toLowerCase();
                if (cityName.includes(searchTerm)) {
                    option.style.display = 'block';
} else {
                    option.style.display = 'none';
                }
            });
        });
    }

    // City option selection
    if (citiesGrid) {
        citiesGrid.addEventListener('click', (e) => {
            const cityOption = e.target.closest('.city-option');
            if (cityOption) {
                const selectedCity = cityOption.getAttribute('data-city');
                try {
                    localStorage.setItem('selectedCity', selectedCity);
                    localStorage.setItem('cityModalShown', 'true');
                } catch (e) {
                    // localStorage may be unavailable
                }
                if (selectedCitySpan) {
                    selectedCitySpan.textContent = selectedCity;
                }
                closeCityModal();
            }
        });
    }

    // Close modal when clicking outside
    if (cityModal) {
        cityModal.addEventListener('click', (e) => {
            if (e.target === cityModal) {
                closeCityModal();
            }
        });
    }

    function closeCityModal() {
        if (cityModal) {
            cityModal.classList.remove('active');
            document.body.style.overflow = '';
            if (citySelectorList) {
                citySelectorList.style.display = 'none';
            }
            if (citySearchInput) {
                citySearchInput.value = '';
            }
            // Reset city options visibility
            if (citiesGrid) {
                const cityOptions = citiesGrid.querySelectorAll('.city-option');
                cityOptions.forEach(option => {
                    option.style.display = 'block';
                });
            }
        }
    }
});
// FAQ Accordion functionality
document.addEventListener('DOMContentLoaded', () => {
    const faqItems = document.querySelectorAll('.faq-item');
    
    faqItems.forEach(item => {
        const question = item.querySelector('.faq-question');
        
        if (question) {
            question.addEventListener('click', () => {
                const isActive = item.classList.contains('active');
                
                // Закрываем все FAQ
                faqItems.forEach(faq => {
                    faq.classList.remove('active');
                });
                
                // Открываем текущий, если он был закрыт
                if (!isActive) {
                    item.classList.add('active');
                }
            });
        }
    });
    
    // Поиск по FAQ
    const faqSearchInput = document.getElementById('faqSearchInput');
    if (faqSearchInput) {
        faqSearchInput.addEventListener('input', (e) => {
            const searchTerm = e.target.value.toLowerCase();
            const faqQuestions = document.querySelectorAll('.faq-question h3');
            const faqAnswers = document.querySelectorAll('.faq-answer p');
            
            faqItems.forEach((item, index) => {
                const questionText = faqQuestions[index]?.textContent.toLowerCase() || '';
                const answerText = faqAnswers[index]?.textContent.toLowerCase() || '';
                
                if (questionText.includes(searchTerm) || answerText.includes(searchTerm)) {
                    item.style.display = 'block';
                } else {
                    item.style.display = searchTerm === '' ? 'block' : 'none';
                }
            });
        });
    }
});

// Video Gallery functionality
document.addEventListener('DOMContentLoaded', () => {
    const videoItems = document.querySelectorAll('.video-item');
    const videoModal = document.getElementById('videoModal');
    const videoPlayer = document.getElementById('videoPlayer');
    const videoModalClose = document.querySelector('.video-modal-close');
    
    // Video data (можно вынести в JSON)
    const videos = [
        {
            title: 'О компании ООО «АМНИС»',
            url: 'https://www.youtube.com/embed/dQw4w9WgXcQ', // Замените на реальное видео
            type: 'youtube'
        },
        {
            title: 'Лазерное сканирование в действии',
            url: 'https://www.youtube.com/embed/dQw4w9WgXcQ', // Замените на реальное видео
            type: 'youtube'
        },
        {
            title: 'Отзыв клиента',
            url: 'https://www.youtube.com/embed/dQw4w9WgXcQ', // Замените на реальное видео
            type: 'youtube'
        }
    ];
    
    videoItems.forEach((item, index) => {
        item.addEventListener('click', () => {
            if (videos[index] && videoModal && videoPlayer) {
                // Clear previous content safely
                videoPlayer.innerHTML = '';
                
                if (videos[index].type === 'youtube') {
                    const iframe = document.createElement('iframe');
                    iframe.src = videos[index].url + '?autoplay=1';
                    iframe.frameBorder = '0';
                    iframe.setAttribute('allow', 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture');
                    iframe.setAttribute('allowfullscreen', '');
                    videoPlayer.appendChild(iframe);
                } else {
                    const video = document.createElement('video');
                    video.src = videos[index].url;
                    video.controls = true;
                    video.autoplay = true;
                    videoPlayer.appendChild(video);
                }
                videoModal.classList.add('active');
                document.body.style.overflow = 'hidden';
            }
        });
    });
    
    // Close modal
    if (videoModalClose) {
        videoModalClose.addEventListener('click', () => {
            closeVideoModal();
        });
    }
    
    // Close modal when clicking outside
    if (videoModal) {
        videoModal.addEventListener('click', (e) => {
            if (e.target === videoModal) {
                closeVideoModal();
            }
        });
    }
    
    // Close modal on Escape key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && videoModal && videoModal.classList.contains('active')) {
            closeVideoModal();
        }
    });
    
    function closeVideoModal() {
        if (videoModal && videoPlayer) {
            videoModal.classList.remove('active');
            videoPlayer.innerHTML = '';
            document.body.style.overflow = '';
        }
    }
});
