// @ts-check

import i18next from 'i18next';
import rollbar from '../lib/logger/logger.js';

export default (app) => {
  app
    .get('/labels', { name: 'labels' }, async (req, reply) => {
      const labels = await app.objection.models.label.query()
        .withGraphFetched('tasks')
        .orderBy('created_at', 'desc');
      reply.render('labels/index', { labels });
      return reply;
    })
    .get('/labels/new', { name: 'newLabel', preValidation: app.authenticate }, async (req, reply) => {
      const label = new app.objection.models.label();
      reply.render('labels/new', { label });
      return reply;
    })
    .get('/labels/:id/edit', { name: 'editLabel', preValidation: app.authenticate }, async (req, reply) => {
      const { id } = req.params;
      const label = await app.objection.models.label.query()
        .withGraphFetched('tasks')
        .findById(id);
      if (!label) {
        return reply.notFound();
      }
      reply.render('labels/edit', { label });
      return reply;
    })
    .post('/labels', { preValidation: app.authenticate }, async (req, reply) => {
      const label = new app.objection.models.label();
      const data = { ...req.body.data };
      label.$set(data);
      
      // Manual validation
      const errors = {};
      if (!data.name || data.name.trim().length === 0) {
        errors.name = [{ message: i18next.t('flash.validation.name') }];
      }

      if (Object.keys(errors).length > 0) {
        rollbar.warning('Validation errors when creating label', { errors, userId: req.user?.id });
        req.flash('error', i18next.t('flash.labels.create.error'));
        reply.render('labels/new', { label, errors });
        return reply;
      }

      try {
        await label.$validate();
        await app.objection.models.label.query().insert(label);
        req.flash('info', i18next.t('flash.labels.create.success'));
        reply.redirect(app.reverse('labels'));
      } catch (error) {
        rollbar.error('Error creating label', error, { userId: req.user?.id, data });
        req.flash('enprror', i18next.t('flash.labels.create.error'));
        const labelForForm = new app.objection.models.label();
        labelForForm.$set(data);
        reply.render('labels/new', { label: labelForForm, errors: {} });
      }

      return reply;
    })
    .patch('/labels/:id', { preValidation: app.authenticate }, async (req, reply) => {
      const { id } = req.params;
      const label = await app.objection.models.label.query().findById(id);
      if (!label) {
        return reply.notFound();
      }

      try {
        const data = { ...req.body.data };
        label.$set(data);
        await label.$validate();
        await label.$query().patch(label);
        req.flash('info', i18next.t('flash.labels.update.success'));
        reply.redirect(app.reverse('labels'));
      } catch (error) {
        rollbar.error('Error updating label', error, { userId: req.user?.id, labelId: id, data: req.body.data });
        const data = { ...req.body.data };
        label.$set(data);
        
        const errors = {};
        if (error.data) {
          Object.keys(error.data).forEach(key => {
            const fieldErrors = error.data[key];
            if (fieldErrors && fieldErrors.length > 0) {
              errors[key] = fieldErrors.map(err => {
                if (err.keyword === 'minLength') {
                  return { message: i18next.t(`flash.validation.${key}Length`) };
                }
                return { message: err.message };
              });
            }
          });
        }

        req.flash('error', i18next.t('flash.labels.update.error'));
        reply.render('labels/edit', { label, errors });
      }
      return reply;
    })
    .delete('/labels/:id', { preValidation: app.authenticate }, async (req, reply) => {
      const { id } = req.params;
      const label = await app.objection.models.label.query()
        .withGraphFetched('tasks')
        .findById(id);
      if (!label) {
        return reply.notFound();
      }
      
      // Check if label is linked to any task
      if (label.tasks && label.tasks.length > 0) {
        req.flash('error', i18next.t('flash.labels.delete.linkedError'));
        reply.redirect(app.reverse('labels'));
        return reply;
      }
      
      try {
        await app.objection.models.label.query().deleteById(id);
        req.flash('info', i18next.t('flash.labels.delete.success'));
      } catch (e) {
        req.flash('error', i18next.t('flash.labels.delete.error'));
      }
      reply.redirect(app.reverse('labels'));
      return reply;
    });
};

