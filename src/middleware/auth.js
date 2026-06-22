'use strict';

// Requiere que haya una sesión iniciada.
function requireLogin(req, res, next) {
  if (req.session && req.session.usuario) {
    return next();
  }
  return res.redirect('/login');
}

// Requiere que el usuario tenga rol de administrador.
function requireAdmin(req, res, next) {
  if (req.session && req.session.usuario && req.session.usuario.rol === 'admin') {
    return next();
  }
  return res.status(403).render('error', {
    titulo: 'Acceso denegado',
    mensaje: 'Necesitas permisos de administrador para ver esta página.',
    usuario: req.session ? req.session.usuario : null,
  });
}

module.exports = { requireLogin, requireAdmin };
