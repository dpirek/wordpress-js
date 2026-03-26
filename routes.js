import { route } from './utils/router.js';
import { homePage } from './components/page/homePage.js';
import { aboutPage } from './components/page/aboutPage.js';
import { blogDetailPage, blogCommentSubmitPage } from './components/blog/homePage.js';

const router = route();

// Home and static pages
router.add('/', 'GET', homePage, 'html');
router.add('/home', 'GET', homePage, 'html');
router.add('/blog/:blurb', 'GET', blogDetailPage, 'html');
router.add('/blog/:blurb/comments', 'POST', blogCommentSubmitPage, 'html');
router.add('/about', 'GET', aboutPage, 'html');

export {
  router
};
