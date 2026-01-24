export const translations = {
    uz: {
        // Sidebar
        dashboard: "Asosiy oyna",
        inventory: "Invertar",
        warehouse: "Ombor",
        users: "Foydalanuvchilar",
        inventory_dates: "Invertardan o'tkazish sanasi",
        profile: "Profil",
        inventory_check: "Inventarizatsiyadan o'tkazish",
        report: "Hisobot",
        requests: "So'rovlar",
        logs: "Loglar (Tarix)",
        guard_panel: "Qoravul Paneli",
        logout: "Chiqish",

        // General
        search: "Qidirish...",
        search_placeholder: "Qidirish (Nomi, Model, Seriya, INN, JSHShIR)...",
        filter: "Filter",
        add_new: "Yangi qo'shish",
        attach_warehouse: "Ombordan biriktirish",
        actions: "Amallar",
        save: "Saqlash",
        cancel: "Bekor qilish",
        select: "Tanlash",
        all: "Barchasi",
        loading: "Yuklanmoqda...",
        no_data: "Ma'lumot topilmadi",
        export_excel: "Excelga yuklash",

        // Inventory Page
        inventory_title: "Invertar",
        inventory_subtitle: "Barcha jihozlar ro'yxati",
        repair_subtitle: "Ta'mir talab jihozlar",

        // Table Headers
        order_number: "T/r",
        name: "Nomi",
        model: "Model",
        inn: "INN",
        purchase_year: "Sotib olingan yili",
        purchase_date: "Xarid qilingan sana",
        price: "Narxi",
        current_value: "Narxi", // Changed from Xozirgi qiymati as per user request
        building: "Bino",
        location: "Joylashuv",
        status: "Holati",
        image: "Rasm",
        quantity: "Soni",

        // Warehouse Header Specifics
        arrival_date: "Kelgan kuni",
        manufacture_year: "Ishlab chiqarilgan",
        supplier: "Yetkazib beruvchi",
        warranty: "Kafolat",

        // Statuses
        status_working: "Ishchi",
        status_repair: "Ta'mir talab",
        status_written_off: "Ro'yxatdan chiqarilgan",
        status_broken: "Buzilgan",

        // Modals
        edit_item: "Jihozni tahrirlash",
        add_item: "Yangi jihoz qo'shish",
        basic_info: "Asosiy ma'lumotlar",
        serial_number: "Seriya raqami",
        category: "Kategoriya",
        assigned_to: "Javobgar shaxs",
        upload_images: "Rasmlarni yuklash",
        select_images: "Rasmlarni tanlash uchun bosing",
        min_images: "Kamida 4 ta rasm yuklang",

        // Warehouse Modal specific
        warehouse_add: "Omborga qo'shish",
        warehouse_edit: "Ombor jihozini tahrirlash",

        // Attach Modal
        select_from_warehouse: "Ombordan jihoz tanlash",
        available: "mavjud",

        // Warehouse Page
        warehouse_filter_all: "Barchasi",
        warehouse_filter_unassigned: "Birikmaganlar",
        warehouse_filter_pending: "Kutilayotganlar",
        warehouse_delete_selected: "Tanlanganlarni o'chirish",
        warehouse_no_items: "Omborda jihozlar yo'q",
        warehouse_item_added: "Jihoz omborga qo'shildi",
        warehouse_item_updated: "Jihoz yangilandi",
        warehouse_items_deleted: "Jihozlar muvaffaqiyatli o'chirildi",
        confirm_delete_many: "Tanlangan {count} ta jihozni o'chirib yuborishni tasdiqlaysizmi?",

        // Inventory Dates Page
        inventory_dates_title: "Invertarizatsiya davri",
        inventory_dates_desc: "Belgilangan sanalar oralig'ida tizimda invertarizatsiya o'tkazilayotgani haqida barcha foydalanuvchilarga ogohlantirish ko'rsatiladi.",
        start_date: "Boshlash sanasi",
        end_date: "Tugash sanasi",
        save_and_publish: "Saqlash va E'lon qilish",
        saving: "Saqlanmoqda...",
        dates_saved: "Sanalar saqlandi va barchaga yuborildi",
        enter_dates_error: "Boshlash va tugash sanasini kiriting",

        // Inventory Check Page
        scan_title: "Inventarizatsiyadan o'tkazish",
        scan_subtitle: "Jihozlarni skaner qiling va tasdiqlang",
        scan_card_title: "Skanerlash",
        scan_card_desc: "Kamerani ishga tushirish uchun bosing",
        instructions_title: "Ko'rsatmalar",
        instruction_1: "Jihozning QR kodini kameraga to'g'rilang",
        instruction_2: "Jihoz ma'lumotlari chiqqach, uning holatini tekshiring",
        instruction_3: "\"Yangi rasm yuklash\" orqali jihozning hozirgi holatini rasmga oling",
        instruction_4: "\"Tasdiqlash\" tugmasini bosing",
        note_title: "Eslatma",
        note_desc: "Inventarizatsiyadan o'tgan jihozlar avtomatik tarzda \"O'tdi\" statusini oladi va sanasi yangilanadi.",

        // Inventory Report Page
        report_title: "Inventarizatsiya Hisoboti",
        total_checked: "Jami tekshirilgan jihozlar",
        checked_after: "{date} dan keyingi tekshiruvlar",
        checked_time: "Tekshirilgan vaqti",
        department_checked: "Inventar o'tkazgan bo'lim",
        no_matching_items: "Muvofiq jihozlar topilmadi",

        // Dashboard
        total_items: "Jami jihozlar",
        total_value: "Umumiy qiymat",
        repair_items: "Ta'mirdagi jihozlar",
        written_off_items: "Ro'yxatdan chiqarilgan",
        category_stats: "Kategoriyalar statistikasi",
        dashboard_subtitle: "Bugungi statistika va muhim o'zgarishlar",
        recent_activity: "So'nggi Harakatlar",
        no_data_yet: "Hozircha ma'lumot yo'q",

        // Notifications
        attention_new_requests: "Diqqat! Yangi So'rovlar",
        pending_requests_text: "Sizda {count} ta tasdiqlanmagan chiqish so'rovi bor.",
        later: "Keyinroq",
        view: "Ko'rish",

        // Activity Table
        in_warehouse: "Omborda",
        status_active: "Faol",
        status_in_repair: "Ta'mirda",
        status_written_off_short: "Hisobdan chiqarilgan",
        status_new: "Yangi",

        // Stats
        trend_vs_last_month: "o'tgan oyga nisbatan",
        trend_growth: "o'sish",
        trend_decrease: "kamaydi",
        trend_no_change: "o'zgarishsiz",
        active_users: "Faol foydalanuvchilar",

        // Modal Keys (Confirmation)
        confirm_delete_title_many: "O'chirishni tasdiqlang",
        confirm_delete_message_many: "{count} ta jihozni o'chirmoqchimisiz? Bu amalni ortga qaytarib bo'lmaydi!",
        confirm_delete_title_single: "Foydalanuvchini o'chirish",
        confirm_delete_message_single: "Rostdan ham bu foydalanuvchini o'chirmoqchimisiz?",
        yes_delete: "Ha, o'chirish",

        // Dashboard Trends
        trend_change: "O'zgarish",
        trend_no_change: "O'zgarishsiz",
        trend_growth: "O'sish",
        verified_coverage: "O'tganlar", // Verification coverage % label
        item_is_not_defined: "Xatolik: Jihoz topilmadi (Item not defined)",

        // User Roles
        role_admin: "Administrator",
        role_employee: "Xodim",
        role_accounter: "Hisobchi",
        role_warehouseman: "Omborchi",
        role_stat: "Kuzatuvchi"
    },
    oz: {
        // Sidebar
        dashboard: "Асосий ойна",
        inventory: "Инвентар",
        warehouse: "Омбор",
        users: "Фойдаланувчилар",
        inventory_dates: "Инвертардан ўтказиш санаси",
        profile: "Профиль",
        inventory_check: "Инвентаризациядан ўтказиш",
        report: "Ҳисобот",
        requests: "Сўровлар",
        logs: "Логлар (Тарих)",
        guard_panel: "Қоровул панели",
        logout: "Чиқиш",

        // General
        search: "Қидириш...",
        search_placeholder: "Қидириш (Номи, Модел, Серия, ИНН, ЖШШИР)...",
        filter: "Фильтр",
        add_new: "Янги қўшиш",
        attach_warehouse: "Омбордан бириктириш",
        actions: "Амаллар",
        save: "Сақлаш",
        cancel: "Бекор қилиш",
        select: "Танлаш",
        all: "Барчаси",
        loading: "Юкланмоқда...",
        no_data: "Маълумот топилмади",
        export_excel: "Excelга юклаш",

        // Inventory Page
        inventory_title: "Инвентар",
        inventory_subtitle: "Барча жиҳозлар рўйхати",
        repair_subtitle: "Таъмир талаб жиҳозлар",

        // Table Headers
        order_number: "Т/р",
        name: "Номи",
        model: "Модел",
        inn: "ИНН",
        purchase_year: "Сотиб олинган йили",
        purchase_date: "Харид қилинган сана",
        price: "Нархи",
        current_value: "Нархи", // Changed from Ҳозирги қиймати
        building: "Бино",
        location: "Жойлашув",
        status: "Ҳолати",
        image: "Расм",
        quantity: "Сони",

        // Warehouse Header Specifics
        arrival_date: "Келган куни",
        manufacture_year: "Ишлаб чиқарилган",
        supplier: "Етказиб берувчи",
        warranty: "Кафолат",

        // Statuses
        status_working: "Ишчи",
        status_repair: "Таъмир талаб",
        status_written_off: "Рўйхатдан чиқарилган",
        status_broken: "Бузилган",

        // Modals
        edit_item: "Жиҳозни таҳрирлаш",
        add_item: "Янги жиҳоз қўшиш",
        basic_info: "Асосий маълумотлар",
        serial_number: "Серия рақами",
        category: "Категория",
        assigned_to: "Жавобгар шахс",
        upload_images: "Расмларни юклаш",
        select_images: "Расмларни танлаш учун босинг",
        min_images: "Камида 4 та расм юкланг",

        // Warehouse Modal specific
        warehouse_add: "Омборга қўшиш",
        warehouse_edit: "Омбор жиҳозини таҳрирлаш",

        // Attach Modal
        select_from_warehouse: "Омбордан жиҳоз танлаш",
        available: "мавжуд",

        // Warehouse Page
        warehouse_filter_all: "Барчаси",
        warehouse_filter_unassigned: "Бирикмаганлар",
        warehouse_filter_pending: "Кутилаётганлар",
        warehouse_delete_selected: "Танланганларни ўчириш",
        warehouse_no_items: "Омборда жиҳозлар йўқ",
        warehouse_item_added: "Жиҳоз омборга қўшилди",
        warehouse_item_updated: "Жиҳоз янгиланди",
        warehouse_items_deleted: "Жиҳозлар муваффақиятли ўчирилди",
        confirm_delete_many: "Танланган {count} та жиҳозни ўчириб юборишни тасдиқлайсизми?",

        // Inventory Dates Page
        inventory_dates_title: "Инвертаризация даври",
        inventory_dates_desc: "Белгиланган саналар оралиғида тизимда инвертаризация ўтказилаётгани ҳақида барча фойдаланувчиларга огоҳлантириш кўрсатилади.",
        start_date: "Бошлаш санаси",
        end_date: "Тугаш санаси",
        save_and_publish: "Сақлаш ва Эълон қилиш",
        saving: "Сақланмоқда...",
        dates_saved: "Саналар сақланди ва барчага юборилди",
        enter_dates_error: "Бошлаш ва тугаш санасини киритинг",

        // Inventory Check Page
        scan_title: "Инвентаризациядан ўтказиш",
        scan_subtitle: "Жиҳозларни сканер қилинг ва тасдиқланг",
        scan_card_title: "Сканерлаш",
        scan_card_desc: "Камерани ишга тушириш учун босинг",
        instructions_title: "Кўрсатмалар",
        instruction_1: "Жиҳознинг QR кодини камерага тўғриланг",
        instruction_2: "Жиҳоз маълумотлари чиққач, унинг ҳолатини текширинг",
        instruction_3: "\"Янги расм юклаш\" орқали жиҳознинг ҳозирги ҳолатини расмга олинг",
        instruction_4: "\"Тасдиқлаш\" тугмасини босинг",
        note_title: "Эслатма",
        note_desc: "Инвентаризациядан ўтган жиҳозлар автоматик тарзда \"Ўтди\" статусини олади ва санаси янгиланади.",

        // Inventory Report Page
        report_title: "Инвентаризация Ҳисоботи",
        total_checked: "Жами текширилган жиҳозлар",
        checked_after: "{date} дан кейинги текширувлар",
        checked_time: "Текширилган вақти",
        department_checked: "Инвентар ўтказган бўлим",
        no_matching_items: "Мувофиқ жиҳозлар топилмади",

        // Dashboard
        total_items: "Жами жиҳозлар",
        total_value: "Умумий қиймат",
        repair_items: "Таъмирдаги жиҳозлар",
        written_off_items: "Рўйхатдан чиқарилган",
        category_stats: "Категориялар статистикаси",
        dashboard_subtitle: "Бугунги статистика ва муҳим ўзгаришлар",
        recent_activity: "Сўнгги Ҳаракатлар",
        no_data_yet: "Ҳозирча маълумот йўқ",

        // Notifications
        attention_new_requests: "Диққат! Янги Сўровлар",
        pending_requests_text: "Сизда {count} та тасдиқланмаган чиқиш сўрови бор.",
        later: "Кейинроқ",
        view: "Кўриш",

        // Activity Table
        in_warehouse: "Омборда",
        status_active: "Фаол",
        status_in_repair: "Таъмирда",
        status_written_off_short: "Ҳисобдан чиқарилган",
        status_new: "Янги",

        // Stats
        trend_vs_last_month: "ўтган ойга нисбатан",
        trend_growth: "ўсиш",
        trend_decrease: "камайди",
        trend_no_change: "ўзгаришсиз",
        active_users: "Фаол фойдаланувчилар",

        // Modal Keys (Confirmation)
        confirm_delete_title_many: "Ўчиришни тасдиқланг",
        confirm_delete_message_many: "{count} та жиҳозни ўчирмоқчимисиз? Бу амални ортга қайтариб бўлмайди!",
        confirm_delete_title_single: "Фойдаланувчини ўчириш",
        confirm_delete_message_single: "Ростдан ҳам бу фойдаланувчини ўчирмоқчимисиз?",
        yes_delete: "Ҳа, ўчириш",

        // Dashboard Trends
        trend_change: "Ўзгариш",
        trend_no_change: "Ўзгаришсиз",
        trend_growth: "Ўсиш",
        verified_coverage: "Ўтганлар",
        item_is_not_defined: "Хатолик: Жиҳоз топилмади",

        // User Roles
        role_admin: "Админ",
        role_employee: "Ходим",
        role_accounter: "Ҳисобчи",
        role_warehouseman: "Омборчи"
    },
    ru: {
        // Sidebar
        dashboard: "Панель управления",
        inventory: "Инвентарь",
        warehouse: "Склад",
        users: "Пользователи",
        inventory_dates: "Дата инвентаризации",
        profile: "Профиль",
        inventory_check: "Проверка инвентаря",
        report: "Отчет",
        requests: "Запросы",
        logs: "Логи (История)",
        guard_panel: "Панель охраны",
        logout: "Выйти",

        // General
        search: "Поиск...",
        search_placeholder: "Поиск (Название, Модель, Серия, ИНН, ПИНФЛ)...",
        filter: "Фильтр",
        add_new: "Добавить",
        attach_warehouse: "Прикрепить со склада",
        actions: "Действия",
        save: "Сохранить",
        cancel: "Отмена",
        select: "Выбрать",
        all: "Все",
        loading: "Загрузка...",
        no_data: "Данные не найдены",
        export_excel: "Скачать Excel",

        // Inventory Page
        inventory_title: "Инвентарь",
        inventory_subtitle: "Список всего оборудования",
        repair_subtitle: "Оборудование требующее ремонта",

        // Table Headers
        order_number: "№",
        name: "Название",
        model: "Модель",
        inn: "ИНН",
        purchase_year: "Год покупки",
        purchase_date: "Дата покупки",
        price: "Цена",
        current_value: "Цена", // Simplified from Текущая стоимость
        building: "Здание",
        location: "Расположение",
        status: "Статус",
        image: "Фото",
        quantity: "Кол-во",

        // Warehouse Header Specifics
        arrival_date: "Дата поступления",
        manufacture_year: "Год выпуска",
        supplier: "Поставщик",
        warranty: "Гарантия",

        // Statuses
        status_working: "Рабочее",
        status_repair: "В ремонте",
        status_written_off: "Списано",
        status_broken: "Сломано",

        // Modals
        edit_item: "Редактировать",
        add_item: "Добавить оборудование",
        basic_info: "Основная информация",
        serial_number: "Серийный номер",
        category: "Категория",
        assigned_to: "Ответственное лицо",
        upload_images: "Загрузить фото",
        select_images: "Нажмите, чтобы выбрать фото",
        min_images: "Загрузите минимум 4 фото",

        // Warehouse Modal specific
        warehouse_add: "Добавить на склад",
        warehouse_edit: "Редактировать складское",

        // Attach Modal
        select_from_warehouse: "Выбрать со склада",
        available: "доступно",

        // Warehouse Page
        warehouse_filter_all: "Все",
        warehouse_filter_unassigned: "Нераспределенные",
        warehouse_filter_pending: "Ожидающие",
        warehouse_delete_selected: "Удалить выбранные",
        warehouse_no_items: "На складе нет оборудования",
        warehouse_item_added: "Оборудование добавлено на склад",
        warehouse_item_updated: "Оборудование обновлено",
        warehouse_items_deleted: "Оборудование успешно удалено",
        confirm_delete_many: "Вы уверены, что хотите удалить выбранные {count} элементов?",

        // Inventory Dates Page
        inventory_dates_title: "Период инвентаризации",
        inventory_dates_desc: "Уведомление о проведении инвентаризации в системе в указанные даты будет показано всем пользователям.",
        start_date: "Дата начала",
        end_date: "Дата окончания",
        save_and_publish: "Сохранить и опубликовать",
        saving: "Сохранение...",
        dates_saved: "Даты сохранены и отправлены всем",
        enter_dates_error: "Введите дату начала и окончания",

        // Inventory Check Page
        scan_title: "Проведение инвентаризации",
        scan_subtitle: "Сканируйте оборудование и подтверждайте",
        scan_card_title: "Сканировать",
        scan_card_desc: "Нажмите, чтобы запустить камеру",
        instructions_title: "Инструкции",
        instruction_1: "Наведите камеру на QR-код оборудования",
        instruction_2: "Когда появятся данные оборудования, проверьте его состояние",
        instruction_3: "Сфотографируйте текущее состояние, нажав «Загрузить новое фото»",
        instruction_4: "Нажмите кнопку «Подтвердить»",
        note_title: "Примечание",
        note_desc: "Оборудование, прошедшее инвентаризацию, автоматически получает статус «Прошел», и дата обновляется.",

        // Inventory Report Page
        report_title: "Отчет инвентаризации",
        total_checked: "Всего проверено",
        checked_after: "Проверки после {date}",
        checked_time: "Время проверки",
        department_checked: "Отдел, проводивший инвентаризацию",
        no_matching_items: "Подходящее оборудование не найдено",

        // Dashboard
        total_items: "Всего оборудования",
        total_value: "Общая стоимость",
        repair_items: "В ремонте",
        written_off_items: "Списано",
        category_stats: "Статистика по категориям",
        dashboard_subtitle: "Статистика и важные изменения",
        recent_activity: "Последние действия",
        no_data_yet: "Пока нет данных",

        // Notifications
        attention_new_requests: "Внимание! Новые запросы",
        pending_requests_text: "У вас есть {count} неподтвержденных запросов на вывод.",
        later: "Позже",
        view: "Просмотреть",

        // Activity Table
        in_warehouse: "На складе",
        status_active: "Активен",
        status_in_repair: "В ремонте",
        status_written_off_short: "Списано",
        status_new: "Новое",

        // Stats
        trend_vs_last_month: "по сравнению с прошлым месяцем",
        trend_growth: "рост",
        trend_decrease: "снижение",
        trend_no_change: "без изменений",
        active_users: "Активные пользователи",

        // Modal Keys (Confirmation)
        confirm_delete_title_many: "Подтвердите удаление",
        confirm_delete_message_many: "Вы уверены, что хотите удалить {count} элементов? Это действие нельзя отменить!",
        confirm_delete_title_single: "Удаление пользователя",
        confirm_delete_message_single: "Вы действительно хотите удалить этого пользователя?",
        yes_delete: "Да, удалить",

        // Dashboard Trends
        trend_change: "Изменение",
        trend_no_change: "Без изменений",
        trend_growth: "Рост",
        verified_coverage: "Проверено",
        item_is_not_defined: "Ошибка: Оборудование не найдено",

        // User Roles
        role_admin: "Админ",
        role_employee: "Сотрудник",
        role_accounter: "Бухгалтер",
        role_warehouseman: "Кладовщик",
        role_stat: "Наблюдатель"
    }
};
