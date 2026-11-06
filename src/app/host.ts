/**
 * True on the admin subdomain (admin.mycommuniti.org), where the admin console is served at the
 * root of the domain. Everywhere else (app.mycommuniti.org, localhost, Vercel previews) it lives
 * under /admin of the member app.
 */
export const isAdminHost = typeof window !== 'undefined' && window.location.hostname.startsWith('admin.')
