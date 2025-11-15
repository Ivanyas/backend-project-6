// @ts-check

import i18next from 'i18next';

export default (app) => {
  app
    .get('/users', { name: 'users' }, async (req, reply) => {
      const users = await app.objection.models.user.query();
      reply.render('users/index', { users, currentUser: req.user || null });
      return reply;
    })
    .get('/users/new', { name: 'newUser' }, (req, reply) => {
      const user = new app.objection.models.user();
      reply.render('users/new', { user });
    })
    .get('/users/:id/edit', { name: 'editUser', preValidation: app.authenticate }, async (req, reply) => {
      const { id } = req.params;
      const user = await app.objection.models.user.query().findById(id);
      if (!user) {
        return reply.notFound();
      }
      // Only allow users to edit themselves
      if (user.id !== req.user.id) {
        req.flash('error', i18next.t('flash.authError'));
        return reply.redirect(app.reverse('users'));
      }
      reply.render('users/edit', { user });
      return reply;
    })
    .post('/users', async (req, reply) => {
      const user = new app.objection.models.user();
      user.$set(req.body.data);
      
      // Set password explicitly
      if (req.body.data.password) {
        user.password = req.body.data.password;
      }

      // Manual validation
      const errors = {};
      if (!req.body.data.firstName || req.body.data.firstName.trim().length === 0) {
        errors.firstName = [{ message: i18next.t('flash.validation.firstName') }];
      }
      if (!req.body.data.lastName || req.body.data.lastName.trim().length === 0) {
        errors.lastName = [{ message: i18next.t('flash.validation.lastName') }];
      }
      if (!req.body.data.email || req.body.data.email.trim().length === 0) {
        errors.email = [{ message: i18next.t('flash.validation.email') }];
      }
      if (!req.body.data.password || req.body.data.password.length < 3) {
        errors.password = [{ message: i18next.t('flash.validation.passwordLength') }];
      }

      if (Object.keys(errors).length > 0) {
        // Don't set password in user object for security
        const userForForm = new app.objection.models.user();
        userForForm.$set({
          firstName: req.body.data.firstName,
          lastName: req.body.data.lastName,
          email: req.body.data.email
        });
        
        req.flash('error', i18next.t('flash.users.create.error'));
        reply.render('users/new', { user: userForForm, errors });
        return reply;
      }

      try {
        await user.$validate();
        await app.objection.models.user.query().insert(user);
        req.flash('info', i18next.t('flash.users.create.success'));
        reply.redirect(app.reverse('root'));
      } catch (error) {
        // Don't set password in user object for security
        const userForForm = new app.objection.models.user();
        userForForm.$set({
          firstName: req.body.data.firstName,
          lastName: req.body.data.lastName,
          email: req.body.data.email
        });
        
        req.flash('error', i18next.t('flash.users.create.error'));
        reply.render('users/new', { user: userForForm, errors: {} });
      }

      return reply;
    })
    .patch('/users/:id', { preValidation: app.authenticate }, async (req, reply) => {
      const { id } = req.params;
      const user = await app.objection.models.user.query().findById(id);
      if (!user) {
        return reply.notFound();
      }
      // Only allow users to update themselves
      if (user.id !== req.user.id) {
        req.flash('error', i18next.t('flash.authError'));
        return reply.redirect(app.reverse('users'));
      }

      try {
        user.$set(req.body.data);
        await user.$validate();
        await user.$query().patch(user);
        req.flash('info', i18next.t('flash.users.update.success'));
        reply.redirect(app.reverse('users'));
      } catch (error) {
        user.$set(req.body.data);
        
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
        
        req.flash('error', i18next.t('flash.users.update.error'));
        reply.render('users/edit', { user, errors });
      }
      return reply;
    })
    .delete('/users/:id', { preValidation: app.authenticate }, async (req, reply) => {
      const { id } = req.params;
      const user = await app.objection.models.user.query().findById(id);
      if (!user) {
        return reply.notFound();
      }
      // Only allow users to delete themselves
      if (user.id !== req.user.id) {
        req.flash('error', i18next.t('flash.authError'));
        return reply.redirect(app.reverse('users'));
      }
      
      try {
        await app.objection.models.user.query().deleteById(id);
        req.flash('info', i18next.t('flash.users.delete.success'));
      } catch (e) {
        req.flash('error', i18next.t('flash.users.delete.error'));
      }
      reply.redirect(app.reverse('users'));
      return reply;
    });
};