// @ts-check

export default {
  translation: {
    appName: 'Fastify Boilerplate',
    flash: {
      session: {
        create: {
          success: 'You are logged in',
          error: 'Wrong email or password',
        },
        delete: {
          success: 'You are logged out',
        },
      },
      users: {
        create: {
          error: 'Failed to register',
          success: 'User registered successfully',
        },
        update: {
          error: 'Failed to update user',
          success: 'User updated successfully',
        },
        delete: {
          error: 'Failed to delete user',
          success: 'User deleted successfully',
        },
      },
      taskStatuses: {
        create: {
          error: 'Failed to create task status',
          success: 'Task status created successfully',
        },
        update: {
          error: 'Failed to update task status',
          success: 'Task status updated successfully',
        },
        delete: {
          error: 'Failed to delete task status',
          success: 'Task status deleted successfully',
        },
      },
      tasks: {
        create: {
          error: 'Failed to create task',
          success: 'Task created successfully',
        },
        update: {
          error: 'Failed to update task',
          success: 'Task updated successfully',
        },
        delete: {
          error: 'Failed to delete task',
          success: 'Task deleted successfully',
        },
      },
      authError: 'Access denied! Please login',
      validation: {
        name: 'Name is required',
        nameLength: 'Name must contain at least 1 character',
        statusId: 'Status is required',
      },
    },
    layouts: {
      application: {
        users: 'Users',
        taskStatuses: 'Task Statuses',
        tasks: 'Tasks',
        signIn: 'Login',
        signUp: 'Register',
        signOut: 'Logout',
      },
    },
    views: {
      session: {
        new: {
          signIn: 'Login',
          submit: 'Login',
        },
      },
      users: {
        id: 'ID',
        firstName: 'First name',
        lastName: 'Last name',
        email: 'Email',
        createdAt: 'Created at',
        new: {
          submit: 'Register',
          signUp: 'Register',
        },
        edit: {
          submit: 'Save',
          title: 'Edit user',
        },
      },
      taskStatuses: {
        title: 'Task Statuses',
        id: 'ID',
        name: 'Name',
        createdAt: 'Created at',
        actions: 'Actions',
        new: 'New Task Status',
        edit: 'Edit Task Status',
        delete: 'Delete',
        submit: 'Save',
      },
      tasks: {
        title: 'Tasks',
        id: 'ID',
        name: 'Name',
        description: 'Description',
        status: 'Status',
        creator: 'Creator',
        executor: 'Executor',
        createdAt: 'Created at',
        actions: 'Actions',
        new: 'New Task',
        edit: 'Edit Task',
        delete: 'Delete',
        submit: 'Save',
        selectStatus: 'Select Status',
        selectExecutor: 'Select Executor',
        noDescription: 'No description',
        noExecutor: 'Not assigned',
        details: 'Details',
      },
      welcome: {
        index: {
          hello: 'Hello from Hexlet!',
          description: 'Online programming school',
          more: 'Learn more',
        },
      },
    },
  },
};