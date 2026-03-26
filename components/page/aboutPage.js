import { page, navList, footerLinks } from '../shared.js';

async function aboutPage({ authUser }) {
  return page({
    authUser,
    navList,
    footerLinks,
    title: 'about',
    content: `
      <h1 class="hr">About us</h1>
    `
  });
}

export { aboutPage };
