/**
 * Менеджер пользовательского интерфейса
 * Отвечает за все взаимодействия с DOM
 */
class UIManager {
    constructor() {
        this.stepIndicatorDots = document.querySelectorAll('.step-dot');
        this.initializeEventListeners();
    }

    /**
     * Инициализация обработчиков событий
     */
    initializeEventListeners() {
        // Обработчик закрытия модального окна
        const modal = document.getElementById('criteria-modal');
        if (modal) {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    this.closeModal();
                }
            });
        }

        // Обработчики для точек индикатора шагов
        this.stepIndicatorDots.forEach((dot, index) => {
            dot.addEventListener('click', () => {
                // Можно добавить функциональность перехода по клику на точки
                console.log(`Переход к шагу ${index + 1}`);
            });
        });
    }

    /**
     * Обновление индикатора текущего шага
     * @param {number} currentStep - текущий шаг (1, 2, 3)
     */
    updateStepIndicator(currentStep) {
        this.stepIndicatorDots.forEach((dot, index) => {
            if (index + 1 === currentStep) {
                dot.classList.add('active');
            } else {
                dot.classList.remove('active');
            }
        });
    }

    /**
     * Создание HTML для матрицы
     * @param {DecisionMatrix} matrix - матрица решений
     * @returns {string} - HTML код таблицы
     */
    createMatrixHTML(matrix) {
        let html = '<thead><tr><th>Стратегии / Состояния</th>';
        
        // Заголовки состояний природы
        for (let j = 0; j < matrix.statesCount; j++) {
            html += `<th title="${matrix.states[j]}">${matrix.states[j]}</th>`;
        }
        html += '</tr></thead><tbody>';
        
        // Строки стратегий
        for (let i = 0; i < matrix.strategiesCount; i++) {
            html += `<tr><td><strong title="${matrix.strategies[i]}">${matrix.strategies[i]}</strong></td>`;
            
            for (let j = 0; j < matrix.statesCount; j++) {
                const value = matrix.data[i] && matrix.data[i][j] !== undefined ? matrix.data[i][j] : '';
                html += `<td><input type="number" value="${value}" 
                           data-row="${i}" data-col="${j}"
                           placeholder="0" step="0.01"></td>`;
            }
            html += '</tr>';
        }
        html += '</tbody>';
        
        return html;
    }

    /**
     * Создание полей для ввода вероятностей
     * @param {DecisionMatrix} matrix - матрица решений
     * @param {Array} probabilities - текущие вероятности
     * @returns {string} - HTML код полей ввода
     */
    createProbabilityInputs(matrix, probabilities) {
        let html = '';
        for (let j = 0; j < matrix.statesCount; j++) {
            const probValue = probabilities[j] !== undefined ? 
                probabilities[j] : (1 / matrix.statesCount).toFixed(3);
            
            html += `
                <div class="prob-row">
                    <label for="prob-${j}" title="${matrix.states[j]}">
                        ${matrix.states[j]}:
                    </label>
                    <input type="number" id="prob-${j}" 
                           min="0" max="1" step="0.01" 
                           value="${probValue}"
                           data-state="${j}">
                    <div class="prob-visual" style="
                        display: inline-block;
                        width: 100px;
                        height: 8px;
                        background: #e2e8f0;
                        margin-left: 10px;
                        vertical-align: middle;
                    ">
                        <div style="
                            width: ${probValue * 100}%;
                            height: 100%;
                            background: #3182ce;
                        "></div>
                    </div>
                </div>
            `;
        }
        return html;
    }

    /**
     * Обновление отображения суммы вероятностей
     * @param {number} sum - текущая сумма вероятностей
     */
    updateProbabilitySum(sum) {
        const probSumElement = document.getElementById('prob-sum');
        if (probSumElement) {
            const roundedSum = Math.round(sum * 1000) / 1000;
            probSumElement.textContent = `Сумма: ${roundedSum}`;
            
            if (Math.abs(sum - 1) < 0.001) {
                probSumElement.style.color = '#38a169';
                probSumElement.innerHTML += ' ✓';
            } else if (Math.abs(sum - 1) < 0.01) {
                probSumElement.style.color = '#d69e2e';
            } else {
                probSumElement.style.color = '#e53e3e';
            }
        }
    }

    /**
     * Отображение модального окна с информацией
     * @param {string} title - заголовок модального окна
     * @param {string} content - содержимое модального окна
     */
    showModal(title, content) {
        const modal = document.getElementById('criteria-modal');
        const titleElement = document.getElementById('modal-criterion-name');
        const contentElement = document.getElementById('modal-criterion-description');
        
        if (modal && titleElement && contentElement) {
            titleElement.textContent = title;
            contentElement.innerHTML = content;
            modal.style.display = 'flex';
            document.body.style.overflow = 'hidden';
        }
    }

    /**
     * Закрытие модального окна
     */
    closeModal() {
        const modal = document.getElementById('criteria-modal');
        if (modal) {
            modal.style.display = 'none';
            document.body.style.overflow = 'auto';
        }
    }

    /**
     * Отображение ошибки
     * @param {string} message - сообщение об ошибке
     * @param {string} type - тип ошибки (error/warning/info)
     */
    showError(message, type = 'error') {
        // Создаем временное уведомление
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.innerHTML = `
            <div class="notification-content">
                <i class="fas ${this.getIconForType(type)}"></i>
                <span>${message}</span>
            </div>
        `;
        
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: ${this.getColorForType(type)};
            color: white;
            padding: 12px 20px;
            border-radius: 4px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.2);
            z-index: 10000;
            animation: slideIn 0.3s ease;
        `;
        
        document.body.appendChild(notification);
        
        // Автоматическое удаление через 5 секунд
        setTimeout(() => {
            notification.style.animation = 'slideOut 0.3s ease';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }, 5000);
    }

    /**
     * Получение иконки для типа уведомления
     * @param {string} type - тип уведомления
     * @returns {string} - класс иконки FontAwesome
     */
    getIconForType(type) {
        switch(type) {
            case 'error': return 'fa-exclamation-circle';
            case 'warning': return 'fa-exclamation-triangle';
            case 'info': return 'fa-info-circle';
            case 'success': return 'fa-check-circle';
            default: return 'fa-info-circle';
        }
    }

    /**
     * Получение цвета для типа уведомления
     * @param {string} type - тип уведомления
     * @returns {string} - цвет в формате HEX
     */
    getColorForType(type) {
        switch(type) {
            case 'error': return '#e53e3e';
            case 'warning': return '#d69e2e';
            case 'info': return '#3182ce';
            case 'success': return '#38a169';
            default: return '#3182ce';
        }
    }

    /**
     * Отображение результатов анализа
     * @param {Array} recommendations - рекомендации критериев
     * @param {object} frequency - частотный анализ
     * @param {object} final - итоговая рекомендация
     * @param {string} analysisType - тип анализа
     */
    showResults(recommendations, frequency, final, analysisType) {
        let html = this.generateResultsHTML(recommendations, frequency, final, analysisType);
        document.getElementById('results-container').innerHTML = html;
    }

    /**
     * Генерация HTML для отображения результатов
     * @param {Array} recommendations - рекомендации критериев
     * @param {object} frequency - частотный анализ
     * @param {object} final - итоговая рекомендация
     * @param {string} analysisType - тип анализа
     * @returns {string} - HTML код результатов
     */
    generateResultsHTML(recommendations, frequency, final, analysisType) {
    let html = '<div class="results-container">';
    
    // Отображение рекомендаций по каждому критерию
    recommendations.forEach(rec => {
        const isUndefined = rec.strategy === 'Не определено';
        html += `
            <div class="criterion-result ${isUndefined ? 'undefined-result' : ''}">
                <div class="criterion-info">
                    <div class="criterion-name">${rec.criterion}</div>
                    <div class="info-icon" data-criterion="${rec.type}" 
                         title="Информация о методе расчета">
                        <i class="fas fa-info-circle"></i>
                    </div>
                </div>
                <div class="recommended-strategy ${isUndefined ? 'undefined' : ''}">
                    ${rec.strategy}
                </div>
            </div>
        `;
    });
    
    html += '</div>';
    html += this.generateFrequencyHTML(frequency);
    html += this.generateFinalHTML(final, analysisType);
    
    return html;
}
    /**
     * Генерация HTML для частотного анализа
     * @param {object} frequency - частотный анализ
     * @returns {string} - HTML код частотного анализа
     */
    generateFrequencyHTML(frequency) {
        let html = '<div class="summary-box">';
        html += '<div class="summary-title">Частотный анализ рекомендаций</div>';
        
        if (Object.keys(frequency).length === 0) {
            html += '<p style="text-align: center; color: #718096; padding: 20px;">Не удалось определить рекомендации по критериям</p>';
        } else {
            html += '<div class="strategy-frequency">';
            const entries = Object.entries(frequency);
            entries.sort((a, b) => b[1] - a[1]);
            
            entries.forEach(([strategy, count]) => {
                const percentage = (count / entries.reduce((sum, [_, c]) => sum + c, 0) * 100).toFixed(1);
                html += `
                    <div class="frequency-item">
                        <div class="strategy-name">${strategy}</div>
                        <div class="frequency-count">${count}</div>
                        <div style="font-size: 0.8rem; color: #718096;">
                            ${percentage}% рекомендаций
                        </div>
                    </div>
                `;
            });
            html += '</div>';
        }
        html += '</div>';
        return html;
    }

    /**
     * Генерация HTML для итоговой рекомендации
     * @param {object} final - итоговая рекомендация
     * @param {string} analysisType - тип анализа
     * @returns {string} - HTML код итоговой рекомендации
     */
    generateFinalHTML(final, analysisType) {
        let html = '<div class="final-recommendation">';
        
        if (final.strategy) {
            const confidenceColor = {
                'high': '#38a169',
                'medium': '#d69e2e',
                'low': '#e53e3e'
            }[final.confidence] || '#718096';
            
            html += `
                <h3 style="color: #2d3748; margin-bottom: 12px; font-size: 1.1rem;">
                    ИТОГОВАЯ РЕКОМЕНДАЦИЯ
                </h3>
                <div class="final-strategy">${final.strategy}</div>
                <p style="margin: 8px 0; color: #4a5568; font-size: 0.95rem;">
                    Рекомендована ${final.frequency} раз из ${final.total} критериев
                </p>
                <p style="color: #4a5568; font-size: 0.95rem;">
                    Уровень поддержки: 
                    <strong style="color: ${confidenceColor};">${final.percentage}%</strong> 
                    (${this.getConfidenceText(final.confidence)})
                </p>
            `;
            
            if (final.hasTie) {
                html += `
                    <p style="margin-top: 8px; color: #d69e2e; font-size: 0.9rem;">
                        <i class="fas fa-exclamation-triangle"></i>
                        Обнаружена ничья между стратегиями: ${final.alternatives.join(', ')}
                    </p>
                `;
            }
        } else {
            html += `
                <h3 style="color: #2d3748; margin-bottom: 12px; font-size: 1.1rem;">
                    ИТОГОВАЯ РЕКОМЕНДАЦИЯ
                </h3>
                <div class="final-strategy" style="color: #e53e3e;">
                    Не удалось определить
                </div>
                <p style="margin: 8px 0; color: #4a5568; font-size: 0.95rem;">
                    Критерии не смогли дать однозначной рекомендации
                </p>
            `;
        }
        
        html += `
            <p style="margin-top: 12px; color: #718096; font-size: 0.85rem; font-style: italic;">
                Анализ выполнен в условиях 
                ${analysisType === 'uncertainty' ? 'полной неопределенности' : 'риска (вероятностная модель)'}
            </p>
        `;
        
        html += '</div>';
        return html;
    }

    /**
     * Получение текстового описания уровня уверенности
     * @param {string} confidence - уровень уверенности
     * @returns {string} - текстовое описание
     */
    getConfidenceText(confidence) {
        const texts = {
            'high': 'высокая уверенность',
            'medium': 'средняя уверенность',
            'low': 'низкая уверенность'
        };
        return texts[confidence] || 'неопределенная уверенность';
    }

    /**
     * Обновление визуализации вероятностей
     */
    updateProbabilityVisualization() {
        document.querySelectorAll('.prob-visual').forEach(visual => {
            const input = visual.previousElementSibling;
            if (input && input.value) {
                const value = parseFloat(input.value) || 0;
                const bar = visual.querySelector('div');
                if (bar) {
                    bar.style.width = `${Math.min(value * 100, 100)}%`;
                }
            }
        });
    }

    /**
     * Добавление CSS анимаций
     */
    addCSSAnimations() {
        if (!document.getElementById('ui-animations')) {
            const style = document.createElement('style');
            style.id = 'ui-animations';
            style.textContent = `
                @keyframes slideIn {
                    from { transform: translateX(100%); opacity: 0; }
                    to { transform: translateX(0); opacity: 1; }
                }
                @keyframes slideOut {
                    from { transform: translateX(0); opacity: 1; }
                    to { transform: translateX(100%); opacity: 0; }
                }
            `;
            document.head.appendChild(style);
        }
    }
}