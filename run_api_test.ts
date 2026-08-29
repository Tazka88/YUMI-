import handler from './api/index.ts';

const req = {
  method: 'GET',
  path: '/product/hoco-j100a-high-ranking-power-bank-20000mah-haute-capacite-charge-rapide',
  query: {},
  headers: {}
};

const res = {
  header: (k, v) => console.log('HEADER', k, v),
  setHeader: (k, v) => console.log('SET_HEADER', k, v),
  status: (code) => {
    console.log('STATUS', code);
    return {
      send: (html) => console.log('HTML Output:', html.includes('<title data-rh="true">') ? 'HAS TITLE' : 'NO TITLE', html.substring(0, 500))
    };
  }
};

handler(req, res, () => {});
