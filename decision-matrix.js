/**
 * Класс для управления матрицей решений
 * Отвечает за хранение и обработку матричных данных
 */
class DecisionMatrix {
    /**
     * Конструктор класса
     * @param {number} strategiesCount - количество стратегий
     * @param {number} statesCount - количество состояний природы
     */
    constructor(strategiesCount = 4, statesCount = 5) {
        this.strategiesCount = strategiesCount;
        this.statesCount = statesCount;
        this.data = [];
        this.strategies = [];
        this.states = [];
        this.initialize();
    }

    /**
     * Инициализация матрицы с базовыми значениями
     */
    initialize() {
        // Генерация названий стратегий (A, B, C, ...)
        this.strategies = Array.from({ length: this.strategiesCount }, 
            (_, i) => `Регион ${String.fromCharCode(65 + i)}`);
        
        // Генерация названий состояний природы
        this.states = Array.from({ length: this.statesCount }, 
            (_, j) => `Показатель ${j + 1}`);
        
        // Инициализация матрицы нулями
        this.data = Array(this.strategiesCount).fill().map(() => 
            Array(this.statesCount).fill(0));
    }

    /**
     * Обновление размеров матрицы
     * @param {number} strategiesCount - новое количество стратегий
     * @param {number} statesCount - новое количество состояний
     */
    updateDimensions(strategiesCount, statesCount) {
        this.strategiesCount = strategiesCount;
        this.statesCount = statesCount;
        this.initialize();
    }

    /**
     * Обновление значения в матрице
     * @param {number} i - индекс строки (стратегии)
     * @param {number} j - индекс столбца (состояния)
     * @param {number} value - новое значение
     * @returns {number} - обновленное значение
     */
    updateValue(i, j, value) {
        const val = parseFloat(value);
        if (!this.data[i]) {
            this.data[i] = [];
        }
        this.data[i][j] = isNaN(val) ? 0 : val;
        return this.data[i][j];
    }

    /**
     * Получение минимального значения в строке
     * @param {number} rowIndex - индекс строки
     * @returns {number} - минимальное значение
     */
    getRowMin(rowIndex) {
        if (!this.data[rowIndex]) return 0;
        return Math.min(...this.data[rowIndex]);
    }

    /**
     * Получение максимального значения в строке
     * @param {number} rowIndex - индекс строки
     * @returns {number} - максимальное значение
     */
    getRowMax(rowIndex) {
        if (!this.data[rowIndex]) return 0;
        return Math.max(...this.data[rowIndex]);
    }

    /**
     * Получение максимального значения в столбце
     * @param {number} colIndex - индекс столбца
     * @returns {number} - максимальное значение
     */
    getColumnMax(colIndex) {
        let max = -Infinity;
        for (let i = 0; i < this.strategiesCount; i++) {
            if (this.data[i] && this.data[i][colIndex] > max) {
                max = this.data[i][colIndex];
            }
        }
        return max === -Infinity ? 0 : max;
    }

    /**
     * Валидация матрицы
     * @returns {boolean} - true если матрица заполнена корректно
     */
    validate() {
        return this.data.every(row => 
            row && row.every(cell => !isNaN(cell) && cell !== undefined && cell !== null)
        );
    }

    /**
     * Загрузка демонстрационных данных
     * @returns {object} - информация о загруженных данных
     */
    loadExampleData() {
        // Пример данных для 4 регионов и 4 показателей
        const exampleData = [
            [713, 839, 1007, 1133, 850],   
            [857, 806, 974, 1100, 920],    
            [1049, 998, 930, 1056, 880],   
            [1193, 1142, 1074, 1023, 950], 
        ];

        const regionNames = [
            'Регион1', 
            'Регион2', 
            'Регион3', 
            'Регион4', 
        ];

        const indicatorNames = [
            'Индикатор1', 
            'Индикатор2', 
            'Индикатор3', 
            'Индикатор4', 
        ];

        // Обновление размеров и данных
        this.strategiesCount = 4;
        this.statesCount = 4;
        this.strategies = regionNames;
        this.states = indicatorNames;
        this.data = exampleData;

        return {
            strategiesCount: this.strategiesCount,
            statesCount: this.statesCount,
            strategies: this.strategies,
            states: this.states,
            data: this.data
        };
    }

    /**
     * Получение данных матрицы для отображения
     * @returns {object} - структурированные данные матрицы
     */
    getMatrixData() {
        return {
            strategies: this.strategies,
            states: this.states,
            data: this.data,
            dimensions: {
                strategies: this.strategiesCount,
                states: this.statesCount
            }
        };
    }

    /**
     * Очистка матрицы
     */
    clear() {
        this.data = Array(this.strategiesCount).fill().map(() => 
            Array(this.statesCount).fill(0));
    }
}