import { route } from './utils/router.js';
import { homePage, blogDetailPage, aboutPage } from './components/home/homePage.js';

const router = route();

// Home and static pages
router.add('/', 'GET', homePage, 'html');
router.add('/home', 'GET', homePage, 'html');
router.add('/blog/:blurb', 'GET', blogDetailPage, 'html');
router.add('/about', 'GET', aboutPage, 'html');

export {
  router
};
