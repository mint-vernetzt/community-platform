// TODO: can this type assertion be removed and proofen by code?
export const mailerOptions = {
  host: process.env.MAILER_HOST as string,
  port: parseInt(process.env.MAILER_PORT as string) as number,
  auth: {
    user: process.env.MAILER_USER as string,
    pass: process.env.MAILER_PASS as string,
  },
};
