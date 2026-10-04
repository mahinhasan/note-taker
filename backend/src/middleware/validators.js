const { body, param, query } = require('express-validator');
const { ROLES } = require('../models/User');
const { MAX_LIMIT } = require('../utils/pagination');

const onlyFields = (...allowed) =>
  body().custom((value) => {
    if (value === null || typeof value !== 'object' || Array.isArray(value)) {
      throw new Error('Body must be a JSON object');
    }
    const unknown = Object.keys(value).filter((key) => !allowed.includes(key));
    if (unknown.length) {
      throw new Error(`Unknown or forbidden fields: ${unknown.join(', ')}`);
    }
    return true;
  });

const atLeastOne = (...fields) =>
  body().custom((value) => {
    if (!fields.some((field) => value && value[field] !== undefined)) {
      throw new Error(`Provide at least one of: ${fields.join(', ')}`);
    }
    return true;
  });

const name = (optional = false) => {
  const chain = body('name');
  return (optional ? chain.optional() : chain)
    .isString().withMessage('name must be a string')
    .trim()
    .isLength({ min: 1, max: 100 }).withMessage('name must be 1-100 characters');
};

const email = (optional = false) => {
  const chain = body('email');
  return (optional ? chain.optional() : chain)
    .isString().withMessage('email must be a string')
    .trim()
    .toLowerCase()
    .isEmail().withMessage('email must be a valid email address')
    .isLength({ max: 254 }).withMessage('email is too long');
};

const password = (field = 'password', optional = false) => {
  const chain = body(field);
  return (optional ? chain.optional() : chain)
    .isString().withMessage(`${field} must be a string`)
    .isLength({ min: 8 }).withMessage(`${field} must be at least 8 characters`)
    .custom((value) => Buffer.byteLength(value, 'utf8') <= 72)
    .withMessage(`${field} must be at most 72 bytes`);
};

const interests = () => [
  body('interests')
    .optional()
    .isArray({ max: 50 }).withMessage('interests must be an array of at most 50 items'),
  body('interests.*')
    .isString().withMessage('each interest must be a string')
    .trim()
    .toLowerCase()
    .isLength({ min: 1, max: 50 }).withMessage('each interest must be 1-50 characters'),
  body('interests').optional().customSanitizer((list) => [...new Set(list)]),
];

const role = (optional = true) => {
  const chain = body('role');
  return (optional ? chain.optional() : chain)
    .isIn(ROLES).withMessage(`role must be one of: ${ROLES.join(', ')}`);
};

const idParam = (field = 'id') =>
  param(field).isMongoId().withMessage(`${field} must be a valid id`);

const objectIdQuery = (field) =>
  query(field).optional().isMongoId().withMessage(`${field} must be a valid id`);

const limitQuery = () =>
  query('limit')
    .optional()
    .isInt({ min: 1 }).withMessage('limit must be a positive integer')
    .toInt()
    .customSanitizer((value) => Math.min(value, MAX_LIMIT));

const pagination = () => [limitQuery(), objectIdQuery('after')];

const auth = {
  register: [onlyFields('name', 'email', 'password', 'interests'), name(), email(), password(), ...interests()],
  login: [
    onlyFields('email', 'password'),
    body('email').isString().trim().toLowerCase().notEmpty().withMessage('email is required'),
    body('password').isString().notEmpty().withMessage('password is required'),
  ],
};

const users = {
  updateMe: [
    onlyFields('name', 'email', 'interests', 'password', 'currentPassword'),
    atLeastOne('name', 'email', 'interests', 'password'),
    name(true),
    email(true),
    password('password', true),
    body('currentPassword')
      .if(body('password').exists())
      .isString().withMessage('currentPassword is required to change password')
      .notEmpty().withMessage('currentPassword is required to change password'),
    ...interests(),
  ],
  create: [
    onlyFields('name', 'email', 'password', 'role', 'interests'),
    name(),
    email(),
    password(),
    role(),
    ...interests(),
  ],
  update: [
    idParam(),
    onlyFields('name', 'email', 'password', 'role', 'interests'),
    atLeastOne('name', 'email', 'password', 'role', 'interests'),
    name(true),
    email(true),
    password('password', true),
    role(),
    ...interests(),
  ],
  list: pagination(),
  byId: [idParam()],
  groupedByInterests: [
    limitQuery(),
    query('interest')
      .optional()
      .isString().trim().toLowerCase()
      .isLength({ min: 1, max: 50 }).withMessage('interest must be 1-50 characters'),
    query('after')
      .optional()
      .isString().trim().toLowerCase()
      .isLength({ min: 1, max: 50 }).withMessage('after must be an interest name'),
  ],
  posts: [idParam(), ...pagination()],
};

const notes = {
  list: [...pagination(), objectIdQuery('owner')],
  create: [
    onlyFields('title', 'content'),
    body('title').isString().withMessage('title must be a string').trim()
      .isLength({ min: 1, max: 200 }).withMessage('title must be 1-200 characters'),
    body('content').optional().isString().withMessage('content must be a string')
      .isLength({ max: 20000 }).withMessage('content must be at most 20000 characters'),
  ],
  update: [
    idParam(),
    onlyFields('title', 'content'),
    atLeastOne('title', 'content'),
    body('title').optional().isString().withMessage('title must be a string').trim()
      .isLength({ min: 1, max: 200 }).withMessage('title must be 1-200 characters'),
    body('content').optional().isString().withMessage('content must be a string')
      .isLength({ max: 20000 }).withMessage('content must be at most 20000 characters'),
  ],
  byId: [idParam()],
};

const posts = {
  list: [...pagination(), objectIdQuery('author')],
  create: [
    onlyFields('title', 'body'),
    body('title').isString().withMessage('title must be a string').trim()
      .isLength({ min: 1, max: 200 }).withMessage('title must be 1-200 characters'),
    body('body').isString().withMessage('body must be a string').trim()
      .isLength({ min: 1, max: 20000 }).withMessage('body must be 1-20000 characters'),
  ],
  update: [
    idParam(),
    onlyFields('title', 'body'),
    atLeastOne('title', 'body'),
    body('title').optional().isString().withMessage('title must be a string').trim()
      .isLength({ min: 1, max: 200 }).withMessage('title must be 1-200 characters'),
    body('body').optional().isString().withMessage('body must be a string').trim()
      .isLength({ min: 1, max: 20000 }).withMessage('body must be 1-20000 characters'),
  ],
  byId: [idParam()],
};

module.exports = { auth, users, notes, posts };
