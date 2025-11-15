// @ts-check

export default {
  translation: {
    appName: 'Fastify Шаблон',
    flash: {
      session: {
        create: {
          success: 'Вы залогинены',
          error: 'Неправильный email или пароль',
        },
        delete: {
          success: 'Вы разлогинены',
        },
      },
      users: {
        create: {
          error: 'Не удалось зарегистрировать пользователя. Проверьте правильность введенных данных.',
          success: 'Пользователь успешно зарегистрирован',
        },
        update: {
          error: 'Не удалось обновить пользователя. Проверьте правильность введенных данных.',
          success: 'Пользователь успешно изменён',
        },
        delete: {
          error: 'Не удалось удалить пользователя',
          success: 'Пользователь удалён',
        },
      },
      taskStatuses: {
        create: {
          error: 'Не удалось создать статус задачи',
          success: 'Статус задачи успешно создан',
        },
        update: {
          error: 'Не удалось обновить статус задачи',
          success: 'Статус задачи успешно обновлён',
        },
        delete: {
          error: 'Не удалось удалить статус задачи',
          success: 'Статус задачи удалён',
        },
      },
      tasks: {
        create: {
          error: 'Не удалось создать задачу',
          success: 'Задача успешно создана',
        },
        update: {
          error: 'Не удалось обновить задачу',
          success: 'Задача успешно обновлена',
        },
        delete: {
          error: 'Не удалось удалить задачу',
          success: 'Задача удалена',
        },
      },
      labels: {
        create: {
          error: 'Не удалось создать метку',
          success: 'Метка успешно создана',
        },
        update: {
          error: 'Не удалось обновить метку',
          success: 'Метка успешно обновлена',
        },
        delete: {
          error: 'Не удалось удалить метку',
          success: 'Метка удалена',
          linkedError: 'Метка связана с задачами и не может быть удалена',
        },
      },
      authError: 'Доступ запрещён! Пожалуйста, авторизируйтесь.',
      validation: {
        firstName: 'Имя обязательно для заполнения',
        lastName: 'Фамилия обязательна для заполнения',
        email: 'Email обязателен для заполнения',
        password: 'Пароль должен содержать минимум 3 символа',
        emailFormat: 'Введите корректный email адрес',
        passwordLength: 'Пароль должен содержать минимум 3 символа',
        firstNameLength: 'Имя должно содержать минимум 1 символ',
        lastNameLength: 'Фамилия должна содержать минимум 1 символ',
        name: 'Название обязательно для заполнения',
        nameLength: 'Название должно содержать минимум 1 символ',
        statusId: 'Статус обязателен для выбора',
      },
    },
      layouts: {
        application: {
          users: 'Пользователи',
          taskStatuses: 'Статусы',
          tasks: 'Задачи',
          labels: 'Метки',
          signIn: 'Вход',
          signUp: 'Регистрация',
          signOut: 'Выход',
        },
      },
    views: {
      session: {
        new: {
          signIn: 'Вход',
          submit: 'Войти',
          email: 'Email',
          password: 'Пароль',
        },
      },
      users: {
        id: 'ID',
        fullName: 'Полное имя',
        firstName: 'Имя',
        lastName: 'Фамилия',
        email: 'Email',
        password: 'Пароль',
        createdAt: 'Дата создания',
        actions: 'Действия',
        editButton: 'Изменить',
        deleteButton: 'Удалить',
        new: {
          submit: 'Сохранить',
          signUp: 'Регистрация',
        },
        edit: {
          submit: 'Изменить',
          title: 'Редактирование пользователя',
        },
      },
      taskStatuses: {
        title: 'Статусы',
        id: 'ID',
        name: 'Наименование',
        createdAt: 'Дата создания',
        actions: 'Действия',
        new: 'Создать статус',
        edit: 'Изменение статуса',
        delete: 'Удалить',
        submit: 'Создать',
      },
      tasks: {
        title: 'Задачи',
        id: 'ID',
        name: 'Наименование',
        description: 'Описание',
        status: 'Статус',
        creator: 'Автор',
        executor: 'Исполнитель',
        labels: 'Метки',
        createdAt: 'Дата создания',
        actions: 'Действия',
        new: 'Создание задачи',
        edit: 'Изменение задачи',
        delete: 'Удалить',
        submit: 'Создать',
        selectStatus: 'Выберите статус',
        selectExecutor: 'Выберите исполнителя',
        noDescription: 'Нет описания',
        noExecutor: 'Не назначен',
        details: 'Детали',
        filter: 'Показать',
        reset: 'Сбросить',
        allStatuses: 'Все статусы',
        allExecutors: 'Все исполнители',
        allLabels: 'Все метки',
        allTasks: 'Все задачи',
        createdByMe: 'Только мои задачи',
        myTasks: 'Мои задачи',
      },
      labels: {
        title: 'Метки',
        id: 'ID',
        name: 'Наименование',
        tasksCount: 'Количество задач',
        createdAt: 'Дата создания',
        actions: 'Действия',
        new: 'Создать метку',
        edit: 'Изменение метки',
        delete: 'Удалить',
        submit: 'Создать',
        tasksLinked: 'Эта метка связана с {{count}} задачей (задачами)',
      },
      welcome: {
        index: {
          hello: 'Привет от Хекслета!',
          description: 'Практические курсы по программированию',
          more: 'Узнать Больше',
        },
      },
    },
  },
};