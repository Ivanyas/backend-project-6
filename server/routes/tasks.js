// @ts-check

import i18next from 'i18next';

export default (app) => {
  app
    .get('/tasks', { name: 'tasks' }, async (req, reply) => {
      const tasks = await app.objection.models.task.query()
        .withGraphFetched('[status, creator, executor]')
        .orderBy('created_at', 'desc');
      reply.render('tasks/index', { tasks, currentUser: req.user || null });
      return reply;
    })
    .get('/tasks/new', { name: 'newTask', preValidation: app.authenticate }, async (req, reply) => {
      const task = new app.objection.models.task();
      const statuses = await app.objection.models.taskStatus.query();
      const users = await app.objection.models.user.query();
      const labels = await app.objection.models.label.query();
      reply.render('tasks/new', { task, statuses, users, labels });
      return reply;
    })
    .get('/tasks/:id', { name: 'task' }, async (req, reply) => {
      const { id } = req.params;
      const task = await app.objection.models.task.query()
        .withGraphFetched('[status, creator, executor]')
        .findById(id);
      if (!task) {
        return reply.notFound();
      }
      reply.render('tasks/show', { task, currentUser: req.user || null });
      return reply;
    })
    .get('/tasks/:id/edit', { name: 'editTask', preValidation: app.authenticate }, async (req, reply) => {
      const { id } = req.params;
      const task = await app.objection.models.task.query()
        .withGraphFetched('[status, creator, executor, labels]')
        .findById(id);
      if (!task) {
        return reply.notFound();
      }
      
      // Only allow creator to edit task
      if (task.creatorId !== req.user.id) {
        req.flash('error', i18next.t('flash.authError'));
        return reply.redirect(app.reverse('tasks'));
      }
      
      const statuses = await app.objection.models.taskStatus.query();
      const users = await app.objection.models.user.query();
      const labels = await app.objection.models.label.query();
      reply.render('tasks/edit', { task, statuses, users, labels });
      return reply;
    })
    .post('/tasks', { preValidation: app.authenticate }, async (req, reply) => {
      const task = new app.objection.models.task();
      const data = { ...req.body.data };
      if (!data.description || data.description.trim() === '') {
        data.description = null;
      }
      if (!data.executorId || data.executorId === '') {
        data.executorId = null;
      }
      // Convert string IDs to integers
      if (data.statusId) {
        data.statusId = parseInt(data.statusId, 10);
      }
      if (data.executorId) {
        data.executorId = parseInt(data.executorId, 10);
      }
      task.$set(data);
      task.creatorId = req.user.id;
      
      // Manual validation
      const errors = {};
      if (!data.name || data.name.trim().length === 0) {
        errors.name = [{ message: i18next.t('flash.validation.name') }];
      }
      if (!data.statusId) {
        errors.statusId = [{ message: i18next.t('flash.validation.statusId') }];
      }

      if (Object.keys(errors).length > 0) {
        console.log('Validation errors:', errors);
        req.flash('error', i18next.t('flash.tasks.create.error'));
        const statuses = await app.objection.models.taskStatus.query();
        const users = await app.objection.models.user.query();
        const labels = await app.objection.models.label.query();
        reply.render('tasks/new', { task, statuses, users, labels, errors });
        return reply;
      }

      try {
        await task.$validate();
        const savedTask = await app.objection.models.task.query().insert(task);
        
        // Handle labels
        const labelIds = req.body.labelIds || [];
        if (Array.isArray(labelIds) && labelIds.length > 0) {
          const labelIdsArray = labelIds.map(id => parseInt(id, 10)).filter(id => !isNaN(id));
          if (labelIdsArray.length > 0) {
            await savedTask.$relatedQuery('labels').relate(labelIdsArray);
          }
        }
        
        req.flash('info', i18next.t('flash.tasks.create.success'));
        reply.redirect(app.reverse('tasks'));
      } catch (error) {
        console.log('Validation error:', error);
        
        const taskForForm = new app.objection.models.task();
        taskForForm.$set({
          name: data.name,
          description: data.description,
          statusId: data.statusId,
          executorId: data.executorId,
        });
        
        req.flash('error', i18next.t('flash.tasks.create.error'));
        const statuses = await app.objection.models.taskStatus.query();
        const users = await app.objection.models.user.query();
        const labels = await app.objection.models.label.query();
        reply.render('tasks/new', { task: taskForForm, statuses, users, labels, errors: {} });
      }

      return reply;
    })
    .patch('/tasks/:id', { preValidation: app.authenticate }, async (req, reply) => {
      const { id } = req.params;
      const task = await app.objection.models.task.query().findById(id);
      if (!task) {
        return reply.notFound();
      }
      
      // Only allow creator to update task
      if (task.creatorId !== req.user.id) {
        req.flash('error', i18next.t('flash.authError'));
        return reply.redirect(app.reverse('tasks'));
      }

      try {
        const data = { ...req.body.data };
        if (!data.description || data.description.trim() === '') {
          data.description = null;
        }
        if (!data.executorId || data.executorId === '') {
          data.executorId = null;
        }
        // Convert string IDs to integers
        if (data.statusId) {
          data.statusId = parseInt(data.statusId, 10);
        }
        if (data.executorId) {
          data.executorId = parseInt(data.executorId, 10);
        }
        task.$set(data);
        await task.$validate();
        await task.$query().patch(task);
        
        // Handle labels
        const labelIds = req.body.labelIds || [];
        if (Array.isArray(labelIds)) {
          // Remove all existing label relationships
          await task.$relatedQuery('labels').unrelate();
          
          // Add new label relationships
          const labelIdsArray = labelIds.map(id => parseInt(id, 10)).filter(id => !isNaN(id));
          if (labelIdsArray.length > 0) {
            await task.$relatedQuery('labels').relate(labelIdsArray);
          }
        }
        
        req.flash('info', i18next.t('flash.tasks.update.success'));
        reply.redirect(app.reverse('tasks'));
      } catch (error) {
        console.log('Error updating task:', error);
        task.$set(data);
        
        // Convert validation errors to user-friendly messages
        const errors = {};
        if (error.data) {
          Object.keys(error.data).forEach(key => {
            const fieldErrors = error.data[key];
            if (fieldErrors && fieldErrors.length > 0) {
              errors[key] = fieldErrors.map(err => {
                switch (err.keyword) {
                  case 'required':
                    return { message: i18next.t(`flash.validation.${key}`) };
                  case 'minLength':
                    return { message: i18next.t(`flash.validation.${key}Length`) };
                  default:
                    return { message: err.message };
                }
              });
            }
          });
        }
        
        req.flash('error', i18next.t('flash.tasks.update.error'));
        const statuses = await app.objection.models.taskStatus.query();
        const users = await app.objection.models.user.query();
        const labels = await app.objection.models.label.query();
        reply.render('tasks/edit', { task, statuses, users, labels, errors });
      }
      return reply;
    })
    .delete('/tasks/:id', { preValidation: app.authenticate }, async (req, reply) => {
      const { id } = req.params;
      const task = await app.objection.models.task.query().findById(id);
      if (!task) {
        return reply.notFound();
      }
      
      // Only allow creator to delete task
      if (task.creatorId !== req.user.id) {
        req.flash('error', i18next.t('flash.authError'));
        return reply.redirect(app.reverse('tasks'));
      }
      
      try {
        await app.objection.models.task.query().deleteById(id);
        req.flash('info', i18next.t('flash.tasks.delete.success'));
      } catch (e) {
        req.flash('error', i18next.t('flash.tasks.delete.error'));
      }
      reply.redirect(app.reverse('tasks'));
      return reply;
    });
};
