// НОВЫЙ ПРОСТОЙ КАЛЬКУЛЯТОР - ДЕЛЕГИРОВАНИЕ СОБЫТИЙ

(function() {
    'use strict';
    
    // Данные калькулятора
    const calc = {
        step: 1,
        totalSteps: 4,
        service: null,
        object: null,
        area: 500,
        option: 0,
        // Для топографической съемки и геодезических изысканий
        location: null,      // 'spb' или 'lo'
        approval: null,     // 'yes' или 'no' (согласование КГА или ИСОГД)
        territory: null,    // 'industrial-zone', 'built-up', 'unbuilt'
        // Для геологических изысканий
        wellsCount: 3,      // количество скважин
        drillingDepth: 8,   // глубина бурения (м)
        // Для кадастровых работ
        cadastreType: null, // 'boundary' (межевой) или 'technical' (технический)
        cadastreCount: 1,   // количество участков/объектов
        // Для проекта демонтажа
        demolitionWithEstimate: false, // опция "Проект + смета"
        // Для технического плана
        technicalWithEstimate: false,   // опция "Со сметой"
        // Для геодезических изысканий (выбор подтипа)
        surveyType: null    // 'topography', 'geology', 'ecology'
    };
    
    // Конфигурация услуг (цены на 15% ниже среднерыночных)
    const services = {
        facade: { name: 'Фасадная съемка', price: 10, unit: 'м²', defaultArea: 500 },
        laser: { name: 'Лазерное сканирование местности', price: 20000, unit: 'га', defaultArea: 1, minArea: 1, maxArea: 100 },
        topography: { name: 'Топографическая съемка', price: 45000, unit: 'га', defaultArea: 1 },
        survey: { name: 'Геодезические изыскания', price: 45000, unit: 'га', defaultArea: 1, hasSurveyType: true },
        geology: { name: 'Геологические изыскания', price: 60000, unit: 'объект', defaultArea: 1 },
        ecology: { name: 'Экологические изыскания', price: 250000, unit: 'га', defaultArea: 1, minArea: 1, maxArea: 50 },
        cadastre: { name: 'Кадастровые работы', price: 18000, unit: 'участок', defaultArea: 1 },
        demolition: { 
            name: 'Проект демонтажа', 
            basePrice: 60000, 
            pricePerSqm: 100, 
            areaThreshold: 100,
            unit: 'м²', 
            defaultArea: 100,
            minArea: 100,
            maxArea: 10000
        }
    };
    
    const objects = {
        residential: { name: 'Жилой дом', multiplier: 1.0 },
        industrial: { name: 'Промышленное здание', multiplier: 1.8 },
        monument: { name: 'Памятник архитектуры', multiplier: 2.5 },
        'floor-plan': { name: 'Поэтажный план', multiplier: 1.2 }
    };
    
    // Инициализация при загрузке
    document.addEventListener('DOMContentLoaded', function() {
        const wrapper = document.querySelector('.calculator-wrapper');
        if (!wrapper) return;
        
        console.log('Calculator initialized');
        
        // Проверка URL параметра для загрузки сохраненного расчета
        const urlParams = new URLSearchParams(window.location.search);
        const calcId = urlParams.get('calc');
        if (calcId) {
            loadCalculationFromId(calcId);
        }
        
        // Делегирование событий на контейнере
        wrapper.addEventListener('click', function(e) {
            const btn = e.target.closest('button');
            if (!btn) return;
            
            // Кнопка типа услуги
            if (btn.classList.contains('service-type-btn')) {
                e.preventDefault();
                const serviceType = btn.getAttribute('data-service');
                const service = services[serviceType];
                
                if (!service) return;
                
                // Убираем выделение со всех
                wrapper.querySelectorAll('.service-type-btn').forEach(b => {
                    b.classList.remove('selected');
                });
                
                // Выделяем текущую
                btn.classList.add('selected');
                
                // Сохраняем данные
                calc.service = serviceType;
                calc.area = service.defaultArea;
                
                // Настраиваем количество шагов в зависимости от типа услуги
                if (serviceType === 'facade' || serviceType === 'laser') {
                    calc.totalSteps = 3; // 1-тип работ, 2-площадь, 3-опции (без выбора типа объекта)
                    calc.object = null;
                } else if (serviceType === 'topography') {
                    calc.totalSteps = 4; // 1-тип работ, 2-локация, 3-территория, 4-площадь
                    calc.location = null;
                    calc.approval = null;
                    calc.territory = null;
                } else if (serviceType === 'survey') {
                    calc.totalSteps = 2; // Начальное: 1-тип работ, 2-выбор типа изысканий (увеличивается после выбора)
                    calc.surveyType = null;
                    calc.location = null;
                    calc.approval = null;
                    calc.territory = null;
                    calc.wellsCount = 3;
                    calc.drillingDepth = 8;
                } else if (serviceType === 'geology') {
                    calc.totalSteps = 3; // 1-тип работ, 2-параметры бурения, 3-опции
                    calc.wellsCount = 3;
                    calc.drillingDepth = 8;
                } else if (serviceType === 'cadastre') {
                    calc.totalSteps = 3; // 1-тип работ, 2-тип кадастровых работ, 3-количество или опции
                    calc.cadastreType = null;
                    calc.cadastreCount = 1;
                    calc.technicalWithEstimate = false;
                } else if (serviceType === 'demolition') {
                    calc.totalSteps = 3; // 1-тип работ, 2-площадь, 3-опции
                    calc.object = null;
                    calc.demolitionWithEstimate = false;
                } else {
                    calc.totalSteps = 4; // Стандартная структура
                    calc.location = null;
                    calc.approval = null;
                    calc.territory = null;
                }
                
                // Обновляем динамический прогресс-бар
                // Обновляем прогресс-бар для нового количества шагов
                updateProgressSteps(1, calc.totalSteps);
                
                console.log('Service selected:', serviceType, 'Total steps:', calc.totalSteps);
                return false;
            }
            
            // Кнопка типа объекта (для обычных услуг)
            if (btn.classList.contains('object-type-btn')) {
                e.preventDefault();
                const objectType = btn.getAttribute('data-value');
                
                // Убираем выделение со всех в этом шаге
                const step = btn.closest('.calculator-step');
                step.querySelectorAll('.object-type-btn').forEach(b => {
                    b.classList.remove('selected');
                });
                
                // Выделяем текущую
                btn.classList.add('selected');
                
                // Сохраняем данные
                calc.object = objectType;
                
                console.log('Object selected:', objectType);
                return false;
            }
            
            // Кнопка локации (для топографической съемки и геодезических изысканий)
            if (btn.classList.contains('location-type-btn')) {
                e.preventDefault();
                const locationType = btn.getAttribute('data-value');
                
                // Убираем выделение со всех в этом шаге
                const step = btn.closest('.calculator-step');
                step.querySelectorAll('.location-type-btn').forEach(b => {
                    b.classList.remove('selected');
                });
                
                // Выделяем текущую
                btn.classList.add('selected');
                
                // Сохраняем данные
                calc.location = locationType;
                
                // Показываем опции согласования
                const approvalOptions = document.getElementById('locationApprovalOptions');
                const approvalTitle = document.getElementById('approvalTitle');
                
                if (approvalOptions && approvalTitle) {
                    // Для топографии - КГА, для геодезических изысканий - ИСОГД
                    if (calc.service === 'survey') {
                        // Геодезические изыскания - всегда ИСОГД
                        approvalTitle.textContent = 'Сдать результаты в ИСОГД?';
                    } else {
                        // Топография - КГА в СПб, ИСОГД в ЛО
                        if (locationType === 'spb') {
                            approvalTitle.textContent = 'Согласовать в КГА?';
                        } else if (locationType === 'lo') {
                            approvalTitle.textContent = 'Сдать результаты в ИСОГД?';
                        }
                    }
                    approvalOptions.style.display = 'block';
                    
                    // Сбрасываем выбор согласования при смене локации
                    calc.approval = null;
                    step.querySelectorAll('.approval-type-btn').forEach(b => {
                        b.classList.remove('selected');
                    });
                }
                
                console.log('Location selected:', locationType);
                return false;
            }
            
            // Кнопка согласования (КГА или ИСОГД)
            if (btn.classList.contains('approval-type-btn')) {
                e.preventDefault();
                const approvalType = btn.getAttribute('data-value');
                
                // Убираем выделение со всех в этом шаге
                const step = btn.closest('.calculator-step');
                step.querySelectorAll('.approval-type-btn').forEach(b => {
                    b.classList.remove('selected');
                });
                
                // Выделяем текущую
                btn.classList.add('selected');
                
                // Сохраняем данные
                calc.approval = approvalType;
                
                console.log('Approval selected:', approvalType);
                return false;
            }
            
            // Кнопка типа территории (для топографической съемки и геодезических изысканий)
            if (btn.classList.contains('territory-type-btn')) {
                e.preventDefault();
                const territoryType = btn.getAttribute('data-value');
                
                // Убираем выделение со всех в этом шаге
                const step = btn.closest('.calculator-step');
                step.querySelectorAll('.territory-type-btn').forEach(b => {
                    b.classList.remove('selected');
                });
                
                // Выделяем текущую
                btn.classList.add('selected');
                
                // Сохраняем данные
                calc.territory = territoryType;
                
                console.log('Territory selected:', territoryType);
                return false;
            }
            
            // Кнопка типа изысканий (для геодезических изысканий)
            if (btn.classList.contains('survey-type-btn')) {
                e.preventDefault();
                const surveyType = btn.getAttribute('data-survey-type');
                
                // Убираем выделение со всех в этом шаге
                const step = btn.closest('.calculator-step');
                step.querySelectorAll('.survey-type-btn').forEach(b => {
                    b.classList.remove('selected');
                });
                
                // Выделяем текущую
                btn.classList.add('selected');
                
                // Сохраняем данные
                calc.surveyType = surveyType;
                
                // Настраиваем количество шагов в зависимости от типа изысканий
                if (surveyType === 'topography') {
                    calc.totalSteps = 5; // 1-услуга, 2-тип, 3-локация, 4-территория, 5-площадь
                    calc.area = 1;
                } else if (surveyType === 'geology') {
                    calc.totalSteps = 3; // 1-услуга, 2-тип, 3-бурение
                } else if (surveyType === 'ecology') {
                    calc.totalSteps = 3; // 1-услуга, 2-тип, 3-площадь
                    calc.area = 1;
                }
                
                console.log('Survey type selected:', surveyType, 'totalSteps:', calc.totalSteps);
                return false;
            }
            
            // Быстрые кнопки площади для экологии
            if (btn.classList.contains('ecology-area-btn')) {
                e.preventDefault();
                const area = parseInt(btn.getAttribute('data-area'));
                calc.area = area;
                
                const range = document.getElementById('ecologyAreaRange');
                const value = document.getElementById('ecologyAreaValue');
                if (range) range.value = area;
                if (value) value.textContent = area;
                
                const parent = btn.closest('.quick-area-buttons');
                if (parent) {
                    parent.querySelectorAll('.quick-btn').forEach(b => {
                        b.classList.remove('active');
                    });
                }
                btn.classList.add('active');
                
                return false;
            }
            
            // Кнопка типа кадастровых работ
            if (btn.classList.contains('cadastre-type-btn')) {
                e.preventDefault();
                const cadastreType = btn.getAttribute('data-value');
                
                // Убираем выделение со всех в этом шаге
                const step = btn.closest('.calculator-step');
                step.querySelectorAll('.cadastre-type-btn').forEach(b => {
                    b.classList.remove('selected');
                });
                
                // Выделяем текущую
                btn.classList.add('selected');
                
                // Сохраняем данные
                calc.cadastreType = cadastreType;
                
                console.log('Cadastre type selected:', cadastreType);
                return false;
            }
            
            // Быстрые кнопки количества участков/объектов для кадастра
            if (btn.classList.contains('cadastre-count-btn')) {
                e.preventDefault();
                const count = parseInt(btn.getAttribute('data-count'));
                calc.cadastreCount = count;
                
                const range = document.getElementById('cadastreCountRange');
                const value = document.getElementById('cadastreCountValue');
                if (range) range.value = count;
                if (value) value.textContent = count;
                
                const parent = btn.closest('.quick-area-buttons');
                if (parent) {
                    parent.querySelectorAll('.quick-btn').forEach(b => {
                        b.classList.remove('active');
                    });
                }
                btn.classList.add('active');
                
                return false;
            }
            
            // Кнопка опции
            if (btn.classList.contains('option-type-btn')) {
                e.preventDefault();
                const addPrice = parseFloat(btn.getAttribute('data-addprice'));
                
                // Убираем выделение со всех в этом шаге
                const step = btn.closest('.calculator-step');
                step.querySelectorAll('.option-type-btn').forEach(b => {
                    b.classList.remove('selected');
                });
                
                // Выделяем текущую
                btn.classList.add('selected');
                
                // Сохраняем данные
                calc.option = addPrice;
                
                console.log('Option selected:', addPrice);
                return false;
            }
            
            // Кнопка "Далее"
            if (btn.id === 'calcNextBtn') {
                e.preventDefault();
                console.log('=== Next button clicked ===');
                console.log('Current step:', calc.step);
                console.log('Service:', calc.service);
                console.log('Total steps:', calc.totalSteps);
                
                // Валидация
                if (calc.step === 1 && !calc.service) {
                    alert('Пожалуйста, выберите тип работ');
                    return false;
                }
                
                // Валидация для фасадной съемки (3 шага)
                if (calc.service === 'facade') {
                    if (calc.step === 2) {
                        // Проверяем площадь
                        if (!calc.area || calc.area <= 0) {
                            alert('Пожалуйста, укажите площадь');
                            return false;
                        }
                    }
                    if (calc.step === 3) {
                        const selected = wrapper.querySelector('.option-type-btn.selected');
                        if (!selected) {
                            alert('Пожалуйста, выберите вариант');
                            return false;
                        }
                        const addPrice = parseFloat(selected.getAttribute('data-addprice')) || 0;
                        calc.option = addPrice;
                        calculate();
                        return false;
                    }
                }
                // Валидация для лазерного сканирования местности (3 шага)
                else if (calc.service === 'laser') {
                    if (calc.step === 2) {
                        // Строгая проверка минимальной площади 1 га
                        if (!calc.area || calc.area < 1) {
                            alert('Минимальный заказ: 1 га');
                            return false;
                        }
                    }
                    if (calc.step === 3) {
                        const selected = wrapper.querySelector('.option-type-btn.selected');
                        if (!selected) {
                            alert('Пожалуйста, выберите вариант');
                            return false;
                        }
                        const addPrice = parseFloat(selected.getAttribute('data-addprice')) || 0;
                        calc.option = addPrice;
                        calculate();
                        return false;
                    }
                }
                // Валидация для проектирования демонтажа (3 шага)
                else if (calc.service === 'demolition') {
                    if (calc.step === 2) {
                        // Строгая проверка минимальной площади 100 м²
                        if (!calc.area || calc.area < 100) {
                            alert('Минимальная площадь для проекта демонтажа: 100 м²');
                            return false;
                        }
                    }
                    if (calc.step === 3) {
                        // Шаг 3 для демонтажа - опция сметы (чекбокс), расчет без требования выбора
                        calculate();
                        return false;
                    }
                }
                // Валидация для кадастровых работ (3 шага)
                else if (calc.service === 'cadastre') {
                    if (calc.step === 2 && !calc.cadastreType) {
                        alert('Пожалуйста, выберите тип кадастровых работ');
                        return false;
                    }
                    if (calc.step === 3) {
                        // Для межевых планов проверяем количество и максимум 50
                        if (calc.cadastreType === 'boundary') {
                            if (!calc.cadastreCount || calc.cadastreCount <= 0) {
                                alert('Пожалуйста, укажите количество межевых планов');
                                return false;
                            }
                            if (calc.cadastreCount > 50) {
                                alert('Максимальное количество межевых планов: 50');
                                return false;
                            }
                        }
                        // Расчет на шаге 3
                        calculate();
                        return false;
                    }
                }
                // Валидация для геологических изысканий
                else if (calc.service === 'geology') {
                    if (calc.step === 2) {
                        // Проверяем параметры бурения
                        if (!calc.wellsCount || calc.wellsCount <= 0) {
                            alert('Пожалуйста, укажите количество скважин');
                            return false;
                        }
                        if (!calc.drillingDepth || calc.drillingDepth <= 0) {
                            alert('Пожалуйста, укажите глубину бурения');
                            return false;
                        }
                    }
                    if (calc.step === 3) {
                        const selected = wrapper.querySelector('.option-type-btn.selected');
                        if (!selected) {
                            alert('Пожалуйста, выберите вариант');
                            return false;
                        }
                        const addPrice = parseFloat(selected.getAttribute('data-addprice')) || 0;
                        calc.option = addPrice;
                        calculate();
                        return false;
                    }
                }
                // Валидация для геодезических изысканий (с подтипами)
                else if (calc.service === 'survey') {
                    // Шаг 2 - выбор типа изысканий
                    if (calc.step === 2 && !calc.surveyType) {
                        alert('Пожалуйста, выберите тип геодезических изысканий');
                        return false;
                    }
                    
                    // Шаги 3+ зависят от типа изысканий
                    if (calc.surveyType === 'topography') {
                        // Топография: шаг 3 - локация
                        if (calc.step === 3 && !calc.location) {
                            alert('Пожалуйста, выберите локацию');
                            return false;
                        }
                        if (calc.step === 3 && calc.location && !calc.approval) {
                            alert('Пожалуйста, выберите вариант согласования');
                            return false;
                        }
                        // Шаг 4 - территория
                        if (calc.step === 4 && !calc.territory) {
                            alert('Пожалуйста, выберите тип территории');
                            return false;
                        }
                        // Шаг 5 - площадь -> расчет
                        if (calc.step === 5) {
                            if (!calc.area || calc.area <= 0) {
                                alert('Пожалуйста, укажите площадь территории');
                                return false;
                            }
                            calculate();
                            return false;
                        }
                    } else if (calc.surveyType === 'geology') {
                        // Геология: шаг 3 - бурение -> расчет
                        if (calc.step === 3) {
                            if (!calc.wellsCount || calc.wellsCount <= 0) {
                                alert('Пожалуйста, укажите количество скважин');
                                return false;
                            }
                            if (!calc.drillingDepth || calc.drillingDepth <= 0) {
                                alert('Пожалуйста, укажите глубину бурения');
                                return false;
                            }
                            calculate();
                            return false;
                        }
                    } else if (calc.surveyType === 'ecology') {
                        // Экология: шаг 3 - площадь -> расчет
                        if (calc.step === 3) {
                            if (!calc.area || calc.area < 1) {
                                alert('Минимальная площадь: 1 га');
                                return false;
                            }
                            if (calc.area > 50) {
                                alert('Максимальная площадь: 50 га');
                                return false;
                            }
                            calculate();
                            return false;
                        }
                    }
                }
                // Валидация для топографической съемки (отдельная кнопка)
                else if (calc.service === 'topography') {
                    if (calc.step === 2 && !calc.location) {
                        alert('Пожалуйста, выберите локацию');
                        return false;
                    }
                    if (calc.step === 2 && calc.location && !calc.approval) {
                        alert('Пожалуйста, выберите вариант согласования');
                        return false;
                    }
                    if (calc.step === 3 && !calc.territory) {
                        alert('Пожалуйста, выберите тип территории');
                        return false;
                    }
                    // Для топографии на шаге 4 (площадь) показываем результат
                    if (calc.step === 4) {
                        console.log('Topography step 4 - checking area:', calc.area);
                        // Проверяем, что площадь указана
                        if (!calc.area || calc.area <= 0) {
                            alert('Пожалуйста, укажите площадь территории');
                            return false;
                        }
                        // Вызываем расчет сразу после шага 4 (площадь)
                        console.log('Calling calculate() from step 4');
                        calculate();
                        return false;
                    }
                }
                // Валидация для обычных услуг
                else {
                    if (calc.step === 2 && !calc.object) {
                        alert('Пожалуйста, выберите тип объекта');
                        return false;
                    }
                    if (calc.step === 4) {
                        console.log('Regular service step 4 - checking options');
                        const selected = wrapper.querySelector('.option-type-btn.selected');
                        if (!selected) {
                            alert('Пожалуйста, выберите вариант');
                            return false;
                        }
                        // Сохраняем выбранную опцию
                        const addPrice = parseFloat(selected.getAttribute('data-addprice')) || 0;
                        calc.option = addPrice;
                        console.log('Option selected:', addPrice);
                        // После выбора опций сразу показываем результат
                        console.log('Calling calculate() from step 4 (regular service)');
                        calculate();
                        return false;
                    }
                }
                
                // Переход на следующий шаг
                if (calc.step < calc.totalSteps) {
                    calc.step++;
                    showStep(calc.step);
                }
                
                return false;
            }
            
            // Кнопка "Назад"
            if (btn.id === 'calcPrevBtn') {
                e.preventDefault();
                if (calc.step > 1) {
                    calc.step--;
                    showStep(calc.step);
                }
                return false;
            }
            
            // Быстрые кнопки площади
            if (btn.classList.contains('quick-btn') && btn.getAttribute('data-area')) {
                e.preventDefault();
                const area = parseFloat(btn.getAttribute('data-area'));
                calc.area = area;
                
                const range = document.getElementById('areaRange');
                const value = document.getElementById('areaValue');
                if (range) range.value = area;
                if (value) value.textContent = Math.round(area).toLocaleString('ru-RU');
                
                const parent = btn.closest('.quick-area-buttons');
                if (parent) {
                    parent.querySelectorAll('.quick-btn').forEach(b => {
                        b.classList.remove('active');
                    });
                }
                btn.classList.add('active');
                
                return false;
            }
            
            // Быстрые кнопки количества скважин
            if (btn.classList.contains('wells-btn')) {
                e.preventDefault();
                const wells = parseInt(btn.getAttribute('data-wells'));
                calc.wellsCount = wells;
                
                const range = document.getElementById('wellsCountRange');
                const value = document.getElementById('wellsCountValue');
                if (range) range.value = wells;
                if (value) value.textContent = wells;
                
                updateTotalDrillingMeters();
                
                const parent = btn.closest('.quick-area-buttons');
                if (parent) {
                    parent.querySelectorAll('.quick-btn').forEach(b => {
                        b.classList.remove('active');
                    });
                }
                btn.classList.add('active');
                
                return false;
            }
            
            // Быстрые кнопки глубины бурения
            if (btn.classList.contains('depth-btn')) {
                e.preventDefault();
                const depth = parseInt(btn.getAttribute('data-depth'));
                calc.drillingDepth = depth;
                
                const range = document.getElementById('drillingDepthRange');
                const value = document.getElementById('drillingDepthValue');
                if (range) range.value = depth;
                if (value) value.textContent = depth;
                
                updateTotalDrillingMeters();
                
                const parent = btn.closest('.quick-area-buttons');
                if (parent) {
                    parent.querySelectorAll('.quick-btn').forEach(b => {
                        b.classList.remove('active');
                    });
                }
                btn.classList.add('active');
                
                return false;
            }
            
            // Кнопка типа кадастровых работ
            if (btn.classList.contains('cadastre-type-btn')) {
                e.preventDefault();
                const cadastreType = btn.getAttribute('data-value');
                
                // Убираем выделение со всех в этом шаге
                const step = btn.closest('.calculator-step');
                step.querySelectorAll('.cadastre-type-btn').forEach(b => {
                    b.classList.remove('selected');
                });
                
                // Выделяем текущую
                btn.classList.add('selected');
                
                // Сохраняем данные
                calc.cadastreType = cadastreType;
                
                console.log('Cadastre type selected:', cadastreType);
                return false;
            }
            
        });
        
        // Обработчики чекбоксов
        const demolitionEstimateCheckbox = document.getElementById('demolitionEstimateCheckbox');
        if (demolitionEstimateCheckbox) {
            demolitionEstimateCheckbox.addEventListener('change', function() {
                calc.demolitionWithEstimate = this.checked;
                console.log('Demolition with estimate:', calc.demolitionWithEstimate);
            });
        }
        
        const technicalEstimateCheckbox = document.getElementById('technicalEstimateCheckbox');
        if (technicalEstimateCheckbox) {
            technicalEstimateCheckbox.addEventListener('change', function() {
                calc.technicalWithEstimate = this.checked;
                console.log('Technical with estimate:', calc.technicalWithEstimate);
            });
        }
        
        // Слайдер площади
        const areaRange = document.getElementById('areaRange');
        if (areaRange) {
            areaRange.addEventListener('input', function() {
                calc.area = parseFloat(this.value);
                const value = document.getElementById('areaValue');
                if (value) {
                    value.textContent = Math.round(calc.area).toLocaleString('ru-RU');
                }
            });
        }
        
        // Слайдеры для геологии
        const wellsRange = document.getElementById('wellsCountRange');
        if (wellsRange) {
            wellsRange.addEventListener('input', function() {
                calc.wellsCount = parseInt(this.value);
                const value = document.getElementById('wellsCountValue');
                if (value) value.textContent = calc.wellsCount;
                updateTotalDrillingMeters();
            });
        }
        
        const depthRange = document.getElementById('drillingDepthRange');
        if (depthRange) {
            depthRange.addEventListener('input', function() {
                calc.drillingDepth = parseInt(this.value);
                const value = document.getElementById('drillingDepthValue');
                if (value) value.textContent = calc.drillingDepth;
                updateTotalDrillingMeters();
            });
        }
        
        // Слайдер для количества кадастровых объектов
        const cadastreCountRange = document.getElementById('cadastreCountRange');
        if (cadastreCountRange) {
            cadastreCountRange.addEventListener('input', function() {
                calc.cadastreCount = parseInt(this.value);
                const value = document.getElementById('cadastreCountValue');
                if (value) value.textContent = calc.cadastreCount;
            });
        }
        
        // Слайдер для площади экологии
        const ecologyAreaRange = document.getElementById('ecologyAreaRange');
        if (ecologyAreaRange) {
            ecologyAreaRange.addEventListener('input', function() {
                calc.area = parseInt(this.value);
                const value = document.getElementById('ecologyAreaValue');
                if (value) value.textContent = calc.area;
            });
        }
        
        // Инициализируем прогресс-бар
        updateProgressSteps();
        
        // Показываем первый шаг
        showStep(1);
    });
    
    // Обновление индикаторов шагов прогресс-бара
    function updateProgressSteps(currentStep, totalSteps) {
        const progressStepsContainer = document.querySelector('.progress-steps');
        if (!progressStepsContainer) return;
        
        // Очищаем контейнер
        progressStepsContainer.innerHTML = '';
        
        // Создаем индикаторы шагов
        for (let i = 1; i <= totalSteps; i++) {
            const stepEl = document.createElement('span');
            stepEl.className = 'progress-step';
            stepEl.setAttribute('data-step', i);
            stepEl.textContent = i;
            
            if (i < currentStep) {
                stepEl.classList.add('completed');
            } else if (i === currentStep) {
                stepEl.classList.add('active');
            }
            
            progressStepsContainer.appendChild(stepEl);
        }
    }
    
    // Обновление итоговых метров бурения
    function updateTotalDrillingMeters() {
        const total = calc.wellsCount * calc.drillingDepth;
        const totalEl = document.getElementById('totalDrillingMeters');
        if (totalEl) {
            totalEl.textContent = total;
        }
    }
    
    // Расчет градационных цен для межевых планов
    function calculateBoundaryPrice(count) {
        const tiers = [
            {min: 1, max: 5, price: 15000},
            {min: 6, max: 15, price: 13000},
            {min: 16, max: 50, price: 10000}
        ];
        
        let total = 0;
        let remaining = count;
        
        for (const tier of tiers) {
            if (remaining <= 0) break;
            
            const tierSize = tier.max - tier.min + 1;
            const tierCount = Math.min(remaining, tierSize);
            total += tierCount * tier.price;
            remaining -= tierCount;
            
            if (remaining <= 0) break;
        }
        
        return total;
    }
    
    // Обновление динамического прогресс-бара
    function updateProgressSteps() {
        const container = document.getElementById('progressStepsContainer');
        if (!container) return;
        
        container.innerHTML = '';
        for (let i = 1; i <= calc.totalSteps; i++) {
            const stepSpan = document.createElement('span');
            stepSpan.className = 'progress-step';
            if (i === 1) stepSpan.classList.add('active');
            stepSpan.setAttribute('data-step', i);
            stepSpan.textContent = i;
            container.appendChild(stepSpan);
        }
    }
    
    // Показать шаг
    function showStep(step) {
        // Скрываем все шаги
        document.querySelectorAll('.calculator-step').forEach(s => {
            s.classList.remove('active');
            s.style.display = 'none';
        });
        
        // Для фасадной съемки, лазерного сканирования и демонтажа - 3 шага без выбора типа объекта
        if (calc.service === 'facade' || calc.service === 'laser' || calc.service === 'demolition') {
            if (step === 1) {
                const stepEl = document.querySelector('.calculator-step[data-step="1"]');
                if (stepEl) {
                    stepEl.classList.add('active');
                    stepEl.style.display = 'block';
                }
            } else if (step === 2) {
                // Сразу показываем площадь
                const stepEl = document.getElementById('step3Parameters');
                if (stepEl) {
                    stepEl.classList.add('active');
                    stepEl.style.display = 'block';
                    updateParameterStep();
                }
            } else if (step === 3) {
                // Опции
                const stepEl = document.querySelector('.calculator-step[data-step="4"]:not(#step4TopographyArea)');
                if (stepEl) {
                    stepEl.classList.add('active');
                    stepEl.style.display = 'block';
                }
            }
        }
        // Для кадастровых работ показываем специальные шаги
        else if (calc.service === 'cadastre') {
            if (step === 1) {
                const stepEl = document.querySelector('.calculator-step[data-step="1"]');
                if (stepEl) {
                    stepEl.classList.add('active');
                    stepEl.style.display = 'block';
                }
            } else if (step === 2) {
                const stepEl = document.getElementById('step2CadastreType');
                if (stepEl) {
                    stepEl.classList.add('active');
                    stepEl.style.display = 'block';
                    
                    // Восстанавливаем выбор типа кадастровых работ
                    if (calc.cadastreType) {
                        const typeBtn = stepEl.querySelector(`.cadastre-type-btn[data-value="${calc.cadastreType}"]`);
                        if (typeBtn) {
                            typeBtn.classList.add('selected');
                        }
                    }
                }
            } else if (step === 3) {
                // Условная логика: для межевых планов - количество, для технических - опции
                if (calc.cadastreType === 'boundary') {
                    const stepEl = document.getElementById('step3CadastreCount');
                    if (stepEl) {
                        stepEl.classList.add('active');
                        stepEl.style.display = 'block';
                        
                        // Обновляем заголовок
                        const title = document.getElementById('cadastreCountTitle');
                        const unit = document.getElementById('cadastreCountUnit');
                        if (title) title.textContent = 'Количество межевых планов';
                        if (unit) unit.textContent = 'план(ов)';
                        
                        // Устанавливаем значение слайдера
                        const range = document.getElementById('cadastreCountRange');
                        const value = document.getElementById('cadastreCountValue');
                        if (range) range.value = calc.cadastreCount;
                        if (value) value.textContent = calc.cadastreCount;
                    }
                    // Скрываем опции технического плана
                    const technicalOptions = document.getElementById('step3TechnicalOptions');
                    if (technicalOptions) technicalOptions.style.display = 'none';
                } else if (calc.cadastreType === 'technical') {
                    const stepEl = document.getElementById('step3TechnicalOptions');
                    if (stepEl) {
                        stepEl.classList.add('active');
                        stepEl.style.display = 'block';
                        
                        // Восстанавливаем состояние чекбокса
                        const checkbox = document.getElementById('technicalEstimateCheckbox');
                        if (checkbox) checkbox.checked = calc.technicalWithEstimate;
                    }
                    // Скрываем счетчик количества
                    const cadastreCount = document.getElementById('step3CadastreCount');
                    if (cadastreCount) cadastreCount.style.display = 'none';
                }
            }
        }
        // Для геологических изысканий показываем специальные шаги
        else if (calc.service === 'geology') {
            if (step === 1) {
                const stepEl = document.querySelector('.calculator-step[data-step="1"]');
                if (stepEl) {
                    stepEl.classList.add('active');
                    stepEl.style.display = 'block';
                }
            } else if (step === 2) {
                const stepEl = document.getElementById('step2Geology');
                if (stepEl) {
                    stepEl.classList.add('active');
                    stepEl.style.display = 'block';
                    // Инициализируем значения
                    const wellsRange = document.getElementById('wellsCountRange');
                    const wellsValue = document.getElementById('wellsCountValue');
                    const depthRange = document.getElementById('drillingDepthRange');
                    const depthValue = document.getElementById('drillingDepthValue');
                    
                    if (wellsRange) wellsRange.value = calc.wellsCount;
                    if (wellsValue) wellsValue.textContent = calc.wellsCount;
                    if (depthRange) depthRange.value = calc.drillingDepth;
                    if (depthValue) depthValue.textContent = calc.drillingDepth;
                    
                    updateTotalDrillingMeters();
                }
            } else if (step === 3) {
                // Шаг 3 - опции для геологии
                const stepEl = document.querySelector('.calculator-step[data-step="4"]:not(#step4TopographyArea)');
                if (stepEl) {
                    stepEl.classList.add('active');
                    stepEl.style.display = 'block';
                }
            }
        }
        // Для топографической съемки и геодезических изысканий показываем специальные шаги
        // Для топографической съемки (отдельная кнопка)
        else if (calc.service === 'topography') {
            if (step === 2) {
                const stepEl = document.getElementById('step2Location');
                if (stepEl) {
                    stepEl.classList.add('active');
                    stepEl.style.display = 'block';
                    
                    // Восстанавливаем выбор локации и опции согласования
                    if (calc.location) {
                        const locationBtn = stepEl.querySelector(`.location-type-btn[data-value="${calc.location}"]`);
                        if (locationBtn) {
                            locationBtn.classList.add('selected');
                            
                            // Показываем опции согласования
                            const approvalOptions = document.getElementById('locationApprovalOptions');
                            const approvalTitle = document.getElementById('approvalTitle');
                            if (approvalOptions && approvalTitle) {
                                if (calc.location === 'spb') {
                                    approvalTitle.textContent = 'Согласовать в КГА?';
                                } else if (calc.location === 'lo') {
                                    approvalTitle.textContent = 'Сдать результаты в ИСОГД?';
                                }
                                approvalOptions.style.display = 'block';
                                
                                // Восстанавливаем выбор согласования
                                if (calc.approval) {
                                    const approvalBtn = stepEl.querySelector(`.approval-type-btn[data-value="${calc.approval}"]`);
                                    if (approvalBtn) {
                                        approvalBtn.classList.add('selected');
                                    }
                                }
                            }
                        }
                    }
                }
            } else if (step === 3) {
                const stepEl = document.getElementById('step3Territory');
                if (stepEl) {
                    stepEl.classList.add('active');
                    stepEl.style.display = 'block';
                    
                    // Восстанавливаем выбор территории
                    if (calc.territory) {
                        const territoryBtn = stepEl.querySelector(`.territory-type-btn[data-value="${calc.territory}"]`);
                        if (territoryBtn) {
                            territoryBtn.classList.add('selected');
                        }
                    }
                }
            } else if (step === 4) {
                const stepEl = document.getElementById('step4TopographyArea');
                if (stepEl) {
                    stepEl.classList.add('active');
                    stepEl.style.display = 'block';
                    // Обновляем слайдер для топографии
                    updateTopographyAreaSlider();
                }
            } else {
                // Шаг 1 - обычный шаг
                const stepEl = document.querySelector(`.calculator-step[data-step="${step}"]`);
                if (stepEl) {
                    stepEl.classList.add('active');
                    stepEl.style.display = 'block';
                }
            }
        }
        // Для геодезических изысканий (с выбором подтипа)
        else if (calc.service === 'survey') {
            if (step === 1) {
                const stepEl = document.querySelector('.calculator-step[data-step="1"]');
                if (stepEl) {
                    stepEl.classList.add('active');
                    stepEl.style.display = 'block';
                }
            } else if (step === 2) {
                // Шаг 2 - выбор типа изысканий
                const stepEl = document.getElementById('step2SurveyType');
                if (stepEl) {
                    stepEl.classList.add('active');
                    stepEl.style.display = 'block';
                    
                    // Восстанавливаем выбор типа
                    if (calc.surveyType) {
                        const typeBtn = stepEl.querySelector(`.survey-type-btn[data-survey-type="${calc.surveyType}"]`);
                        if (typeBtn) {
                            typeBtn.classList.add('selected');
                        }
                    }
                }
            } else if (step >= 3) {
                // Шаги 3+ зависят от выбранного типа изысканий
                if (calc.surveyType === 'topography') {
                    // Топография: локация -> территория -> площадь
                    if (step === 3) {
                        const stepEl = document.getElementById('step2Location');
                        if (stepEl) {
                            stepEl.classList.add('active');
                            stepEl.style.display = 'block';
                            
                            if (calc.location) {
                                const locationBtn = stepEl.querySelector(`.location-type-btn[data-value="${calc.location}"]`);
                                if (locationBtn) {
                                    locationBtn.classList.add('selected');
                                    
                                    const approvalOptions = document.getElementById('locationApprovalOptions');
                                    const approvalTitle = document.getElementById('approvalTitle');
                                    if (approvalOptions && approvalTitle) {
                                        approvalTitle.textContent = 'Сдать результаты в ИСОГД?';
                                        approvalOptions.style.display = 'block';
                                        
                                        if (calc.approval) {
                                            const approvalBtn = stepEl.querySelector(`.approval-type-btn[data-value="${calc.approval}"]`);
                                            if (approvalBtn) approvalBtn.classList.add('selected');
                                        }
                                    }
                                }
                            }
                        }
                    } else if (step === 4) {
                        const stepEl = document.getElementById('step3Territory');
                        if (stepEl) {
                            stepEl.classList.add('active');
                            stepEl.style.display = 'block';
                            
                            if (calc.territory) {
                                const territoryBtn = stepEl.querySelector(`.territory-type-btn[data-value="${calc.territory}"]`);
                                if (territoryBtn) territoryBtn.classList.add('selected');
                            }
                        }
                    } else if (step === 5) {
                        const stepEl = document.getElementById('step4TopographyArea');
                        if (stepEl) {
                            stepEl.classList.add('active');
                            stepEl.style.display = 'block';
                            updateTopographyAreaSlider();
                        }
                    }
                } else if (calc.surveyType === 'geology') {
                    // Геология: параметры бурения
                    if (step === 3) {
                        const stepEl = document.getElementById('step2Geology');
                        if (stepEl) {
                            stepEl.classList.add('active');
                            stepEl.style.display = 'block';
                            updateTotalDrillingMeters();
                        }
                    }
                } else if (calc.surveyType === 'ecology') {
                    // Экология: площадь
                    if (step === 3) {
                        const stepEl = document.getElementById('step3EcologyArea');
                        if (stepEl) {
                            stepEl.classList.add('active');
                            stepEl.style.display = 'block';
                            
                            // Обновляем слайдер
                            const range = document.getElementById('ecologyAreaRange');
                            const value = document.getElementById('ecologyAreaValue');
                            if (range) range.value = calc.area;
                            if (value) value.textContent = calc.area;
                        }
                    }
                }
            }
        } else {
            // Для обычных услуг показываем стандартные шаги
            if (step === 2) {
                const stepEl = document.getElementById('step2ObjectType');
                if (stepEl) {
                    stepEl.classList.add('active');
                    stepEl.style.display = 'block';
                }
            } else if (step === 3) {
                const stepEl = document.getElementById('step3Parameters');
                if (stepEl) {
                    stepEl.classList.add('active');
                    stepEl.style.display = 'block';
                    updateParameterStep();
                }
            } else {
                const stepEl = document.querySelector(`.calculator-step[data-step="${step}"]`);
                if (stepEl) {
                    stepEl.classList.add('active');
                    stepEl.style.display = 'block';
                }
            }
        }
        
        // Обновляем прогресс
        const progress = (step / calc.totalSteps) * 100;
        const progressFill = document.getElementById('progressFill');
        if (progressFill) {
            progressFill.style.width = progress + '%';
        }
        
        // Обновляем индикаторы шагов (динамически)
        updateProgressSteps(step, calc.totalSteps);
        
        // Показываем/скрываем кнопки навигации
        const prevBtn = document.getElementById('calcPrevBtn');
        const nextBtn = document.getElementById('calcNextBtn');
        
        if (prevBtn) {
            prevBtn.style.display = step > 1 ? 'block' : 'none';
        }
        
        if (nextBtn) {
            // Определяем, на каком шаге должна быть кнопка "Рассчитать"
            let isLastStep = false;
            
            if (calc.service === 'facade' || calc.service === 'laser' || calc.service === 'demolition') {
                // Для обмерных работ и демонтажа последний шаг - это шаг 3 (опции)
                isLastStep = (step === 3);
            } else if (calc.service === 'geology') {
                // Для геологии последний шаг - это шаг 3 (опции)
                isLastStep = (step === 3);
            } else if (calc.service === 'topography') {
                // Для топографии последний шаг - это шаг 4 (площадь)
                isLastStep = (step === 4);
            } else if (calc.service === 'survey') {
                // Для геодезических изысканий зависит от подтипа
                if (calc.surveyType === 'topography') {
                    isLastStep = (step === 5); // услуга -> тип -> локация -> территория -> площадь
                } else if (calc.surveyType === 'geology') {
                    isLastStep = (step === 3); // услуга -> тип -> бурение
                } else if (calc.surveyType === 'ecology') {
                    isLastStep = (step === 3); // услуга -> тип -> площадь
                } else {
                    isLastStep = (step === 2); // пока не выбран тип
                }
            } else if (calc.service === 'cadastre') {
                // Для кадастра последний шаг - это шаг 3 (опции или количество)
                isLastStep = (step === 3);
            } else {
                // Для остальных услуг последний шаг - это шаг 4 (опции)
                isLastStep = (step === 4);
            }
            
            if (isLastStep) {
                nextBtn.textContent = 'Рассчитать';
            } else if (step < calc.totalSteps) {
                nextBtn.textContent = 'Далее';
            } else {
                nextBtn.textContent = 'Далее';
            }
            
            // Всегда показываем кнопку, кроме случая когда уже показан результат
            const result = document.getElementById('calculatorResult');
            if (result && result.style.display === 'block') {
                nextBtn.style.display = 'none';
            } else {
                nextBtn.style.display = 'block';
            }
        }
    }
    
    // Обновление параметров шага для демонтажа
    function updateDemolitionParameterStep() {
        const title = document.getElementById('parameterTitle');
        const unit = document.getElementById('areaUnit');
        const range = document.getElementById('areaRange');
        const minLabel = document.getElementById('rangeMin');
        const maxLabel = document.getElementById('rangeMax');
        const value = document.getElementById('areaValue');
        
        if (title) {
            title.textContent = 'Площадь здания (м²)';
        }
        if (unit) {
            unit.textContent = 'м²';
        }
        if (range) {
            range.min = 50;
            range.max = 10000;
            range.step = 50;
            range.value = calc.area;
        }
        if (value) {
            value.textContent = Math.round(calc.area).toLocaleString('ru-RU');
        }
        if (minLabel) {
            minLabel.textContent = '50 м²';
        }
        if (maxLabel) {
            maxLabel.textContent = '10 000 м²';
        }
    }
    
    // Обновление параметров шага для обычных услуг
    function updateParameterStep() {
        const service = services[calc.service];
        if (!service) return;
        
        const title = document.getElementById('parameterTitle');
        const unit = document.getElementById('areaUnit');
        const range = document.getElementById('areaRange');
        const minLabel = document.getElementById('rangeMin');
        const maxLabel = document.getElementById('rangeMax');
        
        if (title) {
            if (calc.service === 'demolition') {
                title.textContent = 'Площадь здания (м²)';
            } else {
                title.textContent = `Площадь объекта (${service.unit})`;
            }
        }
        if (unit) {
            unit.textContent = service.unit;
        }
        if (range) {
            // Устанавливаем диапазон в зависимости от типа услуги
            if (calc.service === 'laser') {
                // Для лазерного сканирования местности: от 1 до 100 га
                range.min = 1;
                range.max = 100;
                range.step = 1;
                range.value = calc.area;
            } else if (service.unit === 'га') {
                range.min = 0.1;
                range.max = 100;
                range.step = 0.1;
                range.value = calc.area;
            } else if (calc.service === 'demolition') {
                // Для демонтажа: от 100 до 5000 м²
                range.min = 100;
                range.max = 5000;
                range.step = 100;
                range.value = calc.area;
            } else {
                // Для фасадной съемки
                range.min = 50;
                range.max = 10000;
                range.step = 50;
                range.value = calc.area;
            }
        }
        if (minLabel && range) {
            minLabel.textContent = `${range.min} ${service.unit}`;
        }
        if (maxLabel && range) {
            maxLabel.textContent = `${parseInt(range.max).toLocaleString('ru-RU')} ${service.unit}`;
        }
        
        // Обновляем быстрые кнопки в зависимости от услуги
        const quickBtns = document.querySelectorAll('#quickButtons .quick-btn');
        if (calc.service === 'laser') {
            // Для лазерного сканирования местности: 1, 5, 10, 50 га
            const values = [1, 5, 10, 50];
            quickBtns.forEach((btn, i) => {
                if (values[i]) {
                    btn.setAttribute('data-area', values[i]);
                    btn.textContent = values[i];
                }
            });
        } else if (calc.service === 'demolition') {
            // Для демонтажа: 100, 500, 1000, 3000 м²
            const values = [100, 500, 1000, 3000];
            quickBtns.forEach((btn, i) => {
                if (values[i]) {
                    btn.setAttribute('data-area', values[i]);
                    btn.textContent = values[i].toLocaleString('ru-RU');
                }
            });
        } else {
            // Стандартные значения для фасадной съемки
            const values = [100, 500, 1000, 5000];
            quickBtns.forEach((btn, i) => {
                if (values[i]) {
                    btn.setAttribute('data-area', values[i]);
                    btn.textContent = values[i].toLocaleString('ru-RU');
                }
            });
        }
    }
    
    // Обновление слайдера для топографической съемки
    function updateTopographyAreaSlider() {
        const range = document.getElementById('topographyAreaRange');
        const value = document.getElementById('topographyAreaValue');
        const unit = document.getElementById('topographyAreaUnit');
        
        if (range && value) {
            range.value = calc.area;
            value.textContent = parseFloat(calc.area).toLocaleString('ru-RU', { minimumFractionDigits: 1, maximumFractionDigits: 1 });
        }
        if (unit) {
            unit.textContent = 'га';
        }
        
        // Обработчик изменения слайдера
        if (range) {
            range.oninput = function() {
                calc.area = parseFloat(this.value);
                if (value) {
                    value.textContent = parseFloat(calc.area).toLocaleString('ru-RU', { minimumFractionDigits: 1, maximumFractionDigits: 1 });
                }
            };
        }
        
        // Быстрые кнопки
        const quickBtns = document.querySelectorAll('#topographyQuickButtons .quick-btn');
        quickBtns.forEach(btn => {
            btn.onclick = function() {
                const area = parseFloat(this.getAttribute('data-area'));
                calc.area = area;
                if (range) range.value = area;
                if (value) value.textContent = parseFloat(area).toLocaleString('ru-RU', { minimumFractionDigits: 1, maximumFractionDigits: 1 });
                quickBtns.forEach(b => b.classList.remove('active'));
                this.classList.add('active');
            };
        });
    }
    
    // Расчет результата
    function calculate() {
        console.log('=== calculate() called ===');
        console.log('calc object:', JSON.stringify(calc, null, 2));
        
        const service = services[calc.service];
        
        if (!service) {
            console.error('Missing service:', calc);
            alert('Ошибка: не выбран тип работ');
            return;
        }
        
        console.log('Service found:', service);
        
        let multiplier = 1.0;
        
        // Для фасадной съемки и лазерного сканирования - без множителя объекта
        if (calc.service === 'facade' || calc.service === 'laser') {
            multiplier = 1.0; // Простой расчет по площади
        }
        // Для топографической съемки используем территорию
        else if (calc.service === 'topography') {
            if (calc.territory === 'industrial-zone') multiplier = 1.2;
            else if (calc.territory === 'built-up') multiplier = 1.0;
            else if (calc.territory === 'unbuilt') multiplier = 0.8;
            else multiplier = 1.0; // По умолчанию
            
            // Добавляем стоимость согласования
            if (calc.approval === 'yes') {
                multiplier += 0.3; // +30% за согласование
            }
        }
        // Для геодезических изысканий зависит от подтипа
        else if (calc.service === 'survey') {
            if (calc.surveyType === 'topography') {
                // Как топографическая съемка
                if (calc.territory === 'industrial-zone') multiplier = 1.2;
                else if (calc.territory === 'built-up') multiplier = 1.0;
                else if (calc.territory === 'unbuilt') multiplier = 0.8;
                else multiplier = 1.0;
                
                if (calc.approval === 'yes') {
                    multiplier += 0.3;
                }
            } else if (calc.surveyType === 'geology') {
                multiplier = 1.0;
            } else if (calc.surveyType === 'ecology') {
                multiplier = 1.0;
            }
        }
        // Для демонтажа - без множителя объекта
        else if (calc.service === 'demolition') {
            multiplier = 1.0;
        }
        // Для кадастровых работ - множитель зависит от типа работ
        else if (calc.service === 'cadastre') {
            if (calc.cadastreType === 'boundary') multiplier = 1.0;
            else if (calc.cadastreType === 'technical') multiplier = 0.85;
            else multiplier = 1.0;
        } else {
            // Для остальных услуг используем объект
            if (calc.object) {
                const object = objects[calc.object];
                if (object) {
                    multiplier = object.multiplier;
                }
            }
        }
        
        console.log('Calculating with:', {
            service: service,
            area: calc.area,
            multiplier: multiplier,
            option: calc.option,
            location: calc.location,
            approval: calc.approval,
            territory: calc.territory
        });
        
        // Базовая стоимость
        let pricePerUnit = service.price;
        let baseCost = 0;
        
        // Для геологических изысканий считаем по погонным метрам бурения
        if (calc.service === 'geology') {
            const totalMeters = calc.wellsCount * calc.drillingDepth;
            const pricePerMeter = 3500; // 3500 руб за погонный метр бурения
            const pricePerWell = 5000;  // 5000 руб за скважину (мобилизация, отчет)
            baseCost = (totalMeters * pricePerMeter) + (calc.wellsCount * pricePerWell);
            baseCost = baseCost * (1 + calc.option);
        }
        // Для топографической съемки используем разные цены в зависимости от локации
        else if (calc.service === 'topography') {
            if (calc.location === 'spb') {
                pricePerUnit = 80000; // 80 000 руб за 1 га в СПб
            } else if (calc.location === 'lo') {
                pricePerUnit = 65000; // 65 000 руб за 1 га в ЛО
            }
            baseCost = pricePerUnit * calc.area * multiplier;
        }
        // Для геодезических изысканий - зависит от подтипа
        else if (calc.service === 'survey') {
            if (calc.surveyType === 'topography') {
                // Как топографическая съемка
                if (calc.location === 'spb') {
                    pricePerUnit = 80000; // 80 000 руб за 1 га в СПб
                } else if (calc.location === 'lo') {
                    pricePerUnit = 65000; // 65 000 руб за 1 га в ЛО
                }
                baseCost = pricePerUnit * calc.area * multiplier;
            } else if (calc.surveyType === 'geology') {
                // Геология: расчет по бурению
                const totalMeters = calc.wellsCount * calc.drillingDepth;
                const pricePerMeter = 3500;
                const pricePerWell = 5000;
                baseCost = (totalMeters * pricePerMeter) + (calc.wellsCount * pricePerWell);
                baseCost = baseCost * (1 + calc.option);
            } else if (calc.surveyType === 'ecology') {
                // Экология: 250 000 за 1 га
                pricePerUnit = 250000;
                baseCost = pricePerUnit * calc.area;
            }
        }
        // Для кадастровых работ
        else if (calc.service === 'cadastre') {
            if (calc.cadastreType === 'boundary') {
                // Используем градационный расчет для межевых планов
                baseCost = calculateBoundaryPrice(calc.cadastreCount);
            } else if (calc.cadastreType === 'technical') {
                // Технический план: базовая цена + опция сметы
                baseCost = 18000;
                if (calc.technicalWithEstimate) {
                    baseCost += 25000;
                }
            }
        }
        // Для проектирования демонтажа
        else if (calc.service === 'demolition') {
            // Новая формула: порог 100 м²
            if (calc.area <= 100) {
                baseCost = 60000;
            } else {
                baseCost = 60000 + (calc.area - 100) * 100;
            }
            // Добавляем стоимость сметы если выбрана
            if (calc.demolitionWithEstimate) {
                baseCost += 40000;
            }
        }
        // Для лазерного сканирования местности
        else if (calc.service === 'laser') {
            // Расчет по гектарам: 20 000 руб/га
            baseCost = pricePerUnit * calc.area;
        } else {
            baseCost = pricePerUnit * calc.area * multiplier;
        }
        
        console.log('Base cost before options:', baseCost);
        console.log('Area:', calc.area, 'Multiplier:', multiplier, 'Price per unit:', pricePerUnit);
        
        // Применяем дополнительную опцию (если выбрана) - для не-геологических услуг
        // Для геологии опция уже применена выше
        if (calc.service !== 'geology' && calc.option && calc.option > 0) {
            baseCost = baseCost * (1 + calc.option);
            console.log('After option multiplier:', baseCost);
        }
        
        // Минимальная стоимость не должна быть меньше базовой цены за единицу
        if (baseCost < pricePerUnit) {
            baseCost = pricePerUnit;
        }
        
        // Рассчитываем минимум и максимум (±20%)
        const minCost = Math.round(baseCost * 0.8);
        const maxCost = Math.round(baseCost * 1.2);
        const discount = Math.round(maxCost * 0.15);
        
        console.log('Final costs:', { minCost, maxCost, discount });
        
        // Обновляем результат
        const resultServiceName = document.getElementById('resultServiceName');
        if (resultServiceName) {
            let serviceText = service.name;
            // Добавляем информацию о локации и согласовании для топографии (отдельная кнопка)
            if (calc.service === 'topography') {
                if (calc.location === 'spb') {
                    serviceText += ' (Санкт-Петербург';
                } else if (calc.location === 'lo') {
                    serviceText += ' (Ленинградская область';
                }
                if (calc.approval === 'yes') {
                    // Для топографии - КГА в СПб, ИСОГД в ЛО
                    serviceText += calc.location === 'spb' ? ', с согласованием в КГА)' : ', с подачей в ИСОГД)';
                } else {
                    serviceText += ')';
                }
            }
            // Геодезические изыскания с подтипами
            if (calc.service === 'survey') {
                if (calc.surveyType === 'topography') {
                    serviceText = 'Геодезические изыскания: Топографическая съемка';
                    if (calc.location === 'spb') {
                        serviceText += ' (Санкт-Петербург';
                    } else if (calc.location === 'lo') {
                        serviceText += ' (Ленинградская область';
                    }
                    if (calc.approval === 'yes') {
                        serviceText += ', с подачей в ИСОГД)';
                    } else {
                        serviceText += ')';
                    }
                } else if (calc.surveyType === 'geology') {
                    const totalMeters = calc.wellsCount * calc.drillingDepth;
                    serviceText = `Геодезические изыскания: Геология (${calc.wellsCount} скв. × ${calc.drillingDepth} м = ${totalMeters} п.м.)`;
                } else if (calc.surveyType === 'ecology') {
                    serviceText = `Геодезические изыскания: Экология (${calc.area} га)`;
                }
            }
            // Добавляем информацию о бурении для геологии (отдельная)
            if (calc.service === 'geology') {
                const totalMeters = calc.wellsCount * calc.drillingDepth;
                serviceText += ` (${calc.wellsCount} скв. × ${calc.drillingDepth} м = ${totalMeters} п.м.)`;
            }
            // Добавляем информацию о кадастровых работах
            if (calc.service === 'cadastre') {
                const typeName = calc.cadastreType === 'boundary' ? 'Межевой план' : 'Технический план';
                const unitName = calc.cadastreType === 'boundary' ? 'уч.' : 'объект(ов)';
                serviceText = `${typeName} (${calc.cadastreCount} ${unitName})`;
            }
            // Добавляем информацию о демонтаже
            if (calc.service === 'demolition') {
                serviceText += ` (${calc.area.toLocaleString('ru-RU')} м²)`;
            }
            // Добавляем информацию о лазерном сканировании местности
            if (calc.service === 'laser') {
                serviceText += ` (${calc.area} га, E57/Laz/las)`;
            }
            resultServiceName.textContent = serviceText;
        }
        
        const basePriceEl = document.getElementById('basePrice');
        if (basePriceEl) {
            // Для геологических изысканий показываем цену за погонный метр
            if (calc.service === 'geology') {
                basePriceEl.textContent = '3 500 руб/п.м. + 5 000 руб/скв.';
            }
            // Для топографической съемки показываем цену в зависимости от локации
            else if (calc.service === 'topography') {
                let displayPrice = service.price;
                if (calc.location === 'spb') {
                    displayPrice = 80000;
                } else if (calc.location === 'lo') {
                    displayPrice = 65000;
                }
                basePriceEl.textContent = `${displayPrice.toLocaleString('ru-RU')} руб/${service.unit}`;
            }
            // Для геодезических изысканий (с подтипами)
            else if (calc.service === 'survey') {
                if (calc.surveyType === 'topography') {
                    let displayPrice = service.price;
                    if (calc.location === 'spb') {
                        displayPrice = 80000;
                    } else if (calc.location === 'lo') {
                        displayPrice = 65000;
                    }
                    basePriceEl.textContent = `${displayPrice.toLocaleString('ru-RU')} руб/га`;
                } else if (calc.surveyType === 'geology') {
                    basePriceEl.textContent = '3 500 руб/п.м. + 5 000 руб/скв.';
                } else if (calc.surveyType === 'ecology') {
                    basePriceEl.textContent = '250 000 руб/га';
                }
            }
            // Для кадастровых работ
            else if (calc.service === 'cadastre') {
                const displayPrice = calc.cadastreType === 'boundary' ? 18000 : 15000;
                const unitName = calc.cadastreType === 'boundary' ? 'участок' : 'объект';
                basePriceEl.textContent = `${displayPrice.toLocaleString('ru-RU')} руб/${unitName}`;
            }
            // Для демонтажа
            else if (calc.service === 'demolition') {
                basePriceEl.textContent = 'от 60 000 руб + 100 руб/м² (от 100 м²)';
            }
            // Для лазерного сканирования местности
            else if (calc.service === 'laser') {
                basePriceEl.textContent = `${service.price.toLocaleString('ru-RU')} руб/га`;
            } else {
                basePriceEl.textContent = `${service.price.toLocaleString('ru-RU')} руб/${service.unit}`;
            }
        }
        
        // Разделяем базовую стоимость и опции для демонтажа и технического плана
        let baseDisplayCost = baseCost;
        let optionsCost = 0;
        let hasOptions = false;
        
        if (calc.service === 'demolition' && calc.demolitionWithEstimate) {
            baseDisplayCost = baseCost - 40000;
            optionsCost = 40000;
            hasOptions = true;
        } else if (calc.service === 'cadastre' && calc.cadastreType === 'technical' && calc.technicalWithEstimate) {
            baseDisplayCost = 18000;
            optionsCost = 25000;
            hasOptions = true;
        }
        
        const estimatedCost = document.getElementById('estimatedCost');
        if (estimatedCost) {
            let costHTML = '';
            
            if (hasOptions) {
                // Показываем разбивку для демонтажа и технического плана со сметой
                costHTML = `
                    <div style="margin-bottom: 10px; text-align: left;">
                        <div style="font-size: 0.95rem; color: #666;">Базовая стоимость:</div>
                        <div style="font-size: 1.1rem; font-weight: 600; margin-bottom: 8px;">${Math.round(baseDisplayCost).toLocaleString('ru-RU')} ₽</div>
                        <div style="font-size: 0.95rem; color: #666;">Дополнительно (смета):</div>
                        <div style="font-size: 1.1rem; font-weight: 600; color: var(--primary-color); margin-bottom: 8px;">+${optionsCost.toLocaleString('ru-RU')} ₽</div>
                        <div style="border-top: 2px solid #e0e0e0; padding-top: 8px; margin-top: 8px;">
                            <div style="font-size: 0.95rem; color: #666;">Итого:</div>
                            <div style="font-size: 1.4rem; font-weight: 700; color: var(--primary-color);">${Math.round(baseCost).toLocaleString('ru-RU')} ₽</div>
                        </div>
                    </div>
                `;
                estimatedCost.innerHTML = costHTML;
            } else {
                // Стандартное отображение для остальных услуг
                estimatedCost.textContent = `от ${minCost.toLocaleString('ru-RU')} до ${maxCost.toLocaleString('ru-RU')} руб.`;
            }
        }
        
        const discountAmount = document.getElementById('discountAmount');
        if (discountAmount) {
            discountAmount.textContent = `${discount.toLocaleString('ru-RU')} руб.`;
        }
        
        const discountDate = document.getElementById('discountDate');
        if (discountDate) {
            const date = new Date();
            date.setDate(date.getDate() + 3);
            discountDate.textContent = date.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' });
        }
        
        const leadTime = document.getElementById('leadTime');
        if (leadTime) {
            // Простой расчет сроков
            let days = 5;
            if (calc.area > 5000) days = 15;
            else if (calc.area > 2000) days = 10;
            else if (calc.area > 500) days = 5;
            else days = 2;
            
            leadTime.textContent = `${days} рабочих ${days === 1 ? 'день' : days < 5 ? 'дня' : 'дней'}`;
        }
        
        // Скрываем все шаги калькулятора
        document.querySelectorAll('.calculator-step').forEach(step => {
            step.style.display = 'none';
            step.classList.remove('active');
        });
        
        // Скрываем кнопки навигации
        const nextBtn = document.getElementById('calcNextBtn');
        const prevBtn = document.getElementById('calcPrevBtn');
        if (nextBtn) {
            nextBtn.style.display = 'none';
        }
        if (prevBtn) {
            prevBtn.style.display = 'none';
        }
        
        // Показываем результат
        const result = document.getElementById('calculatorResult');
        console.log('Result element:', result);
        if (result) {
            console.log('Showing result block');
            // Убираем все скрывающие стили
            result.style.display = 'block';
            result.style.visibility = 'visible';
            result.style.opacity = '1';
            result.classList.add('active');
            
            // Прокручиваем к результату
            setTimeout(() => {
                result.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }, 100);
            
            console.log('Result should be visible now');
        } else {
            console.error('Result element not found!');
            alert('Ошибка: элемент результата не найден на странице. Проверьте консоль браузера.');
        }
        
        // Обновляем прогресс на 100%
        const progressFill = document.getElementById('progressFill');
        if (progressFill) {
            progressFill.style.width = '100%';
        }
        
        // Помечаем все шаги как завершенные
        document.querySelectorAll('.progress-step').forEach(s => {
            s.classList.remove('active');
            s.classList.add('completed');
        });
        
        // Инициализация функций для работы с результатом
        initResultActions();
    }
    
    // Инициализация действий с результатом (сохранение, печать, email, история)
    function initResultActions() {
        const saveBtn = document.getElementById('saveCalculationBtn');
        const printBtn = document.getElementById('printCalculationBtn');
        const emailBtn = document.getElementById('emailCalculationBtn');
        const shareBtn = document.getElementById('shareCalculationBtn');
        const historyContainer = document.getElementById('calculationHistory');
        const historyList = document.getElementById('historyList');
        
        // Сохранение расчета
        if (saveBtn) {
            saveBtn.addEventListener('click', () => {
                const calculationData = {
                    service: calc.service ? services[calc.service].name : 'Не указано',
                    area: calc.area,
                    object: calc.object,
                    estimatedCost: document.getElementById('estimatedCost')?.textContent || 'Не рассчитано',
                    date: new Date().toISOString(),
                    timestamp: Date.now()
                };
                
                try {
                    let history = JSON.parse(localStorage.getItem('calculationHistory') || '[]');
                    history.unshift(calculationData);
                    if (history.length > 10) history = history.slice(0, 10); // Храним только последние 10
                    localStorage.setItem('calculationHistory', JSON.stringify(history));
                } catch (e) {
                    // localStorage may be unavailable
                }
                
                // Генерируем уникальный ID и ссылку
                const calculationId = 'calc_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
                const shareUrl = window.location.origin + window.location.pathname + '?calc=' + calculationId;
                
                // Сохраняем расширенные данные
                const extendedData = {
                    ...calculationData,
                    id: calculationId,
                    shareUrl: shareUrl
                };
                
                try {
                    localStorage.setItem('lastCalculation', JSON.stringify(extendedData));
                    // Показываем уведомление с ссылкой
                    showSaveNotification(shareUrl);
                } catch (e) {
                    console.log('Could not save to localStorage');
                }
                
                saveBtn.textContent = '✓ Сохранено';
                saveBtn.style.background = '#28a745';
                setTimeout(() => {
                    saveBtn.innerHTML = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path><polyline points="17 21 17 13 7 13 7 21"></polyline><polyline points="7 3 7 8 15 8"></polyline></svg> Сохранить';
                    saveBtn.style.background = '';
                }, 2000);
                
                updateHistoryDisplay();
            });
        }
        
        // Печать расчета
        if (printBtn) {
            printBtn.addEventListener('click', () => {
                const resultContent = document.getElementById('calculatorResult');
                if (resultContent) {
                    const printWindow = window.open('', '_blank');
                    printWindow.document.write(`
                        <html>
                            <head>
                                <title>Расчет стоимости - ООО «АМНИС»</title>
                                <style>
                                    body { font-family: Arial, sans-serif; padding: 20px; }
                                    h2 { color: #2C5AA0; }
                                    .result-item { margin: 10px 0; padding: 10px; border-bottom: 1px solid #eee; }
                                    .result-label { font-weight: bold; }
                                    .result-value { float: right; }
                                </style>
                            </head>
                            <body>
                                <h2>Расчет стоимости работ</h2>
                                ${resultContent.innerHTML}
                            </body>
                        </html>
                    `);
                    printWindow.document.close();
                    printWindow.print();
                }
            });
        }
        
        // Отправка на email
        if (emailBtn) {
            emailBtn.addEventListener('click', () => {
                const serviceName = document.getElementById('resultServiceName')?.textContent || 'Расчет';
                const estimatedCost = document.getElementById('estimatedCost')?.textContent || 'Не рассчитано';
                const subject = encodeURIComponent(`Расчет стоимости: ${serviceName}`);
                const body = encodeURIComponent(`Здравствуйте!\n\nПрошу отправить расчет стоимости для:\n${serviceName}\n\nПредварительная стоимость: ${estimatedCost}\n\nС уважением`);
                window.location.href = `mailto:amnis-info@yandex.ru?subject=${subject}&body=${body}`;
            });
        }
        
        // Поделиться расчетом
        if (shareBtn) {
            shareBtn.addEventListener('click', () => {
                const serviceName = document.getElementById('resultServiceName')?.textContent || 'Расчет';
                const estimatedCost = document.getElementById('estimatedCost')?.textContent || 'Не рассчитано';
                const shareText = `Расчет стоимости: ${serviceName}\n${estimatedCost}\n\nООО «АМНИС» - Геодезические услуги\nhttps://amnis-geo.ru/calculator.html`;
                
                if (navigator.share) {
                    navigator.share({
                        title: 'Расчет стоимости работ',
                        text: shareText,
                        url: window.location.href
                    }).catch(() => {
                        copyToClipboard(shareText);
                    });
                } else {
                    copyToClipboard(shareText);
                }
            });
        }
        
        // Функция копирования в буфер обмена
        function copyToClipboard(text) {
            const textarea = document.createElement('textarea');
            textarea.value = text;
            document.body.appendChild(textarea);
            textarea.select();
            document.execCommand('copy');
            document.body.removeChild(textarea);
            
            if (shareBtn) {
                const originalText = shareBtn.innerHTML;
                shareBtn.textContent = '✓ Скопировано';
                setTimeout(() => {
                    shareBtn.innerHTML = originalText;
                }, 2000);
            }
        }
        
        // Обновление отображения истории
        function updateHistoryDisplay() {
            let history = [];
            try {
                history = JSON.parse(localStorage.getItem('calculationHistory') || '[]');
            } catch (e) {
                // localStorage may be unavailable
            }
            if (history.length > 0 && historyContainer && historyList) {
                historyContainer.style.display = 'block';
                historyList.innerHTML = '';
                history.forEach((item, index) => {
                    const historyItem = document.createElement('div');
                    historyItem.className = 'history-item';
                    historyItem.innerHTML = `
                        <div class="history-item-content">
                            <strong>${item.service}</strong>
                            <span>${item.estimatedCost}</span>
                            <small>${new Date(item.date).toLocaleDateString('ru-RU')}</small>
                        </div>
                        <button class="history-load-btn" data-index="${index}">Загрузить</button>
                    `;
                    historyList.appendChild(historyItem);
                });
                
                // Обработчики загрузки из истории
                historyList.querySelectorAll('.history-load-btn').forEach(btn => {
                    btn.addEventListener('click', () => {
                        const index = parseInt(btn.getAttribute('data-index'));
                        loadFromHistory(history[index]);
                    });
                });
            }
        }
        
        // Загрузка расчета из истории
        function loadFromHistory(data) {
            if (!data || !data.calc) {
                alert('Не удалось загрузить данные расчета');
                return;
            }
            
            const savedCalc = data.calc;
            
            // Восстанавливаем параметры расчета
            if (savedCalc.service) {
                calc.service = savedCalc.service;
                calc.area = savedCalc.area || 500;
                calc.object = savedCalc.object || null;
                calc.option = savedCalc.option || 0;
                calc.location = savedCalc.location || null;
                calc.approval = savedCalc.approval || null;
                calc.territory = savedCalc.territory || null;
                calc.wellsCount = savedCalc.wellsCount || 3;
                calc.drillingDepth = savedCalc.drillingDepth || 8;
                calc.cadastreType = savedCalc.cadastreType || null;
                calc.cadastreCount = savedCalc.cadastreCount || 1;
                calc.demolitionWithEstimate = savedCalc.demolitionWithEstimate || false;
                calc.technicalWithEstimate = savedCalc.technicalWithEstimate || false;
                calc.surveyType = savedCalc.surveyType || null;
                
                // Определяем количество шагов для услуги
                const service = services[calc.service];
                if (service) {
                    if (calc.service === 'facade' || calc.service === 'laser') {
                        calc.totalSteps = 3;
                    } else if (calc.service === 'topography') {
                        calc.totalSteps = 4;
                    } else if (calc.service === 'survey') {
                        calc.totalSteps = 2; // Будет увеличиваться после выбора типа
                    } else if (calc.service === 'geology') {
                        calc.totalSteps = 3;
                    } else if (calc.service === 'cadastre') {
                        calc.totalSteps = 3;
                    } else if (calc.service === 'demolition') {
                        calc.totalSteps = 3;
                    } else {
                        calc.totalSteps = 4;
                    }
                }
                
                // Восстанавливаем UI
                updateProgressSteps();
                
                // Выбираем услугу
                const serviceBtn = wrapper.querySelector(`.service-type-btn[data-service="${calc.service}"]`);
                if (serviceBtn) {
                    serviceBtn.click();
                }
                
                // Переходим к последнему шагу и показываем результат
                setTimeout(() => {
                    calc.step = calc.totalSteps;
                    showStep(calc.step);
                    calculate();
                }, 500);
            } else {
                alert('Не удалось восстановить параметры расчета');
            }
        }
        
        // Инициализация истории при загрузке
        updateHistoryDisplay();
        
        // Загрузка расчета по ID из URL
        function loadCalculationFromId(calculationId) {
            try {
                let history = JSON.parse(localStorage.getItem('calculationHistory') || '[]');
                const savedCalc = history.find(item => item.id === calculationId);
                
                if (savedCalc && savedCalc.calc) {
                    // Показываем уведомление о загрузке
                    const notification = document.createElement('div');
                    notification.style.cssText = 'position: fixed; top: 20px; right: 20px; background: #28a745; color: white; padding: 15px 20px; border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.15); z-index: 10000;';
                    notification.textContent = '✓ Расчет загружен из истории';
                    document.body.appendChild(notification);
                    setTimeout(() => notification.remove(), 3000);
                    
                    // Загружаем расчет
                    loadFromHistory(savedCalc);
                } else {
                    console.log('Расчет не найден в истории');
                }
            } catch (e) {
                console.error('Ошибка загрузки расчета:', e);
            }
        }
        
        // Функция показа уведомления о сохранении
        function showSaveNotification(shareUrl) {
            const notification = document.createElement('div');
            notification.className = 'save-notification';
            notification.style.cssText = 'position: fixed; top: 20px; right: 20px; background: white; padding: 20px; border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.15); z-index: 10000; max-width: 400px; opacity: 0; transform: translateX(100%); transition: all 0.3s ease;';
            const timestamp = Date.now();
            notification.innerHTML = `
                <div style="margin-bottom: 15px;">
                    <strong style="color: #28a745; font-size: 1.1rem;">✓ Расчет сохранен!</strong>
                    <p style="font-size: 0.9rem; color: #666; margin-top: 8px;">Ссылка для возврата к расчету:</p>
                </div>
                <div style="display: flex; gap: 8px; margin-bottom: 10px;">
                    <input type="text" value="${shareUrl}" readonly style="flex: 1; padding: 8px; border: 1px solid #ddd; border-radius: 4px; font-size: 0.85rem;" id="shareUrlInput_${timestamp}">
                    <button onclick="copyCalcUrl_${timestamp}()" style="padding: 8px 12px; background: #2C5AA0; color: white; border: none; border-radius: 4px; cursor: pointer; white-space: nowrap;">Копировать</button>
                </div>
                <button onclick="sendCalcToEmail_${timestamp}()" style="width: 100%; padding: 10px; background: #0073E6; color: white; border: none; border-radius: 4px; cursor: pointer; font-weight: 500;">📧 Отправить на email</button>
                <button onclick="this.closest('.save-notification').remove()" style="position: absolute; top: 8px; right: 8px; background: none; border: none; font-size: 24px; cursor: pointer; color: #999; line-height: 1;">×</button>
            `;
            
            // Создаем функции для копирования и отправки
            window['copyCalcUrl_' + timestamp] = function() {
                const input = document.getElementById('shareUrlInput_' + timestamp);
                if (input) {
                    input.select();
                    document.execCommand('copy');
                    const btn = event.target;
                    btn.textContent = '✓';
                    btn.style.background = '#28a745';
                    setTimeout(() => {
                        btn.textContent = 'Копировать';
                        btn.style.background = '#2C5AA0';
                    }, 2000);
                }
            };
            
            window['sendCalcToEmail_' + timestamp] = function() {
                const email = prompt('Введите ваш email для отправки расчета:');
                if (email && email.includes('@')) {
                    const lastCalc = JSON.parse(localStorage.getItem('lastCalculation') || '{}');
                    const subject = encodeURIComponent(`Расчет стоимости: ${lastCalc.service || 'Геодезические работы'}`);
                    const body = encodeURIComponent(`Здравствуйте!\n\nПрошу отправить расчет стоимости для:\n${lastCalc.service || 'Не указано'}\n\nПредварительная стоимость: ${lastCalc.estimatedCost || 'Не рассчитано'}\n\nСсылка на расчет: ${lastCalc.shareUrl || shareUrl}\n\nС уважением`);
                    window.location.href = `mailto:amnis-info@yandex.ru?subject=${subject}&body=${body}`;
                } else if (email) {
                    alert('Пожалуйста, введите корректный email');
                }
            };
            
            document.body.appendChild(notification);
            
            setTimeout(() => {
                notification.style.opacity = '1';
                notification.style.transform = 'translateX(0)';
            }, 100);
            
            setTimeout(() => {
                notification.style.opacity = '0';
                notification.style.transform = 'translateX(100%)';
                setTimeout(() => {
                    if (notification.parentNode) {
                        notification.parentNode.removeChild(notification);
                    }
                }, 300);
            }, 10000);
        }
    }
})();
