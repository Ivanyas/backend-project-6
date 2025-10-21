// @ts-check

export default {
  translation: {
    appName: 'Fastify Шаблон',
    flash: {
      session: {
        create: {
          success: 'Вы успешно вошли в систему',
          error: 'Неправильный email или пароль',
        },
        delete: {
          success: 'Вы успешно вышли из системы',
        },
      },
      users: {
        create: {
          error: 'Не удалось зарегистрировать пользователя. Проверьте правильность введенных данных.',
          success: 'Пользователь успешно зарегистрирован',
        },
        update: {
          error: 'Не удалось обновить пользователя. Проверьте правильность введенных данных.',
          success: 'Пользователь успешно обновлён',
        },
        delete: {
          error: 'Не удалось удалить пользователя',
          success: 'Пользователь удалён',
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
      },
    },
    layouts: {
      application: {
        users: 'Пользователи',
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
        },
      },
      users: {
        id: 'ID',
        firstName: 'Имя',
        lastName: 'Фамилия',
        email: 'Email',
        createdAt: 'Дата создания',
        new: {
          submit: 'Сохранить',
          signUp: 'Регистрация',
        },
        edit: {
          submit: 'Сохранить',
          title: 'Редактирование пользователя',
        },
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