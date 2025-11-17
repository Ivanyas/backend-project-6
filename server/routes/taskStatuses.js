// @ts-check

import i18next from 'i18next';
import rollbar from '../lib/logger/logger.js';

export default (app) => {
  app
    .get('/statuses', { name: 'statuses' }, async (req, reply) => {
      const taskStatuses = await app.objection.models.taskStatus.query();
      reply.render('taskStatuses/index', { taskStatuses, currentUser: req.user || null });
      return reply;
    })
    .get('/statuses/new', { name: 'newStatus', preValidation: app.authenticate }, (req, reply) => {
      const taskStatus = new app.objection.models.taskStatus();
      reply.render('taskStatuses/new', { taskStatus });
    })
    .get('/statuses/:id/edit', { name: 'editStatus', preValidation: app.authenticate }, async (req, reply) => {
      const { id } = req.params;
      const taskStatus = await app.objection.models.taskStatus.query().findById(id);
      if (!taskStatus) {
        return reply.notFound();
      }
      reply.render('taskStatuses/edit', { taskStatus });
      return reply;
    })
    .post('/statuses', { preValidation: app.authenticate }, async (req, reply) => {
      const taskStatus = new app.objection.models.taskStatus();
      taskStatus.$set(req.body.data);

      // Manual validation
      const errors = {};
      if (!req.body.data.name || req.body.data.name.trim().length === 0) {
        errors.name = [{ message: i18next.t('flash.validation.name') }];
      }

      if (Object.keys(errors).length > 0) {
        rollbar.warning('Validation errors when creating task status', { errors, userId: req.user?.id });
        req.flash('error', i18next.t('flash.taskStatuses.create.error'));
        reply.render('taskStatuses/new', { taskStatus, errors });
        return reply;
      }

      try {
        await taskStatus.$validate();
        await app.objection.models.taskStatus.query().insert(taskStatus);
        req.flash('info', i18next.t('flash.taskStatuses.create.success'));
        reply.redirect(app.reverse('statuses'));
      } catch (error) {
        rollbar.error('Error creating task status', error, { userId: req.user?.id, data: req.body.data });

        const taskStatusForForm = new app.objection.models.taskStatus();
        taskStatusForForm.$set({
          name: req.body.data.name,
        });

        req.flash('error', i18next.t('flash.taskStatuses.create.error'));
        reply.render('taskStatuses/new', { taskStatus: taskStatusForForm, errors: {} });
      }

      return reply;
    })
    .patch('/statuses/:id', { preValidation: app.authenticate }, async (req, reply) => {
      const { id } = req.params;
      const taskStatus = await app.objection.models.taskStatus.query().findById(id);
      if (!taskStatus) {
        return reply.notFound();
      }

      try {
        taskStatus.$set(req.body.data);
        await taskStatus.$validate();
        await taskStatus.$query().patch(taskStatus);
        req.flash('info', i18next.t('flash.taskStatuses.update.success'));
        reply.redirect(app.reverse('statuses'));
      } catch (error) {
        rollbar.error('Error updating task status', error, { userId: req.user?.id, statusId: id, data: req.body.data });
        taskStatus.$set(req.body.data);

        // Convert validation errors to user-friendly messages
        const errors = {};
        if (error.data) {
          Object.keys(error.data).forEach((key) => {
            const fieldErrors = error.data[key];
            if (fieldErrors && fieldErrors.length > 0) {
              errors[key] = fieldErrors.map((err) => {
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

        req.flash('error', i18next.t('flash.taskStatuses.update.error'));
        reply.render('taskStatuses/edit', { taskStatus, errors });
      }
      return reply;
    })
    .delete('/statuses/:id', { preValidation: app.authenticate }, async (req, reply) => {
      const { id } = req.params;
      const taskStatus = await app.objection.models.taskStatus.query().findById(id);
      if (!taskStatus) {
        return reply.notFound();
      }

      try {
        await app.objection.models.taskStatus.query().deleteById(id);
        req.flash('info', i18next.t('flash.taskStatuses.delete.success'));
      } catch (e) {
        req.flash('error', i18next.t('flash.taskStatuses.delete.error'));
      }
      reply.redirect(app.reverse('statuses'));
      return reply;
    });
};
