// @ts-check

import i18next from 'i18next';

export default (app) => {
  app
    .get('/session/new', { name: 'newSession' }, (req, reply) => {
      const signInForm = {};
      reply.render('session/new', { signInForm });
    })
    .post('/session', { name: 'session' }, app.fp.authenticate('form', {
      successRedirect: '/',
      failureRedirect: '/session/new',
      successFlash: i18next.t('flash.session.create.success'),
      failureFlash: i18next.t('flash.session.create.error'),
    }, async (req, reply, err, user) => {
      // This callback is only called on failure when failureRedirect is not set
      // or when we want custom failure handling
      if (err) {
        return app.httpErrors.internalServerError(err);
      }
      if (!user) {
        // Custom failure handling - render form with errors
        const signInForm = req.body.data || {};
        const errors = {
          email: [{ message: i18next.t('flash.session.create.error') }],
        };
        req.flash('error', i18next.t('flash.session.create.error'));
        reply.render('session/new', { signInForm, errors });
        return reply;
      }
      // Success case - log in and redirect
      // Note: successRedirect should handle this, but we do it here for safety
      await req.logIn(user);
      req.flash('success', i18next.t('flash.session.create.success'));
      reply.code(302).redirect(app.reverse('root'));
      return reply;
    }))
    .delete('/session', (req, reply) => {
      req.logOut();
      req.flash('info', i18next.t('flash.session.delete.success'));
      reply.redirect(app.reverse('root'));
    });
};