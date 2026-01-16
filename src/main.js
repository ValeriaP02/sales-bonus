/**
 * Функция для расчета выручки
 * @param purchase запись о покупке
 * @param _product карточка товара
 * @returns {number}
 */

function calculateSimpleRevenue(purchase, _product) {
    // @TODO: Расчёт прибыли от операции
    const discountCoefficient = 1 - (purchase.discount / 100);
    const revenue = purchase.sale_price * purchase.quantity * discountCoefficient;
    return revenue;
}

/**
 * Функция для расчета бонусов
 * @param index порядковый номер в отсортированном массиве
 * @param total общее число продавцовconst 
 * @param seller карточка продавца
 * @returns {number}
 */

function calculateBonusByProfit(index, total, seller) {
    // @TODO: Расчёт бонуса от позиции в рейтинге
    if (index === 0) { // Первый
        return seller.profit * 0.15;
    } else if (index === 1 || index === 2) { // Второй или третий
        return seller.profit * 0.10;
    } else if (index === total - 1) { // Последний
        return 0;
    } else { // Для всех остальных
        return seller.profit * 0.05;
    }
}

/**
 * Функция для анализа данных продаж
 * @param data
 * @param options
 * @returns {{revenue, top_products, bonus, name, sales_count, profit, seller_id}[]}
 */

function analyzeSalesData(data, options) {
    // @TODO: Проверка входных данных
    if (
        !data
        || !data.sellers
        || !data.products
        || !data.purchase_records
        || !Array.isArray(data.sellers)
        || !Array.isArray(data.products)
        || !Array.isArray(data.purchase_records)
        || data.sellers.length === 0
        || data.products.length === 0
        || data.purchase_records.length === 0
    ) {
        throw new Error('Некорректные входные данные');
    }

    // @TODO: Проверка наличия опций
    if (
        typeof options !== 'object' ||
        typeof options.calculateRevenue !== 'function' ||
        typeof options.calculateBonus !== 'function'
    ) {
        throw new Error('Некорректные опции');
    }

    const { calculateRevenue, calculateBonus } = options;

    // @TODO: Подготовка промежуточных данных для сбора статистики
    const sellerIndex = {};
    data.sellers.forEach(seller => {
        sellerIndex[seller.id] = {
            id: seller.id,
            name: `${seller.first_name} ${seller.last_name}`,
            revenue: 0,
            profit: 0,
            sales_count: 0,
            products_sold: {},
            bonus: 0,
            top_products: [],
        };
    });

    const productIndex = {};
    data.products.forEach(product => {
        productIndex[product.sku] = product;
    });

    // @TODO: Расчёт выручки и прибыли для каждого продавца
    data.purchase_records.forEach(record => { // чек
        const seller = sellerIndex[record.seller_id]; // продавец
        if (!seller) {
            return;
        }

        seller.sales_count += 1; // увеличить количество продаж 
        seller.revenue += record.total_amount; // увеличить общую сумму выручки всех продаж

        record.items.forEach(item => { // товар
            const product = productIndex[item.sku];
            if (!product) {
                return;
            }

            const cost = product.purchase_price * item.quantity; // себестоимость
            const revenue = calculateRevenue(item, product); // выручка
            const profit = revenue - cost; // прибыль

            seller.profit += profit;  // увеличить общую накопленную прибыль (profit) у продавца 

            // учёт количества проданных товаров
            if (!seller.products_sold[item.sku]) {
                seller.products_sold[item.sku] = 0;
            }
            seller.products_sold[item.sku] += item.quantity;
        });
    });

    // @TODO: Сортировка продавцов по прибыли
    const sellersArray = Object.values(sellerIndex);
    sellersArray.sort((a, b) => b.profit - a.profit);
    const totalSellers = sellersArray.length;

    // @TODO: Назначение премий на основе ранжирования
    sellersArray.forEach((seller, index) => {
        // считаем бонус
        seller.bonus = calculateBonus(index, totalSellers, seller);

        // формируем топ-10 товаров
        const productsArray = Object.entries(seller.products_sold).map(([sku, qty]) => ({ sku, quantity: qty }));
        productsArray.sort((a, b) => b.quantity - a.quantity);
        seller.top_products = productsArray.slice(0, 10);
    });

    // @TODO: Подготовка итоговой коллекции с нужными полями
    return sellersArray.map(seller => ({
        seller_id: seller.id,
        name: seller.name,
        revenue: +seller.revenue.toFixed(2),
        profit: +seller.profit.toFixed(2),
        sales_count: seller.sales_count,
        top_products: seller.top_products,
        bonus: +seller.bonus.toFixed(2),
    }));
}
