'use strict';

const { OAuth2Client } = require('google-auth-library');

module.exports = {
  async googleToken(ctx) {
    const { id_token, access_token } = ctx.request.body;

    if (!id_token && !access_token) {
      return ctx.badRequest('id_token or access_token is required');
    }

    // Get Google Client ID from Strapi config
    const store = strapi.store({ type: 'plugin', name: 'users-permissions' });
    const grantConfig = await store.get({ key: 'grant' });
    const googleConfig = grantConfig && typeof grantConfig === 'object' && 'google' in grantConfig ? grantConfig.google : null;
    const googleClientIdRaw = (googleConfig && typeof googleConfig === 'object' && 'key' in googleConfig ? googleConfig.key : null) || process.env.GOOGLE_CLIENT_ID;
    const googleClientId = typeof googleClientIdRaw === 'string' ? googleClientIdRaw : String(googleClientIdRaw || '');

    if (!googleClientId) {
      return ctx.internalServerError('Google Client ID is not configured');
    }

    try {
      let email, emailVerified;

      // Validate id_token if provided
      if (id_token) {
        const client = new OAuth2Client(googleClientId);
        const ticket = await client.verifyIdToken({
          idToken: id_token,
          audience: googleClientId,
        });
        const payload = ticket.getPayload();
        email = payload?.email;
        emailVerified = payload?.email_verified;
      } else if (access_token) {
        // Fallback: get user info from access_token
        const axios = require('axios');
        const userInfo = await axios.get('https://www.googleapis.com/oauth2/v2/userinfo', {
          headers: { Authorization: `Bearer ${access_token}` },
        });
        email = userInfo.data?.email;
        emailVerified = userInfo.data?.verified_email;
      }

      if (!email) {
        return ctx.badRequest('Could not get email from Google tokens');
      }

      // Find or create user
      let user = await strapi
        .query('plugin::users-permissions.user')
        .findOne({ where: { email }, populate: ['role'] });

      if (!user) {
        const defaultRole = await strapi
          .query('plugin::users-permissions.role')
          .findOne({ where: { type: 'authenticated' } });

        if (!defaultRole) {
          return ctx.internalServerError('Default role "authenticated" not found');
        }

        const username = email.split('@')[0] + '_' + Date.now().toString().slice(-6);

        user = await strapi.query('plugin::users-permissions.user').create({
          data: {
            username,
            email,
            provider: 'google',
            confirmed: emailVerified !== false,
            blocked: false,
            role: defaultRole.id,
          },
        });

        user.role = defaultRole;
      } else {
        // Update provider if needed
        if (!user.provider) {
          await strapi.query('plugin::users-permissions.user').update({
            where: { id: user.id },
            data: { provider: 'google', confirmed: true },
          });
        }

        // Ensure role is populated
        if (!user.role) {
          user = await strapi
            .query('plugin::users-permissions.user')
            .findOne({ where: { id: user.id }, populate: ['role'] });
        }
      }

      if (user.blocked) {
        return ctx.forbidden('Your account has been blocked');
      }

      // Generate Strapi JWT
      const jwt = strapi
        .plugin('users-permissions')
        .service('jwt')
        .issue({ id: user.id });

      // Sanitize user
      const userSchema = strapi.getModel('plugin::users-permissions.user');
      const sanitizedUser = await strapi.contentAPI.sanitize.output(
        user,
        userSchema,
        { auth: { user } }
      );

      return ctx.send({
        jwt,
        user: sanitizedUser,
      });
    } catch (error) {
      strapi.log.error('Google token auth error:', error);
      return ctx.internalServerError({
        message: 'Failed to authenticate with Google',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined,
      });
    }
  },
};
