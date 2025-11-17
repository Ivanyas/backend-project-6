// @ts-check

import i18next from 'i18next';

export default (app) => {
  app
    .get('/tasks', { name: 'tasks' }, async (req, reply) => {
      let query = app.objection.models.task.query();
      
      // Apply filters
      const { status, executor, label, createdByMe } = req.query;
      
      // Filter by status
      if (status) {
        query = query.where('statusId', status);
      }
      
      // Filter by executor
      if (executor) {
        query = query.where('executorId', executor);
      }
      
      // Filter by label
      if (label) {
        query = query.modify((qb) => {
          qb.innerJoin('task_labels', 'tasks.id', 'task_labels.taskId')
            .where('task_labels.labelId', label);
        });
      }
      
      // Filter by creator (only show tasks created by current user)
      if (createdByMe && req.user) {
        query = query.where('creatorId', req.user.id);
      }
      
      const tasks = await query
        .withGraphFetched('[status, creator, executor, labels]')
        .orderBy('created_at', 'desc');
      
      // Get filter options
      const statuses = await app.objection.models.taskStatus.query();
      const users = await app.objection.models.user.query();
      const labels = await app.objection.models.label.query();
      
      reply.render('tasks/index', { 
        tasks, 
        currentUser: req.user || null,
        statuses,
        users,
        labels,
        filters: { status, executor, label, createdByMe: createdByMe === '1' }
      });
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
        const labelIds = data.labelIds || [];
        if (Array.isArray(labelIds) && labelIds.length > 0) {
          const labelIdsArray = labelIds.map(id => parseInt(id, 10)).filter(id => !isNaN(id));
          if (labelIdsArray.length > 0) {
            await savedTask.$relatedQuery('labels').relate(labelIdsArray);
          }
        }
        
        req.flash('success', i18next.t('flash.tasks.create.success'));
        reply.redirect(app.reverse('tasks'));
        return reply;
      } catch (error) {
        console.error('Task creation error:', error);
        console.error('Task data:', { name: data.name, statusId: data.statusId, creatorId: req.user?.id });
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
        return reply;
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

      const data = { ...req.body.data };
      try {
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
        const labelIds = data.labelIds || [];
        if (Array.isArray(labelIds)) {
          // Remove all existing label relationships
          await task.$relatedQuery('labels').unrelate();
          
          // Add new label relationships
          const labelIdsArray = labelIds.map(id => parseInt(id, 10)).filter(id => !isNaN(id));
          if (labelIdsArray.length > 0) {
            await task.$relatedQuery('labels').relate(labelIdsArray);
          }
        }
        
        req.flash('success', i18next.t('flash.tasks.update.success'));
        reply.redirect(app.reverse('tasks'));
      } catch (error) {
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
        req.flash('success', i18next.t('flash.tasks.delete.success'));
      } catch (e) {
        req.flash('error', i18next.t('flash.tasks.delete.error'));
      }
      reply.redirect(app.reverse('tasks'));
      return reply;
    });
};
