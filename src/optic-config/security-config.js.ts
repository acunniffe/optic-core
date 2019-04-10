import * as Joi from 'joi';

export const securityWhitelistConfigType = Joi.array()
  .items(Joi.string())
  .default([]);

export const securityConfigType = Joi.array()
  .items(
    Joi.object().keys({
      type: Joi.string().valid('basic', 'bearer').required(),
      unsecuredPaths: securityWhitelistConfigType,
    }),
    Joi.object().keys({
      type: Joi.string().valid('apiKey').required(),
      in: Joi.string().valid('cookie', 'query', 'header').required(),
      name: Joi.string().required().min(1),
      unsecuredPaths: securityWhitelistConfigType,
    }),
  );
