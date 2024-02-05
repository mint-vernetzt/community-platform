const t = (s) => s;

class RemixI18Next {
  getFixedT = () => t;
}

module.exports = {
  RemixI18Next: RemixI18Next,
  t: t,
  getFixedT: t,
  translate: t,
};
