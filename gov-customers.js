// JavaScript для страницы госзаказчиков

document.addEventListener('DOMContentLoaded', function() {
    // Маска телефона
    const phoneInput = document.getElementById('contactPhone');
    if (phoneInput) {
        phoneInput.addEventListener('input', function(e) {
            let value = e.target.value.replace(/\D/g, '');
            if (value.length > 0) {
                if (value[0] !== '7' && value[0] !== '8') {
                    value = '7' + value;
                }
                if (value[0] === '8') {
                    value = '7' + value.slice(1);
                }
                let formatted = '+7 (';
                if (value.length > 1) {
                    formatted += value.slice(1, 4);
                }
                if (value.length >= 4) {
                    formatted += ') ' + value.slice(4, 7);
                }
                if (value.length >= 7) {
                    formatted += '-' + value.slice(7, 9);
                }
                if (value.length >= 9) {
                    formatted += '-' + value.slice(9, 11);
                }
                e.target.value = formatted;
            }
        });
    }
    
    // Organizations Select Dropdown
    const organizationsSelectBtn = document.getElementById('organizationsSelectBtn');
    const organizationsDropdown = document.getElementById('organizationsDropdown');
    const organizationsCountInput = document.getElementById('organizationsCount');
    const dropdownOptions = document.querySelectorAll('.dropdown-option');
    
    if (organizationsSelectBtn && organizationsDropdown) {
        // Toggle dropdown
        organizationsSelectBtn.addEventListener('click', function(e) {
            e.stopPropagation();
            organizationsDropdown.classList.toggle('active');
            organizationsSelectBtn.classList.toggle('active');
        });
        
        // Select option
        dropdownOptions.forEach(option => {
            option.addEventListener('click', function() {
                const value = this.getAttribute('data-value');
                const text = this.textContent;
                
                // Update hidden input
                if (organizationsCountInput) {
                    organizationsCountInput.value = value;
                }
                
                // Update button text
                const selectText = organizationsSelectBtn.querySelector('.select-text');
                if (selectText) {
                    selectText.textContent = text;
                }
                
                // Update selected state
                dropdownOptions.forEach(opt => opt.classList.remove('selected'));
                this.classList.add('selected');
                organizationsSelectBtn.classList.add('selected');
                
                // Close dropdown
                organizationsDropdown.classList.remove('active');
                organizationsSelectBtn.classList.remove('active');
            });
        });
        
        // Close dropdown when clicking outside
        document.addEventListener('click', function(e) {
            if (!organizationsSelectBtn.contains(e.target) && !organizationsDropdown.contains(e.target)) {
                organizationsDropdown.classList.remove('active');
                organizationsSelectBtn.classList.remove('active');
            }
        });
    }
    
    // Обработка формы запроса КП
    const kpForm = document.getElementById('kpRequestForm');
    if (kpForm) {
        kpForm.addEventListener('submit', async function(e) {
            // Не блокируем стандартную отправку формы через PHP
            // Форма отправляется на telegram.php
            
            // Дополнительная отправка в Telegram через JS (как резерв)
            try {
                const formData = new FormData(this);
                const organizationsCount = formData.get('organizationsCount');
                const organizationsText = organizationsCount ? 
                    (organizationsCount === '1' ? '1 организация' : 
                     organizationsCount === '2' ? '2 организации' : '3 организации') : 'Не выбрано';
                
                const data = {
                    deadlineDate: formData.get('deadlineDate'),
                    organizationsCount: organizationsCount,
                    documentationRequirements: formData.get('documentationRequirements'),
                    organizationName: formData.get('organizationName'),
                    contactPerson: formData.get('contactPerson'),
                    contactPhone: formData.get('contactPhone'),
                    contactEmail: formData.get('contactEmail')
                };
                
                // Отправка в Telegram (если настроено)
                if (typeof sendToTelegram === 'function') {
                    const message = `🎯 НОВЫЙ ЗАПРОС КП ДЛЯ ГОСЗАКУПКИ\n\n` +
                        `⏰ Срок подачи: ${data.deadlineDate}\n` +
                        `🏢 Количество организаций: ${organizationsText}\n` +
                        `📝 Требования к документации: ${data.documentationRequirements || 'Не указаны'}\n` +
                        `🏢 Организация заказчика: ${data.organizationName}\n` +
                        `👤 Контактное лицо: ${data.contactPerson}\n` +
                        `📞 Телефон: ${data.contactPhone}\n` +
                        `📧 Email: ${data.contactEmail}`;
                    
                    await sendToTelegram(message);
                }
            } catch (error) {
                console.log('Дополнительная отправка в Telegram не удалась, но форма отправлена через PHP');
            }
            
            // Показываем сообщение об успехе (будет перенаправление на thank-you.php)
            // alert('Ваш запрос принят! Наш специалист подготовит КП в соответствии с требованиями закупки и отправит его на указанный email в течение 2 часов. Для срочного получения КП мы можем связаться с вами по телефону.');
            
            // Очищаем форму
            this.reset();
            // Сбрасываем выпадающий список
            if (organizationsSelectBtn) {
                const selectText = organizationsSelectBtn.querySelector('.select-text');
                if (selectText) {
                    selectText.textContent = 'Выберите количество';
                }
                organizationsSelectBtn.classList.remove('selected');
            }
            dropdownOptions.forEach(opt => opt.classList.remove('selected'));
        });
    }
});


