// @ts-check

import i18next from 'i18next';

export default (app) => {
  app
    .get('/session/new', { name: 'newSession' }, (req, reply) => {
      const signInForm = {};
      reply.render('session/new', { signInForm });
    })
    .post('/session', { name: 'session' }, app.fp.authenticate('form', async (req, reply, err, user) => {
      if (err) {
        return app.httpErrors.internalServerError(err);
      }
      
      if (!user) {
        // Authentication failed - render form with errors
        const signInForm = req.body.data || {};
        const errors = {
          email: [{ message: i18next.t('flash.session.create.error') }],
        };
        req.flash('error', i18next.t('flash.session.create.error'));
        reply.render('session/new', { signInForm, errors });
        return reply;
      }
      
      // Authentication succeeded - log in the user and redirect
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