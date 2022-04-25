require("dotenv").config("../../.env");

/// <reference types="cypress" />

/**
 * @type {Cypress.PluginConfig}
 */
module.exports = (_on, config) => {
  config.env.SUPABASE_URL = process.env.SUPABASE_URL;
  config.env.SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;
  config.env.SERVICE_ROLE_KEY = process.env.SERVICE_ROLE_KEY;
  return config;
};
